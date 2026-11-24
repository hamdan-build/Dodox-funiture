import { requirePermission } from "@/lib/server/auth/rbac";
import { handleApiError, jsonOk } from "@/lib/server/http";
import { listAdminOrders } from "@/lib/server/services/order.service";

export async function GET(request: Request) {
  try {
    await requirePermission("orders.read", request);
    const url = new URL(request.url);
    const orders = await listAdminOrders({
      status: url.searchParams.get("status") ?? undefined,
      query: url.searchParams.get("q") ?? undefined,
      from: url.searchParams.get("from") ?? undefined,
      to: url.searchParams.get("to") ?? undefined,
    });
    return jsonOk({ orders });
  } catch (error) {
    return handleApiError(error);
  }
}
