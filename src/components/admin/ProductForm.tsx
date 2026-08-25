"use client";

/* eslint-disable @next/next/no-img-element */

import { useActionState, useState } from "react";
import { motion } from "framer-motion";
import { saveProduct, type ActionState } from "@/lib/actions/admin";
import { localizedName, type Category, type Product } from "@/lib/types";
import ProductOptionsEditor from "@/components/admin/ProductOptionsEditor";

const inputClass =
  "w-full rounded-2xl border border-ink/15 bg-white px-5 py-3.5 text-sm text-ink placeholder:text-ink/35 outline-none transition-all duration-300 focus:border-matcha-deep focus:ring-4 focus:ring-matcha/20";

export default function ProductForm({
  product,
  categories,
  returnTo,
}: {
  product?: Product;
  categories: Category[];
  returnTo?: string;
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    saveProduct,
    null
  );
  const [preview, setPreview] = useState<string | null>(
    product?.image_url ?? null
  );
  const [editingLanguage, setEditingLanguage] = useState<"de" | "en">("de");

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      {product && <input type="hidden" name="id" value={product.id} />}
      {returnTo && <input type="hidden" name="return_to" value={returnTo} />}

      <div>
        <div className="flex justify-start">
          <div className="flex rounded-full bg-cream-light p-1" aria-label="Product text language">
            {(["de", "en"] as const).map((language) => (
              <button
                key={language}
                type="button"
                onClick={() => setEditingLanguage(language)}
                aria-pressed={editingLanguage === language}
                className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                  editingLanguage === language
                    ? "bg-ink text-cream"
                    : "text-ink/50 hover:text-ink"
                }`}
              >
                {language === "de" ? "Deutsch" : "English"}
              </button>
            ))}
          </div>
        </div>

        <div className={`mt-5 space-y-5 ${editingLanguage === "de" ? "" : "hidden"}`}>
          <div>
            <label htmlFor="name_de" className="mb-2 block text-sm font-medium text-ink">
              Produktname
            </label>
            <input
              id="name_de"
              name="name_de"
              maxLength={120}
              defaultValue={product?.name_de ?? ""}
              className={inputClass}
              placeholder="Pistazien-Matcha"
            />
          </div>
          <div>
            <label htmlFor="description_de" className="mb-2 block text-sm font-medium text-ink">
              Beschreibung
            </label>
            <textarea
              id="description_de"
              name="description_de"
              rows={3}
              maxLength={1000}
              defaultValue={product?.description_de ?? ""}
              className={`${inputClass} resize-none`}
              placeholder="Matcha, Pistaziencreme, Milch"
            />
          </div>
        </div>

        <div className={`mt-5 space-y-5 ${editingLanguage === "en" ? "" : "hidden"}`}>
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium text-ink">
              Product name
            </label>
            <input
              id="name"
              name="name"
              maxLength={120}
              defaultValue={product?.name ?? ""}
              className={inputClass}
              placeholder="Pistachio Matcha"
            />
          </div>
          <div>
            <label htmlFor="description" className="mb-2 block text-sm font-medium text-ink">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              maxLength={1000}
              defaultValue={product?.description ?? ""}
              className={`${inputClass} resize-none`}
              placeholder="Matcha, pistachio cream, milk"
            />
          </div>
        </div>
        <p className="mt-3 text-xs text-ink/45">
          Add either language or both. If one is empty, customers see the other
          language automatically.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="price" className="mb-2 block text-sm font-medium text-ink">
            Price (EUR) *
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
            placeholder="6,50"
          />
        </div>
        <div>
          <label htmlFor="stock" className="mb-2 block text-sm font-medium text-ink">
            Stock
          </label>
          <input
            id="stock"
            name="stock"
            inputMode="numeric"
            defaultValue={product?.stock ?? ""}
            className={inputClass}
            placeholder="Leave empty = always available"
          />
          <p className="mt-1.5 text-xs text-ink/45">
            Counts down automatically with each order; at 0 the item shows as
            sold out. Leave empty for made-to-order items.
          </p>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label htmlFor="category_id" className="block text-sm font-medium text-ink">
              Category
            </label>
            <a
              href="#categories"
              className="text-xs font-medium text-matcha-deep transition-colors hover:text-ink"
            >
              Manage categories ↓
            </a>
          </div>
          <select
            id="category_id"
            name="category_id"
            defaultValue={product?.category_id ?? ""}
            className={inputClass}
          >
            <option value="">— No category —</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {localizedName(category, editingLanguage)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ProductOptionsEditor initialGroups={product?.option_groups ?? []} />

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
        <label className="flex items-center gap-2.5 text-sm text-ink">
          <input
            type="checkbox"
            name="loyalty_eligible"
            defaultChecked={product?.loyalty_eligible ?? false}
            className="h-4.5 w-4.5 accent-matcha-deep"
          />
          <span>
            <span className="font-medium">
              {editingLanguage === "de" ? "Stempelkarte" : "Stamp card"}
            </span>
            <span className="block text-xs text-ink/50">
              {editingLanguage === "de"
                ? "Sammelt einen Stempel und kann als 11. Produkt gratis sein."
                : "Earns a stamp and can be the free 11th product."}
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
