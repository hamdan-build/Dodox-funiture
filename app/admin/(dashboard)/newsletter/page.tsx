"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Mail, Search } from "lucide-react";
import { adminFetch, ClientApiError } from "@/components/admin/api-client";
import {
  AdminEmptyState,
  AdminPageHeader,
  StatusBadge,
} from "@/components/admin/ui";
import { useUiStore } from "@/store/ui";

interface SubscriberRow {
  id: string;
  email: string;
  status: string;
  consentSource: string;
  consentedAt: string;
  unsubscribedAt: string | null;
}

export default function AdminNewsletterPage() {
  const pushToast = useUiStore((s) => s.pushToast);
  const [items, setItems] = useState<SubscriberRow[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (statusFilter !== "all") qs.set("status", statusFilter);
      if (query.trim()) qs.set("q", query.trim());
      const res = await adminFetch<{ items: SubscriberRow[] }>(
        `/api/admin/newsletter?${qs.toString()}`,
      );
      setItems(res.items);
    } catch (err) {
      pushToast({
        title: "Failed to load mailing list",
        description:
          err instanceof ClientApiError ? err.message : "Network error",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, query, pushToast]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Module 10 · Private Atelier List"
        title="Newsletter Subscribers"
        description="Consent-tracked private mailing list with one-click unsubscribe token compliance and formula-safe CSV export."
        actions={
          <a
            href="/api/admin/newsletter?export=csv"
            className="inline-flex h-9 items-center gap-1.5 bg-ink px-4 text-[10.5px] font-medium uppercase tracking-[0.14em] text-canvas hover:bg-bronze"
          >
            <Download size={13} /> Export CSV
          </a>
        }
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
            placeholder="Filter by email address..."
            className="h-9 w-full border border-line bg-parchment pl-9 pr-3 text-[12px] text-ink focus:border-ink focus:outline-none"
          />
        </div>
        <div className="flex gap-1.5">
          {["all", "active", "unsubscribed"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`h-8 px-3 text-[10px] uppercase tracking-[0.13em] ${
                statusFilter === st
                  ? "bg-ink text-canvas"
                  : "border border-line bg-parchment text-muted hover:text-ink"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto border border-line bg-parchment">
        <table className="w-full border-collapse text-left text-[12px]">
          <thead>
            <tr className="border-b border-line bg-shell/60 text-[9.5px] uppercase tracking-[0.16em] text-muted">
              <th className="px-4 py-3">Subscriber Email</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Consented At</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/70">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted">
                  Loading subscribers...
                </td>
              </tr>
            ) : !items.length ? (
              <tr>
                <td colSpan={4} className="p-4">
                  <AdminEmptyState
                    title="No subscribers yet"
                    description="Storefront footer and Journal newsletter signups appear here automatically."
                  />
                </td>
              </tr>
            ) : (
              items.map((s) => (
                <tr key={s.id} className="hover:bg-shell/35">
                  <td className="px-4 py-3 font-medium text-ink">
                    <span className="inline-flex items-center gap-2">
                      <Mail size={13} className="text-bronze" /> {s.email}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[11px] uppercase tracking-[0.12em] text-muted">
                    {s.consentSource}
                  </td>
                  <td className="px-4 py-3 text-[11.5px] text-muted">
                    {new Date(s.consentedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status} />
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
