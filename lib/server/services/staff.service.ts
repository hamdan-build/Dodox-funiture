import { desc, eq, isNull } from "drizzle-orm";
import { hashPassword } from "@/lib/server/auth/password";
import { getDb } from "@/lib/server/db/client";
import { ensureSeeded } from "@/lib/server/db/seed";
import {
  activityLogs,
  loginAttempts,
  rolePermissions,
  roles,
  sessions,
  userRoles,
  users,
} from "@/lib/server/db/schema";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/server/errors";
import { generateId, nowIso } from "@/lib/server/ids";
import {
  normalizeEmail,
  sanitizeText,
} from "@/lib/server/security/sanitize";
import { recordActivityLog } from "@/lib/server/services/audit.service";

export async function listAdminStaffAndAudit(params?: { auditLimit?: number }) {
  const db = await getDb();
  await ensureSeeded(db);

  const [
    userRows,
    roleRows,
    urRows,
    rpRows,
    activeSessionRows,
    auditRows,
    loginRows,
  ] = await Promise.all([
    db.select().from(users).orderBy(users.createdAt),
    db.select().from(roles).orderBy(roles.name),
    db.select().from(userRoles),
    db.select().from(rolePermissions),
    db.select().from(sessions).where(isNull(sessions.revokedAt)),
    db
      .select()
      .from(activityLogs)
      .orderBy(desc(activityLogs.createdAt))
      .limit(Math.min(200, params?.auditLimit ?? 80)),
    db
      .select()
      .from(loginAttempts)
      .orderBy(desc(loginAttempts.createdAt))
      .limit(40),
  ]);

  const roleById = new Map(roleRows.map((r) => [r.id, r]));
  const permCountByRole = new Map<string, number>();
  for (const rp of rpRows) {
    permCountByRole.set(rp.roleId, (permCountByRole.get(rp.roleId) ?? 0) + 1);
  }

  const activeNowIso = nowIso();
  const sessionCountByUser = new Map<string, number>();
  for (const s of activeSessionRows) {
    if (s.expiresAt > activeNowIso) {
      sessionCountByUser.set(
        s.userId,
        (sessionCountByUser.get(s.userId) ?? 0) + 1,
      );
    }
  }

  const staff = userRows.map((u) => {
    const assigned = urRows
      .filter((ur) => ur.userId === u.id)
      .map((ur) => roleById.get(ur.roleId))
      .filter(Boolean);

    return {
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      phone: u.phone,
      isActive: u.isActive,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
      activeSessions: sessionCountByUser.get(u.id) ?? 0,
      roles: assigned.map((r) => ({
        id: r!.id,
        slug: r!.slug,
        name: r!.name,
      })),
    };
  });

  return {
    staff,
    roles: roleRows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      description: r.description,
      permissionCount: permCountByRole.get(r.id) ?? 0,
    })),
    auditLogs: auditRows,
    loginAttempts: loginRows,
  };
}

