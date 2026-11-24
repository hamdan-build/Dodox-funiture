import { requireAdmin } from "@/lib/server/auth/rbac";
import { handleApiError, jsonOk } from "@/lib/server/http";
import { globalAdminSearch } from "@/lib/server/services/dashboard.service";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const url = new URL(request.url);
    const q = url.searchParams.get("q") ?? "";
    const results = await globalAdminSearch(q);
    return jsonOk(results);
  } catch (error) {
    return handleApiError(error);
  }
}
