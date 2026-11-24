import { NextResponse } from "next/server";
import { getR2ObjectStream } from "@/lib/server/storage/r2";

export async function GET(
  _request: Request,
  context: { params: Promise<{ key: string[] }> },
) {
  const { key } = await context.params;
  const objectKey = key.join("/");

  const object = await getR2ObjectStream(objectKey);
  if (!object || !object.body) {
    return new NextResponse("Media asset not found", { status: 404 });
  }

  const contentType =
    object.httpMetadata?.contentType || "application/octet-stream";

  return new NextResponse(object.body as ReadableStream, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      ETag: object.httpEtag,
    },
  });
}
