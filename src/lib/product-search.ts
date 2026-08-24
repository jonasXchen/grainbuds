import type { Category, Locale, Product } from "@/lib/types";

function normalizeSearchText(value: string, locale: Locale): string {
  return value
    .trim()
    .toLocaleLowerCase(locale === "de" ? "de-DE" : "en")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function productMatchesSearch(
  product: Product,
  query: string,
  locale: Locale,
  category: Category | null | undefined = product.category
): boolean {
  const normalizedQuery = normalizeSearchText(query, locale);
  if (!normalizedQuery) return true;

  const searchableText = [
    product.name,
    product.name_de,
    product.description,
    product.description_de,
    category?.name,
    category?.name_de,
  ]
    .filter(Boolean)
    .join(" ");

  return normalizeSearchText(searchableText, locale).includes(normalizedQuery);
}
