import Link from "next/link";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { formatPrice, type Order } from "@/lib/types";
import Reveal from "@/components/site/Reveal";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getOrder(id: string): Promise<Order | null> {
  if (!UUID_PATTERN.test(id) || !hasSupabaseEnv()) return null;
  const supabase = await createClient();
  // Security-definer lookup: needs the exact order id and returns only the
  // fields shown here — orders can't be listed with the public key.
  const { data } = await supabase.rpc("grainbuds_order_confirmation", {
    order_id: id,
  });
  return (data as Order | null) ?? null;
}

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [order, { locale, t }] = await Promise.all([getOrder(id), getT()]);
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
            {t.order.titleA}
            <br />
            <span className="text-matcha-deep">{t.order.titleB}</span>
          </h1>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="mt-5 text-ink/60">
            {isDemo ? t.order.subDemo : t.order.sub}
          </p>
        </Reveal>

        {order && (
          <Reveal delay={0.3} className="mt-8 rounded-3xl bg-cream-light p-7 text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sand-deep">
              {t.order.orderFor} {order.customer_name}
            </p>
            <ul className="mt-4 space-y-2.5">
              {order.order_items?.map((item) => (
                <li key={item.id} className="flex justify-between text-sm">
                  <span className="text-ink/75">
                    {item.quantity} × {item.product_name}
                  </span>
                  <span className="text-ink/60">
                    {formatPrice(item.unit_price_cents * item.quantity, locale)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex justify-between border-t border-ink/10 pt-4">
              <span className="text-sm text-ink/60">{t.order.total}</span>
              <span className="font-display text-xl text-ink">
                {formatPrice(order.total_cents, locale)}
              </span>
            </div>
            {order.pickup_time && (
              <p className="mt-4 text-sm text-ink/55">
                {t.order.pickup}: {order.pickup_time}
              </p>
            )}
          </Reveal>
        )}

        <Reveal delay={0.4} className="mt-9">
          <Link
            href="/"
            className="rounded-full bg-ink px-8 py-4 text-sm font-medium text-cream transition-colors hover:bg-matcha-deep"
          >
            {t.order.back}
          </Link>
        </Reveal>
      </div>
    </div>
  );
}
