"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FolderOpen,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import Link from "next/link";
import {
  adminFetch,
  adminUploadFile,
} from "@/components/admin/api-client";
import {
  adminCompactBtn,
  adminCompactDarkBtn,
  adminDangerIconBtn,
  adminDarkBtn,
  adminInputClass,
  AdminModal,
  adminSelectClass,
  adminTextareaClass,
} from "@/components/admin/ui";
import { useUiStore } from "@/store/ui";
import type { Availability, Product } from "@/types";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface CollectionOption {
  id: string;
  name: string;
  slug: string;
}

interface MediaPickerItem {
  id: string;
  publicUrl: string;
  filename: string;
  altText: string;
}

interface ProductEditorProps {
  mode: "create" | "edit";
  initialProduct?: Product;
  categories: CategoryOption[];
  collections: CollectionOption[];
}

export function ProductEditor({
  mode,
  initialProduct,
  categories,
  collections,
}: ProductEditorProps) {
  const router = useRouter();
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

  const [name, setName] = useState(initialProduct?.name ?? "");
  const [slug, setSlug] = useState(initialProduct?.slug ?? "");
  const [sku, setSku] = useState(initialProduct?.sku ?? "");
  const [categoryId, setCategoryId] = useState(
    initialProduct?.categoryId ?? categories[0]?.id ?? "",
  );
  const [collectionId, setCollectionId] = useState<string>(
    initialProduct?.collectionId ?? "",
  );
  const [subtitle, setSubtitle] = useState(initialProduct?.subtitle ?? "");
  const [description, setDescription] = useState(
    initialProduct?.description ?? "",
  );
  const [story, setStory] = useState(initialProduct?.story ?? "");
  const [basePrice, setBasePrice] = useState<number>(
    initialProduct?.price ?? 950000,
  );
  const [compareAtPrice, setCompareAtPrice] = useState<string>(
    initialProduct?.compareAtPrice ? String(initialProduct.compareAtPrice) : "",
  );
  const [availability, setAvailability] = useState<Availability>(
    initialProduct?.availability ?? "in-stock",
  );
  const [leadTime, setLeadTime] = useState(
    initialProduct?.leadTime ?? "Ready in 3–5 business days",
  );
  const [featured, setFeatured] = useState(initialProduct?.featured ?? false);
  const [badge, setBadge] = useState(initialProduct?.badge ?? "");
  const [seating, setSeating] = useState<string>(
    initialProduct?.seating ? String(initialProduct.seating) : "",
  );
  const [status, setStatus] = useState<"draft" | "published" | "archived">(
    initialProduct?.status ?? "published",
  );
  const [initialStock, setInitialStock] = useState<number>(
    initialProduct?.stockQuantity ?? 4,
  );

  const [images, setImages] = useState<
    Array<{ url: string; altText: string; mediaId?: string | null }>
  >(
    initialProduct?.images.map((i) => ({ url: i.src, altText: i.alt })) ?? [],
  );

  const [materialsText, setMaterialsText] = useState(
    initialProduct?.materials.join(", ") ?? "Kiln-dried eucalyptus, Performance bouclé",
  );
  const [colors, setColors] = useState<Array<{ name: string; hex: string }>>(
    initialProduct?.colors ?? [{ name: "Warm Ivory", hex: "#EAE3D5" }],
  );
  const [dimensions, setDimensions] = useState<
    Array<{ label: string; value: string }>
  >(
    initialProduct?.dimensions ?? [
      { label: "Width", value: "220 cm" },
      { label: "Depth", value: "95 cm" },
      { label: "Height", value: "76 cm" },
    ],
  );
  const [specs, setSpecs] = useState<Array<{ label: string; value: string }>>(
    initialProduct?.specs ?? [
      { label: "Frame", value: "Solid kiln-dried Rwandan hardwood" },
    ],
  );
  const [careText, setCareText] = useState(
    initialProduct?.care.join("\n") ??
      "Dust weekly with a dry microfiber cloth.\nBlot spills immediately with an unbleached cotton cloth.",
  );
  const [variants, setVariants] = useState(
    initialProduct?.variants ?? [
      {
        id: "finish",
        label: "Finish",
        helper: "",
        options: [
          {
            id: "natural-oak",
            label: "Natural Satin Finish",
            helper: "",
            priceDelta: 0,
            swatch: "#C69A6B",
            leadTime: "",
          },
        ],
      },
    ],
  );
  const [tagsText, setTagsText] = useState(
    (initialProduct?.tags ?? []).join(", "),
  );
  const [seoTitle, setSeoTitle] = useState(initialProduct?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(
    initialProduct?.seoDescription ?? "",
  );

  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerAssets, setPickerAssets] = useState<MediaPickerItem[]>([]);

  const handleUploadProductPhoto = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingImg(true);
    try {
      const next = [...images];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", "products");
        fd.append("altText", name || file.name);
        const res = await adminUploadFile<{
          asset: { id: string; publicUrl: string; altText: string };
        }>("/api/admin/media", fd);
        next.push({
          url: res.asset.publicUrl,
          altText: res.asset.altText || name,
          mediaId: res.asset.id,
        });
      }
      setImages(next);
      addToast({ title: "Photo uploaded to R2 & added to gallery" });
    } catch (err) {
      addToast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : undefined,
        tone: "error",
      });
    } finally {
      setUploadingImg(false);
    }
  };

  const openMediaPicker = async () => {
    setPickerOpen(true);
    try {
      const res = await adminFetch<{ assets: MediaPickerItem[] }>(
        "/api/admin/media",
      );
      setPickerAssets(res.assets);
    } catch {
      setPickerAssets([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name,
        slug,
        sku,
        categoryId,
        collectionId: collectionId || null,
        subtitle,
        description,
        story,
        basePrice: Math.round(Number(basePrice) || 0),
        compareAtPrice: compareAtPrice.trim()
          ? Math.round(Number(compareAtPrice))
          : null,
        availability,
        leadTime,
        featured,
        badge: badge.trim() || null,
        seating: seating.trim() ? Math.round(Number(seating)) : null,
        status,
        images,
        materials: materialsText
          .split(",")
          .map((m) => m.trim())
          .filter(Boolean),
        colors: colors.filter((c) => c.name.trim()),
        dimensions: dimensions.filter((d) => d.label.trim() && d.value.trim()),
        specs: specs.filter((s) => s.label.trim() && s.value.trim()),
        care: careText
          .split("\n")
          .map((c) => c.trim())
          .filter(Boolean),
        variants: variants.map((g) => ({
          id: g.id || g.label,
          label: g.label,
          helper: g.helper || "",
          options: g.options.map((o) => ({
            id: o.id || o.label,
            label: o.label,
            helper: o.helper || "",
            priceDelta: Math.round(Number(o.priceDelta) || 0),
            swatch: o.swatch || "",
            leadTime: o.leadTime || "",
          })),
        })),
        tags: tagsText
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        seoTitle: seoTitle.trim() || null,
        seoDescription: seoDescription.trim() || null,
        ...(mode === "create" ? { initialStock } : {}),
      };

      if (mode === "create") {
        await adminFetch("/api/admin/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        addToast({ title: "Product created & published to D1" });
      } else if (initialProduct) {
        await adminFetch(`/api/admin/products/${initialProduct.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        addToast({ title: "Product changes saved" });
      }
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      addToast({
        title: "Could not save product",
        description: err instanceof Error ? err.message : undefined,
        tone: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Products
          </Link>
          <h1 className="mt-2 font-display text-2xl text-ink sm:text-3xl">
            {mode === "create" ? "Add New Piece" : `Edit ${initialProduct?.name}`}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as "draft" | "published" | "archived")
            }
            className="h-9 border border-line bg-parchment px-3 text-xs uppercase tracking-[0.14em] text-ink transition-colors hover:border-taupe focus:border-bronze focus:outline-none"
          >
            <option value="published">Status: Published</option>
            <option value="draft">Status: Draft</option>
            <option value="archived">Status: Archived</option>
          </select>
          <button
            type="submit"
            disabled={saving}
            className={`${adminDarkBtn} px-6`}
          >
            {saving
              ? "Saving…"
              : mode === "create"
                ? "Create Piece"
                : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Columns */}
        <div className="space-y-6 lg:col-span-2">
          {/* Core Details */}
          <section className="space-y-4 border border-line bg-parchment p-5">
            <h2 className="font-display text-xl text-ink">
              Identity & Narrative
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-muted">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Imanzi Low-Profile Sofa"
                  className={adminInputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-muted">
                  URL Slug (auto-generated if blank)
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="imanzi-low-profile-sofa"
                  className={`font-mono ${adminInputClass}`}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-muted">
                Subtitle
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Three-seater architectural sofa in kiln-dried eucalyptus and bouclé"
                className={adminInputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-muted">
                Editorial Description *
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={adminTextareaClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-muted">
                Atelier Craft Story
              </label>
              <textarea
                rows={3}
                value={story}
                onChange={(e) => setStory(e.target.value)}
                className={adminTextareaClass}
              />
            </div>
          </section>

          {/* Gallery */}
          <section className="space-y-4 border border-line bg-parchment p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-xl text-ink">
                  Product Gallery *
                </h2>
                <p className="text-xs text-muted">
                  First photo is used as the primary catalogue image.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={openMediaPicker}
                  className={adminCompactBtn}
                >
                  <FolderOpen className="h-3.5 w-3.5" />
                  Media Library
                </button>
                <label
                  className={`cursor-pointer focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-bronze ${adminCompactDarkBtn}`}
                >
                  <Upload className="h-3.5 w-3.5" />
                  {uploadingImg ? "Uploading…" : "Upload Photo"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    multiple
                    disabled={uploadingImg}
                    onChange={(e) => handleUploadProductPhoto(e.target.files)}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>

            {images.length === 0 ? (
              <div className="border border-dashed border-line bg-ivory p-6 text-center text-xs text-muted">
                Upload at least one photograph or select from the R2 Media Library.
              </div>
            ) : (
              <div className="space-y-2.5">
                {images.map((img, idx) => (
                  <div
                    key={`${img.url}-${idx}`}
                    className="flex items-center gap-3 border border-line bg-ivory p-2.5"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.altText}
                      className="h-14 w-16 shrink-0 border border-line object-cover"
                    />
                    <div className="grid flex-1 gap-2 sm:grid-cols-2">
                      <input
                        type="text"
                        value={img.url}
                        onChange={(e) => {
                          const next = [...images];
                          next[idx] = { ...next[idx], url: e.target.value };
                          setImages(next);
                        }}
                        placeholder="Image URL"
                        className="border border-line bg-parchment px-2.5 py-1.5 font-mono text-xs text-ink focus:border-bronze focus:outline-none"
                      />
                      <input
                        type="text"
                        value={img.altText}
                        onChange={(e) => {
                          const next = [...images];
                          next[idx] = { ...next[idx], altText: e.target.value };
                          setImages(next);
                        }}
                        placeholder="Alt text description"
                        className="border border-line bg-parchment px-2.5 py-1.5 text-xs text-ink focus:border-bronze focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setImages(images.filter((_, i) => i !== idx))
                      }
                      className={adminDangerIconBtn}
                      aria-label="Remove image"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Variants & Configurable Options */}
          <section className="space-y-4 border border-line bg-parchment p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-xl text-ink">
                  Configuration Options & Variant Pricing
                </h2>
                <p className="text-xs text-muted">
                  Define upholstery, timber finish, or size options with integer RWF price adjustments.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setVariants([
                    ...variants,
                    {
                      id: `group-${variants.length + 1}`,
                      label: "Size",
                      helper: "",
                      options: [
                        {
                          id: "standard",
                          label: "Standard",
                          helper: "",
                          priceDelta: 0,
                          swatch: "",
                          leadTime: "",
                        },
                      ],
                    },
                  ])
                }
                className={adminCompactBtn}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Option Group
              </button>
            </div>

            {variants.map((group, gIdx) => (
              <div
                key={gIdx}
                className="space-y-3 border border-line bg-ivory p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <input
                    type="text"
                    value={group.label}
                    onChange={(e) => {
                      const next = [...variants];
                      next[gIdx] = {
                        ...next[gIdx],
                        label: e.target.value,
                        id: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                      };
                      setVariants(next);
                    }}
                    placeholder="Group Label (e.g. Upholstery, Timber Finish)"
                    className="flex-1 border border-line bg-parchment px-3 py-1.5 text-sm font-medium text-ink focus:border-bronze focus:outline-none"
                  />
                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setVariants(variants.filter((_, i) => i !== gIdx))
                      }
                      className="text-xs text-[#8b3528] hover:underline"
                    >
                      Remove Group
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {group.options.map((opt, oIdx) => (
                    <div
                      key={oIdx}
                      className="grid gap-2 sm:grid-cols-12 sm:items-center"
                    >
                      <input
                        type="text"
                        value={opt.label}
                        onChange={(e) => {
                          const next = [...variants];
                          const nextOpts = [...next[gIdx].options];
                          nextOpts[oIdx] = {
                            ...nextOpts[oIdx],
                            label: e.target.value,
                            id: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                          };
                          next[gIdx] = { ...next[gIdx], options: nextOpts };
                          setVariants(next);
                        }}
                        placeholder="Option label"
                        className="border border-line bg-parchment px-2.5 py-1.5 text-xs text-ink focus:border-bronze focus:outline-none sm:col-span-5"
                      />
                      <input
                        type="number"
                        step={1}
                        value={opt.priceDelta}
                        onChange={(e) => {
                          const next = [...variants];
                          const nextOpts = [...next[gIdx].options];
                          nextOpts[oIdx] = {
                            ...nextOpts[oIdx],
                            priceDelta: Number(e.target.value) || 0,
                          };
                          next[gIdx] = { ...next[gIdx], options: nextOpts };
                          setVariants(next);
                        }}
                        placeholder="+/- RWF delta"
                        className="border border-line bg-parchment px-2.5 py-1.5 text-xs text-ink focus:border-bronze focus:outline-none sm:col-span-3"
                      />
                      <input
                        type="text"
                        value={opt.swatch ?? ""}
                        onChange={(e) => {
                          const next = [...variants];
                          const nextOpts = [...next[gIdx].options];
                          nextOpts[oIdx] = {
                            ...nextOpts[oIdx],
                            swatch: e.target.value,
                          };
                          next[gIdx] = { ...next[gIdx], options: nextOpts };
                          setVariants(next);
                        }}
                        placeholder="#HEX (optional)"
                        className="border border-line bg-parchment px-2.5 py-1.5 font-mono text-xs text-ink focus:border-bronze focus:outline-none sm:col-span-3"
                      />
                      <button
                        type="button"
                        disabled={group.options.length <= 1}
                        aria-label="Remove option value"
                        onClick={() => {
                          const next = [...variants];
                          next[gIdx] = {
                            ...next[gIdx],
                            options: next[gIdx].options.filter(
                              (_, i) => i !== oIdx,
                            ),
                          };
                          setVariants(next);
                        }}
                        className={`justify-self-end sm:col-span-1 ${adminDangerIconBtn}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const next = [...variants];
                    next[gIdx] = {
                      ...next[gIdx],
                      options: [
                        ...next[gIdx].options,
                        {
                          id: `opt-${next[gIdx].options.length + 1}`,
                          label: "New Finish",
                          helper: "",
                          priceDelta: 0,
                          swatch: "",
                          leadTime: "",
                        },
                      ],
                    };
                    setVariants(next);
                  }}
                  className="text-xs font-medium text-bronze underline underline-offset-4 transition-colors hover:text-bronze-dark"
                >
                  + Add option value
                </button>
              </div>
            ))}
          </section>

          {/* Dimensions, Craft Specs & Care */}
          <section className="space-y-5 border border-line bg-parchment p-5">
            <h2 className="font-display text-xl text-ink">
              Dimensions, Materials & Care
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-muted">
                  Materials (comma-separated)
                </label>
                <input
                  type="text"
                  value={materialsText}
                  onChange={(e) => setMaterialsText(e.target.value)}
                  className={adminInputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-muted">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={tagsText}
                  onChange={(e) => setTagsText(e.target.value)}
                  placeholder="modular, bouclé, hospitality"
                  className={adminInputClass}
                />
              </div>
            </div>

            {/* Colors */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-[10px] uppercase tracking-[0.14em] text-muted">
                  Colour Swatches
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setColors([...colors, { name: "Warm Sand", hex: "#D7C9B4" }])
                  }
                  className="text-xs font-medium text-bronze underline transition-colors hover:text-bronze-dark"
                >
                  + Add Colour
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {colors.map((c, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="color"
                      value={c.hex.startsWith("#") && c.hex.length === 7 ? c.hex : "#C8B89E"}
                      onChange={(e) => {
                        const next = [...colors];
                        next[idx] = { ...next[idx], hex: e.target.value };
                        setColors(next);
                      }}
                      className="h-8 w-8 cursor-pointer border border-line bg-ivory p-0.5"
                    />
                    <input
                      type="text"
                      value={c.name}
                      onChange={(e) => {
                        const next = [...colors];
                        next[idx] = { ...next[idx], name: e.target.value };
                        setColors(next);
                      }}
                      placeholder="Swatch Name"
                      className="flex-1 border border-line bg-ivory px-2.5 py-1.5 text-xs text-ink focus:border-bronze focus:outline-none"
                    />
                    <button
                      type="button"
                      aria-label={`Remove swatch ${c.name}`}
                      onClick={() =>
                        setColors(colors.filter((_, i) => i !== idx))
                      }
                      className={adminDangerIconBtn}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Dimensions */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-[10px] uppercase tracking-[0.14em] text-muted">
                  Architectural Dimensions
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setDimensions([...dimensions, { label: "", value: "" }])
                  }
                  className="text-xs font-medium text-bronze underline transition-colors hover:text-bronze-dark"
                >
                  + Add Dimension
                </button>
              </div>
              <div className="space-y-2">
                {dimensions.map((d, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={d.label}
                      onChange={(e) => {
                        const next = [...dimensions];
                        next[idx] = { ...next[idx], label: e.target.value };
                        setDimensions(next);
                      }}
                      placeholder="Label (e.g. Seat Height)"
                      className="w-1/3 border border-line bg-ivory px-2.5 py-1.5 text-xs text-ink focus:border-bronze focus:outline-none"
                    />
                    <input
                      type="text"
                      value={d.value}
                      onChange={(e) => {
                        const next = [...dimensions];
                        next[idx] = { ...next[idx], value: e.target.value };
                        setDimensions(next);
                      }}
                      placeholder="Value (e.g. 42 cm)"
                      className="flex-1 border border-line bg-ivory px-2.5 py-1.5 text-xs text-ink focus:border-bronze focus:outline-none"
                    />
                    <button
                      type="button"
                      aria-label="Remove dimension"
                      onClick={() =>
                        setDimensions(dimensions.filter((_, i) => i !== idx))
                      }
                      className={adminDangerIconBtn}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Craft Specs */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-[10px] uppercase tracking-[0.14em] text-muted">
                  Craft Specifications
                </label>
                <button
                  type="button"
                  onClick={() => setSpecs([...specs, { label: "", value: "" }])}
                  className="text-xs font-medium text-bronze underline transition-colors hover:text-bronze-dark"
                >
                  + Add Spec
                </button>
              </div>
              <div className="space-y-2">
                {specs.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={s.label}
                      onChange={(e) => {
                        const next = [...specs];
                        next[idx] = { ...next[idx], label: e.target.value };
                        setSpecs(next);
                      }}
                      placeholder="Spec Label"
                      className="w-1/3 border border-line bg-ivory px-2.5 py-1.5 text-xs text-ink focus:border-bronze focus:outline-none"
                    />
                    <input
                      type="text"
                      value={s.value}
                      onChange={(e) => {
                        const next = [...specs];
                        next[idx] = { ...next[idx], value: e.target.value };
                        setSpecs(next);
                      }}
                      placeholder="Specification detail"
                      className="flex-1 border border-line bg-ivory px-2.5 py-1.5 text-xs text-ink focus:border-bronze focus:outline-none"
                    />
                    <button
                      type="button"
                      aria-label="Remove specification"
                      onClick={() =>
                        setSpecs(specs.filter((_, i) => i !== idx))
                      }
                      className={adminDangerIconBtn}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-muted">
                Care Instructions (one step per line)
              </label>
              <textarea
                rows={3}
                value={careText}
                onChange={(e) => setCareText(e.target.value)}
                className={adminTextareaClass}
              />
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Pricing & Availability */}
          <section className="space-y-4 border border-line bg-parchment p-5">
            <h2 className="font-display text-xl text-ink">
              Pricing & Availability
            </h2>

            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-muted">
                Base Price (Integer RWF) *
              </label>
              <input
                type="number"
                required
                min={1}
                step={1}
                value={basePrice}
                onChange={(e) => setBasePrice(Number(e.target.value))}
                className={`font-medium ${adminInputClass}`}
              />
            </div>

            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-muted">
                Compare-at Price (Optional RWF)
              </label>
              <input
                type="number"
                min={0}
                step={1}
                value={compareAtPrice}
                onChange={(e) => setCompareAtPrice(e.target.value)}
                placeholder="Leave blank if no markdown"
                className={adminInputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-muted">
                SKU
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Auto-generated if blank (e.g. DDX-0121)"
                className={`font-mono ${adminInputClass}`}
              />
            </div>

            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-muted">
                Availability State *
              </label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value as Availability)}
                className={adminSelectClass}
              >
                <option value="in-stock">In Showroom Stock</option>
                <option value="made-to-order">Made to Order</option>
                <option value="pre-order">Pre-Order</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-muted">
                Lead Time Label *
              </label>
              <input
                type="text"
                required
                value={leadTime}
                onChange={(e) => setLeadTime(e.target.value)}
                className={adminInputClass}
              />
            </div>

            {mode === "create" && (
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-muted">
                  Initial Stock On Hand
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={initialStock}
                  onChange={(e) => setInitialStock(Number(e.target.value) || 0)}
                  className={adminInputClass}
                />
              </div>
            )}
          </section>

          {/* Taxonomy */}
          <section className="space-y-4 border border-line bg-parchment p-5">
            <h2 className="font-display text-xl text-ink">
              Category & Collection
            </h2>

            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-muted">
                Primary Category *
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className={adminSelectClass}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-muted">
                Curated Collection
              </label>
              <select
                value={collectionId}
                onChange={(e) => setCollectionId(e.target.value)}
                className={adminSelectClass}
              >
                <option value="">None</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-muted">
                  Editorial Badge
                </label>
                <input
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="Bestseller, New"
                  className={adminInputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-muted">
                  Seating Capacity
                </label>
                <input
                  type="number"
                  min={0}
                  max={24}
                  value={seating}
                  onChange={(e) => setSeating(e.target.value)}
                  placeholder="Optional"
                  className={adminInputClass}
                />
              </div>
            </div>

            <label className="flex items-center gap-2.5 pt-1 text-xs text-ink">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="h-4 w-4 accent-bronze"
              />
              Feature on Homepage Signature Pieces
            </label>
          </section>

          {/* SEO */}
          <section className="space-y-3 border border-line bg-parchment p-5">
            <h2 className="font-display text-xl text-ink">
              Search Engine Metadata
            </h2>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-muted">
                SEO Title
              </label>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder={name || "Defaults to product name"}
                className={adminInputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-muted">
                SEO Meta Description
              </label>
              <textarea
                rows={3}
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder="Defaults to product description"
                className={adminTextareaClass}
              />
            </div>
          </section>
        </div>
      </div>

      {/* Media Picker Modal */}
      <AdminModal
        open={pickerOpen}
        title="Select from Cloudflare R2 Media Library"
        maxWidth="max-w-3xl"
        onClose={() => setPickerOpen(false)}
      >
        <div className="grid max-h-[60vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-4">
          {pickerAssets.map((asset) => (
            <button
              key={asset.id}
              type="button"
              onClick={() => {
                setImages([
                  ...images,
                  {
                    url: asset.publicUrl,
                    altText: asset.altText || name,
                    mediaId: asset.id,
                  },
                ]);
                setPickerOpen(false);
              }}
              className="group overflow-hidden border border-line bg-ivory text-left text-ink transition-colors hover:border-bronze hover:bg-shell hover:text-ink"
            >
              <div className="aspect-4/3 bg-sand/60">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={asset.publicUrl}
                  alt={asset.altText || asset.filename}
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="truncate p-2 text-[11px] text-ink">
                {asset.filename}
              </p>
            </button>
          ))}
        </div>
      </AdminModal>
    </form>
  );
}
