import { z } from "zod";
import { requirePermission } from "@/lib/server/auth/rbac";
import { handleApiError, jsonOk, parseJsonBody } from "@/lib/server/http";
import { recordActivityLog } from "@/lib/server/services/audit.service";
import {
  addAdminOrderInternalNote,
  getAdminOrderDetail,
  ORDER_STATUSES,
  updateAdminOrderStatus,
} from "@/lib/server/services/order.service";

const statusPatchSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: z.string().trim().max(1000).optional(),
  isCustomerVisible: z.boolean().default(true),
  notifyCustomer: z.boolean().default(true),
});

const notePostSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requirePermission("orders.read", request);
    const { id } = await context.params;
    const detail = await getAdminOrderDetail(id);
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
    const admin = await requirePermission("orders.update", request);
    const { id } = await context.params;
    const body = await parseJsonBody(request, statusPatchSchema);

    const before = await getAdminOrderDetail(id);
    const updated = await updateAdminOrderStatus({
      orderId: id,
      nextStatus: body.status,
      note: body.note,
      isCustomerVisible: body.isCustomerVisible,
      notifyCustomer: body.notifyCustomer,
      actor: {
        id: admin.id,
        name: `${admin.firstName} ${admin.lastName}`,
        email: admin.email,
      },
    });

    await recordActivityLog({
      actorUserId: admin.id,
      actorEmail: admin.email,
      action: "order.status_change",
      resourceType: "order",
      resourceId: id,
      summary: `Updated order ${updated.order.reference} from ${before.order.status} to ${body.status}`,
      before: { status: before.order.status },
      after: { status: body.status, note: body.note },
      request,
    });

    return jsonOk(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requirePermission("orders.update", request);
    const { id } = await context.params;
    const body = await parseJsonBody(request, notePostSchema);

    const updated = await addAdminOrderInternalNote({
      orderId: id,
      body: body.body,
      actor: {
        id: admin.id,
        name: `${admin.firstName} ${admin.lastName}`,
      },
    });

    await recordActivityLog({
      actorUserId: admin.id,
      actorEmail: admin.email,
      action: "order.add_note",
      resourceType: "order",
      resourceId: id,
      summary: `Added internal note on ${updated.order.reference}`,
      request,
    });

    return jsonOk(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
