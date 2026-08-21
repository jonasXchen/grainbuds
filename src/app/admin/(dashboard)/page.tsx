import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, type Order } from "@/lib/types";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  new: "New",
  in_progress: "In progress",
  ready: "Ready",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default async function AdminOverviewPage() {
  const supabase = await createClient();

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
    { label: "Products", value: productCount ?? 0 },
    { label: "Live on the shop", value: activeCount ?? 0 },
    { label: "Open orders", value: openOrders },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-4xl text-ink">Overview</h1>
      <p className="mt-2 text-ink/60">
        How the café looks right now.
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
          + Add a product
        </Link>
        <Link
          href="/admin/orders"
          className="rounded-full border border-ink/20 px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-cream"
        >
          View orders
        </Link>
      </div>

      <div className="mt-12">
        <h2 className="font-display text-2xl text-ink">Latest orders</h2>
        {orders.length === 0 ? (
          <p className="mt-4 rounded-3xl bg-cream-light p-6 text-sm text-ink/55">
            No orders yet. When customers order online, they&apos;ll show up
            here.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-ink/8 overflow-hidden rounded-3xl bg-cream-light">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href="/admin/orders"
                  className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-matcha/10"
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
                      {statusLabels[order.status] ?? order.status}
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
