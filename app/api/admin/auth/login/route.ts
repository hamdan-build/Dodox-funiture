import { z } from "zod";
import {
  attachSessionCookie,
  authenticateAdminLogin,
} from "@/lib/server/auth/session";
import {
  getHashedClientIp,
  handleApiError,
  jsonOk,
  parseJsonBody,
} from "@/lib/server/http";
import { verifyCsrfRequest } from "@/lib/server/security/csrf";
import { enforceRateLimit } from "@/lib/server/security/rate-limit";

const loginSchema = z.object({
  email: z.string().trim().email("Enter your staff email address."),
  password: z.string().min(1, "Enter your password."),
});

export async function POST(request: Request) {
  try {
    verifyCsrfRequest(request);
    const ipHash = await getHashedClientIp(request);
    await enforceRateLimit({
      namespace: "admin_login",
      identifier: ipHash,
      limit: 12,
      windowSeconds: 300,
      message: "Too many sign-in attempts. Please wait a few minutes.",
    });

    const body = await parseJsonBody(request, loginSchema);
    const result = await authenticateAdminLogin({
      email: body.email,
      password: body.password,
      request,
    });

    const response = jsonOk({ admin: result.admin });
    await attachSessionCookie(response, result.rawToken, request);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
