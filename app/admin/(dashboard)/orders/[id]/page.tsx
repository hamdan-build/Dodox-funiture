"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, MessageSquarePlus, Printer } from "lucide-react";
import { apiRequest } from "@/components/admin/api-client";
import {
  adminPrimaryBtn,
  adminSecondaryBtn,
  adminSelectClass,
  adminTextareaClass,
  StatusBadge,
} from "@/components/admin/ui";
import { formatDate, formatRwf } from "@/lib/utils";
import { useUiStore } from "@/store/ui";

interface OrderDetailPayload {
  order: {
    id: string;
    reference: string;
    customerId: string | null;
    customerEmail: string;
    customerPhone: string;
    customerFirstName: string;
    customerLastName: string;
    status: string;
    paymentStatus: string;
    itemCount: number;
    subtotalAmount: number;
    discountAmount: number;
    careProtectionEnabled: boolean;
    careProtectionAmount: number;
    deliveryAmount: number;
    vatAmount: number;
    totalAmount: number;
    couponCode: string | null;
    deliveryMethod: string;
    customerNotes: string | null;
    createdAt: string;
  };
  address: {
    recipientName: string;
    email: string;
    phone: string;
    city: string;
    district: string;
    addressLine: string;
    landmark: string | null;
  } | null;
  items: Array<{
    id: string;
    productName: string;
    productSlug: string;
    productSku: string | null;
    productImage: string;
    variantSummary: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    leadTimeAtOrder: string;
  }>;
  history: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    note: string | null;
    isCustomerVisible: boolean;
    actorName: string;
    createdAt: string;
  }>;
  notes: Array<{
    id: string;
    body: string;
    authorName: string;
    createdAt: string;
  }>;
}

