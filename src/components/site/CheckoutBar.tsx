"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/lib/cart-context";
import { useLocale, useT } from "@/lib/i18n/context";
import { formatPrice } from "@/lib/types";

export default function CheckoutBar() {
  const { totalItems, totalCents, openCart } = useCart();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useT();
  const hiddenRoute =
    pathname === "/checkout" || pathname.startsWith("/order/");
  const isVisible = totalItems > 0 && !hiddenRoute;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.aside
          initial={{ opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 360, damping: 30 }}
          aria-label={t.cart.checkoutSummary}
          className="fixed inset-x-3 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-lg items-center gap-2 rounded-full border border-cream/10 bg-ink/95 p-2 pl-4 text-cream shadow-[0_18px_45px_-20px_rgba(18,26,37,0.7)] backdrop-blur-md"
        >
          <button
            type="button"
            onClick={openCart}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-matcha"
          >
            <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cream/10">
              <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" aria-hidden="true">
                <path
                  d="M6 8 h12 l-1.2 11 a2 2 0 0 1 -2 1.8 H9.2 a2 2 0 0 1 -2 -1.8 z M9 8 V7 a3 3 0 0 1 6 0 v1"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className="min-w-0">
              <span className="block text-xs text-cream/55">
                {totalItems} {totalItems === 1 ? t.cart.item : t.cart.items}
              </span>
              <span className="block truncate font-display text-base leading-tight">
                {formatPrice(totalCents, locale)}
              </span>
            </span>
          </button>

          <Link
            href="/checkout"
            className="shrink-0 rounded-full bg-cream px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-matcha focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-matcha focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            {t.cart.checkoutNow} →
          </Link>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
