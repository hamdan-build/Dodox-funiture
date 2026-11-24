import { and, count, desc, eq, gte, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import {
  hashPassword,
  verifyPassword,
} from "@/lib/server/auth/password";
import { getDb } from "@/lib/server/db/client";
import {
  loginAttempts,
  passwordResetTokens,
  permissions,
  rolePermissions,
  roles,
  sessions,
  userRoles,
  users,
} from "@/lib/server/db/schema";
import { ensureSeeded } from "@/lib/server/db/seed";
import { getRuntimeEnv } from "@/lib/server/env";
import {
  RateLimitError,
  UnauthorizedError,
  ValidationError,
} from "@/lib/server/errors";
import { getHashedClientIp, getUserAgent } from "@/lib/server/http";
import {
  generateId,
  generateSecureToken,
  nowIso,
  sha256Hex,
} from "@/lib/server/ids";
import type {
  PermissionKey,
  RoleSlug,
} from "@/lib/server/permissions/definitions";
import { recordActivityLog } from "@/lib/server/services/audit.service";

export const ADMIN_SESSION_COOKIE = "dodox_admin_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_FAILED_LOGINS = 6;
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

export interface AuthenticatedAdmin {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatarUrl: string | null;
  mustChangePassword: boolean;
  roles: RoleSlug[];
  roleNames: string[];
  permissions: PermissionKey[];
  sessionId: string;
}

function parseCookieHeader(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const pairs = cookieHeader.split(";");
  for (const pair of pairs) {
    const idx = pair.indexOf("=");
    if (idx === -1) continue;
    const key = pair.slice(0, idx).trim();
    if (key === name) {
      return decodeURIComponent(pair.slice(idx + 1).trim());
    }
  }
  return null;
}

export async function extractSessionToken(
  request?: Request,
): Promise<string | null> {
  if (request) {
    const fromReq = parseCookieHeader(
      request.headers.get("cookie"),
      ADMIN_SESSION_COOKIE,
    );
    if (fromReq) return fromReq;
  }
  try {
    const jar = await cookies();
    return jar.get(ADMIN_SESSION_COOKIE)?.value ?? null;
  } catch {
    return null;
  }
}

export async function attachSessionCookie(
  response: NextResponse,
  rawToken: string,
  request?: Request,
): Promise<void> {
  const env = await getRuntimeEnv();
  const isHttps = request ? request.url.startsWith("https://") : false;
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: rawToken,
    httpOnly: true,
    sameSite: "lax",
    secure: env.APP_ENV === "production" || isHttps,
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function loadUserAccessProfile(userId: string): Promise<{
  roles: RoleSlug[];
  roleNames: string[];
  permissions: PermissionKey[];
}> {
  const db = await getDb();
  const assignedRoles = await db
    .select({
      roleId: roles.id,
      slug: roles.slug,
      name: roles.name,
    })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId));

  const roleSlugs = assignedRoles.map((r) => r.slug as RoleSlug);
  const roleNames = assignedRoles.map((r) => r.name);

  if (assignedRoles.length === 0) {
    return { roles: [], roleNames: [], permissions: [] };
  }

  const permSet = new Set<PermissionKey>();
  for (const r of assignedRoles) {
    const rows = await db
      .select({ key: permissions.key })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, r.roleId));
    for (const row of rows) {
      permSet.add(row.key as PermissionKey);
    }
  }

  return {
    roles: roleSlugs,
    roleNames,
    permissions: Array.from(permSet),
  };
}

export async function createAdminSession(
  userId: string,
  request?: Request,
): Promise<{ rawToken: string; expiresAt: string; sessionId: string }> {
  const db = await getDb();
  const rawToken = generateSecureToken(32);
  const tokenHash = await sha256Hex(rawToken);
  const now = nowIso();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  const sessionId = generateId("ses");

  const ipHash = request ? await getHashedClientIp(request) : null;
  const userAgent = request ? getUserAgent(request) : null;

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    tokenHash,
    ipHash,
    userAgent,
    expiresAt,
    lastSeenAt: now,
    revokedAt: null,
    createdAt: now,
  });

  await db
    .update(users)
    .set({ lastLoginAt: now, updatedAt: now })
    .where(eq(users.id, userId));

  return { rawToken, expiresAt, sessionId };
}

