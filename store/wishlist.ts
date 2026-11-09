"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { WishlistItem } from "@/types";

interface WishlistState {
  items: WishlistItem[];
  add: (item: WishlistItem) => void;
  remove: (productId: string) => void;
  toggle: (item: WishlistItem) => boolean;
  has: (productId: string) => boolean;
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      add: (item) =>
        set((state) =>
          state.items.some((entry) => entry.productId === item.productId)
            ? state
            : { items: [{ ...item, addedAt: Date.now() }, ...state.items] },
        ),

      remove: (productId) =>
        set((state) => ({
          items: state.items.filter((entry) => entry.productId !== productId),
        })),

      toggle: (item) => {
        const exists = get().items.some(
          (entry) => entry.productId === item.productId,
        );
        if (exists) {
          get().remove(item.productId);
          return false;
        }
        get().add(item);
        return true;
      },

      has: (productId) =>
        get().items.some((entry) => entry.productId === productId),

      clear: () => set({ items: [] }),
    }),
    {
      name: "dodox.wishlist.v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
