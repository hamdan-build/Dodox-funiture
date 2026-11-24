import { z } from "zod";
import {
  getHashedClientIp,
  handleApiError,
  jsonCreated,
  parseJsonBody,
} from "@/lib/server/http";
import { enforceRateLimit } from "@/lib/server/security/rate-limit";
import { verifyTurnstileIfConfigured } from "@/lib/server/security/turnstile";
import { subscribeNewsletter } from "@/lib/server/services/enquiry.service";

const schema = z.object({
  email: z.string().trim().email().max(160),
  source: z.string().max(60).optional(),
  turnstileToken: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const ipHash = await getHashedClientIp(request);
    await enforceRateLimit({
      namespace: "newsletter_subscribe",
      identifier: ipHash,
      limit: 8,
      windowSeconds: 900,
    });

    const body = await parseJsonBody(request, schema);
    await verifyTurnstileIfConfigured(request, body.turnstileToken);

    const result = await subscribeNewsletter({
      email: body.email,
      source: body.source ?? "storefront",
      ipHash,
    });
    return jsonCreated(result);
  } catch (error) {
    return handleApiError(error);
  }
}
