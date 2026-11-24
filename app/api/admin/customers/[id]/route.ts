import { z } from "zod";
import { requirePermission } from "@/lib/server/auth/rbac";
import { handleApiError, jsonOk, parseJsonBody } from "@/lib/server/http";
import {
  addAdminCustomerNote,
  getAdminCustomerDetail,
  updateAdminCustomer,
} from "@/lib/server/services/customer.service";

const patchCustomerSchema = z.object({
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().min(1).max(80).optional(),
  phone: z.string().min(5).max(40).optional(),
  city: z.string().max(100).optional().nullable(),
  district: z.string().max(100).optional().nullable(),
  acceptsMarketing: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

const noteSchema = z.object({
  note: z.string().min(2).max(2000),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requirePermission("customers.read", request);
    const { id } = await context.params;
    const detail = await getAdminCustomerDetail(id);
    return jsonOk(detail);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requirePermission("customers.update", request);
    const { id } = await context.params;
    const body = await parseJsonBody(request, patchCustomerSchema);
    const detail = await updateAdminCustomer({
      customerId: id,
      ...body,
      actorUserId: admin.id,
      actorEmail: admin.email,
    });
    return jsonOk(detail);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requirePermission("customers.update", request);
    const { id } = await context.params;
    const body = await parseJsonBody(request, noteSchema);
    const detail = await addAdminCustomerNote({
      customerId: id,
      note: body.note,
      authorUserId: admin.id,
    });
    return jsonOk(detail);
  } catch (error) {
    return handleApiError(error);
  }
}
