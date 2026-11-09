"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, PenTool, Heart, ShoppingBag } from "lucide-react";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import { useUiStore } from "@/store/ui";
import { useWishlistStore } from "@/store/wishlist";

export function MobileTabBar() {
  const pathname = usePathname();
  const mounted = useMounted();
  const cartCount = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0),
  );
  const wishlistCount = useWishlistStore((state) => state.items.length);
  const setCartOpen = useUiStore((state) => state.setCartOpen);

  const tabs = [
    { label: "Home", href: "/", icon: Home },
    { label: "Catalog", href: "/shop", icon: LayoutGrid },
    { label: "Atelier", href: "/custom-atelier", icon: PenTool },
    {
      label: "Wishlist",
      href: "/wishlist",
      icon: Heart,
      count: mounted ? wishlistCount : 0,
    },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ivory/97 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      aria-label="Mobile quick navigation"
    >
      <div className="grid grid-cols-5">
        {tabs.map((tab) => {
          const active =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[8px] uppercase tracking-[0.12em] transition-colors",
                active ? "text-bronze" : "text-ink-soft/70",
              )}
              aria-current={active ? "page" : undefined}
            >
              <span className="relative">
                <tab.icon size={18} strokeWidth={active ? 1.8 : 1.4} />
                {tab.count ? (
                  <span className="absolute -right-1.5 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-bronze px-0.5 text-[7px] leading-none text-ivory">
                    {tab.count}
                  </span>
                ) : null}
              </span>
              {tab.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className={cn(
            "flex flex-col items-center gap-1 py-2.5 text-[8px] uppercase tracking-[0.12em] transition-colors",
            pathname.startsWith("/cart") ? "text-bronze" : "text-ink-soft/70",
          )}
          aria-label="Open shopping bag"
        >
          <span className="relative">
            <ShoppingBag size={18} strokeWidth={1.4} />
            {mounted && cartCount ? (
              <span className="absolute -right-1.5 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-bronze px-0.5 text-[7px] leading-none text-ivory">
                {cartCount}
              </span>
            ) : null}
          </span>
          Bag
        </button>
      </div>
    </nav>
  );
}
