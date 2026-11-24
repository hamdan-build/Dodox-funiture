import { asc, desc, eq, sql } from "drizzle-orm";
import { getDb, type DbClient } from "@/lib/server/db/client";
import {
  couponRedemptions,
  coupons,
  customerAddresses,
  customers,
  inventory,
  inventoryMovements,
  notifications,
  orderAddresses,
  orderItems,
  orderNotes,
  orderReferenceSequences,
  orders,
  orderStatusHistory,
  users,
} from "@/lib/server/db/schema";
import { ensureSeeded } from "@/lib/server/db/seed";
import { dispatchEmailSafe } from "@/lib/server/email/dispatcher";
import {
  buildAdminAlertEmail,
  buildOrderReceivedEmail,
  buildOrderStatusEmail,
} from "@/lib/server/email/templates";
import { getRuntimeEnv } from "@/lib/server/env";
import { NotFoundError, ValidationError } from "@/lib/server/errors";
import {
  generateId,
  generateSecureToken,
  nowIso,
  sha256Hex,
} from "@/lib/server/ids";
import {
  normalizeEmail,
  normalizePhoneDigits,
  sanitizeMultilineText,
  sanitizeText,
} from "@/lib/server/security/sanitize";
import {
  calculateAuthoritativeOrderQuote,
  type PricingLineRequest,
} from "@/lib/server/services/pricing.service";

export const ORDER_STATUSES = [
  "received",
  "under_review",
  "confirmed",
  "in_production",
  "ready",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "rejected",
] as const;

export type OrderStatusType = (typeof ORDER_STATUSES)[number];

const RESERVED_STATES = new Set<OrderStatusType>([
  "confirmed",
  "in_production",
  "ready",
  "out_for_delivery",
]);

export const ORDER_STATUS_LABELS: Record<OrderStatusType, string> = {
  received: "Order Request Received",
  under_review: "Under Atelier Review",
  confirmed: "Confirmed by Concierge",
  in_production: "In Atelier Production",
  ready: "Ready for White-Glove Delivery",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered & Placed",
  cancelled: "Cancelled",
  rejected: "Declined",
};

async function nextOrderReference(db: DbClient): Promise<string> {
  const year = new Date().getUTCFullYear();
  const now = nowIso();
  await db
    .insert(orderReferenceSequences)
    .values({ year, prefix: "DODOX", lastNumber: 0, updatedAt: now })
    .onConflictDoNothing();

  await db
    .update(orderReferenceSequences)
    .set({
      lastNumber: sql`${orderReferenceSequences.lastNumber} + 1`,
      updatedAt: now,
    })
    .where(eq(orderReferenceSequences.year, year));

  const row = await db
    .select()
    .from(orderReferenceSequences)
    .where(eq(orderReferenceSequences.year, year))
    .limit(1);

  const seq = row[0]?.lastNumber ?? 1;
  return `DODOX-${year}-${String(seq).padStart(6, "0")}`;
}

export interface CreateOrderRequestInput {
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    city: string;
    district: string;
    address: string;
    landmark?: string;
    deliveryMethod: "kigali-white-glove" | "regional-courier";
    notes?: string;
  };
  lines: PricingLineRequest[];
  promoCode?: string | null;
  careProtection: boolean;
  ipHash?: string | null;
}

