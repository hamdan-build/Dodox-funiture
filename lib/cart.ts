import {
  cartKey,
  defaultSelections,
  resolveSelections,
  unitPriceFor,
} from "@/lib/pricing";
import type { CartItem, Product, WishlistItem } from "@/types";

export function buildCartItem(
  product: Product,
  selectionIds: Record<string, string> = defaultSelections(product),
  quantity = 1,
): CartItem {
  const selections = resolveSelections(product, selectionIds);
  return {
    key: cartKey(product.id, selections),
    productId: product.id,
    slug: product.slug,
    name: product.name,
    category: product.category,
    image: product.images[0]?.src ?? "/images/products/imanzi-sofa.jpg",
    basePrice: product.price,
    unitPrice: unitPriceFor(product, selections),
    quantity,
    selections,
    availability: product.availability,
    leadTime: product.leadTime,
  };
}

export function toWishlistItem(product: Product): WishlistItem {
  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    image: product.images[0]?.src ?? "/images/products/imanzi-sofa.jpg",
    price: product.price,
    category: product.category,
    availability: product.availability,
    addedAt: Date.now(),
  };
}
