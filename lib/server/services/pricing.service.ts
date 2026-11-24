import { and, count, eq } from "drizzle-orm";
import { getDb, type DbClient } from "@/lib/server/db/client";
import {
  couponRedemptions,
  coupons,
  inventory,
  productImages,
  productOptions,
  productOptionValues,
  products,
  siteSettings,
} from "@/lib/server/db/schema";
import { ensureSeeded } from "@/lib/server/db/seed";
import { ValidationError } from "@/lib/server/errors";

export interface PricingLineRequest {
  slug: string;
  quantity: number;
  selections: Array<{
    groupId: string;
    optionId: string;
  }>;
}

export interface VerifiedPricingLine {
  productId: string;
  sku: string;
  slug: string;
  name: string;
  imageUrl: string;
  quantity: number;
  basePrice: number;
  variantDelta: number;
  unitPrice: number;
  lineTotal: number;
  variantSummary: string;
  selectedOptions: Array<{
    groupId: string;
    groupLabel: string;
    optionId: string;
    optionLabel: string;
    priceDelta: number;
  }>;
  availability: string;
  leadTime: string;
}

export interface AuthoritativeQuote {
  lines: VerifiedPricingLine[];
  itemCount: number;
  subtotal: number;
  discount: number;
  appliedCoupon: {
    id: string;
    code: string;
    label: string;
    amount: number;
  } | null;
  careProtectionEnabled: boolean;
  careProtectionFee: number;
  logisticsFee: number;
  vatRateBps: number;
  vatIncluded: number;
  total: number;
}

export async function getPricingConfig(db: DbClient) {
  const settings = await db.select().from(siteSettings);
  const map = new Map(settings.map((s) => [s.key, s.valueJson]));

  const parseSettingNumber = (key: string, fallback: number): number => {
    const raw = map.get(key);
    if (!raw) return fallback;
    try {
      const parsed = Number(JSON.parse(raw));
      return Number.isFinite(parsed) && parsed >= 0
        ? Math.round(parsed)
        : fallback;
    } catch {
      return fallback;
    }
  };

  return {
    vatRateBps: parseSettingNumber("vat_rate_bps", 1800), // 18.00%
    careProtectionPrice: parseSettingNumber("care_protection_price", 65000),
    privilegeThreshold: parseSettingNumber("privilege_threshold", 2500000),
  };
}

export async function validateCouponOnServer(params: {
  db?: DbClient;
  code: string;
  subtotal: number;
  customerEmail?: string;
}): Promise<{
  id: string;
  code: string;
  label: string;
  description: string;
  amount: number;
}> {
  const db = params.db ?? (await getDb());
  await ensureSeeded(db);

  const normalized = params.code.trim().toUpperCase();
  if (!normalized) {
    throw new ValidationError("Enter a valid invitation or privilege code.");
  }

  const rows = await db
    .select()
    .from(coupons)
    .where(eq(coupons.code, normalized))
    .limit(1);

  const coupon = rows[0];
  if (!coupon || !coupon.isActive) {
    throw new ValidationError(`Code "${normalized}" is not active or recognised.`);
  }

  const now = new Date().toISOString();
  if (coupon.startsAt && now < coupon.startsAt) {
    throw new ValidationError(`Code "${coupon.code}" is not yet active.`);
  }
  if (coupon.expiresAt && now > coupon.expiresAt) {
    throw new ValidationError(`Code "${coupon.code}" has expired.`);
  }
  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
    throw new ValidationError(`Code "${coupon.code}" has reached its redemption limit.`);
  }
  if (params.subtotal < coupon.minimumSubtotal) {
    throw new ValidationError(
      `${coupon.code} requires a minimum subtotal of ${coupon.minimumSubtotal.toLocaleString("en-US")} RWF.`,
    );
  }

  if (
    params.customerEmail &&
    coupon.perCustomerLimit !== null &&
    coupon.perCustomerLimit > 0
  ) {
    const emailNorm = params.customerEmail.trim().toLowerCase();
    const customerUses = await db
      .select({ v: count() })
      .from(couponRedemptions)
      .where(
        and(
          eq(couponRedemptions.couponId, coupon.id),
          eq(couponRedemptions.customerEmail, emailNorm),
        ),
      );
    if ((customerUses[0]?.v ?? 0) >= coupon.perCustomerLimit) {
      throw new ValidationError(
        `Code "${coupon.code}" has already been used the maximum number of times for this email address.`,
      );
    }
  }

  let rawDiscount =
    coupon.discountType === "fixed"
      ? coupon.value
      : Math.round((params.subtotal * coupon.value) / 100);

  if (coupon.maximumDiscount !== null) {
    rawDiscount = Math.min(rawDiscount, coupon.maximumDiscount);
  }

  const amount = Math.max(0, Math.min(rawDiscount, params.subtotal));

  return {
    id: coupon.id,
    code: coupon.code,
    label: coupon.label,
    description: coupon.description,
    amount,
  };
}

