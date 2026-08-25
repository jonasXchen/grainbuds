"use client";

import type { OrderStatus } from "@/lib/types";
import { useLocale } from "@/lib/i18n/context";
import { useOrderStatusBatch } from "@/components/admin/OrderStatusBatchProvider";

const colors: Record<OrderStatus, string> = {
  new: "bg-sand/30 text-sand-deep border-sand/50",
  in_progress: "bg-matcha/20 text-matcha-deep border-matcha/50",
  ready: "bg-matcha text-ink border-matcha",
  completed: "bg-ink/8 text-ink/55 border-ink/15",
  cancelled: "bg-red-50 text-red-500 border-red-200",
};

export default function OrderStatusSelect({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const locale = useLocale();
  const batch = useOrderStatusBatch();
  const currentStatus = batch.statusFor(orderId, status);
  const options: { value: OrderStatus; label: string }[] = locale === "de"
    ? [
        { value: "new", label: "Neu" },
        { value: "in_progress", label: "In Bearbeitung" },
        { value: "ready", label: "Bereit" },
        { value: "completed", label: "Abgeschlossen" },
        { value: "cancelled", label: "Storniert" },
      ]
    : [
        { value: "new", label: "New" },
        { value: "in_progress", label: "In progress" },
        { value: "ready", label: "Ready" },
        { value: "completed", label: "Completed" },
        { value: "cancelled", label: "Cancelled" },
      ];

  return (
    <select
      value={currentStatus}
      onChange={(event) => batch.setStatus(orderId, event.target.value as OrderStatus)}
      className={`min-h-9 cursor-pointer rounded-full border px-3.5 py-2 text-xs font-medium outline-none transition-colors ${colors[currentStatus]} ${
        currentStatus !== status ? "ring-2 ring-sand-deep/30 ring-offset-1" : ""
      }`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
