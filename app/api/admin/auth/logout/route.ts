import {
  clearSessionCookie,
  getAuthenticatedAdmin,
  revokeCurrentSession,
} from "@/lib/server/auth/session";
import { handleApiError, jsonOk } from "@/lib/server/http";
import { verifyCsrfRequest } from "@/lib/server/security/csrf";
import { recordActivityLog } from "@/lib/server/services/audit.service";

export async function POST(request: Request) {
  try {
    verifyCsrfRequest(request);
    const admin = await getAuthenticatedAdmin(request);
    await revokeCurrentSession(request);

    if (admin) {
      await recordActivityLog({
        actorUserId: admin.id,
        actorEmail: admin.email,
        action: "auth.logout",
        resourceType: "user",
        resourceId: admin.id,
        summary: `Staff member ${admin.email} signed out`,
        request,
      });
    }

    const response = jsonOk({ signedOut: true });
    clearSessionCookie(response);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
