"use client";

import { useTransition } from "react";
import {
  adjustStock,
  deleteProduct,
  toggleProductActive,
} from "@/lib/actions/admin";
import type { Product } from "@/lib/types";

export default function ProductRowActions({ product }: { product: Product }) {
  const [isPending, startTransition] = useTransition();

  function changeStock(delta: number) {
    startTransition(async () => {
      const form = new FormData();
      form.set("id", product.id);
      form.set("delta", String(delta));
      await adjustStock(form);
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {product.stock != null && (
        <span
          className={`flex items-center gap-1 rounded-full border px-1.5 py-1 text-xs font-medium ${
            product.stock === 0
              ? "border-red-200 bg-red-50 text-red-500"
              : "border-ink/15 bg-white text-ink/70"
          }`}
          title="Stock on hand — counts down with each order"
        >
          <button
            type="button"
            disabled={isPending || product.stock === 0}
            onClick={() => changeStock(-1)}
            className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-ink/10 disabled:opacity-40"
            aria-label="Decrease stock"
          >
            −
          </button>
          <span className="w-7 text-center tabular-nums">{product.stock}</span>
          <button
            type="button"
            disabled={isPending}
            onClick={() => changeStock(1)}
            className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-ink/10 disabled:opacity-40"
            aria-label="Increase stock"
          >
            +
          </button>
        </span>
      )}
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const form = new FormData();
            form.set("id", product.id);
            form.set("next", String(!product.is_active));
            await toggleProductActive(form);
          })
        }
        className={`min-h-8 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
          product.is_active
            ? "bg-matcha/25 text-matcha-deep hover:bg-matcha/40"
            : "bg-ink/8 text-ink/50 hover:bg-ink/15"
        }`}
        title={product.is_active ? "Click to hide from shop" : "Click to show in shop"}
      >
        {product.is_active ? "Live" : "Hidden"}
      </button>
      <form
        action={deleteProduct}
        onSubmit={(event) => {
          if (
            !confirm(
              `Delete “${product.name}” permanently? If you just want to take it off the shop, use Live/Hidden instead.`
            )
          ) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="id" value={product.id} />
        <button
          type="submit"
          className="min-h-8 rounded-full px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
        >
          Delete
        </button>
      </form>
    </div>
  );
}
