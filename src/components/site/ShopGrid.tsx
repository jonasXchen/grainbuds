"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Category, Product } from "@/lib/types";
import { localizedName } from "@/lib/types";
import { useLocale, useT } from "@/lib/i18n/context";
import ProductCard from "./ProductCard";

export default function ShopGrid({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const locale = useLocale();
  const t = useT();

  const usedCategories = useMemo(
    () =>
      categories.filter((category) =>
        products.some((product) => product.category_id === category.id)
      ),
    [categories, products]
  );

  const visible = useMemo(
    () =>
      activeCategory
        ? products.filter((product) => product.category_id === activeCategory)
        : products,
    [products, activeCategory]
  );

  return (
    <div>
      <div className="sticky top-[76px] z-30 -mx-5 border-y border-ink/5 bg-cream/90 py-3 backdrop-blur-md sm:top-[86px] sm:mx-0 sm:rounded-2xl sm:border">
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
        <p className="mt-16 text-center text-ink/50">{t.shop.empty}</p>
      )}
    </div>
  );
}
