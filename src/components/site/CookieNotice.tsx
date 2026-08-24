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

  function dismissNotice() {
    const secure = window.location.protocol === "https:" ? ";secure" : "";
    document.cookie = `${CONSENT_COOKIE}=acknowledged;path=/;max-age=${ONE_YEAR};samesite=lax${secure}`;
    setVisible(false);
  }

  const copy =
    locale === "de"
      ? {
          title: "Datenschutz, ganz einfach",
          text: "Keine Analyse-, Werbe- oder Tracking-Cookies. Wir speichern nur, was Sprache, Warenkorb und wichtige Website-Funktionen benötigen.",
          action: "Verstanden",
          privacy: "Mehr erfahren",
        }
      : {
          title: "Privacy, kept simple",
          text: "No analytics, advertising, or tracking cookies. We only store what language, cart, and essential site features need.",
          action: "Got it",
          privacy: "Learn more",
        };

  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[70] rounded-2xl border border-ink/10 bg-cream-light/95 p-4 shadow-[0_20px_60px_-24px_rgba(18,26,37,0.5)] backdrop-blur-md sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[min(28rem,calc(100vw-2.5rem))]"
          role="region"
          aria-live="polite"
          aria-labelledby="cookie-notice-title"
          aria-describedby="cookie-notice-description"
        >
          <div className="flex gap-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-matcha/20 text-matcha-deep">
              <svg
                viewBox="0 0 20 20"
                className="h-[18px] w-[18px]"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M10 2.5 16 5v4.25c0 3.75-2.45 6.55-6 8.25-3.55-1.7-6-4.5-6-8.25V5l6-2.5Z"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
                <path
                  d="m7.25 10 1.75 1.75 3.75-4"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="min-w-0 flex-1">
              <h2 id="cookie-notice-title" className="font-display text-lg text-ink">
                {copy.title}
              </h2>
              <p
                id="cookie-notice-description"
                className="mt-1 text-sm leading-relaxed text-ink/60"
              >
                {copy.text}
              </p>

              <div className="mt-3 flex items-center justify-between gap-3">
                <Link
                  href="/privacy"
                  className="text-sm font-medium text-ink/55 underline decoration-ink/25 underline-offset-4 transition-colors hover:text-ink"
                >
                  {copy.privacy}
                </Link>
                <button
                  type="button"
                  onClick={dismissNotice}
                  className="shrink-0 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-matcha-deep"
                >
                  {copy.action}
                </button>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