export async function createOrderRequest(input: CreateOrderRequestInput) {
  const db = await getDb();
  await ensureSeeded(db);

  const email = normalizeEmail(input.customer.email);
  const phoneNormalized = normalizePhoneDigits(input.customer.phone);
  if (phoneNormalized.length < 8) {
    throw new ValidationError("Enter a valid telephone number.");
  }

  const quote = await calculateAuthoritativeOrderQuote({
    lines: input.lines,
    promoCode: input.promoCode,
    careProtection: input.careProtection,
    customerEmail: email,
  });

  const now = nowIso();
  const firstName = sanitizeText(input.customer.firstName, 80);
  const lastName = sanitizeText(input.customer.lastName, 80);
  const phone = sanitizeText(input.customer.phone, 40);
  const city = sanitizeText(input.customer.city, 80);
  const district = sanitizeText(input.customer.district, 120);
  const addressLine = sanitizeText(input.customer.address, 240);
  const landmark = input.customer.landmark
    ? sanitizeText(input.customer.landmark, 180)
    : null;
  const customerNotesText = input.customer.notes
    ? sanitizeMultilineText(input.customer.notes, 1000)
    : null;

  const existingCustomer = await db
    .select()
    .from(customers)
    .where(eq(customers.email, email))
    .limit(1);

  let customerId: string;
  if (existingCustomer[0]) {
    customerId = existingCustomer[0].id;
    await db
      .update(customers)
      .set({
        firstName,
        lastName,
        phone,
        city,
        district,
        orderCount: existingCustomer[0].orderCount + 1,
        totalRequestedAmount: existingCustomer[0].totalRequestedAmount + quote.total,
        lastOrderAt: now,
        updatedAt: now,
      })
      .where(eq(customers.id, customerId));
  } else {
    customerId = generateId("cus");
    await db.insert(customers).values({
      id: customerId,
      email,
      firstName,
      lastName,
      phone,
      city,
      district,
      orderCount: 1,
      confirmedOrderCount: 0,
      totalRequestedAmount: quote.total,
      confirmedSpendAmount: 0,
      lastOrderAt: now,
      acceptsMarketing: false,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(customerAddresses).values({
      id: generateId("caddr"),
      customerId,
      label: "Primary Delivery",
      recipientName: `${firstName} ${lastName}`,
      phone,
      city,
      district,
      addressLine,
      landmark,
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  const orderId = generateId("ord");
  const reference = await nextOrderReference(db);
  const rawTrackingToken = generateSecureToken(24);
  const trackingTokenHash = await sha256Hex(rawTrackingToken);

  // IMPORTANT BUSINESS RULE: Status starts at 'received' with paymentStatus = 'unpaid_request'
  // and stockReserved = false. Inventory is NOT decremented or reserved until confirmation.
  await db.insert(orders).values({
    id: orderId,
    reference,
    trackingTokenHash,
    idempotencyKey: null,
    customerId,
    status: "received",
    paymentStatus: "unpaid_request",
    paymentProvider: null,
    paymentReference: null,
    currency: "RWF",
    itemCount: quote.itemCount,
    subtotalAmount: quote.subtotal,
    discountAmount: quote.discount,
    couponId: quote.appliedCoupon?.id ?? null,
    couponCode: quote.appliedCoupon?.code ?? null,
    careProtectionEnabled: quote.careProtectionEnabled,
    careProtectionAmount: quote.careProtectionFee,
    deliveryMethod: input.customer.deliveryMethod,
    deliveryAmount: quote.logisticsFee,
    vatRateBps: quote.vatRateBps,
    pricesIncludeVat: true,
    vatAmount: quote.vatIncluded,
    totalAmount: quote.total,
    stockReserved: false,
    customerFirstName: firstName,
    customerLastName: lastName,
    customerEmail: email,
    customerPhone: phone,
    customerNotes: customerNotesText,
    confirmedAt: null,
    inProductionAt: null,
    readyAt: null,
    deliveredAt: null,
    cancelledAt: null,
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(orderAddresses).values({
    id: generateId("oaddr"),
    orderId,
    addressType: "delivery",
    recipientName: `${firstName} ${lastName}`,
    email,
    phone,
    city,
    district,
    addressLine,
    landmark,
    country: "Rwanda",
  });

  for (const line of quote.lines) {
    await db.insert(orderItems).values({
      id: generateId("oitem"),
      orderId,
      productId: line.productId,
      variantId: null,
      productSlug: line.slug,
      productName: line.name,
      productSku: line.sku,
      productImage: line.imageUrl,
      availabilityAtOrder: line.availability,
      leadTimeAtOrder: line.leadTime,
      baseUnitPrice: line.basePrice,
      variantPriceDelta: line.variantDelta,
      unitPrice: line.unitPrice,
      quantity: line.quantity,
      lineTotal: line.lineTotal,
      selectedOptionsJson: JSON.stringify(line.selectedOptions),
      variantSummary: line.variantSummary,
      createdAt: now,
    });
  }

  await db.insert(orderStatusHistory).values({
    id: generateId("osh"),
    orderId,
    fromStatus: null,
    toStatus: "received",
    note: "Order request submitted online. Awaiting concierge review and local payment coordination.",
    isCustomerVisible: true,
    changedByUserId: null,
    createdAt: now,
  });

  if (quote.appliedCoupon) {
    await db.insert(couponRedemptions).values({
      id: generateId("cred"),
      couponId: quote.appliedCoupon.id,
      orderId,
      customerId,
      customerEmail: email,
      discountAmount: quote.appliedCoupon.amount,
      redeemedAt: now,
    });
    await db
      .update(coupons)
      .set({
        usageCount: sql`${coupons.usageCount} + 1`,
        updatedAt: now,
      })
      .where(eq(coupons.id, quote.appliedCoupon.id));
  }

  await db.insert(notifications).values({
    id: generateId("ntf"),
    recipientUserId: null,
    category: "order",
    title: `New Order Request ${reference}`,
    body: `${firstName} ${lastName} requested ${quote.itemCount} item(s) (${quote.total.toLocaleString("en-US")} RWF).`,
    href: `/admin/orders/${orderId}`,
    isRead: false,
    readAt: null,
    createdAt: now,
  });

  const env = await getRuntimeEnv();
  const baseUrl = env.SITE_URL;
  const trackingUrl = `${baseUrl}/track-order?ref=${encodeURIComponent(reference)}`;

  const customerMail = buildOrderReceivedEmail({
    reference,
    firstName,
    totalAmount: quote.total,
    trackingUrl,
    items: quote.lines.map((l) => ({
      name: l.name,
      variantSummary: l.variantSummary,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
    })),
  });

  const emailTasks: Promise<void>[] = [
    dispatchEmailSafe({
      to: email,
      subject: customerMail.subject,
      html: customerMail.html,
      text: customerMail.text,
    }),
  ];

  if (env.ADMIN_NOTIFICATION_EMAIL) {
    const adminMail = buildAdminAlertEmail({
      eventTitle: `New Order Request · ${reference}`,
      summary: `${firstName} ${lastName} (${email} · ${phone}) submitted an order request for ${quote.itemCount} item(s) totalling ${quote.total.toLocaleString("en-US")} RWF.`,
      adminUrl: `${baseUrl}/admin/orders/${orderId}`,
    });
    emailTasks.push(
      dispatchEmailSafe({
        to: env.ADMIN_NOTIFICATION_EMAIL,
        subject: adminMail.subject,
        html: adminMail.html,
        text: adminMail.text,
      }),
    );
  }

  await Promise.allSettled(emailTasks);

  return {
    id: orderId,
    reference,
    trackingToken: rawTrackingToken,
    status: "received" as const,
    createdAt: now,
    customer: {
      firstName,
      lastName,
      email,
      phone,
      city,
      district,
      address: addressLine,
      landmark: landmark ?? undefined,
      deliveryMethod: input.customer.deliveryMethod,
      notes: customerNotesText ?? undefined,
    },
    lines: quote.lines.map((l) => ({
      name: l.name,
      slug: l.slug,
      image: l.imageUrl,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      variantSummary: l.variantSummary,
    })),
    totals: {
      itemCount: quote.itemCount,
      subtotal: quote.subtotal,
      discount: quote.discount,
      careProtection: quote.careProtectionFee,
      logistics: quote.logisticsFee,
      total: quote.total,
      vatIncluded: quote.vatIncluded,
      savings: quote.discount,
    },
    careProtection: quote.careProtectionEnabled,
    promoCode: quote.appliedCoupon?.code,
  };
}

// ============================================================================
// PUBLIC VERIFIED ORDER TRACKING & CONFIRMATION LOOKUP
// ============================================================================

export async function lookupOrderForCustomer(params: {
  reference: string;
  contact?: string;
  trackingToken?: string;
}) {
  const db = await getDb();
  const cleanRef = params.reference.trim().toUpperCase();
  if (!cleanRef) return null;

  const orderRows = await db
    .select()
    .from(orders)
    .where(eq(orders.reference, cleanRef))
    .limit(1);
  const order = orderRows[0];
  if (!order) return null;

  let verified = false;
  let fullAddressAllowed = false;

  if (params.trackingToken && params.trackingToken.trim().length >= 16) {
    const candidateHash = await sha256Hex(params.trackingToken.trim());
    if (candidateHash === order.trackingTokenHash) {
      verified = true;
      fullAddressAllowed = true;
    }
  }

  if (!verified && params.contact) {
    const contactClean = params.contact.trim().toLowerCase();
    const contactDigits = normalizePhoneDigits(contactClean);
    const storedPhoneDigits = normalizePhoneDigits(order.customerPhone);
    if (contactClean === order.customerEmail.toLowerCase()) {
      verified = true;
    } else if (
      contactDigits.length >= 8 &&
      (contactDigits === storedPhoneDigits ||
        storedPhoneDigits.endsWith(contactDigits.slice(-9)) ||
        contactDigits.endsWith(storedPhoneDigits.slice(-9)))
    ) {
      verified = true;
    }
  }

  if (!verified) return null;

  const [items, addrRows, historyRows] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, order.id)),
    db
      .select()
      .from(orderAddresses)
      .where(eq(orderAddresses.orderId, order.id))
      .limit(1),
    db
      .select()
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, order.id))
      .orderBy(asc(orderStatusHistory.createdAt)),
  ]);

  const addr = addrRows[0];
  const visibleHistory = historyRows
    .filter((h) => h.isCustomerVisible)
    .map((h) => ({
      status: h.toStatus,
      label:
        ORDER_STATUS_LABELS[h.toStatus as OrderStatusType] ?? h.toStatus,
      note: h.note,
      createdAt: h.createdAt,
    }));

  return {
    reference: order.reference,
    status: order.status as OrderStatusType,
    statusLabel:
      ORDER_STATUS_LABELS[order.status as OrderStatusType] ?? order.status,
    paymentStatus: order.paymentStatus,
    createdAt: order.createdAt,
    customer: {
      firstName: order.customerFirstName,
      lastName: fullAddressAllowed
        ? order.customerLastName
        : `${order.customerLastName.slice(0, 1)}.`,
      email: fullAddressAllowed
        ? order.customerEmail
        : order.customerEmail.replace(/^(..).*(@.*)$/, "$1***$2"),
      phone: fullAddressAllowed
        ? order.customerPhone
        : `***${order.customerPhone.slice(-4)}`,
      city: addr?.city ?? "Kigali",
      district: addr?.district ?? "",
      address: fullAddressAllowed
        ? (addr?.addressLine ?? "")
        : "Verified delivery address on file",
      landmark: fullAddressAllowed ? (addr?.landmark ?? undefined) : undefined,
      deliveryMethod: order.deliveryMethod as
        | "kigali-white-glove"
        | "regional-courier",
      notes: fullAddressAllowed ? (order.customerNotes ?? undefined) : undefined,
    },
    lines: items.map((item) => ({
      name: item.productName,
      slug: item.productSlug,
      image: item.productImage,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
      variantSummary: item.variantSummary,
    })),
    totals: {
      itemCount: order.itemCount,
      subtotal: order.subtotalAmount,
      discount: order.discountAmount,
      careProtection: order.careProtectionAmount,
      logistics: order.deliveryAmount,
      total: order.totalAmount,
      vatIncluded: order.vatAmount,
      savings: order.discountAmount,
    },
    careProtection: order.careProtectionEnabled,
    promoCode: order.couponCode ?? undefined,
    history: visibleHistory,
  };
}

// ============================================================================
// ADMIN ORDER MANAGEMENT & RESERVATION / FULFILLMENT ENGINE
// ============================================================================

export async function listAdminOrders(filters?: {
  status?: string;
  query?: string;
  from?: string;
  to?: string;
}) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt));

  const q = filters?.query?.trim().toLowerCase() ?? "";

  return rows.filter((o) => {
    if (filters?.status && filters.status !== "all" && o.status !== filters.status) {
      return false;
    }
    if (filters?.from && o.createdAt < filters.from) return false;
    if (filters?.to && o.createdAt > `${filters.to}T23:59:59.999Z`) return false;
    if (q) {
      const hay = `${o.reference} ${o.customerFirstName} ${o.customerLastName} ${o.customerEmail} ${o.customerPhone}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export async function getAdminOrderDetail(orderId: string) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  const order = rows[0];
  if (!order) {
    throw new NotFoundError("Order not found.");
  }

  const [items, addrRows, history, notes, staffUsers] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, orderId)),
    db.select().from(orderAddresses).where(eq(orderAddresses.orderId, orderId)),
    db
      .select()
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, orderId))
      .orderBy(desc(orderStatusHistory.createdAt)),
    db
      .select()
      .from(orderNotes)
      .where(eq(orderNotes.orderId, orderId))
      .orderBy(desc(orderNotes.createdAt)),
    db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users),
  ]);

  const userNameById = new Map(
    staffUsers.map((u) => [u.id, `${u.firstName} ${u.lastName}`.trim()]),
  );

  return {
    order,
    address: addrRows[0] ?? null,
    items,
    history: history.map((h) => ({
      ...h,
      actorName: h.changedByUserId
        ? (userNameById.get(h.changedByUserId) ?? "DODOX Staff")
        : "DODOX Storefront",
    })),
    notes: notes.map((n) => ({
      ...n,
      body: n.note,
      authorName: n.authorUserId
        ? (userNameById.get(n.authorUserId) ?? "DODOX Staff")
        : "DODOX Staff",
    })),
  };
}

export async function updateAdminOrderStatus(params: {
  orderId: string;
  nextStatus: OrderStatusType;
  note?: string;
  isCustomerVisible?: boolean;
  notifyCustomer?: boolean;
  actor: { id: string; name: string; email: string };
}) {
  const db = await getDb();
  const detail = await getAdminOrderDetail(params.orderId);
  const prevStatus = detail.order.status as OrderStatusType;
  const nextStatus = params.nextStatus;

  if (prevStatus === nextStatus && !params.note) {
    return detail;
  }

  const now = nowIso();
  const wasReserved = RESERVED_STATES.has(prevStatus) || detail.order.stockReserved;
  const willBeReserved = RESERVED_STATES.has(nextStatus);

  // Only pass valid FK user ID if user exists in `users` table
  const actorUserRow = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, params.actor.id))
    .limit(1);
  const validActorId = actorUserRow[0]?.id ?? null;

  // 1) Unreserved -> Reserved: reserve stock on confirmation
  if (!wasReserved && willBeReserved && prevStatus !== "delivered") {
    for (const item of detail.items) {
      if (!item.productId) continue;
      const invRows = await db
        .select()
        .from(inventory)
        .where(eq(inventory.productId, item.productId))
        .limit(1);
      const inv = invRows[0];
      if (!inv) continue;

      const nextReserved = inv.quantityReserved + item.quantity;
      await db
        .update(inventory)
        .set({ quantityReserved: nextReserved, updatedAt: now })
        .where(eq(inventory.id, inv.id));

      await db.insert(inventoryMovements).values({
        id: generateId("imov"),
        inventoryId: inv.id,
        productId: item.productId,
        variantId: null,
        movementType: "reserve",
        quantityDelta: 0,
        previousOnHand: inv.quantityOnHand,
        newOnHand: inv.quantityOnHand,
        previousReserved: inv.quantityReserved,
        newReserved: nextReserved,
        referenceType: "order",
        referenceId: detail.order.id,
        reason: `Reserved for confirmed order ${detail.order.reference}`,
        actorUserId: validActorId,
        createdAt: now,
      });
    }
  }

  // 2) Transition to Delivered: deduct onHand and release reservation
  if (prevStatus !== "delivered" && nextStatus === "delivered") {
    for (const item of detail.items) {
      if (!item.productId) continue;
      const invRows = await db
        .select()
        .from(inventory)
        .where(eq(inventory.productId, item.productId))
        .limit(1);
      const inv = invRows[0];
      if (!inv) continue;

      const nextOnHand = Math.max(0, inv.quantityOnHand - item.quantity);
      const nextReserved = wasReserved
        ? Math.max(0, inv.quantityReserved - item.quantity)
        : inv.quantityReserved;

      await db
        .update(inventory)
        .set({
          quantityOnHand: nextOnHand,
          quantityReserved: nextReserved,
          updatedAt: now,
        })
        .where(eq(inventory.id, inv.id));

      await db.insert(inventoryMovements).values({
        id: generateId("imov"),
        inventoryId: inv.id,
        productId: item.productId,
        variantId: null,
        movementType: "fulfill",
        quantityDelta: -item.quantity,
        previousOnHand: inv.quantityOnHand,
        newOnHand: nextOnHand,
        previousReserved: inv.quantityReserved,
        newReserved: nextReserved,
        referenceType: "order",
        referenceId: detail.order.id,
        reason: `Delivered order ${detail.order.reference}`,
        actorUserId: validActorId,
        createdAt: now,
      });
    }
  }

  // 3) Reserved -> Cancelled / Rejected / Under Review: release reserved stock
  if (
    wasReserved &&
    (nextStatus === "cancelled" ||
      nextStatus === "rejected" ||
      nextStatus === "received" ||
      nextStatus === "under_review")
  ) {
    for (const item of detail.items) {
      if (!item.productId) continue;
      const invRows = await db
        .select()
        .from(inventory)
        .where(eq(inventory.productId, item.productId))
        .limit(1);
      const inv = invRows[0];
      if (!inv) continue;

      const nextReserved = Math.max(0, inv.quantityReserved - item.quantity);
      await db
        .update(inventory)
        .set({ quantityReserved: nextReserved, updatedAt: now })
        .where(eq(inventory.id, inv.id));

      await db.insert(inventoryMovements).values({
        id: generateId("imov"),
        inventoryId: inv.id,
        productId: item.productId,
        variantId: null,
        movementType: "release",
        quantityDelta: 0,
        previousOnHand: inv.quantityOnHand,
        newOnHand: inv.quantityOnHand,
        previousReserved: inv.quantityReserved,
        newReserved: nextReserved,
        referenceType: "order",
        referenceId: detail.order.id,
        reason: `Released reservation for ${nextStatus} order ${detail.order.reference}`,
        actorUserId: validActorId,
        createdAt: now,
      });
    }
  }

  const newlyConfirmed =
    !detail.order.confirmedAt &&
    (nextStatus === "confirmed" ||
      nextStatus === "in_production" ||
      nextStatus === "ready" ||
      nextStatus === "out_for_delivery" ||
      nextStatus === "delivered");

  if (newlyConfirmed && detail.order.customerId) {
    await db
      .update(customers)
      .set({
        confirmedOrderCount: sql`${customers.confirmedOrderCount} + 1`,
        confirmedSpendAmount: sql`${customers.confirmedSpendAmount} + ${detail.order.totalAmount}`,
        updatedAt: now,
      })
      .where(eq(customers.id, detail.order.customerId));
  }

  await db
    .update(orders)
    .set({
      status: nextStatus,
      stockReserved: willBeReserved,
      ...(newlyConfirmed
        ? { confirmedAt: now, paymentStatus: "confirmed_offline" }
        : {}),
      ...(nextStatus === "in_production" ? { inProductionAt: now } : {}),
      ...(nextStatus === "ready" ? { readyAt: now } : {}),
      ...(nextStatus === "delivered" ? { deliveredAt: now } : {}),
      ...(nextStatus === "cancelled" || nextStatus === "rejected"
        ? { cancelledAt: now }
        : {}),
      updatedAt: now,
    })
    .where(eq(orders.id, params.orderId));

  const statusNote =
    params.note?.trim() ||
    `Status updated to ${ORDER_STATUS_LABELS[nextStatus]}.`;

  await db.insert(orderStatusHistory).values({
    id: generateId("osh"),
    orderId: params.orderId,
    fromStatus: prevStatus,
    toStatus: nextStatus,
    note: statusNote,
    isCustomerVisible: params.isCustomerVisible ?? true,
    changedByUserId: validActorId,
    createdAt: now,
  });

  if (params.notifyCustomer && (params.isCustomerVisible ?? true)) {
    const env = await getRuntimeEnv();
    const baseUrl = env.SITE_URL;
    const mail = buildOrderStatusEmail({
      reference: detail.order.reference,
      firstName: detail.order.customerFirstName,
      newStatusLabel: ORDER_STATUS_LABELS[nextStatus],
      note: statusNote,
      trackingUrl: `${baseUrl}/track-order?ref=${encodeURIComponent(detail.order.reference)}`,
    });
    await dispatchEmailSafe({
      to: detail.order.customerEmail,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    }).catch(() => undefined);
  }

  return getAdminOrderDetail(params.orderId);
}

export async function addAdminOrderInternalNote(params: {
  orderId: string;
  body: string;
  actor: { id: string; name: string };
}) {
  const db = await getDb();
  const clean = sanitizeMultilineText(params.body, 2000);
  if (!clean) {
    throw new ValidationError("Note body cannot be empty.");
  }
  const actorUserRow = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, params.actor.id))
    .limit(1);

  await db.insert(orderNotes).values({
    id: generateId("onote"),
    orderId: params.orderId,
    authorUserId: actorUserRow[0]?.id ?? null,
    note: clean,
    isInternal: true,
    createdAt: nowIso(),
  });
  return getAdminOrderDetail(params.orderId);
}
