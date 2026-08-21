import Link from "next/link";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { formatPrice, type Order } from "@/lib/types";
import Reveal from "@/components/site/Reveal";

async function getOrder(id: string): Promise<Order | null> {
  if (id === "demo" || !hasSupabaseEnv()) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .maybeSingle();
  return data ?? null;
}

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrder(id);
  const isDemo = id === "demo";

  return (
    <div className="flex min-h-dvh items-center justify-center px-5 py-32 sm:px-8">
      <div className="w-full max-w-lg text-center">
        <Reveal>
          <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-matcha/20">
            <svg viewBox="0 0 32 32" className="h-9 w-9 text-matcha-deep" fill="none">
              <path
                d="M7 17 L13.5 23.5 L25 9.5"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </Reveal>
        <Reveal delay={0.1}>
          <h1 className="mt-7 font-display text-4xl leading-tight text-ink sm:text-5xl">
            Order received.
            <br />
            <span className="text-matcha-deep">The whisk is moving.</span>
          </h1>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="mt-5 text-ink/60">
            {isDemo
              ? "This is a demo order — connect Supabase to start saving real orders."
              : "We'll have everything ready for your pickup. Pay at the counter — see you soon."}
          </p>
        </Reveal>

        {order && (
          <Reveal delay={0.3} className="mt-8 rounded-3xl bg-cream-light p-7 text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sand-deep">
              Order for {order.customer_name}
            </p>
            <ul className="mt-4 space-y-2.5">
              {order.order_items?.map((item) => (
                <li key={item.id} className="flex justify-between text-sm">
                  <span className="text-ink/75">
                    {item.quantity} × {item.product_name}
                  </span>
                  <span className="text-ink/60">
                    {formatPrice(item.unit_price_cents * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex justify-between border-t border-ink/10 pt-4">
              <span className="text-sm text-ink/60">Total at pickup</span>
              <span className="font-display text-xl text-ink">
                {formatPrice(order.total_cents)}
              </span>
            </div>
            {order.pickup_time && (
              <p className="mt-4 text-sm text-ink/55">
                Pickup: {order.pickup_time}
              </p>
            )}
          </Reveal>
        )}

        <Reveal delay={0.4} className="mt-9">
          <Link
            href="/"
            className="rounded-full bg-ink px-8 py-4 text-sm font-medium text-cream transition-colors hover:bg-matcha-deep"
          >
            Back to the café
          </Link>
        </Reveal>
      </div>
    </div>
  );
}
