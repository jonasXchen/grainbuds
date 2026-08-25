"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useLoyalty } from "@/lib/loyalty-context";
import { useT } from "@/lib/i18n/context";

export default function LoyaltyButton() {
  const { enabled, loading, open, stamps, user } = useLoyalty();
  const t = useT();

  if (!enabled) return null;

  return (
    <button
      type="button"
      onClick={open}
      className="relative flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 bg-cream-light text-ink transition-colors duration-300 hover:border-matcha hover:bg-matcha/15"
      aria-label={user ? `${t.loyalty.openCard}: ${stamps} ${t.loyalty.stamps}` : t.loyalty.openCard}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="1.6" />
        <path d="M7 9h6M7 13h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M16.5 9.5c1.5 1.2 1.5 3.8 0 5-1.5-1.2-1.5-3.8 0-5Z" fill="currentColor" opacity=".7" />
      </svg>
      <AnimatePresence>
        {!loading && user && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -right-1.5 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-matcha-deep px-1 text-[10px] font-semibold text-cream"
          >
            {stamps}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
