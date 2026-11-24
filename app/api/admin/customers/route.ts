import { requirePermission } from "@/lib/server/auth/rbac";
import { handleApiError, jsonOk } from "@/lib/server/http";
import { listAdminCustomers } from "@/lib/server/services/customer.service";

export async function GET(request: Request) {
  try {
    await requirePermission("customers.read", request);
    const url = new URL(request.url);
    const data = await listAdminCustomers({
      query: url.searchParams.get("q") ?? undefined,
      filter: url.searchParams.get("filter") ?? undefined,
      page: Number(url.searchParams.get("page") ?? "1") || 1,
      pageSize: Number(url.searchParams.get("pageSize") ?? "25") || 25,
    });
    return jsonOk(data);
  } catch (error) {
    return handleApiError(error);
  }
}
