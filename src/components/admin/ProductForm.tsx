"use client";

/* eslint-disable @next/next/no-img-element */

import { useActionState, useState } from "react";
import { motion } from "framer-motion";
import { saveProduct, type ActionState } from "@/lib/actions/admin";
import type { Category, Product } from "@/lib/types";

const inputClass =
  "w-full rounded-2xl border border-ink/15 bg-white px-5 py-3.5 text-sm text-ink placeholder:text-ink/35 outline-none transition-all duration-300 focus:border-matcha-deep focus:ring-4 focus:ring-matcha/20";

export default function ProductForm({
  product,
  categories,
}: {
  product?: Product;
  categories: Category[];
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    saveProduct,
    null
  );
  const [preview, setPreview] = useState<string | null>(
    product?.image_url ?? null
  );

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      {product && <input type="hidden" name="id" value={product.id} />}

      <div>
        <label htmlFor="name" className="mb-2 block text-sm font-medium text-ink">
          Product name *
        </label>
        <input
          id="name"
          name="name"
          required
          maxLength={120}
          defaultValue={product?.name}
          className={inputClass}
          placeholder="Ceremonial Matcha Latte"
        />
      </div>

      <div>
        <label htmlFor="description" className="mb-2 block text-sm font-medium text-ink">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          maxLength={1000}
          defaultValue={product?.description}
          className={`${inputClass} resize-none`}
          placeholder="What is it, what does it taste like, what makes it special…"
        />
        <p className="mt-1.5 text-xs text-ink/45">
          Shown on the shop page and the product page.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="price" className="mb-2 block text-sm font-medium text-ink">
            Price (USD) *
          </label>
          <input
            id="price"
            name="price"
            required
            inputMode="decimal"
            defaultValue={
              product ? (product.price_cents / 100).toFixed(2) : undefined
            }
            className={inputClass}
            placeholder="6.50"
          />
        </div>
        <div>
          <label htmlFor="category_id" className="mb-2 block text-sm font-medium text-ink">
            Category
          </label>
          <select
            id="category_id"
            name="category_id"
            defaultValue={product?.category_id ?? ""}
            className={inputClass}
          >
            <option value="">— No category —</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <span className="mb-2 block text-sm font-medium text-ink">Photo</span>
        <div className="flex items-start gap-5">
          <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-cream-light">
            {preview ? (
              <img src={preview} alt="Product preview" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-ink/30">
                <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
                  <circle cx="9" cy="10" r="1.6" />
                  <path d="M4.5 17 L9.5 12.5 L13 15.5 L16 13 L19.5 16" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1 space-y-2.5">
            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) setPreview(URL.createObjectURL(file));
              }}
              className="block w-full text-sm text-ink/70 file:mr-4 file:rounded-full file:border-0 file:bg-ink file:px-5 file:py-2.5 file:text-sm file:font-medium file:text-cream hover:file:bg-matcha-deep"
            />
            <p className="text-xs text-ink/45">
              JPG or PNG, up to 5 MB. Without a photo, a matching illustration
              is shown instead.
            </p>
            {product?.image_url && (
              <label className="flex items-center gap-2 text-sm text-ink/60">
                <input type="checkbox" name="remove_image" className="h-4 w-4 accent-matcha-deep" />
                Remove current photo
              </label>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-6 rounded-2xl bg-cream-light p-5">
        <label className="flex items-center gap-2.5 text-sm text-ink">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={product ? product.is_active : true}
            className="h-4.5 w-4.5 accent-matcha-deep"
          />
          <span>
            <span className="font-medium">Show in shop</span>
            <span className="block text-xs text-ink/50">
              Untick to hide it without deleting.
            </span>
          </span>
        </label>
        <label className="flex items-center gap-2.5 text-sm text-ink">
          <input
            type="checkbox"
            name="is_featured"
            defaultChecked={product?.is_featured ?? false}
            className="h-4.5 w-4.5 accent-matcha-deep"
          />
          <span>
            <span className="font-medium">House favorite</span>
            <span className="block text-xs text-ink/50">
              Featured on the home page.
            </span>
          </span>
        </label>
      </div>

      {state?.error && (
        <motion.p
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-red-50 px-5 py-3 text-sm text-red-700"
        >
          {state.error}
        </motion.p>
      )}

      <motion.button
        type="submit"
        disabled={isPending}
        whileTap={{ scale: 0.97 }}
        className="rounded-full bg-ink px-8 py-3.5 text-sm font-medium text-cream transition-colors duration-300 hover:bg-matcha-deep disabled:opacity-60"
      >
        {isPending
          ? "Saving…"
          : product
            ? "Save changes"
            : "Add product"}
      </motion.button>
    </form>
  );
}
