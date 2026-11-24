import { isBootstrapAvailable } from "@/lib/server/auth/bootstrap";
import { getAuthenticatedAdmin } from "@/lib/server/auth/session";
import { handleApiError, jsonOk } from "@/lib/server/http";

export async function GET(request: Request) {
  try {
    const [admin, bootstrapAvailable] = await Promise.all([
      getAuthenticatedAdmin(request),
      isBootstrapAvailable(),
    ]);
    return jsonOk({ admin, bootstrapAvailable });
  } catch (error) {
    return handleApiError(error);
  }
}
