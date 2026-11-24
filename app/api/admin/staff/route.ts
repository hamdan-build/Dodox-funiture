import { z } from "zod";
import { requirePermission } from "@/lib/server/auth/rbac";
import {
  handleApiError,
  jsonCreated,
  jsonOk,
  parseJsonBody,
} from "@/lib/server/http";
import {
  createAdminStaffAccount,
  listAdminStaffAndAudit,
  updateAdminStaffAccount,
} from "@/lib/server/services/staff.service";

const createStaffSchema = z.object({
  email: z.string().trim().email().max(160),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  phone: z.string().max(40).optional().nullable(),
  password: z.string().min(12).max(128),
  roleSlug: z.string().min(2).max(60),
});

const patchStaffSchema = z.object({
  userId: z.string().min(1),
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  isActive: z.boolean().optional(),
  roleSlug: z.string().min(2).max(60).optional(),
  newPassword: z.string().min(12).max(128).optional(),
});

export async function GET(request: Request) {
  try {
    await requirePermission("staff.manage", request);
    const data = await listAdminStaffAndAudit();
    return jsonOk(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requirePermission("staff.manage", request);
    const body = await parseJsonBody(request, createStaffSchema);
    const created = await createAdminStaffAccount({
      ...body,
      actorUserId: admin.id,
      actorEmail: admin.email,
      actorRoles: admin.roles,
    });
    return jsonCreated(created);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requirePermission("staff.manage", request);
    const body = await parseJsonBody(request, patchStaffSchema);
    const updated = await updateAdminStaffAccount({
      ...body,
      actorUserId: admin.id,
      actorEmail: admin.email,
      actorRoles: admin.roles,
    });
    return jsonOk(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
