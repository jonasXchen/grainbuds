import type { Product } from "@/lib/types";

export const LOYALTY_REWARD_STAMPS = 10;

export const LOYALTY_DRINK_CATEGORY_SLUGS = new Set([
  "specialty-matcha",
  "matcha-refresher",
  "hojicha",
  "smoothies",
  "fruit-tea",
  "fruit-cloud",
  "tapioca-boba",
]);

export function isLoyaltyEligible(
  product: Pick<Product, "category" | "loyalty_eligible">
): boolean {
  if (typeof product.loyalty_eligible === "boolean") {
    return product.loyalty_eligible;
  }
  return Boolean(
    product.category?.slug &&
      LOYALTY_DRINK_CATEGORY_SLUGS.has(product.category.slug)
  );
}
