import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/types";
import { getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;
const BAR = "#6d7f2e"; // matcha-deep — 3.9:1 on the cream-light surface

type OrderRow = { id: string; status: string; total_cents: number; created_at: string };
type ItemRow = {
  order_id: string;
  product_id: string | null;
  product_name: string;
  unit_price_cents: number;
  quantity: number;
};

/** Time-dependent aggregation, kept outside the component render. */
function timeWindows(orders: OrderRow[]) {
  const now = Date.now();
  const orders30 = orders.filter(
    (order) => now - new Date(order.created_at).getTime() < 30 * DAY_MS
  );
  const days = Array.from({ length: 14 }, (_, i) => {
    const date = new Date(now - (13 - i) * DAY_MS);
    return {
      key: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString("de-DE", {
        day: "numeric",
        month: "numeric",
      }),
      revenue: 0,
    };
  });
  const dayIndex = new Map(days.map((day, i) => [day.key, i]));
  for (const order of orders) {
    const idx = dayIndex.get(order.created_at.slice(0, 10));
    if (idx !== undefined) days[idx].revenue += order.total_cents;
  }
  return { orders30, days };
}

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const locale = await getLocale();
  const copy = locale === "de"
    ? { title: "Analysen", description: "Was sich verkauft und wann. Stornierte Bestellungen sind ausgeschlossen.", orders30: "Bestellungen · 30 Tage", revenue30: "Umsatz · 30 Tage", average: "Ø Bestellwert", mailing: "Mailingliste", emptyTitle: "Noch keine Bestellungen", empty: "Sobald Kunden online bestellen, erscheinen hier Bestseller und Tagesumsätze.", revenueDays: "Umsatz – letzte 14 Tage", mostOrdered: "Am häufigsten bestellt", allTime: "Gesamtzeitraum, nach verkaufter Menge.", categories: "Umsatz nach Kategorie" }
    : { title: "Analytics", description: "What sells, when it sells. Cancelled orders are excluded.", orders30: "Orders · 30 days", revenue30: "Revenue · 30 days", average: "Avg order value", mailing: "Mailing list", emptyTitle: "No orders yet", empty: "Once customers start ordering online, your best sellers and daily revenue will show up here.", revenueDays: "Revenue — last 14 days", mostOrdered: "Most ordered", allTime: "All time, by quantity sold.", categories: "Revenue by category" };

  const [ordersRes, itemsRes, productsRes, subsRes] = await Promise.all([
    supabase
      .from("grainbuds_orders")
      .select("id, status, total_cents, created_at")
      .neq("status", "cancelled")
      .order("created_at", { ascending: false })
      .limit(2000),
    supabase
      .from("grainbuds_order_items")
      .select("order_id, product_id, product_name, unit_price_cents, quantity")
      .limit(10000),
    supabase.from("grainbuds_products").select("id, category_id, category:grainbuds_categories(name)"),
    supabase.from("grainbuds_subscribers").select("id", { count: "exact", head: true }),
  ]);

  const orders: OrderRow[] = ordersRes.data ?? [];
  const validOrderIds = new Set(orders.map((order) => order.id));
  const items: ItemRow[] = (itemsRes.data ?? []).filter((item) =>
    validOrderIds.has(item.order_id)
  );
  const categoryOfProduct = new Map<string, string>(
    (productsRes.data ?? []).map((product) => {
      const category = product.category as { name: string } | { name: string }[] | null;
      const name = Array.isArray(category) ? category[0]?.name : category?.name;
      return [product.id as string, name ?? "Uncategorized"];
    })
  );

  // ---- headline numbers (last 30 days) ----
  const { orders30, days } = timeWindows(orders);
  const revenue30 = orders30.reduce((sum, order) => sum + order.total_cents, 0);
  const avgOrder = orders30.length ? Math.round(revenue30 / orders30.length) : 0;

  // ---- most ordered products (all time) ----
  const byProduct = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const item of items) {
    const key = item.product_id ?? item.product_name;
    const entry = byProduct.get(key) ?? { name: item.product_name, qty: 0, revenue: 0 };
    entry.qty += item.quantity;
    entry.revenue += item.quantity * item.unit_price_cents;
    byProduct.set(key, entry);
  }
  const topProducts = [...byProduct.values()]
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 8);
  const maxQty = Math.max(1, ...topProducts.map((product) => product.qty));

  // ---- revenue by category (all time) ----
  const byCategory = new Map<string, number>();
  for (const item of items) {
    const name = item.product_id
      ? categoryOfProduct.get(item.product_id) ?? "Uncategorized"
      : "Uncategorized";
    byCategory.set(
      name,
      (byCategory.get(name) ?? 0) + item.quantity * item.unit_price_cents
    );
  }
  const topCategories = [...byCategory.entries()]
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);
  const maxCategoryRevenue = Math.max(1, ...topCategories.map((c) => c.revenue));

  // ---- revenue per day, last 14 days ----
  const maxDay = Math.max(1, ...days.map((day) => day.revenue));

  const stats = [
    { label: copy.orders30, value: String(orders30.length) },
    { label: copy.revenue30, value: formatPrice(revenue30) },
    { label: copy.average, value: formatPrice(avgOrder) },
    { label: copy.mailing, value: String(subsRes.count ?? 0) },
  ];

  const hasData = items.length > 0;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-4xl text-ink">{copy.title}</h1>
      <p className="mt-2 text-ink/60">
        {copy.description}
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-3xl bg-cream-light p-6 shadow-[0_1px_0_rgba(18,26,37,0.06)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink/45">
              {stat.label}
            </p>
            <p className="mt-2 font-display text-3xl text-ink">{stat.value}</p>
          </div>
        ))}
      </div>

      {!hasData ? (
        <div className="mt-10 rounded-3xl bg-cream-light p-10 text-center">
          <p className="font-display text-2xl text-ink">{copy.emptyTitle}</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink/55">
            {copy.empty}
          </p>
        </div>
      ) : (
        <>
          {/* Revenue per day — column chart, single series */}
          <section className="mt-10 rounded-3xl bg-cream-light p-7">
            <h2 className="font-display text-2xl text-ink">
              {copy.revenueDays}
            </h2>
            <div className="mt-6 flex h-40 items-end gap-1.5">
              {days.map((day) => (
                <div
                  key={day.key}
                  className="group relative flex h-full flex-1 flex-col justify-end"
                  title={`${day.label}: ${formatPrice(day.revenue)}`}
                >
                  <div
                    className="w-full rounded-t"
                    style={{
                      backgroundColor: BAR,
                      height: `${Math.max(day.revenue > 0 ? 4 : 1, (day.revenue / maxDay) * 100)}%`,
                      opacity: day.revenue > 0 ? 1 : 0.15,
                    }}
                  />
                  <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2 py-1 text-[11px] font-medium text-cream opacity-0 transition-opacity group-hover:opacity-100">
                    {formatPrice(day.revenue)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-1.5 text-[10px] text-ink/45">
              {days.map((day, i) => (
                <span key={day.key} className="flex-1 text-center">
                  {i % 2 === 0 ? day.label : ""}
                </span>
              ))}
            </div>
          </section>

          {/* Most ordered — ranked bar list */}
          <section className="mt-8 rounded-3xl bg-cream-light p-7">
            <h2 className="font-display text-2xl text-ink">{copy.mostOrdered}</h2>
            <p className="mt-1 text-xs text-ink/50">
              {copy.allTime}
            </p>
            <ul className="mt-6 space-y-4">
              {topProducts.map((product) => (
                <li key={product.name} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1">
                  <p className="truncate text-sm font-medium text-ink">
                    {product.name}
                  </p>
                  <p className="text-right text-sm tabular-nums text-ink/70">
                    {product.qty} × · {formatPrice(product.revenue)}
                  </p>
                  <div className="col-span-2 h-2.5 overflow-hidden rounded-full bg-ink/8">
                    <div
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: BAR,
                        width: `${(product.qty / maxQty) * 100}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Revenue by category — ranked bar list */}
          <section className="mt-8 rounded-3xl bg-cream-light p-7">
            <h2 className="font-display text-2xl text-ink">
              {copy.categories}
            </h2>
            <ul className="mt-6 space-y-4">
              {topCategories.map((category) => (
                <li key={category.name} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1">
                  <p className="truncate text-sm font-medium text-ink">
                    {category.name}
                  </p>
                  <p className="text-right text-sm tabular-nums text-ink/70">
                    {formatPrice(category.revenue)}
                  </p>
                  <div className="col-span-2 h-2.5 overflow-hidden rounded-full bg-ink/8">
                    <div
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: BAR,
                        width: `${(category.revenue / maxCategoryRevenue) * 100}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
