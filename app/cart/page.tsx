import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ServiceStrip } from "@/components/layout/service-strip";
import { getFeaturedProductsFromDb } from "@/lib/server/services/catalogue.service";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Shopping bag",
  description:
    "Review your curated DODOX pieces, adjust quantities and submit an order request. No payment is taken online.",
  path: "/cart",
  noIndex: true,
});

export default async function CartPage() {
  const recommended = await getFeaturedProductsFromDb(4);
  return (
    <>
      <div className="container-shell pt-5">
        <Breadcrumbs items={[{ label: "Shopping Bag" }]} />
      </div>
      <CartView recommendedProducts={recommended} />
      <ServiceStrip />
    </>
  );
}