export async function createAdminStaffAccount(params: {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  password: string;
  roleSlug: string;
  actorUserId?: string | null;
  actorEmail?: string | null;
  actorRoles?: string[];
}) {
  const db = await getDb();
  await ensureSeeded(db);

  if (
    params.roleSlug === "super_admin" &&
    !params.actorRoles?.includes("super_admin")
  ) {
    throw new ForbiddenError(
      "Only an existing Super Admin can grant the Super Admin role.",
    );
  }

  const email = normalizeEmail(params.email);
  if (!email || !email.includes("@")) {
    throw new ValidationError("Valid staff email is required.");
  }

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing[0]) {
    throw new ConflictError(`Staff account ${email} already exists.`);
  }

  const roleRows = await db
    .select()
    .from(roles)
    .where(eq(roles.slug, params.roleSlug))
    .limit(1);
  const role = roleRows[0];
  if (!role) {
    throw new ValidationError(`Unknown role "${params.roleSlug}".`);
  }

  const { passwordHash, passwordSalt } = await hashPassword(params.password);
  const id = generateId("usr");
  const now = nowIso();

  let validActorId: string | null = null;
  if (params.actorUserId) {
    const a = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, params.actorUserId))
      .limit(1);
    validActorId = a[0]?.id ?? null;
  }

  await db.insert(users).values({
    id,
    email,
    passwordHash,
    passwordSalt,
    firstName: sanitizeText(params.firstName, 80),
    lastName: sanitizeText(params.lastName, 80),
    phone: params.phone ? sanitizeText(params.phone, 40) : null,
    isActive: true,
    mustChangePassword: false,
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(userRoles).values({
    userId: id,
    roleId: role.id,
    assignedByUserId: validActorId,
    assignedAt: now,
  });

  await recordActivityLog({
    actorUserId: validActorId,
    actorEmail: params.actorEmail ?? null,
    action: "staff.create",
    resourceType: "user",
    resourceId: id,
    summary: `Created staff account ${email} with role ${role.name}`,
  });

  return { id, email, role: role.slug };
}

export async function updateAdminStaffAccount(params: {
  userId: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  roleSlug?: string;
  newPassword?: string;
  actorUserId?: string | null;
  actorEmail?: string | null;
  actorRoles?: string[];
}) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.id, params.userId))
    .limit(1);
  const target = rows[0];
  if (!target) {
    throw new NotFoundError("Staff account not found.");
  }

  const superRoleRows = await db
    .select()
    .from(roles)
    .where(eq(roles.slug, "super_admin"))
    .limit(1);
  const superRole = superRoleRows[0];

  // Check if target is currently a super_admin
  const targetRoles = await db
    .select()
    .from(userRoles)
    .where(eq(userRoles.userId, target.id));
  const isTargetSuper =
    superRole && targetRoles.some((tr) => tr.roleId === superRole.id);

  if (
    (isTargetSuper || params.roleSlug === "super_admin") &&
    !params.actorRoles?.includes("super_admin")
  ) {
    throw new ForbiddenError(
      "Only a Super Admin can modify Super Admin accounts or assign Super Admin.",
    );
  }

  // Prevent locking out the last active Super Admin
  const wouldLoseSuper =
    isTargetSuper &&
    (params.isActive === false ||
      (params.roleSlug !== undefined && params.roleSlug !== "super_admin"));

  if (wouldLoseSuper && superRole) {
    const allSuperLinks = await db
      .select({ userId: userRoles.userId, isActive: users.isActive })
      .from(userRoles)
      .innerJoin(users, eq(userRoles.userId, users.id))
      .where(eq(userRoles.roleId, superRole.id));
    const activeSuperCount = allSuperLinks.filter((l) => l.isActive).length;
    if (activeSuperCount <= 1) {
      throw new ValidationError(
        "Cannot deactivate or demote the last active Super Admin account.",
      );
    }
  }

  const now = nowIso();
  const updatePayload: Partial<typeof users.$inferInsert> = {
    firstName: params.firstName
      ? sanitizeText(params.firstName, 80)
      : target.firstName,
    lastName: params.lastName
      ? sanitizeText(params.lastName, 80)
      : target.lastName,
    isActive: params.isActive !== undefined ? params.isActive : target.isActive,
    updatedAt: now,
  };

  if (params.newPassword) {
    const hashed = await hashPassword(params.newPassword);
    updatePayload.passwordHash = hashed.passwordHash;
    updatePayload.passwordSalt = hashed.passwordSalt;
  }

  await db.update(users).set(updatePayload).where(eq(users.id, target.id));

  if (params.roleSlug) {
    const nextRoleRows = await db
      .select()
      .from(roles)
      .where(eq(roles.slug, params.roleSlug))
      .limit(1);
    if (!nextRoleRows[0]) {
      throw new ValidationError(`Unknown role "${params.roleSlug}".`);
    }
    await db.delete(userRoles).where(eq(userRoles.userId, target.id));
    await db.insert(userRoles).values({
      userId: target.id,
      roleId: nextRoleRows[0].id,
      assignedByUserId: null,
      assignedAt: now,
    });
  }

  // Revoke active sessions immediately on deactivation or password rotation
  if (params.isActive === false || params.newPassword) {
    await db
      .update(sessions)
      .set({ revokedAt: now })
      .where(eq(sessions.userId, target.id));
  }

  await recordActivityLog({
    actorUserId: params.actorUserId ?? null,
    actorEmail: params.actorEmail ?? null,
    action: "staff.update",
    resourceType: "user",
    resourceId: target.id,
    summary: `Updated staff account ${target.email}`,
  });

  return { id: target.id, isActive: updatePayload.isActive };
}
