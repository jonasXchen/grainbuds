import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  formatPrice,
  localizedName,
  type Category,
  type Product,
} from "@/lib/types";
import ProductImage from "@/components/site/ProductImage";
import ProductRowActions from "@/components/admin/ProductRowActions";
import CategoryManager from "@/components/admin/CategoryManager";
import { getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const locale = await getLocale();
  const copy = locale === "de"
    ? { title: "Produkte", description: "Alle Inhalte des Online-Shops. Änderungen werden sofort veröffentlicht.", categories: "Kategorien verwalten", add: "+ Produkt hinzufügen", emptyTitle: "Noch keine Produkte", empty: "Fügen Sie das erste Getränk oder Gericht hinzu oder laden Sie das Beispielmenü aus der README.", uncategorized: "Ohne Kategorie", favorite: "Favorit", edit: "Bearbeiten" }
    : { title: "Products", description: "Everything shown in the online shop. Changes go live right away.", categories: "Manage categories", add: "+ Add a product", emptyTitle: "No products yet", empty: "Add your first drink or dish, or run the seed script in the README to start with the sample menu.", uncategorized: "Uncategorized", favorite: "favorite", edit: "Edit" };
  const [productsRes, categoriesRes] = await Promise.all([
    supabase
      .from("grainbuds_products")
      .select("*, category:grainbuds_categories(*)")
      .order("sort_order"),
    supabase.from("grainbuds_categories").select("*").order("sort_order"),
  ]);

  const products: Product[] = productsRes.data ?? [];
  const categories: Category[] = categoriesRes.data ?? [];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-ink">{copy.title}</h1>
          <p className="mt-2 text-ink/60">
            {copy.description}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="#categories"
            className="rounded-full border border-ink/15 px-5 py-3 text-sm font-medium text-ink/70 transition-colors hover:border-ink hover:text-ink"
          >
            {copy.categories}
          </Link>
          <Link
            href="/admin/products/new"
            className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-cream transition-colors hover:bg-matcha-deep"
          >
            {copy.add}
          </Link>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="mt-10 rounded-3xl bg-cream-light p-10 text-center">
          <p className="font-display text-2xl text-ink">{copy.emptyTitle}</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink/55">
            {copy.empty}
          </p>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-ink/8 overflow-hidden rounded-3xl bg-cream-light">
          {products.map((product) => (
            <li
              key={product.id}
              id={`product-${product.id}`}
              className="scroll-mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 transition-colors hover:bg-matcha/8"
            >
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                <ProductImage product={product} className="h-full w-full" />
              </div>
              <div className="min-w-32 flex-1">
                <Link
                  href={`/admin/products/${product.id}?returnTo=${encodeURIComponent(`/admin/products#product-${product.id}`)}`}
                  className="block truncate text-sm font-medium text-ink hover:text-matcha-deep"
                >
                  {localizedName(product, locale)}
                </Link>
                <p className="text-xs text-ink/50">
                  {product.category
                    ? localizedName(product.category, locale)
                    : copy.uncategorized} ·{" "}
                  {formatPrice(product.price_cents)}
                  {product.is_featured && ` · ★ ${copy.favorite}`}
                </p>
              </div>
              <Link
                href={`/admin/products/${product.id}?returnTo=${encodeURIComponent(`/admin/products#product-${product.id}`)}`}
                className="hidden rounded-full border border-ink/15 px-4 py-1.5 text-xs font-medium text-ink/70 transition-colors hover:border-ink hover:text-ink sm:block"
              >
                {copy.edit}
              </Link>
              <ProductRowActions product={product} />
            </li>
          ))}
        </ul>
      )}

      <div id="categories" className="mt-16 scroll-mt-8 sm:mt-20">
        <CategoryManager categories={categories} />
      </div>
    </div>
  );
}
