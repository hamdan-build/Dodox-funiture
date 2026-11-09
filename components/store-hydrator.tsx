"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";

/**
 * Rehydrates persisted stores after mount. This keeps server-rendered markup
 * (empty cart/wishlist) identical to the first client render and avoids
 * hydration warnings, while still restoring LocalStorage state immediately
 * afterwards.
 */
export function StoreHydrator() {
  useEffect(() => {
    void useCartStore.persist.rehydrate();
    void useWishlistStore.persist.rehydrate();
  }, []);

  return null;
}
