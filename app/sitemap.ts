import type { MetadataRoute } from "next";
import { asc, eq } from "drizzle-orm";
import { siteConfig } from "@/data/site";
import { getDb } from "@/lib/server/db/client";
import { journalPosts as journalPostsTable } from "@/lib/server/db/schema";
import { ensureSeeded } from "@/lib/server/db/seed";
import { getPublishedProductsFromDb } from "@/lib/server/services/catalogue.service";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (
    process.env.NEXT_PUBLIC_SITE_URL || siteConfig.url
  ).replace(/\/$/, "");
  const now = new Date();

  const db = await getDb();
  await ensureSeeded(db);

  const [products, posts] = await Promise.all([
    getPublishedProductsFromDb(),
    db
      .select()
      .from(journalPostsTable)
      .where(eq(journalPostsTable.status, "published"))
      .orderBy(asc(journalPostsTable.publishedDate)),
  ]);

  const staticRoutes: {
    path: string;
    priority: number;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  }[] = [
    { path: "/", priority: 1, changeFrequency: "weekly" },
    { path: "/shop", priority: 0.9, changeFrequency: "weekly" },
    { path: "/custom-atelier", priority: 0.8, changeFrequency: "monthly" },
    { path: "/journal", priority: 0.7, changeFrequency: "monthly" },
    { path: "/about", priority: 0.6, changeFrequency: "yearly" },
    { path: "/contact", priority: 0.6, changeFrequency: "yearly" },
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: `${base}${route.path}`,
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...products.map((product) => ({
      url: `${base}/shop/${product.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    })),
    ...posts.map((post) => ({
      url: `${base}/journal/${post.slug}`,
      lastModified: new Date(post.publishedDate),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
