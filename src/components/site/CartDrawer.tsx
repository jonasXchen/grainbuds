"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/lib/cart-context";
import { formatPrice, localizedName } from "@/lib/types";
import { useLocale, useT } from "@/lib/i18n/context";
import ProductImage from "./ProductImage";

export default function CartDrawer() {
  const { lines, isOpen, closeCart, setQuantity, removeItem, totalCents } =
    useCart();
  const locale = useLocale();
  const t = useT();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={closeCart}
            className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm"
          />
          <motion.aside
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="fixed right-0 top-0 z-50 flex h-dvh w-full max-w-md flex-col bg-cream shadow-2xl"
            role="dialog"
            aria-label={t.cart.title}
          >
            <div className="flex items-center justify-between border-b border-ink/10 px-6 py-5">
              <h2 className="font-display text-2xl text-ink">{t.cart.title}</h2>
              <button
                type="button"
                onClick={closeCart}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:bg-ink hover:text-cream"
                aria-label={t.cart.close}
              >
                <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none">
                  <path
                    d="M4 4 L12 12 M12 4 L4 12"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-matcha/15">
                  <svg viewBox="0 0 24 24" className="h-7 w-7 text-matcha-deep" fill="none">
                    <path
                      d="M5 9 h14 l-1.4 10 a2 2 0 0 1 -2 1.7 H8.4 a2 2 0 0 1 -2 -1.7 z M9 9 V8 a3 3 0 0 1 6 0 v1"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <p className="font-display text-xl text-ink">{t.cart.empty}</p>
                <p className="text-sm text-ink/60">{t.cart.emptySub}</p>
                <Link
                  href="/#shop"
                  onClick={closeCart}
                  className="mt-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-cream transition-colors hover:bg-matcha-deep"
                >
                  {t.cart.browse}
                </Link>
              </div>
            ) : (
              <>
                <ul className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
                  <AnimatePresence initial={false}>
                    {lines.map((line) => (
                      <motion.li
                        key={line.product.id}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 40 }}
                        transition={{ duration: 0.3 }}
                        className="flex gap-4 rounded-2xl bg-cream-light p-3"
                      >
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                          <ProductImage
                            product={line.product}
                            className="h-full w-full"
                          />
                        </div>
                        <div className="flex flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-display text-base leading-snug text-ink">
                              {localizedName(line.product, locale)}
                            </p>
                            <button
                              type="button"
                              onClick={() => removeItem(line.product.id)}
                              className="text-ink/40 transition-colors hover:text-ink"
                              aria-label={`${t.cart.remove}: ${localizedName(line.product, locale)}`}
                            >
                              <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none">
                                <path
                                  d="M4 4 L12 12 M12 4 L4 12"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                />
                              </svg>
                            </button>
                          </div>
                          <div className="mt-auto flex items-center justify-between">
                            <div className="flex items-center gap-1 rounded-full border border-ink/15 px-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setQuantity(line.product.id, line.quantity - 1)
                                }
                                className="flex h-7 w-7 items-center justify-center text-ink/60 hover:text-ink"
                                aria-label={t.product.decrease}
                              >
                                −
                              </button>
                              <span className="w-5 text-center text-sm font-medium">
                                {line.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setQuantity(line.product.id, line.quantity + 1)
                                }
                                className="flex h-7 w-7 items-center justify-center text-ink/60 hover:text-ink"
                                aria-label={t.product.increase}
                              >
                                +
                              </button>
                            </div>
                            <span className="text-sm font-medium text-ink">
                              {formatPrice(
                                line.product.price_cents * line.quantity,
                                locale
                              )}
                            </span>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>

                <div className="border-t border-ink/10 px-6 py-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-ink/60">
                      {t.cart.subtotal}
                    </span>
                    <span className="font-display text-xl text-ink">
                      {formatPrice(totalCents, locale)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-ink/50">{t.cart.payNote}</p>
                  <Link
                    href="/checkout"
                    onClick={closeCart}
                    className="mt-4 block w-full rounded-full bg-ink py-3.5 text-center text-sm font-medium text-cream transition-colors hover:bg-matcha-deep"
                  >
                    {t.cart.continue}
                  </Link>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
