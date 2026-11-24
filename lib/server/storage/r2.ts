import { desc, eq, like, or } from "drizzle-orm";
import { getDb } from "@/lib/server/db/client";
import { mediaAssets, productImages } from "@/lib/server/db/schema";
import { getRuntimeEnv } from "@/lib/server/env";
import { NotFoundError, ValidationError } from "@/lib/server/errors";
import { generateId, nowIso } from "@/lib/server/ids";
import {
  detectImageMimeFromBytes,
  extensionForImageMime,
  sanitizeFilename,
  sanitizeText,
} from "@/lib/server/security/sanitize";

export const MAX_ADMIN_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB
export const MAX_PUBLIC_UPLOAD_BYTES = 4 * 1024 * 1024; // 4 MB

export async function uploadImageToR2(input: {
  file: File;
  folder?: string;
  altText?: string;
  uploadedByUserId?: string | null;
  maxBytes?: number;
}) {
  const maxBytes = input.maxBytes ?? MAX_ADMIN_UPLOAD_BYTES;
  if (input.file.size <= 0) {
    throw new ValidationError("Uploaded file is empty.");
  }
  if (input.file.size > maxBytes) {
    const mb = Math.round(maxBytes / (1024 * 1024));
    throw new ValidationError(`File exceeds the ${mb} MB maximum upload size.`);
  }

  const buffer = await input.file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const detectedMime = detectImageMimeFromBytes(bytes);

  if (!detectedMime) {
    throw new ValidationError(
      "Unsupported file format. Only valid JPEG, PNG, WebP, or AVIF images are accepted.",
    );
  }

  const env = await getRuntimeEnv();
  if (!env.MEDIA_BUCKET) {
    throw new ValidationError(
      "Cloudflare R2 bucket binding (MEDIA_BUCKET) is not configured in this environment.",
    );
  }

  const cleanFolder =
    sanitizeText(input.folder || "products", 40)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-") || "products";
  const ext = extensionForImageMime(detectedMime);
  const safeBase = sanitizeFilename(
    input.file.name.replace(/\.[^.]+$/, ""),
  ).toLowerCase();
  const yearMonth = new Date().toISOString().slice(0, 7);
  const uniqueSuffix = crypto.randomUUID().slice(0, 8);
  const objectKey = `${cleanFolder}/${yearMonth}/${safeBase}-${uniqueSuffix}.${ext}`;

  await env.MEDIA_BUCKET.put(objectKey, bytes, {
    httpMetadata: {
      contentType: detectedMime,
      cacheControl: "public, max-age=31536000, immutable",
    },
    customMetadata: {
      originalFilename: sanitizeFilename(input.file.name),
    },
  });

  const publicUrl = env.MEDIA_BASE_URL
    ? `${env.MEDIA_BASE_URL}/${objectKey}`
    : `/api/media/${objectKey}`;

  const db = await getDb();
  const id = generateId("med");
  const now = nowIso();
  const altText = sanitizeText(input.altText ?? "", 240);

  await db.insert(mediaAssets).values({
    id,
    objectKey,
    publicUrl,
    filename: sanitizeFilename(input.file.name),
    mimeType: detectedMime,
    sizeBytes: bytes.byteLength,
    width: null,
    height: null,
    altText,
    folder: cleanFolder,
    storageDriver: "r2",
    uploadedByUserId: input.uploadedByUserId ?? null,
    createdAt: now,
  });

  return {
    id,
    objectKey,
    publicUrl,
    filename: sanitizeFilename(input.file.name),
    mimeType: detectedMime,
    sizeBytes: bytes.byteLength,
    altText,
    folder: cleanFolder,
    createdAt: now,
  };
}

export async function getR2ObjectStream(objectKey: string) {
  const cleanKey = objectKey.replace(/^\/+/, "");
  if (!cleanKey || cleanKey.includes("..")) {
    return null;
  }
  const env = await getRuntimeEnv();
  if (!env.MEDIA_BUCKET) {
    return null;
  }
  return env.MEDIA_BUCKET.get(cleanKey);
}

export async function listMediaAssets(params?: {
  folder?: string;
  query?: string;
}) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(mediaAssets)
    .orderBy(desc(mediaAssets.createdAt));

  const usageRows = await db
    .select({
      mediaId: productImages.mediaId,
      url: productImages.url,
      productId: productImages.productId,
    })
    .from(productImages);

  const q = params?.query?.trim().toLowerCase() ?? "";
  const folder = params?.folder?.trim() ?? "";

  return rows
    .filter((asset) => {
      if (folder && folder !== "all" && asset.folder !== folder) return false;
      if (q) {
        const hay = `${asset.filename} ${asset.altText} ${asset.objectKey}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .map((asset) => {
      const assignedCount = usageRows.filter(
        (u) => u.mediaId === asset.id || u.url === asset.publicUrl,
      ).length;
      return {
        ...asset,
        assignedCount,
      };
    });
}

export async function updateMediaMetadata(
  id: string,
  input: { altText?: string; folder?: string },
) {
  const db = await getDb();
  const existing = await db
    .select()
    .from(mediaAssets)
    .where(eq(mediaAssets.id, id))
    .limit(1);
  if (!existing[0]) {
    throw new NotFoundError("Media asset not found.");
  }

  const nextAlt =
    input.altText !== undefined
      ? sanitizeText(input.altText, 240)
      : existing[0].altText;
  const nextFolder =
    input.folder !== undefined
      ? sanitizeText(input.folder, 40).toLowerCase() || "general"
      : existing[0].folder;

  await db
    .update(mediaAssets)
    .set({
      altText: nextAlt,
      folder: nextFolder,
    })
    .where(eq(mediaAssets.id, id));

  return { ...existing[0], altText: nextAlt, folder: nextFolder };
}

export async function deleteMediaAsset(id: string) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(mediaAssets)
    .where(eq(mediaAssets.id, id))
    .limit(1);
  const asset = rows[0];
  if (!asset) {
    throw new NotFoundError("Media asset not found.");
  }

  const env = await getRuntimeEnv();
  if (env.MEDIA_BUCKET && asset.storageDriver === "r2") {
    await env.MEDIA_BUCKET.delete(asset.objectKey).catch((err) => {
      console.warn("[DODOX R2 Delete Warning]", err);
    });
  }

  // Detach from any product_images referencing mediaId or publicUrl
  await db
    .delete(productImages)
    .where(
      or(
        eq(productImages.mediaId, id),
        like(productImages.url, asset.publicUrl),
      ),
    );

  await db.delete(mediaAssets).where(eq(mediaAssets.id, id));
  return asset;
}
