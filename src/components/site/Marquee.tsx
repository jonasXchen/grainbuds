export default function Marquee({ items }: { items: string[] }) {
  const row = [...items, ...items];
  return (
    <div className="overflow-hidden border-y border-ink/10 bg-matcha py-4">
      <div className="animate-marquee flex w-max items-center gap-8 whitespace-nowrap">
        {row.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-8 font-display text-lg text-ink/80"
          >
            {item}
            <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 fill-cream">
              <circle cx="6" cy="6" r="5" />
            </svg>
          </span>
        ))}
      </div>
    </div>
  );
}
