"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { useT } from "@/lib/i18n/context";

export default function Hero() {
  const t = useT();
  const headline = t.hero.headline;
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const fadeOut = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section
      id="top"
      data-section-theme="dark"
      ref={ref}
      className="relative flex min-h-dvh flex-col justify-center overflow-hidden bg-ink px-5 pt-24 sm:px-8"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <video
          className="h-full w-full object-cover motion-reduce:hidden"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          tabIndex={-1}
        >
          <source src="/videos/hero-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-ink/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/55 to-ink/15" />
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-cream/70 to-transparent" />
      </div>

      <motion.div
        style={{ opacity: fadeOut }}
        className="relative mx-auto w-full max-w-6xl"
      >
        <div className="max-w-3xl">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-xs font-semibold uppercase tracking-[0.3em] text-matcha"
          >
            {t.hero.eyebrow}
          </motion.p>

          <h1 className="mt-5 font-display text-5xl leading-[0.95] tracking-tight text-cream sm:text-6xl lg:text-7xl xl:text-8xl">
            {headline.map((word, i) => (
              <span
                key={i}
                className="inline-block overflow-hidden pb-[0.22em] pr-4"
              >
                <motion.span
                  className={`inline-block ${i >= 2 ? "text-matcha" : ""}`}
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
            className="mt-6 max-w-md text-base leading-relaxed text-cream/75 sm:text-lg"
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
              href="/#shop"
              className="group rounded-full bg-cream px-8 py-4 text-sm font-medium text-ink transition-all duration-300 hover:bg-matcha hover:shadow-[0_16px_40px_-16px_rgba(157,179,75,0.7)]"
            >
              {t.hero.cta}
              <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>
          </motion.div>
        </div>

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
          className="flex flex-col items-center gap-2 text-cream/60"
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
