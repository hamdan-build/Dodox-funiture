import { z } from "zod";
import { requirePermission } from "@/lib/server/auth/rbac";
import { handleApiError, jsonOk, parseJsonBody } from "@/lib/server/http";
import {
  deleteCoupon,
  deletePromotion,
  listAdminCouponsAndPromotions,
  upsertCoupon,
  upsertPromotion,
} from "@/lib/server/services/promotion.service";

const upsertSchema = z.discriminatedUnion("entity", [
  z.object({
    entity: z.literal("coupon"),
    id: z.string().optional(),
    code: z.string().min(3).max(40),
    label: z.string().min(2).max(120),
    description: z.string().max(400).optional(),
    discountType: z.enum(["fixed", "percent"]),
    value: z.number().positive(),
    minimumSubtotal: z.number().min(0).optional(),
    maximumDiscount: z.number().min(0).optional().nullable(),
    startsAt: z.string().optional().nullable(),
    expiresAt: z.string().optional().nullable(),
    usageLimit: z.number().int().min(0).optional().nullable(),
    perCustomerLimit: z.number().int().min(0).optional().nullable(),
    isActive: z.boolean().optional(),
    isDemo: z.boolean().optional(),
  }),
  z.object({
    entity: z.literal("promotion"),
    id: z.string().optional(),
    name: z.string().min(2).max(140),
    description: z.string().max(400).optional(),
    campaignType: z.string().max(60).optional(),
    discountType: z.enum(["fixed", "percent"]).optional(),
    value: z.number().min(0).optional(),
    minimumSubtotal: z.number().min(0).optional(),
    startsAt: z.string().optional().nullable(),
    expiresAt: z.string().optional().nullable(),
    bannerText: z.string().max(240).optional().nullable(),
    isActive: z.boolean().optional(),
  }),
]);

export async function GET(request: Request) {
  try {
    await requirePermission("promotions.manage", request);
    const data = await listAdminCouponsAndPromotions();
    return jsonOk(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requirePermission("promotions.manage", request);
    const body = await parseJsonBody(request, upsertSchema);
    if (body.entity === "coupon") {
      const result = await upsertCoupon({
        ...body,
        actorUserId: admin.id,
        actorEmail: admin.email,
      });
      return jsonOk(result);
    }
    const result = await upsertPromotion(body);
    return jsonOk(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    await requirePermission("promotions.manage", request);
    const url = new URL(request.url);
    const entity = url.searchParams.get("entity");
    const id = url.searchParams.get("id");
    if (!id || (entity !== "coupon" && entity !== "promotion")) {
      return jsonOk({ deleted: false });
    }
    if (entity === "coupon") {
      return jsonOk(await deleteCoupon(id));
    }
    return jsonOk(await deletePromotion(id));
  } catch (error) {
    return handleApiError(error);
  }
}
