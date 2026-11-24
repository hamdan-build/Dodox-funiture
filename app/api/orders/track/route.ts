import { z } from "zod";
import { NotFoundError } from "@/lib/server/errors";
import {
  getHashedClientIp,
  handleApiError,
  jsonOk,
  parseJsonBody,
} from "@/lib/server/http";
import { enforceRateLimit } from "@/lib/server/security/rate-limit";
import { lookupOrderForCustomer } from "@/lib/server/services/order.service";

const trackSchema = z.object({
  reference: z.string().trim().min(4).max(40),
  contact: z.string().trim().max(160).optional(),
  trackingToken: z.string().trim().max(128).optional(),
});

export async function POST(request: Request) {
  try {
    const ipHash = await getHashedClientIp(request);
    await enforceRateLimit({
      namespace: "track_order",
      identifier: ipHash,
      limit: 12,
      windowSeconds: 300,
      message: "Too many lookup attempts. Please wait a few minutes before trying again.",
    });

    const body = await parseJsonBody(request, trackSchema);
    const order = await lookupOrderForCustomer({
      reference: body.reference,
      contact: body.contact,
      trackingToken: body.trackingToken,
    });

    if (!order) {
      throw new NotFoundError(
        "No matching order request found for that reference and contact detail.",
      );
    }

    return jsonOk({ order });
  } catch (error) {
    return handleApiError(error);
  }
}
