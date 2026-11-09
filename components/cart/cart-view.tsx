"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Heart,
  Lock,
  Package,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tag,
  Trash2,
} from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductCard } from "@/components/catalog/product-card";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { Skeleton } from "@/components/ui/skeleton";
import { careProtection, demoPromoCodes, privilegeThreshold, siteConfig, whatsappLink } from "@/data/site";
import { getProductsBySlugs } from "@/data/products";
import { toWishlistItem } from "@/lib/cart";
import { availabilityLabels } from "@/lib/catalog";
import { computeDiscount, computeTotals, variantSummary } from "@/lib/pricing";
import { cn, formatRwf } from "@/lib/utils";
import { useMounted } from "@/hooks/use-mounted";
import { useCartStore } from "@/store/cart";
import { useUiStore } from "@/store/ui";
import { useWishlistStore } from "@/store/wishlist";
import { productMap } from "@/data/products";

const recommendedSlugs = [
  "nyarutarama-curved-loveseat",
  "kiziwa-linen-cushion",
  "gitaraama-sculptural-vessel",
  "kibuye-counter-stool",
];

export function CartView() {
  const mounted = useMounted();
  const items = useCartStore((state) => state.items);
  const promoCode = useCartStore((state) => state.promoCode);
  const care = useCartStore((state) => state.careProtection);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const setPromoCode = useCartStore((state) => state.setPromoCode);
  const setCare = useCartStore((state) => state.setCareProtection);

  const addWishlist = useWishlistStore((state) => state.add);
  const pushToast = useUiStore((state) => state.pushToast);

  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");

  const totals = computeTotals({ items, promoCode, careProtection: care });
  const appliedPromo = computeDiscount(promoCode, totals.subtotal);
  const progress = Math.min(100, Math.round((totals.subtotal / privilegeThreshold) * 100));
  const remaining = Math.max(0, privilegeThreshold - totals.subtotal);
  const recommended = getProductsBySlugs(recommendedSlugs);

  if (!mounted) {
    return (
      <div className="container-shell py-12">
        <h1 className="sr-only">My Shopping Bag</h1>
        <Skeleton className="h-8 w-56" />
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-shell py-12 sm:py-16">
        <EmptyState
          icon={<ShoppingBag size={22} strokeWidth={1.3} />}
          title="Your shopping bag is empty"
          description="Nothing has been reserved yet. Begin with a signature piece, or browse the full atelier collection."
          action="Explore the collection"
          actionHref="/shop"
          secondary={
            <Link
              href="/wishlist"
              className="text-[10px] uppercase tracking-[0.14em] text-bronze underline decoration-line underline-offset-4"
            >
              View your wishlist
            </Link>
          }
        />

        <div className="mt-12">
          <h2 className="font-display text-2xl text-ink">You may also admire</h2>
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {recommended.map((product) => (
              <ProductCard key={product.id} product={product} compact />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const applyCode = (event: React.FormEvent) => {
    event.preventDefault();
    const promo = demoPromoCodes.find(
      (entry) => entry.code.toLowerCase() === codeInput.trim().toLowerCase(),
    );
    if (!promo) {
      setCodeError("That code is not recognised. Demo codes: WELCOMEKIGALI, ATELIER10.");
      return;
    }
    if (promo.minimumSubtotal && totals.subtotal < promo.minimumSubtotal) {
      setCodeError(
        `${promo.code} applies to orders above ${formatRwf(promo.minimumSubtotal)}.`,
      );
      return;
    }
    setPromoCode(promo.code);
    setCodeInput("");
    setCodeError("");
    pushToast({
      title: `${promo.code} applied`,
      description: promo.description,
      variant: "success",
    });
  };

  const handleSaveForLater = (key: string) => {
    const item = items.find((entry) => entry.key === key);
    if (!item) return;
    const product = productMap[item.slug];
    if (product) addWishlist(toWishlistItem(product));
    removeItem(key);
    pushToast({
      title: "Moved to your wishlist",
      description: item.name,
      variant: "success",
    });
  };

  return (
    <div className="container-shell pb-16 pt-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-[34px] leading-none text-ink sm:text-[44px]">
              My Shopping Bag
            </h1>
            <span className="bg-shell px-2.5 py-1 text-[9px] uppercase tracking-[0.12em] text-ink/60">
              {totals.itemCount} curated piece{totals.itemCount === 1 ? "" : "s"}
            </span>
          </div>
        </div>
        <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-muted">
          <Lock size={11} strokeWidth={1.5} className="text-bronze" />
          Order request · no online payment
        </p>
      </div>

      <div className="mt-5 border border-line/60 bg-shell/40 px-4 py-3.5 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <p className="flex items-center gap-2 text-ink-soft">
            <Sparkles size={12} strokeWidth={1.5} className="text-bronze" />
            {remaining > 0 ? (
              <>
                Atelier privilege: add{" "}
                <strong className="font-medium text-ink">{formatRwf(remaining)}</strong>{" "}
                more to unlock complimentary white-glove assembly across Kigali.
              </>
            ) : (
              <>
                Atelier privilege unlocked —{" "}
                <strong className="font-medium text-ink">
                  complimentary white-glove assembly
                </strong>{" "}
                is included across Kigali.
              </>
            )}
          </p>
          <span className="text-[10px] uppercase tracking-[0.1em] text-bronze">
            {progress}% complete
          </span>
        </div>
        <div className="mt-2.5 h-1 w-full bg-sand">
          <div
            className="h-full bg-bronze transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_370px] xl:gap-8">
        <div className="space-y-4">
          <ul className="divide-y divide-line/60 border border-line/60 bg-parchment">
            {items.map((item) => (
              <li key={item.key} className="flex flex-col gap-4 p-4 sm:flex-row sm:p-5">
                <Link
                  href={`/shop/${item.slug}`}
                  className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-shell sm:aspect-square sm:h-32 sm:w-32"
                >
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 128px"
                    className="object-cover"
                  />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/shop/${item.slug}`}
                        className="font-display text-[21px] leading-tight text-ink transition-colors hover:text-bronze"
                      >
                        {item.name}
                      </Link>
                      <p className="mt-1 text-[11px] text-muted">
                        {variantSummary(item.selections)}
                      </p>
                    </div>
                    <p className="text-[15px] text-ink">
                      {formatRwf(item.unitPrice * item.quantity)}
                    </p>
                  </div>

                  <p className="mt-2 inline-flex w-fit items-center gap-1.5 bg-shell/70 px-2 py-1 text-[9px] uppercase tracking-[0.1em] text-ink/60">
                    <Package size={10} strokeWidth={1.4} className="text-bronze" />
                    {availabilityLabels[item.availability]} · {item.leadTime}
                  </p>

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
                    <QuantityStepper
                      value={item.quantity}
                      onChange={(value) => {
                        if (value <= 0) removeItem(item.key);
                        else setQuantity(item.key, value);
                      }}
                      min={0}
                      size="sm"
                    />
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => handleSaveForLater(item.key)}
                        className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-[0.12em] text-muted transition-colors hover:text-bronze"
                      >
                        <Heart size={11} strokeWidth={1.4} />
                        Save for later
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item.key)}
                        className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-[0.12em] text-muted transition-colors hover:text-bronze"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 size={11} strokeWidth={1.4} />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="border border-line/60 bg-shell/30 p-4 sm:p-5">
            <h2 className="flex items-center gap-2 font-display text-xl text-ink">
              <ShieldCheck size={16} strokeWidth={1.4} className="text-bronze" />
              Atelier White-Glove &amp; Care
            </h2>
            <div className="mt-4 space-y-2.5">
              <div className="flex items-start gap-3 border border-line/60 bg-parchment p-3.5">
                <span className="mt-0.5 flex h-4 w-4 items-center justify-center bg-bronze text-ivory">
                  <Check size={10} strokeWidth={2.4} />
                </span>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[12px] text-ink">
                      White-glove unpacking &amp; precision assembly
                    </p>
                    <span className="bg-shell px-2 py-0.5 text-[8px] uppercase tracking-[0.1em] text-ink/60">
                      Included free
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] leading-relaxed text-muted">
                    Delivered by the DODOX Kigali team: room-of-choice placement,
                    level inspection, packaging recycling and debris removal.
                  </p>
                </div>
              </div>

              <label className="flex cursor-pointer items-start gap-3 border border-line/60 bg-parchment p-3.5">
                <input
                  type="checkbox"
                  checked={care}
                  onChange={(event) => setCare(event.target.checked)}
                  className="mt-0.5 h-4 w-4 appearance-none border border-line bg-parchment checked:border-bronze checked:bg-bronze checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22white%22 stroke-width=%223%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%2220 6 9 17 4 12%22/></svg>')] bg-[length:12px] bg-center bg-no-repeat"
                />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[12px] text-ink">{careProtection.title}</p>
                    <span className="text-[10px] text-ink">
                      +{formatRwf(careProtection.price)}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] leading-relaxed text-muted">
                    {careProtection.description}
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="border border-line/60 bg-parchment p-4 sm:p-5">
            <h2 className="font-display text-xl text-ink">
              Atelier Privilege or Invitation Code
            </h2>
            <form onSubmit={applyCode} className="mt-3 flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Tag
                  size={13}
                  strokeWidth={1.4}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                />
                <input
                  value={codeInput}
                  onChange={(event) => {
                    setCodeInput(event.target.value);
                    setCodeError("");
                  }}
                  placeholder="Enter client code (e.g. WELCOMEKIGALI)"
                  aria-label="Discount or invitation code"
                  className="h-11 w-full border border-line bg-ivory pl-9 pr-3 text-[12px] uppercase tracking-[0.06em] text-ink placeholder:normal-case placeholder:tracking-normal placeholder:text-muted/60 focus:border-bronze focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="h-11 shrink-0 bg-bronze px-6 text-[10px] uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-bronze-dark"
              >
                Apply code
              </button>
            </form>
            {codeError ? (
              <p className="mt-2 text-[11px] text-[#9a4a32]" role="alert">
                {codeError}
              </p>
            ) : null}
            {appliedPromo ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 bg-peach px-3 py-1.5 text-[10px] uppercase tracking-[0.1em] text-peach-ink">
                  <Check size={11} strokeWidth={2} />
                  {appliedPromo.code} · −{formatRwf(appliedPromo.amount)}
                  <button
                    type="button"
                    onClick={() => {
                      setPromoCode(null);
                      pushToast({ title: "Code removed", variant: "info" });
                    }}
                    className="ml-1 text-peach-ink/70 hover:text-peach-ink"
                    aria-label="Remove discount code"
                  >
                    ×
                  </button>
                </span>
                <span className="text-[10px] text-muted">{appliedPromo.label}</span>
              </div>
            ) : (
              <p className="mt-2 text-[10px] text-muted">
                Demonstration codes: WELCOMEKIGALI, ATELIER10
              </p>
            )}
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            {[
              {
                title: "30-Day Kigali In-Home Trial",
                copy: "Experience the piece in your own room. Sample trial terms apply.",
              },
              {
                title: "10-Year Craftsmanship Guarantee",
                copy: "Structural joinery and timber covered. Terms confirmed with your order.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-3 border border-line/60 bg-parchment p-4"
              >
                <ShieldCheck size={16} strokeWidth={1.3} className="mt-0.5 shrink-0 text-bronze" />
                <div>
                  <p className="text-[11px] font-medium text-ink">{item.title}</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-muted">{item.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside>
          <div className="border border-line/60 bg-parchment lg:sticky lg:top-[100px]">
            <div className="flex items-center justify-between border-b border-line/70 px-5 py-4">
              <h2 className="font-display text-[22px] text-ink">Order Summary</h2>
              <span className="text-[9px] uppercase tracking-[0.1em] text-muted">
                {totals.itemCount} selected item{totals.itemCount === 1 ? "" : "s"}
              </span>
            </div>

            <div className="space-y-3 px-5 py-4 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-muted">Subtotal</span>
                <span className="text-ink">{formatRwf(totals.subtotal)}</span>
              </div>
              {totals.discount > 0 ? (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted">
                    Promotional privilege
                    <span className="bg-peach px-1.5 py-0.5 text-[8px] uppercase tracking-[0.08em] text-peach-ink">
                      {promoCode}
                    </span>
                  </span>
                  <span className="text-bronze">−{formatRwf(totals.discount)}</span>
                </div>
              ) : null}
              {totals.careProtection > 0 ? (
                <div className="flex items-center justify-between">
                  <span className="text-muted">Atelier care protection</span>
                  <span className="text-ink">{formatRwf(totals.careProtection)}</span>
                </div>
              ) : null}
              <div className="flex items-start justify-between">
                <span className="text-muted">
                  Kigali white-glove logistics
                  <span className="mt-0.5 block text-[9px] text-muted/70">
                    Room-of-choice &amp; assembly
                  </span>
                </span>
                <span className="text-[10px] uppercase tracking-[0.1em] text-forest">
                  Free
                </span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-muted">
                  Delivery estimate
                  <span className="mt-0.5 block text-[9px] text-muted/70">
                    Confirmed after atelier review
                  </span>
                </span>
                <span className="text-[10px] uppercase tracking-[0.08em] text-ink/70">
                  10–14 days
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-line/60 pb-3">
                <span className="text-muted">Rwanda value added tax (18% incl.)</span>
                <span className="text-muted">{formatRwf(totals.vatIncluded)}</span>
              </div>
            </div>

            <div className="bg-shell/45 px-5 py-5">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.14em] text-muted">
                    Total investment
                  </p>
                  <p className="mt-1 font-display text-[30px] leading-none text-ink">
                    {formatRwf(totals.total)}
                  </p>
                </div>
                <p className="max-w-[42%] text-right text-[9px] leading-relaxed text-muted">
                  Includes local duties, white-glove setup and packaging removal.
                </p>
              </div>

              <Link
                href="/checkout"
                className={buttonStyles({ className: "mt-4 w-full" })}
              >
                Proceed to order request
                <ArrowRight size={13} strokeWidth={1.5} />
              </Link>
              <Link
                href="/shop"
                className="mt-2 flex w-full items-center justify-center gap-2 border border-line bg-parchment px-4 py-3 text-[9px] uppercase tracking-[0.14em] text-ink transition-colors hover:bg-shell"
              >
                <ArrowLeft size={11} strokeWidth={1.5} />
                Continue exploring catalog
              </Link>
            </div>

            <div className="border-t border-line/70 px-5 py-4">
              <p className="text-[9px] uppercase tracking-[0.16em] text-muted">
                How ordering works
              </p>
              <ul className="mt-2.5 space-y-2 text-[10px] leading-relaxed text-muted">
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 bg-bronze" />
                  Submit an order request — no payment is taken online.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 bg-bronze" />
                  A concierge confirms configuration, lead time and local payment.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 bg-bronze" />
                  White-glove delivery is scheduled across Kigali.
                </li>
              </ul>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "mt-4 flex items-center gap-2.5 border border-line/70 bg-shell/50 px-3 py-2.5",
                  "text-[10px] leading-relaxed text-ink-soft transition-colors hover:border-taupe",
                )}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-parchment text-bronze">
                  <Sparkles size={11} strokeWidth={1.5} />
                </span>
                Prefer a phone or WhatsApp consultation? {siteConfig.contact.phone}
              </a>
            </div>
          </div>
        </aside>
      </div>

      <section className="mt-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Curated complements</p>
            <h2 className="mt-2 font-display text-[28px] text-ink sm:text-[34px]">
              You May Also Admire
            </h2>
          </div>
          <Link href="/shop" className="link-underline hidden text-[10px] sm:inline-flex">
            View all architectural accents
            <ArrowRight size={12} strokeWidth={1.5} />
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {recommended.map((product) => (
            <ProductCard key={product.id} product={product} compact />
          ))}
        </div>
      </section>
    </div>
  );
}
