import { z } from "zod";

const nonNegativeInt = z
  .number()
  .int("Must be a whole integer amount in RWF.")
  .min(0, "Amount cannot be negative.");

export const productImageInputSchema = z.object({
  url: z.string().trim().min(1, "Image URL is required."),
  altText: z.string().trim().max(240).default(""),
  mediaId: z.string().nullable().optional(),
});

export const variantOptionValueInputSchema = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(1, "Option label is required."),
  helper: z.string().trim().max(160).optional().or(z.literal("")),
  priceDelta: z.number().int("Variant price delta must be an integer RWF value."),
  swatch: z.string().trim().max(32).optional().or(z.literal("")),
  leadTime: z.string().trim().max(80).optional().or(z.literal("")),
});

export const variantGroupInputSchema = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(1, "Option group label is required."),
  helper: z.string().trim().max(160).optional().or(z.literal("")),
  options: z
    .array(variantOptionValueInputSchema)
    .min(1, "Each option group needs at least one option."),
});

export const productUpsertSchema = z.object({
  name: z.string().trim().min(2, "Product name is required.").max(160),
  slug: z.string().trim().max(120).optional().or(z.literal("")),
  sku: z.string().trim().max(60).optional().or(z.literal("")),
  categoryId: z.string().trim().min(1, "Select a primary category."),
  collectionId: z.string().trim().nullable().optional(),
  subtitle: z.string().trim().max(200).default(""),
  description: z.string().trim().min(10, "Enter a product description.").max(2000),
  story: z.string().trim().max(3000).default(""),
  basePrice: nonNegativeInt.refine((v) => v > 0, "Base price must be greater than 0 RWF."),
  compareAtPrice: nonNegativeInt.nullable().optional(),
  availability: z.enum([
    "in-stock",
    "made-to-order",
    "pre-order",
    "out-of-stock",
  ]),
  leadTime: z.string().trim().min(2, "Enter an indicative lead time.").max(120),
  featured: z.boolean().default(false),
  badge: z.string().trim().max(60).nullable().optional(),
  seating: z.number().int().min(0).max(24).nullable().optional(),
  status: z.enum(["draft", "published", "archived"]).default("published"),
  images: z
    .array(productImageInputSchema)
    .min(1, "At least one product photo is required."),
  materials: z.array(z.string().trim().min(1)).default([]),
  colors: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        hex: z.string().trim().min(4).max(16),
      }),
    )
    .default([]),
  dimensions: z
    .array(
      z.object({
        label: z.string().trim().min(1),
        value: z.string().trim().min(1),
      }),
    )
    .default([]),
  specs: z
    .array(
      z.object({
        label: z.string().trim().min(1),
        value: z.string().trim().min(1),
      }),
    )
    .default([]),
  care: z.array(z.string().trim().min(1)).default([]),
  variants: z.array(variantGroupInputSchema).default([]),
  tags: z.array(z.string().trim().min(1)).default([]),
  seoTitle: z.string().trim().max(160).nullable().optional(),
  seoDescription: z.string().trim().max(320).nullable().optional(),
  initialStock: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
});

export type ProductUpsertInput = z.infer<typeof productUpsertSchema>;

export const categoryUpsertSchema = z.object({
  name: z.string().trim().min(2, "Category name is required.").max(120),
  shortName: z.string().trim().min(2, "Short name is required.").max(60),
  slug: z.string().trim().max(80).optional().or(z.literal("")),
  parentId: z.string().trim().nullable().optional(),
  tagline: z.string().trim().max(160).default(""),
  description: z.string().trim().max(1000).default(""),
  imageUrl: z.string().trim().min(1, "Category image is required."),
  imageAlt: z.string().trim().max(240).default(""),
  sortOrder: z.number().int().min(0).default(0),
  isPublished: z.boolean().default(true),
  seoTitle: z.string().trim().max(160).nullable().optional(),
  seoDescription: z.string().trim().max(320).nullable().optional(),
});

export type CategoryUpsertInput = z.infer<typeof categoryUpsertSchema>;

export const collectionUpsertSchema = z.object({
  name: z.string().trim().min(2, "Collection name is required.").max(120),
  slug: z.string().trim().max(80).optional().or(z.literal("")),
  tagline: z.string().trim().max(160).default(""),
  description: z.string().trim().max(1000).default(""),
  heroImageUrl: z.string().trim().nullable().optional(),
  heroImageAlt: z.string().trim().nullable().optional(),
  sortOrder: z.number().int().min(0).default(0),
  isFeatured: z.boolean().default(false),
  isPublished: z.boolean().default(true),
  productIds: z.array(z.string()).optional(),
});

export type CollectionUpsertInput = z.infer<typeof collectionUpsertSchema>;
