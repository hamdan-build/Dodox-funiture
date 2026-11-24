"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Download, Eye } from "lucide-react";
import { apiRequest } from "@/components/admin/api-client";
import {
  AdminEmptyState,
  AdminPageHeader,
  adminInputClass,
  adminSecondaryBtn,
  adminSelectClass,
  StatusBadge,
} from "@/components/admin/ui";
import { formatDate, formatRwf } from "@/lib/utils";
import { useUiStore } from "@/store/ui";

interface AdminOrderRow {
  id: string;
  reference: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  status: string;
  paymentStatus: string;
  itemCount: number;
  totalAmount: number;
  deliveryMethod: string;
  createdAt: string;
}

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "received", label: "Received (New)" },
  { value: "under_review", label: "Under Review" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in_production", label: "In Production" },
  { value: "ready", label: "Ready" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "rejected", label: "Rejected" },
];

export default function AdminOrdersPage() {
  const pushToast = useUiStore((s) => s.pushToast);
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const buildQueryString = useCallback(() => {
    const qs = new URLSearchParams();
    if (status !== "all") qs.set("status", status);
    if (query.trim()) qs.set("q", query.trim());
    if (fromDate) qs.set("from", fromDate);
    if (toDate) qs.set("to", toDate);
    return qs.toString();
  }, [status, query, fromDate, toDate]);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const qs = buildQueryString();
      const res = await apiRequest<{ orders: AdminOrderRow[] }>(
        `/api/admin/orders?${qs}`,
      );
      setOrders(res.orders);
    } catch (err) {
      pushToast({
        title: "Failed to load orders",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [buildQueryString, pushToast]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const exportUrl = `/api/admin/orders/export?${buildQueryString()}`;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Module 4 · Order Fulfilment"
        title="Order Requests & Commissions"
        description="Review manual order requests, coordinate local payment confirmation, reserve showroom stock upon confirmation, and track white-glove delivery."
        actions={
          <a href={exportUrl} className={adminSecondaryBtn}>
            <Download size={14} />
            Export CSV
          </a>
        }
      />

      <div className="grid gap-3 border border-line/80 bg-parchment p-4 sm:grid-cols-2 lg:grid-cols-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search reference, client, email, phone…"
          className={adminInputClass}
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className={adminSelectClass}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          aria-label="From date"
          className={adminInputClass}
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          aria-label="To date"
          className={adminInputClass}
        />
      </div>

      {loading ? (
        <div className="h-72 animate-pulse border border-line bg-parchment" />
      ) : orders.length === 0 ? (
        <AdminEmptyState
          title="No order requests match these filters"
          description="Submitted storefront order requests appear here immediately with sequential DODOX-YYYY-NNNNNN references."
        />
      ) : (
        <div className="overflow-x-auto border border-line/80 bg-parchment">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line bg-ivory text-[10px] uppercase tracking-[0.16em] text-muted">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Placed</th>
                <th className="px-4 py-3">Items & Total</th>
                <th className="px-4 py-3">Fulfilment Status</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-ivory/70">
                  <td className="px-4 py-3.5 font-mono font-medium text-ink">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="hover:text-bronze hover:underline"
                    >
                      {order.reference}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-ink">
                      {order.customerFirstName} {order.customerLastName}
                    </p>
                    <p className="text-[11px] text-muted">
                      {order.customerEmail} · {order.customerPhone}
                    </p>
                  </td>
                  <td className="px-4 py-3.5 text-muted">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-ink">
                      {formatRwf(order.totalAmount)}
                    </p>
                    <p className="text-[11px] text-muted">
                      {order.itemCount} piece{order.itemCount === 1 ? "" : "s"}
                    </p>
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge
                      status={order.paymentStatus}
                      label={
                        order.paymentStatus === "confirmed_offline"
                          ? "Confirmed Offline"
                          : "Unpaid Request"
                      }
                    />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="inline-flex items-center gap-1 border border-line bg-ivory px-2.5 py-1.5 text-[10px] uppercase tracking-[0.14em] text-ink hover:border-bronze"
                    >
                      <Eye size={12} />
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
