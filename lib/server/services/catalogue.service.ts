import { asc, count, eq, inArray } from "drizzle-orm";
import { getDb, type DbClient } from "@/lib/server/db/client";
import {
  categories,
  collections,
  inventory,
  orderItems,
  productCategories,
  productColors,
  productImages,
  productMaterials,
  productOptions,
  productOptionValues,
  products,
  productSpecifications,
  productTagRelations,
  productTags,
  productVariants,
} from "@/lib/server/db/schema";
import { ensureSeeded } from "@/lib/server/db/seed";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/lib/server/errors";
import { generateId, nowIso, slugify } from "@/lib/server/ids";
import type {
  CategoryUpsertInput,
  CollectionUpsertInput,
  ProductUpsertInput,
} from "@/lib/server/validation/catalogue";
import type { Availability, Category, Product } from "@/types";

async function hydrateProducts(
  db: DbClient,
  productRows: (typeof products.$inferSelect)[],
): Promise<Product[]> {
  if (productRows.length === 0) return [];

  const ids = productRows.map((p) => p.id);

  const [
    catRows,
    colRows,
    imgRows,
    optRows,
    optValRows,
    matRows,
    colorRows,
    specRows,
    tagRelRows,
    invRows,
  ] = await Promise.all([
    db.select().from(categories),
    db.select().from(collections),
    db
      .select()
      .from(productImages)
      .where(inArray(productImages.productId, ids))
      .orderBy(asc(productImages.sortOrder)),
    db
      .select()
      .from(productOptions)
      .where(inArray(productOptions.productId, ids))
      .orderBy(asc(productOptions.sortOrder)),
    db
      .select()
      .from(productOptionValues)
      .where(inArray(productOptionValues.productId, ids))
      .orderBy(asc(productOptionValues.sortOrder)),
    db
      .select()
      .from(productMaterials)
      .where(inArray(productMaterials.productId, ids))
      .orderBy(asc(productMaterials.sortOrder)),
    db
      .select()
      .from(productColors)
      .where(inArray(productColors.productId, ids))
      .orderBy(asc(productColors.sortOrder)),
    db
      .select()
      .from(productSpecifications)
      .where(inArray(productSpecifications.productId, ids))
      .orderBy(asc(productSpecifications.sortOrder)),
    db
      .select({
        productId: productTagRelations.productId,
        tagName: productTags.name,
      })
      .from(productTagRelations)
      .innerJoin(productTags, eq(productTagRelations.tagId, productTags.id))
      .where(inArray(productTagRelations.productId, ids)),
    db.select().from(inventory).where(inArray(inventory.productId, ids)),
  ]);

  const catById = new Map(catRows.map((c) => [c.id, c]));
  const colById = new Map(colRows.map((c) => [c.id, c]));

  return productRows.map((row) => {
    const cat = catById.get(row.categoryId);
    const col = row.collectionId ? colById.get(row.collectionId) : undefined;
    const pImages = imgRows.filter((i) => i.productId === row.id);
    const pOpts = optRows.filter((o) => o.productId === row.id);
    const pMats = matRows.filter((m) => m.productId === row.id);
    const pColors = colorRows.filter((c) => c.productId === row.id);
    const pSpecs = specRows.filter((s) => s.productId === row.id);
    const pTags = tagRelRows
      .filter((t) => t.productId === row.id)
      .map((t) => t.tagName);
    const pInv = invRows.find(
      (inv) => inv.productId === row.id && inv.variantId === null,
    );

    const variantGroups = pOpts.map((opt) => ({
      id: opt.optionKey,
      label: opt.label,
      ...(opt.helperText ? { helper: opt.helperText } : {}),
      options: optValRows
        .filter((v) => v.optionId === opt.id)
        .map((val) => ({
          id: val.valueKey,
          label: val.label,
          ...(val.helperText ? { helper: val.helperText } : {}),
          priceDelta: val.priceDelta,
          ...(val.swatchHex ? { swatch: val.swatchHex } : {}),
          ...(val.leadTimeOverride ? { leadTime: val.leadTimeOverride } : {}),
        })),
    }));

    // Ensure at least a default configuration option so existing UI components always work cleanly
    const safeVariants =
      variantGroups.length > 0
        ? variantGroups
        : [
            {
              id: "edition",
              label: "Edition",
              options: [
                {
                  id: "standard",
                  label: "Standard Atelier Finish",
                  priceDelta: 0,
                },
              ],
            },
          ];

    const availableStock = pInv
      ? Math.max(0, pInv.quantityOnHand - pInv.quantityReserved)
      : 0;

    return {
      id: row.id,
      sku: row.sku,
      slug: row.slug,
      name: row.name,
      category: cat?.slug ?? "living-room",
      categoryId: row.categoryId,
      subtitle: row.subtitle,
      description: row.description,
      story: row.story,
      price: row.basePrice,
      ...(row.compareAtPrice ? { compareAtPrice: row.compareAtPrice } : {}),
      images:
        pImages.length > 0
          ? pImages.map((img) => ({
              src: img.url,
              alt: img.altText || row.name,
            }))
          : [{ src: "/images/products/imanzi-sofa.jpg", alt: row.name }],
      materials: pMats.map((m) => m.name),
      colors: pColors.map((c) => ({ name: c.name, hex: c.hex })),
      dimensions: pSpecs
        .filter((s) => s.groupType === "dimension")
        .map((d) => ({ label: d.label, value: d.value })),
      variants: safeVariants,
      availability: row.availability as Availability,
      leadTime: row.leadTime,
      featured: row.featured,
      ...(row.badge ? { badge: row.badge } : {}),
      ...(row.ratingTenths ? { rating: row.ratingTenths / 10 } : {}),
      ...(row.reviewCount ? { reviewCount: row.reviewCount } : {}),
      specs: pSpecs
        .filter((s) => s.groupType === "spec")
        .map((s) => ({ label: s.label, value: s.value })),
      care: pSpecs
        .filter((s) => s.groupType === "care")
        .map((c) => c.value),
      ...(row.seating !== null ? { seating: row.seating } : {}),
      ...(col ? { collection: col.name, collectionId: col.id, collectionSlug: col.slug } : { collectionId: null, collectionSlug: null }),
      tags: pTags,
      seoTitle: row.seoTitle ?? undefined,
      seoDescription: row.seoDescription ?? undefined,
      status: row.status as "draft" | "published" | "archived",
      stockQuantity: availableStock,
    };
  });
}

