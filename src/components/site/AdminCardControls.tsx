"use client";

import Link from "next/link";
import { useTransition } from "react";
import { adjustStock, toggleProductActive } from "@/lib/actions/admin";
import type { Product } from "@/lib/types";

/** Compact staff controls shown on product cards while in admin mode. */
export default function AdminCardControls({ product }: { product: Product }) {
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<void>) {
    startTransition(action);
  }

  return (
    <div
      className={`mt-3 flex flex-wrap items-center gap-2 rounded-2xl bg-ink/90 p-2 text-cream backdrop-blur ${
        isPending ? "opacity-60" : ""
      }`}
    >
      <Link
        href={`/admin/products/${product.id}`}
        className="rounded-full bg-cream/15 px-3.5 py-1.5 text-xs font-medium transition-colors hover:bg-matcha hover:text-ink"
      >
        ✎ Edit
      </Link>

      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          run(async () => {
            const form = new FormData();
            form.set("id", product.id);
            form.set("next", String(!product.is_active));
            await toggleProductActive(form);
          })
        }
        className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
          product.is_active
            ? "bg-matcha/30 text-matcha hover:bg-matcha hover:text-ink"
            : "bg-cream/15 text-cream/60 hover:bg-cream/30"
        }`}
        title={product.is_active ? "Hide from shop" : "Show in shop"}
      >
        {product.is_active ? "Live" : "Hidden"}
      </button>

      {product.stock != null && (
        <span className="ml-auto flex items-center gap-1 rounded-full bg-cream/15 px-1.5 py-1 text-xs font-medium">
          <button
            type="button"
            disabled={isPending || product.stock === 0}
            onClick={() =>
              run(async () => {
                const form = new FormData();
                form.set("id", product.id);
                form.set("delta", "-1");
                await adjustStock(form);
              })
            }
            className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-cream/25 disabled:opacity-40"
            aria-label="Decrease stock"
          >
            −
          </button>
          <span className="w-6 text-center tabular-nums">{product.stock}</span>
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              run(async () => {
                const form = new FormData();
                form.set("id", product.id);
                form.set("delta", "1");
                await adjustStock(form);
              })
            }
            className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-cream/25 disabled:opacity-40"
            aria-label="Increase stock"
          >
            +
          </button>
        </span>
      )}
    </div>
  );
}
