"use client";

import { useActionState } from "react";
import { motion } from "framer-motion";
import { login, type AuthState } from "@/lib/actions/auth";

const inputClass =
  "w-full rounded-2xl border border-ink/15 bg-cream-light px-5 py-3.5 text-sm text-ink placeholder:text-ink/35 outline-none transition-all duration-300 focus:border-matcha-deep focus:ring-4 focus:ring-matcha/20";

export default function LoginForm({ configured }: { configured: boolean }) {
  const [state, formAction, isPending] = useActionState<AuthState, FormData>(
    login,
    null
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-md rounded-3xl bg-cream p-9 shadow-[0_30px_80px_-30px_rgba(18,26,37,0.4)]"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-matcha text-cream">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
            <path
              d="M12 20 C5 17, 5.5 8.5, 12 4 C18.5 8.5, 19 17, 12 20 z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <div>
          <h1 className="font-display text-2xl text-ink">grainbuds</h1>
          <p className="text-xs uppercase tracking-[0.2em] text-ink/50">
            Staff area
          </p>
        </div>
      </div>

      {!configured && (
        <div className="mt-6 rounded-2xl bg-sand/25 px-5 py-4 text-sm leading-relaxed text-ink/75">
          <strong>Almost there.</strong> Supabase isn&apos;t connected yet. Add
          your project URL and key to <code>.env.local</code> (see the README),
          then this login will work.
        </div>
      )}

      <form action={formAction} className="mt-7 space-y-4">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-ink">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={inputClass}
            placeholder="owner@grainbuds.cafe"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-ink">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className={inputClass}
            placeholder="••••••••"
          />
        </div>

        {state?.error && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-red-50 px-5 py-3 text-sm text-red-700"
          >
            {state.error}
          </motion.p>
        )}

        <motion.button
          type="submit"
          disabled={isPending}
          whileTap={{ scale: 0.97 }}
          className="w-full rounded-full bg-ink py-3.5 text-sm font-medium text-cream transition-colors duration-300 hover:bg-matcha-deep disabled:opacity-60"
        >
          {isPending ? "Signing in…" : "Sign in"}
        </motion.button>
      </form>
    </motion.div>
  );
}
