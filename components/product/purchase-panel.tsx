"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Ruler,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { StarRating } from "@/components/ui/star-rating";
import { WishlistButton } from "@/components/ui/wishlist-button";
import { buildCartItem, toWishlistItem } from "@/lib/cart";
import { availabilityLabels } from "@/lib/catalog";
import {
  defaultSelections,
  resolveSelections,
  unitPriceFor,
  variantSummary,
} from "@/lib/pricing";
import { cn, formatRwf } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import { useUiStore } from "@/store/ui";
import type { Product, VariantGroup } from "@/types";

function VariantOptionButton({
  selected,
  onSelect,
  option,
}: {
  selected: boolean;
  onSelect: () => void;
  option: VariantGroup["options"][number];
}) {
  const showSwatch = Boolean(option.swatch);
  const deltaLabel =
    option.priceDelta === 0
      ? null
      : `${option.priceDelta > 0 ? "+" : "−"}${formatRwf(Math.abs(option.priceDelta))}`;

  if (showSwatch) {
    return (
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className={cn(
          "flex flex-col items-center gap-2 border bg-parchment px-1.5 py-2.5 text-center transition-colors",
          selected
            ? "border-bronze ring-1 ring-inset ring-bronze/30"
            : "border-line hover:border-taupe",
        )}
        title={`${option.label}${deltaLabel ? ` · ${deltaLabel}` : ""}`}
      >
        <span
          className="h-8 w-8 rounded-full border border-ink/10"
          style={{ backgroundColor: option.swatch }}
          aria-hidden="true"
        />
        <span className="text-[9px] leading-tight text-ink-soft">{option.label}</span>
        {deltaLabel ? (
          <span className="text-[8px] text-muted">{deltaLabel}</span>
        ) : null}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex flex-col border px-2.5 py-2.5 text-left transition-colors",
        selected
          ? "border-bronze ring-1 ring-inset ring-bronze/30"
          : "border-line hover:border-taupe",
      )}
    >
      <span className="text-[11px] font-medium text-ink">{option.label}</span>
      {option.helper ? (
        <span className="mt-0.5 text-[9px] leading-tight text-muted">
          {option.helper}
        </span>
      ) : null}
      <span className="mt-1 text-[9px] text-bronze">
        {deltaLabel ?? "Included"}
      </span>
    </button>
  );
}

