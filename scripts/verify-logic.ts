import assert from "node:assert/strict";
import { productMap, products, searchProducts, materialFacets, getRelatedProducts } from "../data/products";
import { buildCartItem } from "../lib/cart";
import { defaultSelections, resolveSelections, unitPriceFor, computeTotals, computeDiscount, variantSummary } from "../lib/pricing";
import { filterProducts, parseCatalogSearchParams, activeFilterCount } from "../lib/catalog";

// --- Product data integrity ---
const slugs = new Set<string>();
for (const p of products) {
  assert.ok(!slugs.has(p.slug), `duplicate slug ${p.slug}`);
  slugs.add(p.slug);
  assert.ok(p.images.length > 0 && p.images.every(i => i.src.startsWith("/images/")), `${p.slug} images`);
  assert.ok(p.price > 0, `${p.slug} price`);
  assert.ok(p.variants.length > 0, `${p.slug} variants`);
  assert.ok(p.dimensions.length > 0, `${p.slug} dimensions`);
}
console.log(`catalogue: ${products.length} products OK`);

// --- Variant pricing ---
const sofa = productMap["imanzi-sculptural-boucle-sofa"];
const defaults = defaultSelections(sofa);
const baseSel = resolveSelections(sofa, defaults);
assert.equal(unitPriceFor(sofa, baseSel), 1450000);
const expensive = resolveSelections(sofa, { ...defaults, configuration: "l-sectional", plinth: "brushed-brass", upholstery: "volcanic-ash" });
assert.equal(unitPriceFor(sofa, expensive), 1450000 + 700000 + 140000 + 45000);
const cartItem = buildCartItem(sofa, { ...defaults, configuration: "four-seater" }, 2);
assert.equal(cartItem.unitPrice, 1800000);
assert.equal(cartItem.quantity, 2);
assert.ok(variantSummary(baseSel).includes("3-Seater"));
assert.equal(buildCartItem(sofa).key, buildCartItem(sofa).key);
console.log("variant pricing + cart keys OK");

// --- Promo codes ---
const totalsBase = computeTotals({ items: [cartItem], promoCode: null, careProtection: false });
assert.equal(totalsBase.subtotal, 3600000);
assert.equal(totalsBase.total, 3600000);
assert.equal(totalsBase.vatIncluded, Math.round(3600000 * 18 / 118));
const fixed = computeDiscount("welcomekigali", 3600000);
assert.equal(fixed?.amount, 100000);
const percent = computeDiscount("ATELIER10", 1000000);
assert.equal(percent?.amount, 100000);
assert.equal(computeDiscount("WELCOMEKIGALI", 400000), null); // below minimum
assert.equal(computeDiscount("BOGUS", 3600000), null);
const withPromo = computeTotals({ items: [cartItem], promoCode: "ATELIER10", careProtection: true });
assert.equal(withPromo.discount, 360000);
assert.equal(withPromo.careProtection, 65000);
assert.equal(withPromo.total, 3600000 - 360000 + 65000);
assert.equal(computeTotals({ items: [], promoCode: "ATELIER10", careProtection: true }).total, 0);
console.log("promotions + VAT totals OK");

// --- Filters / sorting ---
const parsed = parseCatalogSearchParams({ category: "living-room", material: "Bouclé,Linen", availability: "in-stock", min: "100000", sort: "price-asc", q: "sofa" });
assert.equal(parsed.category, "living-room");
assert.deepEqual(parsed.materials, ["Bouclé", "Linen"]);
assert.equal(parsed.sort, "price-asc");
assert.equal(parsed.minPrice, 100000);
const living = filterProducts(products, { ...parseCatalogSearchParams({}), category: "living-room" });
assert.ok(living.length > 0 && living.every(p => p.category === "living-room"));
const inStock = filterProducts(products, { ...parseCatalogSearchParams({}), availability: ["in-stock"] });
assert.ok(inStock.every(p => p.availability === "in-stock"));
const cheap = filterProducts(products, { ...parseCatalogSearchParams({}), maxPrice: 400000 });
assert.ok(cheap.every(p => p.price <= 400000));
const priced = filterProducts(products, { ...parseCatalogSearchParams({}), sort: "price-asc" });
assert.deepEqual(priced.map(p => p.price), [...priced.map(p => p.price)].sort((a,b)=>a-b));
const nameSorted = filterProducts(products, { ...parseCatalogSearchParams({}), sort: "name-asc" });
assert.equal(nameSorted[0].name, [...products].sort((a,b)=>a.name.localeCompare(b.name))[0].name);
assert.ok(activeFilterCount({ ...parseCatalogSearchParams({}), category: "bedroom", materials: ["Linen"] }) >= 2);
console.log(`filters OK (${materialFacets.length} materials, ${living.length} living room pieces)`);

// --- Search + related ---
assert.ok(searchProducts("bouclé").length > 0);
assert.ok(searchProducts("Kigali oak")[0].slug === "kigali-oak-coffee-table");
assert.equal(searchProducts("zzzzz").length, 0);
const related = getRelatedProducts(sofa, 4);
assert.equal(related.length, 4);
assert.ok(!related.some(p => p.slug === sofa.slug));
console.log("search + related products OK");

async function main() {
  const { installTestCloudflareEnv } = await import("../tests/helpers/sqlite-d1");
  const { createOrderRequest, lookupOrderForCustomer } = await import(
    "../lib/server/services/order.service"
  );
  installTestCloudflareEnv();

  const order = await createOrderRequest({
    customer: {
      firstName: "Test",
      lastName: "Client",
      email: "test@example.com",
      phone: "+250 788 111 222",
      city: "Kigali",
      district: "Gasabo",
      address: "12 Test Road",
      deliveryMethod: "kigali-white-glove",
    },
    lines: [{ slug: sofa.slug, quantity: 1, selections: [] }],
    careProtection: true,
    promoCode: "ATELIER10",
  });
  assert.match(order.reference, /^DODOX-\d{4}-\d{6}$/);
  assert.equal(order.status, "received");
  assert.ok(
    await lookupOrderForCustomer({
      reference: order.reference.toLowerCase(),
      contact: "TEST@example.com",
    }),
  );
  assert.ok(
    await lookupOrderForCustomer({
      reference: order.reference,
      contact: "+250788111222",
    }),
  );
  assert.equal(
    await lookupOrderForCustomer({
      reference: order.reference,
      contact: "other@example.com",
    }),
    null,
  );
  console.log(`D1 order request flow OK (${order.reference})`);

  console.log("\nALL LOGIC CHECKS PASSED");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
