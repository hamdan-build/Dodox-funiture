import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/server/auth/rbac";
import { handleApiError } from "@/lib/server/http";
import { escapeCsvCell } from "@/lib/server/security/sanitize";
import { listAdminOrders } from "@/lib/server/services/order.service";

export async function GET(request: Request) {
  try {
    await requirePermission("orders.export", request);
    const url = new URL(request.url);
    const orders = await listAdminOrders({
      status: url.searchParams.get("status") ?? undefined,
      query: url.searchParams.get("q") ?? undefined,
      from: url.searchParams.get("from") ?? undefined,
      to: url.searchParams.get("to") ?? undefined,
    });

    const headers = [
      "Reference",
      "Created At",
      "Status",
      "Payment Status",
      "Customer Name",
      "Email",
      "Phone",
      "Delivery Method",
      "Item Count",
      "Subtotal (RWF)",
      "Discount (RWF)",
      "Care Protection (RWF)",
      "VAT Included (RWF)",
      "Grand Total (RWF)",
      "Promo Code",
    ];

    const lines = [
      headers.join(","),
      ...orders.map((o) =>
        [
          escapeCsvCell(o.reference),
          escapeCsvCell(o.createdAt),
          escapeCsvCell(o.status),
          escapeCsvCell(o.paymentStatus),
          escapeCsvCell(`${o.customerFirstName} ${o.customerLastName}`),
          escapeCsvCell(o.customerEmail),
          escapeCsvCell(o.customerPhone),
          escapeCsvCell(o.deliveryMethod),
          escapeCsvCell(o.itemCount),
          escapeCsvCell(o.subtotalAmount),
          escapeCsvCell(o.discountAmount),
          escapeCsvCell(o.careProtectionAmount),
          escapeCsvCell(o.vatAmount),
          escapeCsvCell(o.totalAmount),
          escapeCsvCell(o.couponCode ?? ""),
        ].join(","),
      ),
    ];

    return new NextResponse(lines.join("\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="dodox-orders-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
