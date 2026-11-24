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
  createAdminCategory,
  listAdminCategories,
} from "@/lib/server/services/catalogue.service";
import { categoryUpsertSchema } from "@/lib/server/validation/catalogue";

export async function GET(request: Request) {
  try {
    await requirePermission("products.read", request);
    const categories = await listAdminCategories();
    return jsonOk({ categories });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requirePermission("categories.manage", request);
    const input = await parseJsonBody(request, categoryUpsertSchema);
    const category = await createAdminCategory(input);

    await recordActivityLog({
      actorUserId: admin.id,
      actorEmail: admin.email,
      action: "category.create",
      resourceType: "category",
      resourceId: category.id,
      summary: `Created category "${category.name}"`,
      request,
    });

    revalidatePath("/");
    revalidatePath("/shop");

    return jsonCreated({ category });
  } catch (error) {
    return handleApiError(error);
  }
}
