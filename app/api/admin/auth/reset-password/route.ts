import { z } from "zod";
import { completePasswordReset } from "@/lib/server/auth/session";
import {
  getHashedClientIp,
  handleApiError,
  jsonOk,
  parseJsonBody,
} from "@/lib/server/http";
import { verifyCsrfRequest } from "@/lib/server/security/csrf";
import { enforceRateLimit } from "@/lib/server/security/rate-limit";

const resetSchema = z.object({
  token: z.string().trim().min(16, "Reset token is missing or invalid."),
  newPassword: z
    .string()
    .min(12, "New password must be at least 12 characters."),
});

export async function POST(request: Request) {
  try {
    verifyCsrfRequest(request);
    const ipHash = await getHashedClientIp(request);
    await enforceRateLimit({
      namespace: "admin_reset_pw",
      identifier: ipHash,
      limit: 8,
      windowSeconds: 900,
    });

    const body = await parseJsonBody(request, resetSchema);
    await completePasswordReset({
      token: body.token,
      newPassword: body.newPassword,
      request,
    });

    return jsonOk({ reset: true });
  } catch (error) {
    return handleApiError(error);
  }
}
