"use client";

import Link from "next/link";
import { motion } from "framer-motion";

/** Floating pill shown to logged-in staff browsing the public site. */
export default function StaffBar() {
  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.8, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed bottom-5 left-5 z-40"
    >
      <Link
        href="/admin"
        className="flex items-center gap-2.5 rounded-full bg-ink py-2.5 pl-4 pr-5 text-sm font-medium text-cream shadow-[0_16px_40px_-16px_rgba(18,26,37,0.6)] transition-colors hover:bg-matcha-deep"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute h-full w-full animate-ping rounded-full bg-matcha opacity-60" />
          <span className="relative h-2.5 w-2.5 rounded-full bg-matcha" />
        </span>
        Staff mode · Admin panel
      </Link>
    </motion.div>
  );
}