export async function calculateAuthoritativeOrderQuote(input: {
  lines: PricingLineRequest[];
  promoCode?: string | null;
  careProtection: boolean;
  customerEmail?: string;
}): Promise<AuthoritativeQuote> {
  if (!input.lines || input.lines.length === 0) {
    throw new ValidationError("Order request must include at least one item.");
  }

  const db = await getDb();
  await ensureSeeded(db);
  const config = await getPricingConfig(db);

  const verifiedLines: VerifiedPricingLine[] = [];

  // Aggregate requested quantities per product so duplicate lines cannot bypass stock checks
  const requestedQtyByProductId = new Map<string, number>();

  for (const reqLine of input.lines) {
    const qty = Math.round(Number(reqLine.quantity));
    if (!Number.isInteger(qty) || qty < 1 || qty > 50) {
      throw new ValidationError("Item quantity must be between 1 and 50.");
    }

    const prodRows = await db
      .select()
      .from(products)
      .where(eq(products.slug, reqLine.slug))
      .limit(1);
    const product = prodRows[0];

    if (!product || product.status !== "published") {
      throw new ValidationError(
        `Piece "${reqLine.slug}" is no longer available in the catalogue.`,
      );
    }

    if (product.availability === "out-of-stock") {
      throw new ValidationError(
        `"${product.name}" is currently out of stock and cannot be requested.`,
      );
    }

    const cumulativeQty = (requestedQtyByProductId.get(product.id) ?? 0) + qty;
    requestedQtyByProductId.set(product.id, cumulativeQty);

    const invRows = await db
      .select()
      .from(inventory)
      .where(eq(inventory.productId, product.id))
      .limit(1);
    const inv = invRows[0];

    if (inv && !inv.allowBackorder && product.availability === "in-stock") {
      const available = Math.max(0, inv.quantityOnHand - inv.quantityReserved);
      if (cumulativeQty > available) {
        throw new ValidationError(
          available === 0
            ? `"${product.name}" has no remaining showroom stock available.`
            : `Only ${available} unit(s) of "${product.name}" are currently available in Kigali showroom stock.`,
        );
      }
    }

    const [optGroups, optVals, imgs] = await Promise.all([
      db
        .select()
        .from(productOptions)
        .where(eq(productOptions.productId, product.id)),
      db
        .select()
        .from(productOptionValues)
        .where(eq(productOptionValues.productId, product.id)),
      db
        .select()
        .from(productImages)
        .where(eq(productImages.productId, product.id)),
    ]);

    const resolvedSelections: VerifiedPricingLine["selectedOptions"] = [];
    for (const group of optGroups) {
      const groupValues = optVals.filter((v) => v.optionId === group.id);
      if (groupValues.length === 0) continue;

      const requestedSelection = reqLine.selections.find(
        (s) => s.groupId === group.optionKey,
      );
      const chosen =
        (requestedSelection
          ? groupValues.find(
              (v) => v.valueKey === requestedSelection.optionId && v.isAvailable,
            )
          : undefined) ?? groupValues[0];

      resolvedSelections.push({
        groupId: group.optionKey,
        groupLabel: group.label,
        optionId: chosen.valueKey,
        optionLabel: chosen.label,
        priceDelta: chosen.priceDelta,
      });
    }

    const variantDelta = resolvedSelections.reduce(
      (sum, s) => sum + s.priceDelta,
      0,
    );
    const unitPrice = product.basePrice + variantDelta;
    if (unitPrice <= 0) {
      throw new ValidationError(`Invalid configuration price for "${product.name}".`);
    }

    const lineTotal = unitPrice * qty;
    const primaryImg =
      imgs.find((i) => i.isPrimary)?.url ??
      imgs[0]?.url ??
      "/images/products/imanzi-sofa.jpg";

    verifiedLines.push({
      productId: product.id,
      sku: product.sku,
      slug: product.slug,
      name: product.name,
      imageUrl: primaryImg,
      quantity: qty,
      basePrice: product.basePrice,
      variantDelta,
      unitPrice,
      lineTotal,
      variantSummary:
        resolvedSelections.map((s) => s.optionLabel).join(" · ") ||
        "Standard Configuration",
      selectedOptions: resolvedSelections,
      availability: product.availability,
      leadTime: product.leadTime,
    });
  }

  const subtotal = verifiedLines.reduce((sum, l) => sum + l.lineTotal, 0);
  const itemCount = verifiedLines.reduce((sum, l) => sum + l.quantity, 0);

  let appliedCoupon: AuthoritativeQuote["appliedCoupon"] = null;
  if (input.promoCode && input.promoCode.trim()) {
    const validated = await validateCouponOnServer({
      db,
      code: input.promoCode,
      subtotal,
      customerEmail: input.customerEmail,
    });
    appliedCoupon = {
      id: validated.id,
      code: validated.code,
      label: validated.label,
      amount: validated.amount,
    };
  }

  const discount = appliedCoupon?.amount ?? 0;
  const careProtectionFee =
    input.careProtection && verifiedLines.length > 0
      ? config.careProtectionPrice
      : 0;
  const logisticsFee = 0; // Kigali white-glove included; regional courier quoted after concierge review

  const total = Math.max(
    0,
    subtotal - discount + careProtectionFee + logisticsFee,
  );
  const vatIncluded = Math.round(
    (total * config.vatRateBps) / (10000 + config.vatRateBps),
  );

  return {
    lines: verifiedLines,
    itemCount,
    subtotal,
    discount,
    appliedCoupon,
    careProtectionEnabled: Boolean(input.careProtection),
    careProtectionFee,
    logisticsFee,
    vatRateBps: config.vatRateBps,
    vatIncluded,
    total,
  };
}