export async function getAuthenticatedAdmin(
  request?: Request,
): Promise<AuthenticatedAdmin | null> {
  const rawToken = await extractSessionToken(request);
  if (!rawToken) return null;

  const db = await getDb();
  const tokenHash = await sha256Hex(rawToken);
  const now = nowIso();

  const row = await db
    .select({
      session: sessions,
      user: users,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.tokenHash, tokenHash), isNull(sessions.revokedAt)))
    .limit(1);

  const match = row[0];
  if (!match) return null;
  if (match.session.expiresAt <= now || !match.user.isActive) {
    return null;
  }

  const access = await loadUserAccessProfile(match.user.id);

  // Rolling lastSeenAt update if older than 5 minutes
  if (
    Date.now() - new Date(match.session.lastSeenAt).getTime() >
    5 * 60 * 1000
  ) {
    await db
      .update(sessions)
      .set({ lastSeenAt: now })
      .where(eq(sessions.id, match.session.id))
      .catch(() => undefined);
  }

  return {
    id: match.user.id,
    email: match.user.email,
    firstName: match.user.firstName,
    lastName: match.user.lastName,
    phone: match.user.phone,
    avatarUrl: match.user.avatarUrl,
    mustChangePassword: match.user.mustChangePassword,
    roles: access.roles,
    roleNames: access.roleNames,
    permissions: access.permissions,
    sessionId: match.session.id,
  };
}

export async function authenticateAdminLogin(input: {
  email: string;
  password: string;
  request: Request;
}): Promise<{
  admin: AuthenticatedAdmin;
  rawToken: string;
  expiresAt: string;
}> {
  const db = await getDb();
  await ensureSeeded(db);

  const normalizedEmail = input.email.trim().toLowerCase();
  const ipHash = await getHashedClientIp(input.request);
  const windowStart = new Date(Date.now() - LOGIN_WINDOW_MS).toISOString();

  // Brute-force lockout check on both email and IP hash
  const [recentEmailFails, recentIpFails] = await Promise.all([
    db
      .select({ value: count() })
      .from(loginAttempts)
      .where(
        and(
          eq(loginAttempts.email, normalizedEmail),
          eq(loginAttempts.succeeded, false),
          gte(loginAttempts.createdAt, windowStart),
        ),
      ),
    db
      .select({ value: count() })
      .from(loginAttempts)
      .where(
        and(
          eq(loginAttempts.ipHash, ipHash),
          eq(loginAttempts.succeeded, false),
          gte(loginAttempts.createdAt, windowStart),
        ),
      ),
  ]);

  if (
    (recentEmailFails[0]?.value ?? 0) >= MAX_FAILED_LOGINS ||
    (recentIpFails[0]?.value ?? 0) >= MAX_FAILED_LOGINS * 2
  ) {
    throw new RateLimitError(
      "Too many unsuccessful sign-in attempts. Please wait 15 minutes before trying again.",
      900,
    );
  }

  const userRows = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);
  const user = userRows[0];

  if (!user || !user.isActive) {
    await db.insert(loginAttempts).values({
      id: generateId("lga"),
      email: normalizedEmail,
      ipHash,
      succeeded: false,
      reason: !user ? "unknown_email" : "account_inactive",
      createdAt: nowIso(),
    });
    throw new UnauthorizedError("Invalid email address or password.");
  }

  const passwordValid = await verifyPassword(
    input.password,
    user.passwordHash,
    user.passwordSalt,
  );

  if (!passwordValid) {
    await db.insert(loginAttempts).values({
      id: generateId("lga"),
      email: normalizedEmail,
      ipHash,
      succeeded: false,
      reason: "invalid_password",
      createdAt: nowIso(),
    });
    throw new UnauthorizedError("Invalid email address or password.");
  }

  await db.insert(loginAttempts).values({
    id: generateId("lga"),
    email: normalizedEmail,
    ipHash,
    succeeded: true,
    reason: null,
    createdAt: nowIso(),
  });

  const session = await createAdminSession(user.id, input.request);
  const access = await loadUserAccessProfile(user.id);

  await recordActivityLog({
    actorUserId: user.id,
    actorEmail: user.email,
    action: "auth.login",
    resourceType: "user",
    resourceId: user.id,
    summary: `Staff member ${user.email} signed in`,
    request: input.request,
  });

  return {
    admin: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      mustChangePassword: user.mustChangePassword,
      roles: access.roles,
      roleNames: access.roleNames,
      permissions: access.permissions,
      sessionId: session.sessionId,
    },
    rawToken: session.rawToken,
    expiresAt: session.expiresAt,
  };
}

