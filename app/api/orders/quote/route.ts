import { z } from "zod";
import {
  getHashedClientIp,
  handleApiError,
  jsonOk,
  parseJsonBody,
} from "@/lib/server/http";
import { enforceRateLimit } from "@/lib/server/security/rate-limit";
import {
  calculateAuthoritativeOrderQuote,
  validateCouponOnServer,
} from "@/lib/server/services/pricing.service";

const quoteSchema = z.object({
  mode: z.enum(["coupon", "full"]).default("full"),
  code: z.string().trim().optional(),
  subtotal: z.number().int().min(0).optional(),
  lines: z
    .array(
      z.object({
        slug: z.string().trim().min(1),
        quantity: z.number().int().min(1).max(50),
        selections: z
          .array(
            z.object({
              groupId: z.string(),
              optionId: z.string(),
            }),
          )
          .default([]),
      }),
    )
    .optional(),
  promoCode: z.string().trim().nullable().optional(),
  careProtection: z.boolean().default(false),
});

export async function POST(request: Request) {
  try {
    const ipHash = await getHashedClientIp(request);
    await enforceRateLimit({
      namespace: "pricing_quote",
      identifier: ipHash,
      limit: 40,
      windowSeconds: 300,
    });

    const body = await parseJsonBody(request, quoteSchema);

    if (body.mode === "coupon") {
      const coupon = await validateCouponOnServer({
        code: body.code ?? "",
        subtotal: body.subtotal ?? 0,
      });
      return jsonOk({ coupon });
    }

    const quote = await calculateAuthoritativeOrderQuote({
      lines: body.lines ?? [],
      promoCode: body.promoCode ?? null,
      careProtection: body.careProtection,
    });
    return jsonOk({ quote });
  } catch (error) {
    return handleApiError(error);
  }
}
