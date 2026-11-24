import { z } from "zod";
import { createPasswordResetRequest } from "@/lib/server/auth/session";
import { dispatchEmailSafe } from "@/lib/server/email/dispatcher";
import { buildPasswordResetEmail } from "@/lib/server/email/templates";
import { getRuntimeEnv } from "@/lib/server/env";
import {
  getHashedClientIp,
  handleApiError,
  jsonOk,
  parseJsonBody,
} from "@/lib/server/http";
import { verifyCsrfRequest } from "@/lib/server/security/csrf";
import { enforceRateLimit } from "@/lib/server/security/rate-limit";

const forgotSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

export async function POST(request: Request) {
  try {
    verifyCsrfRequest(request);
    const ipHash = await getHashedClientIp(request);
    await enforceRateLimit({
      namespace: "admin_forgot_pw",
      identifier: ipHash,
      limit: 5,
      windowSeconds: 900,
    });

    const body = await parseJsonBody(request, forgotSchema);
    const resetInfo = await createPasswordResetRequest({
      email: body.email,
      request,
    });

    if (resetInfo) {
      const env = await getRuntimeEnv();
      const resetUrl = `${env.SITE_URL}/admin/reset-password?token=${encodeURIComponent(resetInfo.rawToken)}`;
      const template = buildPasswordResetEmail({
        firstName: resetInfo.firstName,
        resetUrl,
      });
      await dispatchEmailSafe({
        to: resetInfo.userEmail,
        ...template,
      });
    }

    // Identical response regardless of whether account exists to prevent email enumeration
    return jsonOk({
      sent: true,
      message:
        "If an active staff account exists for that email address, a password reset link has been sent.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
