"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { useT } from "@/lib/i18n/context";
import { heroImage } from "@/lib/cafe-info";

export default function Hero() {
  const t = useT();
  const headline = t.hero.headline;
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const bowlY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const fadeOut = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative flex min-h-dvh flex-col justify-center overflow-hidden px-5 pt-24 sm:px-8"
    >
      {/* floating background blobs */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="animate-float-slow absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-matcha/20 blur-3xl" />
        <div className="animate-float-slower absolute -right-16 top-16 h-80 w-80 rounded-full bg-sand/30 blur-3xl" />
        <div className="animate-float-slow absolute bottom-10 left-1/3 h-56 w-56 rounded-full bg-matcha/15 blur-3xl" />
      </div>

      <motion.div
        style={{ opacity: fadeOut }}
        className="relative mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1.2fr_1fr]"
      >
        <div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-xs font-semibold uppercase tracking-[0.3em] text-matcha-deep"
          >
            {t.hero.eyebrow}
          </motion.p>

          <h1 className="mt-5 font-display text-5xl leading-[0.95] tracking-tight text-ink sm:text-6xl lg:text-7xl xl:text-8xl">
            {headline.map((word, i) => (
              <span key={i} className="inline-block overflow-hidden pb-2 pr-4">
                <motion.span
                  className={`inline-block ${i >= 2 ? "text-matcha-deep" : ""}`}
                  initial={{ y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{
                    duration: 0.9,
                    delay: 0.35 + i * 0.12,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {word}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.9 }}
            className="mt-6 max-w-md text-base leading-relaxed text-ink/60 sm:text-lg"
          >
            {t.hero.sub}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.05 }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <Link
              href="/shop"
              className="group rounded-full bg-ink px-8 py-4 text-sm font-medium text-cream transition-all duration-300 hover:bg-matcha-deep hover:shadow-[0_16px_40px_-16px_rgba(109,127,46,0.7)]"
            >
              {t.hero.cta}
              <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>
            <Link
              href="/#story"
              className="link-underline text-sm font-medium text-ink/70"
            >
              {t.hero.ourStory}
            </Link>
          </motion.div>
        </div>

        {/* matcha bowl illustration */}
        <motion.div
          style={{ y: bowlY }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto hidden w-full max-w-sm lg:block"
        >
          <div className="animate-spin-slow absolute -left-8 top-6 z-10 h-28 w-28 rounded-full bg-cream/80 backdrop-blur-sm" aria-hidden>
            <svg viewBox="0 0 100 100" className="h-full w-full">
              <defs>
                <path
                  id="circlePath"
                  d="M 50,50 m -38,0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0"
                />
              </defs>
              {/* textLength = circle circumference (2π·38) so the text always
                  closes the loop exactly — never clipped, never gapped. */}
              <text className="fill-ink/50 text-[10px] uppercase tracking-[0.18em]">
                <textPath
                  href="#circlePath"
                  textLength={238.7}
                  lengthAdjust="spacing"
                >
                  {t.hero.seal}
                </textPath>
              </text>
            </svg>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroImage}
            alt="Matcha at Grainbuds"
            className="aspect-[4/5] w-full rounded-b-[2.5rem] rounded-t-[999px] border border-ink/10 object-cover shadow-[0_50px_100px_-40px_rgba(18,26,37,0.5)]"
          />
        </motion.div>
      </motion.div>

      {/* scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.8 }}
        style={{ opacity: fadeOut }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2 text-ink/40"
        >
          <span className="text-[11px] uppercase tracking-[0.25em]">
            {t.hero.scroll}
          </span>
          <svg viewBox="0 0 16 24" className="h-6 w-4" fill="none">
            <rect x="1.5" y="1.5" width="13" height="21" rx="6.5" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="8" cy="8" r="2" fill="currentColor" />
          </svg>
        </motion.div>
      </motion.div>
    </section>
  );
}