// ============================================================================
// PUBLIC STOREFRONT READERS
// ============================================================================

export async function getPublishedProductsFromDb(): Promise<Product[]> {
  const db = await getDb();
  await ensureSeeded(db);

  const rows = await db
    .select()
    .from(products)
    .where(eq(products.status, "published"))
    .orderBy(asc(products.sortOrder), asc(products.name));

  return hydrateProducts(db, rows);
}

export async function getFeaturedProductsFromDb(limit = 8): Promise<Product[]> {
  const all = await getPublishedProductsFromDb();
  const featured = all.filter((p) => p.featured);
  return (featured.length > 0 ? featured : all).slice(0, limit);
}

export async function getPublishedProductBySlugFromDb(
  slug: string,
): Promise<Product | null> {
  const db = await getDb();
  await ensureSeeded(db);

  const rows = await db
    .select()
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);
  const row = rows[0];
  if (!row || row.status !== "published") return null;

  const hydrated = await hydrateProducts(db, [row]);
  return hydrated[0] ?? null;
}

export async function getRelatedProductsFromDb(
  currentProduct: Product,
  limit = 4,
): Promise<Product[]> {
  const all = await getPublishedProductsFromDb();
  const sameCategory = all.filter(
    (p) =>
      p.slug !== currentProduct.slug && p.category === currentProduct.category,
  );
  const others = all.filter(
    (p) =>
      p.slug !== currentProduct.slug && p.category !== currentProduct.category,
  );
  return [...sameCategory, ...others].slice(0, limit);
}

