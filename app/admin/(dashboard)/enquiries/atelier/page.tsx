"use client";

import { useCallback, useEffect, useState } from "react";
import { Compass, ExternalLink, Search } from "lucide-react";
import { adminFetch, ClientApiError } from "@/components/admin/api-client";
import {
  AdminEmptyState,
  AdminModal,
  AdminPageHeader,
  adminCompactBtn,
  adminDarkBtn,
  adminFilterPillClass,
  adminInputClass,
  adminSearchInputClass,
  adminSecondaryBtn,
  adminSelectClass,
  adminTextareaClass,
  StatusBadge,
} from "@/components/admin/ui";
import { formatRwf } from "@/lib/utils";
import { useUiStore } from "@/store/ui";

interface AtelierRow {
  id: string;
  reference: string;
  name: string;
  email: string;
  phone: string;
  furnitureType: string;
  dimensions: string;
  materials: string;
  finish: string;
  budget: string;
  description: string;
  contactPreference: string;
  referenceImages: string[];
  quotedAmount: number | null;
  status: string;
  internalNotes: string | null;
  createdAt: string;
}

const ATELIER_STATUSES = [
  "new",
  "reviewing",
  "quotation_prepared",
  "awaiting_customer",
  "accepted",
  "completed",
  "archived",
] as const;

