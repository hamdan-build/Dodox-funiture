import { requirePermission } from "@/lib/server/auth/rbac";
import { handleApiError, jsonOk } from "@/lib/server/http";
import { getAdminAnalyticsReport } from "@/lib/server/services/reports.service";

export async function GET(request: Request) {
  try {
    await requirePermission("reports.read", request);
    const url = new URL(request.url);
    const days = Number(url.searchParams.get("days") ?? "90") || 90;
    const report = await getAdminAnalyticsReport({ days });
    return jsonOk(report);
  } catch (error) {
    return handleApiError(error);
  }
}
