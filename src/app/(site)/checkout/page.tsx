"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { useCart } from "@/lib/cart-context";
import { formatPrice, localizedName } from "@/lib/types";
import { useLocale, useT } from "@/lib/i18n/context";
import {
  createOrder,
  getCheckoutEstimate,
  type QueueEstimate,
} from "@/lib/actions/orders";
import ProductImage from "@/components/site/ProductImage";
import { useLoyalty } from "@/lib/loyalty-context";
import { isLoyaltyEligible, LOYALTY_REWARD_STAMPS } from "@/lib/loyalty";

const inputClass =
  "w-full rounded-2xl border border-ink/15 bg-cream-light px-5 py-3.5 text-sm text-ink placeholder:text-ink/35 outline-none transition-all duration-300 focus:border-matcha-deep focus:ring-4 focus:ring-matcha/20";

export default function CheckoutPage() {
  const {
    lines,
    totalCents,
    clearCart,
    orderingContext,
    clearOrderingContext,
  } = useCart();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [queueEstimate, setQueueEstimate] = useState<QueueEstimate | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedFulfillmentType, setSelectedFulfillmentType] = useState<
    "pickup" | "dine_in"
  >(
    "pickup"
  );
  const locale = useLocale();
  const t = useT();
  const { user, stamps } = useLoyalty();

  const loyaltyDrinkLines = lines.filter((line) => isLoyaltyEligible(line.product));
  const loyaltyDrinkCount = loyaltyDrinkLines.reduce(
    (sum, line) => sum + line.quantity,
    0
  );
  const rewardLine =
    user && stamps + loyaltyDrinkCount > LOYALTY_REWARD_STAMPS
      ? loyaltyDrinkLines
          .sort((a, b) => a.product.price_cents - b.product.price_cents)[0]
      : undefined;
  const rewardCents = rewardLine?.product.price_cents ?? 0;
  const checkoutTotalCents = Math.max(0, totalCents - rewardCents);

  useEffect(() => {
    let active = true;
    const checkoutLines = lines.map((line) => ({
      productId: line.product.id,
      slug: line.product.slug,
      quantity: line.quantity,
    }));
    getCheckoutEstimate(checkoutLines)
      .then((estimate) => {
        if (active) setQueueEstimate(estimate);
      })
      .catch(() => {
        if (active) setQueueEstimate(null);
      });
    return () => {
      active = false;
    };
  }, [lines]);

  const fulfillmentType =
    orderingContext?.source === "qr_table"
      ? "dine_in"
      : orderingContext?.source === "qr_online"
        ? "pickup"
        : selectedFulfillmentType;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await createOrder({
        customerName: String(form.get("name") ?? ""),
        customerEmail: String(form.get("email") ?? ""),
        customerPhone: "",
        pickupTime: "",
        fulfillmentType,
        tableNumber:
          orderingContext?.source === "qr_table"
            ? orderingContext.tableNumber
            : null,
        orderSource: orderingContext?.source ?? "website",
        qrCampaign: orderingContext?.campaign ?? null,
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
      clearOrderingContext();
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
          href="/#shop"
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

        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)] lg:gap-10">
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-3xl border border-matcha/35 bg-matcha/10 p-5 sm:p-6 lg:col-start-1 lg:row-start-1"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-matcha-deep">
              {t.checkout.queueTitle}
            </p>
            {queueEstimate ? (
              <div className="mt-4 grid grid-cols-2 divide-x divide-ink/10">
                <div className="min-w-0 pr-4">
                  <p className="text-xs text-ink/50">{t.checkout.queuePosition}</p>
                  <p className="mt-1 font-display text-3xl text-ink">
                    #{queueEstimate.position}
                  </p>
                </div>
                <div className="min-w-0 pl-4">
                  <p className="text-xs text-ink/50">{t.checkout.estimatedWait}</p>
                  <p className="mt-1 whitespace-nowrap font-display text-3xl text-ink">
                    ~{queueEstimate.waitingMinutes}{" "}
                    <span className="font-sans text-sm">
                      {queueEstimate.waitingMinutes === 1
                        ? t.checkout.minute
                        : t.checkout.minutes}
                    </span>
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-ink/55">
                {t.checkout.calculatingQueue}
              </p>
            )}
          </motion.section>

          <motion.form
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            onSubmit={handleSubmit}
            className="space-y-5 lg:col-start-1 lg:row-start-2"
          >
            <fieldset>
              <legend className="mb-3 text-sm font-medium text-ink">
                {t.checkout.fulfillmentTitle}
              </legend>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="relative cursor-pointer rounded-2xl border border-ink/15 bg-cream-light p-4 transition-colors has-[:checked]:border-matcha-deep has-[:checked]:bg-matcha/10 has-[:checked]:ring-2 has-[:checked]:ring-matcha/20">
                  <input
                    type="radio"
                    name="fulfillment_type"
                    value="pickup"
                    checked={fulfillmentType === "pickup"}
                    disabled={orderingContext?.source === "qr_table"}
                    onChange={() => setSelectedFulfillmentType("pickup")}
                    className="peer sr-only"
                  />
                  <span className="block text-sm font-semibold text-ink">
                    {t.checkout.pickup}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-ink/50">
                    {t.checkout.pickupDescription}
                  </span>
                </label>
                <label className="relative cursor-pointer rounded-2xl border border-ink/15 bg-cream-light p-4 transition-colors has-[:checked]:border-matcha-deep has-[:checked]:bg-matcha/10 has-[:checked]:ring-2 has-[:checked]:ring-matcha/20">
                  <input
                    type="radio"
                    name="fulfillment_type"
                    value="dine_in"
                    checked={fulfillmentType === "dine_in"}
                    disabled={orderingContext?.source === "qr_online"}
                    onChange={() => setSelectedFulfillmentType("dine_in")}
                    className="peer sr-only"
                  />
                  <span className="block text-sm font-semibold text-ink">
                    {t.checkout.dineIn}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-ink/50">
                    {t.checkout.dineInDescription}
                  </span>
                </label>
                <label className="relative cursor-not-allowed rounded-2xl border border-ink/8 bg-ink/[0.03] p-4 text-ink/35">
                  <input
                    type="radio"
                    name="fulfillment_type"
                    value="delivery"
                    disabled
                    className="sr-only"
                  />
                  <span className="block text-sm font-semibold">
                    {t.checkout.delivery}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed">
                    {t.checkout.deliveryDescription}
                  </span>
                  <span className="mt-2 inline-block rounded-full bg-ink/5 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider">
                    {t.checkout.comingSoon}
                  </span>
                </label>
              </div>
              {orderingContext?.source === "qr_table" && (
                <p className="mt-3 rounded-2xl bg-matcha/15 px-4 py-3 text-sm font-medium text-matcha-deep">
                  {locale === "de"
                    ? `Diese Bestellung wird an Tisch ${orderingContext.tableNumber} gebracht.`
                    : `This order will be brought to table ${orderingContext.tableNumber}.`}
                </p>
              )}
            </fieldset>

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
                <input
                  key={user?.email ?? "guest"}
                  id="email"
                  name="email"
                  type="email"
                  required
                  maxLength={200}
                  defaultValue={user?.email ?? ""}
                  className={inputClass}
                  placeholder="you@example.com"
                />
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
                : `${t.checkout.placeOrder} · ${formatPrice(checkoutTotalCents, locale)}`}
            </motion.button>
          </motion.form>

          <motion.aside
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="h-fit rounded-3xl bg-cream-light p-6 sm:p-7 lg:col-start-2 lg:row-span-2 lg:row-start-1"
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
            {rewardLine && (
              <div className="mt-5 rounded-2xl border border-matcha/35 bg-matcha/10 px-4 py-3">
                <div className="flex items-start justify-between gap-4 text-sm">
                  <div>
                    <p className="font-semibold text-matcha-deep">
                      {t.checkout.loyaltyReward}
                    </p>
                    <p className="mt-0.5 text-xs text-ink/55">
                      {t.checkout.lowestDrinkFree}: {localizedName(rewardLine.product, locale)}
                    </p>
                  </div>
                  <span className="shrink-0 font-medium text-matcha-deep">
                    −{formatPrice(rewardCents, locale)}
                  </span>
                </div>
              </div>
            )}
            <div className="mt-6 flex items-center justify-between border-t border-ink/10 pt-5">
              <span className="text-sm text-ink/60">{t.checkout.total}</span>
              <span className="font-display text-2xl text-ink">
                {formatPrice(checkoutTotalCents, locale)}
              </span>
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}
