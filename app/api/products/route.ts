import { filterProducts, parseCatalogSearchParams } from "@/lib/catalog";
import { handleApiError, jsonOk } from "@/lib/server/http";
import {
  getPublishedProductsFromDb,
  searchPublishedProductsFromDb,
} from "@/lib/server/services/catalogue.service";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchOnly = url.searchParams.get("mode") === "search";
    const q = url.searchParams.get("q") ?? "";

    if (searchOnly) {
      const limit = Math.min(Number(url.searchParams.get("limit")) || 6, 20);
      const products = await searchPublishedProductsFromDb(q, limit);
      return jsonOk({ products });
    }

    const allProducts = await getPublishedProductsFromDb();
    const paramsObj = Object.fromEntries(url.searchParams.entries());
    const filters = parseCatalogSearchParams(paramsObj);
    const collectionFilter = url.searchParams.get("collection")?.trim();
    const colorFilter = url.searchParams.get("color")?.trim();

    let filtered = filterProducts(allProducts, filters);
    if (collectionFilter && collectionFilter !== "all") {
      filtered = filtered.filter(
        (p) =>
          p.collectionSlug === collectionFilter ||
          p.collection === collectionFilter,
      );
    }
    if (colorFilter) {
      const wantedColors = colorFilter
        .split(",")
        .map((c) => c.trim().toLowerCase())
        .filter(Boolean);
      if (wantedColors.length > 0) {
        filtered = filtered.filter((p) =>
          p.colors.some((c) => wantedColors.includes(c.name.toLowerCase())),
        );
      }
    }

    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const pageSize = Math.min(
      Math.max(1, Number(url.searchParams.get("pageSize")) || 50),
      100,
    );
    const total = filtered.length;
    const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

    return jsonOk({
      products: paged,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
