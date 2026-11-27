"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChart3, Boxes, Compass, ShoppingBag } from "lucide-react";
import { adminFetch, ClientApiError } from "@/components/admin/api-client";
import {
  adminFilterPillClass,
  AdminPageHeader,
  MetricCard,
  StatusBadge,
} from "@/components/admin/ui";
import { formatRwf } from "@/lib/utils";
import { useUiStore } from "@/store/ui";

interface AnalyticsPayload {
  windowDays: number;
  commerce: {
    totalOrderRequests: number;
    confirmedOrdersCount: number;
    requestedValueRwf: number;
    confirmedRevenueRwf: number;
    averageOrderValueRwf: number;
    vatEstimateRwf: number;
    conversionRatePercent: number;
  };
  statusBreakdown: {
    status: string;
    count: number;
    totalAmount: number;
  }[];
  deliveryBreakdown: {
    method: string;
    count: number;
  }[];
  topPieces: {
    slug: string;
    name: string;
    units: number;
    revenue: number;
  }[];
  inventoryValuation: {
    totalSkus: number;
    onHandRetailValueRwf: number;
    reservedRetailValueRwf: number;
    lowStockCount: number;
    lowStockItems: {
      sku: string;
      productName: string;
      available: number;
      threshold: number;
    }[];
  };
  conciergeFunnel: {
    totalCustomers: number;
    atelierCommissionsTotal: number;
    atelierQuotedCount: number;
    atelierQuotedValueRwf: number;
    contactMessagesTotal: number;
    contactUnreadCount: number;
    newsletterActiveSubscribers: number;
  };
}

