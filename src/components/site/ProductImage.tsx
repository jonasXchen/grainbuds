/* eslint-disable @next/next/no-img-element */
import type { Product } from "@/lib/types";

const palettes = [
  { bg: "#dfe5c3", fg: "#6d7f2e" }, // matcha
  { bg: "#ecdcc3", fg: "#a9885d" }, // sand
  { bg: "#d8dde2", fg: "#121a25" }, // ink
  { bg: "#e4e9cf", fg: "#9db34b" }, // light matcha
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** A calm, deterministic illustration used when a product has no photo yet. */
function Placeholder({ product }: { product: Product }) {
  const palette = palettes[hashString(product.slug) % palettes.length];
  const glyph = hashString(product.name) % 3;

  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{ backgroundColor: palette.bg }}
      aria-hidden
    >
      <svg
        viewBox="0 0 120 120"
        className="h-2/5 w-2/5 opacity-80 transition-transform duration-700 ease-out group-hover:scale-110 group-hover:-rotate-3"
      >
        {glyph === 0 && (
          // tea bowl
          <g fill="none" stroke={palette.fg} strokeWidth="4" strokeLinecap="round">
            <path d="M25 52 h70 a2 2 0 0 1 2 2 c0 22 -16 38 -37 38 s-37 -16 -37 -38 a2 2 0 0 1 2 -2 z" />
            <path d="M38 62 c8 6 36 6 44 0" opacity="0.55" />
            <path d="M52 34 c0 -6 6 -6 6 -12 M66 36 c0 -5 5 -5 5 -10" opacity="0.5" />
          </g>
        )}
        {glyph === 1 && (
          // leaf
          <g fill="none" stroke={palette.fg} strokeWidth="4" strokeLinecap="round">
            <path d="M60 100 C 20 80, 24 34, 62 18 C 96 36, 98 82, 60 100 z" />
            <path d="M60 96 V 26" opacity="0.55" />
            <path d="M60 56 c-8 -4 -14 -10 -16 -18 M60 74 c8 -4 14 -10 16 -18" opacity="0.5" />
          </g>
        )}
        {glyph === 2 && (
          // cup with steam
          <g fill="none" stroke={palette.fg} strokeWidth="4" strokeLinecap="round">
            <path d="M32 50 h52 v28 a18 18 0 0 1 -18 18 h-16 a18 18 0 0 1 -18 -18 z" />
            <path d="M84 56 h6 a10 10 0 0 1 0 20 h-8" />
            <path d="M48 36 c0 -6 5 -6 5 -12 M64 38 c0 -5 4 -5 4 -10" opacity="0.5" />
          </g>
        )}
      </svg>
    </div>
  );
}

export default function ProductImage({
  product,
  className = "",
}: {
  product: Product;
  className?: string;
}) {
  return (
    <div className={`group relative overflow-hidden ${className}`}>
      {product.image_url ? (
        <img
          src={product.image_url}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
      ) : (
        <Placeholder product={product} />
      )}
    </div>
  );
}
