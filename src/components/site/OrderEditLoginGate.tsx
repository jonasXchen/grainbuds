"use client";

import { useLoyalty } from "@/lib/loyalty-context";
import { useT } from "@/lib/i18n/context";

export default function OrderEditLoginGate({
  signedIn,
}: {
  signedIn: boolean;
}) {
  const { open } = useLoyalty();
  const t = useT();

  return (
    <div className="mt-5 rounded-2xl border border-matcha/30 bg-matcha/10 p-5">
      <p className="font-medium text-ink">{t.order.editLoginTitle}</p>
      <p className="mt-2 text-sm leading-6 text-ink/55">
        {signedIn ? t.order.editWrongAccount : t.order.editLoginHint}
      </p>
      <button
        type="button"
        onClick={open}
        className="mt-4 rounded-full bg-ink px-5 py-3 text-sm font-medium text-cream transition-colors hover:bg-matcha-deep"
      >
        {signedIn ? t.order.openAccount : t.order.editLoginCta}
      </button>
    </div>
  );
}
