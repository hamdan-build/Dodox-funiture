import {
  type AuthenticatedAdmin,
  getAuthenticatedAdmin,
} from "@/lib/server/auth/session";
import { ForbiddenError, UnauthorizedError } from "@/lib/server/errors";
import type { PermissionKey } from "@/lib/server/permissions/definitions";
import { verifyCsrfRequest } from "@/lib/server/security/csrf";

export function adminHasPermission(
  admin: AuthenticatedAdmin,
  permission: PermissionKey,
): boolean {
  if (admin.roles.includes("super_admin")) {
    return true;
  }
  return admin.permissions.includes(permission);
}

export async function requireAdmin(
  request?: Request,
): Promise<AuthenticatedAdmin> {
  if (request) {
    verifyCsrfRequest(request);
  }
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) {
    throw new UnauthorizedError("Please sign in to access the DODOX admin portal.");
  }
  return admin;
}

export async function requirePermission(
  permission: PermissionKey,
  request?: Request,
): Promise<AuthenticatedAdmin> {
  const admin = await requireAdmin(request);
  if (!adminHasPermission(admin, permission)) {
    throw new ForbiddenError(
      `Missing required permission: ${permission}`,
    );
  }
  return admin;
}
