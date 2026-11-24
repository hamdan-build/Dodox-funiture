import { beforeEach, describe, expect, it } from "vitest";
import { installTestCloudflareEnv } from "./helpers/sqlite-d1";
import {
  adjustInventoryStock,
  createPurchaseOrder,
  listAdminInventory,
  receivePurchaseOrder,
  upsertSupplier,
} from "@/lib/server/services/inventory.service";
import {
  addAdminCustomerNote,
  getAdminCustomerDetail,
  listAdminCustomers,
  updateAdminCustomer,
} from "@/lib/server/services/customer.service";
import {
  listAdminCouponsAndPromotions,
  upsertCoupon,
} from "@/lib/server/services/promotion.service";
import { createOrderRequest } from "@/lib/server/services/order.service";
import { calculateAuthoritativeOrderQuote } from "@/lib/server/services/pricing.service";

describe("Phase 5 — Inventory, Procurement, Customer CRM & Coupons", () => {
  beforeEach(() => {
    installTestCloudflareEnv();
  });

  it("adjusts SKU stock with movement ledger and receives a supplier purchase order into on-hand stock", async () => {
    const initial = await listAdminInventory({});
    expect(initial.items.length).toBeGreaterThan(0);

    const firstSku = initial.items[0];
    const startQty = firstSku.quantityOnHand;

    const adj = await adjustInventoryStock({
      inventoryId: firstSku.id,
      quantityChange: 3,
      adjustmentType: "restock",
      reason: "Completed Kigali workshop batch",
      lowStockThreshold: 4,
    });
    expect(adj.newOnHand).toBe(startQty + 3);
    expect(adj.adjustmentReference).toMatch(/^ADJ-\d{8}-\d{4}$/);

    const sup = await upsertSupplier({
      name: "Nyungwe Timber Collective",
      city: "Huye",
      materialsSupplied: "Kiln-dried East African oak",
    });

    const po = await createPurchaseOrder({
      supplierId: sup.id,
      items: [{ inventoryId: firstSku.id, quantity: 5, unitCost: 400000 }],
    });
    expect(po.totalAmount).toBe(2000000);

    await receivePurchaseOrder({ purchaseOrderId: po.id });

    const updated = await listAdminInventory({ query: firstSku.sku });
    expect(updated.items[0].quantityOnHand).toBe(startQty + 3 + 5);
    expect(updated.movements.length).toBeGreaterThanOrEqual(2);
  });

  it("tracks customer profiles, concierge notes, and custom coupon codes in server pricing", async () => {
    await createOrderRequest({
      customer: {
        firstName: "Jean-Paul",
        lastName: "Mugisha",
        email: "jp@kigali.rw",
        phone: "+250 788 555 999",
        city: "Kigali",
        district: "Nyarugenge",
        address: "KN 5 Rd, Kiyovu",
        deliveryMethod: "kigali-white-glove",
      },
      lines: [
        {
          slug: "imanzi-sculptural-boucle-sofa",
          quantity: 1,
          selections: [],
        },
      ],
      careProtection: false,
    });

    const crm = await listAdminCustomers({ query: "Mugisha" });
    expect(crm.items.length).toBe(1);
    const customerId = crm.items[0].id;

    await updateAdminCustomer({
      customerId,
      acceptsMarketing: true,
    });

    const withNote = await addAdminCustomerNote({
      customerId,
      note: "Prefers natural oak swatch & Saturday morning white-glove delivery.",
    });
    expect(withNote.customer.acceptsMarketing).toBe(true);
    expect(withNote.notes[0].note).toContain("Saturday morning");

    const detail = await getAdminCustomerDetail(customerId);
    expect(detail.orders.length).toBe(1);

    await upsertCoupon({
      code: "KIGALIVIP250",
      label: "VIP Collector Courtesy",
      discountType: "fixed",
      value: 250000,
      minimumSubtotal: 1000000,
      isActive: true,
    });

    const allPromos = await listAdminCouponsAndPromotions();
    expect(allPromos.coupons.some((c) => c.code === "KIGALIVIP250")).toBe(true);

    const quote = await calculateAuthoritativeOrderQuote({
      lines: [
        {
          slug: "imanzi-sculptural-boucle-sofa",
          quantity: 1,
          selections: [],
        },
      ],
      promoCode: "kigalivip250",
      careProtection: false,
    });
    expect(quote.discount).toBe(250000);
    expect(quote.appliedCoupon?.code).toBe("KIGALIVIP250");
  });
});
