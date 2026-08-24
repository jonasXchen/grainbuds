"use client";

import { useT } from "@/lib/i18n/context";

export default function ShopSearchForm({
  value,
  onChange,
  tone = "light",
}: {
  value?: string;
  onChange?: (value: string) => void;
  tone?: "light" | "dark";
}) {
  const t = useT();
  const isDark = tone === "dark";

  return (
    <form action="/shop" method="get" role="search" className="w-full">
      <label htmlFor={`shop-search-${tone}`} className="sr-only">
        {t.shop.searchLabel}
      </label>
      <div
        className={`flex items-center gap-3 rounded-full border p-1.5 pl-5 shadow-sm backdrop-blur-sm transition-colors focus-within:ring-2 ${
          isDark
            ? "border-cream/25 bg-ink/45 text-cream focus-within:border-matcha focus-within:ring-matcha/25"
            : "border-ink/15 bg-cream-light/80 text-ink focus-within:border-matcha-deep focus-within:ring-matcha/20"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={`h-5 w-5 shrink-0 ${isDark ? "text-cream/60" : "text-ink/45"}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" strokeLinecap="round" />
        </svg>
        <input
          id={`shop-search-${tone}`}
          name="q"
          type="search"
          value={value}
          onChange={onChange ? (event) => onChange(event.target.value) : undefined}
          placeholder={t.shop.searchPlaceholder}
          autoComplete="off"
          className={`min-w-0 flex-1 bg-transparent py-2 text-sm outline-none ${
            isDark
              ? "placeholder:text-cream/45"
              : "placeholder:text-ink/40"
          }`}
        />
        <button
          type="submit"
          className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
            isDark
              ? "bg-cream text-ink hover:bg-matcha"
              : "bg-ink text-cream hover:bg-matcha-deep"
          }`}
        >
          {t.shop.searchButton}
        </button>
      </div>
    </form>
  );
}
