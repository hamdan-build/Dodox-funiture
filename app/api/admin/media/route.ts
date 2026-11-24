import { requirePermission } from "@/lib/server/auth/rbac";
import { ValidationError } from "@/lib/server/errors";
import { handleApiError, jsonCreated, jsonOk } from "@/lib/server/http";
import { recordActivityLog } from "@/lib/server/services/audit.service";
import {
  listMediaAssets,
  MAX_ADMIN_UPLOAD_BYTES,
  uploadImageToR2,
} from "@/lib/server/storage/r2";

export async function GET(request: Request) {
  try {
    await requirePermission("media.manage", request);
    const url = new URL(request.url);
    const folder = url.searchParams.get("folder") ?? undefined;
    const query = url.searchParams.get("q") ?? undefined;
    const assets = await listMediaAssets({ folder, query });
    return jsonOk({ assets });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requirePermission("media.manage", request);
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw new ValidationError("Select an image file to upload.");
    }

    const folder = String(formData.get("folder") ?? "products");
    const altText = String(formData.get("altText") ?? "");

    const uploaded = await uploadImageToR2({
      file,
      folder,
      altText,
      uploadedByUserId: admin.id,
      maxBytes: MAX_ADMIN_UPLOAD_BYTES,
    });

    await recordActivityLog({
      actorUserId: admin.id,
      actorEmail: admin.email,
      action: "media.upload",
      resourceType: "media_asset",
      resourceId: uploaded.id,
      summary: `Uploaded media ${uploaded.filename} to R2 (${uploaded.objectKey})`,
      request,
    });

    return jsonCreated({ asset: uploaded });
  } catch (error) {
    return handleApiError(error);
  }
}
