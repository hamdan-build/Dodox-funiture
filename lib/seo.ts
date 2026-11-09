import type { Metadata } from "next";
import { siteConfig } from "@/data/site";

interface SeoOptions {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: "website" | "article";
  noIndex?: boolean;
  keywords?: string[];
}

export function buildMetadata({
  title,
  description,
  path = "/",
  image = "/images/hero/hero-living-room.jpg",
  type = "website",
  noIndex,
  keywords,
}: SeoOptions): Metadata {
  const url = `${siteConfig.url}${path}`;
  const fullTitle = path === "/" ? title : `${title} · ${siteConfig.name}`;

  return {
    title: { absolute: fullTitle },
    description,
    keywords,
    alternates: { canonical: url },
    robots: noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type,
      images: [
        {
          url: image,
          width: 1672,
          height: 941,
          alt: "DODOX Furniture — handcrafted interiors in Kigali",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image],
    },
  };
}

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "FurnitureStore",
  name: siteConfig.name,
  url: siteConfig.url,
  description: siteConfig.description,
  email: siteConfig.contact.email,
  telephone: siteConfig.contact.phone,
  address: {
    "@type": "PostalAddress",
    streetAddress: siteConfig.contact.showroomAddress,
    addressLocality: siteConfig.contact.city,
    addressCountry: "RW",
  },
};
