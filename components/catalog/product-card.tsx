"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { StarRating } from "@/components/ui/star-rating";
import { WishlistButton } from "@/components/ui/wishlist-button";
import { buildCartItem, toWishlistItem } from "@/lib/cart";
import { availabilityLabels } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import { useUiStore } from "@/store/ui";
import type { Product } from "@/types";

export function ProductCard({
  product,
  className,
  priority = false,
  compact = false,
}: {
  product: Product;
  className?: string;
  priority?: boolean;
  compact?: boolean;
}) {
  const addItem = useCartStore((state) => state.addItem);
  const pushToast = useUiStore((state) => state.pushToast);
  const setCartOpen = useUiStore((state) => state.setCartOpen);

  const badgeLabel = product.badge;
  const secondary = product.images[1]?.src;

  const handleQuickAdd = () => {
    addItem(buildCartItem(product));
    pushToast({
      title: "Added to your bag",
      description: `${product.name} — ${availabilityLabels[product.availability]}`,
      variant: "success",
    });
    setCartOpen(true);
  };

  return (
    <article
      className={cn(
        "group relative flex flex-col border border-line/60 bg-parchment transition-colors duration-500 hover:border-taupe/80",
        className,
      )}
    >
      <div className="relative overflow-hidden bg-shell">
        <Link
          href={`/shop/${product.slug}`}
          className="relative block aspect-[4/5] w-full"
          aria-label={`View ${product.name}`}
        >
          <Image
            src={product.images[0].src}
            alt={product.images[0].alt}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={cn(
              "object-cover transition-all duration-700 group-hover:scale-[1.03]",
              secondary && "group-hover:opacity-0",
            )}
          />
          {secondary ? (
            <Image
              src={secondary}
              alt=""
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
              aria-hidden="true"
            />
          ) : null}
        </Link>

        {badgeLabel ? (
          <div className="absolute left-3 top-3">
            <Badge tone="sand" className="bg-parchment/90 text-ink/80">
              {badgeLabel}
            </Badge>
          </div>
        ) : null}

        <WishlistButton
          item={toWishlistItem(product)}
          className="absolute right-3 top-3"
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-ink/55 via-ink/10 to-transparent px-3 pb-3 pt-10 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <div className="pointer-events-auto flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleQuickAdd}
              className="inline-flex items-center gap-1.5 bg-parchment px-3 py-2 text-[9px] font-medium uppercase tracking-[0.14em] text-ink transition-colors hover:bg-ink hover:text-ivory"
            >
              <Plus size={11} strokeWidth={1.8} />
              Quick add
            </button>
            <Link
              href={`/shop/${product.slug}`}
              className="flex h-8 w-8 items-center justify-center bg-parchment/95 text-ink transition-colors hover:bg-ink hover:text-ivory"
              aria-label={`View details for ${product.name}`}
            >
              <ArrowUpRight size={13} strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </div>

      <div className={cn("flex flex-1 flex-col px-3.5 pb-4 pt-4 sm:px-4", compact && "pt-3")}>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[9px] uppercase tracking-[0.18em] text-muted">
            {product.collection ?? product.materials[0]}
          </p>
          {product.rating ? (
            <StarRating
              rating={product.rating}
              count={product.reviewCount}
              size={10}
              className="hidden sm:inline-flex"
            />
          ) : null}
        </div>

        <h3 className="mt-2 font-display text-[17px] leading-snug text-ink sm:text-[19px]">
          <Link
            href={`/shop/${product.slug}`}
            className="transition-colors hover:text-bronze"
          >
            {product.name}
          </Link>
        </h3>

        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted sm:text-[12px]">
          {product.subtitle}
        </p>

        {product.colors.length > 1 ? (
          <div className="mt-2.5 flex items-center gap-1.5">
            {product.colors.slice(0, 4).map((color) => (
              <span
                key={color.name}
                className="h-2.5 w-2.5 rounded-full border border-ink/15"
                style={{ backgroundColor: color.hex }}
                title={color.name}
                aria-label={color.name}
              />
            ))}
          </div>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-[0.14em] text-muted">
              From
            </p>
            <Price value={product.price} size="sm" className="mt-0.5" />
          </div>
          <button
            type="button"
            onClick={handleQuickAdd}
            className="inline-flex shrink-0 items-center gap-1 border border-line px-2.5 py-1.5 text-[9px] font-medium uppercase tracking-[0.14em] text-ink transition-colors hover:border-bronze hover:bg-bronze hover:text-ivory"
            aria-label={`Add ${product.name} to bag`}
          >
            <Plus size={10} strokeWidth={1.8} />
            Add
          </button>
        </div>
      </div>
    </article>
  );
}
