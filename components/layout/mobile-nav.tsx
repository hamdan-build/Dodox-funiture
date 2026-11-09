"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { ArrowRight, Heart, MapPin, Phone, ShoppingBag } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { Logo } from "@/components/ui/logo";
import { categories } from "@/data/categories";
import { siteConfig, whatsappLink } from "@/data/site";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui";

export function MobileNav() {
  const open = useUiStore((state) => state.mobileNavOpen);
  const setOpen = useUiStore((state) => state.setMobileNavOpen);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);

  const close = () => setOpen(false);

  return (
    <Drawer
      open={open}
      onClose={close}
      title="Menu"
      side="left"
      widthClass="max-w-sm"
    >
      <div className="px-5 py-6">
        <div className="mb-8 border-b border-line pb-6">
          <Logo onClick={close} />
        </div>

        <nav aria-label="Mobile primary" className="space-y-1">
          {[
            { label: "Home", href: "/" },
            { label: "All Furniture", href: "/shop" },
            { label: "Custom Atelier", href: "/custom-atelier" },
            { label: "The Journal", href: "/journal" },
            { label: "About DODOX", href: "/about" },
            { label: "Contact & Showroom", href: "/contact" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              className="flex items-center justify-between border-b border-line/60 py-3.5 font-display text-[21px] text-ink transition-colors hover:text-bronze"
            >
              {item.label}
              <ArrowRight size={14} strokeWidth={1.2} className="text-muted" />
            </Link>
          ))}
        </nav>

        <div className="mt-8">
          <p className="eyebrow mb-3">Shop by room</p>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/shop?category=${category.slug}`}
                onClick={close}
                className="border border-line bg-parchment px-3 py-3 text-[11px] uppercase tracking-[0.12em] text-ink-soft transition-colors hover:border-taupe hover:text-bronze"
              >
                {category.shortName}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-2">
          {[
            { href: "/wishlist", label: "Wishlist", icon: Heart },
            { href: "/cart", label: "Bag", icon: ShoppingBag },
            { href: "/track-order", label: "Track", icon: MapPin },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              className={cn(
                "flex flex-col items-center gap-2 border border-line bg-parchment px-2 py-3 text-[9px] uppercase tracking-[0.14em] text-ink-soft transition-colors hover:text-bronze",
              )}
            >
              <item.icon size={16} strokeWidth={1.3} />
              {item.label}
            </Link>
          ))}
        </div>

        <div className="mt-8 space-y-3 border-t border-line pt-6 text-[12px] text-muted">
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 transition-colors hover:text-bronze"
          >
            <Phone size={13} strokeWidth={1.4} />
            {siteConfig.contact.phone}
          </a>
          <p className="flex items-start gap-2">
            <MapPin size={13} strokeWidth={1.4} className="mt-0.5 shrink-0" />
            {siteConfig.contact.showroomAddress}
          </p>
          <p className="pt-1 text-[10px] uppercase tracking-[0.14em] text-muted/80">
            {siteConfig.contact.showroomHours}
          </p>
        </div>
      </div>
    </Drawer>
  );
}
