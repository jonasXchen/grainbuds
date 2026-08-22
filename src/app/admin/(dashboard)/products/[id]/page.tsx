import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductForm from "@/components/admin/ProductForm";
import CategoryManager from "@/components/admin/CategoryManager";
import { safeReturnPath } from "@/lib/return-path";
import { getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string | string[] }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const returnTo = safeReturnPath(
    Array.isArray(query.returnTo) ? query.returnTo[0] : query.returnTo
  );
  const supabase = await createClient();
  const locale = await getLocale();
  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase.from("grainbuds_products").select("*").eq("id", id).maybeSingle(),
    supabase.from("grainbuds_categories").select("*").order("sort_order"),
  ]);

  if (!product) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={returnTo}
        className="text-sm font-medium text-ink/60 transition-colors hover:text-ink"
      >
        {locale === "de" ? "← Zurück" : "← Back"}
      </Link>
      <h1 className="mt-4 font-display text-4xl text-ink">
        {locale === "de" ? "Bearbeiten" : "Edit"} “{product.name}”
      </h1>
      <div className="mt-8">
        <ProductForm
          product={product}
          categories={categories ?? []}
          returnTo={returnTo}
        />
      </div>
      <div id="categories" className="mt-16 max-w-2xl scroll-mt-8 sm:mt-20">
        <CategoryManager categories={categories ?? []} />
      </div>
    </div>
  );
}
