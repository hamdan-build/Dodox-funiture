"use client";

import { useMemo } from "react";
import { Check, SlidersHorizontal, X } from "lucide-react";
import {
  availabilityOptions,
  type CatalogFilters,
} from "@/lib/catalog";
import { cn, formatRwf } from "@/lib/utils";
import type { Category, Product } from "@/types";

interface CollectionFacet {
  slug: string;
  name: string;
}

interface FiltersPanelProps {
  filters: CatalogFilters;
  products: Product[];
  categories: Category[];
  collections: CollectionFacet[];
  onChange: (next: Partial<CatalogFilters>) => void;
  onClear: () => void;
  resultCount: number;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 text-[9px] font-medium uppercase tracking-[0.2em] text-ink/70">
      {children}
    </h3>
  );
}

function CheckRow({
  checked,
  label,
  count,
  onChange,
}: {
  checked: boolean;
  label: string;
  count?: number;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-2 py-1.5 text-[12px] text-ink-soft transition-colors hover:text-ink">
      <span className="flex items-center gap-2.5">
        <span
          className={cn(
            "flex h-4 w-4 items-center justify-center border transition-colors",
            checked ? "border-bronze bg-bronze text-ivory" : "border-line bg-parchment",
          )}
          aria-hidden="true"
        >
          {checked ? <Check size={10} strokeWidth={2.4} /> : null}
        </span>
        {label}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      {typeof count === "number" ? (
        <span className="text-[10px] tabular-nums text-muted">{count}</span>
      ) : null}
    </label>
  );
}