export async function revokeCurrentSession(request?: Request): Promise<void> {
  const rawToken = await extractSessionToken(request);
  if (!rawToken) return;
  const db = await getDb();
  const tokenHash = await sha256Hex(rawToken);
  await db
    .update(sessions)
    .set({ revokedAt: nowIso() })
    .where(eq(sessions.tokenHash, tokenHash));
}

export async function createPasswordResetRequest(input: {
  email: string;
  request: Request;
}): Promise<{ rawToken: string; userEmail: string; firstName: string } | null> {
  const db = await getDb();
  const normalizedEmail = input.email.trim().toLowerCase();
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  const user = rows[0];
  if (!user || !user.isActive) {
    return null;
  }

  const rawToken = generateSecureToken(32);
  const tokenHash = await sha256Hex(rawToken);
  const now = nowIso();
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();

  await db.insert(passwordResetTokens).values({
    id: generateId("prt"),
    userId: user.id,
    tokenHash,
    expiresAt,
    usedAt: null,
    createdAt: now,
  });

  await recordActivityLog({
    actorUserId: user.id,
    actorEmail: user.email,
    action: "auth.password_reset_requested",
    resourceType: "user",
    resourceId: user.id,
    summary: `Password reset requested for ${user.email}`,
    request: input.request,
  });

  return {
    rawToken,
    userEmail: user.email,
    firstName: user.firstName,
  };
}

export async function completePasswordReset(input: {
  token: string;
  newPassword: string;
  request: Request;
}): Promise<void> {
  const db = await getDb();
  const tokenHash = await sha256Hex(input.token.trim());
  const now = nowIso();

  const rows = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        isNull(passwordResetTokens.usedAt),
      ),
    )
    .orderBy(desc(passwordResetTokens.createdAt))
    .limit(1);

  const record = rows[0];
  if (!record || record.expiresAt <= now) {
    throw new ValidationError(
      "This password reset link is invalid or has expired. Please request a new link.",
    );
  }

  const { passwordHash, passwordSalt } = await hashPassword(input.newPassword);

  await db
    .update(users)
    .set({
      passwordHash,
      passwordSalt,
      mustChangePassword: false,
      updatedAt: now,
    })
    .where(eq(users.id, record.userId));

  await db
    .update(passwordResetTokens)
    .set({ usedAt: now })
    .where(eq(passwordResetTokens.id, record.id));

  // Revoke all existing sessions for security
  await db
    .update(sessions)
    .set({ revokedAt: now })
    .where(and(eq(sessions.userId, record.userId), isNull(sessions.revokedAt)));

  await recordActivityLog({
    actorUserId: record.userId,
    action: "auth.password_reset_completed",
    resourceType: "user",
    resourceId: record.userId,
    summary: "Staff password reset completed and active sessions revoked",
    request: input.request,
  });
}
