import { z } from "zod";
import { bootstrapFirstSuperAdmin } from "@/lib/server/auth/bootstrap";
import { attachSessionCookie } from "@/lib/server/auth/session";
import {
  getHashedClientIp,
  handleApiError,
  jsonCreated,
  parseJsonBody,
} from "@/lib/server/http";
import { verifyCsrfRequest } from "@/lib/server/security/csrf";
import { enforceRateLimit } from "@/lib/server/security/rate-limit";

const bootstrapBodySchema = z.object({
  bootstrapToken: z.string().trim().min(1, "Bootstrap token is required."),
  firstName: z.string().trim().min(2, "Enter your first name.").max(80),
  lastName: z.string().trim().min(2, "Enter your last name.").max(80),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(12, "Password must be at least 12 characters."),
});

export async function POST(request: Request) {
  try {
    verifyCsrfRequest(request);
    const ipHash = await getHashedClientIp(request);
    await enforceRateLimit({
      namespace: "admin_bootstrap",
      identifier: ipHash,
      limit: 8,
      windowSeconds: 900,
    });

    const body = await parseJsonBody(request, bootstrapBodySchema);
    const result = await bootstrapFirstSuperAdmin({
      ...body,
      request,
    });

    const response = jsonCreated({
      userId: result.userId,
      email: result.email,
    });
    await attachSessionCookie(response, result.rawSessionToken, request);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
