import { z } from "zod";
import { requirePermission } from "@/lib/server/auth/rbac";
import { handleApiError, jsonOk, parseJsonBody } from "@/lib/server/http";
import {
  listAdminAtelierEnquiries,
  updateAdminAtelierEnquiry,
} from "@/lib/server/services/enquiry.service";

const patchSchema = z.object({
  id: z.string().min(1),
  status: z
    .enum([
      "new",
      "reviewing",
      "quotation_prepared",
      "awaiting_customer",
      "accepted",
      "completed",
      "archived",
    ])
    .optional(),
  quotedAmount: z.number().min(0).optional().nullable(),
  internalNotes: z.string().max(3000).optional().nullable(),
  isArchived: z.boolean().optional(),
});

export async function GET(request: Request) {
  try {
    await requirePermission("enquiries.manage", request);
    const url = new URL(request.url);
    const items = await listAdminAtelierEnquiries({
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
    const result = await updateAdminAtelierEnquiry({
      ...body,
      actorUserId: admin.id,
      actorEmail: admin.email,
    });
    return jsonOk(result);
  } catch (error) {
    return handleApiError(error);
  }
}
