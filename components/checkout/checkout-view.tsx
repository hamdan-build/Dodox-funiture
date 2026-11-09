"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Lock,
  MapPin,
  Phone,
  Sparkles,
  Truck,
} from "lucide-react";
import { CheckboxField, SelectField, TextAreaField, TextField } from "@/components/forms/field";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { careProtection, siteConfig } from "@/data/site";
import { submitOrderRequest } from "@/lib/orders";
import { computeTotals, variantSummary } from "@/lib/pricing";
import { checkoutSchema, type CheckoutInput } from "@/lib/validation";
import { cn, formatRwf } from "@/lib/utils";
import { useMounted } from "@/hooks/use-mounted";
import { useCartStore } from "@/store/cart";
import { useUiStore } from "@/store/ui";
import type { DeliveryMethod } from "@/types";

const districts = [
  "Gasabo · Nyarutarama",
  "Gasabo · Kacyiru",
  "Gasabo · Kimihurura",
  "Gasabo · Gacuriro",
  "Gasabo · Kibagabaga",
  "Kicukiro · Kicukiro Centre",
  "Kicukiro · Niboye",
  "Nyarugenge · Nyarugenge Centre",
  "Nyarugenge · Nyamirambo",
  "Outside Kigali",
];

const deliveryOptions: {
  id: DeliveryMethod;
  title: string;
  description: string;
  meta: string;
  icon: typeof Truck;
}[] = [
  {
    id: "kigali-white-glove",
    title: "Kigali white-glove delivery",
    description:
      "Room-of-choice placement, assembly, level inspection and packaging removal by the DODOX team.",
    meta: "Complimentary",
    icon: Truck,
  },
  {
    id: "regional-courier",
    title: "Regional delivery",
    description:
      "Outside Kigali, the atelier confirms a specialist courier and quote after reviewing your request.",
    meta: "Quoted after review",
    icon: MapPin,
  },
];

