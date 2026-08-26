import Link from "next/link";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getT } from "@/lib/i18n/server";
import {
  formatPrice,
  localizedSelectedOption,
  type Order,
  type OrderStatus,
} from "@/lib/types";
import Reveal from "@/components/site/Reveal";
import OrderEditForm from "@/components/site/OrderEditForm";
import OrderStatusRefresh from "@/components/site/OrderStatusRefresh";
import OrderAccountPrompt from "@/components/site/OrderAccountPrompt";
import OrderEditLoginGate from "@/components/site/OrderEditLoginGate";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type OrderQueueStatus = {
  active: boolean;
  position: number;
  waiting_minutes: number;
};

function OrderProgress({
  status,
  labels,
}: {
  status: OrderStatus;
  labels: [string, string, string];
}) {
  const activeStage =
    status === "new" ? 0 : status === "in_progress" ? 1 : status === "cancelled" ? -1 : 2;

  return (
    <ol className={`mt-5 grid grid-cols-3 ${status === "cancelled" ? "opacity-40" : ""}`}>
      {labels.map((label, index) => {
        const reached = activeStage >= index;
        const current = activeStage === index;
        return (
          <li
            key={label}
            aria-current={current ? "step" : undefined}
            className="relative flex min-w-0 flex-col items-center text-center"
          >
            {index < labels.length - 1 && (
              <span
                aria-hidden="true"
                className={`absolute left-1/2 top-4 h-0.5 w-full ${
                  activeStage > index ? "bg-matcha-deep" : "bg-ink/10"
                }`}
              />
            )}
            <span
              className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold ${
                reached
                  ? "border-matcha-deep bg-matcha-deep text-cream"
                  : "border-ink/15 bg-cream-light text-ink/35"
              } ${current ? "ring-4 ring-matcha/20" : ""}`}
            >
              {activeStage > index ? "✓" : index + 1}
            </span>
            <span className={`mt-2 px-1 text-[11px] leading-tight sm:text-xs ${reached ? "font-medium text-ink" : "text-ink/40"}`}>
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

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

async function getOrderQueueStatus(id: string): Promise<OrderQueueStatus | null> {
  if (!UUID_PATTERN.test(id) || !hasSupabaseEnv()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("grainbuds_order_queue_status", {
    p_order_id: id,
  });
  if (error || !data || typeof data !== "object") return null;
  return data as OrderQueueStatus;
}

async function getEditAccess(order: Order | null): Promise<{
  signedIn: boolean;
  canEdit: boolean;
}> {
  if (!order || !hasSupabaseEnv()) return { signedIn: false, canEdit: false };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { signedIn: false, canEdit: false };

  const verifiedEmail = user.email?.trim().toLowerCase();
  if (verifiedEmail && verifiedEmail === order.customer_email.trim().toLowerCase()) {
    return { signedIn: true, canEdit: true };
  }

  const admin = createAdminClient();
  if (!admin) return { signedIn: true, canEdit: false };
  const { data } = await admin
    .from("grainbuds_orders")
    .select("customer_user_id")
    .eq("id", order.id)
    .maybeSingle();

  return {
    signedIn: true,
    canEdit: data?.customer_user_id === user.id,
  };
}

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [order, queueStatus, { locale, t }] = await Promise.all([
    getOrder(id),
    getOrderQueueStatus(id),
    getT(),
  ]);
  const editAccess = await getEditAccess(order);
  const isDemo = id === "demo";
  const isDineIn = order?.fulfillment_type === "dine_in";
  const isEditable = Boolean(
    order && ["new", "in_progress"].includes(order.status)
  );

  return (
    <div className="flex min-h-dvh items-center justify-center px-5 py-32 sm:px-8">
      {order && ["new", "in_progress"].includes(order.status) && (
        <OrderStatusRefresh />
      )}
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
          </h1>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="mt-5 text-ink/60">
            {isDemo ? t.order.subDemo : t.order.sub}
          </p>
        </Reveal>

        {queueStatus?.active && (
          <Reveal delay={0.25} className="mt-8 rounded-3xl border border-matcha/35 bg-matcha/10 p-5 text-left sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-matcha-deep">
              {t.order.liveQueue}
            </p>
            <div className="mt-4 grid grid-cols-2 divide-x divide-ink/10">
              <div className="pr-4">
                <p className="text-xs text-ink/50">{t.order.queuePosition}</p>
                <p className="mt-1 font-display text-3xl text-ink">
                  #{queueStatus.position}
                </p>
              </div>
              <div className="pl-4">
                <p className="text-xs text-ink/50">{t.order.estimatedWait}</p>
                <p className="mt-1 whitespace-nowrap font-display text-3xl text-ink">
                  ~{queueStatus.waiting_minutes}{" "}
                  <span className="font-sans text-sm">
                    {queueStatus.waiting_minutes === 1
                      ? t.order.minute
                      : t.order.minutes}
                  </span>
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs text-ink/45">{t.order.queueRefresh}</p>
          </Reveal>
        )}

        {order && (
          <Reveal delay={0.3} className="mt-8 rounded-3xl bg-cream-light p-7 text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sand-deep">
              {t.order.orderFor} {order.customer_name}
            </p>
            <div className="mt-3 flex items-center justify-between rounded-full bg-cream px-4 py-2 text-sm">
              <span className="text-ink/55">{t.order.status}</span>
              <span className="font-medium text-matcha-deep">
                {t.order.statuses[order.status]}
              </span>
            </div>
            <OrderProgress
              status={order.status}
              labels={[
                t.order.progress.orderSent,
                t.order.progress.inPreparation,
                isDineIn
                  ? t.order.progress.readyForDineIn
                  : t.order.progress.readyForPickup,
              ]}
            />
            <p className="mt-5 rounded-2xl bg-cream px-4 py-3 text-sm text-ink/60">
              <span className="font-medium text-ink">{t.order.fulfillment}:</span>{" "}
              {order.table_number
                ? `${t.order.fulfillmentTypes.dine_in} · ${t.order.table} ${order.table_number}`
                : t.order.fulfillmentTypes[order.fulfillment_type ?? "pickup"]}
            </p>
            <ul className="mt-4 space-y-2.5">
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
                  <span className="text-ink/60">
                    {formatPrice(item.unit_price_cents * item.quantity, locale)}
                  </span>
                </li>
              ))}
            </ul>
            {Boolean(order.loyalty_reward_cents) && (
              <div className="mt-4 flex items-center justify-between rounded-2xl bg-matcha/10 px-4 py-3 text-sm font-medium text-matcha-deep">
                <span>{t.order.loyaltyReward}</span>
                <span>−{formatPrice(order.loyalty_reward_cents ?? 0, locale)}</span>
              </div>
            )}
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
            {order.customer_email && isEditable && editAccess.canEdit ? (
              <OrderEditForm
                order={order}
                labels={{
                  title: t.order.editTitle,
                  hint: t.order.editHint,
                  name: t.order.name,
                  email: t.order.email,
                  phone: t.order.phone,
                  pickup: t.order.pickup,
                  notes: t.order.notes,
                  save: t.order.save,
                  saving: t.order.saving,
                }}
              />
            ) : isEditable ? (
              <OrderEditLoginGate signedIn={editAccess.signedIn} />
            ) : (
              <p className="mt-5 rounded-2xl bg-cream px-4 py-3 text-sm text-ink/55">
                {t.order.editLocked}
              </p>
            )}
          </Reveal>
        )}

        {order && (!isEditable || editAccess.canEdit) && (
          <Reveal delay={0.35}>
            <OrderAccountPrompt />
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
