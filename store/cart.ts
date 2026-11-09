"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItem } from "@/types";

interface CartState {
  items: CartItem[];
  promoCode: string | null;
  careProtection: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  increment: (key: string) => void;
  decrement: (key: string) => void;
  setPromoCode: (code: string | null) => void;
  setCareProtection: (enabled: boolean) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      promoCode: null,
      careProtection: false,

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((entry) => entry.key === item.key);
          if (existing) {
            return {
              items: state.items.map((entry) =>
                entry.key === item.key
                  ? { ...entry, quantity: Math.min(entry.quantity + item.quantity, 20) }
                  : entry,
              ),
            };
          }
          return { items: [...state.items, item] };
        }),

      removeItem: (key) =>
        set((state) => ({
          items: state.items.filter((entry) => entry.key !== key),
        })),

      setQuantity: (key, quantity) =>
        set((state) => ({
          items: state.items
            .map((entry) =>
              entry.key === key
                ? { ...entry, quantity: Math.max(0, Math.min(quantity, 20)) }
                : entry,
            )
            .filter((entry) => entry.quantity > 0),
        })),

      increment: (key) =>
        set((state) => ({
          items: state.items.map((entry) =>
            entry.key === key
              ? { ...entry, quantity: Math.min(entry.quantity + 1, 20) }
              : entry,
          ),
        })),

      decrement: (key) =>
        set((state) => ({
          items: state.items
            .map((entry) =>
              entry.key === key
                ? { ...entry, quantity: Math.max(0, entry.quantity - 1) }
                : entry,
            )
            .filter((entry) => entry.quantity > 0),
        })),

      setPromoCode: (code) => set({ promoCode: code }),

      setCareProtection: (enabled) => set({ careProtection: enabled }),

      clear: () => set({ items: [], promoCode: null, careProtection: false }),
    }),
    {
      name: "dodox.cart.v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({
        items: state.items,
        promoCode: state.promoCode,
        careProtection: state.careProtection,
      }),
    },
  ),
);
