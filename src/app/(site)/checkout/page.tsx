"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { useCart } from "@/lib/cart-context";
import { formatPrice, localizedName } from "@/lib/types";
import { useLocale, useT } from "@/lib/i18n/context";
import { createOrder } from "@/lib/actions/orders";
import ProductImage from "@/components/site/ProductImage";

const inputClass =
  "w-full rounded-2xl border border-ink/15 bg-cream-light px-5 py-3.5 text-sm text-ink placeholder:text-ink/35 outline-none transition-all duration-300 focus:border-matcha-deep focus:ring-4 focus:ring-matcha/20";

export default function CheckoutPage() {
  const { lines, totalCents, clearCart } = useCart();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const locale = useLocale();
  const t = useT();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await createOrder({
        customerName: String(form.get("name") ?? ""),
        customerEmail: String(form.get("email") ?? ""),
        customerPhone: String(form.get("phone") ?? ""),
        pickupTime: String(form.get("pickup_time") ?? ""),
        notes: String(form.get("notes") ?? ""),
        marketingOptIn: form.get("marketing_opt_in") === "on",
        lines: lines.map((line) => ({
          productId: line.product.id,
          slug: line.product.slug,
          quantity: line.quantity,
        })),
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }
      clearCart();
      router.push(
        result.demo ? "/order/demo" : `/order/${result.orderId}`
      );
    });
  }

  if (lines.length === 0) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-5 px-5 text-center">
        <h1 className="font-display text-4xl text-ink">
          {t.checkout.emptyTitle}
        </h1>
        <p className="max-w-sm text-ink/60">{t.checkout.emptySub}</p>
        <Link
          href="/shop"
          className="rounded-full bg-ink px-8 py-4 text-sm font-medium text-cream transition-colors hover:bg-matcha-deep"
        >
          {t.checkout.browse}
        </Link>
      </div>
    );
  }

  return (
    <div className="px-5 pb-28 pt-36 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-matcha-deep">
            {t.checkout.eyebrow}
          </p>
          <h1 className="mt-3 font-display text-5xl text-ink">
            {t.checkout.title}
          </h1>
          <p className="mt-4 max-w-xl text-ink/60">{t.checkout.sub}</p>
        </motion.div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <motion.form
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium text-ink">
                  {t.checkout.name}
                </label>
                <input id="name" name="name" required maxLength={120} className={inputClass} placeholder={t.checkout.namePlaceholder} />
              </div>
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-ink">
                  {t.checkout.email}
                </label>
                <input id="email" name="email" type="email" required maxLength={200} className={inputClass} placeholder="you@example.com" />
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="phone" className="mb-2 block text-sm font-medium text-ink">
                  {t.checkout.phone}{" "}
                  <span className="text-ink/40">{t.checkout.optional}</span>
                </label>
                <input id="phone" name="phone" type="tel" maxLength={40} className={inputClass} placeholder="0151 23456789" />
              </div>
              <div>
                <label htmlFor="pickup_time" className="mb-2 block text-sm font-medium text-ink">
                  {t.checkout.pickupTime}
                </label>
                <input id="pickup_time" name="pickup_time" maxLength={80} className={inputClass} placeholder={t.checkout.pickupPlaceholder} />
              </div>
            </div>
            <div>
              <label htmlFor="notes" className="mb-2 block text-sm font-medium text-ink">
                {t.checkout.notes}{" "}
                <span className="text-ink/40">{t.checkout.optional}</span>
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                maxLength={500}
                className={`${inputClass} resize-none`}
                placeholder={t.checkout.notesPlaceholder}
              />
            </div>

            <label className="flex items-start gap-3 rounded-2xl bg-matcha/10 px-5 py-4 text-sm text-ink/70">
              <input
                type="checkbox"
                name="marketing_opt_in"
                className="mt-0.5 h-4 w-4 shrink-0 accent-matcha-deep"
              />
              {t.checkout.consent}
            </label>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-red-50 px-5 py-3.5 text-sm text-red-700"
              >
                {error}
              </motion.p>
            )}

            <motion.button
              type="submit"
              disabled={isPending}
              whileTap={{ scale: 0.97 }}
              className="w-full rounded-full bg-ink py-4 text-sm font-medium text-cream transition-colors duration-300 hover:bg-matcha-deep disabled:opacity-60"
            >
              {isPending
                ? t.checkout.placing
                : `${t.checkout.placeOrder} · ${formatPrice(totalCents, locale)}`}
            </motion.button>
          </motion.form>

          <motion.aside
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="h-fit rounded-3xl bg-cream-light p-7"
          >
            <h2 className="font-display text-xl text-ink">
              {t.checkout.summary}
            </h2>
            <ul className="mt-5 space-y-4">
              {lines.map((line) => (
                <li key={line.product.id} className="flex items-center gap-4">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                    <ProductImage product={line.product} className="h-full w-full" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink">
                      {localizedName(line.product, locale)}
                    </p>
                    <p className="text-xs text-ink/50">× {line.quantity}</p>
                  </div>
                  <span className="text-sm text-ink/70">
                    {formatPrice(
                      line.product.price_cents * line.quantity,
                      locale
                    )}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex items-center justify-between border-t border-ink/10 pt-5">
              <span className="text-sm text-ink/60">{t.checkout.total}</span>
              <span className="font-display text-2xl text-ink">
                {formatPrice(totalCents, locale)}
              </span>
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}
