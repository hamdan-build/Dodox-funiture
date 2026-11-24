import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/server/db/client";
import { ensureSeeded } from "@/lib/server/db/seed";
import { coupons, promotions, users } from "@/lib/server/db/schema";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/server/errors";
import { generateId, nowIso, slugify } from "@/lib/server/ids";
import { sanitizeText } from "@/lib/server/security/sanitize";
import { recordActivityLog } from "@/lib/server/services/audit.service";

export async function listAdminCouponsAndPromotions() {
  const db = await getDb();
  await ensureSeeded(db);
  const [couponRows, promotionRows] = await Promise.all([
    db.select().from(coupons).orderBy(desc(coupons.createdAt)),
    db.select().from(promotions).orderBy(desc(promotions.createdAt)),
  ]);
  return {
    coupons: couponRows,
    promotions: promotionRows,
  };
}

export async function upsertCoupon(params: {
  id?: string;
  code: string;
  label: string;
  description?: string;
  discountType: "fixed" | "percent";
  value: number;
  minimumSubtotal?: number;
  maximumDiscount?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  usageLimit?: number | null;
  perCustomerLimit?: number | null;
  isActive?: boolean;
  isDemo?: boolean;
  actorUserId?: string | null;
  actorEmail?: string | null;
}) {
  const db = await getDb();
  await ensureSeeded(db);
  const code = sanitizeText(params.code)
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "");
  if (code.length < 3) {
    throw new ValidationError("Coupon code must be at least 3 alphanumeric characters.");
  }

  const label = sanitizeText(params.label);
  if (label.length < 2) {
    throw new ValidationError("Coupon label is required.");
  }

  const value = Math.round(params.value);
  if (params.discountType === "percent" && (value < 1 || value > 100)) {
    throw new ValidationError("Percentage discount must be between 1 and 100.");
  }
  if (params.discountType === "fixed" && value < 1) {
    throw new ValidationError("Fixed RWF discount must be a positive integer.");
  }

  const now = nowIso();
  const minimumSubtotal = Math.max(0, Math.round(params.minimumSubtotal ?? 0));
  const maximumDiscount =
    params.maximumDiscount && params.maximumDiscount > 0
      ? Math.round(params.maximumDiscount)
      : null;
  const usageLimit =
    params.usageLimit && params.usageLimit > 0
      ? Math.trunc(params.usageLimit)
      : null;
  const perCustomerLimit =
    params.perCustomerLimit && params.perCustomerLimit > 0
      ? Math.trunc(params.perCustomerLimit)
      : null;

  let validActorId: string | null = null;
  if (params.actorUserId) {
    const u = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, params.actorUserId))
      .limit(1);
    validActorId = u[0]?.id ?? null;
  }

  if (params.id) {
    const existing = await db
      .select()
      .from(coupons)
      .where(eq(coupons.id, params.id))
      .limit(1);
    if (!existing[0]) {
      throw new NotFoundError("Coupon not found.");
    }

    await db
      .update(coupons)
      .set({
        code,
        label,
        description: sanitizeText(params.description ?? ""),
        discountType: params.discountType,
        value,
        minimumSubtotal,
        maximumDiscount,
        startsAt: params.startsAt || null,
        expiresAt: params.expiresAt || null,
        usageLimit,
        perCustomerLimit,
        isActive: params.isActive ?? true,
        isDemo: params.isDemo ?? false,
        updatedAt: now,
      })
      .where(eq(coupons.id, params.id));

    await recordActivityLog({
      actorUserId: validActorId,
      actorEmail: params.actorEmail ?? null,
      action: "coupons.update",
      resourceType: "coupon",
      resourceId: params.id,
      summary: `Updated coupon ${code}`,
    });

    return { id: params.id, code };
  }

  const conflict = await db
    .select({ id: coupons.id })
    .from(coupons)
    .where(eq(coupons.code, code))
    .limit(1);
  if (conflict[0]) {
    throw new ConflictError(`A coupon with code "${code}" already exists.`);
  }

  const id = generateId("cpn");
  await db.insert(coupons).values({
    id,
    code,
    label,
    description: sanitizeText(params.description ?? ""),
    discountType: params.discountType,
    value,
    minimumSubtotal,
    maximumDiscount,
    startsAt: params.startsAt || null,
    expiresAt: params.expiresAt || null,
    usageLimit,
    usageCount: 0,
    perCustomerLimit,
    isActive: params.isActive ?? true,
    isDemo: params.isDemo ?? false,
    createdByUserId: validActorId,
    createdAt: now,
    updatedAt: now,
  });

  await recordActivityLog({
    actorUserId: validActorId,
    actorEmail: params.actorEmail ?? null,
    action: "coupons.create",
    resourceType: "coupon",
    resourceId: id,
    summary: `Created coupon ${code}`,
  });

  return { id, code };
}

export async function deleteCoupon(id: string) {
  const db = await getDb();
  await db.delete(coupons).where(eq(coupons.id, id));
  return { deleted: true };
}

export async function upsertPromotion(params: {
  id?: string;
  name: string;
  description?: string;
  campaignType?: string;
  discountType?: "fixed" | "percent";
  value?: number;
  minimumSubtotal?: number;
  startsAt?: string | null;
  expiresAt?: string | null;
  bannerText?: string | null;
  isActive?: boolean;
}) {
  const db = await getDb();
  const name = sanitizeText(params.name);
  if (name.length < 2) {
    throw new ValidationError("Promotion campaign name is required.");
  }
  const slug = slugify(name);
  const now = nowIso();

  if (params.id) {
    await db
      .update(promotions)
      .set({
        name,
        description: sanitizeText(params.description ?? ""),
        campaignType: sanitizeText(params.campaignType ?? "seasonal"),
        discountType: params.discountType ?? "percent",
        value: Math.max(0, Math.round(params.value ?? 0)),
        minimumSubtotal: Math.max(0, Math.round(params.minimumSubtotal ?? 0)),
        startsAt: params.startsAt || null,
        expiresAt: params.expiresAt || null,
        bannerText: params.bannerText
          ? sanitizeText(params.bannerText)
          : null,
        isActive: params.isActive ?? false,
        updatedAt: now,
      })
      .where(eq(promotions.id, params.id));
    return { id: params.id, slug };
  }

  const id = generateId("prm");
  await db.insert(promotions).values({
    id,
    name,
    slug: `${slug}-${id.slice(-4)}`,
    description: sanitizeText(params.description ?? ""),
    campaignType: sanitizeText(params.campaignType ?? "seasonal"),
    discountType: params.discountType ?? "percent",
    value: Math.max(0, Math.round(params.value ?? 0)),
    minimumSubtotal: Math.max(0, Math.round(params.minimumSubtotal ?? 0)),
    startsAt: params.startsAt || null,
    expiresAt: params.expiresAt || null,
    bannerText: params.bannerText ? sanitizeText(params.bannerText) : null,
    isActive: params.isActive ?? false,
    createdAt: now,
    updatedAt: now,
  });

  return { id, slug };
}

export async function deletePromotion(id: string) {
  const db = await getDb();
  await db.delete(promotions).where(eq(promotions.id, id));
  return { deleted: true };
}
