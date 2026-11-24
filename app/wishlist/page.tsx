import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ServiceStrip } from "@/components/layout/service-strip";
import { WishlistView } from "@/components/catalog/wishlist-view";
import { getPublishedProductsFromDb } from "@/lib/server/services/catalogue.service";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Wishlist",
  description:
    "Your saved DODOX pieces, kept on this device. Add pieces to your bag or begin a bespoke commission.",
  path: "/wishlist",
  noIndex: true,
});

export default async function WishlistPage() {
  const products = await getPublishedProductsFromDb();
  return (
    <>
      <div className="container-shell pt-5">
        <Breadcrumbs items={[{ label: "Wishlist" }]} />
      </div>
      <WishlistView products={products} />
      <ServiceStrip />
    </>
  );
}
