"use client";

import Link from "next/link";
import Image from "next/image";
import { useT } from "@/lib/i18n/context";
import { cafeInfo } from "@/lib/cafe-info";
import { OPEN_COOKIE_SETTINGS_EVENT } from "./CookieNotice";

export default function Footer() {
  const t = useT();

  return (
    <footer className="bg-ink px-5 text-cream sm:px-8">
      <div className="mx-auto max-w-6xl py-16">
        <div className="grid gap-12 md:grid-cols-3">
          <div>
            <Image
              src="/brand/grainbuds-logo.png"
              alt="Grainbuds Café"
              width={1248}
              height={410}
              className="h-auto w-44 brightness-0 invert"
            />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/60">
              {t.footer.tagline}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-sand">
              {t.footer.visitUs}
            </h3>
            <address className="mt-4 space-y-1 text-sm not-italic leading-relaxed text-cream/70">
              <p>{cafeInfo.name}</p>
              <p>{cafeInfo.address.street}</p>
              <p>
                {cafeInfo.address.zip} {cafeInfo.address.city}
              </p>
              <p className="pt-2">
                <a
                  href={cafeInfo.phoneHref}
                  className="transition-colors hover:text-matcha"
                >
                  {cafeInfo.phone}
                </a>
              </p>
              <p>
                <a
                  href={cafeInfo.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-matcha"
                >
                  {t.visit.directions} ↗
                </a>
              </p>
              <p className="pt-2 text-cream/50">
                {t.visit.monSat}: 10:30 – 19:00
              </p>
              <p className="text-cream/50">
                {t.visit.sunday}: {t.visit.closed}
              </p>
            </address>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-sand">
              {t.footer.explore}
            </h3>
            <nav className="mt-4 flex flex-col gap-2 text-sm text-cream/70">
              <Link href="/shop" className="w-fit transition-colors hover:text-matcha">
                {t.footer.shopMenu}
              </Link>
              <Link href="/#visit" className="w-fit transition-colors hover:text-matcha">
                {t.footer.hoursLocation}
              </Link>
              <Link
                href="/admin"
                className="w-fit text-cream/40 transition-colors hover:text-matcha"
              >
                {t.footer.staffLogin}
              </Link>
              <Link
                href="/privacy"
                className="w-fit text-cream/40 transition-colors hover:text-matcha"
              >
                {t.footer.privacy}
              </Link>
              <button
                type="button"
                onClick={() =>
                  window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT))
                }
                className="w-fit text-left text-cream/40 transition-colors hover:text-matcha"
              >
                {t.footer.cookieSettings}
              </button>
            </nav>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-cream/10 pt-6 text-xs text-cream/40 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {cafeInfo.name}
          </p>
          <p>{t.footer.whisked}</p>
        </div>
      </div>
    </footer>
  );
}
