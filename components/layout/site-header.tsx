"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChevronDown,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  User,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { primaryNav } from "@/data/site";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import { useUiStore } from "@/store/ui";
import { useWishlistStore } from "@/store/wishlist";

function CountBadge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-bronze px-1 text-[8px] font-semibold leading-none text-ivory">
      {count > 9 ? "9+" : count}
    </span>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const mounted = useMounted();
  const [megaOpen, setMegaOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const cartCount = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0),
  );
  const wishlistCount = useWishlistStore((state) => state.items.length);

  const setCartOpen = useUiStore((state) => state.setCartOpen);
  const setSearchOpen = useUiStore((state) => state.setSearchOpen);
  const setMobileNavOpen = useUiStore((state) => state.setMobileNavOpen);
  const pushToast = useUiStore((state) => state.pushToast);

  useEffect(() => {
    setMegaOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!megaOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMegaOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [megaOpen]);

  const isActive = (href: string) => {
    const base = href.split("?")[0];
    if (base === "/") return pathname === "/";
    return pathname.startsWith(base);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b bg-ivory/95 backdrop-blur-md transition-shadow duration-300",
        scrolled ? "border-line shadow-[0_10px_30px_-24px_rgba(34,30,25,0.5)]" : "border-line/60",
      )}
      onMouseLeave={() => setMegaOpen(false)}
    >
      <div className="container-shell">
        <div className="relative flex h-[66px] items-center justify-between gap-4 sm:h-[76px]">
          <div className="flex items-center gap-2 xl:hidden">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="flex h-10 w-10 items-center justify-center text-ink"
              aria-label="Open navigation menu"
            >
              <Menu size={20} strokeWidth={1.4} />
            </button>
          </div>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 xl:static xl:left-auto xl:top-auto xl:translate-x-0 xl:translate-y-0">
            <Logo size="small" className="xl:hidden" />
            <Logo className="hidden xl:flex" />
          </div>

          <nav
            className="hidden flex-1 items-center justify-center gap-5 xl:flex 2xl:gap-8"
            aria-label="Primary"
          >
            {primaryNav.map((item) =>
              item.children ? (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => setMegaOpen(true)}
                >
                  <button
                    type="button"
                    aria-expanded={megaOpen}
                    aria-controls="mega-menu"
                    onClick={() => setMegaOpen((open) => !open)}
                    className={cn(
                      "flex items-center gap-1 whitespace-nowrap py-2 text-[11px] uppercase tracking-[0.14em] transition-colors hover:text-bronze",
                      isActive(item.href) || megaOpen ? "text-bronze" : "text-ink/80",
                    )}
                  >
                    Catalog
                    <ChevronDown
                      size={11}
                      strokeWidth={1.6}
                      className={cn(
                        "transition-transform duration-300",
                        megaOpen && "rotate-180",
                      )}
                    />
                  </button>
                </div>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "whitespace-nowrap py-2 text-[11px] uppercase tracking-[0.14em] transition-colors hover:text-bronze",
                    isActive(item.href) ? "text-bronze" : "text-ink/80",
                  )}
                >
                  {item.label === "Furniture Catalog" ? "Catalog" : item.label}
                </Link>
              ),
            )}
          </nav>

          <div className="flex flex-1 items-center justify-end gap-1 sm:gap-2 xl:flex-none">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden h-10 items-center gap-2 border border-line/80 bg-parchment px-3 text-[10px] uppercase tracking-[0.14em] text-muted transition-colors hover:border-taupe hover:text-ink sm:flex"
              aria-label="Search the collection"
            >
              <Search size={13} strokeWidth={1.5} />
              <span className="hidden xl:inline">Search atelier…</span>
              <span className="hidden border border-line px-1 py-0.5 text-[8px] xl:inline">
                /
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex h-10 w-9 items-center justify-center text-ink sm:hidden"
              aria-label="Search the collection"
            >
              <Search size={19} strokeWidth={1.4} />
            </button>

            <button
              type="button"
              onClick={() =>
                pushToast({
                  title: "Prices are shown in Rwandan Francs",
                  description:
                    "All prices on this demonstration storefront are sample values in RWF.",
                  variant: "info",
                })
              }
              className="hidden items-center gap-1 px-2 py-2 text-[10px] uppercase tracking-[0.14em] text-ink/70 transition-colors hover:text-bronze lg:flex"
              aria-label="Currency: Rwandan Franc"
            >
              RWF
              <ChevronDown size={10} strokeWidth={1.6} />
            </button>

            <Link
              href="/wishlist"
              className="relative flex h-10 w-9 items-center justify-center text-ink transition-colors hover:text-bronze"
              aria-label={`Wishlist${mounted && wishlistCount ? `, ${wishlistCount} saved` : ""}`}
            >
              <Heart size={18} strokeWidth={1.4} />
              {mounted ? <CountBadge count={wishlistCount} /> : null}
            </Link>

            <Link
              href="/contact"
              className="hidden h-10 w-9 items-center justify-center text-ink transition-colors hover:text-bronze sm:flex"
              aria-label="Atelier concierge and account enquiries"
            >
              <User size={18} strokeWidth={1.4} />
            </Link>

            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative flex h-10 w-9 items-center justify-center text-ink transition-colors hover:text-bronze"
              aria-label={`Shopping bag${mounted && cartCount ? `, ${cartCount} items` : ""}`}
            >
              <ShoppingBag size={18} strokeWidth={1.4} />
              {mounted ? <CountBadge count={cartCount} /> : null}
            </button>
          </div>
        </div>
      </div>

      {megaOpen ? (
        <div
          id="mega-menu"
          className="absolute inset-x-0 top-full hidden border-t border-line bg-ivory/98 shadow-[0_30px_60px_-40px_rgba(34,30,25,0.5)] backdrop-blur-md xl:block"
          onMouseEnter={() => setMegaOpen(true)}
        >
          <div className="container-shell grid grid-cols-12 gap-10 py-10">
            <div className="col-span-4">
              <p className="eyebrow mb-5">The collection</p>
              <ul className="space-y-1">
                {primaryNav[1].children?.map((child) => (
                  <li key={child.href}>
                    <Link
                      href={child.href}
                      onClick={() => setMegaOpen(false)}
                      className="group flex items-baseline justify-between gap-4 border-b border-line/50 py-3 transition-colors hover:text-bronze"
                    >
                      <span className="font-display text-xl text-ink transition-colors group-hover:text-bronze">
                        {child.label}
                      </span>
                      <span className="text-right text-[10px] uppercase tracking-[0.12em] text-muted">
                        {child.description}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="col-span-4">
              <p className="eyebrow mb-5">Atelier services</p>
              <ul className="space-y-4 text-[13px] text-ink-soft">
                <li>
                  <Link href="/custom-atelier" className="transition-colors hover:text-bronze">
                    <span className="font-display text-lg text-ink">Bespoke commissions</span>
                    <p className="mt-1 text-[12px] leading-relaxed text-muted">
                      Furniture drawn to your room, made in the Kigali atelier.
                    </p>
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="transition-colors hover:text-bronze">
                    <span className="font-display text-lg text-ink">Material library</span>
                    <p className="mt-1 text-[12px] leading-relaxed text-muted">
                      Order timber and textile swatches before you decide.
                    </p>
                  </Link>
                </li>
                <li>
                  <Link href="/track-order" className="transition-colors hover:text-bronze">
                    <span className="font-display text-lg text-ink">Order tracking</span>
                    <p className="mt-1 text-[12px] leading-relaxed text-muted">
                      Follow your commission from atelier to installation.
                    </p>
                  </Link>
                </li>
              </ul>
            </div>

            <div className="col-span-4">
              <Link
                href="/shop?category=living-room"
                onClick={() => setMegaOpen(false)}
                className="group relative block overflow-hidden"
              >
                <div className="relative aspect-[16/10] w-full">
                  <Image
                    src="/images/editorial/atelier-promo.jpg"
                    alt="Sculptural seating in a warm living room at dusk"
                    fill
                    sizes="(max-width: 1280px) 30vw, 420px"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <p className="text-[9px] uppercase tracking-[0.2em] text-ivory/70">
                      Imanzi Series
                    </p>
                    <p className="mt-1 font-display text-xl text-ivory">
                      Sculptural seating, made to order
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
