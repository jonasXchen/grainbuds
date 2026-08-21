"use client";

import { useActionState } from "react";
import {
  saveOrderNotificationEmails,
  type SettingsActionState,
} from "@/lib/actions/admin";

export default function NotificationSettingsForm({
  initialEmails,
}: {
  initialEmails: string;
}) {
  const [state, formAction, pending] = useActionState<
    SettingsActionState,
    FormData
  >(saveOrderNotificationEmails, null);

  return (
    <form action={formAction} className="mt-6 space-y-5">
      <div>
        <label htmlFor="emails" className="block text-sm font-medium text-ink">
          Order notification recipients
        </label>
        <p className="mt-1 text-sm leading-relaxed text-ink/55">
          Enter one address per line. Every recipient gets notifications for
          new orders and customer edits.
        </p>
        <textarea
          id="emails"
          name="emails"
          rows={5}
          required
          defaultValue={initialEmails}
          placeholder={"orders@grainbuds.de\nmanager@example.com"}
          className="mt-3 w-full resize-y rounded-2xl border border-ink/15 bg-white px-5 py-4 text-sm text-ink outline-none transition-all focus:border-matcha-deep focus:ring-4 focus:ring-matcha/20"
        />
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
        {pending ? "Saving…" : "Save recipients"}
      </button>
    </form>
  );
}
