import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { bootstrapFirstSuperAdmin, isBootstrapAvailable } from "@/lib/server/auth/bootstrap";
import { hashPassword, verifyPassword } from "@/lib/server/auth/password";
import { requirePermission } from "@/lib/server/auth/rbac";
import {
  ADMIN_SESSION_COOKIE,
  authenticateAdminLogin,
  completePasswordReset,
  createAdminSession,
  createPasswordResetRequest,
  getAuthenticatedAdmin,
} from "@/lib/server/auth/session";
import { getDb } from "@/lib/server/db/client";
import { userRoles, users } from "@/lib/server/db/schema";
import {
  ForbiddenError,
  RateLimitError,
  UnauthorizedError,
  ValidationError,
} from "@/lib/server/errors";
import { generateId, nowIso } from "@/lib/server/ids";
import { installTestCloudflareEnv } from "./helpers/sqlite-d1";

function makeRequest(
  path = "/api/admin/test",
  options?: {
    method?: string;
    cookieToken?: string;
    origin?: string;
    ip?: string;
  },
) {
  const headers = new Headers({
    host: "localhost:3000",
    origin: options?.origin ?? "http://localhost:3000",
    "cf-connecting-ip": options?.ip ?? "197.243.0.10",
    "user-agent": "Vitest",
  });
  if (options?.cookieToken) {
    headers.set("cookie", `${ADMIN_SESSION_COOKIE}=${options.cookieToken}`);
  }
  return new Request(`http://localhost:3000${path}`, {
    method: options?.method ?? "POST",
    headers,
  });
}