export default function AdminAtelierEnquiriesPage() {
  const pushToast = useUiStore((s) => s.pushToast);
  const [items, setItems] = useState<AtelierRow[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<AtelierRow | null>(null);
  const [nextStatus, setNextStatus] = useState("reviewing");
  const [quotedAmount, setQuotedAmount] = useState<string>("");
  const [internalNotes, setInternalNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (statusFilter !== "all") qs.set("status", statusFilter);
      if (query.trim()) qs.set("q", query.trim());
      const res = await adminFetch<{ items: AtelierRow[] }>(
        `/api/admin/enquiries/atelier?${qs.toString()}`,
      );
      setItems(res.items);
    } catch (err) {
      pushToast({
        title: "Failed to load Atelier briefs",
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

  const openBrief = (row: AtelierRow) => {
    setSelected(row);
    setNextStatus(row.status);
    setQuotedAmount(row.quotedAmount ? String(row.quotedAmount) : "");
    setInternalNotes(row.internalNotes ?? "");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      await adminFetch("/api/admin/enquiries/atelier", {
        method: "PATCH",
        body: JSON.stringify({
          id: selected.id,
          status: nextStatus,
          quotedAmount: quotedAmount ? Number(quotedAmount) : null,
          internalNotes: internalNotes || null,
        }),
      });
      pushToast({
        title: "Commission brief updated",
        description: selected.reference,
        variant: "success",
      });
      setSelected(null);
      await load();
    } catch (err) {
      pushToast({
        title: "Could not save update",
        description:
          err instanceof ClientApiError ? err.message : "Check inputs",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Module 8 · Bespoke Commissions"
        title="Atelier Enquiries"
        description="Manage custom furniture briefs, architectural room commissions, client reference images, and RWF design quotations."
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
            placeholder="Search reference, client, or piece type..."
            className={adminSearchInputClass}
          />
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Commission status filters">
          {["all", ...ATELIER_STATUSES].map((st) => (
            <button
              key={st}
              type="button"
              aria-pressed={statusFilter === st}
              onClick={() => setStatusFilter(st)}
              className={adminFilterPillClass(statusFilter === st)}
            >
              {st.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto border border-line bg-parchment">
        <table className="w-full border-collapse text-left text-[12px]">
          <thead>
            <tr className="border-b border-line bg-shell/60 text-[9.5px] uppercase tracking-[0.16em] text-muted">
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Commission Brief</th>
              <th className="px-4 py-3">Budget / Quote</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Review</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/70">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted">
                  Loading Atelier commissions...
                </td>
              </tr>
            ) : !items.length ? (
              <tr>
                <td colSpan={6} className="p-4">
                  <AdminEmptyState
                    title="No bespoke enquiries match"
                    description="Submissions from /custom-atelier appear here with full material specs and R2 reference photos."
                  />
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <tr key={row.id} className="hover:bg-shell/35">
                  <td className="px-4 py-3 font-mono text-[11.5px] text-bronze">
                    {row.reference}
                    <span className="block font-sans text-[10.5px] text-muted">
                      {new Date(row.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{row.name}</p>
                    <p className="text-[11px] text-muted">
                      {row.email} · {row.phone}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{row.furnitureType}</p>
                    <p className="text-[11px] text-muted">
                      {row.materials} · {row.finish} · {row.dimensions}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-[11.5px]">
                    <p className="text-muted">{row.budget}</p>
                    {row.quotedAmount ? (
                      <p className="font-mono font-medium text-ink">
                        Quote: {formatRwf(row.quotedAmount)}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openBrief(row)}
                      className={adminCompactBtn}
                    >
                      <Compass size={11} /> Manage
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AdminModal
        open={Boolean(selected)}
        title={selected ? `Commission · ${selected.reference}` : "Commission"}
        subtitle={selected ? `${selected.name} · ${selected.furnitureType}` : ""}
        onClose={() => setSelected(null)}
        maxWidth="max-w-2xl"
      >
        {selected ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-3 border border-line bg-shell/40 p-4 text-[12px] sm:grid-cols-2">
              <div>
                <p className="text-[9.5px] uppercase tracking-[0.14em] text-muted">
                  Dimensions
                </p>
                <p className="mt-0.5 text-ink">{selected.dimensions}</p>
              </div>
              <div>
                <p className="text-[9.5px] uppercase tracking-[0.14em] text-muted">
                  Material & Finish
                </p>
                <p className="mt-0.5 text-ink">
                  {selected.materials} · {selected.finish}
                </p>
              </div>
              <div>
                <p className="text-[9.5px] uppercase tracking-[0.14em] text-muted">
                  Indicative Budget
                </p>
                <p className="mt-0.5 text-ink">{selected.budget}</p>
              </div>
              <div>
                <p className="text-[9.5px] uppercase tracking-[0.14em] text-muted">
                  Contact Preference
                </p>
                <p className="mt-0.5 uppercase text-ink">
                  {selected.contactPreference} ({selected.phone})
                </p>
              </div>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted">
                Client Brief
              </p>
              <p className="mt-1 whitespace-pre-wrap border border-line/70 bg-ivory p-3 text-[12.5px] leading-relaxed text-ink">
                {selected.description}
              </p>
            </div>

            {selected.referenceImages.length > 0 ? (
              <div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted">
                  Reference Images ({selected.referenceImages.length})
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selected.referenceImages.map((url, idx) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className={adminCompactBtn}
                    >
                      Reference {idx + 1} <ExternalLink size={11} />
                    </a>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
                  Workflow Stage
                </span>
                <select
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value)}
                  className={`mt-1 ${adminSelectClass}`}
                >
                  {ATELIER_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
                  Atelier Quotation (RWF)
                </span>
                <input
                  type="number"
                  min={0}
                  value={quotedAmount}
                  onChange={(e) => setQuotedAmount(e.target.value)}
                  placeholder="e.g. 2450000"
                  className={`mt-1 ${adminInputClass}`}
                />
              </label>
            </div>

            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
                Internal Designer & Joinery Notes
              </span>
              <textarea
                rows={3}
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Timber board-feet estimate, lead time, showroom meeting notes..."
                className={`mt-1 ${adminTextareaClass}`}
              />
            </label>

            <div className="flex justify-end gap-2 border-t border-line pt-4">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className={adminSecondaryBtn}
              >
                Close
              </button>
              <button
                type="submit"
                disabled={saving}
                className={adminDarkBtn}
              >
                {saving ? "Saving..." : "Save Commission"}
              </button>
            </div>
          </form>
        ) : null}
      </AdminModal>
    </div>
  );
}
