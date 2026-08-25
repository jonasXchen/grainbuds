import type {
  Product,
  ReusableProductOptionGroup,
} from "@/lib/types";

type ProductWithOptions = Pick<
  Product,
  "id" | "name" | "name_de" | "option_groups"
>;

function groupFingerprint(group: NonNullable<Product["option_groups"]>[number]) {
  return JSON.stringify({
    name: group.name.trim().toLowerCase(),
    name_de: group.name_de?.trim().toLowerCase() ?? "",
    required: group.required,
    allow_multiple: group.allow_multiple,
    options: group.options.map((option) => ({
      name: option.name.trim().toLowerCase(),
      name_de: option.name_de?.trim().toLowerCase() ?? "",
      price_delta_cents: option.price_delta_cents,
    })),
  });
}

export function buildReusableProductOptionGroups(
  products: ProductWithOptions[],
  excludeProductId?: string
): ReusableProductOptionGroup[] {
  const seen = new Set<string>();
  const presets: ReusableProductOptionGroup[] = [];

  for (const product of products) {
    if (product.id === excludeProductId) continue;
    for (const group of product.option_groups ?? []) {
      const fingerprint = groupFingerprint(group);
      if (seen.has(fingerprint)) continue;
      seen.add(fingerprint);
      presets.push({
        key: `${product.id}:${group.id}`,
        source_name: product.name,
        source_name_de: product.name_de,
        group,
      });
    }
  }

  return presets;
}
