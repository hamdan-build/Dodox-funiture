import { z } from "zod";
import { requirePermission } from "@/lib/server/auth/rbac";
import { handleApiError, jsonOk, parseJsonBody } from "@/lib/server/http";
import { recordActivityLog } from "@/lib/server/services/audit.service";
import {
  deleteMediaAsset,
  updateMediaMetadata,
} from "@/lib/server/storage/r2";

const patchMediaSchema = z.object({
  altText: z.string().max(240).optional(),
  folder: z.string().max(40).optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requirePermission("media.manage", request);
    const { id } = await context.params;
    const body = await parseJsonBody(request, patchMediaSchema);
    const asset = await updateMediaMetadata(id, body);

    await recordActivityLog({
      actorUserId: admin.id,
      actorEmail: admin.email,
      action: "media.update",
      resourceType: "media_asset",
      resourceId: id,
      summary: `Updated metadata for ${asset.filename}`,
      request,
    });

    return jsonOk({ asset });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requirePermission("media.manage", request);
    const { id } = await context.params;
    const removed = await deleteMediaAsset(id);

    await recordActivityLog({
      actorUserId: admin.id,
      actorEmail: admin.email,
      action: "media.delete",
      resourceType: "media_asset",
      resourceId: id,
      summary: `Deleted media ${removed.filename} (${removed.objectKey})`,
      request,
    });

    return jsonOk({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
