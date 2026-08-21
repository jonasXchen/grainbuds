"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Product } from "@/lib/types";
import {
  formatPrice,
  localizedDescription,
  localizedName,
} from "@/lib/types";
import { useLocale, useT } from "@/lib/i18n/context";
import ProductImage from "./ProductImage";
import AddToCartButton from "./AddToCartButton";

export default function ProductCard({
  product,
  index = 0,
}: {
  product: Product;
  index?: number;
}) {
  const locale = useLocale();
  const t = useT();

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.7,
        delay: (index % 4) * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -6 }}
      className="group flex flex-col rounded-3xl bg-cream-light p-3 shadow-[0_1px_0_rgba(18,26,37,0.06)] transition-shadow duration-500 hover:shadow-[0_20px_50px_-24px_rgba(18,26,37,0.35)]"
    >
      <Link
        href={`/shop/${product.slug}`}
        className="relative block aspect-[4/3] overflow-hidden rounded-2xl"
      >
        <ProductImage product={product} className="h-full w-full" />
        {product.is_featured && (
          <span className="absolute left-3 top-3 rounded-full bg-cream/90 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-matcha-deep backdrop-blur">
            {t.featured.favorite}
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col px-2 pb-2 pt-4">
        {product.category && (
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-sand-deep">
            {localizedName(product.category, locale)}
          </p>
        )}
        <Link href={`/shop/${product.slug}`} className="mt-1">
          <h3 className="font-display text-xl text-ink transition-colors duration-300 group-hover:text-matcha-deep">
            {localizedName(product, locale)}
          </h3>
        </Link>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink/60">
          {localizedDescription(product, locale)}
        </p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="font-display text-lg text-ink">
            {formatPrice(product.price_cents, locale)}
          </span>
          <AddToCartButton product={product} size="sm" />
        </div>
      </div>
    </motion.article>
  );
}
