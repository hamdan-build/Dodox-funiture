import { z } from "zod";
import {
  getHashedClientIp,
  handleApiError,
  jsonCreated,
  parseJsonBody,
} from "@/lib/server/http";
import { enforceRateLimit } from "@/lib/server/security/rate-limit";
import { verifyTurnstileIfConfigured } from "@/lib/server/security/turnstile";
import { createOrderRequest } from "@/lib/server/services/order.service";

const createOrderSchema = z.object({
  customer: z.object({
    firstName: z.string().trim().min(2).max(80),
    lastName: z.string().trim().min(2).max(80),
    email: z.string().trim().email().max(160),
    phone: z.string().trim().min(8).max(40),
    city: z.string().trim().min(2).max(80),
    district: z.string().trim().min(2).max(120),
    address: z.string().trim().min(4).max(240),
    landmark: z.string().trim().max(180).optional().or(z.literal("")),
    deliveryMethod: z.enum(["kigali-white-glove", "regional-courier"]),
    notes: z.string().trim().max(1000).optional().or(z.literal("")),
  }),
  lines: z
    .array(
      z.object({
        slug: z.string().trim().min(1),
        quantity: z.number().int().min(1).max(50),
        selections: z
          .array(
            z.object({
              groupId: z.string().trim().min(1),
              optionId: z.string().trim().min(1),
            }),
          )
          .default([]),
      }),
    )
    .min(1, "Add at least one piece before submitting an order request."),
  promoCode: z.string().trim().max(40).nullable().optional(),
  careProtection: z.boolean().default(false),
  consent: z.literal(true),
  turnstileToken: z.string().optional(),
  honeypot: z.string().max(0).optional(),
});

export async function POST(request: Request) {
  try {
    const ipHash = await getHashedClientIp(request);
    await enforceRateLimit({
      namespace: "checkout_submit",
      identifier: ipHash,
      limit: 8,
      windowSeconds: 600,
      message:
        "Too many order requests from this connection. Please wait a few minutes or contact our Kigali concierge.",
    });

    const body = await parseJsonBody(request, createOrderSchema);

    await verifyTurnstileIfConfigured(request, body.turnstileToken);

    const order = await createOrderRequest({
      customer: {
        firstName: body.customer.firstName,
        lastName: body.customer.lastName,
        email: body.customer.email,
        phone: body.customer.phone,
        city: body.customer.city,
        district: body.customer.district,
        address: body.customer.address,
        landmark: body.customer.landmark || undefined,
        deliveryMethod: body.customer.deliveryMethod,
        notes: body.customer.notes || undefined,
      },
      lines: body.lines,
      promoCode: body.promoCode ?? null,
      careProtection: body.careProtection,
      ipHash,
    });

    return jsonCreated({ order });
  } catch (error) {
    return handleApiError(error);
  }
}
