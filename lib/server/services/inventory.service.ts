import { desc, eq } from "drizzle-orm";
import { getDb, type DbClient } from "@/lib/server/db/client";
import { ensureSeeded } from "@/lib/server/db/seed";
import {
  inventory,
  inventoryMovements,
  products,
  purchaseOrders,
  stockAdjustments,
  suppliers,
  users,
} from "@/lib/server/db/schema";
import { NotFoundError, ValidationError } from "@/lib/server/errors";
import { generateId, nowIso, slugify } from "@/lib/server/ids";
import {
  sanitizeMultilineText,
  sanitizeText,
} from "@/lib/server/security/sanitize";
import { recordActivityLog } from "@/lib/server/services/audit.service";

async function resolveValidActorId(
  db: DbClient,
  actorUserId?: string | null,
): Promise<string | null> {
  if (!actorUserId) return null;
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, actorUserId))
    .limit(1);
  return rows[0]?.id ?? null;
}

export async function listAdminInventory(params: {
  query?: string;
  filter?: string;
}) {
  const db = await getDb();
  await ensureSeeded(db);
  const invRows = await db
    .select({
      id: inventory.id,
      productId: inventory.productId,
      variantId: inventory.variantId,
      sku: inventory.sku,
      quantityOnHand: inventory.quantityOnHand,
      quantityReserved: inventory.quantityReserved,
      lowStockThreshold: inventory.lowStockThreshold,
      allowBackorder: inventory.allowBackorder,
      warehouseLocation: inventory.warehouseLocation,
      updatedAt: inventory.updatedAt,
      productName: products.name,
      productSlug: products.slug,
      productCategory: products.categoryId,
      productAvailability: products.availability,
      productPrice: products.basePrice,
    })
    .from(inventory)
    .innerJoin(products, eq(inventory.productId, products.id))
    .orderBy(products.name);

  const q = params.query?.trim().toLowerCase() ?? "";
  const filter = params.filter?.trim() ?? "all";

  const enriched = invRows.map((row) => {
    const available = Math.max(0, row.quantityOnHand - row.quantityReserved);
    const isOut = available === 0;
    const isLow = available > 0 && available <= row.lowStockThreshold;
    return {
      ...row,
      available,
      stockHealth: isOut ? "out_of_stock" : isLow ? "low_stock" : "healthy",
    };
  });

  const filtered = enriched.filter((item) => {
    if (filter === "low" && item.stockHealth !== "low_stock") return false;
    if (filter === "out" && item.stockHealth !== "out_of_stock") return false;
    if (filter === "reserved" && item.quantityReserved <= 0) return false;
    if (q) {
      return (
        item.sku.toLowerCase().includes(q) ||
        item.productName.toLowerCase().includes(q) ||
        item.warehouseLocation.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const movementRows = await db
    .select({
      id: inventoryMovements.id,
      inventoryId: inventoryMovements.inventoryId,
      productId: inventoryMovements.productId,
      movementType: inventoryMovements.movementType,
      quantityDelta: inventoryMovements.quantityDelta,
      previousOnHand: inventoryMovements.previousOnHand,
      newOnHand: inventoryMovements.newOnHand,
      previousReserved: inventoryMovements.previousReserved,
      newReserved: inventoryMovements.newReserved,
      referenceType: inventoryMovements.referenceType,
      referenceId: inventoryMovements.referenceId,
      reason: inventoryMovements.reason,
      createdAt: inventoryMovements.createdAt,
      productName: products.name,
      sku: inventory.sku,
      actorEmail: users.email,
    })
    .from(inventoryMovements)
    .innerJoin(inventory, eq(inventoryMovements.inventoryId, inventory.id))
    .innerJoin(products, eq(inventoryMovements.productId, products.id))
    .leftJoin(users, eq(inventoryMovements.actorUserId, users.id))
    .orderBy(desc(inventoryMovements.createdAt))
    .limit(40);

  const supplierRows = await db
    .select()
    .from(suppliers)
    .orderBy(suppliers.name);

  const poRows = await db
    .select({
      id: purchaseOrders.id,
      poNumber: purchaseOrders.poNumber,
      supplierId: purchaseOrders.supplierId,
      supplierName: suppliers.name,
      status: purchaseOrders.status,
      currency: purchaseOrders.currency,
      totalAmount: purchaseOrders.totalAmount,
      expectedAt: purchaseOrders.expectedAt,
      receivedAt: purchaseOrders.receivedAt,
      itemsJson: purchaseOrders.itemsJson,
      notes: purchaseOrders.notes,
      createdAt: purchaseOrders.createdAt,
    })
    .from(purchaseOrders)
    .innerJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
    .orderBy(desc(purchaseOrders.createdAt))
    .limit(30);

  const summary = {
    totalSkus: enriched.length,
    lowStockCount: enriched.filter((i) => i.stockHealth === "low_stock").length,
    outOfStockCount: enriched.filter((i) => i.stockHealth === "out_of_stock")
      .length,
    totalOnHand: enriched.reduce((sum, i) => sum + i.quantityOnHand, 0),
    totalReserved: enriched.reduce((sum, i) => sum + i.quantityReserved, 0),
  };

  return {
    summary,
    items: filtered,
    movements: movementRows,
    suppliers: supplierRows,
    purchaseOrders: poRows.map((po) => ({
      ...po,
      items: (() => {
        try {
          return JSON.parse(po.itemsJson) as {
            inventoryId: string;
            sku: string;
            productName: string;
            quantity: number;
            unitCost: number;
          }[];
        } catch {
          return [];
        }
      })(),
    })),
  };
}

export async function adjustInventoryStock(params: {
  inventoryId: string;
  quantityChange: number;
  adjustmentType:
    | "restock"
    | "audit_correction"
    | "showroom_transfer"
    | "damage_writeoff"
    | "settings_only";
  reason: string;
  notes?: string | null;
  lowStockThreshold?: number;
  allowBackorder?: boolean;
  warehouseLocation?: string;
  actorUserId?: string | null;
  actorEmail?: string | null;
}) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(inventory)
    .where(eq(inventory.id, params.inventoryId))
    .limit(1);
  const inv = rows[0];
  if (!inv) {
    throw new NotFoundError("Inventory record not found.");
  }

  const delta = Math.trunc(params.quantityChange || 0);
  const newOnHand = inv.quantityOnHand + delta;
  if (newOnHand < 0) {
    throw new ValidationError(
      `Cannot reduce on-hand stock below 0 (currently ${inv.quantityOnHand}).`,
    );
  }

  const reason = sanitizeText(params.reason);
  if (delta !== 0 && reason.length < 3) {
    throw new ValidationError("Please provide a brief reason for the stock adjustment.");
  }

  const now = nowIso();
  const actorId = await resolveValidActorId(db, params.actorUserId);
  const nextThreshold =
    params.lowStockThreshold !== undefined
      ? Math.max(0, Math.trunc(params.lowStockThreshold))
      : inv.lowStockThreshold;
  const nextAllowBackorder =
    params.allowBackorder !== undefined
      ? params.allowBackorder
      : inv.allowBackorder;
  const nextLocation = params.warehouseLocation
    ? sanitizeText(params.warehouseLocation)
    : inv.warehouseLocation;

  await db
    .update(inventory)
    .set({
      quantityOnHand: newOnHand,
      lowStockThreshold: nextThreshold,
      allowBackorder: nextAllowBackorder,
      warehouseLocation: nextLocation,
      updatedAt: now,
    })
    .where(eq(inventory.id, inv.id));

  let adjustmentReference: string | null = null;
  if (delta !== 0) {
    const dateStamp = now.slice(0, 10).replace(/-/g, "");
    const suffix = Math.floor(1000 + Math.random() * 9000);
    adjustmentReference = `ADJ-${dateStamp}-${suffix}`;

    await db.insert(stockAdjustments).values({
      id: generateId("sadj"),
      adjustmentReference,
      inventoryId: inv.id,
      productId: inv.productId,
      variantId: inv.variantId,
      adjustmentType: params.adjustmentType,
      quantityBefore: inv.quantityOnHand,
      quantityChange: delta,
      quantityAfter: newOnHand,
      reason,
      notes: params.notes ? sanitizeMultilineText(params.notes) : null,
      createdByUserId: actorId,
      createdAt: now,
    });

    await db.insert(inventoryMovements).values({
      id: generateId("imov"),
      inventoryId: inv.id,
      productId: inv.productId,
      variantId: inv.variantId,
      movementType: params.adjustmentType,
      quantityDelta: delta,
      previousOnHand: inv.quantityOnHand,
      newOnHand,
      previousReserved: inv.quantityReserved,
      newReserved: inv.quantityReserved,
      referenceType: "stock_adjustment",
      referenceId: adjustmentReference,
      reason,
      actorUserId: actorId,
      createdAt: now,
    });
  }

  await recordActivityLog({
    actorUserId: actorId,
    actorEmail: params.actorEmail ?? null,
    action: "inventory.adjust",
    resourceType: "inventory",
    resourceId: inv.id,
    summary:
      delta !== 0
        ? `Adjusted SKU ${inv.sku} by ${delta > 0 ? `+${delta}` : delta} (${inv.quantityOnHand} → ${newOnHand})`
        : `Updated stock settings for SKU ${inv.sku}`,
    after: {
      sku: inv.sku,
      quantityOnHand: newOnHand,
      lowStockThreshold: nextThreshold,
      allowBackorder: nextAllowBackorder,
      adjustmentReference,
    },
  });

  return {
    id: inv.id,
    sku: inv.sku,
    previousOnHand: inv.quantityOnHand,
    newOnHand,
    quantityReserved: inv.quantityReserved,
    adjustmentReference,
  };
}

export async function upsertSupplier(params: {
  id?: string;
  name: string;
  code?: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  country?: string;
  materialsSupplied?: string | null;
  notes?: string | null;
  isActive?: boolean;
}) {
  const db = await getDb();
  const name = sanitizeText(params.name);
  if (name.length < 2) {
    throw new ValidationError("Supplier name is required.");
  }
  const code = (
    params.code ? sanitizeText(params.code) : slugify(name)
  ).toUpperCase();
  const now = nowIso();

  if (params.id) {
    await db
      .update(suppliers)
      .set({
        name,
        code,
        contactName: params.contactName
          ? sanitizeText(params.contactName)
          : null,
        email: params.email ? sanitizeText(params.email) : null,
        phone: params.phone ? sanitizeText(params.phone) : null,
        city: params.city ? sanitizeText(params.city) : null,
        country: params.country
          ? sanitizeText(params.country)
          : "Rwanda",
        materialsSupplied: params.materialsSupplied
          ? sanitizeText(params.materialsSupplied)
          : null,
        notes: params.notes ? sanitizeMultilineText(params.notes) : null,
        isActive: params.isActive ?? true,
        updatedAt: now,
      })
      .where(eq(suppliers.id, params.id));
    return { id: params.id, code, name };
  }

  const id = generateId("sup");
  await db.insert(suppliers).values({
    id,
    name,
    code,
    contactName: params.contactName
      ? sanitizeText(params.contactName)
      : null,
    email: params.email ? sanitizeText(params.email) : null,
    phone: params.phone ? sanitizeText(params.phone) : null,
    city: params.city ? sanitizeText(params.city) : null,
    country: params.country ? sanitizeText(params.country) : "Rwanda",
    materialsSupplied: params.materialsSupplied
      ? sanitizeText(params.materialsSupplied)
      : null,
    notes: params.notes ? sanitizeMultilineText(params.notes) : null,
    isActive: params.isActive ?? true,
    createdAt: now,
    updatedAt: now,
  });

  return { id, code, name };
}

export async function createPurchaseOrder(params: {
  supplierId: string;
  expectedAt?: string | null;
  notes?: string | null;
  items: {
    inventoryId: string;
    quantity: number;
    unitCost: number;
  }[];
  actorUserId?: string | null;
}) {
  const db = await getDb();
  if (!params.items.length) {
    throw new ValidationError("Purchase order requires at least one SKU line.");
  }

  const supRows = await db
    .select()
    .from(suppliers)
    .where(eq(suppliers.id, params.supplierId))
    .limit(1);
  if (!supRows[0]) {
    throw new NotFoundError("Supplier not found.");
  }

  const resolvedLines: {
    inventoryId: string;
    sku: string;
    productName: string;
    quantity: number;
    unitCost: number;
  }[] = [];

  let totalAmount = 0;
  for (const line of params.items) {
    const qty = Math.max(1, Math.trunc(line.quantity));
    const cost = Math.max(0, Math.round(line.unitCost));
    const invRow = await db
      .select({
        id: inventory.id,
        sku: inventory.sku,
        productName: products.name,
      })
      .from(inventory)
      .innerJoin(products, eq(inventory.productId, products.id))
      .where(eq(inventory.id, line.inventoryId))
      .limit(1);
    if (!invRow[0]) {
      throw new ValidationError(`Unknown inventory item ${line.inventoryId}`);
    }
    resolvedLines.push({
      inventoryId: invRow[0].id,
      sku: invRow[0].sku,
      productName: invRow[0].productName,
      quantity: qty,
      unitCost: cost,
    });
    totalAmount += qty * cost;
  }

  const now = nowIso();
  const actorId = await resolveValidActorId(db, params.actorUserId);
  const poNumber = `PO-${now.slice(0, 4)}-${Math.floor(10000 + Math.random() * 90000)}`;
  const id = generateId("po");

  await db.insert(purchaseOrders).values({
    id,
    poNumber,
    supplierId: params.supplierId,
    status: "ordered",
    currency: "RWF",
    totalAmount,
    expectedAt: params.expectedAt || null,
    itemsJson: JSON.stringify(resolvedLines),
    notes: params.notes ? sanitizeMultilineText(params.notes) : null,
    createdByUserId: actorId,
    createdAt: now,
    updatedAt: now,
  });

  return { id, poNumber, totalAmount };
}

export async function receivePurchaseOrder(params: {
  purchaseOrderId: string;
  actorUserId?: string | null;
}) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(purchaseOrders)
    .where(eq(purchaseOrders.id, params.purchaseOrderId))
    .limit(1);
  const po = rows[0];
  if (!po) {
    throw new NotFoundError("Purchase order not found.");
  }
  if (po.status === "received") {
    throw new ValidationError("Purchase order has already been received into stock.");
  }

  let items: {
    inventoryId: string;
    sku: string;
    productName: string;
    quantity: number;
    unitCost: number;
  }[] = [];
  try {
    items = JSON.parse(po.itemsJson);
  } catch {
    items = [];
  }

  const now = nowIso();
  const actorId = await resolveValidActorId(db, params.actorUserId);

  for (const line of items) {
    const invRows = await db
      .select()
      .from(inventory)
      .where(eq(inventory.id, line.inventoryId))
      .limit(1);
    const inv = invRows[0];
    if (!inv) continue;

    const newOnHand = inv.quantityOnHand + line.quantity;
    await db
      .update(inventory)
      .set({ quantityOnHand: newOnHand, updatedAt: now })
      .where(eq(inventory.id, inv.id));

    await db.insert(inventoryMovements).values({
      id: generateId("imov"),
      inventoryId: inv.id,
      productId: inv.productId,
      variantId: inv.variantId,
      movementType: "purchase_order_received",
      quantityDelta: line.quantity,
      previousOnHand: inv.quantityOnHand,
      newOnHand,
      previousReserved: inv.quantityReserved,
      newReserved: inv.quantityReserved,
      referenceType: "purchase_order",
      referenceId: po.poNumber,
      reason: `Received ${po.poNumber}`,
      actorUserId: actorId,
      createdAt: now,
    });
  }

  await db
    .update(purchaseOrders)
    .set({
      status: "received",
      receivedAt: now,
      updatedAt: now,
    })
    .where(eq(purchaseOrders.id, po.id));

  return { id: po.id, poNumber: po.poNumber, status: "received" };
}
