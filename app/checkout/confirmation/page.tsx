import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderConfirmation } from "@/components/checkout/order-confirmation";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageLoading } from "@/components/ui/skeleton";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Order request confirmed",
  description: "Your DODOX order request confirmation and reference number.",
  path: "/checkout/confirmation",
  noIndex: true,
});

export default function ConfirmationPage() {
  return (
    <>
      <div className="container-shell pt-5">
        <Breadcrumbs
          items={[
            { label: "Order Request", href: "/checkout" },
            { label: "Confirmation" },
          ]}
        />
      </div>
      <Suspense fallback={<PageLoading label="Retrieving your order request" />}>
        <OrderConfirmation />
      </Suspense>
    </>
  );
}
