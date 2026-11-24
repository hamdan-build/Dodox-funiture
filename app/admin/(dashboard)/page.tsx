import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  Clock,
  Hammer,
  Package,
  Plus,
  ShoppingBag,
  Users,
} from "lucide-react";
import {
  AdminEmptyState,
  AdminPageHeader,
  adminPrimaryBtn,
  adminSecondaryBtn,
  MetricCard,
  StatusBadge,
} from "@/components/admin/ui";
import { getDashboardOverview } from "@/lib/server/services/dashboard.service";
import { formatDate, formatRwf } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const data = await getDashboardOverview();
  const { metrics } = data;

  return (
    <div>
      <AdminPageHeader
        eyebrow="Atelier Command Centre"
        title="Executive Dashboard"
        description="Real-time commercial metrics from Cloudflare D1. Confirmed order value is strictly separated from unconfirmed order requests (no online payment is collected in Release 1)."
        actions={
          <>
            <Link href="/admin/orders" className={adminSecondaryBtn}>
              Review Orders
            </Link>
            <Link href="/admin/products/new" className={adminPrimaryBtn}>
              <Plus size={13} />
              New Piece
            </Link>
          </>
        }
      />

      {/* Primary KPI Grid */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Confirmed Order Value"
          value={formatRwf(metrics.confirmedOrderValue)}
          subtext="Confirmed, in-production, ready & delivered orders"
          icon={<CheckCircle2 size={16} />}
          accent="bronze"
        />
        <MetricCard
          label="Unpaid Request Pipeline"
          value={formatRwf(metrics.unpaidRequestValue)}
          subtext={`${metrics.pendingOrders} awaiting concierge confirmation`}
          icon={<Clock size={16} />}
        />
        <MetricCard
          label="Total Order Requests"
          value={metrics.totalOrders}
          subtext={`${metrics.inProductionOrders} in production · ${metrics.readyOrders} ready`}
          icon={<ShoppingBag size={16} />}
        />
        <MetricCard
          label="Catalogue & Stock"
          value={`${metrics.publishedProducts} / ${metrics.totalProducts}`}
          subtext={`${metrics.lowStockCount} low/out-of-stock alert${metrics.lowStockCount === 1 ? "" : "s"} · ${metrics.totalCustomers} client${metrics.totalCustomers === 1 ? "" : "s"}`}
          icon={<Package size={16} />}
          accent={metrics.lowStockCount > 0 ? "warning" : "default"}
        />
      </div>

      {/* Operational Status Strip */}
      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <div className="flex items-center justify-between border border-line bg-parchment px-4 py-3">
          <span className="text-[11px] text-muted">Pending Review</span>
          <span className="font-display text-xl tabular-nums text-ink">
            {metrics.pendingOrders}
          </span>
        </div>
        <div className="flex items-center justify-between border border-line bg-parchment px-4 py-3">
          <span className="flex items-center gap-1.5 text-[11px] text-muted">
            <Hammer size={12} className="text-bronze" /> In Production
          </span>
          <span className="font-display text-xl tabular-nums text-ink">
            {metrics.inProductionOrders}
          </span>
        </div>
        <div className="flex items-center justify-between border border-line bg-parchment px-4 py-3">
          <span className="flex items-center gap-1.5 text-[11px] text-muted">
            <Boxes size={12} className="text-bronze" /> Ready / Dispatch
          </span>
          <span className="font-display text-xl tabular-nums text-ink">
            {metrics.readyOrders}
          </span>
        </div>
        <div className="flex items-center justify-between border border-line bg-parchment px-4 py-3">
          <span className="flex items-center gap-1.5 text-[11px] text-muted">
            <Users size={12} className="text-bronze" /> Registered Clients
          </span>
          <span className="font-display text-xl tabular-nums text-ink">
            {metrics.totalCustomers}
          </span>
        </div>
      </div>

      {/* Main Two-Column Grid */}
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        {/* Recent Order Requests */}
        <section className="border border-line bg-parchment">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <h2 className="font-display text-2xl text-ink">
                Recent Order Requests
              </h2>
              <p className="text-[11px] text-muted">
                Latest storefront checkout requests stored in D1
              </p>
            </div>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-bronze hover:underline"
            >
              All orders <ArrowRight size={11} />
            </Link>
          </div>

          {data.recentOrders.length === 0 ? (
            <div className="p-5">
              <AdminEmptyState
                title="No order requests submitted yet"
                description="When clients submit an order request on the storefront checkout, it appears here immediately with a DODOX-YYYY-NNNNNN reference."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead className="border-b border-line bg-shell/50 text-[9.5px] uppercase tracking-[0.14em] text-muted">
                  <tr>
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-right">Placed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {data.recentOrders.map((ord) => (
                    <tr
                      key={ord.id}
                      className="transition-colors hover:bg-ivory/70"
                    >
                      <td className="px-4 py-3 font-medium">
                        <Link
                          href={`/admin/orders/${ord.id}`}
                          className="text-ink hover:text-bronze"
                        >
                          {ord.reference}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-ink">{ord.customerName}</p>
                        <p className="text-[10.5px] text-muted">
                          {ord.customerEmail}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={ord.status} />
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-ink">
                        {formatRwf(ord.totalAmount)}
                      </td>
                      <td className="px-4 py-3 text-right text-[11px] text-muted">
                        {formatDate(ord.createdAt, {
                          day: "numeric",
                          month: "short",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Low Stock Alerts & Recent Enquiries */}
        <div className="space-y-6">
          <section className="border border-line bg-parchment">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div className="flex items-center gap-2">
                <AlertCircle size={15} className="text-bronze" />
                <h2 className="font-display text-xl text-ink">
                  Low-Stock Watchlist
                </h2>
              </div>
              <Link
                href="/admin/inventory"
                className="text-[10px] uppercase tracking-[0.14em] text-bronze hover:underline"
              >
                Manage stock
              </Link>
            </div>
            {data.lowStockProducts.length === 0 ? (
              <p className="p-5 text-[12px] text-muted">
                All in-stock showroom pieces are above threshold.
              </p>
            ) : (
              <ul className="divide-y divide-line/60">
                {data.lowStockProducts.map((item) => (
                  <li
                    key={item.productId}
                    className="flex items-center justify-between gap-3 px-5 py-3 text-[12px]"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/admin/products/${item.productId}`}
                        className="block truncate font-medium text-ink hover:text-bronze"
                      >
                        {item.productName}
                      </Link>
                      <p className="text-[10.5px] text-muted">
                        SKU {item.sku} · Threshold {item.threshold}
                      </p>
                    </div>
                    <span className="shrink-0 bg-[#f5deda] px-2.5 py-1 text-[10px] font-medium tabular-nums text-[#8b3528]">
                      {item.available} avail.
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="border border-line bg-parchment">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-display text-xl text-ink">
                Recent Concierge Enquiries
              </h2>
              <Link
                href="/admin/enquiries/atelier"
                className="text-[10px] uppercase tracking-[0.14em] text-bronze hover:underline"
              >
                Open inbox
              </Link>
            </div>
            {data.recentEnquiries.length === 0 ? (
              <p className="p-5 text-[12px] text-muted">
                No Atelier commissions or contact messages received yet.
              </p>
            ) : (
              <ul className="divide-y divide-line/60">
                {data.recentEnquiries.map((enq) => (
                  <li key={enq.id} className="px-5 py-3 text-[12px]">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={enq.href}
                        className="font-medium text-ink hover:text-bronze"
                      >
                        {enq.name} ·{" "}
                        <span className="text-muted">{enq.reference}</span>
                      </Link>
                      <StatusBadge status={enq.status} />
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-muted">
                      {enq.type === "atelier" ? "Atelier Brief: " : "Contact: "}
                      {enq.summary}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {/* Top Confirmed Pieces & Period Activity */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="border border-line bg-parchment p-5">
          <h2 className="font-display text-xl text-ink">
            Top Confirmed Pieces
          </h2>
          <p className="mt-0.5 text-[11px] text-muted">
            Ranked by confirmed order value (excludes unconfirmed requests)
          </p>
          {data.topProducts.length === 0 ? (
            <p className="mt-5 text-[12px] text-muted">
              No confirmed orders recorded yet. Confirm an order request in{" "}
              <Link href="/admin/orders" className="text-bronze underline">
                Order Management
              </Link>{" "}
              to populate confirmed piece rankings.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-line/60">
              {data.topProducts.map((tp) => (
                <li
                  key={tp.productSlug}
                  className="flex items-center justify-between py-2.5 text-[12px]"
                >
                  <div>
                    <p className="font-medium text-ink">{tp.productName}</p>
                    <p className="text-[10.5px] text-muted">
                      {tp.unitsOrdered} unit{tp.unitsOrdered === 1 ? "" : "s"} confirmed
                    </p>
                  </div>
                  <span className="font-medium tabular-nums text-ink">
                    {formatRwf(tp.confirmedRevenue)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="border border-line bg-parchment p-5">
          <h2 className="font-display text-xl text-ink">
            Daily Order-Request Activity
          </h2>
          <p className="mt-0.5 text-[11px] text-muted">
            Real daily breakdown of confirmed value vs unpaid requests
          </p>
          {data.salesTrends.length === 0 ? (
            <p className="mt-5 text-[12px] text-muted">
              Trend bars appear automatically once real order requests are placed.
            </p>
          ) : (
            <div className="mt-4 space-y-2.5">
              {data.salesTrends.map((day) => (
                <div
                  key={day.date}
                  className="flex items-center justify-between border-b border-line/50 pb-2 text-[12px]"
                >
                  <span className="tabular-nums text-ink">{day.date}</span>
                  <span className="text-muted">
                    {day.orderCount} order{day.orderCount === 1 ? "" : "s"}
                  </span>
                  <div className="text-right tabular-nums">
                    <span className="font-medium text-ink">
                      {formatRwf(day.confirmedValue)} confirmed
                    </span>
                    <span className="ml-2 text-[10.5px] text-muted">
                      ({formatRwf(day.requestValue)} pending)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
