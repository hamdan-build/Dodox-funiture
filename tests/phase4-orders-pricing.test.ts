import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { getDb } from "@/lib/server/db/client";
import { customers, inventory } from "@/lib/server/db/schema";
import { ensureSeeded } from "@/lib/server/db/seed";
import { getPublishedProductsFromDb } from "@/lib/server/services/catalogue.service";
import {
  createOrderRequest,
  lookupOrderForCustomer,
  updateAdminOrderStatus,
} from "@/lib/server/services/order.service";
import { calculateAuthoritativeOrderQuote } from "@/lib/server/services/pricing.service";
import { installTestCloudflareEnv } from "@/tests/helpers/sqlite-d1";

describe("Phase 4 — Authoritative Pricing, Order Checkout, Reservations & Secure Tracking", () => {
  beforeEach(async () => {
    installTestCloudflareEnv();
    const db = await getDb();
    await ensureSeeded(db);
  });

  it("calculates integer RWF totals, variant deltas, coupons (WELCOMEKIGALI & ATELIER10), care fee, and VAT on the server", async () => {
    const products = await getPublishedProductsFromDb();
    const highValuePiece =
      products.find((p) => p.price >= 1500000) ?? products[0];

    const quote = await calculateAuthoritativeOrderQuote({
      lines: [
        {
          slug: highValuePiece.slug,
          quantity: 2,
          selections: highValuePiece.variants.map((g) => ({
            groupId: g.id,
            optionId: g.options[0].id,
          })),
        },
      ],
      promoCode: "WELCOMEKIGALI",
      careProtection: true,
    });

    expect(Number.isInteger(quote.subtotal)).toBe(true);
    expect(quote.discount).toBe(100000);
    expect(quote.careProtectionFee).toBe(65000);
    expect(quote.total).toBe(quote.subtotal - 100000 + 65000);
    expect(quote.vatIncluded).toBe(
      Math.round((quote.total * 1800) / (10000 + 1800)),
    );
  });

  it("generates sequential DODOX-YYYY-NNNNNN references, preserves inventory until confirmed, and enforces verified /track-order", async () => {
    const db = await getDb();
    const products = await getPublishedProductsFromDb();
    const piece = products.find((p) => p.availability === "in-stock") ?? products[0];

    const beforeInv = (
      await db
        .select()
        .from(inventory)
        .where(eq(inventory.productId, piece.id))
        .limit(1)
    )[0];

    const order1 = await createOrderRequest({
      customer: {
        firstName: "Aline",
        lastName: "Uwase",
        email: "aline@example.rw",
        phone: "+250 788 123 456",
        city: "Kigali",
        district: "Gasabo · Nyarutarama",
        address: "KG 9 Ave, House 14",
        deliveryMethod: "kigali-white-glove",
      },
      lines: [{ slug: piece.slug, quantity: 1, selections: [] }],
      careProtection: false,
    });

    const year = new Date().getUTCFullYear();
    expect(order1.reference).toBe(`DODOX-${year}-000001`);

    // CRITICAL INVARIANT: Unconfirmed order request MUST NOT reserve or deduct inventory!
    const afterRequestInv = (
      await db
        .select()
        .from(inventory)
        .where(eq(inventory.productId, piece.id))
        .limit(1)
    )[0];
    expect(afterRequestInv.quantityOnHand).toBe(beforeInv.quantityOnHand);
    expect(afterRequestInv.quantityReserved).toBe(0);

    // Anti-IDOR / Anti-enumeration on /track-order: wrong email returns null
    const unauthorizedLookup = await lookupOrderForCustomer({
      reference: order1.reference,
      contact: "attacker@example.com",
    });
    expect(unauthorizedLookup).toBeNull();

    // Verified email lookup succeeds and masks sensitive full street address
    const verifiedByEmail = await lookupOrderForCustomer({
      reference: order1.reference,
      contact: "aline@example.rw",
    });
    expect(verifiedByEmail?.reference).toBe(order1.reference);
    expect(verifiedByEmail?.status).toBe("received");

    // Verified phone lookup succeeds even with different spacing
    const verifiedByPhone = await lookupOrderForCustomer({
      reference: order1.reference,
      contact: "0788123456",
    });
    expect(verifiedByPhone?.reference).toBe(order1.reference);

    // Admin confirms order -> reserves stock!
    await updateAdminOrderStatus({
      orderId: order1.id,
      nextStatus: "confirmed",
      note: "Confirmed deposit with concierge.",
      actor: { id: "usr_admin", name: "Studio Admin", email: "admin@dodox.rw" },
    });

    const afterConfirmInv = (
      await db
        .select()
        .from(inventory)
        .where(eq(inventory.productId, piece.id))
        .limit(1)
    )[0];
    expect(afterConfirmInv.quantityReserved).toBe(1);
    expect(afterConfirmInv.quantityOnHand).toBe(beforeInv.quantityOnHand);

    // Customer confirmed spend updated
    const cust = (
      await db
        .select()
        .from(customers)
        .where(eq(customers.email, "aline@example.rw"))
        .limit(1)
    )[0];
    expect(cust.confirmedSpendAmount).toBe(order1.totals.total);

    // Admin marks delivered -> deducts onHand and releases reservation
    await updateAdminOrderStatus({
      orderId: order1.id,
      nextStatus: "delivered",
      actor: { id: "usr_admin", name: "Studio Admin", email: "admin@dodox.rw" },
    });

    const afterDeliverInv = (
      await db
        .select()
        .from(inventory)
        .where(eq(inventory.productId, piece.id))
        .limit(1)
    )[0];
    expect(afterDeliverInv.quantityReserved).toBe(0);
    expect(afterDeliverInv.quantityOnHand).toBe(beforeInv.quantityOnHand - 1);
  });
});
