"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useLoyalty } from "@/lib/loyalty-context";
import { useT } from "@/lib/i18n/context";
import { requestCustomerCode, verifyCustomerCode } from "@/lib/actions/auth";

const inputClass =
  "w-full rounded-2xl border border-ink/15 bg-cream-light px-4 py-3 text-sm text-ink placeholder:text-ink/35 outline-none transition focus:border-matcha-deep focus:ring-4 focus:ring-matcha/20";

export default function LoyaltyDrawer() {
  const { enabled, user, loading, stamps, isOpen, close, refresh, signOut } = useLoyalty();
  const t = useT();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!enabled) return null;

  function handleClose() {
    setCode("");
    setMessage(null);
    close();
  }

  async function sendCode(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const result = await requestCustomerCode(email);
    setBusy(false);
    if (!result.ok) {
      setMessage(t.loyalty.sendFailed);
      return;
    }
    setCodeSent(true);
    setMessage(t.loyalty.codeSent);
  }

  async function verifyCode(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const result = await verifyCustomerCode(email, code);
    if (!result.ok) {
      setBusy(false);
      setMessage(result.error || t.loyalty.invalidCode);
      return;
    }
    await refresh();
    setBusy(false);
    setCodeSent(false);
    setCode("");
    if (result.isAdmin) close();
    router.refresh();
  }

  const rewardCount = Math.floor(stamps / 10);
  const progress = stamps % 10;
  const visualProgress = rewardCount > 0 && progress === 0 ? 10 : progress;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            type="button"
            aria-label={t.loyalty.close}
            className="fixed inset-0 z-[70] bg-ink/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="loyalty-title"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
            className="fixed inset-y-0 right-0 z-[71] flex w-full max-w-md flex-col overflow-y-auto bg-cream p-6 shadow-2xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-matcha-deep">
                  {t.loyalty.eyebrow}
                </p>
                <h2 id="loyalty-title" className="mt-2 font-display text-4xl text-ink">
                  {t.loyalty.title}
                </h2>
                {!loading && user && (
                  <p className="mt-2 break-all text-xs text-ink/40">
                    {user.email}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink/15 text-2xl text-ink/65 hover:text-ink"
                aria-label={t.loyalty.close}
              >
                ×
              </button>
            </div>

            {loading ? (
              <p className="mt-10 text-sm text-ink/55">{t.loyalty.loading}</p>
            ) : user ? (
              <div className="mt-8 flex flex-1 flex-col">
                <div className="rounded-[2rem] bg-ink p-6 text-cream shadow-lg">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-cream/55">grainbuds</p>
                      <p className="mt-1 font-display text-2xl">{t.loyalty.cardTitle}</p>
                    </div>
                    <span className="rounded-full bg-matcha px-3 py-1 text-xs font-semibold text-ink">
                      {stamps} {t.loyalty.stamps}
                    </span>
                  </div>
                  <div className="mt-8 grid grid-cols-5 gap-3" aria-label={`${progress} / 10`}>
                    {Array.from({ length: 10 }, (_, index) => (
                      <GrainbudStamp
                        key={index}
                        filled={index < visualProgress}
                        index={index}
                      />
                    ))}
                  </div>
                  <p className="mt-6 text-sm text-cream/70">
                    {rewardCount > 0
                      ? `${rewardCount} ${rewardCount === 1 ? t.loyalty.reward : t.loyalty.rewards} ${t.loyalty.ready}`
                      : `${10 - progress} ${t.loyalty.untilReward}`}
                  </p>
                </div>

                <p className="mt-6 text-sm leading-6 text-ink/60">{t.loyalty.howItWorks}</p>
                <Link
                  href="/orders"
                  onClick={close}
                  className="mt-6 flex items-center justify-between rounded-2xl border border-ink/10 bg-cream-light px-5 py-4 text-sm font-semibold text-ink transition-colors hover:border-matcha-deep/35 hover:bg-matcha/10"
                >
                  <span>{t.loyalty.orderHistory}</span>
                  <span aria-hidden="true">→</span>
                </Link>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="mt-auto pt-10 text-left text-sm font-medium text-ink/55 underline decoration-ink/25 underline-offset-4 hover:text-ink"
                >
                  {t.loyalty.signOut}
                </button>
              </div>
            ) : (
              <div className="mt-8">
                <p className="text-sm leading-6 text-ink/60">{t.loyalty.intro}</p>
                {!codeSent ? (
                  <form onSubmit={sendCode} className="mt-6 space-y-3">
                    <label className="block text-sm font-medium text-ink" htmlFor="loyalty-email">
                      {t.loyalty.email}
                    </label>
                    <input
                      id="loyalty-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      className={inputClass}
                    />
                    <button disabled={busy} className="w-full rounded-full bg-ink px-5 py-3 text-sm font-medium text-cream disabled:opacity-50">
                      {busy ? t.loyalty.sending : t.loyalty.sendCode}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={verifyCode} className="mt-6 space-y-3">
                    <label className="block text-sm font-medium text-ink" htmlFor="loyalty-code">
                      {t.loyalty.code}
                    </label>
                    <input
                      id="loyalty-code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      required
                      minLength={6}
                      maxLength={6}
                      pattern="[0-9]{6}"
                      value={code}
                      onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="123456"
                      className={`${inputClass} text-center text-xl tracking-[0.35em]`}
                    />
                    <button disabled={busy} className="w-full rounded-full bg-ink px-5 py-3 text-sm font-medium text-cream disabled:opacity-50">
                      {busy ? t.loyalty.checking : t.loyalty.verify}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setCodeSent(false); setMessage(null); }}
                      className="w-full py-2 text-sm text-ink/55 underline underline-offset-4"
                    >
                      {t.loyalty.changeEmail}
                    </button>
                  </form>
                )}
                {message && <p className="mt-4 text-sm text-ink/60" role="status">{message}</p>}
                <p className="mt-8 text-xs leading-5 text-ink/40">{t.loyalty.privacy}</p>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function GrainbudStamp({ filled, index }: { filled: boolean; index: number }) {
  const rotations = ["-rotate-3", "rotate-2", "-rotate-1", "rotate-3", "rotate-1"];

  return (
    <div
      aria-hidden="true"
      className={`relative flex aspect-square items-center justify-center rounded-full transition-all ${
        filled
          ? `bg-matcha/[0.07] text-matcha ${rotations[index % rotations.length]}`
          : "text-cream/15"
      }`}
    >
      <span
        className={`absolute inset-[5%] rounded-full border-2 ${
          filled ? "border-current" : "border-dashed border-current"
        }`}
      />
      <span
        className={`absolute inset-[12%] rounded-full border ${
          filled ? "border-current/70" : "border-current/45"
        }`}
      />
      <span className="absolute left-1/2 top-[18%] h-1 w-1 -translate-x-1/2 rounded-full bg-current opacity-80" />
      <span className="absolute bottom-[18%] left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-current opacity-80" />
      <span
        className="absolute left-[19%] right-[19%] top-1/2 h-[27%] -translate-y-1/2 bg-current"
        style={{
          WebkitMaskImage: "url('/brand/grainbuds-logo.png')",
          maskImage: "url('/brand/grainbuds-logo.png')",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskSize: "contain",
          maskSize: "contain",
        }}
      />
    </div>
  );
}
