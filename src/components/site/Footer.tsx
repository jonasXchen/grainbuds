import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-ink text-cream">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-matcha text-ink">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                  <path
                    d="M12 20 C5 17, 5.5 8.5, 12 4 C18.5 8.5, 19 17, 12 20 z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="font-display text-xl">grainbuds</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/60">
              A calm corner for matcha, grain bowls, and slow mornings.
              Everything whisked, pressed, and baked with care.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-sand">
              Visit us
            </h3>
            <address className="mt-4 space-y-1 text-sm not-italic leading-relaxed text-cream/70">
              <p>Grainbuds Asian Café</p>
              <p>Open daily · 8:00 – 17:00</p>
              <p className="pt-2">hello@grainbuds.cafe</p>
            </address>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-sand">
              Explore
            </h3>
            <nav className="mt-4 flex flex-col gap-2 text-sm text-cream/70">
              <Link href="/shop" className="w-fit transition-colors hover:text-matcha">
                Shop &amp; menu
              </Link>
              <Link href="/#story" className="w-fit transition-colors hover:text-matcha">
                Our story
              </Link>
              <Link href="/#visit" className="w-fit transition-colors hover:text-matcha">
                Hours &amp; location
              </Link>
              <Link
                href="/admin"
                className="w-fit text-cream/40 transition-colors hover:text-matcha"
              >
                Staff login
              </Link>
            </nav>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-cream/10 pt-6 text-xs text-cream/40 sm:flex-row">
          <p>© {new Date().getFullYear()} Grainbuds Asian Café</p>
          <p>Whisked with patience.</p>
        </div>
      </div>
    </footer>
  );
}
