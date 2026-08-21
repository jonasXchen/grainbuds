"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { motion } from "framer-motion";
import {
  addCategory,
  deleteCategory,
  reorderCategories,
  updateCategory,
  type ActionState,
} from "@/lib/actions/admin";
import type { Category } from "@/lib/types";

type EditingLanguage = "de" | "en";

function LanguageSwitch({
  value,
  onChange,
}: {
  value: EditingLanguage;
  onChange: (language: EditingLanguage) => void;
}) {
  return (
    <div className="flex shrink-0 rounded-full bg-white p-1" aria-label="Category language">
      {(["de", "en"] as const).map((language) => (
        <button
          key={language}
          type="button"
          onClick={() => onChange(language)}
          aria-pressed={value === language}
          className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
            value === language
              ? "bg-ink text-cream"
              : "text-ink/50 hover:text-ink"
          }`}
        >
          {language === "de" ? "Deutsch" : "English"}
        </button>
      ))}
    </div>
  );
}

function InlineCategoryEditor({
  category,
  editingLanguage,
  onClose,
}: {
  category: Category;
  editingLanguage: EditingLanguage;
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateCategory,
    null
  );
  const editorRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const handleOutsidePointer = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !editorRef.current?.contains(event.target)
      ) {
        onClose();
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("pointerdown", handleOutsidePointer, true);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handleOutsidePointer, true);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  return (
    <>
      <form ref={editorRef} action={formAction} className="flex items-center gap-1">
        <input type="hidden" name="id" value={category.id} />

        <div className={editingLanguage === "en" ? "" : "hidden"}>
          <label htmlFor={`category-name-${category.id}`} className="sr-only">
            English category name
          </label>
          <input
            id={`category-name-${category.id}`}
            name="name"
            required={editingLanguage === "en"}
            maxLength={80}
            defaultValue={category.name}
            className="h-8 w-32 rounded-full border border-matcha-deep/40 bg-white px-3 text-sm text-ink outline-none focus:ring-2 focus:ring-matcha/30 sm:w-44"
            autoFocus={editingLanguage === "en"}
          />
        </div>

        <div className={editingLanguage === "de" ? "" : "hidden"}>
          <label htmlFor={`category-name-de-${category.id}`} className="sr-only">
            Kategoriename
          </label>
          <input
            id={`category-name-de-${category.id}`}
            name="name_de"
            required={editingLanguage === "de"}
            maxLength={80}
            defaultValue={category.name_de || category.name}
            className="h-8 w-32 rounded-full border border-matcha-deep/40 bg-white px-3 text-sm text-ink outline-none focus:ring-2 focus:ring-matcha/30 sm:w-44"
            autoFocus={editingLanguage === "de"}
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-cream transition-colors hover:bg-matcha-deep disabled:opacity-60"
          aria-label="Save category"
          title="Save"
        >
          {isPending ? "…" : "✓"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-ink/40 transition-colors hover:bg-ink/5 hover:text-ink"
          aria-label="Cancel category editing"
          title="Cancel"
        >
          ×
        </button>
      </form>

      {state?.error && (
        <span aria-live="polite" className="px-1 text-xs text-red-600" title={state.error}>
          {state.error}
        </span>
      )}
      {state?.message && (
        <span aria-live="polite" className="px-1 text-xs text-matcha-deep">Saved</span>
      )}
    </>
  );
}

export default function CategoryManager({
  categories,
}: {
  categories: Category[];
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    addCategory,
    null
  );
  const [editingLanguage, setEditingLanguage] = useState<EditingLanguage>("de");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [orderedCategories, setOrderedCategories] = useState(categories);
  const [categoriesSnapshot, setCategoriesSnapshot] = useState(categories);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const [isReordering, startReordering] = useTransition();
  const addFormRef = useRef<HTMLFormElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const orderedCategoriesRef = useRef(categories);
  const draggingIdRef = useRef<string | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const dragStartOrderRef = useRef(categories);
  const dragChangedRef = useRef(false);

  if (categories !== categoriesSnapshot) {
    setCategoriesSnapshot(categories);
    setOrderedCategories(categories);
  }

  const draggedCategory = orderedCategories.find(
    (category) => category.id === draggingId
  );

  useEffect(() => {
    if (state?.message) addFormRef.current?.reset();
  }, [state]);

  useEffect(() => {
    orderedCategoriesRef.current = orderedCategories;
  }, [orderedCategories]);

  const moveToIndex = useCallback((id: string, targetIndex: number) => {
    const current = orderedCategoriesRef.current;
    const sourceIndex = current.findIndex((category) => category.id === id);
    if (
      sourceIndex < 0 ||
      targetIndex < 0 ||
      targetIndex >= current.length ||
      sourceIndex === targetIndex
    ) return;

    const next = [...current];
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    dragChangedRef.current = true;
    orderedCategoriesRef.current = next;
    setOrderedCategories(next);
  }, []);

  function saveOrder(next: Category[]) {
    startReordering(async () => {
      await reorderCategories(next.map((category) => category.id));
    });
  }

  const updateDragPosition = useCallback((clientX: number, clientY: number) => {
    const activeId = draggingIdRef.current;
    if (!activeId || !listRef.current) return;
    setDragPosition({ x: clientX, y: clientY });

    const badges = Array.from(
      listRef.current.querySelectorAll<HTMLElement>("[data-category-id]")
    );
    const directTarget = badges.findIndex((badge) => {
      const rect = badge.getBoundingClientRect();
      return (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      );
    });
    const targetIndex = directTarget >= 0
      ? directTarget
      : badges.reduce(
          (closest, badge, index) => {
            const rect = badge.getBoundingClientRect();
            const distance = Math.hypot(
              clientX - (rect.left + rect.width / 2),
              clientY - (rect.top + rect.height / 2)
            );
            return distance < closest.distance ? { index, distance } : closest;
          },
          { index: -1, distance: Number.POSITIVE_INFINITY }
        ).index;
    moveToIndex(activeId, targetIndex);
  }, [moveToIndex]);

  const finishDragging = useCallback(() => {
    if (!draggingIdRef.current) return;
    draggingIdRef.current = null;
    activePointerIdRef.current = null;
    setDraggingId(null);
    setDragPosition(null);
    if (dragChangedRef.current) {
      const nextOrder = orderedCategoriesRef.current.map(
        (category) => category.id
      );
      startReordering(async () => {
        await reorderCategories(nextOrder);
      });
    }
    dragChangedRef.current = false;
  }, []);

  const cancelDragging = useCallback(() => {
    if (!draggingIdRef.current) return;
    draggingIdRef.current = null;
    activePointerIdRef.current = null;
    dragChangedRef.current = false;
    orderedCategoriesRef.current = dragStartOrderRef.current;
    setOrderedCategories(dragStartOrderRef.current);
    setDraggingId(null);
    setDragPosition(null);
  }, []);

  useEffect(() => {
    if (!draggingId) return;
    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerId !== activePointerIdRef.current) return;
      event.preventDefault();
      updateDragPosition(event.clientX, event.clientY);
    };
    const handlePointerUp = (event: PointerEvent) => {
      if (event.pointerId === activePointerIdRef.current) finishDragging();
    };
    const handlePointerCancel = (event: PointerEvent) => {
      if (event.pointerId === activePointerIdRef.current) cancelDragging();
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);
    window.addEventListener("blur", cancelDragging);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
      window.removeEventListener("blur", cancelDragging);
    };
  }, [cancelDragging, draggingId, finishDragging, updateDragPosition]);

  return (
    <div className="rounded-3xl border border-ink/8 bg-cream-light p-5 sm:p-7">
      <h2 className="font-display text-2xl text-ink">Manage product categories</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink/55">
        Categories become the filters customers see above the shop.
      </p>

      <div className="mt-5 flex justify-start">
        <LanguageSwitch value={editingLanguage} onChange={setEditingLanguage} />
      </div>

      <section className="mt-6 rounded-2xl bg-white p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-ink">Add a category</h3>
        <form ref={addFormRef} action={formAction} className="mt-4 space-y-4">
          <div className={editingLanguage === "en" ? "" : "hidden"}>
            <label htmlFor="new-category-name" className="mb-1.5 block text-xs font-medium text-ink/60">
              English category name <span className="text-red-500">*</span>
            </label>
            <input
              id="new-category-name"
              name="name"
              required={editingLanguage === "en"}
              maxLength={80}
              placeholder="e.g. Matcha"
              className="w-full rounded-xl border border-ink/15 px-3.5 py-2.5 text-sm outline-none transition-all focus:border-matcha-deep focus:ring-4 focus:ring-matcha/20"
            />
          </div>
          <div className={editingLanguage === "de" ? "" : "hidden"}>
            <label htmlFor="new-category-name-de" className="mb-1.5 block text-xs font-medium text-ink/60">
              Kategoriename <span className="text-red-500">*</span>
            </label>
            <input
              id="new-category-name-de"
              name="name_de"
              required={editingLanguage === "de"}
              maxLength={80}
              placeholder="z. B. Matcha"
              className="w-full rounded-xl border border-ink/15 px-3.5 py-2.5 text-sm outline-none transition-all focus:border-matcha-deep focus:ring-4 focus:ring-matcha/20"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl bg-ink px-5 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-matcha-deep disabled:opacity-60 sm:w-auto"
          >
            {isPending ? "Adding…" : "+ Add category"}
          </button>
        </form>
        {state?.error && (
          <p aria-live="polite" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">
            {state.error}
          </p>
        )}
        {state?.message && (
          <p aria-live="polite" className="mt-3 rounded-xl bg-matcha/15 px-3 py-2 text-xs text-matcha-deep">
            {state.message}
          </p>
        )}
      </section>

      <section className="mt-8">
        <h3 className="text-sm font-semibold text-ink">Existing categories</h3>
        <p className="mt-1 text-xs leading-relaxed text-ink/45">
          Drag the dotted handle to change the shop order. Select the pencil to
          edit a category or the bin to remove it.
        </p>
        {isReordering && (
          <p aria-live="polite" className="mt-2 text-xs font-medium text-matcha-deep">
            Saving category order…
          </p>
        )}

        {orderedCategories.length > 0 ? (
          <>
            <ul ref={listRef} className="mt-4 flex flex-wrap gap-2 select-none">
              {orderedCategories.map((category, index) => {
                const displayName = category.name_de || category.name;
                const selected = category.id === selectedCategoryId;
                return (
                  <motion.li
                    layout
                    key={category.id}
                    data-category-id={category.id}
                    className={`flex items-center rounded-full border py-1 pl-1 pr-1.5 shadow-sm transition-colors ${
                      draggingId === category.id
                        ? "border-dashed border-matcha-deep bg-matcha/10 opacity-45"
                        : selected
                        ? "border-matcha-deep bg-matcha/15"
                        : "border-ink/10 bg-white"
                    }`}
                  >
                    <button
                      type="button"
                      onPointerDown={(event) => {
                        if (event.button !== 0 || draggingIdRef.current) return;
                        event.preventDefault();
                        draggingIdRef.current = category.id;
                        activePointerIdRef.current = event.pointerId;
                        dragStartOrderRef.current = orderedCategoriesRef.current;
                        dragChangedRef.current = false;
                        setDraggingId(category.id);
                        setDragPosition({ x: event.clientX, y: event.clientY });
                      }}
                      onPointerUp={finishDragging}
                      onPointerCancel={cancelDragging}
                      onKeyDown={(event) => {
                        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
                        event.preventDefault();
                        const targetIndex = event.key === "ArrowLeft" ? index - 1 : index + 1;
                        moveToIndex(category.id, targetIndex);
                        saveOrder(orderedCategoriesRef.current);
                        dragChangedRef.current = false;
                      }}
                      className="flex h-8 w-8 touch-none cursor-grab items-center justify-center rounded-full text-ink/35 transition-colors hover:bg-ink/5 hover:text-ink active:cursor-grabbing"
                      aria-label={`Drag ${displayName} to reorder. Use left and right arrow keys for keyboard reordering.`}
                      title="Drag to reorder"
                    >
                      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                        <circle cx="5" cy="3" r="1.2" />
                        <circle cx="11" cy="3" r="1.2" />
                        <circle cx="5" cy="8" r="1.2" />
                        <circle cx="11" cy="8" r="1.2" />
                        <circle cx="5" cy="13" r="1.2" />
                        <circle cx="11" cy="13" r="1.2" />
                      </svg>
                    </button>
                    {selected ? (
                      <InlineCategoryEditor
                        key={category.id}
                        category={category}
                        editingLanguage={editingLanguage}
                        onClose={() => setSelectedCategoryId(null)}
                      />
                    ) : (
                      <>
                        <span className="max-w-40 truncate px-2 text-sm font-medium text-ink">
                          {displayName}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedCategoryId(category.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-ink/45 transition-colors hover:bg-matcha/20 hover:text-matcha-deep"
                          aria-label={`Edit ${displayName}`}
                          title="Edit category"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
                            <path d="M4 20 L8.3 19 L19 8.3 A2.1 2.1 0 0 0 16 5.3 L5.3 16 Z" strokeLinejoin="round" />
                            <path d="M14.7 6.7 L17.7 9.7" />
                          </svg>
                        </button>
                      </>
                    )}
                    <form
                      action={deleteCategory}
                      onSubmit={(event) => {
                        if (
                          !confirm(
                            `Delete category “${displayName}”? Its products will remain, but become uncategorized.`
                          )
                        ) {
                          event.preventDefault();
                        }
                      }}
                    >
                      <input type="hidden" name="id" value={category.id} />
                      <button
                        type="submit"
                        className="flex h-8 w-8 items-center justify-center rounded-full text-ink/35 transition-colors hover:bg-red-50 hover:text-red-600"
                        aria-label={`Delete ${displayName}`}
                        title="Delete category"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          aria-hidden="true"
                        >
                          <path d="M5 7 H19 M9 7 V4.5 H15 V7 M7.5 7 L8.3 20 H15.7 L16.5 7 M10 10.5 V16.5 M14 10.5 V16.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </form>
                  </motion.li>
                );
              })}
            </ul>

            {draggedCategory && dragPosition && (
              <div
                className="pointer-events-none fixed z-[100] flex items-center gap-2 rounded-full border border-matcha-deep bg-cream-light px-4 py-2.5 text-sm font-medium text-ink shadow-[0_16px_40px_-12px_rgba(18,26,37,0.45)]"
                style={{
                  left: dragPosition.x,
                  top: dragPosition.y,
                  transform: "translate(-50%, calc(-100% - 12px))",
                }}
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 16 16"
                  className="h-4 w-4 text-ink/35"
                  fill="currentColor"
                >
                  <circle cx="5" cy="3" r="1.2" />
                  <circle cx="11" cy="3" r="1.2" />
                  <circle cx="5" cy="8" r="1.2" />
                  <circle cx="11" cy="8" r="1.2" />
                  <circle cx="5" cy="13" r="1.2" />
                  <circle cx="11" cy="13" r="1.2" />
                </svg>
                <span className="max-w-48 truncate">
                  {draggedCategory.name_de || draggedCategory.name}
                </span>
              </div>
            )}

          </>
        ) : (
          <p className="mt-4 rounded-2xl border border-dashed border-ink/15 px-5 py-8 text-center text-sm text-ink/45">
            No categories yet. Add the first one above.
          </p>
        )}
      </section>
    </div>
  );
}
