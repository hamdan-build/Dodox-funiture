"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/components/admin/api-client";
import { ProductEditor } from "@/components/admin/product-editor";

export default function AdminNewProductPage() {
  const [meta, setMeta] = useState<{
    categories: Array<{ id: string; name: string; slug: string }>;
    collections: Array<{ id: string; name: string; slug: string }>;
  } | null>(null);

  useEffect(() => {
    adminFetch<{
      categories: Array<{ id: string; name: string; slug: string }>;
      collections: Array<{ id: string; name: string; slug: string }>;
    }>("/api/admin/products").then((res) => {
      setMeta({ categories: res.categories, collections: res.collections });
    });
  }, []);

  if (!meta) {
    return <div className="h-80 animate-pulse border border-line bg-parchment" />;
  }

  return (
    <ProductEditor
      mode="create"
      categories={meta.categories}
      collections={meta.collections}
    />
  );
}
