"use client";

import { motion, useScroll, useTransform } from "framer-motion";

export default function HeroShopBlur() {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 140, 280], [0, 0, 1]);

  return (
    <motion.div
      aria-hidden="true"
      style={{
        opacity,
        maskImage: "linear-gradient(to bottom, transparent, black 28%, black 72%, transparent)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent, black 28%, black 72%, transparent)",
      }}
      className="pointer-events-none absolute inset-x-0 -top-24 z-20 h-48 bg-gradient-to-b from-transparent via-cream/15 to-transparent backdrop-blur-xl"
    />
  );
}