export function CheckoutView() {
  const router = useRouter();
  const mounted = useMounted();
  const items = useCartStore((state) => state.items);
  const promoCode = useCartStore((state) => state.promoCode);
  const care = useCartStore((state) => state.careProtection);
  const clearCart = useCartStore((state) => state.clear);
  const pushToast = useUiStore((state) => state.pushToast);
  const [submitting, setSubmitting] = useState(false);

  const totals = computeTotals({ items, promoCode, careProtection: care });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      city: "Kigali",
      district: districts[0],
      address: "",
      landmark: "",
      deliveryMethod: "kigali-white-glove",
      notes: "",
      consent: false as unknown as true,
    },
  });

  const deliveryMethod = watch("deliveryMethod");

  if (!mounted) {
    return (
      <div className="container-shell py-12">
        <h1 className="sr-only">Checkout</h1>
        <Skeleton className="h-8 w-52" />
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
          <Skeleton className="h-[520px] w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  if (items.length === 0 && !submitting) {
    return (
      <div className="container-shell py-12 sm:py-16">
        <EmptyState
          icon={<Lock size={20} strokeWidth={1.3} />}
          title="There is nothing to request yet"
          description="Your bag is empty, so there is no order to prepare. Explore the collection and add a piece to begin."
          action="Explore the collection"
          actionHref="/shop"
        />
      </div>
    );
  }

  const onSubmit = async (values: CheckoutInput) => {
    setSubmitting(true);
    try {
      const order = await submitOrderRequest({
        customer: {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone,
          city: values.city,
          district: values.district,
          address: values.address,
          landmark: values.landmark || undefined,
          deliveryMethod: values.deliveryMethod,
          notes: values.notes || undefined,
        },
        lines: items.map((item) => ({
          name: item.name,
          slug: item.slug,
          image: item.image,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          variantSummary: variantSummary(item.selections),
        })),
        totals,
        careProtection: care,
        promoCode: promoCode ?? undefined,
      });

      clearCart();
      pushToast({
        title: "Order request received",
        description: `Reference ${order.reference}. This is a frontend demonstration — no order was sent to a backend.`,
        variant: "success",
      });
      router.push(`/checkout/confirmation?ref=${order.reference}`);
    } catch {
      setSubmitting(false);
      pushToast({
        title: "Could not submit the request",
        description: "Please try again, or contact the atelier directly.",
        variant: "error",
      });
    }
  };

  return (
    <div className="container-shell pb-16 pt-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Atelier order request</p>
          <h1 className="mt-2 font-display text-[34px] leading-none text-ink sm:text-[42px]">
            Checkout
          </h1>
        </div>
        <Link
          href="/cart"
          className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-muted transition-colors hover:text-bronze"
        >
          <ArrowLeft size={11} strokeWidth={1.5} />
          Return to bag
        </Link>
      </div>

      <div className="mt-5 flex items-start gap-2.5 border border-line/70 bg-shell/50 px-4 py-3">
        <Lock size={13} strokeWidth={1.5} className="mt-0.5 shrink-0 text-bronze" />
        <p className="text-[10.5px] leading-relaxed text-ink-soft/80">
          <strong className="font-medium text-ink">No payment is taken online.</strong>{" "}
          This storefront collects an order request only. A concierge will confirm
          availability, delivery and local payment arrangements directly. Do not
          enter card details anywhere on this site.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px] xl:gap-8"
      >
        <div className="space-y-4">
          <section className="border border-line/60 bg-parchment p-4 sm:p-6">
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-bronze/40 text-[10px] text-bronze">
                01
              </span>
              <h2 className="font-display text-xl text-ink">Contact details</h2>
            </div>
            <p className="mt-1.5 pl-8.5 text-[10.5px] text-muted">
              Used only to confirm this order request.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <TextField
                label="First name"
                autoComplete="given-name"
                error={errors.firstName?.message}
                {...register("firstName")}
              />
              <TextField
                label="Last name"
                autoComplete="family-name"
                error={errors.lastName?.message}
                {...register("lastName")}
              />
              <TextField
                label="Email address"
                type="email"
                autoComplete="email"
                error={errors.email?.message}
                {...register("email")}
              />
              <TextField
                label="Telephone"
                type="tel"
                autoComplete="tel"
                placeholder="+250 7xx xxx xxx"
                error={errors.phone?.message}
                {...register("phone")}
              />
            </div>
          </section>

          <section className="border border-line/60 bg-parchment p-4 sm:p-6">
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-bronze/40 text-[10px] text-bronze">
                02
              </span>
              <h2 className="font-display text-xl text-ink">Delivery information</h2>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <TextField
                label="City"
                autoComplete="address-level2"
                error={errors.city?.message}
                {...register("city")}
              />
              <SelectField
                label="District / neighbourhood"
                error={errors.district?.message}
                {...register("district")}
              >
                {districts.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </SelectField>
              <TextField
                label="Delivery address"
                autoComplete="street-address"
                className="sm:col-span-2"
                placeholder="Street, building, house number"
                error={errors.address?.message}
                {...register("address")}
              />
              <TextField
                label="Landmark (optional)"
                className="sm:col-span-2"
                placeholder="A nearby landmark to help our team find you"
                error={errors.landmark?.message}
                {...register("landmark")}
              />
            </div>

            <fieldset className="mt-5">
              <legend className="field-label">Delivery method</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {deliveryOptions.map((option) => (
                  <label
                    key={option.id}
                    className={cn(
                      "flex cursor-pointer flex-col border p-3.5 transition-colors",
                      deliveryMethod === option.id
                        ? "border-bronze bg-ivory ring-1 ring-inset ring-bronze/20"
                        : "border-line bg-ivory/60 hover:border-taupe",
                    )}
                  >
                    <input
                      type="radio"
                      value={option.id}
                      className="sr-only"
                      {...register("deliveryMethod")}
                    />
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-[11.5px] font-medium text-ink">
                        <option.icon size={14} strokeWidth={1.4} className="text-bronze" />
                        {option.title}
                      </span>
                      {deliveryMethod === option.id ? (
                        <Check size={14} strokeWidth={2} className="text-bronze" />
                      ) : null}
                    </div>
                    <p className="mt-1.5 text-[10px] leading-relaxed text-muted">
                      {option.description}
                    </p>
                    <span className="mt-2 text-[9px] uppercase tracking-[0.1em] text-ink/60">
                      {option.meta}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <TextAreaField
              label="Notes for the atelier (optional)"
              className="mt-4"
              rows={3}
              placeholder="Access instructions, preferred delivery window, or anything we should know."
              error={errors.notes?.message}
              {...register("notes")}
            />
          </section>

          <section className="border border-line/60 bg-parchment p-4 sm:p-6">
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-bronze/40 text-[10px] text-bronze">
                03
              </span>
              <h2 className="font-display text-xl text-ink">Review &amp; submit</h2>
            </div>
            <div className="mt-4 space-y-3">
              <ul className="divide-y divide-line/60 border border-line/60 bg-ivory/60">
                {items.map((item) => (
                  <li key={item.key} className="flex items-center gap-3 p-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden bg-shell">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] text-ink">{item.name}</p>
                      <p className="truncate text-[9.5px] text-muted">
                        {variantSummary(item.selections)} · Qty {item.quantity}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] text-ink">
                      {formatRwf(item.unitPrice * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              <CheckboxField
                label={
                  <>
                    I confirm this is an order <em>request</em>, that no payment has
                    been taken online, and that the atelier will contact me to
                    confirm details.
                  </>
                }
                error={errors.consent?.message}
                {...register("consent")}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={cn(
                "mt-5 flex h-[52px] w-full items-center justify-center gap-2 bg-bronze text-[10px] font-medium uppercase tracking-[0.18em] text-ivory transition-colors hover:bg-bronze-dark disabled:opacity-60",
              )}
            >
              {submitting ? (
                <>
                  <Loader2 size={14} strokeWidth={1.6} className="animate-spin" />
                  Submitting request…
                </>
              ) : (
                <>
                  Submit order request
                  <ArrowRight size={13} strokeWidth={1.5} />
                </>
              )}
            </button>
            <p className="mt-2.5 text-center text-[9.5px] leading-relaxed text-muted">
              Demonstration only — order requests are saved in this browser and are
              not transmitted to a backend.
            </p>
          </section>
        </div>

        <aside>
          <div className="border border-line/60 bg-parchment lg:sticky lg:top-[100px]">
            <div className="flex items-center justify-between border-b border-line/70 px-5 py-4">
              <h2 className="font-display text-[21px] text-ink">Order Summary</h2>
              <span className="text-[9px] uppercase tracking-[0.1em] text-muted">
                {totals.itemCount} item{totals.itemCount === 1 ? "" : "s"}
              </span>
            </div>
            <div className="space-y-3 px-5 py-4 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-muted">Subtotal</span>
                <span className="text-ink">{formatRwf(totals.subtotal)}</span>
              </div>
              {totals.discount > 0 ? (
                <div className="flex items-center justify-between">
                  <span className="text-muted">Privilege {promoCode}</span>
                  <span className="text-bronze">−{formatRwf(totals.discount)}</span>
                </div>
              ) : null}
              {totals.careProtection > 0 ? (
                <div className="flex items-center justify-between">
                  <span className="text-muted">{careProtection.title}</span>
                  <span className="text-ink">{formatRwf(totals.careProtection)}</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between">
                <span className="text-muted">Kigali logistics</span>
                <span className="text-[10px] uppercase tracking-[0.1em] text-forest">
                  Free
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-line/60 pb-3">
                <span className="text-muted">VAT (18% incl.)</span>
                <span className="text-muted">{formatRwf(totals.vatIncluded)}</span>
              </div>
            </div>
            <div className="border-t border-line/70 bg-shell/45 px-5 py-5">
              <p className="text-[9px] uppercase tracking-[0.14em] text-muted">
                Total investment
              </p>
              <p className="mt-1 font-display text-[30px] leading-none text-ink">
                {formatRwf(totals.total)}
              </p>
              <p className="mt-2 text-[9.5px] leading-relaxed text-muted">
                No payment is collected now. Final totals are confirmed by the
                atelier after reviewing your request.
              </p>
            </div>
            <div className="border-t border-line/70 px-5 py-4">
              <p className="flex items-start gap-2 text-[10px] leading-relaxed text-muted">
                <Phone size={12} strokeWidth={1.4} className="mt-0.5 shrink-0 text-bronze" />
                Prefer to speak first? Call {siteConfig.contact.phone} or message the
                concierge — we are happy to help before you submit.
              </p>
              <p className="mt-3 flex items-start gap-2 text-[10px] leading-relaxed text-muted">
                <Sparkles size={12} strokeWidth={1.4} className="mt-0.5 shrink-0 text-bronze" />
                Sample storefront: pricing and lead times are demonstration data.
              </p>
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
}
