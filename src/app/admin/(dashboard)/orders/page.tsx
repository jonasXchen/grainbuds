import { createClient } from "@/lib/supabase/server";
import { formatPrice, localizedSelectedOption, type Locale, type Order } from "@/lib/types";
import OrderStatusSelect from "@/components/admin/OrderStatusSelect";
import { getLocale } from "@/lib/i18n/server";
import OrderStatusBatchProvider from "@/components/admin/OrderStatusBatchProvider";
import DeleteOrderButton from "@/components/admin/DeleteOrderButton";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const supabase = await createClient();
  const locale = await getLocale();
  const copy = locale === "de"
    ? { title: "Bestellungen", description: "Status für mehrere Bestellungen auswählen und anschließend gemeinsam speichern. Abgeschlossen wird automatisch bezahlt, storniert automatisch erstattet.", open: "Offen", done: "Erledigt", noOpen: "Zurzeit keine offenen Bestellungen.", noDone: "Noch keine abgeschlossenen Bestellungen.", table: "Tisch", dineIn: "Vor Ort", pickup: "Abholung", qr: "QR", note: "Hinweis", reward: "11. Getränk gratis", batchChangedOne: "Bestellung geändert", batchChangedMany: "Bestellungen geändert", batchSave: "Änderungen speichern", batchSaving: "Speichert…", batchError: "Einige Änderungen konnten nicht gespeichert werden.", deleteOrder: "Bestellung löschen", deletingOrder: "Wird gelöscht…", deleteConfirmTitle: "Bestellung wirklich löschen?", deleteConfirm: "Diese Bestellung wird dauerhaft entfernt. Zugehörige Artikel und Treuepunkte werden sicher ausgeglichen.", deleteCancel: "Behalten", deleteConfirmAction: "Endgültig löschen", deleteError: "Die Bestellung konnte nicht gelöscht werden." }
    : { title: "Orders", description: "Choose statuses for multiple orders, then save them together. Completed becomes paid automatically; cancelled becomes refunded.", open: "Open", done: "Done", noOpen: "No open orders right now—enjoy the quiet.", noDone: "Nothing completed yet.", table: "Table", dineIn: "Dine in", pickup: "Pickup", qr: "QR", note: "Note", reward: "11th drink free", batchChangedOne: "order changed", batchChangedMany: "orders changed", batchSave: "Save changes", batchSaving: "Saving…", batchError: "Some changes could not be saved.", deleteOrder: "Delete order", deletingOrder: "Deleting…", deleteConfirmTitle: "Delete this order?", deleteConfirm: "This order will be removed permanently. Its items and loyalty balance will be reconciled safely.", deleteCancel: "Keep order", deleteConfirmAction: "Delete permanently", deleteError: "The order could not be deleted." };
  const { data } = await supabase
    .from("grainbuds_orders")
    .select("*, order_items:grainbuds_order_items(*)")
    .order("created_at", { ascending: false })
    .limit(100);

  const orders: Order[] = data ?? [];
  const open = orders.filter(
    (order) => !["completed", "cancelled"].includes(order.status)
  );
  const closed = orders.filter((order) =>
    ["completed", "cancelled"].includes(order.status)
  );

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-4xl text-ink">{copy.title}</h1>
      <p className="mt-2 text-ink/60">
        {copy.description}
      </p>

      <OrderStatusBatchProvider
        labels={{
          changedOne: copy.batchChangedOne,
          changedMany: copy.batchChangedMany,
          save: copy.batchSave,
          saving: copy.batchSaving,
          error: copy.batchError,
        }}
      >
        <OrderSection title={copy.open} orders={open} emptyText={copy.noOpen} copy={copy} locale={locale} />
        <OrderSection title={copy.done} orders={closed} emptyText={copy.noDone} copy={copy} locale={locale} />
      </OrderStatusBatchProvider>
    </div>
  );
}

