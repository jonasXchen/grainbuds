import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle(),
    supabase.from("categories").select("*").order("sort_order"),
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
    </div>
  );
}
