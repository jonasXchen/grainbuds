"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { requestAdminCode, verifyAdminCode } from "@/lib/actions/auth";
import { useLocale } from "@/lib/i18n/context";

const inputClass =
  "w-full rounded-2xl border border-ink/15 bg-cream-light px-5 py-3.5 text-sm text-ink placeholder:text-ink/35 outline-none transition-all duration-300 focus:border-matcha-deep focus:ring-4 focus:ring-matcha/20";

export default function LoginForm({ configured }: { configured: boolean }) {
  const locale = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const copy = locale === "de"
    ? {
        staffArea: "Mitarbeiterbereich",
        almost: "Fast geschafft.",
        setup: "Supabase ist noch nicht verbunden. Tragen Sie Projekt-URL und Schlüssel in .env.local ein; danach funktioniert die Anmeldung.",
        email: "E-Mail",
        intro: "Sie erhalten einen einmaligen Anmeldecode per E-Mail. Kein Passwort nötig.",
        code: "E-Mail-Code",
        sent: "Code gesendet. Bitte prüfen Sie Ihr Postfach.",
        sending: "Code wird gesendet…",
        send: "Anmeldecode senden",
        checking: "Code wird geprüft…",
        signIn: "Adminbereich öffnen",
        changeEmail: "Andere E-Mail verwenden",
      }
    : {
        staffArea: "Staff area",
        almost: "Almost there.",
        setup: "Supabase isn’t connected yet. Add your project URL and key to .env.local; then this login will work.",
        email: "Email",
        intro: "We’ll email you a one-time sign-in code. No password needed.",
        code: "Email code",
        sent: "Code sent. Please check your inbox.",
        sending: "Sending code…",
        send: "Send sign-in code",
        checking: "Checking code…",
        signIn: "Open admin area",
        changeEmail: "Use a different email",
      };

  function handleSend(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await requestAdminCode(email);
      if (!result.ok) return setError(result.error);
      setCodeSent(true);
    });
  }

  function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await verifyAdminCode(email, code);
      if (!result.ok) return setError(result.error);
      router.push("/admin");
      router.refresh();
    });
  }

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
            {copy.staffArea}
          </p>
        </div>
      </div>

      {!configured && (
        <div className="mt-6 rounded-2xl bg-sand/25 px-5 py-4 text-sm leading-relaxed text-ink/75">
          <strong>{copy.almost}</strong> {copy.setup}
        </div>
      )}

      <p className="mt-6 text-sm leading-relaxed text-ink/60">{copy.intro}</p>

      <form onSubmit={codeSent ? handleVerify : handleSend} className="mt-5 space-y-4">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-ink">
            {copy.email}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={codeSent || isPending}
            className={inputClass}
            placeholder="owner@grainbuds.cafe"
          />
        </div>
        {codeSent && (
          <div>
            <p className="mb-4 rounded-2xl bg-matcha/15 px-4 py-3 text-sm text-matcha-deep">
              {copy.sent}
            </p>
            <label htmlFor="code" className="mb-2 block text-sm font-medium text-ink">
              {copy.code}
            </label>
            <input
              id="code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              minLength={6}
              maxLength={6}
              pattern="[0-9]{6}"
              autoFocus
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              className={`${inputClass} text-center text-xl tracking-[0.35em]`}
              placeholder="123456"
            />
          </div>
        )}

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-red-50 px-5 py-3 text-sm text-red-700"
          >
            {error}
          </motion.p>
        )}

        <motion.button
          type="submit"
          disabled={isPending}
          whileTap={{ scale: 0.97 }}
          className="w-full rounded-full bg-ink py-3.5 text-sm font-medium text-cream transition-colors duration-300 hover:bg-matcha-deep disabled:opacity-60"
        >
          {isPending
            ? codeSent ? copy.checking : copy.sending
            : codeSent ? copy.signIn : copy.send}
        </motion.button>
        {codeSent && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => { setCodeSent(false); setCode(""); setError(null); }}
            className="w-full py-2 text-sm text-ink/55 underline underline-offset-4"
          >
            {copy.changeEmail}
          </button>
        )}
      </form>
    </motion.div>
  );
}
