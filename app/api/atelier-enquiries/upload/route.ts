import { ValidationError } from "@/lib/server/errors";
import {
  getHashedClientIp,
  handleApiError,
  jsonCreated,
} from "@/lib/server/http";
import { enforceRateLimit } from "@/lib/server/security/rate-limit";
import {
  MAX_PUBLIC_UPLOAD_BYTES,
  uploadImageToR2,
} from "@/lib/server/storage/r2";

export async function POST(request: Request) {
  try {
    const ipHash = await getHashedClientIp(request);
    await enforceRateLimit({
      namespace: "atelier_upload",
      identifier: ipHash,
      limit: 12,
      windowSeconds: 900,
    });

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw new ValidationError("Attach a valid image file.");
    }

    const asset = await uploadImageToR2({
      file,
      folder: "atelier-references",
      altText: "Atelier client reference photo",
      maxBytes: MAX_PUBLIC_UPLOAD_BYTES,
    });

    return jsonCreated({
      url: asset.publicUrl,
      name: file.name,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
