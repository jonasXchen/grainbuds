import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getProducts } from "@/lib/data";
import { formatPrice } from "@/lib/types";
import ProductImage from "@/components/site/ProductImage";
import ProductPurchase from "@/components/site/ProductPurchase";
import ProductCard from "@/components/site/ProductCard";
import Reveal from "@/components/site/Reveal";

export const revalidate = 60;

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = (
    await getProducts({ categorySlug: product.category?.slug })
  )
    .filter((item) => item.id !== product.id)
    .slice(0, 3);

  return (
    <div className="px-5 pb-28 pt-32 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <Link
            href="/shop"
            className="group inline-flex items-center gap-2 text-sm font-medium text-ink/60 transition-colors hover:text-ink"
          >
            <span className="transition-transform duration-300 group-hover:-translate-x-1">
              ←
            </span>
            Back to shop
          </Link>
        </Reveal>

        <div className="mt-8 grid items-start gap-12 lg:grid-cols-2">
          <Reveal className="overflow-hidden rounded-3xl">
            <div className="aspect-square">
              <ProductImage product={product} className="h-full w-full" />
            </div>
          </Reveal>

          <div className="lg:pt-6">
            <Reveal delay={0.1}>
              {product.category && (
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-matcha-deep">
                  {product.category.name}
                </p>
              )}
              <h1 className="mt-3 font-display text-4xl leading-tight text-ink sm:text-5xl">
                {product.name}
              </h1>
              <p className="mt-4 font-display text-2xl text-sand-deep">
                {formatPrice(product.price_cents)}
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-ink/65">
                {product.description}
              </p>
            </Reveal>
            <Reveal delay={0.3} className="mt-8">
              <ProductPurchase product={product} />
            </Reveal>
            <Reveal delay={0.4}>
              <div className="mt-10 space-y-3 border-t border-ink/10 pt-6 text-sm text-ink/55">
                <p className="flex items-center gap-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-matcha" />
                  Made to order — nothing sits under a heat lamp.
                </p>
                <p className="flex items-center gap-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-matcha" />
                  Pay in store when you pick up. No card needed online.
                </p>
              </div>
            </Reveal>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-24">
            <Reveal>
              <h2 className="font-display text-3xl text-ink">
                You might also like
              </h2>
            </Reveal>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item, i) => (
                <ProductCard key={item.id} product={item} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
