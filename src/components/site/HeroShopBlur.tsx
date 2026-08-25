"use client";

import { useEffect, useState } from "react";

export default function HeroShopBlur() {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let animationFrame = 0;
    const update = () => {
      animationFrame = 0;
      const nextActive = window.scrollY >= 140;
      setIsActive((current) => current === nextActive ? current : nextActive);
    };
    const handleScroll = () => {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(update);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{
        maskImage: "linear-gradient(to bottom, transparent, black 28%, black 72%, transparent)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent, black 28%, black 72%, transparent)",
      }}
      className={`pointer-events-none absolute inset-x-0 -top-16 z-20 h-32 transform-gpu bg-gradient-to-b from-transparent via-cream/10 to-transparent transition-opacity duration-500 sm:-top-20 sm:h-40 ${
        isActive
          ? "opacity-100 backdrop-blur-sm sm:backdrop-blur-md"
          : "opacity-0 backdrop-blur-none"
      }`}
    />
  );
}
