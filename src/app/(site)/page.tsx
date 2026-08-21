/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { getPopularProductNames, getProducts } from "@/lib/data";
import { localizedName } from "@/lib/types";
import { getT } from "@/lib/i18n/server";
import { getInstagramGallerySettings } from "@/lib/instagram-gallery";
import { cafeInfo, galleryImages } from "@/lib/cafe-info";
import Hero from "@/components/site/Hero";
import Marquee from "@/components/site/Marquee";
import Reveal from "@/components/site/Reveal";
import Parallax from "@/components/site/Parallax";
import ProductCard from "@/components/site/ProductCard";

export default async function HomePage() {
  const [featured, popularProducts, { locale, t }, instagram] = await Promise.all([
    getProducts({ featuredOnly: true }),
    getPopularProductNames(),
    getT(),
    getInstagramGallerySettings(),
  ]);
  const marqueeProducts = popularProducts.length ? popularProducts : featured;
  const marqueeItems = marqueeProducts.map((product) =>
    localizedName(product, locale)
  );
  const gallery = instagram.images.length
    ? instagram.images.slice(0, 6)
    : galleryImages.slice(1, 7).map((imageUrl) => ({ imageUrl, postUrl: null }));

  return (
    <>
      <Hero />

      {marqueeItems.length > 0 && <Marquee items={marqueeItems} />}

      {/* Featured products */}
      <section className="px-5 py-28 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-matcha-deep">
              {t.featured.eyebrow}
            </p>
            <h2 className="mt-3 font-display text-4xl leading-tight text-ink sm:text-5xl">
              {t.featured.title}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink/60">
              {t.featured.desc}
            </p>
          </Reveal>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.slice(0, 6).map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
          <Reveal className="mt-12 text-center">
            <Link
              href="/shop"
              className="group inline-flex items-center gap-2 rounded-full border border-ink/20 px-8 py-4 text-sm font-medium text-ink transition-all duration-300 hover:border-ink hover:bg-ink hover:text-cream"
            >
              {t.featured.browseAll}
              <span className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Gallery */}
      <section className="overflow-hidden px-5 pb-28 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-matcha-deep">
              {t.gallery.eyebrow}
            </p>
            <h2 className="mt-3 font-display text-4xl leading-tight text-ink sm:text-5xl">
              {t.gallery.title}
            </h2>
          </Reveal>
          <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
            {gallery.map((image, i) => (
              <Reveal
                key={`${image.imageUrl}-${i}`}
                delay={(i % 4) * 0.1}
                className={`overflow-hidden rounded-3xl ${
                  i % 3 === 0 ? "row-span-2" : ""
                }`}
              >
                <a
                  href={image.postUrl ?? instagram.profileUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${t.gallery.follow} @${instagram.handle}`}
                  className="block h-full"
                >
                  <img
                    src={image.imageUrl}
                    alt={`Grainbuds — Instagram @${instagram.handle}`}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out hover:scale-105"
                  />
                </a>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-8 flex justify-center">
            <a
              href={instagram.profileUrl}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center gap-2 rounded-full border border-ink/15 px-6 py-3 text-sm font-medium text-ink/70 transition-all hover:border-matcha-deep hover:bg-matcha/10 hover:text-matcha-deep"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.4" cy="6.7" r="1" fill="currentColor" stroke="none" />
              </svg>
              <span>{t.gallery.follow} @{instagram.handle} ↗</span>
            </a>
          </Reveal>
        </div>
      </section>

      {/* Visit */}
      <section id="visit" className="relative overflow-hidden bg-cream-light px-5 py-28 sm:px-8">
        <Parallax
          speed={0.35}
          className="pointer-events-none absolute -left-24 bottom-0 hidden lg:block"
        >
          <div className="h-72 w-72 rounded-full bg-matcha/15 blur-3xl" aria-hidden />
        </Parallax>

        <div className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2">
          <Reveal>
            <div className="rounded-3xl bg-ink p-10 text-cream shadow-[0_30px_60px_-30px_rgba(18,26,37,0.5)]">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sand">
                {t.visit.hoursTitle}
              </p>
              <ul className="mt-6 space-y-4">
                <li className="flex items-baseline justify-between gap-4 border-b border-cream/10 pb-4">
                  <span className="text-sm text-cream/70">{t.visit.monSat}</span>
                  <span className="font-display text-lg">10:30 – 19:00</span>
                </li>
                <li className="flex items-baseline justify-between gap-4 border-b border-cream/10 pb-4">
                  <span className="text-sm text-cream/70">{t.visit.sunday}</span>
                  <span className="font-display text-lg">{t.visit.closed}</span>
                </li>
              </ul>
              <address className="mt-6 space-y-1 text-sm not-italic leading-relaxed text-cream/70">
                <p>{cafeInfo.address.street}</p>
                <p>
                  {cafeInfo.address.zip} {cafeInfo.address.city}
                </p>
                <p>
                  <a
                    href={cafeInfo.phoneHref}
                    className="transition-colors hover:text-matcha"
                  >
                    {cafeInfo.phone}
                  </a>
                </p>
              </address>
              <p className="mt-5 text-sm leading-relaxed text-cream/50">
                {t.visit.note}
              </p>
            </div>
          </Reveal>

          <div>
            <Reveal className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-matcha-deep">
                {t.visit.eyebrow}
              </p>
              <h2 className="mt-3 font-display text-4xl leading-tight text-ink sm:text-5xl">
                {t.visit.title}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-ink/60">
                {t.visit.desc}
              </p>
            </Reveal>
            <Reveal delay={0.2} className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/shop"
                className="rounded-full bg-matcha-deep px-8 py-4 text-sm font-medium text-cream transition-colors duration-300 hover:bg-ink"
              >
                {t.visit.orderAhead}
              </Link>
              <a
                href={cafeInfo.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-ink/20 px-8 py-4 text-sm font-medium text-ink transition-colors duration-300 hover:border-ink hover:bg-ink hover:text-cream"
              >
                {t.visit.directions} ↗
              </a>
              <a
                href={cafeInfo.phoneHref}
                className="rounded-full border border-ink/20 px-8 py-4 text-sm font-medium text-ink transition-colors duration-300 hover:border-ink hover:bg-ink hover:text-cream"
              >
                {t.visit.callUs}
              </a>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
