import type { Metadata } from "next";
import { CheckoutView } from "@/components/checkout/checkout-view";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ServiceStrip } from "@/components/layout/service-strip";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Order request",
  description:
    "Submit a DODOX order request with your delivery details. No payment is taken online; the atelier confirms every request personally.",
  path: "/checkout",
  noIndex: true,
});

export default function CheckoutPage() {
  return (
    <>
      <div className="container-shell pt-5">
        <Breadcrumbs
          items={[
            { label: "Shopping Bag", href: "/cart" },
            { label: "Order Request" },
          ]}
        />
      </div>
      <CheckoutView />
      <ServiceStrip />
    </>
  );
}
