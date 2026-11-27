"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Truck,
} from "lucide-react";
import { adminFetch, ClientApiError } from "@/components/admin/api-client";
import {
  AdminEmptyState,
  AdminModal,
  AdminPageHeader,
  adminCompactBtn,
  adminCompactDarkBtn,
  adminDarkBtn,
  adminFilterPillClass,
  adminInputClass,
  adminSearchInputClass,
  adminSecondaryBtn,
  adminSelectClass,
  adminTabClass,
  MetricCard,
  StatusBadge,
} from "@/components/admin/ui";
import { formatRwf } from "@/lib/utils";
import { useUiStore } from "@/store/ui";

interface InventoryRow {
  id: string;
  productId: string;
  sku: string;
  quantityOnHand: number;
  quantityReserved: number;
  available: number;
  lowStockThreshold: number;
  allowBackorder: boolean;
  warehouseLocation: string;
  updatedAt: string;
  productName: string;
  productSlug: string;
  productAvailability: string;
  productPrice: number;
  stockHealth: "healthy" | "low_stock" | "out_of_stock";
}

interface MovementRow {
  id: string;
  movementType: string;
  quantityDelta: number;
  previousOnHand: number;
  newOnHand: number;
  previousReserved: number;
  newReserved: number;
  referenceType: string | null;
  referenceId: string | null;
  reason: string;
  createdAt: string;
  productName: string;
  sku: string;
  actorEmail: string | null;
}

interface SupplierRow {
  id: string;
  name: string;
  code: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  country: string;
  materialsSupplied: string | null;
  isActive: boolean;
}

interface PurchaseOrderRow {
  id: string;
  poNumber: string;
  supplierName: string;
  status: string;
  totalAmount: number;
  expectedAt: string | null;
  receivedAt: string | null;
  createdAt: string;
  items: {
    inventoryId: string;
    sku: string;
    productName: string;
    quantity: number;
    unitCost: number;
  }[];
}

interface InventoryPayload {
  summary: {
    totalSkus: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalOnHand: number;
    totalReserved: number;
  };
  items: InventoryRow[];
  movements: MovementRow[];
  suppliers: SupplierRow[];
  purchaseOrders: PurchaseOrderRow[];
}