function OrderSection({
  title,
  orders,
  emptyText,
  copy,
  locale,
}: {
  title: string;
  orders: Order[];
  emptyText: string;
  copy: { table: string; dineIn: string; pickup: string; qr: string; note: string; reward: string; deleteOrder: string; deletingOrder: string; deleteConfirmTitle: string; deleteConfirm: string; deleteCancel: string; deleteConfirmAction: string; deleteError: string };
  locale: Locale;
}) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl text-ink">{title}</h2>
      {orders.length === 0 ? (
        <p className="mt-4 rounded-3xl bg-cream-light p-6 text-sm text-ink/55">
          {emptyText}
        </p>
      ) : (
        <ul className="mt-4 space-y-4">
          {orders.map((order) => (
            <li key={order.id} className="rounded-3xl bg-cream-light p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-display text-lg text-ink">
                    {order.customer_name}
                  </p>
                  <p className="mt-0.5 text-xs text-ink/50">
                    {new Date(order.created_at).toLocaleString()} ·{" "}
                    {order.customer_email}
                    {order.customer_phone && ` · ${order.customer_phone}`}
                  </p>
                  {order.pickup_time && (
                    <p className="mt-1.5 inline-block rounded-full bg-sand/25 px-3 py-1 text-xs font-medium text-sand-deep">
                      {copy.pickup}: {order.pickup_time}
                    </p>
                  )}
                  <p className="mt-1.5 inline-block rounded-full bg-matcha/15 px-3 py-1 text-xs font-medium text-matcha-deep">
                    {order.table_number
                      ? `${copy.table} ${order.table_number}`
                      : order.fulfillment_type === "dine_in"
                        ? copy.dineIn
                        : copy.pickup}
                  </p>
                  {order.order_source?.startsWith("qr_") && (
                    <span className="ml-2 mt-1.5 inline-block rounded-full bg-sand/20 px-3 py-1 text-xs font-medium text-sand-deep">
                      {copy.qr}{order.qr_campaign ? ` · ${order.qr_campaign}` : ""}
                    </span>
                  )}
                </div>
                <div className="flex w-full flex-nowrap items-center gap-2 sm:w-auto sm:gap-3">
                  <span className="shrink-0 font-display text-xl text-ink">
                    {formatPrice(order.total_cents)}
                  </span>
                  <div className="ml-auto flex items-center gap-1.5 sm:ml-0">
                    <OrderStatusSelect orderId={order.id} status={order.status} />
                    <DeleteOrderButton
                      orderId={order.id}
                      labels={{
                        delete: copy.deleteOrder,
                        deleting: copy.deletingOrder,
                        confirmTitle: copy.deleteConfirmTitle,
                        confirm: copy.deleteConfirm,
                        cancel: copy.deleteCancel,
                        confirmDelete: copy.deleteConfirmAction,
                        error: copy.deleteError,
                      }}
                    />
                  </div>
                </div>
              </div>

              <ul className="mt-4 space-y-1.5 border-t border-ink/8 pt-4">
                {order.order_items?.map((item) => (
                  <li key={item.id} className="flex justify-between text-sm">
                    <span className="text-ink/75">
                      {item.quantity} × {item.product_name}
                      {item.selected_options && item.selected_options.length > 0 && (
                        <span className="mt-0.5 block text-xs text-ink/45">
                          {item.selected_options.map((option) => localizedSelectedOption(option, locale)).join(" · ")}
                        </span>
                      )}
                    </span>
                    <span className="text-ink/50">
                      {formatPrice(item.unit_price_cents * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              {Boolean(order.loyalty_reward_cents) && (
                <div className="mt-3 flex items-center justify-between rounded-2xl bg-matcha/10 px-4 py-3 text-sm font-medium text-matcha-deep">
                  <span>{copy.reward}</span>
                  <span>−{formatPrice(order.loyalty_reward_cents ?? 0)}</span>
                </div>
              )}

              {order.notes && (
                <p className="mt-3 rounded-2xl bg-matcha/10 px-4 py-3 text-sm text-ink/70">
                  <span className="font-medium text-matcha-deep">{copy.note}:</span>{" "}
                  {order.notes}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
