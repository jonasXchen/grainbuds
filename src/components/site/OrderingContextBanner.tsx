"use client";

import { useCart } from "@/lib/cart-context";
import { useLocale } from "@/lib/i18n/context";

export default function OrderingContextBanner() {
  const { orderingContext } = useCart();
  const locale = useLocale();

  if (!orderingContext) return null;

  const isTable = orderingContext.source === "qr_table";
  return (
    <div className="mb-8 rounded-2xl border border-matcha/40 bg-matcha/15 px-5 py-4 text-center text-sm text-ink/75">
      <span className="font-semibold text-matcha-deep">
        {isTable
          ? locale === "de"
            ? `Bestellung für Tisch ${orderingContext.tableNumber}`
            : `Ordering for table ${orderingContext.tableNumber}`
          : locale === "de"
            ? "Online-Bestellung"
            : "Online ordering"}
      </span>{" "}
      ·{" "}
      {isTable
        ? locale === "de"
          ? "Wir bringen die Bestellung an Ihren Tisch."
          : "We’ll bring the order to your table."
        : locale === "de"
          ? "Zur Abholung an der Theke."
          : "Collect at the counter."}
    </div>
  );
}