const ALL_STATUSES = [
  { value: "received", label: "Received" },
  { value: "under_review", label: "Under Review" },
  { value: "confirmed", label: "Confirmed (Reserves Stock)" },
  { value: "in_production", label: "In Production" },
  { value: "ready", label: "Ready for Delivery" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered (Deducts Stock)" },
  { value: "cancelled", label: "Cancelled (Releases Stock)" },
  { value: "rejected", label: "Rejected (Releases Stock)" },
];

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const pushToast = useUiStore((s) => s.pushToast);

  const [detail, setDetail] = useState<OrderDetailPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [nextStatus, setNextStatus] = useState("received");
  const [statusNote, setStatusNote] = useState("");
  const [customerVisible, setCustomerVisible] = useState(true);
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);

  const [internalNote, setInternalNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest<OrderDetailPayload>(
        `/api/admin/orders/${id}`,
      );
      setDetail(data);
      setNextStatus(data.order.status);
    } catch (err) {
      pushToast({
        title: "Failed to load order",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [id, pushToast]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStatus(true);
    try {
      const updated = await apiRequest<OrderDetailPayload>(
        `/api/admin/orders/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: nextStatus,
            note: statusNote || undefined,
            isCustomerVisible: customerVisible,
            notifyCustomer,
          }),
        },
      );
      setDetail(updated);
      setStatusNote("");
      pushToast({
        title: `Order ${updated.order.reference} updated to ${nextStatus}`,
        variant: "success",
      });
    } catch (err) {
      pushToast({
        title: "Status update failed",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setSavingStatus(false);
    }
  };

  const handleAddInternalNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!internalNote.trim()) return;
    setSavingNote(true);
    try {
      const updated = await apiRequest<OrderDetailPayload>(
        `/api/admin/orders/${id}`,
        {
          method: "POST",
          body: JSON.stringify({ body: internalNote }),
        },
      );
      setDetail(updated);
      setInternalNote("");
      pushToast({ title: "Internal note saved", variant: "success" });
    } catch (err) {
      pushToast({
        title: "Failed to add note",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setSavingNote(false);
    }
  };

  if (loading || !detail) {
    return <div className="h-80 animate-pulse border border-line bg-parchment" />;
  }

  const { order, address, items, history, notes } = detail;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5 print:border-b-2">
        <div>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-muted hover:text-ink print:hidden"
          >
            <ArrowLeft size={13} />
            Back to Orders
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl text-ink">{order.reference}</h1>
            <StatusBadge status={order.status} />
            <StatusBadge
              status={order.paymentStatus}
              label={
                order.paymentStatus === "confirmed_offline"
                  ? "Confirmed Offline"
                  : "Unpaid Order Request"
              }
            />
          </div>
          <p className="mt-1 text-xs text-muted">
            Submitted {formatDate(order.createdAt)} · No online payment collected
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className={`${adminSecondaryBtn} print:hidden`}
        >
          <Printer size={14} />
          Print Order Sheet
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Columns: Line items, Address, Audit History */}
        <div className="space-y-6 lg:col-span-2">
          {/* Items */}
          <section className="border border-line/80 bg-parchment p-5">
            <h2 className="font-display text-xl text-ink">
              Requested Pieces ({order.itemCount})
            </h2>
            <div className="mt-4 divide-y divide-line/60">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 py-3.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="h-16 w-14 shrink-0 border border-line object-cover print:hidden"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">{item.productName}</p>
                    <p className="text-xs text-muted">
                      SKU: {item.productSku ?? "—"} · {item.variantSummary}
                    </p>
                    <p className="text-[11px] text-muted">
                      Lead time snapshot: {item.leadTimeAtOrder}
                    </p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="text-muted">
                      {formatRwf(item.unitPrice)} × {item.quantity}
                    </p>
                    <p className="mt-0.5 font-medium text-ink">
                      {formatRwf(item.lineTotal)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2 border-t border-line pt-4 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal</span>
                <span>{formatRwf(order.subtotalAmount)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-bronze">
                  <span>Discount ({order.couponCode})</span>
                  <span>−{formatRwf(order.discountAmount)}</span>
                </div>
              )}
              {order.careProtectionAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted">Atelier Care Protection</span>
                  <span>{formatRwf(order.careProtectionAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted">VAT Included</span>
                <span className="text-muted">{formatRwf(order.vatAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-line/70 pt-2.5 text-sm font-medium text-ink">
                <span>Grand Total</span>
                <span className="font-display text-2xl">
                  {formatRwf(order.totalAmount)}
                </span>
              </div>
            </div>
          </section>

          {/* Delivery & Client */}
          <section className="border border-line/80 bg-parchment p-5">
            <h2 className="flex items-center gap-2 font-display text-xl text-ink">
              <MapPin size={16} className="text-bronze" />
              Client & Delivery Specification
            </h2>
            <div className="mt-3 grid gap-4 text-xs sm:grid-cols-2">
              <div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted">
                  Client Contact
                </p>
                <p className="mt-1 font-medium text-ink">
                  {order.customerFirstName} {order.customerLastName}
                </p>
                <p className="text-ink-soft">{order.customerEmail}</p>
                <p className="text-ink-soft">{order.customerPhone}</p>
                {order.customerId && (
                  <Link
                    href={`/admin/customers?highlight=${order.customerId}`}
                    className="mt-2 inline-block text-[10px] uppercase tracking-[0.14em] text-bronze underline print:hidden"
                  >
                    Open customer profile
                  </Link>
                )}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted">
                  Delivery Address
                </p>
                {address ? (
                  <p className="mt-1 leading-relaxed text-ink-soft">
                    {address.addressLine}
                    {address.landmark ? `, ${address.landmark}` : ""}
                    <br />
                    {address.district}, {address.city}
                  </p>
                ) : null}
                <p className="mt-1.5 text-[10px] uppercase tracking-[0.12em] text-bronze">
                  {order.deliveryMethod === "kigali-white-glove"
                    ? "Kigali White-Glove Delivery"
                    : "Regional Courier (Quote Required)"}
                </p>
              </div>
            </div>
            {order.customerNotes && (
              <div className="mt-4 border-t border-line/60 pt-3 text-xs">
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted">
                  Client Delivery Notes
                </p>
                <p className="mt-1 text-ink-soft">{order.customerNotes}</p>
              </div>
            )}
          </section>

          {/* Status History */}
          <section className="border border-line/80 bg-parchment p-5">
            <h2 className="font-display text-xl text-ink">
              Fulfilment Audit Trail
            </h2>
            <ol className="mt-4 space-y-3 text-xs">
              {history.map((h) => (
                <li
                  key={h.id}
                  className="border-l-2 border-bronze/50 pl-3.5 py-0.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={h.toStatus} />
                      <span className="text-[11px] text-muted">
                        by {h.actorName}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted">
                      {formatDate(h.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-ink-soft">{h.note}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* Right Column: Status Transition & Staff Notes */}
        <div className="space-y-6 print:hidden">
          <form
            onSubmit={handleStatusUpdate}
            className="space-y-4 border border-line/80 bg-parchment p-5"
          >
            <h2 className="font-display text-xl text-ink">
              Update Order Status
            </h2>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-muted">
                Next Status
              </label>
              <select
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value)}
                className={adminSelectClass}
              >
                {ALL_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-muted">
                Status Note
              </label>
              <textarea
                rows={3}
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Optional note recorded in order timeline…"
                className={adminTextareaClass}
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-ink">
              <input
                type="checkbox"
                checked={customerVisible}
                onChange={(e) => setCustomerVisible(e.target.checked)}
              />
              Show this note on client /track-order timeline
            </label>
            <label className="flex items-center gap-2 text-xs text-ink">
              <input
                type="checkbox"
                checked={notifyCustomer}
                onChange={(e) => setNotifyCustomer(e.target.checked)}
              />
              Send status update email to client
            </label>
            <button
              type="submit"
              disabled={savingStatus}
              className={`${adminPrimaryBtn} w-full`}
            >
              {savingStatus ? "Updating…" : "Save Status Update"}
            </button>
          </form>

          <section className="space-y-4 border border-line/80 bg-parchment p-5">
            <h2 className="flex items-center gap-2 font-display text-xl text-ink">
              <MessageSquarePlus size={16} className="text-bronze" />
              Internal Staff Notes
            </h2>
            <p className="text-[11px] text-muted">
              Private notes visible only to authenticated DODOX staff.
            </p>
            <form onSubmit={handleAddInternalNote} className="space-y-2.5">
              <textarea
                rows={3}
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                placeholder="Log call notes, timber batch, payment reference…"
                className={adminTextareaClass}
              />
              <button
                type="submit"
                disabled={savingNote}
                className={`${adminSecondaryBtn} w-full`}
              >
                {savingNote ? "Saving…" : "Add Private Note"}
              </button>
            </form>

            {notes.length > 0 && (
              <div className="space-y-2.5 border-t border-line pt-3">
                {notes.map((n) => (
                  <div key={n.id} className="border border-line/60 bg-ivory p-3 text-xs">
                    <p className="whitespace-pre-wrap text-ink">{n.body}</p>
                    <p className="mt-1.5 text-[10px] text-muted">
                      {n.authorName} · {formatDate(n.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
