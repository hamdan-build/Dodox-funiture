import { requireAdmin } from "@/lib/server/auth/rbac";
import { handleApiError, jsonOk } from "@/lib/server/http";
import { getDashboardOverview } from "@/lib/server/services/dashboard.service";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const data = await getDashboardOverview();
    return jsonOk(data);
  } catch (error) {
    return handleApiError(error);
  }
}
