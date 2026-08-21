"use client";

import { useState } from "react";
import { isSoldOut, type Product } from "@/lib/types";
import { useT } from "@/lib/i18n/context";
import AddToCartButton from "./AddToCartButton";

export default function ProductPurchase({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const t = useT();

  if (isSoldOut(product)) {
    return <AddToCartButton product={product} size="lg" />;
  }

  const maxQuantity =
    product.stock != null ? Math.min(20, product.stock) : 20;

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-1 rounded-full border border-ink/15 bg-cream-light px-2 py-1">
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink"
          aria-label={t.product.decrease}
        >
          −
        </button>
        <span className="w-8 text-center font-medium">{quantity}</span>
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink"
          aria-label={t.product.increase}
        >
          +
        </button>
      </div>
      <AddToCartButton product={product} quantity={quantity} size="lg" />
      {product.stock != null && product.stock <= 5 && (
        <span className="text-sm font-medium text-sand-deep">
          {product.stock} {t.shop.fewLeft}
        </span>
      )}
    </div>
  );
}
