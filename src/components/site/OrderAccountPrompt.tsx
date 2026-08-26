"use client";

import Link from "next/link";
import { useLoyalty } from "@/lib/loyalty-context";
import { useT } from "@/lib/i18n/context";

export default function OrderAccountPrompt() {
  const { enabled, user, loading, open } = useLoyalty();
  const t = useT();

  if (!enabled || loading) return null;

  return (
    <div className="mt-6 rounded-3xl border border-matcha/30 bg-matcha/10 p-5 text-left sm:p-6">
      <p className="font-display text-xl text-ink">
        {user ? t.order.accountReadyTitle : t.order.accountTitle}
      </p>
      <p className="mt-2 text-sm leading-6 text-ink/60">
        {user ? t.order.accountReadySub : t.order.accountSub}
      </p>
      {user ? (
        <Link
          href="/orders"
          className="mt-4 inline-flex rounded-full bg-ink px-5 py-3 text-sm font-medium text-cream transition-colors hover:bg-matcha-deep"
        >
          {t.order.allOrders} →
        </Link>
      ) : (
        <button
          type="button"
          onClick={open}
          className="mt-4 rounded-full bg-ink px-5 py-3 text-sm font-medium text-cream transition-colors hover:bg-matcha-deep"
        >
          {t.order.accountCta}
        </button>
      )}
    </div>
  );
}
