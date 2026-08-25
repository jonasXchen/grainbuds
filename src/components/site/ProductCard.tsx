"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Product } from "@/lib/types";
import {
  formatPrice,
  isSoldOut,
  localizedDescription,
  localizedName,
} from "@/lib/types";
import { useLocale, useT } from "@/lib/i18n/context";
import { useAdminMode } from "@/lib/admin-mode-context";
import { useCart } from "@/lib/cart-context";
import ProductImage from "./ProductImage";
import AdminCardControls from "./AdminCardControls";

export default function ProductCard({
  product,
  index = 0,
}: {
  product: Product;
  index?: number;
}) {
  const locale = useLocale();
  const t = useT();
  const adminMode = useAdminMode();
  const { addItem, lines, setQuantity } = useCart();
  const soldOut = isSoldOut(product);
  const cartQuantity =
    lines.find((line) => line.product.id === product.id)?.quantity ?? 0;
  const atStockLimit =
    product.stock != null && cartQuantity >= product.stock;
  const canAdd = !soldOut && !atStockLimit;
  const productName = localizedName(product, locale);

  const addProduct = () => {
    if (canAdd) addItem(product, 1, { openCart: false });
  };

  return (
    <motion.article
      id={`product-${product.id}`}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.7,
        delay: (index % 4) * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={canAdd ? { y: -6 } : undefined}
      whileTap={canAdd ? { scale: 0.985 } : undefined}
      role="button"
      tabIndex={canAdd ? 0 : -1}
      aria-label={`${productName}: ${t.shop.addToOrder}`}
      aria-disabled={!canAdd}
      onClick={(event) => {
        if (
          event.target instanceof Element &&
          event.target.closest("a, button, input, select, textarea, form")
        ) {
          return;
        }
        addProduct();
      }}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          addProduct();
        }
      }}
      className={`group scroll-mt-28 flex flex-col rounded-3xl bg-cream-light p-3 shadow-[0_1px_0_rgba(18,26,37,0.06)] outline-none transition-all duration-500 focus-visible:ring-2 focus-visible:ring-matcha-deep focus-visible:ring-offset-2 focus-visible:ring-offset-cream hover:shadow-[0_20px_50px_-24px_rgba(18,26,37,0.35)] ${
        canAdd ? "cursor-pointer" : "cursor-default"
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
        <ProductImage product={product} className="h-full w-full" />
        {adminMode && !product.is_active && (
          <span className="absolute inset-0 flex items-center justify-center bg-cream/60 backdrop-blur-[2px]">
            <span className="rounded-full bg-ink px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-cream">
              Hidden
            </span>
          </span>
        )}
        {soldOut && (
          <span className="absolute right-3 top-3 rounded-full bg-ink/85 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-cream backdrop-blur">
            {t.shop.soldOut}
          </span>
        )}
        {product.is_featured && (
          <span className="absolute left-3 top-3 rounded-full bg-cream/90 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-matcha-deep backdrop-blur">
            {t.featured.favorite}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col px-2 pb-2 pt-4">
        {product.category && (
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-sand-deep">
            {localizedName(product.category, locale)}
          </p>
        )}
        <h3 className="mt-1 font-display text-xl text-ink transition-colors duration-300 group-hover:text-matcha-deep">
          {productName}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink/60">
          {localizedDescription(product, locale)}
        </p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="font-display text-lg text-ink">
            {formatPrice(product.price_cents, locale)}
          </span>
          {cartQuantity > 0 ? (
            <div className="flex h-9 items-center rounded-full bg-matcha-deep px-1 text-cream">
              <button
                type="button"
                onClick={() => setQuantity(product.id, cartQuantity - 1)}
                aria-label={t.product.decrease}
                className="grid h-7 w-7 place-items-center rounded-full text-base transition-colors hover:bg-cream/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/60"
              >
                −
              </button>
              <span
                aria-live="polite"
                className="min-w-7 text-center text-sm font-semibold tabular-nums"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={cartQuantity}
                    initial={{ scale: 0.65, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.65, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="inline-block"
                  >
                    {cartQuantity}
                    <span className="sr-only"> {t.shop.inOrder}</span>
                  </motion.span>
                </AnimatePresence>
              </span>
              <button
                type="button"
                onClick={() => addProduct()}
                disabled={atStockLimit}
                aria-label={t.product.increase}
                className="grid h-7 w-7 place-items-center rounded-full text-base transition-colors hover:bg-cream/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/60 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent"
              >
                +
              </button>
            </div>
          ) : (
            <span
              className={`grid h-9 min-w-9 place-items-center rounded-full px-2 text-sm font-semibold transition-colors ${
                soldOut
                  ? "bg-ink/8 text-ink/35"
                  : "border border-ink/15 text-ink/55 group-hover:border-matcha-deep group-hover:text-matcha-deep"
              }`}
            >
              {soldOut ? "–" : "+"}
            </span>
          )}
        </div>
        {adminMode && <AdminCardControls product={product} />}
      </div>
    </motion.article>
  );
}
