import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ServiceStrip } from "@/components/layout/service-strip";
import { CatalogView } from "@/components/catalog/catalog-view";
import { categories } from "@/data/categories";
import { products } from "@/data/products";
import {
  parseCatalogSearchParams,
  type CatalogFilters,
} from "@/lib/catalog";
import { buildMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const metadata: Metadata = buildMetadata({
  title: "Furniture catalog",
  description:
    "Browse the DODOX collection of handcrafted sofas, tables, beds and atelier pieces. Filter by room, material, price and availability. Sample catalogue for demonstration.",
  path: "/shop",
  keywords: [
    "furniture catalogue Kigali",
    "sofas Rwanda",
    "solid wood furniture",
    "custom furniture Kigali",
  ],
});

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const initialFilters = parseCatalogSearchParams(params);
  const activeCategory = categories.find(
    (category) => category.slug === initialFilters.category,
  );

  const categoryCounts = categories.map((category) => ({
    slug: category.slug,
    name: category.shortName,
    count: products.filter((product) => product.category === category.slug)
      .length,
  }));

  // Category links are handled client-side by CatalogView; the initial filter
  // is passed both to the view and (for clarity) the heading.
  const filters: CatalogFilters = initialFilters;

  return (
    <>
      <div className="border-b border-line/60 bg-ivory">
        <div className="container-shell pb-5 pt-5 sm:pb-6 sm:pt-6">
          <Breadcrumbs
            items={[
              { label: "All Furniture", href: "/shop" },
              ...(activeCategory
                ? [{ label: activeCategory.shortName }]
                : []),
            ]}
          />

          <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="eyebrow">Atelier Kigali collection</p>
              <h1 className="mt-2 display-title">
                {activeCategory ? activeCategory.name : "Our Furniture Collection"}
              </h1>
              <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-ink-soft/80 sm:text-[14.5px]">
                {activeCategory
                  ? activeCategory.description
                  : "Handcrafted contemporary pieces designed for modern African and global homes. Each item is shaped from solid timber and tailored upholstery in our Kigali atelier."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="bg-shell px-3 py-1.5 text-[9px] uppercase tracking-[0.16em] text-ink/60">
                Solid East African hardwood
              </span>
              <span className="bg-peach px-3 py-1.5 text-[9px] uppercase tracking-[0.16em] text-peach-ink">
                White-glove assembly
              </span>
            </div>
          </div>

          <div className="mt-6 flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            <Link
              href="/shop"
              className={cn(
                "shrink-0 px-4 py-2.5 text-[10.5px] uppercase tracking-[0.12em] transition-colors",
                !activeCategory
                  ? "bg-ink text-ivory"
                  : "bg-shell/70 text-ink-soft hover:bg-sand",
              )}
              aria-current={!activeCategory ? "page" : undefined}
            >
              All items
              <span className="ml-2 opacity-60">{products.length}</span>
            </Link>
            {categoryCounts.map((category) => (
              <Link
                key={category.slug}
                href={`/shop?category=${category.slug}`}
                className={cn(
                  "shrink-0 px-4 py-2.5 text-[10.5px] uppercase tracking-[0.12em] transition-colors",
                  activeCategory?.slug === category.slug
                    ? "bg-ink text-ivory"
                    : "bg-shell/70 text-ink-soft hover:bg-sand",
                )}
                aria-current={
                  activeCategory?.slug === category.slug ? "page" : undefined
                }
              >
                {category.name}
                <span className="ml-2 opacity-60">{category.count}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <CatalogView initialFilters={filters} initialProducts={products} />

      <ServiceStrip />
    </>
  );
}
