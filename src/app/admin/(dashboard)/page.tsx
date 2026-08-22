import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, type Order } from "@/lib/types";
import { getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const locale = await getLocale();
  const copy = locale === "de"
    ? {
        title: "Übersicht",
        description: "So sieht es im Café gerade aus.",
        products: "Produkte",
        live: "Im Shop sichtbar",
        openOrders: "Offene Bestellungen",
        addProduct: "+ Produkt hinzufügen",
        viewOrders: "Bestellungen ansehen",
        latest: "Neueste Bestellungen",
        empty: "Noch keine Bestellungen. Online-Bestellungen erscheinen hier.",
        statuses: { new: "Neu", in_progress: "In Bearbeitung", ready: "Bereit", completed: "Abgeschlossen", cancelled: "Storniert" },
      }
    : {
        title: "Overview",
        description: "How the café looks right now.",
        products: "Products",
        live: "Live on the shop",
        openOrders: "Open orders",
        addProduct: "+ Add a product",
        viewOrders: "View orders",
        latest: "Latest orders",
        empty: "No orders yet. When customers order online, they’ll show up here.",
        statuses: { new: "New", in_progress: "In progress", ready: "Ready", completed: "Completed", cancelled: "Cancelled" },
      };

  const [{ count: productCount }, { count: activeCount }, ordersRes] =
    await Promise.all([
      supabase.from("grainbuds_products").select("id", { count: "exact", head: true }),
      supabase
        .from("grainbuds_products")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      supabase
        .from("grainbuds_orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

  const orders: Order[] = ordersRes.data ?? [];
  const openOrders = orders.filter(
    (order) => order.status === "new" || order.status === "in_progress"
  ).length;

  const stats = [
    { label: copy.products, value: productCount ?? 0 },
    { label: copy.live, value: activeCount ?? 0 },
    { label: copy.openOrders, value: openOrders },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-4xl text-ink">{copy.title}</h1>
      <p className="mt-2 text-ink/60">
        {copy.description}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-3xl bg-cream-light p-6 shadow-[0_1px_0_rgba(18,26,37,0.06)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">
              {stat.label}
            </p>
            <p className="mt-2 font-display text-4xl text-ink">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/admin/products/new"
          className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-cream transition-colors hover:bg-matcha-deep"
        >
          {copy.addProduct}
        </Link>
        <Link
          href="/admin/orders"
          className="rounded-full border border-ink/20 px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-cream"
        >
          {copy.viewOrders}
        </Link>
      </div>

      <div className="mt-12">
        <h2 className="font-display text-2xl text-ink">{copy.latest}</h2>
        {orders.length === 0 ? (
          <p className="mt-4 rounded-3xl bg-cream-light p-6 text-sm text-ink/55">
            {copy.empty}
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-ink/8 overflow-hidden rounded-3xl bg-cream-light">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href="/admin/orders"
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 px-6 py-4 transition-colors hover:bg-matcha/10"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {order.customer_name}
                    </p>
                    <p className="text-xs text-ink/50">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-ink/70">
                      {formatPrice(order.total_cents)}
                    </span>
                    <span className="rounded-full bg-ink/8 px-3 py-1 text-xs font-medium text-ink/70">
                      {copy.statuses[order.status as keyof typeof copy.statuses] ?? order.status}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
