"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, LayoutGrid, Search, SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "@/components/catalog/product-card";
import { buttonStyles } from "@/components/ui/button";
import { FiltersPanel } from "@/components/catalog/filters-panel";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { categories } from "@/data/categories";
import {
  activeFilterCount,
  availabilityLabels,
  defaultFilters,
  filterProducts,
  sortOptions,
  type CatalogFilters,
  type SortKey,
} from "@/lib/catalog";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

const PAGE_SIZE = 9;

export function CatalogView({
  initialFilters,
  initialProducts,
}: {
  initialFilters: CatalogFilters;
  initialProducts: Product[];
}) {
  const router = useRouter();
  const [filters, setFilters] = useState<CatalogFilters>(initialFilters);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [columns, setColumns] = useState<3 | 4>(4);
  const isFirstRender = useRef(true);

  const results = useMemo(() => filterProducts(initialProducts, filters), [initialProducts, filters]);
  const activeCount = activeFilterCount(filters);
  const initialFiltersKey = JSON.stringify(initialFilters);

  // When the URL changes from outside this component (category links, browser
  // back/forward), adopt the new server-provided filters without remounting.
  useEffect(() => {
    setFilters((current) =>
      JSON.stringify(current) === initialFiltersKey
        ? current
        : (JSON.parse(initialFiltersKey) as CatalogFilters),
    );
    setVisible(PAGE_SIZE);
  }, [initialFiltersKey]);

  const updateFilters = useCallback((next: Partial<CatalogFilters>) => {
    setFilters((current) => ({ ...current, ...next }));
    setVisible(PAGE_SIZE);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ ...defaultFilters, sort: filters.sort });
    setVisible(PAGE_SIZE);
  }, [filters.sort]);

  // Keep the URL shareable and support direct links from the homepage.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const params = new URLSearchParams();
    if (filters.category !== "all") params.set("category", filters.category);
    if (filters.materials.length) params.set("material", filters.materials.join(","));
    if (filters.minPrice) params.set("min", String(filters.minPrice));
    if (filters.maxPrice) params.set("max", String(filters.maxPrice));
    if (filters.availability.length)
      params.set("availability", filters.availability.join(","));
    if (filters.seating.length) params.set("seating", filters.seating.join(","));
    if (filters.query) params.set("q", filters.query);
    if (filters.sort !== "featured") params.set("sort", filters.sort);
    const query = params.toString();
    router.replace(query ? `/shop?${query}` : "/shop", { scroll: false });
  }, [filters, router]);

  const shown = results.slice(0, visible);
  const remaining = Math.max(0, results.length - shown.length);
  const activeCategory = categories.find(
    (category) => category.slug === filters.category,
  );

  const activeChips: { label: string; onRemove: () => void }[] = [
    ...(filters.category !== "all"
      ? [
          {
            label: activeCategory?.name ?? filters.category,
            onRemove: () => updateFilters({ category: "all" }),
          },
        ]
      : []),
    ...filters.materials.map((material) => ({
      label: material,
      onRemove: () =>
        updateFilters({
          materials: filters.materials.filter((entry) => entry !== material),
        }),
    })),
    ...filters.availability.map((availability) => ({
      label: availabilityLabels[availability],
      onRemove: () =>
        updateFilters({
          availability: filters.availability.filter(
            (entry) => entry !== availability,
          ),
        }),
    })),
    ...(filters.query
      ? [
          {
            label: `“${filters.query}”`,
            onRemove: () => updateFilters({ query: "" }),
          },
        ]
      : []),
    ...(filters.minPrice || filters.maxPrice
      ? [
          {
            label: "Custom price",
            onRemove: () => updateFilters({ minPrice: 0, maxPrice: 0 }),
          },
        ]
      : []),
    ...filters.seating.map((seats) => ({
      label: `${seats}+ seats`,
      onRemove: () =>
        updateFilters({
          seating: filters.seating.filter((entry) => entry !== seats),
        }),
    })),
  ];

  return (
    <div className="container-shell pb-16 pt-6 sm:pb-20">
      <div className="grid gap-8 lg:grid-cols-[250px_1fr] xl:grid-cols-[270px_1fr] xl:gap-10">
        <aside className="hidden lg:block">
          <div className="sticky top-[100px] max-h-[calc(100vh-120px)] overflow-y-auto border border-line/60 bg-parchment p-5 pr-4">
            <FiltersPanel
              filters={filters}
              onChange={updateFilters}
              onClear={clearFilters}
              resultCount={results.length}
            />
          </div>
        </aside>

        <div>
          <div className="mb-4 flex items-center gap-2 border border-line bg-parchment px-3">
            <Search size={14} strokeWidth={1.4} className="shrink-0 text-bronze" />
            <input
              type="search"
              value={filters.query}
              onChange={(event) => updateFilters({ query: event.target.value })}
              placeholder="Search within the collection — bouclé, oak, dining…"
              aria-label="Search within the collection"
              className="h-11 w-full bg-transparent text-[12px] text-ink placeholder:text-muted/60 focus:outline-none"
            />
            {filters.query ? (
              <button
                type="button"
                onClick={() => updateFilters({ query: "" })}
                className="shrink-0 text-muted transition-colors hover:text-ink"
                aria-label="Clear search"
              >
                <X size={13} strokeWidth={1.5} />
              </button>
            ) : null}
          </div>

          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] text-ink-soft">
                Showing{" "}
                <span className="font-medium text-ink">{shown.length}</span> of{" "}
                <span className="font-medium text-ink">{results.length}</span>{" "}
                architectural pieces
              </p>
              <p className="mt-0.5 text-[9px] uppercase tracking-[0.14em] text-muted">
                Kigali studio direct · White-glove included
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="flex h-10 items-center gap-2 border border-line bg-parchment px-3 text-[10px] uppercase tracking-[0.12em] text-ink lg:hidden"
              >
                <SlidersHorizontal size={13} strokeWidth={1.5} />
                Filters
                {activeCount > 0 ? (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-bronze px-1 text-[8px] text-ivory">
                    {activeCount}
                  </span>
                ) : null}
              </button>

              <div className="relative flex h-10 items-center gap-2 border border-line bg-parchment px-3">
                <span className="hidden text-[9px] uppercase tracking-[0.12em] text-muted sm:inline">
                  Sort by
                </span>
                <select
                  aria-label="Sort products"
                  value={filters.sort}
                  onChange={(event) =>
                    updateFilters({ sort: event.target.value as SortKey })
                  }
                  className="h-full appearance-none bg-transparent pr-5 text-[10px] uppercase tracking-[0.1em] text-ink focus:outline-none"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ArrowDown
                  size={11}
                  strokeWidth={1.5}
                  className="pointer-events-none absolute right-2.5 text-muted"
                />
              </div>

              <div className="hidden items-center border border-line bg-parchment sm:flex">
                <button
                  type="button"
                  onClick={() => setColumns(4)}
                  className={cn(
                    "flex h-10 w-9 items-center justify-center transition-colors",
                    columns === 4 ? "bg-ink text-ivory" : "text-ink-soft",
                  )}
                  aria-label="Four column grid"
                  aria-pressed={columns === 4}
                >
                  <LayoutGrid size={13} strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  onClick={() => setColumns(3)}
                  className={cn(
                    "flex h-10 w-9 items-center justify-center border-l border-line transition-colors",
                    columns === 3 ? "bg-ink text-ivory" : "text-ink-soft",
                  )}
                  aria-label="Three column grid"
                  aria-pressed={columns === 3}
                >
                  <LayoutGrid size={11} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>

          {activeChips.length > 0 ? (
            <div className="mb-5 flex flex-wrap items-center gap-2 border-y border-line/70 py-3">
              {activeChips.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={chip.onRemove}
                  className="inline-flex items-center gap-1.5 bg-shell px-2.5 py-1.5 text-[10px] text-ink-soft transition-colors hover:bg-sand"
                >
                  {chip.label}
                  <X size={10} strokeWidth={1.6} className="text-muted" />
                </button>
              ))}
              <button
                type="button"
                onClick={clearFilters}
                className="ml-1 text-[9px] uppercase tracking-[0.12em] text-muted underline decoration-line underline-offset-4 hover:text-bronze"
              >
                Clear all
              </button>
            </div>
          ) : null}

          {shown.length === 0 ? (
            <EmptyState
              icon={<Search size={20} strokeWidth={1.3} />}
              title="No pieces match these filters"
              description="Try removing a filter, widening the price range, or ask the atelier about a bespoke commission drawn to your room."
              action="Reset filters"
              actionHref="/shop"
              secondary={
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-[10px] uppercase tracking-[0.14em] text-bronze underline decoration-line underline-offset-4"
                >
                  Clear filters in place
                </button>
              }
            />
          ) : (
            <>
              <div
                className={cn(
                  "grid gap-3 sm:gap-4",
                  columns === 4
                    ? "grid-cols-2 xl:grid-cols-4"
                    : "grid-cols-2 xl:grid-cols-3",
                )}
              >
                {shown.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    priority={index < 2}
                    compact
                  />
                ))}
              </div>

              <div className="mt-8 grid gap-5 border border-line/60 bg-shell/40 p-5 sm:p-7 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-8">
                <div>
                  <p className="eyebrow">The custom atelier experience</p>
                  <h2 className="mt-2 font-display text-[26px] leading-tight text-ink sm:text-[32px]">
                    Need bespoke dimensions or custom timber?
                  </h2>
                  <p className="mt-2 max-w-xl text-[11.5px] leading-relaxed text-muted">
                    The Nyarutarama atelier builds commission furniture tailored to
                    your floor plan — from a single altered dimension to a complete
                    room in solid timber and imported upholstery.
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                  <Link href="/custom-atelier" className={buttonStyles({ size: "md" })}>
                    Request an atelier quote
                  </Link>
                  <Link
                    href="/contact"
                    className={buttonStyles({ variant: "light", size: "md" })}
                  >
                    Visit the flagship
                  </Link>
                </div>
              </div>

              {remaining > 0 ? (
                <div className="mt-8 flex flex-col items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setVisible((count) => count + PAGE_SIZE)}
                    className="inline-flex h-11 items-center justify-center gap-2 bg-bronze px-7 text-[10px] uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-bronze-dark"
                  >
                    Load more furniture ({remaining} remaining)
                    <ArrowDown size={12} strokeWidth={1.5} />
                  </button>
                  <p className="text-[10px] text-muted">
                    Showing {shown.length} of {results.length} pieces
                  </p>
                </div>
              ) : (
                <p className="mt-8 text-center text-[10px] uppercase tracking-[0.14em] text-muted">
                  You have reached the end of the collection
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <Drawer
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        title="Filter Specifications"
        side="bottom"
        footer={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={clearFilters}
              className="flex-1 border border-line px-4 py-3 text-[10px] uppercase tracking-[0.14em] text-ink"
            >
              Clear all
            </button>
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="flex-1 bg-bronze px-4 py-3 text-[10px] uppercase tracking-[0.14em] text-ivory"
            >
              Show {results.length} pieces
            </button>
          </div>
        }
      >
        <div className="px-5 py-5">
          <FiltersPanel
            filters={filters}
            onChange={updateFilters}
            onClear={clearFilters}
            resultCount={results.length}
          />
        </div>
      </Drawer>
    </div>
  );
}
