import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/server/auth/rbac";
import { handleApiError, jsonOk, parseJsonBody } from "@/lib/server/http";
import { recordActivityLog } from "@/lib/server/services/audit.service";
import {
  deleteAdminCollection,
  updateAdminCollection,
} from "@/lib/server/services/catalogue.service";
import { collectionUpsertSchema } from "@/lib/server/validation/catalogue";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requirePermission("categories.manage", request);
    const { id } = await context.params;
    const input = await parseJsonBody(request, collectionUpsertSchema);
    const collection = await updateAdminCollection(id, input);

    await recordActivityLog({
      actorUserId: admin.id,
      actorEmail: admin.email,
      action: "collection.update",
      resourceType: "collection",
      resourceId: id,
      summary: `Updated collection "${collection.name}"`,
      request,
    });

    revalidatePath("/");
    revalidatePath("/shop");

    return jsonOk({ collection });
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
    await deleteAdminCollection(id);

    await recordActivityLog({
      actorUserId: admin.id,
      actorEmail: admin.email,
      action: "collection.delete",
      resourceType: "collection",
      resourceId: id,
      summary: `Deleted collection ${id}`,
      request,
    });

    revalidatePath("/");
    revalidatePath("/shop");

    return jsonOk({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
