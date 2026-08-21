/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { getProducts } from "@/lib/data";
import { getT } from "@/lib/i18n/server";
import { cafeInfo, galleryImages } from "@/lib/cafe-info";
import Hero from "@/components/site/Hero";
import Marquee from "@/components/site/Marquee";
import Reveal from "@/components/site/Reveal";
import Parallax from "@/components/site/Parallax";
import ProductCard from "@/components/site/ProductCard";

export default async function HomePage() {
  const [featured, { t }] = await Promise.all([
    getProducts({ featuredOnly: true }),
    getT(),
  ]);

  return (
    <>
      <Hero />

      <Marquee items={[...t.marquee]} />

      {/* Story */}
      <section id="story" className="relative overflow-hidden px-5 py-28 sm:px-8">
        <Parallax
          speed={-0.4}
          className="pointer-events-none absolute -right-20 top-10 hidden lg:block"
        >
          <div className="h-64 w-64 rounded-full bg-sand/25 blur-2xl" aria-hidden />
        </Parallax>

        <div className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2">
          <div>
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-matcha-deep">
                {t.story.eyebrow}
              </p>
              <h2 className="mt-3 font-display text-4xl leading-tight text-ink sm:text-5xl">
                {t.story.titleA}
                <br />
                <span className="text-matcha-deep">{t.story.titleB}</span>
              </h2>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="mt-6 text-base leading-relaxed text-ink/65">
                {t.story.p1}
              </p>
            </Reveal>
            <Reveal delay={0.3}>
              <p className="mt-4 text-base leading-relaxed text-ink/65">
                {t.story.p2}
              </p>
            </Reveal>
            <Reveal delay={0.45}>
              <Link
                href="/shop"
                className="link-underline mt-8 inline-block text-sm font-medium text-ink"
              >
                {t.story.link}
              </Link>
            </Reveal>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Parallax speed={0.25}>
              <Reveal className="aspect-[3/4] overflow-hidden rounded-3xl bg-matcha/25">
                <img
                  src={galleryImages[0]}
                  alt="Inside the Grainbuds café"
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                  loading="lazy"
                />
              </Reveal>
            </Parallax>
            <Parallax speed={-0.25} className="mt-10">
              <Reveal delay={0.15} className="aspect-[3/4] overflow-hidden rounded-3xl bg-sand/40">
                <div className="flex h-full flex-col justify-between p-6">
                  <svg viewBox="0 0 48 48" className="h-10 w-10 text-sand-deep" fill="none">
                    <path
                      d="M24 42 C10 36, 11 17, 24 8 C37 17, 38 36, 24 42 z"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinejoin="round"
                    />
                    <path d="M24 40 V12" stroke="currentColor" strokeWidth="2" opacity="0.6" />
                  </svg>
                  <p className="text-sm leading-relaxed text-ink/70">
                    {t.story.nameNote}
                  </p>
                </div>
              </Reveal>
            </Parallax>
          </div>
        </div>
      </section>

      {/* Ritual steps */}
      <section className="bg-ink px-5 py-28 text-cream sm:px-8">
        <div className="mx-auto max-w-6xl">
          <Reveal className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-matcha">
              {t.ritual.eyebrow}
            </p>
            <h2 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
              {t.ritual.title}
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {t.ritual.steps.map((step, i) => (
              <Reveal
                key={step.title}
                delay={i * 0.15}
                className="group rounded-3xl border border-cream/10 p-8 transition-colors duration-500 hover:border-matcha/60 hover:bg-cream/5"
              >
                <span className="font-display text-5xl text-matcha/70 transition-colors duration-500 group-hover:text-matcha">
                  0{i + 1}
                </span>
                <h3 className="mt-5 font-display text-2xl">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-cream/60">
                  {step.text}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

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
            {galleryImages.slice(1, 7).map((image, i) => (
              <Reveal
                key={image}
                delay={(i % 4) * 0.1}
                className={`overflow-hidden rounded-3xl ${
                  i % 3 === 0 ? "row-span-2" : ""
                }`}
              >
                <img
                  src={image}
                  alt="Grainbuds café impressions"
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 ease-out hover:scale-105"
                />
              </Reveal>
            ))}
          </div>
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
