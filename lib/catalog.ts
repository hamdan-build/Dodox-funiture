import type { Availability, CategorySlug, Product } from "@/types";

export type SortKey = "featured" | "price-asc" | "price-desc" | "newest" | "name-asc";

export const sortOptions: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Featured & Curated" },
  { value: "newest", label: "Newest Arrivals" },
  { value: "price-asc", label: "Price · Low to High" },
  { value: "price-desc", label: "Price · High to Low" },
  { value: "name-asc", label: "Name · A to Z" },
];

export const availabilityOptions: {
  value: Availability;
  label: string;
  helper: string;
}[] = [
  {
    value: "in-stock",
    label: "In Kigali Showroom",
    helper: "Ready to dispatch",
  },
  {
    value: "made-to-order",
    label: "Made to Order",
    helper: "Built in the atelier",
  },
  {
    value: "pre-order",
    label: "Pre-order",
    helper: "Next production run",
  },
];

export const availabilityLabels: Record<Availability, string> = {
  "in-stock": "In Kigali stock",
  "made-to-order": "Made to order",
  "pre-order": "Pre-order",
};

export interface CatalogFilters {
  category: CategorySlug | "all";
  materials: string[];
  minPrice: number;
  maxPrice: number;
  availability: Availability[];
  seating: number[];
  sort: SortKey;
  query: string;
}

export const defaultFilters: CatalogFilters = {
  category: "all",
  materials: [],
  minPrice: 0,
  maxPrice: 0,
  availability: [],
  seating: [],
  sort: "featured",
  query: "",
};

export function parseCatalogSearchParams(
  params: Record<string, string | string[] | undefined>,
): CatalogFilters {
  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;
  const list = (value: string | string[] | undefined) => {
    const raw = Array.isArray(value) ? value.join(",") : value;
    return raw ? raw.split(",").filter(Boolean) : [];
  };

  return {
    category: (first(params.category) as CategorySlug | "all") || "all",
    materials: list(params.material),
    minPrice: Number(first(params.min)) || 0,
    maxPrice: Number(first(params.max)) || 0,
    availability: list(params.availability) as Availability[],
    seating: list(params.seating)
      .map(Number)
      .filter((value) => Number.isFinite(value)),
    sort: (first(params.sort) as SortKey) || "featured",
    query: first(params.q) ?? "",
  };
}

export function filterProducts(
  products: Product[],
  filters: CatalogFilters,
): Product[] {
  const query = filters.query.trim().toLowerCase();

  const filtered = products.filter((product) => {
    if (filters.category !== "all" && product.category !== filters.category) {
      return false;
    }
    if (
      filters.materials.length > 0 &&
      !filters.materials.some((material) => product.materials.includes(material))
    ) {
      return false;
    }
    if (filters.minPrice > 0 && product.price < filters.minPrice) return false;
    if (filters.maxPrice > 0 && product.price > filters.maxPrice) return false;
    if (
      filters.availability.length > 0 &&
      !filters.availability.includes(product.availability)
    ) {
      return false;
    }
    if (
      filters.seating.length > 0 &&
      !filters.seating.includes(product.seating ?? 0)
    ) {
      return false;
    }
    if (query) {
      const haystack = [
        product.name,
        product.subtitle,
        product.description,
        product.category,
        ...product.materials,
        ...(product.tags ?? []),
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  switch (filters.sort) {
    case "price-asc":
      return [...filtered].sort((a, b) => a.price - b.price);
    case "price-desc":
      return [...filtered].sort((a, b) => b.price - a.price);
    case "name-asc":
      return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    case "newest":
      return [...filtered].reverse();
    default:
      return filtered;
  }
}

export const activeFilterCount = (filters: CatalogFilters): number => {
  let count = 0;
  if (filters.category !== "all") count += 1;
  count += filters.materials.length;
  if (filters.minPrice > 0 || filters.maxPrice > 0) count += 1;
  count += filters.availability.length;
  count += filters.seating.length;
  if (filters.query) count += 1;
  return count;
};
