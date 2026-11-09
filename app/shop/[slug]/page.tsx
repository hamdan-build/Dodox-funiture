import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, MonitorPlay } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ServiceStrip } from "@/components/layout/service-strip";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductReviews } from "@/components/product/product-reviews";
import { PurchasePanel } from "@/components/product/purchase-panel";
import { RelatedProducts } from "@/components/product/related-products";
import { TechnicalBlueprint } from "@/components/product/technical-blueprint";
import { Accordion } from "@/components/ui/accordion";
import { buttonStyles } from "@/components/ui/button";
import { categoryMap } from "@/data/categories";
import { getProductBySlug, products } from "@/data/products";
import { careSteps, siteConfig } from "@/data/site";
import { availabilityLabels } from "@/lib/catalog";
import { buildMetadata } from "@/lib/seo";
import { absoluteUrl, formatRwf } from "@/lib/utils";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) {
    return buildMetadata({
      title: "Piece not found",
      description: "This piece is no longer part of the DODOX collection.",
      path: `/shop/${slug}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: product.name,
    description: `${product.description} Sample catalogue pricing: ${formatRwf(product.price)}.`,
    path: `/shop/${product.slug}`,
    image: product.images[0]?.src,
    type: "article",
    keywords: product.tags,
  });
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const category = categoryMap[product.category];
  const badges = [
    product.badge,
    product.availability === "in-stock" ? "In Kigali stock" : "Atelier made to order",
  ].filter(Boolean) as string[];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: [absoluteUrl(product.images[0].src)],
    sku: product.id,
    brand: { "@type": "Brand", name: "DODOX Furniture" },
    material: product.materials.join(", "),
    color: product.colors.map((color) => color.name).join(", "),
    offers: {
      "@type": "Offer",
      priceCurrency: "RWF",
      price: product.price,
      availability:
        product.availability === "in-stock"
          ? "https://schema.org/InStock"
          : "https://schema.org/PreOrder",
      url: absoluteUrl(`/shop/${product.slug}`),
    },
    ...(product.rating && product.reviewCount
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviewCount,
          },
        }
      : {}),
  };

  return (
    <>
      <div className="border-b border-line/50">
        <div className="container-shell flex flex-wrap items-center justify-between gap-3 py-4">
          <Breadcrumbs
            items={[
              { label: "All Furniture", href: "/shop" },
              { label: category.name, href: `/shop?category=${category.slug}` },
              { label: product.name },
            ]}
          />
          <div className="flex flex-wrap gap-1.5">
            {badges.map((badge) => (
              <span
                key={badge}
                className="bg-peach px-2.5 py-1 text-[8px] uppercase tracking-[0.14em] text-peach-ink"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="container-shell pb-10 pt-5 sm:pt-7">
        <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:gap-10 xl:gap-14">
          <div>
            <ProductGallery
              images={product.images}
              name={product.name}
              badges={["Solid timber joinery", "Atelier crafted"]}
            />

            <div className="mt-4 flex flex-col gap-3 border border-line/70 bg-parchment p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-line text-bronze">
                  <MonitorPlay size={15} strokeWidth={1.4} />
                </span>
                <div>
                  <p className="font-display text-[18px] leading-tight text-ink">
                    Experience it with our Kigali design concierge
                  </p>
                  <p className="mt-1 max-w-sm text-[10.5px] leading-relaxed text-muted">
                    Schedule a one-to-one virtual walkthrough of the floor model
                    from the Nyarutarama showroom.
                  </p>
                </div>
              </div>
              <Link
                href="/contact"
                className={buttonStyles({ variant: "light", size: "sm", className: "shrink-0" })}
              >
                Request video
              </Link>
            </div>
          </div>

          <PurchasePanel product={product} />
        </div>
      </div>

      <section className="border-y border-line/60 bg-shell/30">
        <div className="container-shell grid gap-8 py-12 lg:grid-cols-2 lg:gap-14 lg:py-16">
          <div>
            <p className="eyebrow">The piece</p>
            <h2 className="mt-2 display-title">Made around the way you live</h2>
            <p className="mt-4 max-w-lg text-[13.5px] leading-[1.85] text-ink-soft/85">
              {product.story}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {product.dimensions.slice(0, 4).map((row) => (
                <div key={row.label} className="border-l border-bronze/40 pl-3">
                  <p className="text-[9px] uppercase tracking-[0.12em] text-muted">
                    {row.label}
                  </p>
                  <p className="mt-1 text-[13px] text-ink">{row.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {product.colors.map((color) => (
                <span
                  key={color.name}
                  className="inline-flex items-center gap-2 border border-line bg-parchment px-2.5 py-1.5 text-[9px] uppercase tracking-[0.1em] text-ink-soft"
                >
                  <span
                    className="h-3 w-3 rounded-full border border-ink/10"
                    style={{ backgroundColor: color.hex }}
                  />
                  {color.name}
                </span>
              ))}
            </div>
          </div>

          <div>
            <Accordion
              items={[
                {
                  title: "Craft & specification",
                  defaultOpen: true,
                  content: (
                    <dl className="space-y-2.5">
                      {product.specs.map((spec) => (
                        <div
                          key={spec.label}
                          className="flex justify-between gap-6 border-b border-line/60 pb-2"
                        >
                          <dt className="text-muted">{spec.label}</dt>
                          <dd className="text-right text-ink-soft">{spec.value}</dd>
                        </div>
                      ))}
                    </dl>
                  ),
                },
                {
                  title: "Dimensions & scale",
                  content: (
                    <dl className="space-y-2.5">
                      {product.dimensions.map((row) => (
                        <div
                          key={row.label}
                          className="flex justify-between gap-6 border-b border-line/60 pb-2"
                        >
                          <dt className="text-muted">{row.label}</dt>
                          <dd className="text-ink-soft">{row.value}</dd>
                        </div>
                      ))}
                      <p className="pt-1 text-[11px] text-muted">
                        Need a different size? The atelier can adapt this piece to
                        your room.
                      </p>
                    </dl>
                  ),
                },
                {
                  title: "White-glove delivery & assembly",
                  content: (
                    <div className="space-y-2">
                      <p>
                        {availabilityLabels[product.availability]} · {product.leadTime}.
                        Delivery, room-of-choice placement, assembly and packaging
                        removal are coordinated with the Kigali team.
                      </p>
                      <p className="text-muted">
                        Regional delivery is quoted separately after the order
                        request is reviewed.
                      </p>
                    </div>
                  ),
                },
                {
                  title: "Warranty & care",
                  content: (
                    <div className="space-y-3">
                      <p>
                        Structural joinery is covered by the sample atelier
                        guarantee. Warranty terms are confirmed in writing with
                        your order.
                      </p>
                      <ul className="space-y-2">
                        {careSteps.slice(0, 3).map((step) => (
                          <li key={step.title} className="flex gap-2">
                            <span className="mt-1.5 h-1 w-1 shrink-0 bg-bronze" />
                            <span>
                              <span className="text-ink">{step.title}.</span>{" "}
                              {step.description}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ),
                },
              ]}
            />
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Link
                href="/custom-atelier"
                className={buttonStyles({ className: "flex-1" })}
              >
                Request this configuration
                <ArrowRight size={12} strokeWidth={1.5} />
              </Link>
              <Link
                href="/contact"
                className={buttonStyles({ variant: "light", className: "flex-1" })}
              >
                Book a showroom visit
              </Link>
            </div>
          </div>
        </div>
      </section>

      <TechnicalBlueprint product={product} />

      <ProductReviews product={product} />

      <RelatedProducts product={product} />

      <section className="border-t border-line/60 bg-shell/40">
        <div className="container-shell grid gap-6 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="eyebrow">The atelier privilege</p>
            <h2 className="mt-2 display-title">
              Considered advice, before you decide.
            </h2>
            <p className="mt-3 max-w-md text-[13px] leading-relaxed text-muted">
              Order requests are reviewed by a DODOX concierge, who will confirm
              configuration, lead time and local payment arrangements directly with
              you. No payment is taken on this website.
            </p>
          </div>
          <div className="flex flex-col gap-3 border border-line/70 bg-parchment p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted">
                Speak with the atelier
              </p>
              <a
                href={siteConfig.contact.phoneHref}
                className="mt-1 block font-display text-2xl text-ink transition-colors hover:text-bronze"
              >
                {siteConfig.contact.phone}
              </a>
            </div>
            <Link href="/contact" className={buttonStyles({ className: "shrink-0" })}>
              Contact the concierge
            </Link>
          </div>
        </div>
      </section>

      <ServiceStrip />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* A quiet editorial strip keeps the page anchored visually on wide screens */}
      <section className="relative hidden h-[260px] lg:block">
        <Image
          src="/images/rooms/living-room.jpg"
          alt="DODOX living room composition"
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-ink/45" />
        <div className="container-shell relative flex h-full flex-col items-center justify-center text-center">
          <p className="text-[9px] uppercase tracking-[0.24em] text-ivory/70">
            The atelier promise
          </p>
          <p className="mt-3 max-w-xl font-display text-3xl text-ivory">
            Furnishing a home is a long conversation. We are happy to take it
            slowly.
          </p>
        </div>
      </section>
    </>
  );
}
