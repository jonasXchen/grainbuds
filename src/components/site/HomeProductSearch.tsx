"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Category, Product } from "@/lib/types";
import { localizedName } from "@/lib/types";
import { useLocale, useT } from "@/lib/i18n/context";
import { productMatchesSearch } from "@/lib/product-search";
import ProductCard from "./ProductCard";
import ShopSearchForm from "./ShopSearchForm";

export default function HomeProductSearch({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const scrollAfterCollapse = useRef(false);
  const locale = useLocale();
  const t = useT();

  useEffect(() => {
    if (expanded || !scrollAfterCollapse.current) return;
    scrollAfterCollapse.current = false;

    requestAnimationFrame(() => {
      document.getElementById("shop")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [expanded]);

  const usedCategories = useMemo(
    () =>
      categories.filter((category) =>
        products.some((product) => product.category_id === category.id)
      ),
    [categories, products]
  );

  const visible = useMemo(() => {
    if (!query.trim() && !expanded) {
      return products.filter((product) => product.is_featured).slice(0, 6);
    }

    return products.filter((product) => {
      if (activeCategory && product.category_id !== activeCategory) return false;

      const category = categories.find(
        (candidate) => candidate.id === product.category_id
      );
      return productMatchesSearch(product, query, locale, category);
    });
  }, [products, categories, query, expanded, activeCategory, locale]);

  return (
    <>
      <div className="sticky top-[71px] z-30 -mx-5 mt-8 bg-matcha-wash/90 px-5 py-4 backdrop-blur-md sm:top-[81px] sm:mx-0 sm:px-4">
        <div className="mx-auto max-w-2xl">
          <ShopSearchForm value={query} onChange={setQuery} />
        </div>

        {expanded && (
          <div className="mt-3 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex w-max snap-x snap-proximity gap-2.5 sm:w-auto sm:flex-wrap sm:justify-center">
              {[
                { id: null as string | null, name: t.shop.everything },
                ...usedCategories,
              ].map((category) => {
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
                        layoutId="home-category-pill"
                        className="absolute inset-0 rounded-full bg-ink"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                    <span className="relative">
                      {localizedName(category, locale)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <motion.div layout className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {visible.map((product, index) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <ProductCard product={product} index={index} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {visible.length === 0 && (
        <div className="mt-16 text-center text-ink/50">
          <p>{t.shop.noResults}</p>
          <button
            type="button"
            onClick={() => setQuery("")}
            className="mt-4 rounded-full border border-ink/15 px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink hover:bg-ink hover:text-cream"
          >
            {t.shop.clearSearch}
          </button>
        </div>
      )}

      <div className="mt-12 text-center">
        <button
          type="button"
          onClick={() => {
            if (expanded) {
              scrollAfterCollapse.current = true;
              setQuery("");
              setExpanded(false);
            } else {
              setExpanded(true);
            }
            setActiveCategory(null);
          }}
          aria-expanded={expanded}
          className="group inline-flex items-center gap-2 rounded-full border border-ink/20 px-8 py-4 text-sm font-medium text-ink transition-all duration-300 hover:border-ink hover:bg-ink hover:text-cream"
        >
          {expanded ? t.featured.showFavorites : t.featured.browseAll}
          <span
            className={`transition-transform duration-300 ${
              expanded ? "rotate-180" : "group-hover:translate-y-0.5"
            }`}
          >
            ↓
          </span>
        </button>
      </div>
    </>
  );
}
