"use client";

import { useActionState, useState } from "react";
import { setLoyaltyStampBalance } from "@/lib/actions/admin";

export default function StampBalanceEditor({
  userId,
  stamps,
  labels,
}: {
  userId: string;
  stamps: number;
  labels: {
    stamps: string;
    save: string;
    saving: string;
    saved: string;
    error: string;
  };
}) {
  const [state, formAction, pending] = useActionState(
    setLoyaltyStampBalance,
    null
  );
  const [value, setValue] = useState(String(stamps));
  const saved = state?.ok === true && Number(value) === state.stamps;

  return (
    <div className="flex flex-col items-end gap-1.5">
      <form action={formAction} className="flex items-center gap-2 rounded-2xl border border-matcha/30 bg-matcha/10 p-1.5 pl-3">
        <input type="hidden" name="user_id" value={userId} />
        <label className="flex items-center gap-2 text-xs font-semibold text-matcha-deep">
          <input
            type="number"
            name="stamps"
            min="0"
            max="1000"
            step="1"
            required
            value={value}
            onChange={(event) => setValue(event.target.value)}
            aria-label={labels.stamps}
            className="w-16 rounded-xl border border-ink/10 bg-cream-light px-2 py-1.5 text-center text-sm font-semibold tabular-nums text-ink outline-none focus:border-matcha-deep"
          />
          <span>{labels.stamps}</span>
        </label>
        <button
          type="submit"
          disabled={pending}
          className="min-w-24 rounded-xl bg-matcha px-3 py-2 text-xs font-semibold text-ink transition-colors hover:bg-matcha-deep hover:text-cream disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? labels.saving : labels.save}
        </button>
      </form>
      <p
        aria-live="polite"
        className={`min-h-4 pr-2 text-xs font-medium ${
          saved
            ? "text-matcha-deep"
            : state?.ok === false
              ? "text-red-600"
              : "text-transparent"
        }`}
      >
        {saved ? `✓ ${labels.saved}` : state?.ok === false ? labels.error : "·"}
      </p>
    </div>
  );
}
