import { z } from "zod";
import {
  getHashedClientIp,
  handleApiError,
  jsonCreated,
  parseJsonBody,
} from "@/lib/server/http";
import { enforceRateLimit } from "@/lib/server/security/rate-limit";
import { verifyTurnstileIfConfigured } from "@/lib/server/security/turnstile";
import { submitAtelierEnquiry } from "@/lib/server/services/enquiry.service";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().min(7).max(32),
  furnitureType: z.string().trim().min(1).max(120),
  dimensions: z.string().trim().min(2).max(160),
  materials: z.string().trim().min(1).max(120),
  finish: z.string().trim().min(1).max(120),
  budget: z.string().trim().min(1).max(120),
  description: z.string().trim().min(20).max(3000),
  contactPreference: z.enum(["email", "phone", "whatsapp"]),
  referenceImages: z.array(z.string().max(400)).max(4).optional(),
  turnstileToken: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const ipHash = await getHashedClientIp(request);
    await enforceRateLimit({
      namespace: "atelier_enquiry",
      identifier: ipHash,
      limit: 6,
      windowSeconds: 900,
    });

    const body = await parseJsonBody(request, schema);
    await verifyTurnstileIfConfigured(request, body.turnstileToken);

    const result = await submitAtelierEnquiry({
      ...body,
      ipHash,
    });

    return jsonCreated(result);
  } catch (error) {
    return handleApiError(error);
  }
}
