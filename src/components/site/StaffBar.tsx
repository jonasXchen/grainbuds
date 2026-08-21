"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { motion } from "framer-motion";

function setViewCookie(view: "staff" | "customer") {
  document.cookie = `grainbuds-view=${view};path=/;max-age=86400;samesite=lax`;
}

/** Floating pill shown to logged-in staff browsing the public site. */
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
      className={`fixed bottom-4 left-4 z-40 flex max-w-[calc(100vw-2rem)] flex-wrap items-center gap-1 rounded-3xl bg-ink p-1.5 text-xs font-medium text-cream shadow-[0_16px_40px_-16px_rgba(18,26,37,0.6)] sm:bottom-5 sm:left-5 sm:rounded-full sm:text-sm ${
        isPending ? "opacity-60" : ""
      }`}
    >
      <span className="flex items-center gap-2.5 pl-3 pr-1">
        <span className="relative flex h-2.5 w-2.5">
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
        {customerView ? "Customer preview" : "Staff mode"}
      </span>

      <button
        type="button"
        onClick={toggleView}
        disabled={isPending}
        className="rounded-full bg-cream/15 px-3 py-2 transition-colors hover:bg-cream/30 sm:px-4"
      >
        {customerView ? "Back to staff view" : "View as customer"}
      </button>

      {!customerView && (
        <Link
          href="/admin"
          className="rounded-full bg-matcha px-3 py-2 text-ink transition-colors hover:bg-cream sm:px-4"
        >
          Admin panel
        </Link>
      )}
    </motion.div>
  );
}
