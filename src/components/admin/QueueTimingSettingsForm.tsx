"use client";

import { useActionState } from "react";
import {
  saveQueueTimingSetting,
  type SettingsActionState,
} from "@/lib/actions/admin";

type QueueTimingSettingsFormProps = {
  initialMinutes: number;
  locale: "de" | "en";
};

export default function QueueTimingSettingsForm({
  initialMinutes,
  locale,
}: QueueTimingSettingsFormProps) {
  const [state, formAction, pending] = useActionState<
    SettingsActionState,
    FormData
  >(saveQueueTimingSetting, null);
  const copy = locale === "de"
    ? {
        label: "Minuten pro Getränk",
        hint: "Dieser Wert bestimmt die geschätzte Wartezeit in der Bestellübersicht und im Live-Tracker.",
        unit: "Min./Getränk",
        saving: "Wird gespeichert…",
        save: "Wartezeit speichern",
      }
    : {
        label: "Minutes per drink",
        hint: "This value determines the estimated wait shown at checkout and in the live tracker.",
        unit: "min/drink",
        saving: "Saving…",
        save: "Save waiting time",
      };

  return (
    <form action={formAction} className="mt-6 space-y-5">
      <input type="hidden" name="locale" value={locale} />
      <div>
        <label
          htmlFor="minutes-per-drink"
          className="block text-sm font-medium text-ink"
        >
          {copy.label}
        </label>
        <p className="mt-1 text-sm leading-relaxed text-ink/55">
          {copy.hint}
        </p>
        <div className="mt-3 flex max-w-xs items-center gap-3">
          <input
            id="minutes-per-drink"
            name="minutes_per_drink"
            type="number"
            min="0.1"
            max="10"
            step="0.1"
            required
            defaultValue={initialMinutes}
            className="w-28 rounded-2xl border border-ink/15 bg-white px-5 py-3.5 text-sm text-ink outline-none transition-all focus:border-matcha-deep focus:ring-4 focus:ring-matcha/20"
          />
          <span className="text-sm text-ink/55">{copy.unit}</span>
        </div>
      </div>

      {state && (
        <p
          aria-live="polite"
          className={`rounded-2xl px-5 py-3.5 text-sm ${
            state.ok ? "bg-matcha/15 text-matcha-deep" : "bg-red-50 text-red-700"
          }`}
        >
          {state.ok ? state.message : state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-ink px-7 py-3 text-sm font-medium text-cream transition-colors hover:bg-matcha-deep disabled:opacity-60"
      >
        {pending ? copy.saving : copy.save}
      </button>
    </form>
  );
}
