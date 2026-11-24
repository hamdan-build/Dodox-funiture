import { NextResponse } from "next/server";
import { unsubscribeNewsletterByToken } from "@/lib/server/services/enquiry.service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  try {
    await unsubscribeNewsletterByToken(token);
    return new NextResponse(
      `<!DOCTYPE html><html lang="en"><body style="font-family:Georgia,serif;background:#f7f2e8;color:#221e19;padding:48px 20px;text-align:center;">
        <h1 style="font-weight:400;">You have been unsubscribed.</h1>
        <p style="font-family:sans-serif;font-size:13px;color:#6f6453;">Your email address has been removed from the DODOX Atelier mailing list.</p>
        <p><a href="/" style="color:#7e5f3c;font-family:sans-serif;font-size:12px;">Return to DODOX Furniture</a></p>
      </body></html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  } catch {
    return new NextResponse(
      `<!DOCTYPE html><html lang="en"><body style="font-family:Georgia,serif;background:#f7f2e8;color:#221e19;padding:48px 20px;text-align:center;">
        <h1 style="font-weight:400;">Invalid or expired unsubscribe link.</h1>
        <p><a href="/" style="color:#7e5f3c;font-family:sans-serif;font-size:12px;">Return to DODOX Furniture</a></p>
      </body></html>`,
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }
}
