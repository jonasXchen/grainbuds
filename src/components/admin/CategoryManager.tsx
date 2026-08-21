"use client";

import { useActionState } from "react";
import {
  addCategory,
  deleteCategory,
  type ActionState,
} from "@/lib/actions/admin";
import type { Category } from "@/lib/types";

export default function CategoryManager({
  categories,
}: {
  categories: Category[];
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    addCategory,
    null
  );

  return (
    <div className="rounded-3xl bg-cream-light p-6">
      <h2 className="font-display text-xl text-ink">Categories</h2>
      <p className="mt-1 text-xs text-ink/50">
        Group products on the shop page. Deleting a category keeps its
        products — they just become uncategorized.
      </p>

      <ul className="mt-4 flex flex-wrap gap-2">
        {categories.map((category) => (
          <li
            key={category.id}
            className="group flex items-center gap-1.5 rounded-full bg-white py-1.5 pl-4 pr-2 text-sm text-ink shadow-[0_1px_0_rgba(18,26,37,0.08)]"
          >
            {category.name}
            <form
              action={deleteCategory}
              onSubmit={(event) => {
                if (!confirm(`Delete category “${category.name}”?`)) {
                  event.preventDefault();
                }
              }}
            >
              <input type="hidden" name="id" value={category.id} />
              <button
                type="submit"
                className="flex h-5 w-5 items-center justify-center rounded-full text-ink/35 transition-colors hover:bg-red-100 hover:text-red-600"
                aria-label={`Delete ${category.name}`}
              >
                ×
              </button>
            </form>
          </li>
        ))}
      </ul>

      <form action={formAction} className="mt-4 flex gap-2">
        <input
          name="name"
          required
          maxLength={80}
          placeholder="New category name"
          className="flex-1 rounded-full border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-matcha-deep focus:ring-4 focus:ring-matcha/20"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-matcha-deep disabled:opacity-60"
        >
          Add
        </button>
      </form>
      {state?.error && (
        <p className="mt-2 text-xs text-red-600">{state.error}</p>
      )}
    </div>
  );
}