export function FiltersPanel({
  filters,
  products,
  categories,
  collections,
  onChange,
  onClear,
  resultCount,
}: FiltersPanelProps) {
  const toggleList = (
    value: string,
    list: string[],
    key: "materials" | "colors" | "availability",
  ) => {
    const next = list.includes(value)
      ? list.filter((entry) => entry !== value)
      : [...list, value];
    onChange({ [key]: next } as Partial<CatalogFilters>);
  };

  const priceBounds = useMemo(() => {
    if (products.length === 0) return { min: 150000, max: 5000000 };
    const prices = products.map((p) => p.price);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, [products]);

  const materialFacets = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      for (const m of p.materials) set.add(m);
    }
    return Array.from(set).sort().slice(0, 12);
  }, [products]);

  const colorFacets = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of products) {
      for (const c of p.colors) {
        if (!map.has(c.name)) map.set(c.name, c.hex);
      }
    }
    return Array.from(map.entries())
      .map(([name, hex]) => ({ name, hex }))
      .slice(0, 10);
  }, [products]);

  const seatingCounts = [2, 3, 6].map((seats) => ({
    seats,
    count: products.filter((product) => product.seating === seats).length,
  }));

  return (
    <div>
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} strokeWidth={1.4} className="text-bronze" />
          <h2 className="font-display text-xl text-ink">Refine By</h2>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-[9px] uppercase tracking-[0.14em] text-muted underline decoration-line underline-offset-4 transition-colors hover:text-bronze"
        >
          Clear all
        </button>
      </div>

      <div className="border-b border-line/70 py-4">
        <SectionTitle>Furniture category</SectionTitle>
        <div>
          {categories.map((category) => {
            const count = products.filter(
              (product) => product.category === category.slug,
            ).length;
            return (
              <CheckRow
                key={category.slug}
                checked={filters.category === category.slug}
                label={category.name}
                count={count}
                onChange={() =>
                  onChange({
                    category:
                      filters.category === category.slug ? "all" : category.slug,
                  })
                }
              />
            );
          })}
        </div>
      </div>

      {collections.length > 0 ? (
        <div className="border-b border-line/70 py-4">
          <SectionTitle>Curated collection</SectionTitle>
          <div>
            {collections.map((col) => {
              const count = products.filter(
                (p) => p.collectionSlug === col.slug || p.collection === col.name,
              ).length;
              if (count === 0) return null;
              return (
                <CheckRow
                  key={col.slug}
                  checked={filters.collection === col.slug}
                  label={col.name}
                  count={count}
                  onChange={() =>
                    onChange({
                      collection:
                        filters.collection === col.slug ? "all" : col.slug,
                    })
                  }
                />
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="border-b border-line/70 py-4">
        <div className="mb-3 flex items-baseline justify-between">
          <SectionTitle>Price range (RWF)</SectionTitle>
        </div>
        <input
          type="range"
          min={0}
          max={priceBounds.max}
          step={50000}
          value={filters.maxPrice || priceBounds.max}
          onChange={(event) => onChange({ maxPrice: Number(event.target.value) })}
          className="w-full accent-bronze"
          aria-label="Maximum price"
        />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-[9px] uppercase tracking-[0.1em] text-muted">Min</span>
            <input
              type="number"
              min={0}
              step={50000}
              value={filters.minPrice || ""}
              placeholder={formatRwf(priceBounds.min, false)}
              onChange={(event) =>
                onChange({ minPrice: Number(event.target.value) || 0 })
              }
              className="mt-1 w-full border border-line bg-parchment px-2.5 py-2 text-[11px] text-ink focus:border-bronze focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-[9px] uppercase tracking-[0.1em] text-muted">Max</span>
            <input
              type="number"
              min={0}
              step={50000}
              value={filters.maxPrice || ""}
              placeholder={formatRwf(priceBounds.max, false)}
              onChange={(event) =>
                onChange({ maxPrice: Number(event.target.value) || 0 })
              }
              className="mt-1 w-full border border-line bg-parchment px-2.5 py-2 text-[11px] text-ink focus:border-bronze focus:outline-none"
            />
          </label>
        </div>
        <p className="mt-2 text-[10px] tabular-nums text-muted">
          {formatRwf(filters.minPrice)} –{" "}
          {formatRwf(filters.maxPrice || priceBounds.max)}
        </p>
      </div>

      <div className="border-b border-line/70 py-4">
        <SectionTitle>Artisanal materials</SectionTitle>
        <div className="flex flex-wrap gap-1.5">
          {materialFacets.map((material) => {
            const active = filters.materials.includes(material);
            return (
              <button
                key={material}
                type="button"
                onClick={() =>
                  toggleList(material, filters.materials, "materials")
                }
                className={cn(
                  "border px-2.5 py-1.5 text-[10px] tracking-[0.02em] transition-colors",
                  active
                    ? "border-peach-ink/30 bg-peach text-peach-ink"
                    : "border-line bg-parchment text-ink-soft hover:border-taupe",
                )}
                aria-pressed={active}
              >
                {material}
                {active ? <X size={9} className="ml-1.5 inline" /> : null}
              </button>
            );
          })}
        </div>
      </div>

      {colorFacets.length > 0 ? (
        <div className="border-b border-line/70 py-4">
          <SectionTitle>Finish & colour</SectionTitle>
          <div className="flex flex-wrap gap-1.5">
            {colorFacets.map((color) => {
              const active = filters.colors.includes(color.name);
              return (
                <button
                  key={color.name}
                  type="button"
                  onClick={() =>
                    toggleList(color.name, filters.colors, "colors")
                  }
                  className={cn(
                    "inline-flex items-center gap-1.5 border px-2.5 py-1.5 text-[10px] transition-colors",
                    active
                      ? "border-bronze bg-shell text-ink"
                      : "border-line bg-parchment text-ink-soft hover:border-taupe",
                  )}
                  aria-pressed={active}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full border border-ink/15"
                    style={{ backgroundColor: color.hex }}
                  />
                  {color.name}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="border-b border-line/70 py-4">
        <SectionTitle>Availability</SectionTitle>
        <div>
          {availabilityOptions.map((option) => {
            const count = products.filter(
              (product) => product.availability === option.value,
            ).length;
            if (option.value === "out-of-stock" && count === 0) return null;
            return (
              <CheckRow
                key={option.value}
                checked={filters.availability.includes(option.value)}
                label={option.label}
                count={count}
                onChange={() =>
                  toggleList(
                    option.value,
                    filters.availability,
                    "availability",
                  )
                }
              />
            );
          })}
        </div>
      </div>

      <div className="py-4">
        <SectionTitle>Seating capacity</SectionTitle>
        <div className="flex flex-wrap gap-1.5">
          {seatingCounts.map(({ seats, count }) => {
            const active = filters.seating.includes(seats);
            return (
              <button
                key={seats}
                type="button"
                onClick={() => {
                  const next = active
                    ? filters.seating.filter((value) => value !== seats)
                    : [...filters.seating, seats];
                  onChange({ seating: next });
                }}
                disabled={count === 0}
                className={cn(
                  "min-w-11 border px-3 py-1.5 text-[11px] transition-colors disabled:opacity-40",
                  active
                    ? "border-ink bg-ink text-ivory"
                    : "border-line bg-parchment text-ink-soft hover:border-taupe",
                )}
                aria-pressed={active}
              >
                {seats}+
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-line pt-4 text-[10px] uppercase tracking-[0.12em] text-muted">
        {resultCount} piece{resultCount === 1 ? "" : "s"} match your selection
      </div>
    </div>
  );
}
