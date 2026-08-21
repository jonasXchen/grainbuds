"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logout } from "@/lib/actions/auth";
import { getNewOrderCount } from "@/lib/actions/admin";

const links = [
  {
    href: "/admin",
    label: "Overview",
    icon: (
      <path d="M4 12 L12 5 L20 12 M6.5 10.5 V19 H17.5 V10.5" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    href: "/admin/products",
    label: "Products",
    icon: (
      <path d="M5 8 L12 4.5 L19 8 V16 L12 19.5 L5 16 Z M5 8 L12 11.5 L19 8 M12 11.5 V19.5" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    href: "/admin/orders",
    label: "Orders",
    icon: (
      <path d="M7 5 H17 L18.5 19 H5.5 Z M9.5 8 V7 A2.5 2.5 0 0 1 14.5 7 V8" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    href: "/admin/analytics",
    label: "Analytics",
    icon: (
      <path d="M5 19 V13 M10 19 V9 M15 19 V11 M20 19 V5" strokeLinecap="round" />
    ),
  },
  {
    href: "/admin/customers",
    label: "Customers",
    icon: (
      <path d="M12 11 A3.5 3.5 0 1 0 12 4 A3.5 3.5 0 0 0 12 11 Z M5 20 C5 15.5 8 13.5 12 13.5 C16 13.5 19 15.5 19 20" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: (
      <path d="M12 8.5 A3.5 3.5 0 1 0 12 15.5 A3.5 3.5 0 0 0 12 8.5 Z M19 13.5 V10.5 L16.8 9.7 L16.2 8.3 L17.2 6.2 L15.1 4.1 L13 5.1 L11.5 4.5 L10.7 2.5 H7.7 L6.9 4.5 L5.4 5.1 L3.3 4.1 L1.2 6.2 L2.2 8.3 L1.6 9.7" strokeLinecap="round" strokeLinejoin="round" transform="translate(1.5 1.5) scale(.85)" />
    ),
  },
];

export default function AdminNav({
  initialNewOrderCount,
}: {
  initialNewOrderCount: number;
}) {
  const pathname = usePathname();
  const [newOrderCount, setNewOrderCount] = useState(initialNewOrderCount);

  useEffect(() => {
    let active = true;
    const refreshCount = async () => {
      try {
        const count = await getNewOrderCount();
        if (active) setNewOrderCount(count);
      } catch {
        // Keep the last known count during a temporary network/session error.
      }
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void refreshCount();
    };

    void refreshCount();
    const interval = window.setInterval(refreshCount, 15_000);
    window.addEventListener("focus", refreshCount);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    window.addEventListener("grainbuds:orders-changed", refreshCount);

    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshCount);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.removeEventListener("grainbuds:orders-changed", refreshCount);
    };
  }, [pathname]);

  return (
    <aside className="flex w-full shrink-0 flex-col gap-2 border-b border-cream/10 bg-ink px-4 py-3 text-cream md:sticky md:top-0 md:h-dvh md:w-60 md:gap-0 md:border-b-0 md:border-r md:px-4 md:py-6">
      <div className="flex items-center justify-between md:block">
        <Link href="/" className="flex items-center gap-2.5 px-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-matcha text-ink">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
              <path
                d="M12 20 C5 17, 5.5 8.5, 12 4 C18.5 8.5, 19 17, 12 20 z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="font-display text-lg">grainbuds</span>
        </Link>

        {/* Mobile-only sign out, so the link row below stays uncluttered */}
        <form action={logout} className="md:hidden">
          <button
            type="submit"
            className="flex h-9 w-9 items-center justify-center rounded-full text-cream/55 transition-colors hover:bg-cream/10 hover:text-cream"
            aria-label="Sign out"
          >
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M14 5 H6 V19 H14 M10.5 12 H20 M20 12 L16.5 8.5 M20 12 L16.5 15.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </form>
      </div>

      <nav className="-mx-4 flex flex-row gap-1 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:mt-8 md:flex-1 md:flex-col md:overflow-visible md:px-0 md:pb-0">
        {links.map((link) => {
          const isActive =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors duration-300 ${
                isActive
                  ? "bg-matcha text-ink"
                  : "text-cream/65 hover:bg-cream/10 hover:text-cream"
              }`}
            >
              <svg viewBox="0 0 24 24" className="hidden h-4.5 w-4.5 md:block" fill="none" stroke="currentColor" strokeWidth="1.7">
                {link.icon}
              </svg>
              <span>{link.label}</span>
              {link.href === "/admin/orders" && newOrderCount > 0 && (
                <span
                  className="ml-auto flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white shadow-sm"
                  aria-label={`${newOrderCount} new order${
                    newOrderCount === 1 ? "" : "s"
                  }`}
                >
                  {newOrderCount > 99 ? "99+" : newOrderCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <form action={logout} className="hidden md:mt-auto md:block">
        <button
          type="submit"
          className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm text-cream/55 transition-colors hover:bg-cream/10 hover:text-cream"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M14 5 H6 V19 H14 M10.5 12 H20 M20 12 L16.5 8.5 M20 12 L16.5 15.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Sign out
        </button>
      </form>
    </aside>
  );
}
