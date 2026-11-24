import { beforeEach, describe, expect, it } from "vitest";
import { ensureSeeded } from "@/lib/server/db/seed";
import {
  createAdminCategory,
  createAdminCollection,
  createAdminProduct,
  deleteAdminCategory,
  deleteOrArchiveAdminProduct,
  getPublishedCollectionsFromDb,
  getPublishedProductBySlugFromDb,
  getPublishedProductsFromDb,
  searchPublishedProductsFromDb,
  updateAdminProduct,
} from "@/lib/server/services/catalogue.service";
import {
  deleteMediaAsset,
  getR2ObjectStream,
  listMediaAssets,
  uploadImageToR2,
} from "@/lib/server/storage/r2";
import { installTestCloudflareEnv } from "@/tests/helpers/sqlite-d1";
import { getDb } from "@/lib/server/db/client";

describe("Phase 3 — Catalogue CRUD, Storefront D1 Hydration & R2 Media Library", () => {
  beforeEach(async () => {
    installTestCloudflareEnv();
    const db = await getDb();
    await ensureSeeded(db);
  });

  it("hydrates all 20 seeded products, categories, variants, and search from D1", async () => {
    const published = await getPublishedProductsFromDb();
    expect(published.length).toBe(20);

    const searchResults = await searchPublishedProductsFromDb("bouclé", 10);
    expect(searchResults.length).toBeGreaterThan(0);

    const first = await getPublishedProductBySlugFromDb(published[0].slug);
    expect(first).not.toBeNull();
    expect(first?.variants.length).toBeGreaterThan(0);
    expect(first?.images.length).toBeGreaterThan(0);
  });

  it("creates, updates, and archives products in D1 and reflects immediately on storefront queries", async () => {
    const cols = await getPublishedCollectionsFromDb();
    const targetCollectionId = cols[0]?.id ?? null;

    const created = await createAdminProduct({
      name: "Kivu Travertine Sideboard",
      slug: "",
      sku: "DDX-9901",
      categoryId: "cat_dining-room",
      collectionId: targetCollectionId,
      subtitle: "Hand-honed travertine top over fluted eucalyptus",
      description:
        "Architectural dining credenza handcrafted in Kigali with soft-close brass hardware.",
      story: "Built for contemporary dining spaces.",
      basePrice: 2450000,
      compareAtPrice: 2700000,
      availability: "made-to-order",
      leadTime: "Built in 4–5 weeks",
      featured: true,
      badge: "New Edition",
      seating: null,
      status: "published",
      images: [
        {
          url: "/images/products/imanzi-sofa.jpg",
          altText: "Kivu Travertine Sideboard",
        },
      ],
      materials: ["Travertine", "Kiln-dried eucalyptus"],
      colors: [{ name: "Warm Stone", hex: "#DDD5C7" }],
      dimensions: [{ label: "Width", value: "210 cm" }],
      specs: [{ label: "Hardware", value: "Solid brushed brass" }],
      care: ["Wipe stone spills promptly."],
      variants: [
        {
          id: "timber-tone",
          label: "Timber Tone",
          helper: "",
          options: [
            {
              id: "natural",
              label: "Natural Eucalyptus",
              priceDelta: 0,
            },
            {
              id: "smoked",
              label: "Smoked Espresso",
              priceDelta: 120000,
            },
          ],
        },
      ],
      tags: ["sideboard", "travertine"],
      initialStock: 3,
    });

    expect(created.slug).toBe("kivu-travertine-sideboard");
    expect(created.price).toBe(2450000);
    expect(created.stockQuantity).toBe(3);

    const fromStorefront = await getPublishedProductBySlugFromDb(
      "kivu-travertine-sideboard",
    );
    expect(fromStorefront?.name).toBe("Kivu Travertine Sideboard");

    // Update to out-of-stock
    const updated = await updateAdminProduct(created.id, {
      name: created.name,
      slug: created.slug,
      sku: created.sku,
      categoryId: "cat_dining-room",
      collectionId: targetCollectionId,
      subtitle: created.subtitle,
      description: created.description,
      story: created.story,
      basePrice: 2500000,
      compareAtPrice: null,
      availability: "out-of-stock",
      leadTime: "Temporarily unavailable",
      featured: false,
      status: "published",
      images: [{ url: created.images[0].src, altText: created.name }],
      materials: created.materials,
      colors: created.colors,
      dimensions: created.dimensions,
      specs: created.specs,
      care: created.care,
      variants: created.variants,
      tags: created.tags ?? [],
    });
    expect(updated.availability).toBe("out-of-stock");
    expect(updated.price).toBe(2500000);

    // Archive hides from storefront
    await deleteOrArchiveAdminProduct(created.id, "archive");
    const afterArchive = await getPublishedProductBySlugFromDb(created.slug);
    expect(afterArchive).toBeNull();
  });

  it("manages categories & collections and blocks deleting categories that contain products", async () => {
    await expect(deleteAdminCategory("cat_living-room")).rejects.toThrow(
      /still has products assigned/i,
    );

    const emptyCat = await createAdminCategory({
      name: "Lighting & Objects",
      shortName: "Lighting",
      slug: "lighting-objects",
      tagline: "Warm sculptural brass & linen lamps",
      description: "Studio lighting crafted in Kigali.",
      imageUrl: "/images/categories/decor.jpg",
      imageAlt: "Lighting",
      sortOrder: 9,
      isPublished: true,
    });
    expect(emptyCat.slug).toBe("lighting-objects");
    await deleteAdminCategory(emptyCat.id);

    const col = await createAdminCollection({
      name: "Rwanda Hospitality 2026",
      slug: "rwanda-hospitality-2026",
      tagline: "Boutique lodge pieces",
      description: "Contract-grade furniture.",
      sortOrder: 10,
      isFeatured: true,
      isPublished: true,
    });
    expect(col.slug).toBe("rwanda-hospitality-2026");
  });

  it("validates image magic bytes on R2 uploads, streams objects, and deletes cleanly", async () => {
    // Reject spoofed HTML disguised as .png
    const spoofed = new File(
      [new TextEncoder().encode("<script>alert(1)</script>")],
      "evil.png",
      { type: "image/png" },
    );
    await expect(
      uploadImageToR2({ file: spoofed, folder: "products" }),
    ).rejects.toThrow(/Unsupported file format/i);

    // Valid PNG magic header: 89 50 4E 47 0D 0A 1A 0A + dummy IHDR payload
    const validPngBytes = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52,
    ]);
    const validFile = new File([validPngBytes], "chair-render.png", {
      type: "image/png",
    });

    const uploaded = await uploadImageToR2({
      file: validFile,
      folder: "products",
      altText: "Atelier Chair Render",
    });
    expect(uploaded.publicUrl).toMatch(/^\/api\/media\/products\//);
    expect(uploaded.mimeType).toBe("image/png");

    const streamed = await getR2ObjectStream(uploaded.objectKey);
    expect(streamed).not.toBeNull();
    expect(streamed?.httpMetadata?.contentType).toBe("image/png");

    const list = await listMediaAssets({ folder: "products" });
    expect(list.some((a) => a.id === uploaded.id)).toBe(true);

    await deleteMediaAsset(uploaded.id);
    const afterDelete = await getR2ObjectStream(uploaded.objectKey);
    expect(afterDelete).toBeNull();
  });
});
