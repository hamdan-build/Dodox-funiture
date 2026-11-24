import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/server/auth/rbac";
import { handleApiError, jsonOk } from "@/lib/server/http";
import {
  exportNewsletterCsv,
  listAdminNewsletterSubscribers,
} from "@/lib/server/services/enquiry.service";

export async function GET(request: Request) {
  try {
    await requirePermission("enquiries.manage", request);
    const url = new URL(request.url);
    if (url.searchParams.get("export") === "csv") {
      const csv = await exportNewsletterCsv();
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="dodox-newsletter-subscribers.csv"`,
        },
      });
    }

    const items = await listAdminNewsletterSubscribers({
      status: url.searchParams.get("status") ?? undefined,
      query: url.searchParams.get("q") ?? undefined,
    });
    return jsonOk({ items });
  } catch (error) {
    return handleApiError(error);
  }
}
