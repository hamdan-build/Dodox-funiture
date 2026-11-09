import { careProtection as careProtectionConfig, demoPromoCodes } from "@/data/site";
import type {
  AppliedPromo,
  CartItem,
  CartTotals,
  Product,
  PromoCode,
  SelectedVariant,
} from "@/types";

export const VAT_RATE = 0.18;

export const defaultSelections = (product: Product): Record<string, string> =>
  Object.fromEntries(
    product.variants.map((group) => [group.id, group.options[0]?.id ?? ""]),
  );

export const resolveSelections = (
  product: Product,
  selectionIds: Record<string, string>,
): SelectedVariant[] =>
  product.variants.map((group) => {
    const option =
      group.options.find((candidate) => candidate.id === selectionIds[group.id]) ??
      group.options[0];
    return {
      groupId: group.id,
      groupLabel: group.label,
      optionId: option.id,
      optionLabel: option.label,
      priceDelta: option.priceDelta,
    };
  });

export const unitPriceFor = (
  product: Product,
  selections: SelectedVariant[],
): number =>
  product.price +
  selections.reduce((total, selection) => total + selection.priceDelta, 0);

export const variantSummary = (selections: SelectedVariant[]) =>
  selections.map((selection) => selection.optionLabel).join(" · ");

export const cartKey = (productId: string, selections: SelectedVariant[]) =>
  [
    productId,
    ...selections.map(
      (selection) => `${selection.groupId}:${selection.optionId}`,
    ),
  ].join("|");

export const cartSubtotal = (items: CartItem[]) =>
  items.reduce((total, item) => total + item.unitPrice * item.quantity, 0);

export const cartItemCount = (items: CartItem[]) =>
  items.reduce((total, item) => total + item.quantity, 0);

export const findPromoCode = (code: string): PromoCode | undefined =>
  demoPromoCodes.find(
    (promo) => promo.code.toLowerCase() === code.trim().toLowerCase(),
  );

export const computeDiscount = (
  code: string | null,
  subtotal: number,
): AppliedPromo | null => {
  if (!code) return null;
  const promo = findPromoCode(code);
  if (!promo) return null;
  if (promo.minimumSubtotal && subtotal < promo.minimumSubtotal) return null;
  const raw =
    promo.type === "fixed"
      ? Math.min(promo.value, subtotal)
      : Math.round((subtotal * promo.value) / 100);
  return {
    code: promo.code,
    label: promo.label,
    amount: Math.min(raw, subtotal),
  };
};

export const computeTotals = ({
  items,
  promoCode,
  careProtection,
}: {
  items: CartItem[];
  promoCode: string | null;
  careProtection: boolean;
}): CartTotals => {
  const subtotal = cartSubtotal(items);
  const discount = computeDiscount(promoCode, subtotal)?.amount ?? 0;
  const care = careProtection && items.length > 0 ? careProtectionConfig.price : 0;
  const logistics = 0;
  const total = Math.max(0, subtotal - discount + care + logistics);
  const vatIncluded = Math.round((total * VAT_RATE) / (1 + VAT_RATE));

  return {
    itemCount: cartItemCount(items),
    subtotal,
    discount,
    careProtection: care,
    logistics,
    total,
    vatIncluded,
    savings: discount,
  };
};
