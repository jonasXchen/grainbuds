import { createClient, hasSupabaseEnv } from "./supabase/server";
import { seedCategories, seedProducts } from "./seed-data";
import type { Category, Product } from "./types";

/**
 * Read-side data layer. Falls back to the local seed catalog when Supabase
 * env vars aren't set, so the site can be previewed before the database
 * is connected.
 */

export async function getCategories(): Promise<Category[]> {
  if (!hasSupabaseEnv()) return seedCategories;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("grainbuds_categories")
    .select("*")
    .order("sort_order");
  if (error || !data) return seedCategories;
  return data;
}

export async function getProducts(opts?: {
  featuredOnly?: boolean;
  categorySlug?: string;
  /** Staff view: also return hidden products (RLS only allows this for
   *  authenticated sessions — anonymous requests still get active only). */
  includeInactive?: boolean;
}): Promise<Product[]> {
  if (!hasSupabaseEnv()) {
    let items = seedProducts.filter((product) => product.is_active);
    if (opts?.featuredOnly) items = items.filter((product) => product.is_featured);
    if (opts?.categorySlug)
      items = items.filter(
        (product) => product.category?.slug === opts.categorySlug
      );
    return items;
  }

  const supabase = await createClient();
  let query = supabase
    .from("grainbuds_products")
    .select("*, category:grainbuds_categories(*)")
    .order("sort_order");
  if (!opts?.includeInactive) query = query.eq("is_active", true);
  if (opts?.featuredOnly) query = query.eq("is_featured", true);
  const { data, error } = await query;
  if (error || !data) return [];
  if (opts?.categorySlug)
    return data.filter(
      (product: Product) => product.category?.slug === opts.categorySlug
    );
  return data;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!hasSupabaseEnv()) {
    return seedProducts.find((product) => product.slug === slug) ?? null;
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("grainbuds_products")
    .select("*, category:grainbuds_categories(*)")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  return data ?? null;
}
