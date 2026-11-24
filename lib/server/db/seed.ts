import { count } from "drizzle-orm";
import { categories as seedCategories } from "@/data/categories";
import { journalPosts as seedJournal, testimonials as seedTestimonials } from "@/data/journal";
import { products as seedProducts } from "@/data/products";
import {
  careProtection as seedCareProtection,
  demoPromoCodes,
  footerNav,
  primaryNav,
  privilegeThreshold,
  siteConfig,
} from "@/data/site";
import type { DbClient } from "@/lib/server/db/client";
import * as schema from "@/lib/server/db/schema";
import { nowIso, slugify } from "@/lib/server/ids";
import {
  PERMISSIONS,
  ROLE_DEFINITIONS,
} from "@/lib/server/permissions/definitions";

let seedPromise: Promise<void> | null = null;

/**
 * Ensures RBAC roles/permissions and baseline DODOX catalogue/content exist in D1.
 * Safe and idempotent to call on cold start or from CLI scripts.
 * Never creates default staff accounts or credentials.
 */
export async function ensureSeeded(db: DbClient): Promise<void> {
  const existingRoles = await db
    .select({ value: count() })
    .from(schema.roles);
  const existingProducts = await db
    .select({ value: count() })
    .from(schema.products);

  if (
    (existingRoles[0]?.value ?? 0) >= ROLE_DEFINITIONS.length &&
    (existingProducts[0]?.value ?? 0) > 0
  ) {
    return;
  }

  if (!seedPromise) {
    seedPromise = runFullSeed(db).finally(() => {
      seedPromise = null;
    });
  }
  await seedPromise;
}

