"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocale } from "@/lib/i18n/context";

const CONSENT_COOKIE = "grainbuds-cookie-consent";
const ONE_YEAR = 60 * 60 * 24 * 365;

export const OPEN_COOKIE_SETTINGS_EVENT = "grainbuds:open-cookie-settings";

export default function CookieNotice() {
  const locale = useLocale();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hasChoice = document.cookie
      .split(";")
      .some((cookie) => cookie.trim().startsWith(`${CONSENT_COOKIE}=`));
    // This state is intentionally derived after mount because cookies are a
    // browser-only API and the server must render a stable initial tree.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(!hasChoice);

    const openSettings = () => setVisible(true);
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, openSettings);
    return () =>
      window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, openSettings);
  }, []);

  function acceptNecessaryStorage() {
    const secure = window.location.protocol === "https:" ? ";secure" : "";
    document.cookie = `${CONSENT_COOKIE}=necessary;path=/;max-age=${ONE_YEAR};samesite=lax${secure}`;
    setVisible(false);
  }

  const copy =
    locale === "de"
      ? {
          title: "Nur notwendige Speicherung",
          text: "Wir verwenden keine Analyse- oder Werbe-Cookies. Sprache, Warenkorb und Ihre Auswahl hier werden nur gespeichert, damit die Website funktioniert.",
          action: "Notwendige Speicherung akzeptieren",
          privacy: "Datenschutz ansehen",
        }
      : {
          title: "Necessary storage only",
          text: "We do not use analytics or advertising cookies. Language, cart, and this choice are stored only so the website works properly.",
          action: "Accept necessary storage",
          privacy: "View privacy policy",
        };

  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-4 bottom-4 z-[70] mx-auto max-w-2xl rounded-3xl border border-ink/10 bg-cream-light p-5 shadow-[0_24px_80px_-24px_rgba(18,26,37,0.45)] sm:bottom-6 sm:p-6"
          role="dialog"
          aria-live="polite"
          aria-label={copy.title}
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex-1">
              <h2 className="font-display text-xl text-ink">{copy.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/60">
                {copy.text}
              </p>
              <Link
                href="/privacy"
                className="mt-2 inline-block text-sm font-medium text-matcha-deep underline decoration-matcha/50 underline-offset-4"
              >
                {copy.privacy}
              </Link>
            </div>
            <button
              type="button"
              onClick={acceptNecessaryStorage}
              className="shrink-0 rounded-full bg-ink px-6 py-3 text-sm font-medium text-cream transition-colors hover:bg-matcha-deep"
            >
              {copy.action}
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
