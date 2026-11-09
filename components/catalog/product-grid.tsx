import { ProductCard } from "@/components/catalog/product-card";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

export function ProductGrid({
  products,
  className,
  columns = 4,
  priorityCount = 0,
}: {
  products: Product[];
  className?: string;
  columns?: 2 | 3 | 4;
  priorityCount?: number;
}) {
  const columnClasses = {
    2: "grid-cols-2",
    3: "grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  }[columns];

  return (
    <div className={cn("grid gap-4 sm:gap-5", columnClasses, className)}>
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          priority={index < priorityCount}
        />
      ))}
    </div>
  );
}
