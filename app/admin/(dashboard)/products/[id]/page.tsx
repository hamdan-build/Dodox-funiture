"use client";

import { use, useEffect, useState } from "react";
import { adminFetch } from "@/components/admin/api-client";
import { ProductEditor } from "@/components/admin/product-editor";
import type { Product } from "@/types";

export default function AdminEditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<{
    product: Product;
    categories: Array<{ id: string; name: string; slug: string }>;
    collections: Array<{ id: string; name: string; slug: string }>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminFetch<{
      product: Product;
      categories: Array<{ id: string; name: string; slug: string }>;
      collections: Array<{ id: string; name: string; slug: string }>;
    }>(`/api/admin/products/${id}`)
      .then(setData)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load product"),
      );
  }, [id]);

  if (error) {
    return (
      <div className="border border-[#d8a69a] bg-[#fbf2f0] p-5 text-sm text-[#8c2f1f]">
        {error}
      </div>
    );
  }

  if (!data) {
    return <div className="h-80 animate-pulse border border-line bg-parchment" />;
  }

  return (
    <ProductEditor
      mode="edit"
      initialProduct={data.product}
      categories={data.categories}
      collections={data.collections}
    />
  );
}
