"use client";

import { create } from "zustand";

export type ToastVariant = "success" | "error" | "info";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface UiState {
  cartOpen: boolean;
  searchOpen: boolean;
  mobileNavOpen: boolean;
  toasts: Toast[];
  setCartOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setMobileNavOpen: (open: boolean) => void;
  pushToast: (toast: Omit<Toast, "id">) => string;
  dismissToast: (id: string) => void;
}

export const useUiStore = create<UiState>()((set) => ({
  cartOpen: false,
  searchOpen: false,
  mobileNavOpen: false,
  toasts: [],

  setCartOpen: (cartOpen) =>
    set((state) => ({
      cartOpen,
      searchOpen: cartOpen ? false : state.searchOpen,
      mobileNavOpen: cartOpen ? false : state.mobileNavOpen,
    })),
  setSearchOpen: (searchOpen) =>
    set((state) => ({
      searchOpen,
      cartOpen: searchOpen ? false : state.cartOpen,
      mobileNavOpen: searchOpen ? false : state.mobileNavOpen,
    })),
  setMobileNavOpen: (mobileNavOpen) =>
    set((state) => ({
      mobileNavOpen,
      cartOpen: mobileNavOpen ? false : state.cartOpen,
      searchOpen: mobileNavOpen ? false : state.searchOpen,
    })),

  pushToast: (toast) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    return id;
  },

  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));
