"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Price } from "@/components/ui/price";
import { Skeleton } from "@/components/ui/skeleton";
import { productMap } from "@/data/products";
import { buildCartItem } from "@/lib/cart";
import { availabilityLabels } from "@/lib/catalog";
import { useMounted } from "@/hooks/use-mounted";
import { useCartStore } from "@/store/cart";
import { useUiStore } from "@/store/ui";
import { useWishlistStore } from "@/store/wishlist";

export function WishlistView() {
  const mounted = useMounted();
  const items = useWishlistStore((state) => state.items);
  const remove = useWishlistStore((state) => state.remove);
  const addItem = useCartStore((state) => state.addItem);
  const setCartOpen = useUiStore((state) => state.setCartOpen);
  const pushToast = useUiStore((state) => state.pushToast);

  if (!mounted) {
    return (
      <div className="container-shell py-10">
        <h1 className="sr-only">Your Wishlist</h1>
        <Skeleton className="h-8 w-48" />
        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="aspect-[3/4] w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-shell py-12 sm:py-16">
        <EmptyState
          icon={<Heart size={20} strokeWidth={1.3} />}
          title="Your wishlist is waiting"
          description="Save pieces as you browse and they will remain here on this device — ready when your room is."
          action="Explore the collection"
          actionHref="/shop"
          secondary={
            <Link
              href="/custom-atelier"
              className="text-[10px] uppercase tracking-[0.14em] text-bronze underline decoration-line underline-offset-4"
            >
              Or begin a bespoke commission
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-shell pb-16 pt-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Saved on this device</p>
          <h1 className="mt-2 font-display text-[34px] leading-none text-ink sm:text-[44px]">
            Your Wishlist
          </h1>
        </div>
        <p className="text-[10px] uppercase tracking-[0.12em] text-muted">
          {items.length} piece{items.length === 1 ? "" : "s"} saved
        </p>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {items.map((item) => {
          const product = productMap[item.slug];
          return (
            <article
              key={item.productId}
              className="flex flex-col border border-line/60 bg-parchment"
            >
              <div className="relative overflow-hidden bg-shell">
                <Link href={`/shop/${item.slug}`} className="block aspect-[4/5]">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 hover:scale-[1.03]"
                  />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    remove(item.productId);
                    pushToast({
                      title: "Removed from wishlist",
                      description: item.name,
                      variant: "info",
                    });
                  }}
                  className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full border border-line/70 bg-parchment/90 text-ink transition-colors hover:bg-ink hover:text-ivory"
                  aria-label={`Remove ${item.name} from wishlist`}
                >
                  <Trash2 size={13} strokeWidth={1.4} />
                </button>
              </div>

              <div className="flex flex-1 flex-col p-3.5">
                <p className="text-[8px] uppercase tracking-[0.16em] text-muted">
                  {availabilityLabels[item.availability]}
                </p>
                <h2 className="mt-1.5 font-display text-[17px] leading-snug text-ink">
                  <Link href={`/shop/${item.slug}`} className="hover:text-bronze">
                    {item.name}
                  </Link>
                </h2>
                <Price value={item.price} size="sm" className="mt-2" />
                <div className="mt-auto pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (!product) {
                        pushToast({
                          title: "This piece is no longer in the catalogue",
                          variant: "error",
                        });
                        return;
                      }
                      addItem(buildCartItem(product));
                      pushToast({
                        title: "Added to your bag",
                        description: item.name,
                        variant: "success",
                      });
                      setCartOpen(true);
                    }}
                    className={buttonStyles({
                      size: "sm",
                      className: "w-full",
                    })}
                  >
                    <ShoppingBag size={11} strokeWidth={1.5} />
                    Add to bag
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(item.productId)}
                    className="mt-2 w-full text-[9px] uppercase tracking-[0.12em] text-muted transition-colors hover:text-bronze"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link href="/shop" className={buttonStyles({ variant: "light" })}>
          Continue exploring
        </Link>
        <Link href="/cart" className={buttonStyles({ variant: "ghost" })}>
          View shopping bag
        </Link>
      </div>
    </div>
  );
}
