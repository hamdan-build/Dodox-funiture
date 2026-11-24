import { count } from "drizzle-orm";
import { hashPassword } from "@/lib/server/auth/password";
import { createAdminSession } from "@/lib/server/auth/session";
import { getDb } from "@/lib/server/db/client";
import { userRoles, users } from "@/lib/server/db/schema";
import { ensureSeeded } from "@/lib/server/db/seed";
import { getRuntimeEnv } from "@/lib/server/env";
import { ForbiddenError, ValidationError } from "@/lib/server/errors";
import {
  generateId,
  nowIso,
  timingSafeEqualStrings,
} from "@/lib/server/ids";
import { recordActivityLog } from "@/lib/server/services/audit.service";

export async function isBootstrapAvailable(): Promise<boolean> {
  const db = await getDb();
  const rows = await db.select({ value: count() }).from(users);
  return (rows[0]?.value ?? 0) === 0;
}

export async function bootstrapFirstSuperAdmin(input: {
  bootstrapToken: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  request?: Request;
}): Promise<{
  userId: string;
  email: string;
  rawSessionToken: string;
  expiresAt: string;
}> {
  const db = await getDb();
  await ensureSeeded(db);

  const available = await isBootstrapAvailable();
  if (!available) {
    throw new ForbiddenError(
      "Initial administrator bootstrap is permanently disabled because a staff account already exists.",
    );
  }

  const env = await getRuntimeEnv();
  const configuredToken = env.ADMIN_BOOTSTRAP_TOKEN?.trim() ?? "";

  if (configuredToken.length < 16) {
    throw new ForbiddenError(
      "ADMIN_BOOTSTRAP_TOKEN is not configured on the server (must be at least 16 characters). Configure it in .env.local or Cloudflare secrets before bootstrapping.",
    );
  }

  if (!timingSafeEqualStrings(input.bootstrapToken.trim(), configuredToken)) {
    throw new ForbiddenError("Invalid administrator bootstrap token.");
  }

  const normalizedEmail = input.email.trim().toLowerCase();
  if (!normalizedEmail.includes("@")) {
    throw new ValidationError("Enter a valid administrator email address.");
  }

  const { passwordHash, passwordSalt } = await hashPassword(input.password);
  const now = nowIso();
  const userId = generateId("usr");

  await db.insert(users).values({
    id: userId,
    email: normalizedEmail,
    passwordHash,
    passwordSalt,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    phone: null,
    avatarUrl: null,
    isActive: true,
    mustChangePassword: false,
    lastLoginAt: now,
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(userRoles).values({
    userId,
    roleId: "role_super_admin",
    assignedByUserId: userId,
    assignedAt: now,
  });

  const session = await createAdminSession(userId, input.request);

  await recordActivityLog({
    actorUserId: userId,
    actorEmail: normalizedEmail,
    action: "staff.bootstrap_super_admin",
    resourceType: "user",
    resourceId: userId,
    summary: `Initial Super Admin account bootstrapped for ${normalizedEmail}`,
    request: input.request,
  });

  return {
    userId,
    email: normalizedEmail,
    rawSessionToken: session.rawToken,
    expiresAt: session.expiresAt,
  };
}
