"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useT } from "@/lib/i18n/context";
import { logoutToHome } from "@/lib/actions/auth";

function setViewCookie(view: "staff" | "customer") {
  document.cookie = `grainbuds-view=${view};path=/;max-age=86400;samesite=lax`;
}

export default function StaffNavControls({
  customerView,
  variant,
  onNavigate,
}: {
  customerView: boolean;
  variant: "desktop" | "mobile";
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const t = useT();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!isOpen) return;

    function close(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  function toggleView() {
    setViewCookie(customerView ? "staff" : "customer");
    setIsOpen(false);
    onNavigate?.();
    startTransition(() => router.refresh());
  }

  const status = customerView ? t.staff.previewOn : t.staff.staffOn;
  const toggleLabel = customerView
    ? t.staff.returnToStaff
    : t.staff.viewAsCustomer;

  if (variant === "mobile") {
    return (
      <div className="mt-2 border-t border-ink/10 pt-3">
        <div className="flex items-center gap-2 px-3 py-2 text-xs text-ink/55">
          <span
            className={`h-2 w-2 rounded-full ${
              customerView ? "bg-sand-deep" : "bg-matcha-deep"
            }`}
          />
          {status}
        </div>
        <button
          type="button"
          onClick={toggleView}
          disabled={isPending}
          className="flex min-h-11 w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium text-ink transition-colors hover:bg-matcha/15 disabled:opacity-50"
        >
          {toggleLabel}
          <span aria-hidden="true">⇄</span>
        </button>
        <Link
          href="/admin"
          onClick={onNavigate}
          className="mt-1 flex min-h-11 items-center justify-between rounded-xl bg-matcha/20 px-3 py-2.5 text-sm font-medium text-matcha-deep"
        >
          {t.staff.openAdmin}
          <span aria-hidden="true">↗</span>
        </Link>
        <form action={logoutToHome}>
          <button
            type="submit"
            className="mt-1 flex min-h-11 w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink"
          >
            {t.staff.signOut}
            <span aria-hidden="true">↪</span>
          </button>
        </form>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        disabled={isPending}
        aria-expanded={isOpen}
        aria-controls="staff-nav-menu"
        aria-label={`${toggleLabel}. ${status}`}
        className="flex items-center gap-2 rounded-full border border-ink/10 px-3 py-2 text-xs font-medium text-ink/65 transition-colors hover:border-matcha-deep/40 hover:text-ink disabled:opacity-50"
      >
        <span
          className={`h-2 w-2 rounded-full ${
            customerView ? "bg-sand-deep" : "bg-matcha-deep"
          }`}
        />
        {customerView ? t.staff.staff : t.staff.preview}
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          aria-hidden="true"
          className="text-[10px] text-ink/40"
        >
          ▾
        </motion.span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="staff-nav-menu"
            initial={{ y: -4, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -4, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 top-[calc(100%+0.6rem)] w-60 rounded-2xl border border-cream/10 bg-ink p-2 text-cream shadow-[0_16px_40px_-16px_rgba(18,26,37,0.65)]"
          >
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-cream/60">
              <span
                className={`h-2 w-2 rounded-full ${
                  customerView ? "bg-sand" : "bg-matcha"
                }`}
              />
              {status}
            </div>
            <button
              type="button"
              onClick={toggleView}
              disabled={isPending}
              className="flex min-h-11 w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-cream/10 disabled:opacity-50"
            >
              {toggleLabel}
              <span aria-hidden="true">⇄</span>
            </button>
            <Link
              href="/admin"
              onClick={() => setIsOpen(false)}
              className="mt-1 flex min-h-11 items-center justify-between rounded-xl bg-matcha px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-cream"
            >
              {t.staff.openAdmin}
              <span aria-hidden="true">↗</span>
            </Link>
            <form action={logoutToHome} onSubmit={() => setIsOpen(false)}>
              <button
                type="submit"
                className="mt-1 flex min-h-11 w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium text-cream/60 transition-colors hover:bg-cream/10 hover:text-cream"
              >
                {t.staff.signOut}
                <span aria-hidden="true">↪</span>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
