"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Check,
  CircleDot,
  ClipboardCheck,
  Hammer,
  MapPin,
  Printer,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { siteConfig, whatsappLink } from "@/data/site";
import { getOrder } from "@/lib/orders";
import { formatDate, formatRwf } from "@/lib/utils";
import type { OrderRecord } from "@/types";

const timeline = [
  {
    icon: ClipboardCheck,
    title: "Request received",
    description: "Your order request is logged in this browser for the demo.",
  },
  {
    icon: CircleDot,
    title: "Atelier review",
    description: "A concierge checks configuration, lead time and availability.",
  },
  {
    icon: Hammer,
    title: "Production",
    description: "Made-to-order pieces enter the atelier schedule.",
  },
  {
    icon: Truck,
    title: "White-glove delivery",
    description: "Placement, assembly and packaging removal across Kigali.",
  },
];

export function OrderConfirmation() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("ref") ?? "";
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (reference) setOrder(getOrder(reference));
    setLoaded(true);
  }, [reference]);

  if (!loaded) {
    return (
      <div className="container-shell py-12">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="mt-6 h-64 w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container-shell py-12 sm:py-16">
        <EmptyState
          icon={<ClipboardCheck size={20} strokeWidth={1.3} />}
          title="We could not find that order request"
          description="Order requests are stored in this browser only. If you cleared your browsing data or opened this link elsewhere, the record will not be available."
          action="Return to the collection"
          actionHref="/shop"
          secondary={
            <Link
              href="/track-order"
              className="text-[10px] uppercase tracking-[0.14em] text-bronze underline decoration-line underline-offset-4"
            >
              Try order tracking
            </Link>
          }
        />
      </div>
    );
  }

  const deliveryLabel =
    order.customer.deliveryMethod === "kigali-white-glove"
      ? "Kigali white-glove delivery"
      : "Regional delivery (quote to follow)";

  return (
    <div className="container-shell pb-16 pt-6">
      <div className="border border-line/60 bg-parchment">
        <div className="border-b border-line/70 px-5 py-8 text-center sm:px-10 sm:py-10">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-bronze/40 bg-ivory text-bronze">
            <Check size={20} strokeWidth={1.6} />
          </span>
          <p className="eyebrow mt-5">Order request received</p>
          <h1 className="mt-2 font-display text-[32px] leading-tight text-ink sm:text-[42px]">
            Thank you, {order.customer.firstName}.
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-[13px] leading-relaxed text-muted">
            The atelier has your request and will be in touch at{" "}
            <span className="text-ink">{order.customer.email}</span> to confirm
            details. No payment has been taken.
          </p>

          <div className="mx-auto mt-6 flex max-w-md flex-col items-center gap-1 border border-line bg-ivory px-5 py-4">
            <span className="text-[9px] uppercase tracking-[0.16em] text-muted">
              Order reference
            </span>
            <span className="font-display text-2xl tracking-[0.08em] text-ink">
              {order.reference}
            </span>
            <span className="text-[9px] uppercase tracking-[0.1em] text-muted">
              Placed {formatDate(order.createdAt)}
            </span>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href={`/track-order?ref=${order.reference}`} className={buttonStyles()}>
              Track this request
              <Truck size={13} strokeWidth={1.5} />
            </Link>
            <Link href="/shop" className={buttonStyles({ variant: "light" })}>
              Continue exploring
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className={buttonStyles({ variant: "ghost" })}
            >
              <Printer size={13} strokeWidth={1.5} />
              Print summary
            </button>
          </div>
        </div>

        <div className="grid gap-8 px-5 py-8 sm:px-10 lg:grid-cols-[1fr_360px]">
          <div>
            <h2 className="font-display text-2xl text-ink">What happens next</h2>
            <ol className="mt-4 space-y-4">
              {timeline.map((step, index) => (
                <li key={step.title} className="flex gap-3.5">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center border ${
                      index === 0
                        ? "border-bronze bg-bronze text-ivory"
                        : "border-line bg-ivory text-muted"
                    }`}
                  >
                    <step.icon size={14} strokeWidth={1.4} />
                  </span>
                  <div>
                    <p className="text-[12.5px] font-medium text-ink">{step.title}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-8">
              <h2 className="font-display text-2xl text-ink">Your pieces</h2>
              <ul className="mt-3 divide-y divide-line/60 border border-line/60 bg-ivory/60">
                {order.lines.map((line) => (
                  <li key={line.slug + line.variantSummary} className="flex items-center gap-3 p-3">
                    <div className="relative h-16 w-14 shrink-0 overflow-hidden bg-shell">
                      <Image
                        src={line.image}
                        alt={line.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/shop/${line.slug}`}
                        className="block truncate font-display text-[16px] text-ink hover:text-bronze"
                      >
                        {line.name}
                      </Link>
                      <p className="truncate text-[10px] text-muted">
                        {line.variantSummary} · Qty {line.quantity}
                      </p>
                    </div>
                    <span className="shrink-0 text-[12px] text-ink">
                      {formatRwf(line.unitPrice * line.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 border border-line/60 bg-ivory/60 p-4">
              <h3 className="flex items-center gap-2 font-display text-lg text-ink">
                <MapPin size={14} strokeWidth={1.4} className="text-bronze" />
                Delivery details
              </h3>
              <p className="mt-2 text-[11.5px] leading-relaxed text-ink-soft/85">
                {order.customer.firstName} {order.customer.lastName}
                <br />
                {order.customer.address}
                {order.customer.landmark ? `, ${order.customer.landmark}` : ""}
                <br />
                {order.customer.district}, {order.customer.city}
                <br />
                {order.customer.phone} · {order.customer.email}
              </p>
              <p className="mt-2 text-[10px] uppercase tracking-[0.1em] text-muted">
                {deliveryLabel}
              </p>
              {order.customer.notes ? (
                <p className="mt-2 border-t border-line/60 pt-2 text-[10.5px] leading-relaxed text-muted">
                  Notes: {order.customer.notes}
                </p>
              ) : null}
            </div>
          </div>

          <aside className="space-y-3">
            <div className="border border-line/60 bg-ivory/60 p-5">
              <h2 className="font-display text-xl text-ink">Request summary</h2>
              <div className="mt-3 space-y-2.5 text-[11.5px]">
                <div className="flex justify-between">
                  <span className="text-muted">Subtotal</span>
                  <span>{formatRwf(order.totals.subtotal)}</span>
                </div>
                {order.totals.discount > 0 ? (
                  <div className="flex justify-between text-bronze">
                    <span>Privilege {order.promoCode}</span>
                    <span>−{formatRwf(order.totals.discount)}</span>
                  </div>
                ) : null}
                {order.totals.careProtection > 0 ? (
                  <div className="flex justify-between">
                    <span className="text-muted">Care protection</span>
                    <span>{formatRwf(order.totals.careProtection)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between">
                  <span className="text-muted">Logistics</span>
                  <span className="text-forest">Free</span>
                </div>
                <div className="flex justify-between border-b border-line/60 pb-2.5">
                  <span className="text-muted">VAT included</span>
                  <span className="text-muted">{formatRwf(order.totals.vatIncluded)}</span>
                </div>
                <div className="flex items-end justify-between pt-1">
                  <span className="text-[9px] uppercase tracking-[0.12em] text-muted">
                    Total
                  </span>
                  <span className="font-display text-2xl text-ink">
                    {formatRwf(order.totals.total)}
                  </span>
                </div>
              </div>
            </div>

            <div className="border border-line/60 bg-shell/45 p-4">
              <p className="text-[10px] leading-relaxed text-ink-soft/80">
                This confirmation is a demonstration record stored in your browser.
                Live order confirmations, payments and fulfilment require backend
                integration.
              </p>
            </div>

            <div className="border border-line/60 bg-ivory/60 p-4">
              <p className="text-[9px] uppercase tracking-[0.14em] text-muted">
                Atelier concierge
              </p>
              <a
                href={siteConfig.contact.phoneHref}
                className="mt-1 block font-display text-xl text-ink hover:text-bronze"
              >
                {siteConfig.contact.phone}
              </a>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex text-[10px] uppercase tracking-[0.12em] text-bronze underline decoration-line underline-offset-4"
              >
                Message on WhatsApp
              </a>
            </div>

            <Link
              href="/shop"
              className="flex items-center justify-center gap-2 border border-line bg-parchment px-4 py-3 text-[9px] uppercase tracking-[0.14em] text-ink transition-colors hover:bg-shell"
            >
              <ShoppingBag size={12} strokeWidth={1.4} />
              Continue exploring the collection
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
