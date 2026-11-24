import { z } from "zod";
import { requirePermission } from "@/lib/server/auth/rbac";
import { handleApiError, jsonOk, parseJsonBody } from "@/lib/server/http";
import {
  adjustInventoryStock,
  createPurchaseOrder,
  listAdminInventory,
  receivePurchaseOrder,
  upsertSupplier,
} from "@/lib/server/services/inventory.service";

const inventoryActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("adjust_stock"),
    inventoryId: z.string().min(1),
    quantityChange: z.number().int(),
    adjustmentType: z.enum([
      "restock",
      "audit_correction",
      "showroom_transfer",
      "damage_writeoff",
      "settings_only",
    ]),
    reason: z.string().max(300).default("Inventory update"),
    notes: z.string().max(1200).optional().nullable(),
    lowStockThreshold: z.number().int().min(0).optional(),
    allowBackorder: z.boolean().optional(),
    warehouseLocation: z.string().max(160).optional(),
  }),
  z.object({
    action: z.literal("upsert_supplier"),
    id: z.string().optional(),
    name: z.string().min(2).max(160),
    code: z.string().max(40).optional(),
    contactName: z.string().max(120).optional().nullable(),
    email: z.string().max(160).optional().nullable(),
    phone: z.string().max(40).optional().nullable(),
    city: z.string().max(100).optional().nullable(),
    country: z.string().max(100).optional(),
    materialsSupplied: z.string().max(300).optional().nullable(),
    notes: z.string().max(1200).optional().nullable(),
    isActive: z.boolean().optional(),
  }),
  z.object({
    action: z.literal("create_purchase_order"),
    supplierId: z.string().min(1),
    expectedAt: z.string().max(60).optional().nullable(),
    notes: z.string().max(1200).optional().nullable(),
    items: z
      .array(
        z.object({
          inventoryId: z.string().min(1),
          quantity: z.number().int().min(1),
          unitCost: z.number().min(0),
        }),
      )
      .min(1),
  }),
  z.object({
    action: z.literal("receive_purchase_order"),
    purchaseOrderId: z.string().min(1),
  }),
]);

export async function GET(request: Request) {
  try {
    await requirePermission("inventory.manage", request);
    const url = new URL(request.url);
    const data = await listAdminInventory({
      query: url.searchParams.get("q") ?? undefined,
      filter: url.searchParams.get("filter") ?? undefined,
    });
    return jsonOk(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requirePermission("inventory.manage", request);
    const body = await parseJsonBody(request, inventoryActionSchema);

    if (body.action === "adjust_stock") {
      const result = await adjustInventoryStock({
        ...body,
        actorUserId: admin.id,
        actorEmail: admin.email,
      });
      return jsonOk(result);
    }

    if (body.action === "upsert_supplier") {
      const result = await upsertSupplier(body);
      return jsonOk(result);
    }

    if (body.action === "create_purchase_order") {
      const result = await createPurchaseOrder({
        supplierId: body.supplierId,
        expectedAt: body.expectedAt,
        notes: body.notes,
        items: body.items,
        actorUserId: admin.id,
      });
      return jsonOk(result);
    }

    const result = await receivePurchaseOrder({
      purchaseOrderId: body.purchaseOrderId,
      actorUserId: admin.id,
    });
    return jsonOk(result);
  } catch (error) {
    return handleApiError(error);
  }
}
