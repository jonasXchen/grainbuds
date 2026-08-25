"use client";

import { useRouter } from "next/navigation";
import { useId, useTransition } from "react";
import { motion } from "framer-motion";
import { useLocale } from "@/lib/i18n/context";
import type { Locale } from "@/lib/types";

function writeLocaleCookie(locale: Locale) {
  document.cookie = `grainbuds-lang=${locale};path=/;max-age=31536000;samesite=lax`;
}

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const layoutId = `lang-pill-${useId()}`;

  function setLocale(next: Locale) {
    if (next === locale) return;
    writeLocaleCookie(next);
    startTransition(() => router.refresh());
  }

  return (
    <div
      className={`relative flex items-center rounded-full border border-ink/20 bg-cream-light p-1 text-xs font-semibold shadow-sm ${
        isPending ? "opacity-60" : ""
      }`}
      role="group"
      aria-label="Language"
    >
      {(["de", "en"] as const).map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => setLocale(lang)}
          className={`relative rounded-full px-2 py-1.5 uppercase tracking-wide transition-colors duration-300 sm:px-2.5 ${
            locale === lang ? "text-cream" : "text-ink/55 hover:text-ink"
          }`}
          aria-pressed={locale === lang}
        >
          {locale === lang && (
            <motion.span
              layoutId={layoutId}
              className="absolute inset-0 rounded-full bg-ink"
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
            />
          )}
          <span className="relative">{lang}</span>
        </button>
      ))}
    </div>
  );
}
