import { z } from "zod";
import { requirePermission } from "@/lib/server/auth/rbac";
import { handleApiError, jsonOk, parseJsonBody } from "@/lib/server/http";
import {
  listAdminContactMessages,
  updateAdminContactMessage,
} from "@/lib/server/services/enquiry.service";

const patchSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["new", "open", "replied", "archived"]).optional(),
  isRead: z.boolean().optional(),
  internalNotes: z.string().max(3000).optional().nullable(),
});

export async function GET(request: Request) {
  try {
    await requirePermission("enquiries.manage", request);
    const url = new URL(request.url);
    const items = await listAdminContactMessages({
      status: url.searchParams.get("status") ?? undefined,
      query: url.searchParams.get("q") ?? undefined,
    });
    return jsonOk({ items });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requirePermission("enquiries.manage", request);
    const body = await parseJsonBody(request, patchSchema);
    const result = await updateAdminContactMessage({
      ...body,
      actorUserId: admin.id,
      actorEmail: admin.email,
    });
    return jsonOk(result);
  } catch (error) {
    return handleApiError(error);
  }
}
