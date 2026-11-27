"use client";

import { useCallback, useEffect, useState } from "react";
import { Edit2, Plus, Tag, Trash2 } from "lucide-react";
import { adminFetch, ClientApiError } from "@/components/admin/api-client";
import {
  AdminEmptyState,
  AdminModal,
  AdminPageHeader,
  adminCompactBtn,
  adminDangerIconBtn,
  adminDarkBtn,
  adminInputClass,
  adminSecondaryBtn,
  adminSelectClass,
  StatusBadge,
} from "@/components/admin/ui";
import { formatRwf } from "@/lib/utils";
import { useUiStore } from "@/store/ui";

interface CouponRow {
  id: string;
  code: string;
  label: string;
  description: string;
  discountType: "fixed" | "percent";
  value: number;
  minimumSubtotal: number;
  maximumDiscount: number | null;
  startsAt: string | null;
  expiresAt: string | null;
  usageLimit: number | null;
  usageCount: number;
  isActive: boolean;
  isDemo: boolean;
}

interface PromotionRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  campaignType: string;
  discountType: "fixed" | "percent";
  value: number;
  minimumSubtotal: number;
  bannerText: string | null;
  isActive: boolean;
}

export default function AdminPromotionsPage() {
  const pushToast = useUiStore((s) => s.pushToast);
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [promotions, setPromotions] = useState<PromotionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [couponModal, setCouponModal] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"fixed" | "percent">(
    "fixed",
  );
  const [value, setValue] = useState(100000);
  const [minimumSubtotal, setMinimumSubtotal] = useState(500000);
  const [maximumDiscount, setMaximumDiscount] = useState<string>("");
  const [usageLimit, setUsageLimit] = useState<string>("");
  const [isActive, setIsActive] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch<{
        coupons: CouponRow[];
        promotions: PromotionRow[];
      }>("/api/admin/promotions");
      setCoupons(res.coupons);
      setPromotions(res.promotions);
    } catch (err) {
      pushToast({
        title: "Failed to load coupons",
        description:
          err instanceof ClientApiError ? err.message : "Network error",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const openNewCoupon = () => {
    setEditingId(undefined);
    setCode("");
    setLabel("");
    setDescription("");
    setDiscountType("fixed");
    setValue(100000);
    setMinimumSubtotal(500000);
    setMaximumDiscount("");
    setUsageLimit("");
    setIsActive(true);
    setIsDemo(false);
    setCouponModal(true);
  };

  const openEditCoupon = (c: CouponRow) => {
    setEditingId(c.id);
    setCode(c.code);
    setLabel(c.label);
    setDescription(c.description);
    setDiscountType(c.discountType);
    setValue(c.value);
    setMinimumSubtotal(c.minimumSubtotal);
    setMaximumDiscount(c.maximumDiscount ? String(c.maximumDiscount) : "");
    setUsageLimit(c.usageLimit ? String(c.usageLimit) : "");
    setIsActive(c.isActive);
    setIsDemo(c.isDemo);
    setCouponModal(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminFetch("/api/admin/promotions", {
        method: "POST",
        body: JSON.stringify({
          entity: "coupon",
          id: editingId,
          code,
          label,
          description,
          discountType,
          value,
          minimumSubtotal,
          maximumDiscount: maximumDiscount ? Number(maximumDiscount) : null,
          usageLimit: usageLimit ? Number(usageLimit) : null,
          isActive,
          isDemo,
        }),
      });
      pushToast({
        title: editingId ? "Coupon updated" : "Coupon created",
        description: code.toUpperCase(),
        variant: "success",
      });
      setCouponModal(false);
      await load();
    } catch (err) {
      pushToast({
        title: "Save failed",
        description:
          err instanceof ClientApiError ? err.message : "Invalid coupon fields",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCoupon = async (id: string, couponCode: string) => {
    try {
      await adminFetch(`/api/admin/promotions?entity=coupon&id=${id}`, {
        method: "DELETE",
      });
      pushToast({
        title: "Coupon deleted",
        description: couponCode,
        variant: "info",
      });
      await load();
    } catch (err) {
      pushToast({
        title: "Delete failed",
        description:
          err instanceof ClientApiError ? err.message : "Could not delete",
        variant: "error",
      });
    }
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Module 7 · Pricing Incentives"
        title="Discounts & Coupons"
        description="Manage authoritative server-validated coupon codes (integer RWF fixed amounts or percentage rules, minimum subtotal gates, caps, and showroom demo toggles)."
        actions={
          <button
            type="button"
            onClick={openNewCoupon}
            className={adminDarkBtn}
          >
            <Plus size={13} /> New Coupon Code
          </button>
        }
      />

      <div className="overflow-x-auto border border-line bg-parchment">
        <table className="w-full border-collapse text-left text-[12px]">
          <thead>
            <tr className="border-b border-line bg-shell/60 text-[9.5px] uppercase tracking-[0.16em] text-muted">
              <th className="px-4 py-3">Code & Label</th>
              <th className="px-4 py-3">Benefit</th>
              <th className="px-4 py-3 text-right">Min Subtotal</th>
              <th className="px-4 py-3 text-right">Redemptions</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/70">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted">
                  Loading coupons...
                </td>
              </tr>
            ) : !coupons.length ? (
              <tr>
                <td colSpan={6} className="p-4">
                  <AdminEmptyState
                    title="No coupons configured"
                    description="Create fixed RWF or percentage discount codes for checkout."
                  />
                </td>
              </tr>
            ) : (
              coupons.map((c) => (
                <tr key={c.id} className="hover:bg-shell/35">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Tag size={13} className="text-bronze" />
                      <span className="font-mono text-[12px] font-semibold text-ink">
                        {c.code}
                      </span>
                      {c.isDemo ? (
                        <span className="border border-bronze/40 bg-peach/50 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.12em] text-peach-ink">
                          Demo Code
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-[11.5px] text-muted">{c.label}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-ink">
                    {c.discountType === "fixed"
                      ? formatRwf(c.value)
                      : `${c.value}% off`}
                    {c.maximumDiscount ? (
                      <span className="block text-[10.5px] text-muted">
                        Cap: {formatRwf(c.maximumDiscount)}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-muted">
                    {c.minimumSubtotal > 0 ? formatRwf(c.minimumSubtotal) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-ink">
                    {c.usageCount}
                    {c.usageLimit ? ` / ${c.usageLimit}` : " / ∞"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.isActive ? "active" : "inactive"} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditCoupon(c)}
                        className={adminCompactBtn}
                      >
                        <Edit2 size={11} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteCoupon(c.id, c.code)}
                        className={adminDangerIconBtn}
                        aria-label={`Delete ${c.code}`}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {promotions.length > 0 ? (
        <div className="mt-8">
          <h2 className="mb-3 font-display text-2xl text-ink">
            Seasonal Campaigns
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {promotions.map((p) => (
              <div key={p.id} className="border border-line bg-parchment p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-ink">{p.name}</h3>
                  <StatusBadge status={p.isActive ? "active" : "inactive"} />
                </div>
                <p className="mt-1 text-[12px] text-muted">{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <AdminModal
        open={couponModal}
        title={editingId ? `Edit Coupon · ${code}` : "Create Coupon Code"}
        subtitle="Validated server-side during cart quote & checkout submission."
        onClose={() => setCouponModal(false)}
      >
        <form onSubmit={handleSaveCoupon} className="space-y-3.5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
                Code *
              </span>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="KIGALIVIP"
                className={`mt-1 font-mono uppercase ${adminInputClass}`}
              />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
                Display Label *
              </span>
              <input
                type="text"
                required
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Showroom House Courtesy"
                className={`mt-1 ${adminInputClass}`}
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
                Discount Type
              </span>
              <select
                value={discountType}
                onChange={(e) =>
                  setDiscountType(e.target.value as "fixed" | "percent")
                }
                className={`mt-1 ${adminSelectClass}`}
              >
                <option value="fixed">Fixed Amount (RWF)</option>
                <option value="percent">Percentage (%)</option>
              </select>
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
                {discountType === "fixed" ? "Amount (RWF)" : "Percentage (1–100)"}
              </span>
              <input
                type="number"
                required
                min={1}
                max={discountType === "percent" ? 100 : undefined}
                value={value}
                onChange={(e) => setValue(Number(e.target.value) || 0)}
                className={`mt-1 ${adminInputClass}`}
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
                Min Subtotal (RWF)
              </span>
              <input
                type="number"
                min={0}
                value={minimumSubtotal}
                onChange={(e) => setMinimumSubtotal(Number(e.target.value) || 0)}
                className={`mt-1 ${adminInputClass}`}
              />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
                Max Discount Cap
              </span>
              <input
                type="number"
                min={0}
                value={maximumDiscount}
                onChange={(e) => setMaximumDiscount(e.target.value)}
                placeholder="Optional"
                className={`mt-1 ${adminInputClass}`}
              />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
                Total Usage Cap
              </span>
              <input
                type="number"
                min={0}
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                placeholder="Unlimited"
                className={`mt-1 ${adminInputClass}`}
              />
            </label>
          </div>

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
              Description
            </span>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`mt-1 ${adminInputClass}`}
            />
          </label>

          <div className="flex flex-wrap gap-5 pt-1 text-[12px] text-ink">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="accent-bronze"
              />
              Active at checkout
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isDemo}
                onChange={(e) => setIsDemo(e.target.checked)}
                className="accent-bronze"
              />
              Mark as public Demo Promo Code
            </label>
          </div>

          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <button
              type="button"
              onClick={() => setCouponModal(false)}
              className={adminSecondaryBtn}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={adminDarkBtn}
            >
              {saving ? "Saving..." : "Save Coupon"}
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
