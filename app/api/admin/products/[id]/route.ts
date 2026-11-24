import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/server/auth/rbac";
import { handleApiError, jsonOk, parseJsonBody } from "@/lib/server/http";
import { recordActivityLog } from "@/lib/server/services/audit.service";
import {
  deleteOrArchiveAdminProduct,
  getAdminProductById,
  listAdminCategories,
  listAdminCollections,
  updateAdminProduct,
} from "@/lib/server/services/catalogue.service";
import { productUpsertSchema } from "@/lib/server/validation/catalogue";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/server/db/client";
import { products } from "@/lib/server/db/schema";
import { nowIso } from "@/lib/server/ids";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requirePermission("products.read", request);
    const { id } = await context.params;
    const [product, categories, collections] = await Promise.all([
      getAdminProductById(id),
      listAdminCategories(),
      listAdminCollections(),
    ]);
    return jsonOk({ product, categories, collections });
  } catch (error) {
    return handleApiError(error);
  }
}

const quickStatusSchema = z.object({
  quickStatusOnly: z.literal(true),
  status: z.enum(["draft", "published", "archived"]),
});

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requirePermission("products.update", request);
    const { id } = await context.params;
    const before = await getAdminProductById(id);
    const input = await parseJsonBody(request, productUpsertSchema);
    const updated = await updateAdminProduct(id, input);

    await recordActivityLog({
      actorUserId: admin.id,
      actorEmail: admin.email,
      action: "product.update",
      resourceType: "product",
      resourceId: id,
      summary: `Updated product "${updated.name}"`,
      before: { price: before.price, status: before.status },
      after: { price: updated.price, status: updated.status },
      request,
    });

    revalidatePath("/");
    revalidatePath("/shop");
    revalidatePath(`/shop/${before.slug}`);
    revalidatePath(`/shop/${updated.slug}`);

    return jsonOk({ product: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requirePermission("products.update", request);
    const { id } = await context.params;
    const body = await parseJsonBody(request, quickStatusSchema);
    const db = await getDb();
    await db
      .update(products)
      .set({ status: body.status, updatedAt: nowIso() })
      .where(eq(products.id, id));
    const updated = await getAdminProductById(id);

    await recordActivityLog({
      actorUserId: admin.id,
      actorEmail: admin.email,
      action: "product.status_change",
      resourceType: "product",
      resourceId: id,
      summary: `Set product "${updated.name}" status to ${body.status}`,
      request,
    });

    revalidatePath("/");
    revalidatePath("/shop");
    revalidatePath(`/shop/${updated.slug}`);

    return jsonOk({ product: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requirePermission("products.delete", request);
    const { id } = await context.params;
    const url = new URL(request.url);
    const mode = url.searchParams.get("mode") === "delete" ? "delete" : "archive";
    const result = await deleteOrArchiveAdminProduct(id, mode);

    await recordActivityLog({
      actorUserId: admin.id,
      actorEmail: admin.email,
      action: `product.${result.action}`,
      resourceType: "product",
      resourceId: id,
      summary: `${result.action === "deleted" ? "Deleted" : "Archived"} product "${result.name}"`,
      request,
    });

    revalidatePath("/");
    revalidatePath("/shop");

    return jsonOk(result);
  } catch (error) {
    return handleApiError(error);
  }
}
