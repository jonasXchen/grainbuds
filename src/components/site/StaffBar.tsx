"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";

function setViewCookie(view: "staff" | "customer") {
  document.cookie = `grainbuds-view=${view};path=/;max-age=86400;samesite=lax`;
}

/** Collapsible staff tools shown to logged-in staff browsing the public site. */
export default function StaffBar({ customerView }: { customerView: boolean }) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!isOpen) return;

    function closeOnOutsideClick(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  function toggleView() {
    setViewCookie(customerView ? "staff" : "customer");
    setIsOpen(false);
    startTransition(() => router.refresh());
  }

  return (
    <motion.div
      ref={containerRef}
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: isPending ? 0.6 : 1 }}
      transition={{ delay: 0.8, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-3 z-40 sm:bottom-5 sm:left-5"
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="staff-tools"
            initial={{ y: 8, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 6, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-[calc(100%+0.5rem)] left-0 w-60 origin-bottom-left rounded-2xl border border-cream/10 bg-ink p-2 text-cream shadow-[0_16px_40px_-16px_rgba(18,26,37,0.65)]"
          >
            <div className="flex items-center gap-2.5 px-2.5 py-2 text-xs text-cream/65">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  customerView ? "bg-sand" : "bg-matcha"
                }`}
              />
              <span>
                {customerView ? "Customer preview is on" : "Staff mode is on"}
              </span>
            </div>

            <button
              type="button"
              onClick={toggleView}
              disabled={isPending}
              className="flex min-h-11 w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-cream/10 disabled:cursor-wait"
            >
              <span>
                {customerView ? "Return to staff view" : "View as customer"}
              </span>
              <svg
                viewBox="0 0 20 20"
                className="h-4 w-4 text-cream/55"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M4 7h10.5m0 0-2.75-2.75M14.5 7l-2.75 2.75M16 13H5.5m0 0 2.75-2.75M5.5 13l2.75 2.75"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <Link
              href="/admin"
              onClick={() => setIsOpen(false)}
              className="flex min-h-11 items-center justify-between rounded-xl bg-matcha px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-cream"
            >
              <span>Open admin panel</span>
              <svg
                viewBox="0 0 20 20"
                className="h-4 w-4"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M7 4h9v9M16 4 6 14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        disabled={isPending}
        className="flex h-10 items-center gap-2 rounded-full border border-cream/10 bg-ink px-3 text-xs font-medium text-cream shadow-[0_8px_24px_-12px_rgba(18,26,37,0.65)] transition-[background-color,opacity,transform] hover:bg-ink/90 active:scale-[0.97] disabled:cursor-wait"
        aria-expanded={isOpen}
        aria-controls="staff-tools"
        aria-label={`${customerView ? "Customer preview" : "Staff mode"}. Open staff tools`}
      >
        <span
          className={`h-2 w-2 rounded-full ${
            customerView ? "bg-sand" : "bg-matcha"
          }`}
        />
        <span>{customerView ? "Preview" : "Staff"}</span>
        <motion.svg
          animate={{ rotate: isOpen ? 180 : 0 }}
          viewBox="0 0 16 16"
          className="h-3.5 w-3.5 text-cream/55"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="m4.5 6 3.5 3.5L11.5 6"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      </button>
    </motion.div>
  );
}
