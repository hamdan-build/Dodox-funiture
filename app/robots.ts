import type { MetadataRoute } from "next";
import { siteConfig } from "@/data/site";

export default function robots(): MetadataRoute.Robots {
  const base = siteConfig.url.replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/cart", "/checkout", "/checkout/confirmation", "/wishlist", "/track-order"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
