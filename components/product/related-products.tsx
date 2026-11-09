import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/catalog/product-card";
import { getRelatedProducts } from "@/data/products";
import type { Product } from "@/types";

export function RelatedProducts({ product }: { product: Product }) {
  const related = getRelatedProducts(product, 4);

  return (
    <section className="border-t border-line/60 bg-ivory py-14 sm:py-16 lg:py-20">
      <div className="container-shell">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Living room ensemble</p>
            <h2 className="mt-2 display-title">Frequently Paired With</h2>
          </div>
          <Link href="/shop" className="link-underline text-[10px]">
            Explore the whole collection
            <ArrowRight size={12} strokeWidth={1.5} />
          </Link>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {related.map((item) => (
            <ProductCard key={item.id} product={item} compact />
          ))}
        </div>
      </div>
    </section>
  );
}
