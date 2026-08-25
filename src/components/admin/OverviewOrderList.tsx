"use client";

import { useState } from "react";
import type { Locale, Order } from "@/lib/types";
import { formatPrice, localizedSelectedOption } from "@/lib/types";
import OrderStatusBatchProvider from "@/components/admin/OrderStatusBatchProvider";
import OrderStatusSelect from "@/components/admin/OrderStatusSelect";
import DeleteOrderButton from "@/components/admin/DeleteOrderButton";

type OverviewOrderLabels = {
  batchChangedOne: string;
  batchChangedMany: string;
  batchSave: string;
  batchSaving: string;
  batchError: string;
  deleteOrder: string;
  deletingOrder: string;
  deleteConfirmTitle: string;
  deleteConfirm: string;
  deleteCancel: string;
  deleteConfirmAction: string;
  deleteError: string;
  table: string;
  dineIn: string;
  pickup: string;
  qr: string;
  note: string;
  reward: string;
};

export default function OverviewOrderList({
  orders,
  locale,
  labels,
}: {
  orders: Order[];
  locale: Locale;
  labels: OverviewOrderLabels;
}) {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  return (
    <OrderStatusBatchProvider
      labels={{
        changedOne: labels.batchChangedOne,
        changedMany: labels.batchChangedMany,
        save: labels.batchSave,
        saving: labels.batchSaving,
        error: labels.batchError,
      }}
    >
      <ul className="mt-4 divide-y divide-ink/8 overflow-hidden rounded-3xl bg-cream-light">
        {orders.map((order) => {
          const isExpanded = expandedOrderId === order.id;
          return (
            <li key={order.id}>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-6 py-4">
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  aria-controls={`overview-order-${order.id}`}
                  onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                  className="flex min-w-0 basis-full items-center gap-3 text-left sm:flex-1 sm:basis-auto"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">
                      {order.customer_name}
                    </span>
                    <span className="block text-xs text-ink/50">
                      {new Date(order.created_at).toLocaleString(
                        locale === "de" ? "de-DE" : "en-IE"
                      )}
                    </span>
                  </span>
                </button>
                <div className="flex w-full flex-nowrap items-center justify-between gap-2 sm:w-auto sm:justify-end sm:gap-3">
                  <span className="shrink-0 text-sm text-ink/70">
                    {formatPrice(order.total_cents, locale)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <OrderStatusSelect orderId={order.id} status={order.status} />
                    <DeleteOrderButton
                      orderId={order.id}
                      labels={{
                        delete: labels.deleteOrder,
                        deleting: labels.deletingOrder,
                        confirmTitle: labels.deleteConfirmTitle,
                        confirm: labels.deleteConfirm,
                        cancel: labels.deleteCancel,
                        confirmDelete: labels.deleteConfirmAction,
                        error: labels.deleteError,
                      }}
                    />
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div
                  id={`overview-order-${order.id}`}
                  className="border-t border-ink/8 bg-white/35 px-6 py-5"
                >
                  <div className="flex flex-wrap gap-2 text-xs font-medium">
                    <span className="rounded-full bg-matcha/15 px-3 py-1.5 text-matcha-deep">
                      {order.table_number
                        ? `${labels.table} ${order.table_number}`
                        : order.fulfillment_type === "dine_in"
                          ? labels.dineIn
                          : labels.pickup}
                    </span>
                    {order.pickup_time && (
                      <span className="rounded-full bg-sand/20 px-3 py-1.5 text-sand-deep">
                        {labels.pickup}: {order.pickup_time}
                      </span>
                    )}
                    {order.order_source?.startsWith("qr_") && (
                      <span className="rounded-full bg-sand/20 px-3 py-1.5 text-sand-deep">
                        {labels.qr}{order.qr_campaign ? ` · ${order.qr_campaign}` : ""}
                      </span>
                    )}
                  </div>

                  <p className="mt-4 break-all text-xs text-ink/55">
                    {order.customer_email}
                    {order.customer_phone ? ` · ${order.customer_phone}` : ""}
                  </p>

                  {order.order_items && order.order_items.length > 0 && (
                    <ul className="mt-4 space-y-2 border-t border-ink/8 pt-4">
                      {order.order_items.map((item) => (
                        <li key={item.id} className="flex justify-between gap-4 text-sm">
                          <span className="text-ink/75">
                            {item.quantity} × {item.product_name}
                            {item.selected_options && item.selected_options.length > 0 && (
                              <span className="mt-0.5 block text-xs text-ink/45">
                                {item.selected_options.map((option) => localizedSelectedOption(option, locale)).join(" · ")}
                              </span>
                            )}
                          </span>
                          <span className="shrink-0 text-ink/50">
                            {formatPrice(item.unit_price_cents * item.quantity, locale)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {Boolean(order.loyalty_reward_cents) && (
                    <div className="mt-4 flex items-center justify-between rounded-2xl bg-matcha/10 px-4 py-3 text-sm font-medium text-matcha-deep">
                      <span>{labels.reward}</span>
                      <span>−{formatPrice(order.loyalty_reward_cents ?? 0, locale)}</span>
                    </div>
                  )}

                  {order.notes && (
                    <p className="mt-4 rounded-2xl bg-sand/10 px-4 py-3 text-sm text-ink/70">
                      <span className="font-medium text-sand-deep">{labels.note}:</span>{" "}
                      {order.notes}
                    </p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </OrderStatusBatchProvider>
  );
}
