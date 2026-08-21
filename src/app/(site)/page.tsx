import Link from "next/link";
import { getProducts } from "@/lib/data";
import Hero from "@/components/site/Hero";
import Marquee from "@/components/site/Marquee";
import Reveal from "@/components/site/Reveal";
import Parallax from "@/components/site/Parallax";
import SectionHeading from "@/components/site/SectionHeading";
import ProductCard from "@/components/site/ProductCard";

export const revalidate = 60;

const ritualSteps = [
  {
    number: "01",
    title: "Sift",
    text: "Every bowl starts with ceremonial matcha sifted fresh — no clumps, no shortcuts.",
  },
  {
    number: "02",
    title: "Whisk",
    text: "Eighty quick strokes with a bamboo chasen until the surface turns to soft green foam.",
  },
  {
    number: "03",
    title: "Settle",
    text: "Then the best part: you, a warm cup, and nowhere you need to be for a while.",
  },
];

export default async function HomePage() {
  const featured = await getProducts({ featuredOnly: true });

  return (
    <>
      <Hero />

      <Marquee
        items={[
          "Ceremonial matcha",
          "Baked every morning",
          "Grain bowls",
          "Order ahead, skip the line",
          "Slow mornings welcome",
        ]}
      />

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
                Our story
              </p>
              <h2 className="mt-3 font-display text-4xl leading-tight text-ink sm:text-5xl">
                Small café,
                <br />
                <span className="text-matcha-deep">patient rituals.</span>
              </h2>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="mt-6 text-base leading-relaxed text-ink/65">
                Grainbuds began as a tiny counter with one kettle and a
                conviction: that a café can be the quietest room in your day.
                We whisk single-origin matcha from Uji, press onigiri by hand,
                and bake in small batches that sell out by afternoon — on
                purpose.
              </p>
            </Reveal>
            <Reveal delay={0.3}>
              <p className="mt-4 text-base leading-relaxed text-ink/65">
                No rush, no laptops-only rows of tables, no burnt espresso
                smell. Just grain, green tea, and time moving a little slower.
              </p>
            </Reveal>
            <Reveal delay={0.45}>
              <Link
                href="/shop"
                className="link-underline mt-8 inline-block text-sm font-medium text-ink"
              >
                See what&apos;s on today →
              </Link>
            </Reveal>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Parallax speed={0.25}>
              <Reveal className="aspect-[3/4] overflow-hidden rounded-3xl bg-matcha/25">
                <div className="flex h-full items-end p-6">
                  <p className="font-display text-2xl leading-snug text-matcha-deep">
                    “The whisk is the metronome of the morning.”
                  </p>
                </div>
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
                    Named for the little grains and buds that make everything
                    on our menu — rice, tea leaves, sesame, barley.
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
          <SectionHeading
            eyebrow="The ritual"
            title="Three steps to a better morning"
            align="left"
          />
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {ritualSteps.map((step, i) => (
              <Reveal
                key={step.number}
                delay={i * 0.15}
                className="group rounded-3xl border border-cream/10 p-8 transition-colors duration-500 hover:border-matcha/60 hover:bg-cream/5"
              >
                <span className="font-display text-5xl text-matcha/70 transition-colors duration-500 group-hover:text-matcha">
                  {step.number}
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
          <SectionHeading
            eyebrow="From the bar"
            title="House favorites"
            description="The drinks and bites our regulars ask for by name. Order ahead and they'll be waiting, still warm."
          />
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
              Browse the full menu
              <span className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>
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
                Hours
              </p>
              <ul className="mt-6 space-y-4">
                {[
                  ["Monday – Friday", "8:00 – 17:00"],
                  ["Saturday", "9:00 – 18:00"],
                  ["Sunday", "9:00 – 16:00"],
                ].map(([day, hours]) => (
                  <li
                    key={day}
                    className="flex items-baseline justify-between gap-4 border-b border-cream/10 pb-4"
                  >
                    <span className="text-sm text-cream/70">{day}</span>
                    <span className="font-display text-lg">{hours}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm leading-relaxed text-cream/50">
                Pastries are baked once, in the morning. When today&apos;s tray
                is gone, it&apos;s gone — order ahead if you have your heart
                set.
              </p>
            </div>
          </Reveal>

          <div>
            <SectionHeading
              eyebrow="Visit"
              title="Come sit for a while"
              align="left"
              description="Find us at the corner where the neighborhood slows down. Order at the counter, or ahead of time — either way, your cup is whisked to order."
            />
            <Reveal delay={0.2} className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/shop"
                className="rounded-full bg-matcha-deep px-8 py-4 text-sm font-medium text-cream transition-colors duration-300 hover:bg-ink"
              >
                Order ahead
              </Link>
              <a
                href="mailto:hello@grainbuds.cafe"
                className="rounded-full border border-ink/20 px-8 py-4 text-sm font-medium text-ink transition-colors duration-300 hover:border-ink hover:bg-ink hover:text-cream"
              >
                Say hello
              </a>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
