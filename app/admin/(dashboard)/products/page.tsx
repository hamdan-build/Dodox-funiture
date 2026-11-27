"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Archive,
  ExternalLink,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { adminFetch } from "@/components/admin/api-client";
import {
  adminDangerIconBtn,
  adminDarkBtn,
  AdminEmptyState,
  adminIconBtn,
  adminInputClass,
  AdminPageHeader,
  adminSelectClass,
  ConfirmDialog,
  StatusBadge,
} from "@/components/admin/ui";
import { formatRwf } from "@/lib/utils";
import { useUiStore } from "@/store/ui";
import type { Product } from "@/types";

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
}

export default function AdminProductsPage() {
  const pushToast = useUiStore((s) => s.pushToast);
  const addToast = useCallback(
    (t: { title: string; description?: string; tone?: "error" | "success" }) =>
      pushToast({
        title: t.title,
        description: t.description,
        variant: t.tone === "error" ? "error" : "success",
      }),
    [pushToast],
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [query, setQuery] = useState("");

  const [confirmTarget, setConfirmTarget] = useState<{
    product: Product;
    mode: "archive" | "delete";
  } | null>(null);
  const [busyAction, setBusyAction] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (statusFilter !== "all") qs.set("status", statusFilter);
      if (categoryFilter !== "all") qs.set("category", categoryFilter);
      if (availabilityFilter !== "all")
        qs.set("availability", availabilityFilter);
      if (query.trim()) qs.set("q", query.trim());

      const res = await adminFetch<{
        products: Product[];
        categories: CategoryRow[];
      }>(`/api/admin/products?${qs.toString()}`);
      setProducts(res.products);
      setCategories(res.categories);
    } catch (err) {
      addToast({
        title: "Failed to load products",
        description: err instanceof Error ? err.message : undefined,
        tone: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, availabilityFilter, query, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleQuickStatus = async (
    product: Product,
    nextStatus: "draft" | "published" | "archived",
  ) => {
    try {
      await adminFetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        body: JSON.stringify({ quickStatusOnly: true, status: nextStatus }),
      });
      addToast({ title: `"${product.name}" set to ${nextStatus}` });
      await loadData();
    } catch (err) {
      addToast({
        title: "Status update failed",
        description: err instanceof Error ? err.message : undefined,
        tone: "error",
      });
    }
  };

  const executeConfirm = async () => {
    if (!confirmTarget) return;
    setBusyAction(true);
    try {
      const res = await adminFetch<{ action: string; name: string }>(
        `/api/admin/products/${confirmTarget.product.id}?mode=${confirmTarget.mode}`,
        { method: "DELETE" },
      );
      addToast({
        title:
          res.action === "deleted"
            ? `"${res.name}" deleted`
            : `"${res.name}" archived safely`,
      });
      setConfirmTarget(null);
      await loadData();
    } catch (err) {
      addToast({
        title: "Operation failed",
        description: err instanceof Error ? err.message : undefined,
        tone: "error",
      });
    } finally {
      setBusyAction(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Module 2 · Catalogue"
        title="Products & Atelier Pieces"
        description="Manage published pieces, RWF pricing, variant configurations, availability states, galleries, and dimensions in Cloudflare D1."
        actions={
          <Link
            href="/admin/products/new"
            className={adminDarkBtn}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Piece
          </Link>
        }
      />

      {/* Filter Bar */}
      <div className="grid gap-3 border border-line bg-parchment p-4 sm:grid-cols-2 lg:grid-cols-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, SKU, or slug…"
          className={adminInputClass}
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className={adminSelectClass}
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={availabilityFilter}
          onChange={(e) => setAvailabilityFilter(e.target.value)}
          className={adminSelectClass}
        >
          <option value="all">All Availability States</option>
          <option value="in-stock">In Stock</option>
          <option value="made-to-order">Made to Order</option>
          <option value="pre-order">Pre-Order</option>
          <option value="out-of-stock">Out of Stock</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={adminSelectClass}
        >
          <option value="all">All Publish States</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {loading ? (
        <div className="h-72 animate-pulse border border-line bg-parchment" />
      ) : products.length === 0 ? (
        <AdminEmptyState
          title="No products match these filters"
          description="Adjust your search criteria or create a new furniture piece."
          action={
            <Link
              href="/admin/products/new"
              className={adminDarkBtn}
            >
              Add First Piece
            </Link>
          }
        />
      ) : (
        <div className="overflow-x-auto border border-line bg-parchment">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line bg-shell/60 text-[10px] uppercase tracking-[0.16em] text-muted">
              <tr>
                <th className="px-4 py-3">Piece</th>
                <th className="px-4 py-3">SKU & Category</th>
                <th className="px-4 py-3">Price (RWF)</th>
                <th className="px-4 py-3">Availability & Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {products.map((product) => (
                <tr key={product.id} className="transition-colors hover:bg-shell/35">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.images[0]?.src}
                        alt={product.name}
                        className="h-12 w-14 shrink-0 border border-line object-cover"
                      />
                      <div>
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="font-medium text-ink transition-colors hover:text-bronze hover:underline"
                        >
                          {product.name}
                        </Link>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted">
                          {product.featured && (
                            <span className="border border-bronze/30 bg-shell px-1.5 py-0.5 text-[9px] uppercase tracking-[0.12em] text-ink">
                              Featured
                            </span>
                          )}
                          {product.collection && (
                            <span>{product.collection}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-mono text-ink">{product.sku}</p>
                    <p className="capitalize text-muted">
                      {product.category.replace(/-/g, " ")}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">
                      {formatRwf(product.price)}
                    </p>
                    {product.compareAtPrice && (
                      <p className="text-[11px] text-muted line-through">
                        {formatRwf(product.compareAtPrice)}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={product.availability} />
                    <p className="mt-1 text-[11px] text-muted">
                      {product.stockQuantity ?? 0} available ·{" "}
                      {product.variants.length} option group
                      {product.variants.length === 1 ? "" : "s"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={product.status ?? "published"}
                      onChange={(e) =>
                        toggleQuickStatus(
                          product,
                          e.target.value as "draft" | "published" | "archived",
                        )
                      }
                      aria-label={`Change status for ${product.name}`}
                      className="border border-line bg-ivory px-2 py-1 text-[11px] capitalize text-ink transition-colors hover:border-taupe focus:border-bronze focus:outline-none"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                      <option value="archived">Archived</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {product.status === "published" && (
                        <Link
                          href={`/product/${product.slug}`}
                          target="_blank"
                          title="View on storefront"
                          aria-label={`View ${product.name} on storefront`}
                          className={adminIconBtn}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      )}
                      <Link
                        href={`/admin/products/${product.id}`}
                        title="Edit piece"
                        aria-label={`Edit ${product.name}`}
                        className={adminIconBtn}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmTarget({ product, mode: "archive" })
                        }
                        title="Archive piece"
                        aria-label={`Archive ${product.name}`}
                        className={adminIconBtn}
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmTarget({ product, mode: "delete" })
                        }
                        title="Delete piece"
                        aria-label={`Delete ${product.name}`}
                        className={adminDangerIconBtn}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        title={
          confirmTarget?.mode === "delete"
            ? "Delete Product Piece?"
            : "Archive Product Piece?"
        }
        description={
          confirmTarget
            ? confirmTarget.mode === "delete"
              ? `Permanently delete "${confirmTarget.product.name}"? (If orders reference this item, DODOX will automatically archive it instead to preserve historical financial records.)`
              : `Archive "${confirmTarget.product.name}" and hide it from the public storefront?`
            : ""
        }
        confirmLabel={
          confirmTarget?.mode === "delete" ? "Delete / Archive" : "Archive"
        }
        destructive={confirmTarget?.mode === "delete"}
        loading={busyAction}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={executeConfirm}
      />
    </div>
  );
}
