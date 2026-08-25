"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n/context";
import { useCart } from "@/lib/cart-context";

const sectionIds = ["top", "shop", "gallery", "visit"] as const;

export default function SectionNavigator() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [backgroundTheme, setBackgroundTheme] = useState<"light" | "dark">(
    "dark"
  );
  const t = useT();
  const { totalItems } = useCart();

  useEffect(() => {
    const updateActiveSection = () => {
      const marker = window.scrollY + window.innerHeight * 0.35;
      let nextIndex = 0;

      sectionIds.forEach((id, index) => {
        const section = document.getElementById(id);
        if (section && section.offsetTop <= marker) nextIndex = index;
      });

      setActiveIndex(nextIndex);

      const controlY = window.innerHeight - (totalItems > 0 ? 118 : 70);
      const sectionUnderControl = Array.from(
        document.querySelectorAll<HTMLElement>("[data-section-theme]")
      ).find((section) => {
        const bounds = section.getBoundingClientRect();
        return bounds.top <= controlY && bounds.bottom >= controlY;
      });
      setBackgroundTheme(
        sectionUnderControl?.dataset.sectionTheme === "dark" ? "dark" : "light"
      );
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);
    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, [totalItems]);

  const previousSection = sectionIds[Math.max(0, activeIndex - 1)];
  const nextSection = sectionIds[Math.min(sectionIds.length - 1, activeIndex + 1)];
  const isDarkBackground = backgroundTheme === "dark";

  return (
    <nav
      aria-label={t.nav.sectionNavigation}
      className={`fixed right-5 z-30 flex flex-col overflow-hidden rounded-full border bg-transparent transition-[bottom,border-color] duration-300 sm:bottom-7 sm:right-7 ${
        totalItems > 0 ? "bottom-24" : "bottom-5"
      } ${
        isDarkBackground ? "border-white/45" : "border-ink/15"
      }`}
    >
      <a
        href={`#${previousSection}`}
        aria-label={t.nav.previousSection}
        aria-disabled={activeIndex === 0}
        className={`grid h-11 w-11 place-items-center transition-colors ${
          activeIndex === 0
            ? isDarkBackground
              ? "text-white/20"
              : "text-ink/15"
            : isDarkBackground
              ? "text-white/55 hover:text-white/90"
              : "text-ink/40 hover:text-ink/75"
        }`}
      >
        <span aria-hidden="true" className="text-lg leading-none">↑</span>
      </a>
      <span
        className={`mx-2 h-px transition-colors duration-300 ${
          isDarkBackground ? "bg-white/35" : "bg-ink/10"
        }`}
        aria-hidden="true"
      />
      <a
        href={`#${nextSection}`}
        aria-label={t.nav.nextSection}
        aria-disabled={activeIndex === sectionIds.length - 1}
        className={`grid h-11 w-11 place-items-center transition-colors ${
          activeIndex === sectionIds.length - 1
            ? isDarkBackground
              ? "text-white/20"
              : "text-ink/15"
            : isDarkBackground
              ? "text-white/55 hover:text-white/90"
              : "text-ink/40 hover:text-ink/75"
        }`}
      >
        <span aria-hidden="true" className="text-lg leading-none">↓</span>
      </a>
    </nav>
  );
}
