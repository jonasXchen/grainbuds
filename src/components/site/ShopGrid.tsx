"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Category, Product } from "@/lib/types";
import { localizedDescription, localizedName } from "@/lib/types";
import { useLocale, useT } from "@/lib/i18n/context";
import ProductCard from "./ProductCard";
import ShopSearchForm from "./ShopSearchForm";

export default function ShopGrid({
  products,
  categories,
  initialQuery = "",
}: {
  products: Product[];
  categories: Category[];
  initialQuery?: string;
}) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [query, setQuery] = useState(initialQuery);
  const locale = useLocale();
  const t = useT();

  const usedCategories = useMemo(
    () =>
      categories.filter((category) =>
        products.some((product) => product.category_id === category.id)
      ),
    [categories, products]
  );

  const visible = useMemo(() => {
    const normalizedQuery = query
      .trim()
      .toLocaleLowerCase(locale === "de" ? "de-DE" : "en")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    return products.filter((product) => {
      if (activeCategory && product.category_id !== activeCategory) return false;
      if (!normalizedQuery) return true;

      const category = categories.find(
        (candidate) => candidate.id === product.category_id
      );
      const searchableText = [
        localizedName(product, locale),
        localizedDescription(product, locale),
        product.name,
        product.name_de,
        product.description,
        product.description_de,
        category ? localizedName(category, locale) : "",
        category?.name,
        category?.name_de,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase(locale === "de" ? "de-DE" : "en")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      return searchableText.includes(normalizedQuery);
    });
  }, [products, categories, activeCategory, query, locale]);

  return (
    <div>
      <div className="mx-auto mb-8 max-w-2xl">
        <ShopSearchForm value={query} onChange={setQuery} />
      </div>

      <div className="sticky top-[71px] z-30 -mx-5 bg-[#e2decc]/90 pb-3 pt-4 backdrop-blur-md sm:top-[81px] sm:mx-0">
        <div className="overflow-x-auto overscroll-x-contain px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:overflow-visible sm:px-4">
          <div className="flex w-max snap-x snap-proximity gap-2.5 sm:w-auto sm:flex-wrap sm:justify-center">
            {[
              { id: null as string | null, name: t.shop.everything },
              ...usedCategories,
            ].map(
              (category) => {
                const isActive = activeCategory === category.id;
                return (
                  <button
                    key={category.id ?? "all"}
                    type="button"
                    onClick={(event) => {
                      setActiveCategory(category.id);
                      event.currentTarget.scrollIntoView({
                        behavior: "smooth",
                        block: "nearest",
                        inline: "center",
                      });
                    }}
                    aria-pressed={isActive}
                    className={`relative shrink-0 snap-start whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-medium transition-colors duration-300 ${
                      isActive
                        ? "text-cream"
                        : "text-ink/60 hover:bg-ink/5 hover:text-ink"
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="category-pill"
                        className="absolute inset-0 rounded-full bg-ink"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                    <span className="relative">
                      {localizedName(category, locale)}
                    </span>
                  </button>
                );
              }
            )}
          </div>
        </div>
      </div>

      <motion.div layout className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {visible.map((product, i) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <ProductCard product={product} index={i} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {visible.length === 0 && (
        <div className="mt-16 text-center text-ink/50">
          <p>{query.trim() ? t.shop.noResults : t.shop.empty}</p>
          {query.trim() && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="mt-4 rounded-full border border-ink/15 px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink hover:bg-ink hover:text-cream"
            >
              {t.shop.clearSearch}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