export default function AdminInventoryPage() {
  const pushToast = useUiStore((s) => s.pushToast);
  const [data, setData] = useState<InventoryPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"stock" | "movements" | "suppliers" | "po">(
    "stock",
  );
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  // Adjust modal state
  const [selectedSku, setSelectedSku] = useState<InventoryRow | null>(null);
  const [delta, setDelta] = useState(0);
  const [adjType, setAdjType] = useState<
    | "restock"
    | "audit_correction"
    | "showroom_transfer"
    | "damage_writeoff"
    | "settings_only"
  >("restock");
  const [reason, setReason] = useState("");
  const [threshold, setThreshold] = useState(2);
  const [allowBackorder, setAllowBackorder] = useState(true);
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);

  // Supplier modal
  const [supplierModal, setSupplierModal] = useState(false);
  const [supName, setSupName] = useState("");
  const [supContact, setSupContact] = useState("");
  const [supPhone, setSupPhone] = useState("");
  const [supCity, setSupCity] = useState("Kigali");
  const [supMaterials, setSupMaterials] = useState("");

  // PO modal
  const [poModal, setPoModal] = useState(false);
  const [poSupplierId, setPoSupplierId] = useState("");
  const [poInventoryId, setPoInventoryId] = useState("");
  const [poQty, setPoQty] = useState(4);
  const [poCost, setPoCost] = useState(350000);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (query.trim()) qs.set("q", query.trim());
      if (filter !== "all") qs.set("filter", filter);
      const res = await adminFetch<InventoryPayload>(
        `/api/admin/inventory?${qs.toString()}`,
      );
      setData(res);
    } catch (err) {
      pushToast({
        title: "Failed to load inventory",
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

  const openAdjust = (row: InventoryRow) => {
    setSelectedSku(row);
    setDelta(0);
    setAdjType("restock");
    setReason("");
    setThreshold(row.lowStockThreshold);
    setAllowBackorder(row.allowBackorder);
    setLocation(row.warehouseLocation);
  };

  const handleSaveAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSku) return;
    setSaving(true);
    try {
      await adminFetch("/api/admin/inventory", {
        method: "POST",
        body: JSON.stringify({
          action: "adjust_stock",
          inventoryId: selectedSku.id,
          quantityChange: delta,
          adjustmentType: delta === 0 ? "settings_only" : adjType,
          reason: reason.trim() || "Threshold / warehouse update",
          lowStockThreshold: threshold,
          allowBackorder,
          warehouseLocation: location,
        }),
      });
      pushToast({
        title: "Inventory updated",
        description: `SKU ${selectedSku.sku} saved.`,
        variant: "success",
      });
      setSelectedSku(null);
      await load();
    } catch (err) {
      pushToast({
        title: "Adjustment failed",
        description:
          err instanceof ClientApiError ? err.message : "Unable to update SKU",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminFetch("/api/admin/inventory", {
        method: "POST",
        body: JSON.stringify({
          action: "upsert_supplier",
          name: supName,
          contactName: supContact || null,
          phone: supPhone || null,
          city: supCity || null,
          materialsSupplied: supMaterials || null,
        }),
      });
      pushToast({
        title: "Supplier registered",
        description: supName,
        variant: "success",
      });
      setSupplierModal(false);
      setSupName("");
      setSupContact("");
      setSupPhone("");
      setSupMaterials("");
      await load();
    } catch (err) {
      pushToast({
        title: "Supplier save failed",
        description:
          err instanceof ClientApiError ? err.message : "Check fields",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poSupplierId || !poInventoryId) return;
    setSaving(true);
    try {
      const res = await adminFetch<{ poNumber: string }>("/api/admin/inventory", {
        method: "POST",
        body: JSON.stringify({
          action: "create_purchase_order",
          supplierId: poSupplierId,
          items: [
            {
              inventoryId: poInventoryId,
              quantity: poQty,
              unitCost: poCost,
            },
          ],
        }),
      });
      pushToast({
        title: "Purchase order issued",
        description: res.poNumber,
        variant: "success",
      });
      setPoModal(false);
      await load();
    } catch (err) {
      pushToast({
        title: "PO creation failed",
        description:
          err instanceof ClientApiError ? err.message : "Unable to issue PO",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReceivePo = async (poId: string, poNumber: string) => {
    try {
      await adminFetch("/api/admin/inventory", {
        method: "POST",
        body: JSON.stringify({
          action: "receive_purchase_order",
          purchaseOrderId: poId,
        }),
      });
      pushToast({
        title: `${poNumber} received`,
        description: "On-hand showroom stock has been incremented.",
        variant: "success",
      });
      await load();
    } catch (err) {
      pushToast({
        title: "Receive failed",
        description:
          err instanceof ClientApiError ? err.message : "Could not receive PO",
        variant: "error",
      });
    }
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Module 5 · Showroom & Atelier Stock"
        title="Inventory & Procurement"
        description="Track Kigali showroom on-hand stock, confirmed order reservations, audit-logged adjustments, timber & upholstery suppliers, and purchase orders."
        actions={
          <>
            <button
              type="button"
              onClick={() => setSupplierModal(true)}
              className={adminSecondaryBtn}
            >
              <Plus size={13} /> Supplier
            </button>
            <button
              type="button"
              onClick={() => {
                setPoSupplierId(data?.suppliers[0]?.id ?? "");
                setPoInventoryId(data?.items[0]?.id ?? "");
                setPoModal(true);
              }}
              className={adminDarkBtn}
            >
              <ClipboardList size={13} /> New Purchase Order
            </button>
          </>
        }
      />

      {data ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Tracked SKUs"
            value={data.summary.totalSkus}
            subtext="Active showroom & made-to-order pieces"
            icon={<Boxes size={16} />}
          />
          <MetricCard
            label="Units On Hand"
            value={data.summary.totalOnHand}
            subtext="Physical showroom & workshop units"
            accent="forest"
          />
          <MetricCard
            label="Reserved Units"
            value={data.summary.totalReserved}
            subtext="Allocated to confirmed orders"
            accent="bronze"
          />
          <MetricCard
            label="Low / Out of Stock"
            value={`${data.summary.lowStockCount} / ${data.summary.outOfStockCount}`}
            subtext="Below low-stock alert threshold"
            icon={<AlertTriangle size={16} />}
            accent={
              data.summary.lowStockCount + data.summary.outOfStockCount > 0
                ? "warning"
                : "default"
            }
          />
        </div>
      ) : null}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Inventory sections">
          {(
            [
              ["stock", "Stock Levels"],
              ["movements", "Movements Ledger"],
              ["suppliers", "Suppliers"],
              ["po", "Purchase Orders"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={adminTabClass(tab === key)}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => void load()}
          className={adminFilterPillClass(false)}
        >
          <RefreshCw size={12} className="mr-1.5" /> Refresh
        </button>
      </div>

      {tab === "stock" ? (
        <>
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
                placeholder="Search SKU, piece name, or warehouse..."
                className={adminSearchInputClass}
              />
            </div>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Stock health filters">
              {[
                ["all", "All SKUs"],
                ["low", "Low Stock"],
                ["out", "0 Available"],
                ["reserved", "Has Reservations"],
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
                  <th className="px-4 py-3">SKU & Piece</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3 text-right">On Hand</th>
                  <th className="px-4 py-3 text-right">Reserved</th>
                  <th className="px-4 py-3 text-right">Available</th>
                  <th className="px-4 py-3">Health</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-muted">
                      Loading showroom stock...
                    </td>
                  </tr>
                ) : !data?.items.length ? (
                  <tr>
                    <td colSpan={7} className="p-4">
                      <AdminEmptyState
                        title="No matching SKUs"
                        description="Adjust your search or stock filter."
                      />
                    </td>
                  </tr>
                ) : (
                  data.items.map((row) => (
                    <tr key={row.id} className="hover:bg-shell/35">
                      <td className="px-4 py-3">
                        <p className="font-mono text-[10.5px] text-bronze">
                          {row.sku}
                        </p>
                        <Link
                          href={`/product/${row.productSlug}`}
                          target="_blank"
                          className="font-medium text-ink hover:text-bronze"
                        >
                          {row.productName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-[11.5px] text-muted">
                        {row.warehouseLocation}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-ink">
                        {row.quantityOnHand}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-bronze">
                        {row.quantityReserved}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-ink">
                        {row.available}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          status={
                            row.stockHealth === "out_of_stock"
                              ? "out-of-stock"
                              : row.stockHealth === "low_stock"
                                ? "under_review"
                                : "in-stock"
                          }
                          label={
                            row.stockHealth === "out_of_stock"
                              ? row.allowBackorder
                                ? "0 · Made to Order"
                                : "Out of Stock"
                              : row.stockHealth === "low_stock"
                                ? `Low (≤${row.lowStockThreshold})`
                                : "Healthy"
                          }
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openAdjust(row)}
                          className={adminCompactBtn}
                        >
                          <SlidersHorizontal size={11} /> Adjust
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {tab === "movements" ? (
        <div className="overflow-x-auto border border-line bg-parchment">
          <table className="w-full border-collapse text-left text-[12px]">
            <thead>
              <tr className="border-b border-line bg-shell/60 text-[9.5px] uppercase tracking-[0.16em] text-muted">
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">SKU & Piece</th>
                <th className="px-4 py-3">Movement</th>
                <th className="px-4 py-3 text-right">Delta</th>
                <th className="px-4 py-3 text-right">On Hand</th>
                <th className="px-4 py-3 text-right">Reserved</th>
                <th className="px-4 py-3">Reference & Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {!data?.movements.length ? (
                <tr>
                  <td colSpan={7} className="p-4">
                    <AdminEmptyState
                      title="No stock movements recorded yet"
                      description="Confirm an order, receive a purchase order, or adjust a SKU to populate the audit ledger."
                    />
                  </td>
                </tr>
              ) : (
                data.movements.map((m) => (
                  <tr key={m.id} className="hover:bg-shell/35">
                    <td className="px-4 py-3 text-[11px] tabular-nums text-muted">
                      {new Date(m.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[10.5px] text-bronze">
                        {m.sku}
                      </span>
                      <p className="text-ink">{m.productName}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={m.movementType} />
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {m.quantityDelta > 0
                        ? `+${m.quantityDelta}`
                        : m.quantityDelta}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[11px] tabular-nums text-muted">
                      {m.previousOnHand} → {m.newOnHand}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[11px] tabular-nums text-muted">
                      {m.previousReserved} → {m.newReserved}
                    </td>
                    <td className="px-4 py-3 text-[11.5px] text-ink-soft">
                      {m.referenceId ? (
                        <span className="mr-1.5 font-mono text-[10.5px] text-bronze">
                          [{m.referenceId}]
                        </span>
                      ) : null}
                      {m.reason}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "suppliers" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {!data?.suppliers.length ? (
            <div className="sm:col-span-2 lg:col-span-3">
              <AdminEmptyState
                title="No suppliers registered"
                description="Add timber mills, bouclé textile houses, and brass foundries."
              />
            </div>
          ) : (
            data.suppliers.map((s) => (
              <div
                key={s.id}
                className="border border-line bg-parchment p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-bronze">
                      {s.code}
                    </p>
                    <h3 className="mt-1 font-display text-xl text-ink">
                      {s.name}
                    </h3>
                  </div>
                  <StatusBadge status={s.isActive ? "active" : "inactive"} />
                </div>
                {s.materialsSupplied ? (
                  <p className="mt-2 text-[12px] text-ink-soft">
                    {s.materialsSupplied}
                  </p>
                ) : null}
                <div className="mt-4 space-y-1 border-t border-line/70 pt-3 text-[11px] text-muted">
                  {s.contactName ? <p>Contact: {s.contactName}</p> : null}
                  {s.phone ? <p>Tel: {s.phone}</p> : null}
                  <p>
                    {[s.city, s.country].filter(Boolean).join(", ")}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}

      {tab === "po" ? (
        <div className="overflow-x-auto border border-line bg-parchment">
          <table className="w-full border-collapse text-left text-[12px]">
            <thead>
              <tr className="border-b border-line bg-shell/60 text-[9.5px] uppercase tracking-[0.16em] text-muted">
                <th className="px-4 py-3">PO Number</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3 text-right">Total Cost</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {!data?.purchaseOrders.length ? (
                <tr>
                  <td colSpan={6} className="p-4">
                    <AdminEmptyState
                      title="No purchase orders yet"
                      description="Issue a purchase order to restock showroom pieces."
                    />
                  </td>
                </tr>
              ) : (
                data.purchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-shell/35">
                    <td className="px-4 py-3 font-mono text-[11.5px] text-ink">
                      {po.poNumber}
                    </td>
                    <td className="px-4 py-3 text-ink">{po.supplierName}</td>
                    <td className="px-4 py-3 text-[11.5px] text-muted">
                      {po.items
                        .map((i) => `${i.quantity}× ${i.sku}`)
                        .join(", ")}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-ink">
                      {formatRwf(po.totalAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={po.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {po.status !== "received" ? (
                        <button
                          type="button"
                          onClick={() => void handleReceivePo(po.id, po.poNumber)}
                          className={adminCompactDarkBtn}
                        >
                          <Truck size={11} /> Receive Stock
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                          <CheckCircle2 size={12} /> Received
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Adjust Stock Modal */}
      <AdminModal
        open={Boolean(selectedSku)}
        title={selectedSku ? `Adjust Stock · ${selectedSku.sku}` : "Adjust Stock"}
        subtitle={selectedSku?.productName}
        onClose={() => setSelectedSku(null)}
      >
        {selectedSku ? (
          <form onSubmit={handleSaveAdjust} className="space-y-4">
            <div className="grid grid-cols-3 gap-3 border border-line bg-shell/50 p-3 text-center">
              <div>
                <p className="text-[9.5px] uppercase tracking-[0.14em] text-muted">
                  Current On Hand
                </p>
                <p className="mt-1 font-display text-2xl text-ink">
                  {selectedSku.quantityOnHand}
                </p>
              </div>
              <div>
                <p className="text-[9.5px] uppercase tracking-[0.14em] text-muted">
                  Reserved
                </p>
                <p className="mt-1 font-display text-2xl text-bronze">
                  {selectedSku.quantityReserved}
                </p>
              </div>
              <div>
                <p className="text-[9.5px] uppercase tracking-[0.14em] text-muted">
                  New On Hand
                </p>
                <p className="mt-1 font-display text-2xl text-ink">
                  {Math.max(0, selectedSku.quantityOnHand + delta)}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-[10px] uppercase tracking-[0.15em] text-muted">
                  Quantity Change (+ / -)
                </span>
                <input
                  type="number"
                  value={delta}
                  onChange={(e) => setDelta(Number(e.target.value) || 0)}
                  className={`mt-1.5 ${adminInputClass}`}
                />
              </label>

              <label className="block">
                <span className="text-[10px] uppercase tracking-[0.15em] text-muted">
                  Movement Type
                </span>
                <select
                  value={adjType}
                  onChange={(e) =>
                    setAdjType(e.target.value as typeof adjType)
                  }
                  className={`mt-1.5 ${adminSelectClass}`}
                >
                  <option value="restock">Atelier Restock</option>
                  <option value="audit_correction">Cycle Count Audit</option>
                  <option value="showroom_transfer">Showroom Floor Transfer</option>
                  <option value="damage_writeoff">Damage / Write-off</option>
                </select>
              </label>
            </div>

            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.15em] text-muted">
                Reason (Audit Log)
              </span>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Completed workshop batch #14"
                required={delta !== 0}
                className={`mt-1.5 ${adminInputClass}`}
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-[10px] uppercase tracking-[0.15em] text-muted">
                  Low-Stock Alert Threshold
                </span>
                <input
                  type="number"
                  min={0}
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value) || 0)}
                  className={`mt-1.5 ${adminInputClass}`}
                />
              </label>

              <label className="block">
                <span className="text-[10px] uppercase tracking-[0.15em] text-muted">
                  Warehouse / Floor Location
                </span>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className={`mt-1.5 ${adminInputClass}`}
                />
              </label>
            </div>

            <label className="flex items-center gap-2 text-[12px] text-ink">
              <input
                type="checkbox"
                checked={allowBackorder}
                onChange={(e) => setAllowBackorder(e.target.checked)}
                className="accent-bronze"
              />
              Allow made-to-order requests when showroom stock reaches 0
            </label>

            <div className="flex justify-end gap-2 border-t border-line pt-4">
              <button
                type="button"
                onClick={() => setSelectedSku(null)}
                className={adminSecondaryBtn}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className={adminDarkBtn}
              >
                {saving ? "Saving..." : "Save Stock Update"}
              </button>
            </div>
          </form>
        ) : null}
      </AdminModal>

      {/* Supplier Modal */}
      <AdminModal
        open={supplierModal}
        title="Register Material Supplier"
        subtitle="Timber mills, upholstery weavers, stone quarries, and hardware partners."
        onClose={() => setSupplierModal(false)}
      >
        <form onSubmit={handleSaveSupplier} className="space-y-3.5">
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.15em] text-muted">
              Supplier Name *
            </span>
            <input
              type="text"
              required
              value={supName}
              onChange={(e) => setSupName(e.target.value)}
              placeholder="e.g. Nyungwe Sustainable Hardwoods"
              className={`mt-1 ${adminInputClass}`}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.15em] text-muted">
                Contact Person
              </span>
              <input
                type="text"
                value={supContact}
                onChange={(e) => setSupContact(e.target.value)}
                className={`mt-1 ${adminInputClass}`}
              />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.15em] text-muted">
                Phone
              </span>
              <input
                type="text"
                value={supPhone}
                onChange={(e) => setSupPhone(e.target.value)}
                placeholder="+250 788..."
                className={`mt-1 ${adminInputClass}`}
              />
            </label>
          </div>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.15em] text-muted">
              City
            </span>
            <input
              type="text"
              value={supCity}
              onChange={(e) => setSupCity(e.target.value)}
              className={`mt-1 ${adminInputClass}`}
            />
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.15em] text-muted">
              Materials Supplied
            </span>
            <input
              type="text"
              value={supMaterials}
              onChange={(e) => setSupMaterials(e.target.value)}
              placeholder="Kiln-dried oak, volcanic stone slabs, Belgian bouclé"
              className={`mt-1 ${adminInputClass}`}
            />
          </label>
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <button
              type="button"
              onClick={() => setSupplierModal(false)}
              className={adminSecondaryBtn}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={adminDarkBtn}
            >
              Save Supplier
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Purchase Order Modal */}
      <AdminModal
        open={poModal}
        title="Issue Purchase Order"
        subtitle="Order finished showroom units or workshop replenishment."
        onClose={() => setPoModal(false)}
      >
        <form onSubmit={handleCreatePo} className="space-y-3.5">
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.15em] text-muted">
              Supplier *
            </span>
            <select
              required
              value={poSupplierId}
              onChange={(e) => setPoSupplierId(e.target.value)}
              className={`mt-1 ${adminSelectClass}`}
            >
              <option value="">Select supplier...</option>
              {data?.suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.15em] text-muted">
              SKU to Replenish *
            </span>
            <select
              required
              value={poInventoryId}
              onChange={(e) => setPoInventoryId(e.target.value)}
              className={`mt-1 ${adminSelectClass}`}
            >
              {data?.items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.sku} — {item.productName}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.15em] text-muted">
                Quantity
              </span>
              <input
                type="number"
                min={1}
                required
                value={poQty}
                onChange={(e) => setPoQty(Number(e.target.value) || 1)}
                className={`mt-1 ${adminInputClass}`}
              />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.15em] text-muted">
                Unit Cost (RWF)
              </span>
              <input
                type="number"
                min={0}
                required
                value={poCost}
                onChange={(e) => setPoCost(Number(e.target.value) || 0)}
                className={`mt-1 ${adminInputClass}`}
              />
            </label>
          </div>

          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <button
              type="button"
              onClick={() => setPoModal(false)}
              className={adminSecondaryBtn}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !data?.suppliers.length}
              className={adminDarkBtn}
            >
              Issue PO ({formatRwf(poQty * poCost)})
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
