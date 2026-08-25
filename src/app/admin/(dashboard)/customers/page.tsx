import { createClient } from "@/lib/supabase/server";
import { formatPrice, type Subscriber } from "@/lib/types";
import CampaignForm from "@/components/admin/CampaignForm";
import CopyEmailsButton from "@/components/admin/CopyEmailsButton";
import SubscriberRow from "@/components/admin/SubscriberRow";
import { getLocale } from "@/lib/i18n/server";
import { setLoyaltyStampBalance } from "@/lib/actions/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type OrderRow = {
  customer_user_id: string | null;
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
    ? { title: "Kunden", description: "Online-Kunden, Getränkestempel und Mailingliste. Marketing-E-Mails gehen nur an Personen mit ausdrücklicher Einwilligung.", update: "Neuigkeiten senden", updateHint: "Neue Produkte, saisonale Menüs oder geänderte Öffnungszeiten – eine E-Mail an die gesamte Liste.", mailing: "Mailingliste", noSubscribers: "Noch keine Anmeldungen. Kunden können beim Checkout zustimmen.", loyaltyMembers: "Stempelkarten", noMembers: "Noch keine registrierten Stempelkarten.", everyone: "Alle Besteller", noOrders: "Noch keine Bestellungen.", subscribed: "Abonniert", order: "Bestellung", orders: "Bestellungen", stamps: "Stempel", saveStamps: "Änderungen speichern", privacy: "Datenschutzhinweis: Diese Daten dienen der Bestellabwicklung. Nur ausdrücklich angemeldete Adressen dürfen Marketing erhalten." }
    : { title: "Customers", description: "Online customers, drink stamps, and your mailing list. Marketing emails only go to people who opted in.", update: "Send an update", updateHint: "New products, seasonal menus, or changed hours—one email to the whole list.", mailing: "Mailing list", noSubscribers: "Nobody has opted in yet. Customers can join at checkout.", loyaltyMembers: "Stamp cards", noMembers: "No registered stamp cards yet.", everyone: "Everyone who ordered", noOrders: "No orders yet.", subscribed: "Subscribed", order: "order", orders: "orders", stamps: "stamps", saveStamps: "Save changes", privacy: "Privacy note: this data exists to fulfil orders. Only explicitly opted-in addresses may receive marketing." };

  const [ordersRes, subsRes, loyaltyRes, accountsRes] = await Promise.all([
    supabase
      .from("grainbuds_orders")
      .select("customer_user_id, customer_name, customer_email, customer_phone, total_cents, status, created_at")
      .neq("status", "cancelled")
      .order("created_at", { ascending: false })
      .limit(2000),
    supabase
      .from("grainbuds_subscribers")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("grainbuds_loyalty_ledger").select("user_id, delta"),
    supabase.from("grainbuds_loyalty_accounts").select("user_id, enrolled_at"),
  ]);

  const orders: OrderRow[] = ordersRes.data ?? [];
  const subscribers: Subscriber[] = subsRes.data ?? [];
  const subscribedEmails = new Set(
    subscribers.map((subscriber) => subscriber.email.toLowerCase())
  );
  const loyaltyBalances = new Map<string, number>();
  for (const entry of loyaltyRes.data ?? []) {
    loyaltyBalances.set(
      entry.user_id,
      (loyaltyBalances.get(entry.user_id) ?? 0) + Number(entry.delta)
    );
  }

  // Aggregate customers from their orders.
  const byEmail = new Map<
    string,
    { name: string; phone: string | null; userId: string | null; orders: number; total: number; last: string }
  >();
  for (const order of orders) {
    const email = order.customer_email.toLowerCase();
    const entry = byEmail.get(email);
    if (entry) {
      entry.orders += 1;
      entry.total += order.total_cents;
      if (!entry.userId && order.customer_user_id) entry.userId = order.customer_user_id;
    } else {
      byEmail.set(email, {
        name: order.customer_name,
        phone: order.customer_phone,
        userId: order.customer_user_id,
        orders: 1,
        total: order.total_cents,
        last: order.created_at,
      });
    }
  }
  const customers = [...byEmail.entries()]
    .map(([email, data]) => ({ email, ...data }))
    .sort((a, b) => b.total - a.total);
  const adminClient = createAdminClient();
  const authUsers = adminClient
    ? await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 })
    : null;
  const emailsByUserId = new Map(
    (authUsers?.data.users ?? []).map((user) => [user.id, user.email ?? ""])
  );
  const loyaltyMembers = (accountsRes.data ?? [])
    .map((account) => ({
      userId: account.user_id,
      email: emailsByUserId.get(account.user_id) || account.user_id,
      stamps: Math.max(0, loyaltyBalances.get(account.user_id) ?? 0),
      enrolledAt: account.enrolled_at,
    }))
    .sort((a, b) => b.enrolledAt.localeCompare(a.enrolledAt));

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

      <section className="mt-10">
        <h2 className="font-display text-2xl text-ink">
          {copy.loyaltyMembers}{" "}
          <span className="text-base text-ink/40">({loyaltyMembers.length})</span>
        </h2>
        {loyaltyMembers.length === 0 ? (
          <p className="mt-4 rounded-3xl bg-cream-light p-6 text-sm text-ink/55">
            {copy.noMembers}
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-ink/8 overflow-hidden rounded-3xl bg-cream-light">
            {loyaltyMembers.map((member) => (
              <li key={member.userId} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                <p className="min-w-0 truncate text-sm font-medium text-ink">{member.email}</p>
                <StampControls
                  userId={member.userId}
                  stamps={member.stamps}
                  labels={{ stamps: copy.stamps, save: copy.saveStamps }}
                />
              </li>
            ))}
          </ul>
        )}
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
                <div className="flex flex-wrap items-center justify-end gap-3">
                  <p className="text-sm tabular-nums text-ink/70">
                    {customer.orders} {customer.orders === 1 ? copy.order : copy.orders} ·{" "}
                    {formatPrice(customer.total)}
                  </p>
                  {customer.userId && (
                    <span className="rounded-full bg-matcha/10 px-3 py-1.5 text-xs font-semibold text-matcha-deep">
                      {Math.max(0, loyaltyBalances.get(customer.userId) ?? 0)} {copy.stamps}
                    </span>
                  )}
                </div>
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

function StampControls({
  userId,
  stamps,
  labels,
}: {
  userId: string;
  stamps: number;
  labels: { stamps: string; save: string };
}) {
  return (
    <form action={setLoyaltyStampBalance} className="flex items-center gap-2 rounded-2xl border border-matcha/30 bg-matcha/10 p-1.5 pl-3">
      <input type="hidden" name="user_id" value={userId} />
      <label className="flex items-center gap-2 text-xs font-semibold text-matcha-deep">
        <input
          type="number"
          name="stamps"
          min="0"
          max="1000"
          step="1"
          required
          defaultValue={stamps}
          aria-label={labels.stamps}
          className="w-16 rounded-xl border border-ink/10 bg-cream-light px-2 py-1.5 text-center text-sm font-semibold tabular-nums text-ink outline-none focus:border-matcha-deep"
        />
        <span>{labels.stamps}</span>
      </label>
      <button type="submit" className="rounded-xl bg-matcha px-3 py-2 text-xs font-semibold text-ink transition-colors hover:bg-matcha-deep hover:text-cream">
        {labels.save}
      </button>
    </form>
  );
}
