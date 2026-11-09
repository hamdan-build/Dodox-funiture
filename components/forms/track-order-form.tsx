"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  CircleDot,
  ClipboardCheck,
  Hammer,
  Loader2,
  PackageCheck,
  Truck,
} from "lucide-react";
import { TextField } from "@/components/forms/field";
import { findOrderForCustomer } from "@/lib/orders";
import { trackOrderSchema, type TrackOrderInput } from "@/lib/validation";
import { formatDate, formatRwf } from "@/lib/utils";
import type { OrderRecord } from "@/types";

const stages = [
  {
    key: "received",
    title: "Order request received",
    description: "The request is logged and awaiting atelier review.",
    icon: ClipboardCheck,
  },
  {
    key: "atelier-review",
    title: "Atelier review",
    description: "Configuration, lead time and availability are being confirmed.",
    icon: CircleDot,
  },
  {
    key: "in-production",
    title: "In production",
    description: "Timber is selected and the piece enters the atelier schedule.",
    icon: Hammer,
  },
  {
    key: "ready",
    title: "Ready for white-glove delivery",
    description: "Placement and assembly are being scheduled with the Kigali team.",
    icon: Truck,
  },
];

export function TrackOrderForm() {
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TrackOrderInput>({
    resolver: zodResolver(trackOrderSchema),
    defaultValues: { reference: "", contact: "" },
  });

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) setValue("reference", ref);
  }, [searchParams, setValue]);

  const onSubmit = async (values: TrackOrderInput) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const match = findOrderForCustomer(values.reference, values.contact);
    setOrder(match);
    setNotFound(!match);
    setHasSearched(true);
  };

  const activeStage = order
    ? Math.max(
        0,
        stages.findIndex((stage) => stage.key === order.status),
      )
    : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="border border-line/60 bg-parchment p-5 sm:p-6"
        >
          <h2 className="font-display text-2xl text-ink">Find your request</h2>
          <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
            Enter the reference from your confirmation, plus the email or telephone
            number used for the request.
          </p>
          <div className="mt-4 space-y-3">
            <TextField
              label="Order reference"
              placeholder="DODO-XXXXXX"
              autoComplete="off"
              error={errors.reference?.message}
              {...register("reference")}
            />
            <TextField
              label="Email or telephone"
              placeholder="you@example.com or +250 …"
              autoComplete="email"
              error={errors.contact?.message}
              {...register("contact")}
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 bg-bronze text-[10px] uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-bronze-dark disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Checking…
              </>
            ) : (
              "Track request"
            )}
          </button>
          <div className="mt-4 border border-line/70 bg-ivory/60 p-3.5">
            <p className="text-[10px] leading-relaxed text-muted">
              <strong className="font-medium text-ink">Demo only:</strong> tracking
              reads order requests saved in this browser. Live tracking, courier
              events and production status require backend integration.
            </p>
          </div>
        </form>

        <div className="mt-3 border border-line/70 bg-shell/45 p-4">
          <p className="text-[9px] uppercase tracking-[0.14em] text-muted">
            Need help?
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-ink-soft/80">
            The atelier can look up a request manually if you have lost the
            reference.{" "}
            <Link href="/contact" className="text-bronze underline decoration-line underline-offset-4">
              Contact the concierge
            </Link>
            .
          </p>
        </div>
      </div>

      <div>
        {!hasSearched ? (
          <div className="flex h-full min-h-[320px] flex-col items-center justify-center border border-dashed border-line bg-parchment p-6 text-center">
            <PackageCheck size={22} strokeWidth={1.3} className="text-bronze" />
            <p className="mt-4 font-display text-xl text-ink">
              Your request timeline will appear here
            </p>
            <p className="mt-2 max-w-sm text-[11.5px] leading-relaxed text-muted">
              Four atelier stages: request received, review, production and
              white-glove delivery.
            </p>
          </div>
        ) : order ? (
          <div className="border border-line/60 bg-parchment p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line/70 pb-4">
              <div>
                <p className="eyebrow">Request found</p>
                <p className="mt-1 font-display text-2xl tracking-[0.04em] text-ink">
                  {order.reference}
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-muted">
                  Placed {formatDate(order.createdAt)} ·{" "}
                  {order.customer.firstName} {order.customer.lastName}
                </p>
              </div>
              <span className="bg-peach px-2.5 py-1 text-[9px] uppercase tracking-[0.12em] text-peach-ink">
                {stages[activeStage]?.title ?? "Received"}
              </span>
            </div>

            <ol className="mt-5 space-y-4">
              {stages.map((stage, index) => {
                const complete = index <= activeStage;
                return (
                  <li key={stage.key} className="flex gap-3.5">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center border ${
                        complete
                          ? "border-bronze bg-bronze text-ivory"
                          : "border-line bg-ivory text-muted"
                      }`}
                    >
                      {complete ? (
                        <Check size={13} strokeWidth={2} />
                      ) : (
                        <stage.icon size={13} strokeWidth={1.4} />
                      )}
                    </span>
                    <div className="pb-1">
                      <p
                        className={`text-[12px] font-medium ${
                          complete ? "text-ink" : "text-muted"
                        }`}
                      >
                        {stage.title}
                      </p>
                      <p className="mt-0.5 text-[10.5px] leading-relaxed text-muted">
                        {stage.description}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>

            <div className="mt-4 border-t border-line/70 pt-4">
              <p className="text-[9px] uppercase tracking-[0.14em] text-muted">
                Request summary
              </p>
              <ul className="mt-2 space-y-1.5">
                {order.lines.map((line) => (
                  <li
                    key={line.slug + line.variantSummary}
                    className="flex justify-between gap-3 text-[11px]"
                  >
                    <span className="text-ink-soft">
                      {line.name} <span className="text-muted">× {line.quantity}</span>
                    </span>
                    <span className="text-ink-soft">{formatRwf(line.unitPrice)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-center justify-between border-t border-line/60 pt-2.5">
                <span className="text-[9px] uppercase tracking-[0.12em] text-muted">
                  Total request
                </span>
                <span className="font-display text-xl text-ink">
                  {formatRwf(order.totals.total)}
                </span>
              </div>
            </div>

            <p className="mt-4 text-[10px] leading-relaxed text-muted">
              Status shown is the demo status stored with the request. Production
              and courier updates are not connected.
            </p>
          </div>
        ) : notFound ? (
          <div className="flex h-full min-h-[320px] flex-col items-center justify-center border border-line bg-parchment p-6 text-center">
            <p className="font-display text-2xl text-ink">No matching request</p>
            <p className="mt-2 max-w-sm text-[11.5px] leading-relaxed text-muted">
              Check the reference and contact details. Requests placed in another
              browser are not available in this demonstration.
            </p>
            <Link
              href="/contact"
              className="mt-4 text-[10px] uppercase tracking-[0.14em] text-bronze underline decoration-line underline-offset-4"
            >
              Ask the concierge
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
