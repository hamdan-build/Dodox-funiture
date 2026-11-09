import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductGrid } from "@/components/catalog/product-grid";
import { SectionHeading } from "@/components/ui/section-heading";
import { featuredProducts } from "@/data/products";

export function FeaturedProducts() {
  return (
    <section className="border-y border-line/60 bg-shell/35 py-16 sm:py-20 lg:py-24">
      <div className="container-shell">
        <SectionHeading
          eyebrow="Signature pieces"
          title="Featured Masterpieces"
          action={
            <Link href="/shop" className="link-underline text-[10px]">
              View all pieces
              <ArrowRight size={12} strokeWidth={1.5} />
            </Link>
          }
        />
        <ProductGrid
          products={featuredProducts}
          columns={4}
          className="mt-9"
          priorityCount={2}
        />
        <p className="mt-6 text-[10px] uppercase tracking-[0.14em] text-muted/80">
          Sample catalogue · Pricing in RWF for demonstration only
        </p>
      </div>
    </section>
  );
}
