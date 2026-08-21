"use client";

import { useActionState } from "react";
import { motion } from "framer-motion";
import { sendCampaign, type CampaignState } from "@/lib/actions/marketing";

const inputClass =
  "w-full rounded-2xl border border-ink/15 bg-white px-5 py-3.5 text-sm text-ink placeholder:text-ink/35 outline-none transition-all duration-300 focus:border-matcha-deep focus:ring-4 focus:ring-matcha/20";

export default function CampaignForm({
  subscriberCount,
}: {
  subscriberCount: number;
}) {
  const [state, formAction, isPending] = useActionState<CampaignState, FormData>(
    sendCampaign,
    null
  );

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (
          !confirm(
            `Send this email to all ${subscriberCount} people on the mailing list?`
          )
        ) {
          event.preventDefault();
        }
      }}
      className="space-y-4"
    >
      <div>
        <label htmlFor="subject" className="mb-2 block text-sm font-medium text-ink">
          Subject
        </label>
        <input
          id="subject"
          name="subject"
          required
          maxLength={150}
          className={inputClass}
          placeholder="New: Yuzu Matcha Cloud ☁️"
        />
      </div>
      <div>
        <label htmlFor="message" className="mb-2 block text-sm font-medium text-ink">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          maxLength={5000}
          className={`${inputClass} resize-none`}
          placeholder={
            "Write your announcement here — new drinks, seasonal specials, opening hours…\n\nAn unsubscribe note is added automatically at the bottom."
          }
        />
      </div>

      {state && !state.ok && (
        <motion.p
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-sand/25 px-5 py-3.5 text-sm leading-relaxed text-ink/75"
        >
          {state.error}
        </motion.p>
      )}
      {state?.ok && (
        <motion.p
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-matcha/20 px-5 py-3.5 text-sm font-medium text-matcha-deep"
        >
          ✓ {state.message}
        </motion.p>
      )}

      <motion.button
        type="submit"
        disabled={isPending || subscriberCount === 0}
        whileTap={{ scale: 0.97 }}
        className="rounded-full bg-ink px-7 py-3.5 text-sm font-medium text-cream transition-colors duration-300 hover:bg-matcha-deep disabled:opacity-50"
      >
        {isPending
          ? "Sending…"
          : `Send to ${subscriberCount} subscriber${subscriberCount === 1 ? "" : "s"}`}
      </motion.button>
    </form>
  );
}
