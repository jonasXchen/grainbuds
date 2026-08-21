"use client";

import { useTransition } from "react";
import { updateOrderStatus } from "@/lib/actions/admin";
import type { OrderStatus } from "@/lib/types";

const options: { value: OrderStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "in_progress", label: "In progress" },
  { value: "ready", label: "Ready for pickup" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

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
  const [isPending, startTransition] = useTransition();

  return (
    <select
      value={status}
      disabled={isPending}
      onChange={(event) => {
        const form = new FormData();
        form.set("id", orderId);
        form.set("status", event.target.value);
        startTransition(async () => {
          await updateOrderStatus(form);
        });
      }}
      className={`cursor-pointer rounded-full border px-3.5 py-2 text-xs font-medium outline-none transition-colors disabled:opacity-50 ${colors[status]}`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
