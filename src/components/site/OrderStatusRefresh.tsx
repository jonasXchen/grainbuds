"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OrderStatusRefresh() {
  const router = useRouter();

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 15_000);

    return () => window.clearInterval(interval);
  }, [router]);

  return null;
}
