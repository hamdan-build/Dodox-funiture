"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2, Upload } from "lucide-react";
import {
  adminFetch,
  adminUploadFile,
} from "@/components/admin/api-client";
import {
  adminDangerIconBtn,
  adminDarkBtn,
  adminIconBtn,
  adminInputClass,
  AdminModal,
  AdminPageHeader,
  adminSecondaryBtn,
  adminSelectClass,
  adminTabClass,
  adminTextareaClass,
  ConfirmDialog,
  StatusBadge,
} from "@/components/admin/ui";
import { useUiStore } from "@/store/ui";
import type { Product } from "@/types";

interface AdminCategory {
  id: string;
  slug: string;
  parentId: string | null;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  sortOrder: number;
  isPublished: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  productCount: number;
}

interface AdminCollection {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  heroImageUrl: string | null;
  heroImageAlt: string | null;
  sortOrder: number;
  isFeatured: boolean;
  isPublished: boolean;
  productIds: string[];
  productCount: number;
}

export default function AdminCategoriesAndCollectionsPage() {
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
  const [tab, setTab] = useState<"categories" | "collections">("categories");
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [collections, setCollections] = useState<AdminCollection[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [catModal, setCatModal] = useState<{
    mode: "create" | "edit";
    id?: string;
    name: string;
    shortName: string;
    slug: string;
    parentId: string;
    tagline: string;
    description: string;
    imageUrl: string;
    imageAlt: string;
    sortOrder: number;
    isPublished: boolean;
  } | null>(null);

  const [colModal, setColModal] = useState<{
    mode: "create" | "edit";
    id?: string;
    name: string;
    slug: string;
    tagline: string;
    description: string;
    heroImageUrl: string;
    sortOrder: number;
    isFeatured: boolean;
    isPublished: boolean;
    productIds: string[];
  } | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{
    kind: "category" | "collection";
    id: string;
    name: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch<{
        products: Product[];
        categories: AdminCategory[];
        collections: AdminCollection[];
      }>("/api/admin/products");
      setCategories(res.categories);
      setCollections(res.collections);
      setProducts(res.products);
    } catch (err) {
      addToast({
        title: "Failed to load taxonomy",
        description: err instanceof Error ? err.message : undefined,
        tone: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catModal) return;
    setBusy(true);
    try {
      const payload = {
        name: catModal.name,
        shortName: catModal.shortName || catModal.name,
        slug: catModal.slug,
        parentId: catModal.parentId || null,
        tagline: catModal.tagline,
        description: catModal.description,
        imageUrl: catModal.imageUrl,
        imageAlt: catModal.imageAlt || catModal.name,
        sortOrder: Number(catModal.sortOrder) || 0,
        isPublished: catModal.isPublished,
      };
      if (catModal.mode === "create") {
        await adminFetch("/api/admin/categories", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        addToast({ title: "Category created" });
      } else {
        await adminFetch(`/api/admin/categories/${catModal.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        addToast({ title: "Category updated" });
      }
      setCatModal(null);
      await loadAll();
    } catch (err) {
      addToast({
        title: "Failed to save category",
        description: err instanceof Error ? err.message : undefined,
        tone: "error",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleSaveCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!colModal) return;
    setBusy(true);
    try {
      const payload = {
        name: colModal.name,
        slug: colModal.slug,
        tagline: colModal.tagline,
        description: colModal.description,
        heroImageUrl: colModal.heroImageUrl || null,
        sortOrder: Number(colModal.sortOrder) || 0,
        isFeatured: colModal.isFeatured,
        isPublished: colModal.isPublished,
        productIds: colModal.productIds,
      };
      if (colModal.mode === "create") {
        await adminFetch("/api/admin/collections", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        addToast({ title: "Collection created" });
      } else {
        await adminFetch(`/api/admin/collections/${colModal.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        addToast({ title: "Collection updated" });
      }
      setColModal(null);
      await loadAll();
    } catch (err) {
      addToast({
        title: "Failed to save collection",
        description: err instanceof Error ? err.message : undefined,
        tone: "error",
      });
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      const path =
        deleteTarget.kind === "category"
          ? `/api/admin/categories/${deleteTarget.id}`
          : `/api/admin/collections/${deleteTarget.id}`;
      await adminFetch(path, { method: "DELETE" });
      addToast({ title: `Deleted "${deleteTarget.name}"` });
      setDeleteTarget(null);
      await loadAll();
    } catch (err) {
      addToast({
        title: "Delete blocked",
        description: err instanceof Error ? err.message : undefined,
        tone: "error",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Module 3 · Taxonomy & Merchandising"
        title="Categories & Curated Collections"
        description="Organize room categories, display ordering, hero imagery, and signature collections."
        actions={
          tab === "categories" ? (
            <button
              type="button"
              onClick={() =>
                setCatModal({
                  mode: "create",
                  name: "",
                  shortName: "",
                  slug: "",
                  parentId: "",
                  tagline: "",
                  description: "",
                  imageUrl: "/images/categories/living-room.jpg",
                  imageAlt: "",
                  sortOrder: categories.length + 1,
                  isPublished: true,
                })
              }
              className={adminDarkBtn}
            >
              <Plus className="h-3.5 w-3.5" />
              New Category
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                setColModal({
                  mode: "create",
                  name: "",
                  slug: "",
                  tagline: "",
                  description: "",
                  heroImageUrl: "",
                  sortOrder: collections.length + 1,
                  isFeatured: false,
                  isPublished: true,
                  productIds: [],
                })
              }
              className={adminDarkBtn}
            >
              <Plus className="h-3.5 w-3.5" />
              New Collection
            </button>
          )
        }
      />

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-line pb-3" role="tablist" aria-label="Taxonomy sections">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "categories"}
          onClick={() => setTab("categories")}
          className={adminTabClass(tab === "categories")}
        >
          Room Categories ({categories.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "collections"}
          onClick={() => setTab("collections")}
          className={adminTabClass(tab === "collections")}
        >
          Curated Collections ({collections.length})
        </button>
      </div>

      {loading ? (
        <div className="h-64 animate-pulse border border-line bg-parchment" />
      ) : tab === "categories" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex flex-col overflow-hidden border border-line bg-parchment"
            >
              <div className="relative h-40 bg-sand/60">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cat.imageUrl}
                  alt={cat.imageAlt || cat.name}
                  className="h-full w-full object-cover"
                />
                <div className="absolute left-3 top-3">
                  <StatusBadge
                    status={cat.isPublished ? "published" : "draft"}
                  />
                </div>
              </div>
              <div className="flex flex-1 flex-col justify-between p-4">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-xl text-ink">
                      {cat.name}
                    </h3>
                    <span className="font-mono text-[11px] text-muted">
                      #{cat.sortOrder}
                    </span>
                  </div>
                  <p className="mt-0.5 font-mono text-[11px] text-bronze">
                    /shop?category={cat.slug}
                  </p>
                  <p className="mt-2 line-clamp-2 text-xs text-ink-soft">
                    {cat.tagline || cat.description}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-line/70 pt-3 text-xs">
                  <span className="text-muted">
                    {cat.productCount} piece{cat.productCount === 1 ? "" : "s"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      aria-label={`Edit category ${cat.name}`}
                      onClick={() =>
                        setCatModal({
                          mode: "edit",
                          id: cat.id,
                          name: cat.name,
                          shortName: cat.shortName,
                          slug: cat.slug,
                          parentId: cat.parentId ?? "",
                          tagline: cat.tagline,
                          description: cat.description,
                          imageUrl: cat.imageUrl,
                          imageAlt: cat.imageAlt,
                          sortOrder: cat.sortOrder,
                          isPublished: cat.isPublished,
                        })
                      }
                      className={adminIconBtn}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete category ${cat.name}`}
                      onClick={() =>
                        setDeleteTarget({
                          kind: "category",
                          id: cat.id,
                          name: cat.name,
                        })
                      }
                      className={adminDangerIconBtn}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {collections.map((col) => (
            <div
              key={col.id}
              className="flex flex-col justify-between border border-line bg-parchment p-5"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-2xl text-ink">
                    {col.name}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    {col.isFeatured && (
                      <span className="border border-bronze/30 bg-shell px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-ink">
                        Featured
                      </span>
                    )}
                    <StatusBadge
                      status={col.isPublished ? "published" : "draft"}
                    />
                  </div>
                </div>
                <p className="mt-1 font-mono text-[11px] text-bronze">
                  /shop?collection={col.slug}
                </p>
                <p className="mt-2 text-xs text-ink-soft">
                  {col.description || col.tagline || "Curated DODOX collection."}
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-line/70 pt-3 text-xs">
                <span className="text-muted">
                  {col.productCount} assigned piece
                  {col.productCount === 1 ? "" : "s"}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    aria-label={`Edit collection ${col.name}`}
                    onClick={() =>
                      setColModal({
                        mode: "edit",
                        id: col.id,
                        name: col.name,
                        slug: col.slug,
                        tagline: col.tagline,
                        description: col.description,
                        heroImageUrl: col.heroImageUrl ?? "",
                        sortOrder: col.sortOrder,
                        isFeatured: col.isFeatured,
                        isPublished: col.isPublished,
                        productIds: col.productIds,
                      })
                    }
                    className={adminIconBtn}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete collection ${col.name}`}
                    onClick={() =>
                      setDeleteTarget({
                        kind: "collection",
                        id: col.id,
                        name: col.name,
                      })
                    }
                    className={adminDangerIconBtn}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category Modal */}
      <AdminModal
        open={Boolean(catModal)}
        title={catModal?.mode === "create" ? "Create Category" : "Edit Category"}
        onClose={() => setCatModal(null)}
      >
        {catModal && (
          <form onSubmit={handleSaveCategory} className="space-y-3.5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-muted">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={catModal.name}
                  onChange={(e) =>
                    setCatModal({ ...catModal, name: e.target.value })
                  }
                  className={adminInputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-muted">
                  Short Nav Label *
                </label>
                <input
                  type="text"
                  required
                  value={catModal.shortName}
                  onChange={(e) =>
                    setCatModal({ ...catModal, shortName: e.target.value })
                  }
                  placeholder="Living"
                  className={adminInputClass}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-muted">
                  Slug
                </label>
                <input
                  type="text"
                  value={catModal.slug}
                  onChange={(e) =>
                    setCatModal({ ...catModal, slug: e.target.value })
                  }
                  className={`font-mono ${adminInputClass}`}
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-muted">
                  Parent Category
                </label>
                <select
                  value={catModal.parentId}
                  onChange={(e) =>
                    setCatModal({ ...catModal, parentId: e.target.value })
                  }
                  className={adminSelectClass}
                >
                  <option value="">Top-level</option>
                  {categories
                    .filter((c) => c.id !== catModal.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-muted">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={catModal.sortOrder}
                  onChange={(e) =>
                    setCatModal({
                      ...catModal,
                      sortOrder: Number(e.target.value) || 0,
                    })
                  }
                  className={adminInputClass}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-muted">
                Tagline
              </label>
              <input
                type="text"
                value={catModal.tagline}
                onChange={(e) =>
                  setCatModal({ ...catModal, tagline: e.target.value })
                }
                className={adminInputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-muted">
                Description
              </label>
              <textarea
                rows={2}
                value={catModal.description}
                onChange={(e) =>
                  setCatModal({ ...catModal, description: e.target.value })
                }
                className={adminTextareaClass}
              />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-[10px] uppercase tracking-[0.14em] text-muted">
                  Hero Image URL *
                </label>
                <label className="inline-flex cursor-pointer items-center gap-1 text-xs text-bronze underline transition-colors hover:text-bronze-dark">
                  <Upload className="h-3 w-3" />
                  Upload to R2
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const fd = new FormData();
                      fd.append("file", f);
                      fd.append("folder", "categories");
                      const res = await adminUploadFile<{
                        asset: { publicUrl: string };
                      }>("/api/admin/media", fd);
                      setCatModal({
                        ...catModal,
                        imageUrl: res.asset.publicUrl,
                      });
                    }}
                    className="sr-only"
                  />
                </label>
              </div>
              <input
                type="text"
                required
                value={catModal.imageUrl}
                onChange={(e) =>
                  setCatModal({ ...catModal, imageUrl: e.target.value })
                }
                className={`font-mono ${adminInputClass}`}
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-ink">
              <input
                type="checkbox"
                checked={catModal.isPublished}
                onChange={(e) =>
                  setCatModal({ ...catModal, isPublished: e.target.checked })
                }
                className="accent-bronze"
              />
              Published on Storefront
            </label>

            <div className="flex justify-end gap-2 border-t border-line pt-4">
              <button
                type="button"
                onClick={() => setCatModal(null)}
                className={adminSecondaryBtn}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className={adminDarkBtn}
              >
                {busy ? "Saving…" : "Save Category"}
              </button>
            </div>
          </form>
        )}
      </AdminModal>

      {/* Collection Modal */}
      <AdminModal
        open={Boolean(colModal)}
        title={
          colModal?.mode === "create" ? "Create Collection" : "Edit Collection"
        }
        onClose={() => setColModal(null)}
      >
        {colModal && (
          <form onSubmit={handleSaveCollection} className="space-y-3.5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-muted">
                  Collection Name *
                </label>
                <input
                  type="text"
                  required
                  value={colModal.name}
                  onChange={(e) =>
                    setColModal({ ...colModal, name: e.target.value })
                  }
                  className={adminInputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-muted">
                  Slug
                </label>
                <input
                  type="text"
                  value={colModal.slug}
                  onChange={(e) =>
                    setColModal({ ...colModal, slug: e.target.value })
                  }
                  className={`font-mono ${adminInputClass}`}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-muted">
                Tagline
              </label>
              <input
                type="text"
                value={colModal.tagline}
                onChange={(e) =>
                  setColModal({ ...colModal, tagline: e.target.value })
                }
                className={adminInputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-muted">
                Description
              </label>
              <textarea
                rows={2}
                value={colModal.description}
                onChange={(e) =>
                  setColModal({ ...colModal, description: e.target.value })
                }
                className={adminTextareaClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] uppercase tracking-[0.14em] text-muted">
                Assigned Pieces ({colModal.productIds.length})
              </label>
              <div className="max-h-44 space-y-1.5 overflow-y-auto border border-line bg-ivory p-3">
                {products.map((prod) => {
                  const checked = colModal.productIds.includes(prod.id);
                  return (
                    <label
                      key={prod.id}
                      className="flex items-center gap-2 text-xs text-ink"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...colModal.productIds, prod.id]
                            : colModal.productIds.filter((x) => x !== prod.id);
                          setColModal({ ...colModal, productIds: next });
                        }}
                        className="accent-bronze"
                      />
                      <span>{prod.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-5 pt-1 text-xs text-ink">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={colModal.isFeatured}
                  onChange={(e) =>
                    setColModal({ ...colModal, isFeatured: e.target.checked })
                  }
                  className="accent-bronze"
                />
                Featured Collection
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={colModal.isPublished}
                  onChange={(e) =>
                    setColModal({ ...colModal, isPublished: e.target.checked })
                  }
                  className="accent-bronze"
                />
                Published
              </label>
            </div>

            <div className="flex justify-end gap-2 border-t border-line pt-4">
              <button
                type="button"
                onClick={() => setColModal(null)}
                className={adminSecondaryBtn}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className={adminDarkBtn}
              >
                {busy ? "Saving…" : "Save Collection"}
              </button>
            </div>
          </form>
        )}
      </AdminModal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete ${deleteTarget?.kind === "category" ? "Category" : "Collection"}?`}
        description={`Remove "${deleteTarget?.name}" from Cloudflare D1?`}
        confirmLabel="Delete"
        destructive
        loading={busy}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
