import type { Metadata } from "next";
import { getCategories, getProducts } from "@/lib/data";
import { getT } from "@/lib/i18n/server";
import ShopGrid from "@/components/site/ShopGrid";
import Reveal from "@/components/site/Reveal";

export const metadata: Metadata = {
  title: "Shop & Menu",
  description:
    "Order matcha, boba, sushi, and smoothies for pickup at Grainbuds in Erlangen.",
};

export default async function ShopPage() {
  const [products, categories, { t }] = await Promise.all([
    getProducts(),
    getCategories(),
    getT(),
  ]);

  return (
    <div className="px-5 pb-28 pt-36 sm:px-8">
      <div className="mx-auto max-w-6xl">
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
