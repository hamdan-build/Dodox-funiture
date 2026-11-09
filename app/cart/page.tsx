import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ServiceStrip } from "@/components/layout/service-strip";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Shopping bag",
  description:
    "Review your curated DODOX pieces, adjust quantities and submit an order request. No payment is taken online.",
  path: "/cart",
  noIndex: true,
});

export default function CartPage() {
  return (
    <>
      <div className="container-shell pt-5">
        <Breadcrumbs items={[{ label: "Shopping Bag" }]} />
      </div>
      <CartView />
      <ServiceStrip />
    </>
  );
}
