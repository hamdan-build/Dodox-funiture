import { drizzle } from "drizzle-orm/d1";
import { count } from "drizzle-orm";
import { getPlatformProxy } from "wrangler";
import { hashPassword } from "../lib/server/auth/password";
import * as schema from "../lib/server/db/schema";
import { ensureSeeded } from "../lib/server/db/seed";
import { generateId, nowIso } from "../lib/server/ids";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const firstName = process.env.ADMIN_FIRST_NAME?.trim() || "Atelier";
  const lastName = process.env.ADMIN_LAST_NAME?.trim() || "Director";

  if (!email || !password) {
    console.error(
      "Usage: ADMIN_EMAIL=you@domain.com ADMIN_PASSWORD='StrongPassword123!' npm run db:bootstrap-admin",
    );
    process.exit(1);
  }

  const proxy = await getPlatformProxy<CloudflareEnv>({
    remoteBindings: false,
  });

  try {
    const db = drizzle(proxy.env.DB, { schema });
    await ensureSeeded(db);

    const existing = await db.select({ v: count() }).from(schema.users);
    if ((existing[0]?.v ?? 0) > 0) {
      console.error(
        "Bootstrap refused: at least one staff account already exists in D1.",
      );
      process.exit(1);
    }

    const { passwordHash, passwordSalt } = await hashPassword(password);
    const now = nowIso();
    const userId = generateId("usr");

    await db.insert(schema.users).values({
      id: userId,
      email,
      passwordHash,
      passwordSalt,
      firstName,
      lastName,
      phone: null,
      avatarUrl: null,
      isActive: true,
      mustChangePassword: false,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(schema.userRoles).values({
      userId,
      roleId: "role_super_admin",
      assignedByUserId: userId,
      assignedAt: now,
    });

    console.log(`Initial Super Admin created in local D1: ${email}`);
  } finally {
    await proxy.dispose();
  }
}

main().catch((err) => {
  console.error("Bootstrap error:", err);
  process.exit(1);
});
