"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { motion } from "framer-motion";

function setViewCookie(view: "staff" | "customer") {
  document.cookie = `grainbuds-view=${view};path=/;max-age=86400;samesite=lax`;
}

/** Responsive switcher shown to logged-in staff browsing the public site. */
export default function StaffBar({ customerView }: { customerView: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function toggleView() {
    setViewCookie(customerView ? "staff" : "customer");
    startTransition(() => router.refresh());
  }

  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.8, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 flex flex-col gap-1.5 rounded-2xl bg-ink p-1.5 text-xs font-medium text-cream shadow-[0_16px_40px_-16px_rgba(18,26,37,0.6)] transition-opacity sm:inset-x-auto sm:bottom-5 sm:left-5 sm:flex-row sm:items-center sm:gap-1 sm:rounded-full sm:text-sm ${
        isPending ? "opacity-60" : ""
      }`}
    >
      <span
        className="flex min-w-0 items-center gap-2.5 px-3 py-1 sm:py-0 sm:pr-1"
        aria-live="polite"
      >
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span
            className={`absolute h-full w-full animate-ping rounded-full opacity-60 ${
              customerView ? "bg-sand" : "bg-matcha"
            }`}
          />
          <span
            className={`relative h-2.5 w-2.5 rounded-full ${
              customerView ? "bg-sand" : "bg-matcha"
            }`}
          />
        </span>
        <span className="truncate">
          {customerView ? "Customer preview" : "Staff mode"}
        </span>
      </span>

      <div
        className={`grid w-full gap-1.5 sm:flex sm:w-auto sm:gap-1 ${
          customerView ? "grid-cols-1" : "grid-cols-2"
        }`}
      >
        <button
          type="button"
          onClick={toggleView}
          disabled={isPending}
          className="min-h-10 min-w-0 rounded-xl bg-cream/15 px-3 py-2 text-center transition-colors hover:bg-cream/30 disabled:cursor-wait sm:min-h-0 sm:whitespace-nowrap sm:rounded-full sm:px-4"
        >
          <span className="sm:hidden">
            {customerView ? "Staff view" : "Customer view"}
          </span>
          <span className="hidden sm:inline">
            {customerView ? "Back to staff view" : "View as customer"}
          </span>
        </button>

        {!customerView && (
          <Link
            href="/admin"
            className="flex min-h-10 min-w-0 items-center justify-center rounded-xl bg-matcha px-3 py-2 text-center text-ink transition-colors hover:bg-cream sm:min-h-0 sm:whitespace-nowrap sm:rounded-full sm:px-4"
          >
            <span className="sm:hidden">Admin</span>
            <span className="hidden sm:inline">Admin panel</span>
          </Link>
        )}
      </div>
    </motion.div>
  );
}
