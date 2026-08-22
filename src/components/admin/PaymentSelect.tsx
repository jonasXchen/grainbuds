"use client";

import { useTransition } from "react";
import { updateOrderPayment } from "@/lib/actions/admin";
import type { Order } from "@/lib/types";
import { useLocale } from "@/lib/i18n/context";

export default function PaymentSelect({ order }: { order: Order }) {
  const [isPending, startTransition] = useTransition();
  const locale = useLocale();
  const options = locale === "de"
    ? [
        { value: "unpaid:", label: "Unbezahlt" },
        { value: "paid:cash", label: "Bezahlt · bar" },
        { value: "paid:card", label: "Bezahlt · Karte" },
        { value: "refunded:", label: "Erstattet" },
      ]
    : [
        { value: "unpaid:", label: "Unpaid" },
        { value: "paid:cash", label: "Paid · cash" },
        { value: "paid:card", label: "Paid · card" },
        { value: "refunded:", label: "Refunded" },
      ];
  const current = `${order.payment_status ?? "unpaid"}:${
    order.payment_status === "paid" ? order.payment_method ?? "" : ""
  }`;

  const color =
    order.payment_status === "paid"
      ? "bg-matcha/20 text-matcha-deep border-matcha/50"
      : order.payment_status === "refunded"
        ? "bg-red-50 text-red-500 border-red-200"
        : "bg-white text-ink/60 border-ink/15";

  return (
    <select
      value={current}
      disabled={isPending}
      onChange={(event) => {
        const form = new FormData();
        form.set("id", order.id);
        form.set("payment", event.target.value);
        startTransition(async () => {
          await updateOrderPayment(form);
        });
      }}
      className={`min-h-9 cursor-pointer rounded-full border px-3.5 py-2 text-xs font-medium outline-none transition-colors disabled:opacity-50 ${color}`}
      title={locale === "de" ? "Zahlung im Café erfassen" : "Record payment at the café"}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
