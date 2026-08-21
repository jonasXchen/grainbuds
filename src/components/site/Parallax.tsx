"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/** Moves its children vertically at a different speed than the page scroll. */
export default function Parallax({
  children,
  speed = 0.3,
  className,
}: {
  children: React.ReactNode;
  /** Positive drifts down slower than scroll; negative drifts up. */
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [speed * 120, speed * -120]);

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}
