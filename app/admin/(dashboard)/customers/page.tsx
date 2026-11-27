"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Search, Users } from "lucide-react";
import { adminFetch, ClientApiError } from "@/components/admin/api-client";
import {
  AdminEmptyState,
  AdminPageHeader,
  adminCompactBtn,
  adminFilterPillClass,
  adminSearchInputClass,
  StatusBadge,
} from "@/components/admin/ui";
import { formatRwf } from "@/lib/utils";
import { useUiStore } from "@/store/ui";

interface CustomerRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string | null;
  district: string | null;
  orderCount: number;
  confirmedOrderCount: number;
  totalRequestedAmount: number;
  confirmedSpendAmount: number;
  lastOrderAt: string | null;
  acceptsMarketing: boolean;
  isActive: boolean;
}

export default function AdminCustomersPage() {
  const pushToast = useUiStore((s) => s.pushToast);
  const [items, setItems] = useState<CustomerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (query.trim()) qs.set("q", query.trim());
      if (filter !== "all") qs.set("filter", filter);
      const res = await adminFetch<{ items: CustomerRow[]; total: number }>(
        `/api/admin/customers?${qs.toString()}`,
      );
      setItems(res.items);
      setTotal(res.total);
    } catch (err) {
      pushToast({
        title: "Failed to load customers",
        description:
          err instanceof ClientApiError ? err.message : "Network error",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [query, filter, pushToast]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Module 6 · Client Directory & CRM"
        title="Customers"
        description={`${total} showroom & online client profiles with lifetime order request value, confirmed spend, and Kigali delivery addresses.`}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, phone, or city..."
            className={adminSearchInputClass}
          />
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Customer segment filters">
          {[
            ["all", "All Clients"],
            ["vip", "VIP Collectors (≥ 2.5M RWF)"],
            ["marketing", "Marketing Opt-In"],
          ].map(([k, label]) => (
            <button
              key={k}
              type="button"
              aria-pressed={filter === k}
              onClick={() => setFilter(k)}
              className={adminFilterPillClass(filter === k)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto border border-line bg-parchment">
        <table className="w-full border-collapse text-left text-[12px]">
          <thead>
            <tr className="border-b border-line bg-shell/60 text-[9.5px] uppercase tracking-[0.16em] text-muted">
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3 text-right">Requests</th>
              <th className="px-4 py-3 text-right">Confirmed Spend</th>
              <th className="px-4 py-3">Marketing</th>
              <th className="px-4 py-3 text-right">Profile</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/70">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted">
                  Loading client directory...
                </td>
              </tr>
            ) : !items.length ? (
              <tr>
                <td colSpan={6} className="p-4">
                  <AdminEmptyState
                    title="No client profiles yet"
                    description="Customer profiles are automatically created and enriched when clients submit order requests."
                  />
                </td>
              </tr>
            ) : (
              items.map((c) => (
                <tr key={c.id} className="hover:bg-shell/35">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center bg-shell text-[11px] font-medium text-ink">
                        <Users size={13} />
                      </span>
                      <div>
                        <p className="font-medium text-ink">
                          {c.firstName} {c.lastName}
                        </p>
                        <p className="text-[11px] text-muted">
                          {c.email} · {c.phone}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[11.5px] text-muted">
                    {[c.district, c.city].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-ink">
                    {c.confirmedOrderCount} / {c.orderCount}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-ink">
                    {formatRwf(c.confirmedSpendAmount)}
                    {c.totalRequestedAmount > c.confirmedSpendAmount ? (
                      <span className="block text-[10px] text-muted">
                        ({formatRwf(c.totalRequestedAmount)} requested)
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={c.acceptsMarketing ? "active" : "inactive"}
                      label={c.acceptsMarketing ? "Subscribed" : "Transactional"}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/customers/${c.id}`}
                      className={adminCompactBtn}
                    >
                      Open <ArrowRight size={11} />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