export default function AdminReportsPage() {
  const pushToast = useUiStore((s) => s.pushToast);
  const [days, setDays] = useState(90);
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch<AnalyticsPayload>(
        `/api/admin/reports?days=${days}`,
      );
      setData(res);
    } catch (err) {
      pushToast({
        title: "Failed to load analytics",
        description:
          err instanceof ClientApiError ? err.message : "Network error",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [days, pushToast]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Module 13 · Commercial Intelligence"
        title="Reports & Analytics"
        description="Executive view of Kigali showroom order pipeline, confirmed RWF volume, inventory valuation, and bespoke Atelier commission funnel."
        actions={
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Reporting window">
            {[30, 90, 365].map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={days === d}
                onClick={() => setDays(d)}
                className={adminFilterPillClass(days === d)}
              >
                Last {d}d
              </button>
            ))}
          </div>
        }
      />

      {loading || !data ? (
        <div className="py-12 text-center text-[13px] text-muted">
          Compiling D1 analytics...
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Confirmed Order Value"
              value={formatRwf(data.commerce.confirmedRevenueRwf)}
              subtext={`${data.commerce.confirmedOrdersCount} confirmed (${data.commerce.conversionRatePercent}% of requests)`}
              icon={<ShoppingBag size={16} />}
              accent="forest"
            />
            <MetricCard
              label="Requested Pipeline"
              value={formatRwf(data.commerce.requestedValueRwf)}
              subtext={`${data.commerce.totalOrderRequests} order requests in ${days}d`}
              icon={<BarChart3 size={16} />}
              accent="bronze"
            />
            <MetricCard
              label="Showroom Stock Value"
              value={formatRwf(data.inventoryValuation.onHandRetailValueRwf)}
              subtext={`${formatRwf(data.inventoryValuation.reservedRetailValueRwf)} reserved · ${data.inventoryValuation.lowStockCount} low SKU(s)`}
              icon={<Boxes size={16} />}
            />
            <MetricCard
              label="Atelier Quotations"
              value={formatRwf(data.conciergeFunnel.atelierQuotedValueRwf)}
              subtext={`${data.conciergeFunnel.atelierQuotedCount} quoted / ${data.conciergeFunnel.atelierCommissionsTotal} briefs`}
              icon={<Compass size={16} />}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="border border-line bg-parchment p-5">
              <h2 className="font-display text-2xl text-ink">
                Order Pipeline Breakdown
              </h2>
              {!data.statusBreakdown.length ? (
                <p className="mt-4 text-[12px] text-muted">
                  No order requests in the selected window.
                </p>
              ) : (
                <div className="mt-4 divide-y divide-line/70 text-[12px]">
                  {data.statusBreakdown.map((st) => (
                    <div
                      key={st.status}
                      className="flex items-center justify-between py-2.5"
                    >
                      <div className="flex items-center gap-2.5">
                        <StatusBadge status={st.status} />
                        <span className="text-muted">{st.count} order(s)</span>
                      </div>
                      <span className="font-mono tabular-nums text-ink">
                        {formatRwf(st.totalAmount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border border-line bg-parchment p-5">
              <h2 className="font-display text-2xl text-ink">
                Top Requested Pieces
              </h2>
              {!data.topPieces.length ? (
                <p className="mt-4 text-[12px] text-muted">
                  Piece demand rankings appear once order requests are placed.
                </p>
              ) : (
                <div className="mt-4 divide-y divide-line/70 text-[12px]">
                  {data.topPieces.map((p) => (
                    <div
                      key={p.slug}
                      className="flex items-center justify-between py-2.5"
                    >
                      <div>
                        <p className="font-medium text-ink">{p.name}</p>
                        <p className="text-[11px] text-muted">
                          {p.units} unit(s) requested
                        </p>
                      </div>
                      <span className="font-mono tabular-nums text-ink">
                        {formatRwf(p.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="border border-line bg-parchment p-5">
              <h2 className="font-display text-2xl text-ink">
                Concierge & Audience Reach
              </h2>
              <dl className="mt-4 grid grid-cols-2 gap-4 text-[12px]">
                <div className="border border-line/70 bg-ivory p-3.5">
                  <dt className="text-[10px] uppercase tracking-[0.14em] text-muted">
                    CRM Client Profiles
                  </dt>
                  <dd className="mt-1 font-display text-2xl text-ink">
                    {data.conciergeFunnel.totalCustomers}
                  </dd>
                </div>
                <div className="border border-line/70 bg-ivory p-3.5">
                  <dt className="text-[10px] uppercase tracking-[0.14em] text-muted">
                    Active Newsletter List
                  </dt>
                  <dd className="mt-1 font-display text-2xl text-ink">
                    {data.conciergeFunnel.newsletterActiveSubscribers}
                  </dd>
                </div>
                <div className="border border-line/70 bg-ivory p-3.5">
                  <dt className="text-[10px] uppercase tracking-[0.14em] text-muted">
                    Average Confirmed Order
                  </dt>
                  <dd className="mt-1 font-mono text-sm font-medium text-ink">
                    {formatRwf(data.commerce.averageOrderValueRwf)}
                  </dd>
                </div>
                <div className="border border-line/70 bg-ivory p-3.5">
                  <dt className="text-[10px] uppercase tracking-[0.14em] text-muted">
                    Estimated Included VAT (18%)
                  </dt>
                  <dd className="mt-1 font-mono text-sm font-medium text-ink">
                    {formatRwf(data.commerce.vatEstimateRwf)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="border border-line bg-parchment p-5">
              <h2 className="font-display text-2xl text-ink">
                Low-Stock Watchlist
              </h2>
              {!data.inventoryValuation.lowStockItems.length ? (
                <p className="mt-4 text-[12px] text-muted">
                  All showroom SKUs are above their alert threshold.
                </p>
              ) : (
                <div className="mt-4 divide-y divide-line/70 text-[12px]">
                  {data.inventoryValuation.lowStockItems.map((item) => (
                    <div
                      key={item.sku}
                      className="flex items-center justify-between py-2"
                    >
                      <div>
                        <span className="font-mono text-[10.5px] text-bronze">
                          {item.sku}
                        </span>
                        <p className="text-ink">{item.productName}</p>
                      </div>
                      <span className="font-mono text-[11.5px] text-muted">
                        {item.available} avail (min {item.threshold})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
