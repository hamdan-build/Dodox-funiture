import { count, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import { getDb } from "@/lib/server/db/client";
import {
  atelierEnquiries,
  contactMessages,
  customers,
  inventory,
  orderItems,
  orders,
  products,
} from "@/lib/server/db/schema";
import { ensureSeeded } from "@/lib/server/db/seed";

export const CONFIRMED_ORDER_STATUSES = [
  "confirmed",
  "in_production",
  "ready",
  "out_for_delivery",
  "delivered",
] as const;

export const UNPAID_PIPELINE_STATUSES = ["received", "under_review"] as const;

export async function getDashboardOverview() {
  const db = await getDb();
  await ensureSeeded(db);

  const [allOrders, totalCustomersRow, allProducts, invRows] = await Promise.all(
    [
      db.select().from(orders).orderBy(desc(orders.createdAt)),
      db.select({ value: count() }).from(customers),
      db.select().from(products),
      db
        .select({
          inv: inventory,
          productName: products.name,
          productSlug: products.slug,
          availability: products.availability,
          status: products.status,
        })
        .from(inventory)
        .innerJoin(products, eq(inventory.productId, products.id)),
    ],
  );

  let confirmedOrderValue = 0;
  let unpaidRequestValue = 0;
  let pendingOrders = 0;
  let inProductionOrders = 0;
  let readyOrders = 0;

  const trendByDay = new Map<
    string,
    { date: string; confirmedValue: number; requestValue: number; orderCount: number }
  >();

  for (const ord of allOrders) {
    const isConfirmed = (CONFIRMED_ORDER_STATUSES as readonly string[]).includes(
      ord.status,
    );
    const isPipeline = (UNPAID_PIPELINE_STATUSES as readonly string[]).includes(
      ord.status,
    );

    if (isConfirmed) {
      confirmedOrderValue += ord.totalAmount;
    } else if (isPipeline) {
      unpaidRequestValue += ord.totalAmount;
      pendingOrders += 1;
    }

    if (ord.status === "in_production") {
      inProductionOrders += 1;
    }
    if (ord.status === "ready" || ord.status === "out_for_delivery") {
      readyOrders += 1;
    }

    const dayKey = ord.createdAt.slice(0, 10);
    const bucket = trendByDay.get(dayKey) ?? {
      date: dayKey,
      confirmedValue: 0,
      requestValue: 0,
      orderCount: 0,
    };
    bucket.orderCount += 1;
    if (isConfirmed) bucket.confirmedValue += ord.totalAmount;
    if (isPipeline) bucket.requestValue += ord.totalAmount;
    trendByDay.set(dayKey, bucket);
  }

  const lowStockProducts = invRows
    .filter((row) => {
      if (row.status === "archived") return false;
      const available = row.inv.quantityOnHand - row.inv.quantityReserved;
      return (
        row.availability === "out-of-stock" ||
        (row.availability === "in-stock" &&
          available <= row.inv.lowStockThreshold)
      );
    })
    .map((row) => ({
      productId: row.inv.productId,
      productName: row.productName,
      productSlug: row.productSlug,
      sku: row.inv.sku,
      onHand: row.inv.quantityOnHand,
      reserved: row.inv.quantityReserved,
      available: row.inv.quantityOnHand - row.inv.quantityReserved,
      threshold: row.inv.lowStockThreshold,
      availability: row.availability,
    }));

  // Top-selling / confirmed products from actual order_items
  const confirmedOrderIds = allOrders
    .filter((o) =>
      (CONFIRMED_ORDER_STATUSES as readonly string[]).includes(o.status),
    )
    .map((o) => o.id);

  let topProducts: {
    productName: string;
    productSlug: string;
    unitsOrdered: number;
    confirmedRevenue: number;
  }[] = [];

  if (confirmedOrderIds.length > 0) {
    const itemRows = await db
      .select({
        productName: orderItems.productName,
        productSlug: orderItems.productSlug,
        unitsOrdered: sql<number>`sum(${orderItems.quantity})`,
        confirmedRevenue: sql<number>`sum(${orderItems.lineTotal})`,
      })
      .from(orderItems)
      .where(inArray(orderItems.orderId, confirmedOrderIds))
      .groupBy(orderItems.productSlug, orderItems.productName)
      .orderBy(desc(sql`sum(${orderItems.lineTotal})`))
      .limit(5);

    topProducts = itemRows.map((r) => ({
      productName: r.productName,
      productSlug: r.productSlug,
      unitsOrdered: Number(r.unitsOrdered ?? 0),
      confirmedRevenue: Number(r.confirmedRevenue ?? 0),
    }));
  }

  const [recentAtelier, recentContacts] = await Promise.all([
    db
      .select()
      .from(atelierEnquiries)
      .orderBy(desc(atelierEnquiries.createdAt))
      .limit(5),
    db
      .select()
      .from(contactMessages)
      .orderBy(desc(contactMessages.createdAt))
      .limit(5),
  ]);

  const recentEnquiries = [
    ...recentAtelier.map((e) => ({
      id: e.id,
      type: "atelier" as const,
      reference: e.reference,
      name: e.name,
      email: e.email,
      summary: `${e.furnitureType} · ${e.materials}`,
      status: e.status,
      createdAt: e.createdAt,
      href: "/admin/enquiries/atelier",
    })),
    ...recentContacts.map((m) => ({
      id: m.id,
      type: "contact" as const,
      reference: m.reference,
      name: m.name,
      email: m.email,
      summary: m.subject,
      status: m.status,
      createdAt: m.createdAt,
      href: "/admin/enquiries/contact",
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 6);

  const publishedProductsCount = allProducts.filter(
    (p) => p.status === "published",
  ).length;

  return {
    metrics: {
      confirmedOrderValue,
      unpaidRequestValue,
      totalOrders: allOrders.length,
      pendingOrders,
      inProductionOrders,
      readyOrders,
      totalCustomers: totalCustomersRow[0]?.value ?? 0,
      totalProducts: allProducts.filter((p) => p.status !== "archived").length,
      publishedProducts: publishedProductsCount,
      lowStockCount: lowStockProducts.length,
    },
    recentOrders: allOrders.slice(0, 8).map((o) => ({
      id: o.id,
      reference: o.reference,
      customerName: `${o.customerFirstName} ${o.customerLastName}`,
      customerEmail: o.customerEmail,
      status: o.status,
      paymentStatus: o.paymentStatus,
      totalAmount: o.totalAmount,
      itemCount: o.itemCount,
      createdAt: o.createdAt,
    })),
    lowStockProducts: lowStockProducts.slice(0, 8),
    recentEnquiries,
    topProducts,
    salesTrends: Array.from(trendByDay.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14),
  };
}

export async function globalAdminSearch(query: string) {
  const term = query.trim();
  if (!term) {
    return { orders: [], products: [], customers: [], enquiries: [] };
  }
  const db = await getDb();
  const pattern = `%${term}%`;

  const [matchedOrders, matchedProducts, matchedCustomers, matchedAtelier] =
    await Promise.all([
      db
        .select({
          id: orders.id,
          reference: orders.reference,
          customerFirstName: orders.customerFirstName,
          customerLastName: orders.customerLastName,
          status: orders.status,
          totalAmount: orders.totalAmount,
        })
        .from(orders)
        .where(
          or(
            like(orders.reference, pattern),
            like(orders.customerEmail, pattern),
            like(orders.customerFirstName, pattern),
            like(orders.customerLastName, pattern),
          ),
        )
        .limit(5),
      db
        .select({
          id: products.id,
          name: products.name,
          slug: products.slug,
          sku: products.sku,
          basePrice: products.basePrice,
          status: products.status,
        })
        .from(products)
        .where(
          or(
            like(products.name, pattern),
            like(products.slug, pattern),
            like(products.sku, pattern),
          ),
        )
        .limit(5),
      db
        .select({
          id: customers.id,
          firstName: customers.firstName,
          lastName: customers.lastName,
          email: customers.email,
          phone: customers.phone,
        })
        .from(customers)
        .where(
          or(
            like(customers.email, pattern),
            like(customers.firstName, pattern),
            like(customers.lastName, pattern),
            like(customers.phone, pattern),
          ),
        )
        .limit(5),
      db
        .select({
          id: atelierEnquiries.id,
          reference: atelierEnquiries.reference,
          name: atelierEnquiries.name,
          furnitureType: atelierEnquiries.furnitureType,
          status: atelierEnquiries.status,
        })
        .from(atelierEnquiries)
        .where(
          or(
            like(atelierEnquiries.reference, pattern),
            like(atelierEnquiries.name, pattern),
            like(atelierEnquiries.email, pattern),
          ),
        )
        .limit(5),
    ]);

  return {
    orders: matchedOrders,
    products: matchedProducts,
    customers: matchedCustomers,
    enquiries: matchedAtelier,
  };
}
