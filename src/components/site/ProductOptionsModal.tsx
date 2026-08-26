"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useCart } from "@/lib/cart-context";
import {
  formatPrice,
  localizedName,
  type Product,
  type SelectedProductOption,
} from "@/lib/types";
import { useLocale } from "@/lib/i18n/context";

export default function ProductOptionsModal({
  product,
  quantity = 1,
  openCart = true,
  initialSelectedOptions = [],
  defaultFirstOption = true,
  editingLineId,
  onClose,
}: {
  product: Product;
  quantity?: number;
  openCart?: boolean;
  initialSelectedOptions?: SelectedProductOption[];
  defaultFirstOption?: boolean;
  editingLineId?: string;
  onClose: () => void;
}) {
  const locale = useLocale();
  const { addItem, replaceLineOptions } = useCart();
  const groups = useMemo(() => product.option_groups ?? [], [product.option_groups]);
  const [selection, setSelection] = useState<Record<string, string[]>>(() => {
    const initial = initialSelectedOptions.reduce<Record<string, string[]>>((result, option) => {
      result[option.group_id] = [...(result[option.group_id] ?? []), option.option_id];
      return result;
    }, {});
    if (defaultFirstOption) {
      for (const group of groups) {
        const firstOption = group.options[0];
        if (!(initial[group.id]?.length) && firstOption) {
          initial[group.id] = [firstOption.id];
        }
      }
    }
    return initial;
  });
  const [showErrors, setShowErrors] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    closeButtonRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previous?.focus();
    };
  }, [onClose]);

  const selectedOptions = useMemo(() => {
    const selected: SelectedProductOption[] = [];
    for (const group of groups) {
      for (const optionId of selection[group.id] ?? []) {
        const option = group.options.find((choice) => choice.id === optionId);
        if (!option) continue;
        selected.push({
          group_id: group.id,
          group_name: group.name,
          group_name_de: group.name_de,
          option_id: option.id,
          option_name: option.name,
          option_name_de: option.name_de,
          price_delta_cents: option.price_delta_cents,
        });
      }
    }
    return selected;
  }, [groups, selection]);
  const missingRequired = groups.some(
    (group) => group.required && (selection[group.id]?.length ?? 0) === 0
  );
  const unitPrice = product.price_cents + selectedOptions.reduce(
    (sum, option) => sum + option.price_delta_cents,
    0
  );

  function toggleOption(groupId: string, optionId: string, multiple: boolean) {
    setSelection((current) => {
      const selected = current[groupId] ?? [];
      return {
        ...current,
        [groupId]: multiple
          ? selected.includes(optionId)
            ? selected.filter((id) => id !== optionId)
            : [...selected, optionId]
          : [optionId],
      };
    });
    setShowErrors(false);
  }

  function addConfiguredProduct() {
    if (missingRequired) {
      setShowErrors(true);
      return;
    }
    if (editingLineId) {
      replaceLineOptions(editingLineId, selectedOptions);
    } else {
      addItem(product, quantity, { openCart, selectedOptions });
    }
    onClose();
  }

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-5">
      <button
        type="button"
        aria-label={locale === "de" ? "Schließen" : "Close"}
        onClick={onClose}
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`customize-${product.id}`}
        className="relative max-h-[90dvh] w-full overflow-y-auto rounded-t-[2rem] bg-cream p-6 shadow-2xl sm:max-w-lg sm:rounded-[2rem] sm:p-8"
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label={locale === "de" ? "Schließen" : "Close"}
          className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full border border-ink/15 text-lg text-ink/55 transition-colors hover:bg-ink hover:text-cream"
        >
          ×
        </button>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-matcha-deep">
          {locale === "de" ? "Zusammenstellen" : "Customize"}
        </p>
        <h2 id={`customize-${product.id}`} className="mt-2 pr-12 font-display text-3xl text-ink">
          {localizedName(product, locale)}
        </h2>

        <div className="mt-6 space-y-6">
          {groups.map((group) => {
            const hasError = showErrors && group.required && !(selection[group.id]?.length);
            return (
              <fieldset key={group.id}>
                <legend className="flex w-full items-center justify-between gap-3 text-sm font-semibold text-ink">
                  <span>{localizedName(group, locale)}</span>
                  <span className={`text-[11px] font-medium uppercase tracking-wider ${hasError ? "text-red-600" : "text-ink/40"}`}>
                    {group.required
                      ? locale === "de" ? "Erforderlich" : "Required"
                      : locale === "de" ? "Optional" : "Optional"}
                  </span>
                </legend>
                <div className={`mt-3 space-y-2 rounded-2xl ${hasError ? "ring-2 ring-red-200" : ""}`}>
                  {!group.required && !group.allow_multiple && (
                    <label className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition-colors ${
                      !(selection[group.id]?.length)
                        ? "border-matcha-deep bg-matcha/15 text-ink"
                        : "border-ink/10 bg-cream-light text-ink/60 hover:border-ink/20"
                    }`}>
                      <input
                        type="radio"
                        name={`option-group-${group.id}`}
                        checked={!(selection[group.id]?.length)}
                        onChange={() => setSelection((current) => ({ ...current, [group.id]: [] }))}
                        className="h-4 w-4 accent-matcha-deep"
                      />
                      {locale === "de" ? "Keine Auswahl" : "No selection"}
                    </label>
                  )}
                  {group.options.map((option) => {
                    const checked = (selection[group.id] ?? []).includes(option.id);
                    return (
                      <label
                        key={option.id}
                        className={`flex cursor-pointer items-center justify-between gap-4 rounded-2xl border px-4 py-3 transition-colors ${
                          checked
                            ? "border-matcha-deep bg-matcha/15"
                            : "border-ink/10 bg-cream-light hover:border-ink/20"
                        }`}
                      >
                        <span className="flex items-center gap-3 text-sm text-ink">
                          <input
                            type={group.allow_multiple ? "checkbox" : "radio"}
                            name={`option-group-${group.id}`}
                            checked={checked}
                            onChange={() => toggleOption(group.id, option.id, group.allow_multiple)}
                            className="h-4 w-4 accent-matcha-deep"
                          />
                          {localizedName(option, locale)}
                        </span>
                        <span className="shrink-0 text-xs font-medium text-ink/55">
                          {option.price_delta_cents > 0
                            ? `+${formatPrice(option.price_delta_cents, locale)}`
                            : locale === "de" ? "inklusive" : "included"}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}
        </div>

        {showErrors && missingRequired && (
          <p className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {locale === "de"
              ? "Bitte treffen Sie alle erforderlichen Auswahlen."
              : "Please complete all required selections."}
          </p>
        )}

        <button
          type="button"
          onClick={addConfiguredProduct}
          className="mt-7 flex w-full items-center justify-between rounded-full bg-ink px-6 py-4 text-sm font-medium text-cream transition-colors hover:bg-matcha-deep"
        >
          <span>
            {editingLineId
              ? locale === "de" ? "Auswahl aktualisieren" : "Update selection"
              : locale === "de" ? "Zur Bestellung hinzufügen" : "Add to order"}
          </span>
          <span>{formatPrice(unitPrice * quantity, locale)}</span>
        </button>
      </div>
    </div>,
    document.body
  );
}
