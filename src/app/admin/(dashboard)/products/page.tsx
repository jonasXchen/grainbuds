import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, type Category, type Product } from "@/lib/types";
import ProductImage from "@/components/site/ProductImage";
import ProductRowActions from "@/components/admin/ProductRowActions";
import CategoryManager from "@/components/admin/CategoryManager";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const supabase = await createClient();
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
          <h1 className="font-display text-4xl text-ink">Products</h1>
          <p className="mt-2 text-ink/60">
            Everything shown in the online shop. Changes go live right away.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-cream transition-colors hover:bg-matcha-deep"
        >
          + Add a product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="mt-10 rounded-3xl bg-cream-light p-10 text-center">
          <p className="font-display text-2xl text-ink">No products yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink/55">
            Add your first drink or dish — or run the seed script in the README
            to start with the sample menu.
          </p>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-ink/8 overflow-hidden rounded-3xl bg-cream-light">
          {products.map((product) => (
            <li
              key={product.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 transition-colors hover:bg-matcha/8"
            >
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                <ProductImage product={product} className="h-full w-full" />
              </div>
              <div className="min-w-32 flex-1">
                <Link
                  href={`/admin/products/${product.id}`}
                  className="block truncate text-sm font-medium text-ink hover:text-matcha-deep"
                >
                  {product.name}
                </Link>
                <p className="text-xs text-ink/50">
                  {product.category?.name ?? "Uncategorized"} ·{" "}
                  {formatPrice(product.price_cents)}
                  {product.is_featured && " · ★ favorite"}
                </p>
              </div>
              <Link
                href={`/admin/products/${product.id}`}
                className="hidden rounded-full border border-ink/15 px-4 py-1.5 text-xs font-medium text-ink/70 transition-colors hover:border-ink hover:text-ink sm:block"
              >
                Edit
              </Link>
              <ProductRowActions product={product} />
            </li>
          ))}
        </ul>
      )}

      <div className="mt-10">
        <CategoryManager categories={categories} />
      </div>
    </div>
  );
}
