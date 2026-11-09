"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { buttonStyles } from "@/components/ui/button";
import { formatRwf } from "@/lib/utils";
import { computeTotals, variantSummary } from "@/lib/pricing";
import { useMounted } from "@/hooks/use-mounted";
import { useCartStore } from "@/store/cart";
import { useUiStore } from "@/store/ui";

export function CartDrawer() {
  const open = useUiStore((state) => state.cartOpen);
  const setOpen = useUiStore((state) => state.setCartOpen);

  const mounted = useMounted();
  const items = useCartStore((state) => state.items);
  const promoCode = useCartStore((state) => state.promoCode);
  const care = useCartStore((state) => state.careProtection);
  const removeItem = useCartStore((state) => state.removeItem);

  const totals = computeTotals({ items, promoCode, careProtection: care });
  const visibleItems = mounted ? items : [];

  return (
    <Drawer
      open={open}
      onClose={() => setOpen(false)}
      title="Your Shopping Bag"
      widthClass="max-w-[420px]"
      footer={
        visibleItems.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-muted">Subtotal</span>
              <span className="text-ink">{formatRwf(totals.subtotal)}</span>
            </div>
            {totals.discount > 0 ? (
              <div className="flex items-center justify-between text-[13px] text-bronze">
                <span>Privilege {promoCode}</span>
                <span>-{formatRwf(totals.discount)}</span>
              </div>
            ) : null}
            <div className="flex items-center justify-between border-t border-line pt-3">
              <span className="text-[11px] uppercase tracking-[0.14em] text-muted">
                Total
              </span>
              <span className="font-display text-2xl text-ink">
                {formatRwf(totals.total)}
              </span>
            </div>
            <p className="text-[10px] text-muted">
              VAT included · White-glove Kigali delivery complimentary
            </p>
            <Link
              href="/cart"
              onClick={() => setOpen(false)}
              className={buttonStyles({ className: "w-full" })}
            >
              View Shopping Bag
            </Link>
            <Link
              href="/checkout"
              onClick={() => setOpen(false)}
              className={buttonStyles({ variant: "outline", className: "w-full" })}
            >
              Proceed to Order Request
            </Link>
          </div>
        ) : null
      }
    >
      {visibleItems.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center px-8 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-line text-bronze">
            <ShoppingBag size={20} strokeWidth={1.3} />
          </span>
          <p className="mt-6 font-display text-2xl text-ink">Your bag is empty</p>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            Begin with a signature piece, or let the atelier guide you through the
            collection.
          </p>
          <Link
            href="/shop"
            onClick={() => setOpen(false)}
            className={buttonStyles({ className: "mt-6" })}
          >
            Explore the collection
          </Link>
        </div>
      ) : (
        <div className="px-5 py-5">
          <p className="eyebrow mb-4">
            {totals.itemCount} item{totals.itemCount === 1 ? "" : "s"} reserved for
            your review
          </p>
          <ul className="divide-y divide-line/70">
            {visibleItems.map((item) => (
              <li key={item.key} className="flex gap-4 py-4">
                <Link
                  href={`/shop/${item.slug}`}
                  onClick={() => setOpen(false)}
                  className="relative h-24 w-20 shrink-0 overflow-hidden bg-shell"
                >
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/shop/${item.slug}`}
                      onClick={() => setOpen(false)}
                      className="font-display text-[16px] leading-snug text-ink hover:text-bronze"
                    >
                      {item.name}
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeItem(item.key)}
                      className="text-[9px] uppercase tracking-[0.12em] text-muted transition-colors hover:text-bronze"
                      aria-label={`Remove ${item.name} from bag`}
                    >
                      Remove
                    </button>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-muted">
                    {variantSummary(item.selections) || item.name}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <QuantityStepper
                      value={item.quantity}
                      onChange={(value) => {
                        if (value <= 0) removeItem(item.key);
                        else useCartStore.getState().setQuantity(item.key, value);
                      }}
                      size="sm"
                      min={0}
                    />
                    <span className="text-[12px] text-ink">
                      {formatRwf(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[9px] uppercase tracking-[0.1em] text-muted/80">
                    {item.leadTime}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Drawer>
  );
}
