"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  Copy,
  Image as ImageIcon,
  Pencil,
  Trash2,
  Upload,
} from "lucide-react";
import {
  adminFetch,
  adminUploadFile,
} from "@/components/admin/api-client";
import {
  AdminEmptyState,
  AdminModal,
  AdminPageHeader,
  ConfirmDialog,
} from "@/components/admin/ui";
import { useUiStore } from "@/store/ui";

interface MediaAssetItem {
  id: string;
  objectKey: string;
  publicUrl: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  altText: string;
  folder: string;
  storageDriver: string;
  assignedCount: number;
  createdAt: string;
}

const FOLDERS = ["all", "products", "categories", "collections", "journal", "banners", "atelier-references"];

export default function AdminMediaLibraryPage() {
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
  const [assets, setAssets] = useState<MediaAssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [folderFilter, setFolderFilter] = useState("all");
  const [uploadFolder, setUploadFolder] = useState("products");
  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<MediaAssetItem | null>(null);
  const [deleting, setDeleting] = useState<MediaAssetItem | null>(null);
  const [busyAction, setBusyAction] = useState(false);

  const loadAssets = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (folderFilter !== "all") qs.set("folder", folderFilter);
      if (query.trim()) qs.set("q", query.trim());
      const res = await adminFetch<{ assets: MediaAssetItem[] }>(
        `/api/admin/media?${qs.toString()}`,
      );
      setAssets(res.assets);
    } catch (err) {
      addToast({
        title: "Failed to load media library",
        description: err instanceof Error ? err.message : undefined,
        tone: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [folderFilter, query, addToast]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const handleUploadFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    let successCount = 0;
    try {
      for (const file of Array.from(fileList)) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", uploadFolder);
        fd.append("altText", file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "));
        await adminUploadFile("/api/admin/media", fd);
        successCount += 1;
      }
      addToast({
        title: `Uploaded ${successCount} image${successCount === 1 ? "" : "s"} to Cloudflare R2`,
      });
      await loadAssets();
    } catch (err) {
      addToast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : undefined,
        tone: "error",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setBusyAction(true);
    try {
      await adminFetch(`/api/admin/media/${editing.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          altText: editing.altText,
          folder: editing.folder,
        }),
      });
      addToast({ title: "Media metadata updated" });
      setEditing(null);
      await loadAssets();
    } catch (err) {
      addToast({
        title: "Update failed",
        description: err instanceof Error ? err.message : undefined,
        tone: "error",
      });
    } finally {
      setBusyAction(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    setBusyAction(true);
    try {
      await adminFetch(`/api/admin/media/${deleting.id}`, {
        method: "DELETE",
      });
      addToast({ title: "Media asset removed" });
      setDeleting(null);
      await loadAssets();
    } catch (err) {
      addToast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : undefined,
        tone: "error",
      });
    } finally {
      setBusyAction(false);
    }
  };

  const copyUrl = (asset: MediaAssetItem) => {
    navigator.clipboard.writeText(asset.publicUrl);
    setCopiedId(asset.id);
    setTimeout(() => setCopiedId(null), 1600);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Module 12 · Cloudflare R2 Storage"
        title="Media Library"
        description="Upload JPEG, PNG, WebP, or AVIF assets (max 8 MB) directly to Cloudflare R2 with magic-byte validation, alt-text management, and product reference tracking."
        actions={
          <div className="flex items-center gap-2">
            <select
              value={uploadFolder}
              onChange={(e) => setUploadFolder(e.target.value)}
              aria-label="Target upload folder"
              className="border border-stone-300 bg-white px-3 py-2 text-xs text-charcoal-900 focus:border-charcoal-900 focus:outline-none"
            >
              {FOLDERS.filter((f) => f !== "all").map((f) => (
                <option key={f} value={f}>
                  Folder: {f}
                </option>
              ))}
            </select>
            <label className="inline-flex cursor-pointer items-center gap-2 bg-charcoal-900 px-4 py-2 text-xs uppercase tracking-[0.16em] text-ivory-50 hover:bg-charcoal-800">
              <Upload className="h-3.5 w-3.5" />
              {uploading ? "Uploading…" : "Upload to R2"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                multiple
                disabled={uploading}
                onChange={(e) => handleUploadFiles(e.target.files)}
                className="sr-only"
              />
            </label>
          </div>
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border border-stone-200/90 bg-white p-4">
        <div className="flex flex-wrap gap-1.5">
          {FOLDERS.map((folder) => (
            <button
              key={folder}
              type="button"
              onClick={() => setFolderFilter(folder)}
              className={`px-3 py-1.5 text-xs capitalize transition ${
                folderFilter === folder
                  ? "bg-charcoal-900 text-ivory-50"
                  : "border border-stone-200 text-stone-600 hover:border-charcoal-900"
              }`}
            >
              {folder}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by filename or alt text…"
          className="w-full max-w-xs border border-stone-300 bg-ivory-50 px-3 py-1.5 text-sm focus:border-charcoal-900 focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse border border-stone-200 bg-white" />
          ))}
        </div>
      ) : assets.length === 0 ? (
        <AdminEmptyState
          title="No media assets match this view"
          description="Upload studio photography to Cloudflare R2 using the Upload button above."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {assets.map((asset) => (
            <article
              key={asset.id}
              className="group flex flex-col overflow-hidden border border-stone-200/90 bg-white"
            >
              <div className="relative aspect-4/3 overflow-hidden bg-sand-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={asset.publicUrl}
                  alt={asset.altText || asset.filename}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                />
                <span className="absolute left-2 top-2 bg-charcoal-900/85 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-ivory-50">
                  {asset.storageDriver.toUpperCase()} · {asset.folder}
                </span>
              </div>
              <div className="flex flex-1 flex-col justify-between p-3.5">
                <div>
                  <p className="truncate text-xs font-medium text-charcoal-900" title={asset.filename}>
                    {asset.filename}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-stone-500">
                    {asset.altText || "No alt text set"}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-2.5 text-[11px] text-stone-500">
                  <span>
                    {asset.sizeBytes > 0
                      ? `${Math.max(1, Math.round(asset.sizeBytes / 1024))} KB · `
                      : ""}
                    {asset.assignedCount} product ref{asset.assignedCount === 1 ? "" : "s"}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => copyUrl(asset)}
                      title="Copy asset URL"
                      className="p-1 text-stone-500 hover:text-charcoal-900"
                    >
                      {copiedId === asset.id ? (
                        <Check className="h-3.5 w-3.5 text-forest-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing({ ...asset })}
                      title="Edit alt text & folder"
                      className="p-1 text-stone-500 hover:text-charcoal-900"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(asset)}
                      title="Delete asset"
                      className="p-1 text-stone-500 hover:text-[#9c3d2c]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <AdminModal
        open={Boolean(editing)}
        title="Edit Media Asset Metadata"
        onClose={() => setEditing(null)}
      >
        {editing && (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="flex items-center gap-3 border border-stone-200 bg-ivory-50 p-3">
              <ImageIcon className="h-5 w-5 text-stone-500" />
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-charcoal-900">
                  {editing.filename}
                </p>
                <p className="truncate font-mono text-[11px] text-stone-500">
                  {editing.publicUrl}
                </p>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-stone-600">
                Alt Text (Accessibility & SEO)
              </label>
              <input
                type="text"
                value={editing.altText}
                onChange={(e) =>
                  setEditing({ ...editing, altText: e.target.value })
                }
                className="w-full border border-stone-300 px-3 py-2 text-sm focus:border-charcoal-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-stone-600">
                Folder
              </label>
              <select
                value={editing.folder}
                onChange={(e) =>
                  setEditing({ ...editing, folder: e.target.value })
                }
                className="w-full border border-stone-300 bg-white px-3 py-2 text-sm focus:border-charcoal-900 focus:outline-none"
              >
                {FOLDERS.filter((f) => f !== "all").map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="border border-stone-300 px-4 py-2 text-xs uppercase tracking-[0.14em] text-stone-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busyAction}
                className="bg-charcoal-900 px-5 py-2 text-xs uppercase tracking-[0.14em] text-ivory-50 disabled:opacity-50"
              >
                {busyAction ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </AdminModal>

      {/* Confirm Delete */}
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete Media Asset?"
        description={
          deleting
            ? `Delete "${deleting.filename}" from Cloudflare R2 and detach it from ${deleting.assignedCount} product gallery reference(s)?`
            : ""
        }
        confirmLabel="Delete Asset"
        destructive
        loading={busyAction}
        onCancel={() => setDeleting(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
