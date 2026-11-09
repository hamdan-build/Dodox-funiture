import type { Metadata } from "next";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ServiceStrip } from "@/components/layout/service-strip";
import { TrackOrderForm } from "@/components/forms/track-order-form";
import { PageLoading } from "@/components/ui/skeleton";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Track an order request",
  description:
    "Look up a DODOX order request using your reference and contact details. Demo tracking reads locally stored requests only.",
  path: "/track-order",
  noIndex: true,
});

export default function TrackOrderPage() {
  return (
    <>
      <div className="container-shell pt-5">
        <Breadcrumbs items={[{ label: "Track an order" }]} />
      </div>

      <section className="container-shell pb-10 pt-6 sm:pt-8">
        <p className="eyebrow">Atelier order tracking</p>
        <h1 className="mt-2 display-title">Follow your commission.</h1>
        <p className="mt-4 max-w-xl text-[13px] leading-relaxed text-ink-soft/85">
          Enter the reference from your order confirmation to see where the request
          sits in the atelier process.
        </p>
      </section>

      <section className="container-shell pb-16">
        <Suspense fallback={<PageLoading label="Preparing order tracking" />}>
          <TrackOrderForm />
        </Suspense>
      </section>

      <ServiceStrip />
    </>
  );
}
