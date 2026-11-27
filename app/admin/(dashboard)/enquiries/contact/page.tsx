"use client";

import { useCallback, useEffect, useState } from "react";
import { Mail, MessageSquare, Search } from "lucide-react";
import { adminFetch, ClientApiError } from "@/components/admin/api-client";
import {
  AdminEmptyState,
  AdminModal,
  AdminPageHeader,
  adminCompactBtn,
  adminDarkBtn,
  adminFilterPillClass,
  adminSearchInputClass,
  adminSecondaryBtn,
  adminSelectClass,
  adminTextareaClass,
  StatusBadge,
} from "@/components/admin/ui";
import { useUiStore } from "@/store/ui";

interface ContactRow {
  id: string;
  reference: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  isRead: boolean;
  status: string;
  internalNotes: string | null;
  createdAt: string;
}

export default function AdminContactMessagesPage() {
  const pushToast = useUiStore((s) => s.pushToast);
  const [items, setItems] = useState<ContactRow[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<ContactRow | null>(null);
  const [nextStatus, setNextStatus] = useState("replied");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (statusFilter !== "all") qs.set("status", statusFilter);
      if (query.trim()) qs.set("q", query.trim());
      const res = await adminFetch<{ items: ContactRow[] }>(
        `/api/admin/enquiries/contact?${qs.toString()}`,
      );
      setItems(res.items);
    } catch (err) {
      pushToast({
        title: "Could not load messages",
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

  const openMessage = (row: ContactRow) => {
    setSelected(row);
    setNextStatus(row.status === "new" ? "open" : row.status);
    setNotes(row.internalNotes ?? "");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      await adminFetch("/api/admin/enquiries/contact", {
        method: "PATCH",
        body: JSON.stringify({
          id: selected.id,
          status: nextStatus,
          isRead: true,
          internalNotes: notes || null,
        }),
      });
      pushToast({
        title: "Message updated",
        description: selected.reference,
        variant: "success",
      });
      setSelected(null);
      await load();
    } catch (err) {
      pushToast({
        title: "Save failed",
        description:
          err instanceof ClientApiError ? err.message : "Could not save",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Module 9 · Concierge Desk"
        title="Contact Messages"
        description="Respond to showroom appointment requests, trade interior enquiries, and piece availability questions."
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
            placeholder="Search sender, subject, or reference..."
            className={adminSearchInputClass}
          />
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Message status filters">
          {["all", "new", "open", "replied", "archived"].map((st) => (
            <button
              key={st}
              type="button"
              aria-pressed={statusFilter === st}
              onClick={() => setStatusFilter(st)}
              className={adminFilterPillClass(statusFilter === st)}
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
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Sender</th>
              <th className="px-4 py-3">Subject & Excerpt</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/70">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  Loading concierge inbox...
                </td>
              </tr>
            ) : !items.length ? (
              <tr>
                <td colSpan={5} className="p-4">
                  <AdminEmptyState
                    title="Inbox is clear"
                    description="Messages submitted on /contact appear here immediately."
                  />
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <tr
                  key={row.id}
                  className={`hover:bg-shell/35 ${!row.isRead ? "bg-peach/15" : ""}`}
                >
                  <td className="px-4 py-3 font-mono text-[11px] text-bronze">
                    {row.reference}
                    <span className="block font-sans text-[10px] text-muted">
                      {new Date(row.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{row.name}</p>
                    <p className="text-[11px] text-muted">{row.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{row.subject}</p>
                    <p className="line-clamp-1 max-w-md text-[11.5px] text-muted">
                      {row.message}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openMessage(row)}
                      className={adminCompactBtn}
                    >
                      <MessageSquare size={11} /> View
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
        title={selected ? selected.subject : "Message"}
        subtitle={selected ? `${selected.name} (${selected.email})` : ""}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="whitespace-pre-wrap border border-line/70 bg-ivory p-4 text-[12.5px] leading-relaxed text-ink">
              {selected.message}
            </div>

            <div className="flex items-center justify-between border border-line bg-shell/40 px-3.5 py-2.5 text-[11.5px]">
              <span>
                Tel: <strong>{selected.phone || "Not provided"}</strong>
              </span>
              <a
                href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject)} (${selected.reference})`}
                className="inline-flex items-center gap-1.5 text-bronze hover:underline"
              >
                <Mail size={13} /> Reply via Email
              </a>
            </div>

            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
                Status
              </span>
              <select
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value)}
                className={`mt-1 ${adminSelectClass}`}
              >
                <option value="new">New</option>
                <option value="open">Open / In Progress</option>
                <option value="replied">Replied</option>
                <option value="archived">Archived</option>
              </select>
            </label>

            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
                Concierge Resolution Notes
              </span>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
                Save Update
              </button>
            </div>
          </form>
        ) : null}
      </AdminModal>
    </div>
  );
}
