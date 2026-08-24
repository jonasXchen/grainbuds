"use client";

import { useT } from "@/lib/i18n/context";

export default function ShopSearchForm({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const t = useT();

  return (
    <div role="search" className="w-full">
      <label htmlFor="shop-product-search" className="sr-only">
        {t.shop.searchLabel}
      </label>
      <div className="flex items-center gap-3 rounded-full border border-ink/15 bg-cream-light/80 py-1.5 pl-5 pr-2 text-ink shadow-sm backdrop-blur-sm transition-colors focus-within:border-matcha-deep focus-within:ring-2 focus-within:ring-matcha/20">
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-5 w-5 shrink-0 text-ink/45"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" strokeLinecap="round" />
        </svg>
        <input
          id="shop-product-search"
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={t.shop.searchPlaceholder}
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-ink/40"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label={t.shop.clearSearch}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink/50 transition-colors hover:bg-ink/10 hover:text-ink"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
              <path
                d="m5 5 10 10m0-10L5 15"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