export async function runFullSeed(db: DbClient): Promise<void> {
  const now = nowIso();

  // 1. Seed Permissions & Roles
  for (const perm of PERMISSIONS) {
    await db
      .insert(schema.permissions)
      .values({
        id: `perm_${perm.key.replace(/\./g, "_")}`,
        key: perm.key,
        module: perm.module,
        description: perm.description,
      })
      .onConflictDoNothing();
  }

  for (const role of ROLE_DEFINITIONS) {
    const roleId = `role_${role.slug}`;
    await db
      .insert(schema.roles)
      .values({
        id: roleId,
        slug: role.slug,
        name: role.name,
        description: role.description,
        isSystem: true,
        createdAt: now,
      })
      .onConflictDoNothing();

    for (const permKey of role.permissions) {
      await db
        .insert(schema.rolePermissions)
        .values({
          roleId,
          permissionId: `perm_${permKey.replace(/\./g, "_")}`,
        })
        .onConflictDoNothing();
    }
  }

  // 2. Seed Categories
  const categoryIdBySlug = new Map<string, string>();
  for (let i = 0; i < seedCategories.length; i += 1) {
    const cat = seedCategories[i];
    const catId = `cat_${cat.slug}`;
    categoryIdBySlug.set(cat.slug, catId);

    await db
      .insert(schema.categories)
      .values({
        id: catId,
        slug: cat.slug,
        parentId: null,
        name: cat.name,
        shortName: cat.shortName,
        tagline: cat.tagline,
        description: cat.description,
        imageUrl: cat.image,
        imageAlt: cat.alt,
        sortOrder: i + 1,
        isPublished: true,
        seoTitle: `${cat.name} Furniture · ${siteConfig.name}`,
        seoDescription: cat.description,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing();
  }

  // 3. Seed Collections extracted from existing products
  const collectionNames = Array.from(
    new Set(
      seedProducts
        .map((p) => p.collection)
        .filter((name): name is string => Boolean(name)),
    ),
  );
  const collectionIdByName = new Map<string, string>();
  for (let i = 0; i < collectionNames.length; i += 1) {
    const colName = collectionNames[i];
    const colSlug = slugify(colName);
    const colId = `col_${colSlug}`;
    collectionIdByName.set(colName, colId);
    const heroProd = seedProducts.find((p) => p.collection === colName);

    await db
      .insert(schema.collections)
      .values({
        id: colId,
        slug: colSlug,
        name: colName,
        tagline: "Atelier Edition",
        description: `Architectural pieces from the ${colName}, handcrafted in our Kigali studio.`,
        heroImageUrl:
          heroProd?.images[0]?.src ?? "/images/editorial/atelier-promo.jpg",
        heroImageAlt: heroProd?.images[0]?.alt ?? colName,
        sortOrder: i + 1,
        isFeatured: i < 3,
        isPublished: true,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing();
  }

  // 4. Seed Tags, Products, Images, Options, Variants, Specs, Materials, Colors & Inventory
  const seededTags = new Map<string, string>();

  for (let idx = 0; idx < seedProducts.length; idx += 1) {
    const prod = seedProducts[idx];
    const catId =
      categoryIdBySlug.get(prod.category) ?? `cat_${seedCategories[0].slug}`;
    const colId = prod.collection
      ? (collectionIdByName.get(prod.collection) ?? null)
      : null;
    const sku = `DDX-${String(idx + 1).padStart(4, "0")}`;

    await db
      .insert(schema.products)
      .values({
        id: prod.id,
        slug: prod.slug,
        sku,
        name: prod.name,
        subtitle: prod.subtitle,
        description: prod.description,
        story: prod.story,
        categoryId: catId,
        collectionId: colId,
        basePrice: Math.round(prod.price),
        compareAtPrice: prod.compareAtPrice
          ? Math.round(prod.compareAtPrice)
          : null,
        availability: prod.availability,
        leadTime: prod.leadTime,
        featured: Boolean(prod.featured),
        badge: prod.badge ?? null,
        ratingTenths: prod.rating ? Math.round(prod.rating * 10) : null,
        reviewCount: prod.reviewCount ?? 0,
        seating: prod.seating ?? null,
        seoTitle: prod.name,
        seoDescription: prod.description,
        status: "published",
        sortOrder: idx + 1,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing();

    await db
      .insert(schema.productCategories)
      .values({
        productId: prod.id,
        categoryId: catId,
        isPrimary: true,
        sortOrder: 0,
      })
      .onConflictDoNothing();

    // Images
    for (let imgIdx = 0; imgIdx < prod.images.length; imgIdx += 1) {
      const img = prod.images[imgIdx];
      await db
        .insert(schema.productImages)
        .values({
          id: `pimg_${prod.id}_${imgIdx}`,
          productId: prod.id,
          mediaId: null,
          url: img.src,
          altText: img.alt,
          sortOrder: imgIdx,
          isPrimary: imgIdx === 0,
          createdAt: now,
        })
        .onConflictDoNothing();
    }

    // Options & Option Values
    for (let gIdx = 0; gIdx < prod.variants.length; gIdx += 1) {
      const group = prod.variants[gIdx];
      const optId = `popt_${prod.id}_${group.id}`;
      await db
        .insert(schema.productOptions)
        .values({
          id: optId,
          productId: prod.id,
          optionKey: group.id,
          label: group.label,
          helperText: group.helper ?? null,
          sortOrder: gIdx,
        })
        .onConflictDoNothing();

      for (let vIdx = 0; vIdx < group.options.length; vIdx += 1) {
        const val = group.options[vIdx];
        await db
          .insert(schema.productOptionValues)
          .values({
            id: `pov_${prod.id}_${group.id}_${val.id}`,
            optionId: optId,
            productId: prod.id,
            valueKey: val.id,
            label: val.label,
            helperText: val.helper ?? null,
            priceDelta: Math.round(val.priceDelta),
            swatchHex: val.swatch ?? null,
            leadTimeOverride: val.leadTime ?? null,
            isAvailable: true,
            sortOrder: vIdx,
          })
          .onConflictDoNothing();
      }
    }

    // Default SKU Variant
    const defaultOptionMap = Object.fromEntries(
      prod.variants.map((g) => [g.id, g.options[0]?.id ?? ""]),
    );
    const defaultVariantId = `pvar_${prod.id}_default`;
    await db
      .insert(schema.productVariants)
      .values({
        id: defaultVariantId,
        productId: prod.id,
        sku: `${sku}-STD`,
        title: prod.variants
          .map((g) => g.options[0]?.label)
          .filter(Boolean)
          .join(" · ") || "Standard",
        optionValuesJson: JSON.stringify(defaultOptionMap),
        priceOverride: null,
        priceDelta: 0,
        availabilityOverride: null,
        leadTimeOverride: null,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing();

    // Materials
    for (let mIdx = 0; mIdx < prod.materials.length; mIdx += 1) {
      await db
        .insert(schema.productMaterials)
        .values({
          id: `pmat_${prod.id}_${mIdx}`,
          productId: prod.id,
          name: prod.materials[mIdx],
          sortOrder: mIdx,
        })
        .onConflictDoNothing();
    }

    // Colors
    for (let cIdx = 0; cIdx < prod.colors.length; cIdx += 1) {
      const col = prod.colors[cIdx];
      await db
        .insert(schema.productColors)
        .values({
          id: `pcol_${prod.id}_${cIdx}`,
          productId: prod.id,
          name: col.name,
          hex: col.hex,
          sortOrder: cIdx,
        })
        .onConflictDoNothing();
    }

    // Specifications, Dimensions & Care
    for (let sIdx = 0; sIdx < prod.specs.length; sIdx += 1) {
      const spec = prod.specs[sIdx];
      await db
        .insert(schema.productSpecifications)
        .values({
          id: `pspec_${prod.id}_spec_${sIdx}`,
          productId: prod.id,
          groupType: "spec",
          label: spec.label,
          value: spec.value,
          sortOrder: sIdx,
        })
        .onConflictDoNothing();
    }
    for (let dIdx = 0; dIdx < prod.dimensions.length; dIdx += 1) {
      const dim = prod.dimensions[dIdx];
      await db
        .insert(schema.productSpecifications)
        .values({
          id: `pspec_${prod.id}_dim_${dIdx}`,
          productId: prod.id,
          groupType: "dimension",
          label: dim.label,
          value: dim.value,
          sortOrder: dIdx,
        })
        .onConflictDoNothing();
    }
    for (let kIdx = 0; kIdx < prod.care.length; kIdx += 1) {
      await db
        .insert(schema.productSpecifications)
        .values({
          id: `pspec_${prod.id}_care_${kIdx}`,
          productId: prod.id,
          groupType: "care",
          label: `Step ${kIdx + 1}`,
          value: prod.care[kIdx],
          sortOrder: kIdx,
        })
        .onConflictDoNothing();
    }

    // Tags
    for (const rawTag of prod.tags ?? []) {
      const tagSlug = slugify(rawTag);
      if (!tagSlug) continue;
      let tagId = seededTags.get(tagSlug);
      if (!tagId) {
        tagId = `tag_${tagSlug}`;
        seededTags.set(tagSlug, tagId);
        await db
          .insert(schema.productTags)
          .values({
            id: tagId,
            slug: tagSlug,
            name: rawTag,
          })
          .onConflictDoNothing();
      }
      await db
        .insert(schema.productTagRelations)
        .values({
          productId: prod.id,
          tagId,
        })
        .onConflictDoNothing();
    }

    // Inventory
    const invId = `inv_${prod.id}`;
    const initialStock =
      prod.availability === "in-stock" ? (idx % 3 === 0 ? 2 : 6) : 0;
    const allowBackorder = prod.availability !== "in-stock";

    await db
      .insert(schema.inventory)
      .values({
        id: invId,
        productId: prod.id,
        variantId: null,
        sku,
        quantityOnHand: initialStock,
        quantityReserved: 0,
        lowStockThreshold: prod.availability === "in-stock" ? 2 : 0,
        allowBackorder,
        warehouseLocation:
          prod.availability === "in-stock"
            ? "Nyarutarama Showroom"
            : "Kigali Atelier Bench",
        updatedAt: now,
      })
      .onConflictDoNothing();

    if (initialStock > 0) {
      await db
        .insert(schema.inventoryMovements)
        .values({
          id: `imov_seed_${prod.id}`,
          inventoryId: invId,
          productId: prod.id,
          variantId: null,
          movementType: "initial_seed",
          quantityDelta: initialStock,
          previousOnHand: 0,
          newOnHand: initialStock,
          previousReserved: 0,
          newReserved: 0,
          referenceType: "seed",
          referenceId: "catalogue_migration",
          reason: "Initial showroom stock migrated from catalogue",
          actorUserId: null,
          createdAt: now,
        })
        .onConflictDoNothing();
    }
  }

  // 5. Seed Sample Suppliers (clearly marked for procurement workflow)
  const sampleSuppliers = [
    {
      id: "sup_east_african_timber",
      name: "Great Lakes Kiln Timber Co. (Sample)",
      code: "SUP-TIMBER-01",
      contactName: "Timber Procurement Desk",
      email: "timber.sample@example.com",
      phone: "+250 788 000 101",
      city: "Kigali",
      country: "Rwanda",
      materialsSupplied: "Kiln-dried Oak, Eucalyptus, African Teak, Mahogany",
    },
    {
      id: "sup_atelier_textiles",
      name: "Kigali Loom & Bouclé Imports (Sample)",
      code: "SUP-TEXTILE-02",
      contactName: "Textile Desk",
      email: "textiles.sample@example.com",
      phone: "+250 788 000 102",
      city: "Kigali",
      country: "Rwanda",
      materialsSupplied: "Martindale Loop Bouclé, European Linen, Woven Cane",
    },
  ];
  for (const sup of sampleSuppliers) {
    await db
      .insert(schema.suppliers)
      .values({
        ...sup,
        notes: "Demonstration supplier record — replace with verified vendor details.",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing();
  }

  // 6. Seed Demo Coupons (marked isDemo = true for owner verification)
  for (const promo of demoPromoCodes) {
    await db
      .insert(schema.coupons)
      .values({
        id: `cpn_${promo.code.toLowerCase()}`,
        code: promo.code.toUpperCase(),
        label: promo.label,
        description: promo.description,
        discountType: promo.type,
        value: Math.round(promo.value),
        minimumSubtotal: promo.minimumSubtotal
          ? Math.round(promo.minimumSubtotal)
          : 0,
        maximumDiscount: null,
        startsAt: null,
        expiresAt: null,
        usageLimit: null,
        usageCount: 0,
        perCustomerLimit: null,
        isActive: true,
        isDemo: true,
        createdByUserId: null,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing();
  }

  // 7. Seed Order Reference Sequence for current year
  const currentYear = new Date().getUTCFullYear();
  await db
    .insert(schema.orderReferenceSequences)
    .values({
      year: currentYear,
      prefix: "DODOX",
      lastNumber: 0,
      updatedAt: now,
    })
    .onConflictDoNothing();

  // 8. Seed Journal Posts & Testimonials
  for (const post of seedJournal) {
    await db
      .insert(schema.journalPosts)
      .values({
        id: `jrn_${post.slug}`,
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        category: post.category,
        readTime: post.readTime,
        publishedDate: post.date,
        imageUrl: post.image,
        imageAlt: post.alt,
        featured: Boolean(post.featured),
        bodyJson: JSON.stringify(post.body),
        seoTitle: post.title,
        seoDescription: post.excerpt,
        isSample: true,
        status: "published",
        authorUserId: null,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing();
  }

  for (let tIdx = 0; tIdx < seedTestimonials.length; tIdx += 1) {
    const t = seedTestimonials[tIdx];
    await db
      .insert(schema.testimonials)
      .values({
        id: `test_${t.id}`,
        quote: t.quote,
        author: t.author,
        initials: t.initials,
        location: t.location,
        pieceName: t.piece,
        rating: 5,
        isSample: true,
        isPublished: true,
        sortOrder: tIdx + 1,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing();
  }

  // 9. Seed Homepage Sections & Banners
  const sections = [
    {
      id: "hsec_hero",
      sectionKey: "hero",
      eyebrow: "The atelier collection · Kigali",
      title: "Furniture That Makes Every Space Feel Like Home.",
      subtitle: "Handcrafted in Kigali",
      description:
        "Discover beautifully designed furniture that combines comfort, craftsmanship and contemporary living — meticulously hand-finished for modern Rwandan homes.",
      primaryCtaLabel: "Explore Collection",
      primaryCtaHref: "/shop",
      secondaryCtaLabel: "Discover Custom Atelier",
      secondaryCtaHref: "/custom-atelier",
      imageUrl: "/images/hero/hero-living-room.jpg",
      imageAlt:
        "A sculptural bouclé sofa in a warm Kigali living room overlooking green hills at dusk",
      sortOrder: 1,
    },
    {
      id: "hsec_spaces",
      sectionKey: "curated_spaces",
      eyebrow: "Shop by curated space",
      title: "Rooms composed with intention",
      subtitle: null,
      description:
        "Each environment is imagined with proportion, tactile materials and the way you actually live — browse by room to begin.",
      primaryCtaLabel: "View the full collection",
      primaryCtaHref: "/shop",
      secondaryCtaLabel: null,
      secondaryCtaHref: null,
      imageUrl: null,
      imageAlt: null,
      sortOrder: 2,
    },
    {
      id: "hsec_featured",
      sectionKey: "featured_products",
      eyebrow: "Signature pieces",
      title: "Featured Masterpieces",
      subtitle: null,
      description: null,
      primaryCtaLabel: "View all pieces",
      primaryCtaHref: "/shop",
      secondaryCtaLabel: null,
      secondaryCtaHref: null,
      imageUrl: null,
      imageAlt: null,
      sortOrder: 3,
    },
    {
      id: "hsec_atelier_promo",
      sectionKey: "atelier_promo",
      eyebrow: "Bespoke commissions · Nyarutarama Atelier",
      title: "Commission a piece drawn around your architecture.",
      subtitle: null,
      description:
        "Work directly with our Kigali designers on custom dimensions, timber selections and tailored upholstery.",
      primaryCtaLabel: "Start an Atelier Brief",
      primaryCtaHref: "/custom-atelier",
      secondaryCtaLabel: "Visit the Showroom",
      secondaryCtaHref: "/contact",
      imageUrl: "/images/editorial/atelier-promo.jpg",
      imageAlt: "DODOX bespoke atelier living room composition",
      sortOrder: 4,
    },
  ];
  for (const sec of sections) {
    await db
      .insert(schema.homepageSections)
      .values({
        ...sec,
        metadataJson: "{}",
        isPublished: true,
        updatedAt: now,
      })
      .onConflictDoNothing();
  }

  await db
    .insert(schema.banners)
    .values({
      id: "bnr_announcement_primary",
      slug: "announcement-kigali-white-glove",
      placement: "announcement",
      title: siteConfig.announcement[0],
      subtitle: "Complimentary Kigali white-glove delivery",
      ctaLabel: "Visit the Nyarutarama showroom",
      ctaHref: "/contact",
      imageUrl: null,
      themeVariant: "ink",
      startsAt: null,
      expiresAt: null,
      sortOrder: 1,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing();

  // 10. Seed Navigation Items
  for (let nIdx = 0; nIdx < primaryNav.length; nIdx += 1) {
    const nav = primaryNav[nIdx];
    const parentId = `nav_hdr_${nIdx}`;
    await db
      .insert(schema.navigationItems)
      .values({
        id: parentId,
        menuLocation: "header",
        parentId: null,
        label: nav.label,
        href: nav.href,
        description: null,
        sortOrder: nIdx + 1,
        isPublished: true,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing();

    if (nav.children) {
      for (let cIdx = 0; cIdx < nav.children.length; cIdx += 1) {
        const child = nav.children[cIdx];
        await db
          .insert(schema.navigationItems)
          .values({
            id: `${parentId}_child_${cIdx}`,
            menuLocation: "header",
            parentId,
            label: child.label,
            href: child.href,
            description: child.description ?? null,
            sortOrder: cIdx + 1,
            isPublished: true,
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoNothing();
      }
    }
  }

  const footerLocMap = [
    "footer_collections",
    "footer_services",
    "footer_house",
  ] as const;
  for (let colIdx = 0; colIdx < footerNav.length; colIdx += 1) {
    const col = footerNav[colIdx];
    const loc = footerLocMap[colIdx] ?? "footer_house";
    for (let lIdx = 0; lIdx < col.links.length; lIdx += 1) {
      const link = col.links[lIdx];
      await db
        .insert(schema.navigationItems)
        .values({
          id: `nav_${loc}_${lIdx}`,
          menuLocation: loc,
          parentId: null,
          label: link.label,
          href: link.href,
          description: null,
          sortOrder: lIdx + 1,
          isPublished: true,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing();
    }
  }

  // 11. Seed FAQs & Pages
  const seedFaqs = [
    {
      id: "faq_atelier_1",
      category: "atelier",
      question: "How long does a commission take?",
      answer:
        "Sample lead times range from two weeks for a small object to eight weeks for a full room. The atelier confirms a schedule in writing once the specification is approved.",
      sortOrder: 1,
    },
    {
      id: "faq_atelier_2",
      category: "atelier",
      question: "Do you work outside Kigali?",
      answer:
        "Regional delivery can be arranged and is quoted after reviewing the commission. Delivery and installation logistics are confirmed before production begins.",
      sortOrder: 2,
    },
    {
      id: "faq_atelier_3",
      category: "atelier",
      question: "How is payment handled?",
      answer:
        "No payment is taken through this website. The atelier concierge confirms local payment arrangements directly after reviewing your request.",
      sortOrder: 3,
    },
    {
      id: "faq_atelier_4",
      category: "atelier",
      question: "Can I supply my own fabric?",
      answer:
        "Often, yes. The atelier reviews fabric suitability for the frame and cushion construction before accepting client-supplied material.",
      sortOrder: 4,
    },
    {
      id: "faq_shipping_1",
      category: "shipping",
      question: "Kigali white-glove delivery",
      answer:
        "Includes room-of-choice placement, assembly, levelling and packaging removal across Kigali. Timing is confirmed by the concierge after order review.",
      sortOrder: 1,
    },
    {
      id: "faq_shipping_2",
      category: "shipping",
      question: "Regional delivery in Rwanda",
      answer:
        "Regional delivery is quoted separately after reviewing the order request and destination.",
      sortOrder: 2,
    },
  ];
  for (const faq of seedFaqs) {
    await db
      .insert(schema.faqs)
      .values({
        ...faq,
        isPublished: true,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing();
  }

  await db
    .insert(schema.pages)
    .values({
      id: "page_about",
      slug: "about",
      title: "A House Built Around Quiet Proportion",
      eyebrow: "The House of DODOX",
      excerpt: siteConfig.description,
      contentJson: JSON.stringify([
        {
          type: "paragraph",
          text: "DODOX Furniture designs and hand-finishes contemporary furniture for Kigali residences and hospitality spaces, focusing on solid East African timber, enduring joinery, and tactile upholstery.",
        },
      ]),
      heroImageUrl: "/images/atelier/drafting.jpg",
      seoTitle: `Our Story · ${siteConfig.name}`,
      seoDescription: siteConfig.description,
      status: "published",
      publishedAt: now,
      updatedByUserId: null,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing();

  // 12. Seed Site Settings (preserving exact placeholder contact info — no invented data)
  const initialSettings: {
    key: string;
    value: unknown;
    groupName: string;
    label: string;
    isPublic: boolean;
  }[] = [
    {
      key: "store_name",
      value: siteConfig.name,
      groupName: "general",
      label: "Store Name",
      isPublic: true,
    },
    {
      key: "logo_url",
      value: "/icon.svg",
      groupName: "general",
      label: "Brand Logo URL",
      isPublic: true,
    },
    {
      key: "contact_email",
      value: siteConfig.contact.email,
      groupName: "contact",
      label: "Concierge Email (Placeholder — verify before launch)",
      isPublic: true,
    },
    {
      key: "contact_phone",
      value: siteConfig.contact.phone,
      groupName: "contact",
      label: "Concierge Telephone (Placeholder — verify before launch)",
      isPublic: true,
    },
    {
      key: "whatsapp_number",
      value: siteConfig.contact.whatsappNumber,
      groupName: "contact",
      label: "WhatsApp Number (Digits only — verify before launch)",
      isPublic: true,
    },
    {
      key: "showroom_address",
      value: siteConfig.contact.showroomAddress,
      groupName: "contact",
      label: "Showroom Address (Placeholder — verify before launch)",
      isPublic: true,
    },
    {
      key: "showroom_hours",
      value: siteConfig.contact.showroomHours,
      groupName: "contact",
      label: "Showroom Opening Hours",
      isPublic: true,
    },
    {
      key: "social_links",
      value: siteConfig.social,
      groupName: "social",
      label: "Social Media Profiles",
      isPublic: true,
    },
    {
      key: "currency",
      value: "RWF",
      groupName: "commerce",
      label: "Store Currency (ISO 4217)",
      isPublic: true,
    },
    {
      key: "vat_config",
      value: {
        rateBps: 1800,
        pricesIncludeVat: true,
        ownerVerificationNote:
          "Default 18% (1800 bps) migrated from frontend demonstration; verify legal applicability with tax counsel before production.",
      },
      groupName: "commerce",
      label: "VAT Configuration",
      isPublic: true,
    },
    {
      key: "delivery_config",
      value: {
        kigaliWhiteGloveFee: 0,
        regionalCourierFee: 0,
        regionalQuotedAfterReview: true,
        privilegeThreshold,
        careProtectionPrice: seedCareProtection.price,
        careProtectionTitle: seedCareProtection.title,
        careProtectionDescription: seedCareProtection.description,
      },
      groupName: "commerce",
      label: "Delivery & Care Protection Settings",
      isPublic: true,
    },
    {
      key: "order_reference_prefix",
      value: "DODOX",
      groupName: "commerce",
      label: "Order Reference Prefix",
      isPublic: false,
    },
    {
      key: "seo_defaults",
      value: {
        defaultTitle: siteConfig.title,
        titleSuffix: siteConfig.name,
        defaultDescription: siteConfig.description,
        ogImage: "/images/hero/hero-living-room.jpg",
      },
      groupName: "seo",
      label: "Default SEO Metadata",
      isPublic: true,
    },
    {
      key: "announcement_banner",
      value: {
        enabled: true,
        messages: [...siteConfig.announcement],
        mobileMessage: "Complimentary Kigali white-glove delivery",
        ctaLabel: "Visit the Nyarutarama showroom",
        ctaHref: "/contact",
      },
      groupName: "content",
      label: "Top Announcement Bar",
      isPublic: true,
    },
  ];

  for (const setting of initialSettings) {
    await db
      .insert(schema.siteSettings)
      .values({
        key: setting.key,
        valueJson: JSON.stringify(setting.value),
        groupName: setting.groupName,
        label: setting.label,
        isPublic: setting.isPublic,
        updatedByUserId: null,
        updatedAt: now,
      })
      .onConflictDoNothing();
  }
}
