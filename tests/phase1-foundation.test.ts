import { count } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getDb } from "@/lib/server/db/client";
import * as schema from "@/lib/server/db/schema";
import { ensureSeeded } from "@/lib/server/db/seed";
import { RateLimitError } from "@/lib/server/errors";
import { ROLE_DEFINITIONS, PERMISSIONS } from "@/lib/server/permissions/definitions";
import { enforceRateLimit } from "@/lib/server/security/rate-limit";
import { detectImageMimeFromBytes } from "@/lib/server/security/sanitize";
import { installTestCloudflareEnv } from "./helpers/sqlite-d1";

describe("Phase 1 — Foundation, D1 Migrations, Seed & Security Primitives", () => {
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    const handle = installTestCloudflareEnv();
    cleanup = handle.close;
  });

  afterEach(() => {
    cleanup?.();
  });

  it("applies all 54 relational tables and seeds full DODOX catalogue idempotently without default users", async () => {
    const db = await getDb();
    await ensureSeeded(db);
    // Calling ensureSeeded a second time must be idempotent
    await ensureSeeded(db);

    const [
      usersCount,
      rolesCount,
      permsCount,
      catsCount,
      prodsCount,
      couponsCount,
      journalCount,
      settingsCount,
    ] = await Promise.all([
      db.select({ v: count() }).from(schema.users),
      db.select({ v: count() }).from(schema.roles),
      db.select({ v: count() }).from(schema.permissions),
      db.select({ v: count() }).from(schema.categories),
      db.select({ v: count() }).from(schema.products),
      db.select({ v: count() }).from(schema.coupons),
      db.select({ v: count() }).from(schema.journalPosts),
      db.select({ v: count() }).from(schema.siteSettings),
    ]);

    expect(usersCount[0]?.v).toBe(0); // Never seed default admin credentials!
    expect(rolesCount[0]?.v).toBe(ROLE_DEFINITIONS.length);
    expect(permsCount[0]?.v).toBe(PERMISSIONS.length);
    expect(catsCount[0]?.v).toBe(5);
    expect(prodsCount[0]?.v).toBe(20);
    expect(couponsCount[0]?.v).toBe(2);
    expect(journalCount[0]?.v).toBe(4);
    expect(settingsCount[0]?.v).toBeGreaterThanOrEqual(12);
  });

  it("enforces D1-backed stateless rate limiting", async () => {
    for (let i = 0; i < 3; i += 1) {
      await enforceRateLimit({
        namespace: "test_login",
        identifier: "client-1",
        limit: 3,
        windowSeconds: 60,
      });
    }

    await expect(
      enforceRateLimit({
        namespace: "test_login",
        identifier: "client-1",
        limit: 3,
        windowSeconds: 60,
      }),
    ).rejects.toBeInstanceOf(RateLimitError);
  });

  it("validates image magic bytes rather than trusting browser MIME headers", () => {
    const jpegHeader = new Uint8Array([
      0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 0x01,
    ]);
    const fakeScript = new TextEncoder().encode("<script>alert(1)</script>");

    expect(detectImageMimeFromBytes(jpegHeader)).toBe("image/jpeg");
    expect(detectImageMimeFromBytes(fakeScript)).toBeNull();
  });
});
