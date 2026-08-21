"use client";

import { useTransition } from "react";
import { deleteProduct, toggleProductActive } from "@/lib/actions/admin";
import type { Product } from "@/lib/types";

export default function ProductRowActions({ product }: { product: Product }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
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
        className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
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
          className="rounded-full px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
        >
          Delete
        </button>
      </form>
    </div>
  );
}
