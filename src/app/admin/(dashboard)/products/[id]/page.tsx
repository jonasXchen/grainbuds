import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductForm from "@/components/admin/ProductForm";
import CategoryManager from "@/components/admin/CategoryManager";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase.from("grainbuds_products").select("*").eq("id", id).maybeSingle(),
    supabase.from("grainbuds_categories").select("*").order("sort_order"),
  ]);

  if (!product) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/admin/products"
        className="text-sm font-medium text-ink/60 transition-colors hover:text-ink"
      >
        ← All products
      </Link>
      <h1 className="mt-4 font-display text-4xl text-ink">
        Edit “{product.name}”
      </h1>
      <div className="mt-8">
        <ProductForm product={product} categories={categories ?? []} />
      </div>
      <div id="categories" className="mt-16 max-w-2xl scroll-mt-8 sm:mt-20">
        <CategoryManager categories={categories ?? []} />
      </div>
    </div>
  );
}
