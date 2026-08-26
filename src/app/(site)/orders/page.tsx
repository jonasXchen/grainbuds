import Link from "next/link";
import { getCustomerOrderHistory } from "@/lib/customer-orders";
import { getT } from "@/lib/i18n/server";
import {
  formatPrice,
  localizedSelectedOption,
} from "@/lib/types";

export default async function CustomerOrdersPage() {
  const [{ signedIn, orders }, { locale, t }] = await Promise.all([
    getCustomerOrderHistory(),
    getT(),
  ]);

  return (
    <div className="min-h-dvh px-5 pb-28 pt-36 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-matcha-deep">
          {t.orders.eyebrow}
        </p>
        <h1 className="mt-3 font-display text-5xl text-ink sm:text-6xl">
          {t.orders.title}
        </h1>
        <p className="mt-4 max-w-xl text-ink/60">{t.orders.sub}</p>

        {!signedIn ? (
          <section className="mt-10 rounded-3xl bg-cream-light p-7 sm:p-9">
            <h2 className="font-display text-2xl text-ink">
              {t.orders.signedOutTitle}
            </h2>
            <p className="mt-3 text-sm leading-6 text-ink/60">
              {t.orders.signedOutSub}
            </p>
          </section>
        ) : orders.length === 0 ? (
          <section className="mt-10 rounded-3xl bg-cream-light p-7 sm:p-9">
            <h2 className="font-display text-2xl text-ink">
              {t.orders.emptyTitle}
            </h2>
            <p className="mt-3 text-sm text-ink/60">{t.orders.emptySub}</p>
          </section>
        ) : (
          <ol className="mt-10 space-y-4">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/order/${order.id}`}
                  className="group block rounded-3xl border border-ink/10 bg-cream-light p-5 transition-all hover:-translate-y-0.5 hover:border-matcha-deep/30 hover:shadow-lg sm:p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/40">
                        {new Intl.DateTimeFormat(
                          locale === "de" ? "de-DE" : "en-GB",
                          { dateStyle: "medium", timeStyle: "short" }
                        ).format(new Date(order.created_at))}
                      </p>
                      <p className="mt-2 font-display text-xl text-ink">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-matcha/15 px-3 py-1.5 text-xs font-semibold text-matcha-deep">
                      {t.order.statuses[order.status]}
                    </span>
                  </div>

                  <ul className="mt-5 space-y-2 border-t border-ink/10 pt-4">
                    {order.order_items?.map((item) => (
                      <li key={item.id} className="flex justify-between gap-4 text-sm">
                        <span className="min-w-0 text-ink/65">
                          {item.quantity} × {item.product_name}
                          {item.selected_options && item.selected_options.length > 0 && (
                            <span className="mt-0.5 block truncate text-xs text-ink/40">
                              {item.selected_options
                                .map((option) => localizedSelectedOption(option, locale))
                                .join(" · ")}
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 text-ink/55">
                          {formatPrice(item.unit_price_cents * item.quantity, locale)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5 flex items-end justify-between gap-4 border-t border-ink/10 pt-4">
                    <span className="text-sm font-medium text-matcha-deep group-hover:text-ink">
                      {t.orders.view} →
                    </span>
                    <span className="font-display text-xl text-ink">
                      {formatPrice(order.total_cents, locale)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        )}

        <Link
          href="/"
          className="mt-10 inline-flex rounded-full border border-ink/15 px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-cream"
        >
          ← {t.orders.back}
        </Link>
      </div>
    </div>
  );
}
