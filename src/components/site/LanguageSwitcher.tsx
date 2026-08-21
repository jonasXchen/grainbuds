"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
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

  function setLocale(next: Locale) {
    if (next === locale) return;
    writeLocaleCookie(next);
    startTransition(() => router.refresh());
  }

  return (
    <div
      className={`relative flex items-center rounded-full border border-ink/15 bg-cream-light p-1 text-xs font-semibold ${
        isPending ? "opacity-60" : ""
      }`}
      role="group"
      aria-label="Language"
    >
      {(["en", "de"] as const).map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => setLocale(lang)}
          className={`relative rounded-full px-2.5 py-1.5 uppercase tracking-wide transition-colors duration-300 ${
            locale === lang ? "text-cream" : "text-ink/50 hover:text-ink"
          }`}
          aria-pressed={locale === lang}
        >
          {locale === lang && (
            <motion.span
              layoutId="lang-pill"
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
