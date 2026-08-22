import { createClient } from "@/lib/supabase/server";
import { formatPrice, type Subscriber } from "@/lib/types";
import CampaignForm from "@/components/admin/CampaignForm";
import CopyEmailsButton from "@/components/admin/CopyEmailsButton";
import SubscriberRow from "@/components/admin/SubscriberRow";
import { getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

type OrderRow = {
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  total_cents: number;
  status: string;
  created_at: string;
};

export default async function CustomersPage() {
  const supabase = await createClient();
  const locale = await getLocale();
  const copy = locale === "de"
    ? { title: "Kunden", description: "Online-Kunden und Mailingliste. Marketing-E-Mails gehen nur an Personen mit ausdrücklicher Einwilligung.", update: "Neuigkeiten senden", updateHint: "Neue Produkte, saisonale Menüs oder geänderte Öffnungszeiten – eine E-Mail an die gesamte Liste.", mailing: "Mailingliste", noSubscribers: "Noch keine Anmeldungen. Kunden können beim Checkout zustimmen.", everyone: "Alle Besteller", noOrders: "Noch keine Bestellungen.", subscribed: "Abonniert", order: "Bestellung", orders: "Bestellungen", privacy: "Datenschutzhinweis: Diese Daten dienen der Bestellabwicklung. Nur ausdrücklich angemeldete Adressen dürfen Marketing erhalten." }
    : { title: "Customers", description: "People who ordered online, and your mailing list. Marketing emails only go to people who opted in.", update: "Send an update", updateHint: "New products, seasonal menus, or changed hours—one email to the whole list.", mailing: "Mailing list", noSubscribers: "Nobody has opted in yet. Customers can join at checkout.", everyone: "Everyone who ordered", noOrders: "No orders yet.", subscribed: "Subscribed", order: "order", orders: "orders", privacy: "Privacy note: this data exists to fulfil orders. Only explicitly opted-in addresses may receive marketing." };

  const [ordersRes, subsRes] = await Promise.all([
    supabase
      .from("grainbuds_orders")
      .select("customer_name, customer_email, customer_phone, total_cents, status, created_at")
      .neq("status", "cancelled")
      .order("created_at", { ascending: false })
      .limit(2000),
    supabase
      .from("grainbuds_subscribers")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  const orders: OrderRow[] = ordersRes.data ?? [];
  const subscribers: Subscriber[] = subsRes.data ?? [];
  const subscribedEmails = new Set(
    subscribers.map((subscriber) => subscriber.email.toLowerCase())
  );

  // Aggregate customers from their orders.
  const byEmail = new Map<
    string,
    { name: string; phone: string | null; orders: number; total: number; last: string }
  >();
  for (const order of orders) {
    const email = order.customer_email.toLowerCase();
    const entry = byEmail.get(email);
    if (entry) {
      entry.orders += 1;
      entry.total += order.total_cents;
    } else {
      byEmail.set(email, {
        name: order.customer_name,
        phone: order.customer_phone,
        orders: 1,
        total: order.total_cents,
        last: order.created_at,
      });
    }
  }
  const customers = [...byEmail.entries()]
    .map(([email, data]) => ({ email, ...data }))
    .sort((a, b) => b.total - a.total);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-4xl text-ink">{copy.title}</h1>
      <p className="mt-2 text-ink/60">
        {copy.description}
      </p>

      {/* Campaign */}
      <section className="mt-8 rounded-3xl bg-cream-light p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl text-ink">{copy.update}</h2>
            <p className="mt-1 text-xs text-ink/50">
              {copy.updateHint}
            </p>
          </div>
          <CopyEmailsButton
            emails={subscribers.map((subscriber) => subscriber.email)}
          />
        </div>
        <div className="mt-5">
          <CampaignForm subscriberCount={subscribers.length} />
        </div>
      </section>

      {/* Mailing list */}
      <section className="mt-8">
        <h2 className="font-display text-2xl text-ink">
          {copy.mailing}{" "}
          <span className="text-base text-ink/40">({subscribers.length})</span>
        </h2>
        {subscribers.length === 0 ? (
          <p className="mt-4 rounded-3xl bg-cream-light p-6 text-sm text-ink/55">
            {copy.noSubscribers}
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-ink/8 overflow-hidden rounded-3xl bg-cream-light">
            {subscribers.map((subscriber) => (
              <SubscriberRow key={subscriber.id} subscriber={subscriber} />
            ))}
          </ul>
        )}
      </section>

      {/* All customers */}
      <section className="mt-10">
        <h2 className="font-display text-2xl text-ink">
          {copy.everyone}{" "}
          <span className="text-base text-ink/40">({customers.length})</span>
        </h2>
        {customers.length === 0 ? (
          <p className="mt-4 rounded-3xl bg-cream-light p-6 text-sm text-ink/55">
            {copy.noOrders}
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-ink/8 overflow-hidden rounded-3xl bg-cream-light">
            {customers.map((customer) => (
              <li
                key={customer.email}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">
                    {customer.name}
                    {subscribedEmails.has(customer.email) && (
                      <span className="ml-2 rounded-full bg-matcha/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-matcha-deep">
                        {copy.subscribed}
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-ink/50">
                    {customer.email}
                    {customer.phone && ` · ${customer.phone}`}
                  </p>
                </div>
                <p className="text-sm tabular-nums text-ink/70">
                  {customer.orders} {customer.orders === 1 ? copy.order : copy.orders} ·{" "}
                  {formatPrice(customer.total)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-8 text-xs leading-relaxed text-ink/45">
        {copy.privacy}
      </p>
    </div>
  );
}
