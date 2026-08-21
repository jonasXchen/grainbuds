import type { Metadata } from "next";
import { getCategories, getProducts } from "@/lib/data";
import ShopGrid from "@/components/site/ShopGrid";
import Reveal from "@/components/site/Reveal";

export const metadata: Metadata = {
  title: "Shop & Menu",
  description:
    "Order matcha, grain bowls, pastries, and brew-at-home kits for pickup at Grainbuds.",
};

export const revalidate = 60;

export default async function ShopPage() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);

  return (
    <div className="px-5 pb-28 pt-36 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-matcha-deep">
            Shop &amp; menu
          </p>
          <h1 className="mt-3 font-display text-5xl leading-tight text-ink sm:text-6xl">
            Order ahead,
            <br />
            arrive to a warm cup
          </h1>
          <p className="mt-5 text-base leading-relaxed text-ink/60">
            Everything below is made in-house. Place your order online and pay
            at the counter when you pick up.
          </p>
        </Reveal>

        <div className="mt-14">
          <ShopGrid products={products} categories={categories} />
        </div>
      </div>
    </div>
  );
}
