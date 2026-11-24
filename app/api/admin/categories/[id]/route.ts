import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/server/auth/rbac";
import { handleApiError, jsonOk, parseJsonBody } from "@/lib/server/http";
import { recordActivityLog } from "@/lib/server/services/audit.service";
import {
  deleteAdminCategory,
  updateAdminCategory,
} from "@/lib/server/services/catalogue.service";
import { categoryUpsertSchema } from "@/lib/server/validation/catalogue";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requirePermission("categories.manage", request);
    const { id } = await context.params;
    const input = await parseJsonBody(request, categoryUpsertSchema);
    const category = await updateAdminCategory(id, input);

    await recordActivityLog({
      actorUserId: admin.id,
      actorEmail: admin.email,
      action: "category.update",
      resourceType: "category",
      resourceId: id,
      summary: `Updated category "${category.name}"`,
      request,
    });

    revalidatePath("/");
    revalidatePath("/shop");

    return jsonOk({ category });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requirePermission("categories.manage", request);
    const { id } = await context.params;
    await deleteAdminCategory(id);

    await recordActivityLog({
      actorUserId: admin.id,
      actorEmail: admin.email,
      action: "category.delete",
      resourceType: "category",
      resourceId: id,
      summary: `Deleted category ${id}`,
      request,
    });

    revalidatePath("/");
    revalidatePath("/shop");

    return jsonOk({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
