import { createClient } from "@/lib/supabase/server";
import { formatPrice, type Order } from "@/lib/types";
import OrderStatusSelect from "@/components/admin/OrderStatusSelect";
import PaymentSelect from "@/components/admin/PaymentSelect";
import { getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const supabase = await createClient();
  const locale = await getLocale();
  const copy = locale === "de"
    ? { title: "Bestellungen", description: "Neueste zuerst. Aktualisieren Sie den Status während der Bearbeitung; bezahlt wird im Café.", open: "Offen", done: "Erledigt", noOpen: "Zurzeit keine offenen Bestellungen.", noDone: "Noch keine abgeschlossenen Bestellungen.", table: "Tisch", dineIn: "Vor Ort", pickup: "Abholung", qr: "QR", note: "Hinweis" }
    : { title: "Orders", description: "Newest first. Change the status as you work through them; customers pay at the café.", open: "Open", done: "Done", noOpen: "No open orders right now—enjoy the quiet.", noDone: "Nothing completed yet.", table: "Table", dineIn: "Dine in", pickup: "Pickup", qr: "QR", note: "Note" };
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

      <OrderSection title={copy.open} orders={open} emptyText={copy.noOpen} copy={copy} />
      <OrderSection title={copy.done} orders={closed} emptyText={copy.noDone} copy={copy} />
    </div>
  );
}

function OrderSection({
  title,
  orders,
  emptyText,
  copy,
}: {
  title: string;
  orders: Order[];
  emptyText: string;
  copy: { table: string; dineIn: string; pickup: string; qr: string; note: string };
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
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-display text-xl text-ink">
                    {formatPrice(order.total_cents)}
                  </span>
                  <PaymentSelect order={order} />
                  <OrderStatusSelect orderId={order.id} status={order.status} />
                </div>
              </div>

              <ul className="mt-4 space-y-1.5 border-t border-ink/8 pt-4">
                {order.order_items?.map((item) => (
                  <li key={item.id} className="flex justify-between text-sm">
                    <span className="text-ink/75">
                      {item.quantity} × {item.product_name}
                    </span>
                    <span className="text-ink/50">
                      {formatPrice(item.unit_price_cents * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

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