describe("Phase 2 — Authentication, Sessions, Bootstrap & RBAC", () => {
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    const handle = installTestCloudflareEnv();
    cleanup = handle.close;
  });

  afterEach(() => {
    cleanup?.();
  });

  it("enforces password strength and verifies PBKDF2-SHA256 hashes", async () => {
    await expect(hashPassword("short")).rejects.toBeInstanceOf(ValidationError);
    await expect(hashPassword("alllowercase123!")).rejects.toBeInstanceOf(
      ValidationError,
    );

    const { passwordHash, passwordSalt } = await hashPassword(
      "KigaliAtelier#2026!",
    );
    expect(passwordHash.startsWith("pbkdf2_sha256$100000$")).toBe(true);
    expect(
      await verifyPassword("KigaliAtelier#2026!", passwordHash, passwordSalt),
    ).toBe(true);
    expect(
      await verifyPassword("WrongPassword#2026!", passwordHash, passwordSalt),
    ).toBe(false);
  });

  it("secures first-admin bootstrap with token check and permanently locks afterwards", async () => {
    expect(await isBootstrapAvailable()).toBe(true);

    await expect(
      bootstrapFirstSuperAdmin({
        bootstrapToken: "wrong-token-value-1234567890",
        firstName: "Aline",
        lastName: "Mukamana",
        email: "director@dodox.rw",
        password: "KigaliAtelier#2026!",
        request: makeRequest("/api/admin/auth/bootstrap"),
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    const created = await bootstrapFirstSuperAdmin({
      bootstrapToken: "test-bootstrap-token-minimum-24-chars",
      firstName: "Aline",
      lastName: "Mukamana",
      email: "director@dodox.rw",
      password: "KigaliAtelier#2026!",
      request: makeRequest("/api/admin/auth/bootstrap"),
    });

    expect(created.email).toBe("director@dodox.rw");
    expect(await isBootstrapAvailable()).toBe(false);

    // Second attempt must fail even with valid token
    await expect(
      bootstrapFirstSuperAdmin({
        bootstrapToken: "test-bootstrap-token-minimum-24-chars",
        firstName: "Attacker",
        lastName: "User",
        email: "attacker@example.com",
        password: "KigaliAtelier#2026!",
        request: makeRequest("/api/admin/auth/bootstrap"),
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("authenticates login, blocks brute-force attempts, and revokes sessions on password reset", async () => {
    await bootstrapFirstSuperAdmin({
      bootstrapToken: "test-bootstrap-token-minimum-24-chars",
      firstName: "Eric",
      lastName: "Kamanzi",
      email: "admin@dodox.rw",
      password: "KigaliAtelier#2026!",
    });

    const loginRes = await authenticateAdminLogin({
      email: "admin@dodox.rw",
      password: "KigaliAtelier#2026!",
      request: makeRequest("/api/admin/auth/login"),
    });
    expect(loginRes.admin.roles).toContain("super_admin");

    // Password reset revokes existing session
    const resetReq = await createPasswordResetRequest({
      email: "admin@dodox.rw",
      request: makeRequest("/api/admin/auth/forgot-password"),
    });
    expect(resetReq).not.toBeNull();

    await completePasswordReset({
      token: resetReq!.rawToken,
      newPassword: "NewStrongPassword#2026",
      request: makeRequest("/api/admin/auth/reset-password"),
    });

    const oldSessionAdmin = await getAuthenticatedAdmin(
      makeRequest("/api/admin/dashboard", {
        method: "GET",
        cookieToken: loginRes.rawToken,
      }),
    );
    expect(oldSessionAdmin).toBeNull();

    // Brute-force lockout after 6 bad attempts
    for (let i = 0; i < 6; i += 1) {
      await expect(
        authenticateAdminLogin({
          email: "admin@dodox.rw",
          password: "BadPassword123!",
          request: makeRequest("/api/admin/auth/login", { ip: `10.0.0.${i}` }),
        }),
      ).rejects.toBeInstanceOf(UnauthorizedError);
    }

    await expect(
      authenticateAdminLogin({
        email: "admin@dodox.rw",
        password: "NewStrongPassword#2026",
        request: makeRequest("/api/admin/auth/login", { ip: "10.0.0.99" }),
      }),
    ).rejects.toBeInstanceOf(RateLimitError);
  });

  it("enforces granular RBAC permissions and CSRF origin verification on the server", async () => {
    await bootstrapFirstSuperAdmin({
      bootstrapToken: "test-bootstrap-token-minimum-24-chars",
      firstName: "Super",
      lastName: "Admin",
      email: "super@dodox.rw",
      password: "KigaliAtelier#2026!",
    });

    // Create a Content Editor staff account
    const db = await getDb();
    const editorId = generateId("usr");
    const { passwordHash, passwordSalt } = await hashPassword(
      "EditorPassword#2026!",
    );
    const now = nowIso();
    await db.insert(users).values({
      id: editorId,
      email: "editor@dodox.rw",
      passwordHash,
      passwordSalt,
      firstName: "Diane",
      lastName: "Uwase",
      isActive: true,
      mustChangePassword: false,
      createdAt: now,
      updatedAt: now,
    });
    await db.insert(userRoles).values({
      userId: editorId,
      roleId: "role_content_editor",
      assignedAt: now,
    });

    const editorSession = await createAdminSession(editorId);

    // Editor has content.manage
    const verifiedEditor = await requirePermission(
      "content.manage",
      makeRequest("/api/admin/content", {
        cookieToken: editorSession.rawToken,
      }),
    );
    expect(verifiedEditor.email).toBe("editor@dodox.rw");

    // Editor MUST NOT have staff.manage or orders.update
    await expect(
      requirePermission(
        "staff.manage",
        makeRequest("/api/admin/staff", {
          cookieToken: editorSession.rawToken,
        }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);

    // Cross-origin CSRF attack must be rejected even with valid session cookie
    await expect(
      requirePermission(
        "content.manage",
        makeRequest("/api/admin/content", {
          cookieToken: editorSession.rawToken,
          origin: "https://evil-attacker.example",
        }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);

    // Deactivated staff member immediately loses access
    await db
      .update(users)
      .set({ isActive: false })
      .where(eq(users.id, editorId));

    await expect(
      requirePermission(
        "content.manage",
        makeRequest("/api/admin/content", {
          cookieToken: editorSession.rawToken,
        }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
