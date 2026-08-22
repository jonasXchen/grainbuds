import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProductForm from "@/components/admin/ProductForm";
import CategoryManager from "@/components/admin/CategoryManager";
import { getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const supabase = await createClient();
  const locale = await getLocale();
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
        {locale === "de" ? "← Alle Produkte" : "← All products"}
      </Link>
      <h1 className="mt-4 font-display text-4xl text-ink">
        {locale === "de" ? "Produkt hinzufügen" : "Add a product"}
      </h1>
      <p className="mt-2 text-ink/60">
        {locale === "de"
          ? "Füllen Sie die Details aus. Das Produkt erscheint nach dem Speichern im Shop."
          : "Fill in the details below—it appears in the shop as soon as you save."}
      </p>
      <div className="mt-8">
        <ProductForm categories={categories ?? []} />
      </div>
      <div id="categories" className="mt-16 max-w-2xl scroll-mt-8 sm:mt-20">
        <CategoryManager categories={categories ?? []} />
      </div>
    </div>
  );
}
