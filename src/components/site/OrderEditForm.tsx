"use client";

import { useActionState } from "react";
import {
  updateCustomerOrder,
  type EditOrderState,
} from "@/lib/actions/orders";
import type { Order } from "@/lib/types";

type Labels = {
  title: string;
  hint: string;
  name: string;
  email: string;
  phone: string;
  pickup: string;
  notes: string;
  save: string;
  saving: string;
};

const inputClass =
  "w-full rounded-2xl border border-ink/15 bg-white px-4 py-3 text-sm text-ink outline-none transition-all focus:border-matcha-deep focus:ring-4 focus:ring-matcha/20";

export default function OrderEditForm({
  order,
  labels,
}: {
  order: Order;
  labels: Labels;
}) {
  const [state, formAction, pending] = useActionState<EditOrderState, FormData>(
    updateCustomerOrder,
    null
  );

  return (
    <details className="mt-5 rounded-2xl border border-ink/10 bg-cream p-5">
      <summary className="cursor-pointer font-medium text-ink marker:text-matcha-deep">
        {labels.title}
      </summary>
      <p className="mt-3 text-sm leading-relaxed text-ink/55">{labels.hint}</p>

      <form action={formAction} className="mt-5 space-y-4">
        <input type="hidden" name="order_id" value={order.id} />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-ink">
            {labels.name}
            <input
              name="customer_name"
              required
              maxLength={120}
              defaultValue={order.customer_name}
              className={`${inputClass} mt-2`}
            />
          </label>
          <label className="text-sm font-medium text-ink">
            {labels.email}
            <input
              name="customer_email"
              type="email"
              required
              maxLength={200}
              defaultValue={order.customer_email}
              className={`${inputClass} mt-2`}
            />
          </label>
          <label className="text-sm font-medium text-ink">
            {labels.phone}
            <input
              name="customer_phone"
              type="tel"
              maxLength={40}
              defaultValue={order.customer_phone ?? ""}
              className={`${inputClass} mt-2`}
            />
          </label>
          <label className="text-sm font-medium text-ink">
            {labels.pickup}
            <input
              name="pickup_time"
              maxLength={80}
              defaultValue={order.pickup_time ?? ""}
              className={`${inputClass} mt-2`}
            />
          </label>
        </div>
        <label className="block text-sm font-medium text-ink">
          {labels.notes}
          <textarea
            name="notes"
            rows={3}
            maxLength={500}
            defaultValue={order.notes ?? ""}
            className={`${inputClass} mt-2 resize-y`}
          />
        </label>

        {state && (
          <p
            aria-live="polite"
            className={`rounded-2xl px-4 py-3 text-sm ${
              state.ok ? "bg-matcha/15 text-matcha-deep" : "bg-red-50 text-red-700"
            }`}
          >
            {state.ok ? state.message : state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-ink px-6 py-3 text-sm font-medium text-cream transition-colors hover:bg-matcha-deep disabled:opacity-60"
        >
          {pending ? labels.saving : labels.save}
        </button>
      </form>
    </details>
  );
}
