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
      limit: 10,
      windowSeconds: 600,
      message: "Upload limit reached. Please wait a few minutes before adding more files.",
    });

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw new ValidationError("Attach a valid reference image.");
    }

    const uploaded = await uploadImageToR2({
      file,
      folder: "atelier-references",
      altText: "Client atelier reference image",
      uploadedByUserId: null,
      maxBytes: MAX_PUBLIC_UPLOAD_BYTES,
    });

    return jsonCreated({
      url: uploaded.publicUrl,
      name: uploaded.filename,
      id: uploaded.id,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
