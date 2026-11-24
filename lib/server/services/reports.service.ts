import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/server/db/client";
import { ensureSeeded } from "@/lib/server/db/seed";
import {
  atelierEnquiries,
  contactMessages,
  customers,
  inventory,
  newsletterSubscribers,
  orderItems,
  orders,
  products,
} from "@/lib/server/db/schema";

const CONFIRMED_STATUSES = new Set([
  "confirmed",
  "in_production",
  "ready",
  "out_for_delivery",
  "delivered",
]);

export async function getAdminAnalyticsReport(params?: { days?: number }) {
  const db = await getDb();
  await ensureSeeded(db);

  const days = Math.min(365, Math.max(7, params?.days ?? 90));
  const cutoffIso = new Date(
    Date.now() - days * 24 * 60 * 60 * 1000,
  ).toISOString();

  const [
    allOrders,
    allOrderItems,
    invRows,
    atelierRows,
    contactRows,
    subRows,
    customerRows,
  ] = await Promise.all([
    db.select().from(orders).orderBy(desc(orders.createdAt)),
    db.select().from(orderItems),
    db
      .select({
        sku: inventory.sku,
        onHand: inventory.quantityOnHand,
        reserved: inventory.quantityReserved,
        threshold: inventory.lowStockThreshold,
        productName: products.name,
        basePrice: products.basePrice,
      })
      .from(inventory)
      .innerJoin(products, eq(inventory.productId, products.id)),
    db.select().from(atelierEnquiries),
    db.select().from(contactMessages),
    db.select().from(newsletterSubscribers),
    db.select().from(customers),
  ]);

  const windowOrders = allOrders.filter((o) => o.createdAt >= cutoffIso);
  const windowOrderIds = new Set(windowOrders.map((o) => o.id));

  let requestedValueRwf = 0;
  let confirmedRevenueRwf = 0;
  let confirmedCount = 0;
  let vatEstimateRwf = 0;

  const statusMap = new Map<
    string,
    { status: string; count: number; totalAmount: number }
  >();
  const deliveryMap = new Map<string, number>();

  for (const ord of windowOrders) {
    if (ord.status !== "cancelled" && ord.status !== "rejected") {
      requestedValueRwf += ord.totalAmount;
    }
    if (CONFIRMED_STATUSES.has(ord.status)) {
      confirmedCount += 1;
      confirmedRevenueRwf += ord.totalAmount;
      vatEstimateRwf += ord.vatAmount;
    }

    const st = statusMap.get(ord.status) ?? {
      status: ord.status,
      count: 0,
      totalAmount: 0,
    };
    st.count += 1;
    st.totalAmount += ord.totalAmount;
    statusMap.set(ord.status, st);

    deliveryMap.set(
      ord.deliveryMethod,
      (deliveryMap.get(ord.deliveryMethod) ?? 0) + 1,
    );
  }

  const productAgg = new Map<
    string,
    { slug: string; name: string; units: number; revenue: number }
  >();
  for (const line of allOrderItems) {
    if (!windowOrderIds.has(line.orderId)) continue;
    const prev = productAgg.get(line.productSlug) ?? {
      slug: line.productSlug,
      name: line.productName,
      units: 0,
      revenue: 0,
    };
    prev.units += line.quantity;
    prev.revenue += line.lineTotal;
    productAgg.set(line.productSlug, prev);
  }

  const topPieces = Array.from(productAgg.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  const onHandRetailValueRwf = invRows.reduce(
    (sum, r) => sum + r.onHand * r.basePrice,
    0,
  );
  const reservedRetailValueRwf = invRows.reduce(
    (sum, r) => sum + r.reserved * r.basePrice,
    0,
  );
  const lowStockItems = invRows
    .filter((r) => Math.max(0, r.onHand - r.reserved) <= r.threshold)
    .map((r) => ({
      sku: r.sku,
      productName: r.productName,
      available: Math.max(0, r.onHand - r.reserved),
      threshold: r.threshold,
    }));

  const quotedAtelier = atelierRows.filter(
    (a) => a.quotedAmount && a.quotedAmount > 0,
  );

  return {
    windowDays: days,
    commerce: {
      totalOrderRequests: windowOrders.length,
      confirmedOrdersCount: confirmedCount,
      requestedValueRwf,
      confirmedRevenueRwf,
      averageOrderValueRwf:
        confirmedCount > 0 ? Math.round(confirmedRevenueRwf / confirmedCount) : 0,
      vatEstimateRwf,
      conversionRatePercent:
        windowOrders.length > 0
          ? Math.round((confirmedCount / windowOrders.length) * 100)
          : 0,
    },
    statusBreakdown: Array.from(statusMap.values()).sort(
      (a, b) => b.count - a.count,
    ),
    deliveryBreakdown: Array.from(deliveryMap.entries()).map(
      ([method, count]) => ({ method, count }),
    ),
    topPieces,
    inventoryValuation: {
      totalSkus: invRows.length,
      onHandRetailValueRwf,
      reservedRetailValueRwf,
      lowStockCount: lowStockItems.length,
      lowStockItems: lowStockItems.slice(0, 10),
    },
    conciergeFunnel: {
      totalCustomers: customerRows.length,
      atelierCommissionsTotal: atelierRows.length,
      atelierQuotedCount: quotedAtelier.length,
      atelierQuotedValueRwf: quotedAtelier.reduce(
        (s, a) => s + (a.quotedAmount ?? 0),
        0,
      ),
      contactMessagesTotal: contactRows.length,
      contactUnreadCount: contactRows.filter((c) => !c.isRead).length,
      newsletterActiveSubscribers: subRows.filter((s) => s.status === "active")
        .length,
    },
  };
}
