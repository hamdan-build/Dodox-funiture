import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/server/auth/rbac";
import {
  handleApiError,
  jsonCreated,
  jsonOk,
  parseJsonBody,
} from "@/lib/server/http";
import { recordActivityLog } from "@/lib/server/services/audit.service";
import {
  createAdminProduct,
  listAdminCategories,
  listAdminCollections,
  listAdminProducts,
} from "@/lib/server/services/catalogue.service";
import { productUpsertSchema } from "@/lib/server/validation/catalogue";

export async function GET(request: Request) {
  try {
    await requirePermission("products.read", request);
    const url = new URL(request.url);
    const [products, categories, collections] = await Promise.all([
      listAdminProducts({
        status: url.searchParams.get("status") ?? undefined,
        category: url.searchParams.get("category") ?? undefined,
        availability: url.searchParams.get("availability") ?? undefined,
        query: url.searchParams.get("q") ?? undefined,
      }),
      listAdminCategories(),
      listAdminCollections(),
    ]);
    return jsonOk({ products, categories, collections });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requirePermission("products.create", request);
    const input = await parseJsonBody(request, productUpsertSchema);
    const product = await createAdminProduct(input);

    await recordActivityLog({
      actorUserId: admin.id,
      actorEmail: admin.email,
      action: "product.create",
      resourceType: "product",
      resourceId: product.id,
      summary: `Created product "${product.name}" (${product.sku})`,
      after: { id: product.id, slug: product.slug, price: product.price },
      request,
    });

    revalidatePath("/");
    revalidatePath("/shop");
    revalidatePath(`/shop/${product.slug}`);

    return jsonCreated({ product });
  } catch (error) {
    return handleApiError(error);
  }
}
