"use client";

import { useState } from "react";
import type { ProductOptionGroup } from "@/lib/types";

const compactInput =
  "w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/35 outline-none transition focus:border-matcha-deep focus:ring-2 focus:ring-matcha/20";

function newId() {
  return crypto.randomUUID();
}

export default function ProductOptionsEditor({
  initialGroups = [],
}: {
  initialGroups?: ProductOptionGroup[];
}) {
  const [groups, setGroups] = useState<ProductOptionGroup[]>(initialGroups);

  function addGroup() {
    setGroups((current) => [
      ...current,
      {
        id: newId(),
        name: "",
        name_de: "",
        required: false,
        allow_multiple: false,
        options: [],
      },
    ]);
  }

  function updateGroup(
    groupId: string,
    update: (group: ProductOptionGroup) => ProductOptionGroup
  ) {
    setGroups((current) =>
      current.map((group) => group.id === groupId ? update(group) : group)
    );
  }

  return (
    <section className="rounded-3xl border border-ink/10 bg-cream-light p-5 sm:p-6">
      <input type="hidden" name="option_groups_json" value={JSON.stringify(groups)} />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl text-ink">Zusatzoptionen / Product options</h2>
          <p className="mt-1 max-w-lg text-xs leading-relaxed text-ink/50">
            Erstellen Sie Gruppen wie „Milch“ oder „Süße“ und legen Sie für jede Auswahl einen Aufpreis fest.
          </p>
        </div>
        <button
          type="button"
          onClick={addGroup}
          className="rounded-full border border-ink/15 bg-white px-4 py-2 text-xs font-medium text-ink transition-colors hover:border-matcha-deep hover:text-matcha-deep"
        >
          + Gruppe hinzufügen
        </button>
      </div>

      {groups.length === 0 ? (
        <p className="mt-5 rounded-2xl border border-dashed border-ink/15 px-4 py-5 text-center text-sm text-ink/45">
          Keine Zusatzoptionen. Das Produkt wird direkt in den Warenkorb gelegt.
        </p>
      ) : (
        <div className="mt-5 space-y-4">
          {groups.map((group, groupIndex) => (
            <div key={group.id} className="rounded-2xl border border-ink/10 bg-white/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">
                  Gruppe {groupIndex + 1}
                </p>
                <button
                  type="button"
                  onClick={() => setGroups((current) => current.filter((item) => item.id !== group.id))}
                  className="text-xs font-medium text-red-500 hover:text-red-700"
                >
                  Entfernen
                </button>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <input
                  value={group.name_de ?? ""}
                  onChange={(event) => updateGroup(group.id, (item) => ({ ...item, name_de: event.target.value }))}
                  className={compactInput}
                  maxLength={80}
                  placeholder="Gruppenname (DE), z. B. Milch"
                  aria-label="Gruppenname auf Deutsch"
                />
                <input
                  value={group.name}
                  onChange={(event) => updateGroup(group.id, (item) => ({ ...item, name: event.target.value }))}
                  className={compactInput}
                  maxLength={80}
                  placeholder="Group name (EN), e.g. Milk"
                  aria-label="Group name in English"
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-4 rounded-xl bg-cream/60 px-3.5 py-3">
                <label className="flex items-center gap-2 text-xs text-ink/70">
                  <input
                    type="checkbox"
                    checked={group.required}
                    onChange={(event) => updateGroup(group.id, (item) => ({ ...item, required: event.target.checked }))}
                    className="accent-matcha-deep"
                  />
                  Auswahl erforderlich
                </label>
                <label className="flex items-center gap-2 text-xs text-ink/70">
                  <input
                    type="checkbox"
                    checked={group.allow_multiple}
                    onChange={(event) => updateGroup(group.id, (item) => ({ ...item, allow_multiple: event.target.checked }))}
                    className="accent-matcha-deep"
                  />
                  Mehrfachauswahl erlauben
                </label>
              </div>

              <div className="mt-4 space-y-2.5">
                {group.options.map((option) => (
                  <div key={option.id} className="grid grid-cols-[minmax(0,1fr)_5.75rem_2rem] gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_6.5rem_2rem]">
                    <input
                      value={option.name_de ?? ""}
                      onChange={(event) => updateGroup(group.id, (item) => ({
                        ...item,
                        options: item.options.map((choice) => choice.id === option.id ? { ...choice, name_de: event.target.value } : choice),
                      }))}
                      className={compactInput}
                      maxLength={80}
                      placeholder="Option (DE)"
                      aria-label="Optionsname auf Deutsch"
                    />
                    <input
                      value={option.name}
                      onChange={(event) => updateGroup(group.id, (item) => ({
                        ...item,
                        options: item.options.map((choice) => choice.id === option.id ? { ...choice, name: event.target.value } : choice),
                      }))}
                      className={`${compactInput} hidden sm:block`}
                      maxLength={80}
                      placeholder="Option (EN)"
                      aria-label="Option name in English"
                    />
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={option.price_delta_cents / 100}
                        onChange={(event) => updateGroup(group.id, (item) => ({
                          ...item,
                          options: item.options.map((choice) => choice.id === option.id
                            ? { ...choice, price_delta_cents: Math.max(0, Math.round((Number(event.target.value) || 0) * 100)) }
                            : choice),
                        }))}
                        className={`${compactInput} pr-7`}
                        aria-label="Aufpreis in Euro"
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink/40">€</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateGroup(group.id, (item) => ({
                        ...item,
                        options: item.options.filter((choice) => choice.id !== option.id),
                      }))}
                      aria-label="Option entfernen"
                      className="grid h-9 w-8 place-items-center self-center rounded-full text-lg text-ink/35 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      ×
                    </button>
                    <input
                      value={option.name}
                      onChange={(event) => updateGroup(group.id, (item) => ({
                        ...item,
                        options: item.options.map((choice) => choice.id === option.id ? { ...choice, name: event.target.value } : choice),
                      }))}
                      className={`${compactInput} col-span-3 sm:hidden`}
                      maxLength={80}
                      placeholder="Option (EN)"
                      aria-label="Option name in English"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => updateGroup(group.id, (item) => ({
                    ...item,
                    options: [
                      ...item.options,
                      { id: newId(), name: "", name_de: "", price_delta_cents: 0 },
                    ],
                  }))}
                  className="rounded-full bg-cream px-4 py-2 text-xs font-medium text-ink/65 transition-colors hover:bg-matcha/20 hover:text-matcha-deep"
                >
                  + Option hinzufügen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
