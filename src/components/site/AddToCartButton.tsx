"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/lib/cart-context";
import type { Product } from "@/lib/types";

export default function AddToCartButton({
  product,
  quantity = 1,
  size = "md",
  className = "",
}: {
  product: Product;
  quantity?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const sizes = {
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base",
  } as const;

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.94 }}
      onClick={() => {
        addItem(product, quantity);
        setAdded(true);
        setTimeout(() => setAdded(false), 1400);
      }}
      className={`relative inline-flex items-center justify-center overflow-hidden rounded-full bg-ink font-medium tracking-wide text-cream transition-colors duration-300 hover:bg-matcha-deep ${sizes[size]} ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {added ? (
          <motion.span
            key="added"
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -14, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-1.5"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
              <path
                d="M3 8.5 6.5 12 13 4.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Added
          </motion.span>
        ) : (
          <motion.span
            key="add"
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -14, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            Add to order
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
