import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("grainbuds_categories")
    .select("*")
    .order("sort_order");

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/admin/products"
        className="text-sm font-medium text-ink/60 transition-colors hover:text-ink"
      >
        ← All products
      </Link>
      <h1 className="mt-4 font-display text-4xl text-ink">Add a product</h1>
      <p className="mt-2 text-ink/60">
        Fill in the details below — it appears in the shop as soon as you save.
      </p>
      <div className="mt-8">
        <ProductForm categories={categories ?? []} />
      </div>
    </div>
  );
}
