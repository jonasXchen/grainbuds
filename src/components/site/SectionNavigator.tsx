"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n/context";

const sectionIds = ["top", "shop", "gallery", "visit"] as const;

export default function SectionNavigator() {
  const [activeIndex, setActiveIndex] = useState(0);
  const t = useT();

  useEffect(() => {
    const updateActiveSection = () => {
      const marker = window.scrollY + window.innerHeight * 0.35;
      let nextIndex = 0;

      sectionIds.forEach((id, index) => {
        const section = document.getElementById(id);
        if (section && section.offsetTop <= marker) nextIndex = index;
      });

      setActiveIndex(nextIndex);
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);
    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, []);

  const previousSection = sectionIds[Math.max(0, activeIndex - 1)];
  const nextSection = sectionIds[Math.min(sectionIds.length - 1, activeIndex + 1)];

  return (
    <nav
      aria-label={t.nav.sectionNavigation}
      className="fixed bottom-5 right-5 z-30 flex flex-col overflow-hidden rounded-full border border-white/45 bg-transparent sm:bottom-7 sm:right-7"
    >
      <a
        href={`#${previousSection}`}
        aria-label={t.nav.previousSection}
        aria-disabled={activeIndex === 0}
        className={`grid h-11 w-11 place-items-center transition-colors ${
          activeIndex === 0
            ? "text-white/20"
            : "text-white/55 hover:text-white/90"
        }`}
      >
        <span aria-hidden="true" className="text-lg leading-none">↑</span>
      </a>
      <span className="mx-2 h-px bg-white/35" aria-hidden="true" />
      <a
        href={`#${nextSection}`}
        aria-label={t.nav.nextSection}
        aria-disabled={activeIndex === sectionIds.length - 1}
        className={`grid h-11 w-11 place-items-center transition-colors ${
          activeIndex === sectionIds.length - 1
            ? "text-white/20"
            : "text-white/55 hover:text-white/90"
        }`}
      >
        <span aria-hidden="true" className="text-lg leading-none">↓</span>
      </a>
    </nav>
  );
}