export async function getPublishedCategoriesFromDb(): Promise<Category[]> {
  const db = await getDb();
  await ensureSeeded(db);

  const rows = await db
    .select()
    .from(categories)
    .where(eq(categories.isPublished, true))
    .orderBy(asc(categories.sortOrder), asc(categories.name));

  return rows.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    shortName: c.shortName,
    tagline: c.tagline,
    description: c.description,
    image: c.imageUrl,
    alt: c.imageAlt || c.name,
    parentId: c.parentId,
    sortOrder: c.sortOrder,
    isPublished: c.isPublished,
  }));
}

export async function getPublishedCollectionsFromDb() {
  const db = await getDb();
  await ensureSeeded(db);

  return db
    .select()
    .from(collections)
    .where(eq(collections.isPublished, true))
    .orderBy(asc(collections.sortOrder), asc(collections.name));
}

export async function searchPublishedProductsFromDb(
  query: string,
  limit = 6,
): Promise<Product[]> {
  const term = query.trim().toLowerCase();
  if (!term) return [];
  const all = await getPublishedProductsFromDb();
  return all
    .filter((product) =>
      [
        product.name,
        product.subtitle,
        product.description,
        product.category,
        product.collection ?? "",
        ...product.materials,
        ...product.colors.map((c) => c.name),
        ...(product.tags ?? []),
      ]
        .join(" ")
        .toLowerCase()
        .includes(term),
    )
    .slice(0, limit);
}

// ============================================================================
// ADMIN PRODUCT CRUD
// ============================================================================

