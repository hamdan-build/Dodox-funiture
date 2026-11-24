import { z } from "zod";
import {
  getHashedClientIp,
  handleApiError,
  jsonCreated,
  parseJsonBody,
} from "@/lib/server/http";
import { enforceRateLimit } from "@/lib/server/security/rate-limit";
import { verifyTurnstileIfConfigured } from "@/lib/server/security/turnstile";
import { submitContactMessage } from "@/lib/server/services/enquiry.service";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(32).optional().or(z.literal("")),
  subject: z.string().trim().min(1).max(160),
  message: z.string().trim().min(10).max(4000),
  turnstileToken: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const ipHash = await getHashedClientIp(request);
    await enforceRateLimit({
      namespace: "contact_form",
      identifier: ipHash,
      limit: 8,
      windowSeconds: 900,
    });

    const body = await parseJsonBody(request, schema);
    await verifyTurnstileIfConfigured(request, body.turnstileToken);

    const result = await submitContactMessage({
      ...body,
      ipHash,
    });
    return jsonCreated(result);
  } catch (error) {
    return handleApiError(error);
  }
}