export function PurchasePanel({ product }: { product: Product }) {
  const [selectionIds, setSelectionIds] = useState<Record<string, string>>(() =>
    defaultSelections(product),
  );
  const [quantity, setQuantity] = useState(1);

  const addItem = useCartStore((state) => state.addItem);
  const setCartOpen = useUiStore((state) => state.setCartOpen);
  const pushToast = useUiStore((state) => state.pushToast);

  const selections = useMemo(
    () => resolveSelections(product, selectionIds),
    [product, selectionIds],
  );
  const unitPrice = useMemo(
    () => unitPriceFor(product, selections),
    [product, selections],
  );

  const effectiveCompareAt = product.compareAtPrice
    ? product.compareAtPrice + (unitPrice - product.price)
    : undefined;
  const discountPercent =
    effectiveCompareAt && effectiveCompareAt > unitPrice
      ? Math.round(((effectiveCompareAt - unitPrice) / effectiveCompareAt) * 100)
      : 0;

  const handleAdd = () => {
    addItem(buildCartItem(product, selectionIds, quantity));
    pushToast({
      title: "Added to your bag",
      description: `${product.name} · ${variantSummary(selections)}`,
      variant: "success",
    });
    setCartOpen(true);
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[9px] uppercase tracking-[0.2em] text-muted">
            {product.collection ?? product.materials.join(" · ")}
          </p>
          <h1 className="mt-2 font-display text-[30px] leading-[1.05] text-ink sm:text-[38px] lg:text-[42px]">
            {product.name}
          </h1>
        </div>
        {product.rating && product.reviewCount ? (
          <StarRating
            rating={product.rating}
            count={product.reviewCount}
            className="mt-1"
          />
        ) : null}
      </div>

      <p className="mt-3 text-[13px] leading-relaxed text-ink-soft/85">
        {product.description}
      </p>

      <div className="mt-5 border-y border-line/70 py-5">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
          <span className="font-display text-[32px] leading-none text-ink sm:text-[36px]">
            {formatRwf(unitPrice)}
          </span>
          {effectiveCompareAt ? (
            <span className="text-[13px] text-muted line-through">
              {formatRwf(effectiveCompareAt)}
            </span>
          ) : null}
          {discountPercent > 0 ? (
            <span className="bg-peach px-2 py-1 text-[9px] font-medium uppercase tracking-[0.12em] text-peach-ink">
              Save {discountPercent}%
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-[10.5px] leading-relaxed text-muted">
          Includes local duties, white-glove placement and packaging removal across
          Kigali. RWF pricing shown for demonstration.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] uppercase tracking-[0.1em]">
        <span className="flex items-center gap-1.5 text-ink-soft">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              product.availability === "in-stock" ? "bg-forest" : "bg-bronze",
            )}
          />
          {availabilityLabels[product.availability]}
        </span>
        <span className="text-muted">·</span>
        <span className="text-muted">{product.leadTime}</span>
      </div>

      <div className="mt-6 space-y-6">
        {product.variants.map((group) => (
          <div key={group.id}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-ink/70">
                {group.label}:
                <span className="ml-1.5 normal-case tracking-normal text-ink">
                  {group.options.find((option) => option.id === selectionIds[group.id])
                    ?.label ?? group.options[0].label}
                </span>
              </p>
              {group.helper ? (
                <span className="text-[9px] text-muted">{group.helper}</span>
              ) : null}
            </div>
            <div
              className={cn(
                "mt-2.5 grid gap-1.5",
                group.options.some((option) => option.swatch)
                  ? "grid-cols-4"
                  : "grid-cols-3",
              )}
              role="group"
              aria-label={group.label}
            >
              {group.options.map((option) => (
                <VariantOptionButton
                  key={option.id}
                  option={option}
                  selected={selectionIds[group.id] === option.id}
                  onSelect={() =>
                    setSelectionIds((current) => ({
                      ...current,
                      [group.id]: option.id,
                    }))
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-2.5">
        <div className="flex items-stretch gap-2">
          <QuantityStepper value={quantity} onChange={setQuantity} className="shrink-0" />
          <button
            type="button"
            onClick={handleAdd}
            className={cn(
              buttonStyles({ size: "lg", className: "flex-1" }),
              "min-w-0",
            )}
          >
            <ShoppingBag size={15} strokeWidth={1.5} />
            <span className="truncate">
              Add to Bag
              <span className="hidden sm:inline">
                {" "}· {formatRwf(unitPrice * quantity)}
              </span>
            </span>
          </button>
        </div>
        <div className="flex items-center justify-between gap-3">
          <WishlistButton
            item={toWishlistItem(product)}
            variant="inline"
            label="Save to wishlist"
          />
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-muted transition-colors hover:text-bronze"
          >
            Ask the concierge
            <ArrowRight size={11} strokeWidth={1.5} />
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        <div className="border border-line/70 bg-parchment p-3.5">
          <p className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.12em] text-ink">
            <Truck size={12} strokeWidth={1.4} className="text-bronze" />
            White-glove placement
          </p>
          <p className="mt-1.5 text-[10px] leading-relaxed text-muted">
            Complimentary in-room positioning, assembly and debris removal across
            Kigali.
          </p>
        </div>
        <div className="border border-line/70 bg-parchment p-3.5">
          <p className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.12em] text-ink">
            <ShieldCheck size={12} strokeWidth={1.4} className="text-bronze" />
            Atelier warranty
          </p>
          <p className="mt-1.5 text-[10px] leading-relaxed text-muted">
            Structural joinery and timber covered by the sample atelier guarantee.
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-3 border border-line/70 bg-shell/50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2.5">
          <Ruler size={15} strokeWidth={1.4} className="mt-0.5 shrink-0 text-bronze" />
          <div>
            <p className="text-[11px] font-medium text-ink">Custom dimensions?</p>
            <p className="mt-0.5 text-[10px] leading-relaxed text-muted">
              Our atelier can draw this piece around your room and approve finishes
              with you.
            </p>
          </div>
        </div>
        <Link
          href="/custom-atelier"
          className="inline-flex shrink-0 items-center gap-1.5 border border-ink/20 px-3.5 py-2.5 text-[9px] uppercase tracking-[0.14em] text-ink transition-colors hover:bg-ink hover:text-ivory"
        >
          Request custom size
        </Link>
      </div>

      <ul className="mt-5 grid grid-cols-3 gap-2 border-t border-line/70 pt-4 text-center">
        {[
          { label: "In Kigali hub", value: "Showroom viewing" },
          { label: "Order request", value: "No online payment" },
          { label: "Sample trial", value: "30-day demo" },
        ].map((item) => (
          <li key={item.label}>
            <p className="flex items-center justify-center gap-1 text-[9px] uppercase tracking-[0.08em] text-ink/70">
              <Check size={9} strokeWidth={1.8} className="text-bronze" />
              {item.label}
            </p>
            <p className="mt-0.5 text-[8px] uppercase tracking-[0.08em] text-muted/80">
              {item.value}
            </p>
          </li>
        ))}
      </ul>

      {/* Mobile sticky purchase bar */}
      <div className="fixed inset-x-0 bottom-[57px] z-30 border-t border-line bg-ivory/97 px-4 py-2.5 backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[9px] uppercase tracking-[0.1em] text-muted">
              {variantSummary(selections)}
            </p>
            <p className="font-display text-[19px] leading-tight text-ink">
              {formatRwf(unitPrice * quantity)}
            </p>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className="flex h-11 shrink-0 items-center gap-2 bg-bronze px-5 text-[9px] uppercase tracking-[0.14em] text-ivory"
          >
            <ShoppingBag size={13} strokeWidth={1.5} />
            Add to Bag
          </button>
        </div>
      </div>
    </div>
  );
}