export async function listAdminProducts(filters?: {
  status?: string;
  category?: string;
  availability?: string;
  query?: string;
}) {
  const db = await getDb();
  await ensureSeeded(db);

  const rows = await db
    .select()
    .from(products)
    .orderBy(asc(products.sortOrder), asc(products.name));

  const hydrated = await hydrateProducts(db, rows);
  const q = filters?.query?.trim().toLowerCase() ?? "";

  return hydrated.filter((p) => {
    if (filters?.status && filters.status !== "all" && p.status !== filters.status) {
      return false;
    }
    if (
      filters?.category &&
      filters.category !== "all" &&
      p.category !== filters.category &&
      p.categoryId !== filters.category
    ) {
      return false;
    }
    if (
      filters?.availability &&
      filters.availability !== "all" &&
      p.availability !== filters.availability
    ) {
      return false;
    }
    if (q) {
      const hay = `${p.name} ${p.slug} ${p.sku ?? ""} ${p.subtitle}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export async function getAdminProductById(id: string): Promise<Product> {
  const db = await getDb();
  await ensureSeeded(db);

  const rows = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
  if (!rows[0]) {
    throw new NotFoundError("Product not found.");
  }
  const hydrated = await hydrateProducts(db, [rows[0]]);
  return hydrated[0];
}

async function replaceProductRelations(
  db: DbClient,
  productId: string,
  sku: string,
  categoryId: string,
  input: ProductUpsertInput,
  now: string,
) {
  await db.delete(productCategories).where(eq(productCategories.productId, productId));
  await db.delete(productImages).where(eq(productImages.productId, productId));
  await db.delete(productOptionValues).where(eq(productOptionValues.productId, productId));
  await db.delete(productOptions).where(eq(productOptions.productId, productId));
  await db.delete(productMaterials).where(eq(productMaterials.productId, productId));
  await db.delete(productColors).where(eq(productColors.productId, productId));
  await db.delete(productSpecifications).where(eq(productSpecifications.productId, productId));
  await db.delete(productTagRelations).where(eq(productTagRelations.productId, productId));

  await db.insert(productCategories).values({
    productId,
    categoryId,
    isPrimary: true,
    sortOrder: 0,
  });

  for (let i = 0; i < input.images.length; i += 1) {
    const img = input.images[i];
    await db.insert(productImages).values({
      id: generateId("pimg"),
      productId,
      mediaId: img.mediaId ?? null,
      url: img.url,
      altText: img.altText || input.name,
      sortOrder: i,
      isPrimary: i === 0,
      createdAt: now,
    });
  }

  for (let gIdx = 0; gIdx < input.variants.length; gIdx += 1) {
    const group = input.variants[gIdx];
    const optionKey = slugify(group.id || group.label) || `group-${gIdx + 1}`;
    const optId = generateId("popt");
    await db.insert(productOptions).values({
      id: optId,
      productId,
      optionKey,
      label: group.label,
      helperText: group.helper || null,
      sortOrder: gIdx,
    });

    for (let vIdx = 0; vIdx < group.options.length; vIdx += 1) {
      const val = group.options[vIdx];
      const valueKey = slugify(val.id || val.label) || `opt-${vIdx + 1}`;
      await db.insert(productOptionValues).values({
        id: generateId("pov"),
        optionId: optId,
        productId,
        valueKey,
        label: val.label,
        helperText: val.helper || null,
        priceDelta: Math.round(val.priceDelta),
        swatchHex: val.swatch || null,
        leadTimeOverride: val.leadTime || null,
        isAvailable: true,
        sortOrder: vIdx,
      });
    }
  }

  // Ensure default productVariant exists
  const existingVar = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, productId))
    .limit(1);

  if (!existingVar[0]) {
    await db.insert(productVariants).values({
      id: generateId("pvar"),
      productId,
      sku: `${sku}-STD`,
      title: "Standard Configuration",
      optionValuesJson: "{}",
      priceOverride: null,
      priceDelta: 0,
      availabilityOverride: null,
      leadTimeOverride: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  for (let i = 0; i < input.materials.length; i += 1) {
    await db.insert(productMaterials).values({
      id: generateId("pmat"),
      productId,
      name: input.materials[i],
      sortOrder: i,
    });
  }

  for (let i = 0; i < input.colors.length; i += 1) {
    await db.insert(productColors).values({
      id: generateId("pcol"),
      productId,
      name: input.colors[i].name,
      hex: input.colors[i].hex,
      sortOrder: i,
    });
  }

  for (let i = 0; i < input.specs.length; i += 1) {
    await db.insert(productSpecifications).values({
      id: generateId("pspec"),
      productId,
      groupType: "spec",
      label: input.specs[i].label,
      value: input.specs[i].value,
      sortOrder: i,
    });
  }

  for (let i = 0; i < input.dimensions.length; i += 1) {
    await db.insert(productSpecifications).values({
      id: generateId("pspec"),
      productId,
      groupType: "dimension",
      label: input.dimensions[i].label,
      value: input.dimensions[i].value,
      sortOrder: i,
    });
  }

  for (let i = 0; i < input.care.length; i += 1) {
    await db.insert(productSpecifications).values({
      id: generateId("pspec"),
      productId,
      groupType: "care",
      label: `Step ${i + 1}`,
      value: input.care[i],
      sortOrder: i,
    });
  }

  for (const rawTag of input.tags) {
    const tagSlug = slugify(rawTag);
    if (!tagSlug) continue;
    const tagId = `tag_${tagSlug}`;
    await db
      .insert(productTags)
      .values({ id: tagId, slug: tagSlug, name: rawTag })
      .onConflictDoNothing();
    await db
      .insert(productTagRelations)
      .values({ productId, tagId })
      .onConflictDoNothing();
  }
}

export async function createAdminProduct(
  input: ProductUpsertInput,
): Promise<Product> {
  const db = await getDb();
  await ensureSeeded(db);

  const catCheck = await db
    .select()
    .from(categories)
    .where(eq(categories.id, input.categoryId))
    .limit(1);
  if (!catCheck[0]) {
    throw new ValidationError("Selected category does not exist.");
  }

  if (input.collectionId) {
    const colCheck = await db
      .select({ id: collections.id })
      .from(collections)
      .where(eq(collections.id, input.collectionId))
      .limit(1);
    if (!colCheck[0]) {
      throw new ValidationError("Selected collection does not exist.");
    }
  }

  const desiredSlug = slugify(input.slug || input.name);
  if (!desiredSlug) {
    throw new ValidationError("Product slug could not be generated.");
  }

  const slugCollision = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.slug, desiredSlug))
    .limit(1);
  if (slugCollision[0]) {
    throw new ConflictError(`Another product already uses slug "${desiredSlug}".`);
  }

  const totalCount = await db.select({ v: count() }).from(products);
  const sku =
    input.sku?.trim().toUpperCase() ||
    `DDX-${String((totalCount[0]?.v ?? 0) + 101).padStart(4, "0")}`;

  const skuCollision = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.sku, sku))
    .limit(1);
  if (skuCollision[0]) {
    throw new ConflictError(`SKU "${sku}" is already assigned to another product.`);
  }

  const productId = generateId("prd");
  const now = nowIso();

  await db.insert(products).values({
    id: productId,
    slug: desiredSlug,
    sku,
    name: input.name,
    subtitle: input.subtitle,
    description: input.description,
    story: input.story,
    categoryId: input.categoryId,
    collectionId: input.collectionId || null,
    basePrice: Math.round(input.basePrice),
    compareAtPrice: input.compareAtPrice ? Math.round(input.compareAtPrice) : null,
    availability: input.availability,
    leadTime: input.leadTime,
    featured: input.featured,
    badge: input.badge || null,
    ratingTenths: null,
    reviewCount: 0,
    seating: input.seating ?? null,
    seoTitle: input.seoTitle || input.name,
    seoDescription: input.seoDescription || input.description,
    status: input.status,
    sortOrder: (totalCount[0]?.v ?? 0) + 1,
    createdAt: now,
    updatedAt: now,
  });

  await replaceProductRelations(
    db,
    productId,
    sku,
    input.categoryId,
    input,
    now,
  );

  // Create corresponding inventory record
  await db.insert(inventory).values({
    id: generateId("inv"),
    productId,
    variantId: null,
    sku,
    quantityOnHand: input.initialStock ?? (input.availability === "in-stock" ? 5 : 0),
    quantityReserved: 0,
    lowStockThreshold: input.lowStockThreshold ?? 2,
    allowBackorder: input.availability !== "in-stock",
    warehouseLocation: "Kigali Atelier & Showroom",
    updatedAt: now,
  });

  return getAdminProductById(productId);
}

export async function updateAdminProduct(
  productId: string,
  input: ProductUpsertInput,
): Promise<Product> {
  const db = await getDb();
  const existingRows = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);
  const existing = existingRows[0];
  if (!existing) {
    throw new NotFoundError("Product not found.");
  }

  const catCheck = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.id, input.categoryId))
    .limit(1);
  if (!catCheck[0]) {
    throw new ValidationError("Selected category does not exist.");
  }

  if (input.collectionId) {
    const colCheck = await db
      .select({ id: collections.id })
      .from(collections)
      .where(eq(collections.id, input.collectionId))
      .limit(1);
    if (!colCheck[0]) {
      throw new ValidationError("Selected collection does not exist.");
    }
  }

  const desiredSlug = slugify(input.slug || input.name);
  if (!desiredSlug) {
    throw new ValidationError("Enter a valid product slug.");
  }

  const slugCollision = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.slug, desiredSlug))
    .limit(1);
  if (slugCollision[0] && slugCollision[0].id !== productId) {
    throw new ConflictError(`Another product already uses slug "${desiredSlug}".`);
  }

  const sku = input.sku?.trim().toUpperCase() || existing.sku;
  const skuCollision = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.sku, sku))
    .limit(1);
  if (skuCollision[0] && skuCollision[0].id !== productId) {
    throw new ConflictError(`SKU "${sku}" is already assigned to another product.`);
  }

  const now = nowIso();

  await db
    .update(products)
    .set({
      slug: desiredSlug,
      sku,
      name: input.name,
      subtitle: input.subtitle,
      description: input.description,
      story: input.story,
      categoryId: input.categoryId,
      collectionId: input.collectionId || null,
      basePrice: Math.round(input.basePrice),
      compareAtPrice: input.compareAtPrice
        ? Math.round(input.compareAtPrice)
        : null,
      availability: input.availability,
      leadTime: input.leadTime,
      featured: input.featured,
      badge: input.badge || null,
      seating: input.seating ?? null,
      seoTitle: input.seoTitle || input.name,
      seoDescription: input.seoDescription || input.description,
      status: input.status,
      updatedAt: now,
    })
    .where(eq(products.id, productId));

  await replaceProductRelations(
    db,
    productId,
    sku,
    input.categoryId,
    input,
    now,
  );

  // Sync inventory backorder rule & SKU
  await db
    .update(inventory)
    .set({
      sku,
      allowBackorder: input.availability !== "in-stock",
      ...(input.lowStockThreshold !== undefined
        ? { lowStockThreshold: input.lowStockThreshold }
        : {}),
      updatedAt: now,
    })
    .where(eq(inventory.productId, productId));

  return getAdminProductById(productId);
}

export async function deleteOrArchiveAdminProduct(
  productId: string,
  mode: "archive" | "delete" = "archive",
): Promise<{ action: "archived" | "deleted"; name: string }> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);
  const existing = rows[0];
  if (!existing) {
    throw new NotFoundError("Product not found.");
  }

  if (mode === "archive") {
    await db
      .update(products)
      .set({ status: "archived", updatedAt: nowIso() })
      .where(eq(products.id, productId));
    return { action: "archived", name: existing.name };
  }

  // If historical orders reference this product, archive instead of hard-deleting to preserve financial audit integrity
  const orderRefs = await db
    .select({ v: count() })
    .from(orderItems)
    .where(eq(orderItems.productId, productId));

  if ((orderRefs[0]?.v ?? 0) > 0) {
    await db
      .update(products)
      .set({ status: "archived", updatedAt: nowIso() })
      .where(eq(products.id, productId));
    return { action: "archived", name: existing.name };
  }

  await db.delete(products).where(eq(products.id, productId));
  return { action: "deleted", name: existing.name };
}

// ============================================================================
// ADMIN CATEGORY & COLLECTION CRUD
// ============================================================================

export async function listAdminCategories() {
  const db = await getDb();
  await ensureSeeded(db);

  const [catRows, prodRows] = await Promise.all([
    db
      .select()
      .from(categories)
      .orderBy(asc(categories.sortOrder), asc(categories.name)),
    db.select({ categoryId: products.categoryId }).from(products),
  ]);

  return catRows.map((c) => ({
    ...c,
    productCount: prodRows.filter((p) => p.categoryId === c.id).length,
  }));
}

export async function createAdminCategory(input: CategoryUpsertInput) {
  const db = await getDb();
  const slug = slugify(input.slug || input.name);
  if (!slug) throw new ValidationError("Invalid category slug.");

  const collision = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);
  if (collision[0]) {
    throw new ConflictError(`Category slug "${slug}" already exists.`);
  }

  const now = nowIso();
  const id = `cat_${slug}`;
  await db.insert(categories).values({
    id,
    slug,
    parentId: input.parentId || null,
    name: input.name,
    shortName: input.shortName,
    tagline: input.tagline,
    description: input.description,
    imageUrl: input.imageUrl,
    imageAlt: input.imageAlt || input.name,
    sortOrder: input.sortOrder,
    isPublished: input.isPublished,
    seoTitle: input.seoTitle || null,
    seoDescription: input.seoDescription || null,
    createdAt: now,
    updatedAt: now,
  });

  const rows = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);
  return rows[0];
}

export async function updateAdminCategory(
  id: string,
  input: CategoryUpsertInput,
) {
  const db = await getDb();
  const existing = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);
  if (!existing[0]) throw new NotFoundError("Category not found.");

  const slug = slugify(input.slug || input.name);
  const collision = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);
  if (collision[0] && collision[0].id !== id) {
    throw new ConflictError(`Category slug "${slug}" already exists.`);
  }

  if (input.parentId === id) {
    throw new ValidationError("A category cannot be its own parent.");
  }

  await db
    .update(categories)
    .set({
      slug,
      parentId: input.parentId || null,
      name: input.name,
      shortName: input.shortName,
      tagline: input.tagline,
      description: input.description,
      imageUrl: input.imageUrl,
      imageAlt: input.imageAlt || input.name,
      sortOrder: input.sortOrder,
      isPublished: input.isPublished,
      seoTitle: input.seoTitle || null,
      seoDescription: input.seoDescription || null,
      updatedAt: nowIso(),
    })
    .where(eq(categories.id, id));

  const rows = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);
  return rows[0];
}

export async function deleteAdminCategory(id: string) {
  const db = await getDb();
  const assigned = await db
    .select({ v: count() })
    .from(products)
    .where(eq(products.categoryId, id));

  if ((assigned[0]?.v ?? 0) > 0) {
    throw new ConflictError(
      "Cannot delete a category that still has products assigned. Reassign those products first.",
    );
  }
  await db.delete(categories).where(eq(categories.id, id));
}

export async function listAdminCollections() {
  const db = await getDb();
  await ensureSeeded(db);

  const [colRows, prodRows] = await Promise.all([
    db
      .select()
      .from(collections)
      .orderBy(asc(collections.sortOrder), asc(collections.name)),
    db
      .select({ id: products.id, collectionId: products.collectionId })
      .from(products),
  ]);

  return colRows.map((c) => ({
    ...c,
    productIds: prodRows
      .filter((p) => p.collectionId === c.id)
      .map((p) => p.id),
    productCount: prodRows.filter((p) => p.collectionId === c.id).length,
  }));
}

export async function createAdminCollection(input: CollectionUpsertInput) {
  const db = await getDb();
  const slug = slugify(input.slug || input.name);
  if (!slug) throw new ValidationError("Invalid collection slug.");

  const collision = await db
    .select({ id: collections.id })
    .from(collections)
    .where(eq(collections.slug, slug))
    .limit(1);
  if (collision[0]) {
    throw new ConflictError(`Collection slug "${slug}" already exists.`);
  }

  const id = `col_${slug}`;
  const now = nowIso();
  await db.insert(collections).values({
    id,
    slug,
    name: input.name,
    tagline: input.tagline,
    description: input.description,
    heroImageUrl: input.heroImageUrl || null,
    heroImageAlt: input.heroImageAlt || input.name,
    sortOrder: input.sortOrder,
    isFeatured: input.isFeatured,
    isPublished: input.isPublished,
    createdAt: now,
    updatedAt: now,
  });

  if (input.productIds && input.productIds.length > 0) {
    await db
      .update(products)
      .set({ collectionId: id, updatedAt: now })
      .where(inArray(products.id, input.productIds));
  }

  const rows = await db
    .select()
    .from(collections)
    .where(eq(collections.id, id))
    .limit(1);
  return rows[0];
}

export async function updateAdminCollection(
  id: string,
  input: CollectionUpsertInput,
) {
  const db = await getDb();
  const existing = await db
    .select()
    .from(collections)
    .where(eq(collections.id, id))
    .limit(1);
  if (!existing[0]) throw new NotFoundError("Collection not found.");

  const slug = slugify(input.slug || input.name);
  const collision = await db
    .select({ id: collections.id })
    .from(collections)
    .where(eq(collections.slug, slug))
    .limit(1);
  if (collision[0] && collision[0].id !== id) {
    throw new ConflictError(`Collection slug "${slug}" already exists.`);
  }

  const now = nowIso();
  await db
    .update(collections)
    .set({
      slug,
      name: input.name,
      tagline: input.tagline,
      description: input.description,
      heroImageUrl: input.heroImageUrl || null,
      heroImageAlt: input.heroImageAlt || input.name,
      sortOrder: input.sortOrder,
      isFeatured: input.isFeatured,
      isPublished: input.isPublished,
      updatedAt: now,
    })
    .where(eq(collections.id, id));

  if (input.productIds) {
    await db
      .update(products)
      .set({ collectionId: null, updatedAt: now })
      .where(eq(products.collectionId, id));
    if (input.productIds.length > 0) {
      await db
        .update(products)
        .set({ collectionId: id, updatedAt: now })
        .where(inArray(products.id, input.productIds));
    }
  }

  const rows = await db
    .select()
    .from(collections)
    .where(eq(collections.id, id))
    .limit(1);
  return rows[0];
}

export async function deleteAdminCollection(id: string) {
  const db = await getDb();
  await db
    .update(products)
    .set({ collectionId: null, updatedAt: nowIso() })
    .where(eq(products.collectionId, id));
  await db.delete(collections).where(eq(collections.id, id));
}
