import type { Metadata } from "next";
import { getCategories, getProducts } from "@/lib/data";
import { getT } from "@/lib/i18n/server";
import { getViewMode } from "@/lib/staff";
import ShopGrid from "@/components/site/ShopGrid";
import Reveal from "@/components/site/Reveal";
import OrderingContextBanner from "@/components/site/OrderingContextBanner";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getT();
  return locale === "de"
    ? {
        title: "Shop & Bestellen",
        description:
          "Matcha-Pulver, Boba, Sushi, Getränke und mehr bei Grainbuds in Erlangen entdecken und bestellen.",
      }
    : {
        title: "Shop & Order",
        description:
          "Discover and order matcha powder, boba, sushi, drinks, and more from Grainbuds in Erlangen.",
      };
}

export default async function ShopPage() {
  // Staff see hidden products too (with a "Hidden" overlay and inline
  // controls) — unless they toggled "view as customer" in the staff pill.
  const { adminMode } = await getViewMode();
  const [products, categories, { t }] = await Promise.all([
    getProducts({ includeInactive: adminMode }),
    getCategories(),
    getT(),
  ]);

  return (
    <div className="min-h-dvh bg-matcha/10 px-5 pb-28 pt-36 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <OrderingContextBanner />
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-matcha-deep">
            {t.shop.eyebrow}
          </p>
          <h1 className="mt-3 font-display text-5xl leading-tight text-ink sm:text-6xl">
            {t.shop.titleA}
            <br />
            {t.shop.titleB}
          </h1>
          <p className="mt-5 text-base leading-relaxed text-ink/60">
            {t.shop.sub}
          </p>
        </Reveal>

        <div className="mt-14">
          <ShopGrid products={products} categories={categories} />
        </div>
      </div>
    </div>
  );
}
