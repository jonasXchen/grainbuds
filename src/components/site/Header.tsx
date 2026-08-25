"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/lib/cart-context";
import { useT } from "@/lib/i18n/context";
import LanguageSwitcher from "./LanguageSwitcher";
import StaffNavControls from "./StaffNavControls";
import LoyaltyButton from "./LoyaltyButton";

function subscribeToScroll(callback: () => void) {
  window.addEventListener("scroll", callback, { passive: true });
  return () => window.removeEventListener("scroll", callback);
}

export default function Header({
  isStaff = false,
  customerView = false,
}: {
  isStaff?: boolean;
  customerView?: boolean;
}) {
  const scrolled = useSyncExternalStore(
    subscribeToScroll,
    () => window.scrollY > 24,
    () => false
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const { totalItems, openCart } = useCart();
  const pathname = usePathname();
  const t = useT();

  const navLinks = [
    { href: "/#shop", label: t.nav.shop },
    { href: "/#visit", label: t.nav.visit },
  ];

  // Close the mobile menu when navigating to a new page.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMenuOpen(false);
  }

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 ${
        scrolled
          ? "bg-cream/85 shadow-[0_1px_0_rgba(18,26,37,0.08)] backdrop-blur-md"
          : "bg-transparent"
      }`}
    >
      <div className="px-5 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between py-4">
        <Link href="/" className="group block shrink-0" aria-label="Grainbuds home">
          <Image
            src="/brand/grainbuds-logo.png"
            alt="Grainbuds Café"
            width={1248}
            height={410}
            className="h-auto w-[118px] transition-transform duration-500 group-hover:scale-[1.03] sm:w-[148px]"
          />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`link-underline text-sm font-medium text-ink/70 transition-colors hover:text-ink ${
                pathname === link.href ? "active text-ink" : ""
              }`}
            >
              {link.label}
            </Link>
          ))}
          {isStaff && (
            <StaffNavControls customerView={customerView} variant="desktop" />
          )}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:block">
            <LanguageSwitcher />
          </div>
          <LoyaltyButton />
          <button
            type="button"
            onClick={openCart}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 bg-cream-light text-ink transition-colors duration-300 hover:border-matcha hover:bg-matcha/15"
            aria-label={`${t.nav.openCart} (${totalItems})`}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
              <path
                d="M6 8 h12 l-1.2 11 a2 2 0 0 1 -2 1.8 H9.2 a2 2 0 0 1 -2 -1.8 z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path
                d="M9 8 V7 a3 3 0 0 1 6 0 v1"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
            <AnimatePresence>
              {totalItems > 0 && (
                <motion.span
                  key="badge"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 22 }}
                  className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-matcha-deep px-1 text-[11px] font-semibold text-cream"
                >
                  {totalItems}
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          <Link
            href="/#shop"
            className="hidden rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-cream transition-colors duration-300 hover:bg-matcha-deep lg:block"
          >
            {t.nav.orderPickup}
          </Link>

          <button
            type="button"
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-full border border-ink/15 bg-cream-light md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={t.nav.openMenu}
          >
            <motion.span
              animate={menuOpen ? { rotate: 45, y: 3.5 } : { rotate: 0, y: 0 }}
              className="block h-0.5 w-4 bg-ink"
            />
            <motion.span
              animate={menuOpen ? { rotate: -45, y: -3.5 } : { rotate: 0, y: 0 }}
              className="block h-0.5 w-4 bg-ink"
            />
          </button>
        </div>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-ink/10 bg-cream/95 backdrop-blur-md md:hidden"
          >
            <div className="flex flex-col gap-1 px-5 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-3 py-2.5 font-display text-lg text-ink hover:bg-matcha/15"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/#shop"
                onClick={() => setMenuOpen(false)}
                className="mt-2 rounded-full bg-ink px-5 py-3 text-center text-sm font-medium text-cream"
              >
                {t.nav.orderPickup}
              </Link>
              <div className="mt-3 flex items-center justify-between gap-4 rounded-2xl border border-ink/8 bg-matcha/10 px-4 py-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-matcha-deep">
                    {t.nav.language}
                  </p>
                  <p className="mt-0.5 text-xs text-ink/45">
                    {t.nav.languageHint}
                  </p>
                </div>
                <LanguageSwitcher />
              </div>
              {isStaff && (
                <StaffNavControls
                  customerView={customerView}
                  variant="mobile"
                  onNavigate={() => setMenuOpen(false)}
                />
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
