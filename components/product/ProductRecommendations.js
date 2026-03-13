"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatCad } from "@/lib/product-helpers";
import { useTranslation } from "@/lib/i18n/useTranslation";

/**
 * "You may also like" product recommendations block.
 * Fetches recommendations from /api/products/[slug]/recommendations.
 *
 * @param {{ slug: string, category: string }} props
 */
export default function ProductRecommendations({ slug, category }) {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    fetch(`/api/products/${slug}/recommendations`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (!cancelled && Array.isArray(data.recommendations)) {
          setProducts(data.recommendations);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [slug]);

  if (loading || products.length === 0) return null;

  return (
    <section className="mt-16 border-t border-gray-200 pt-10">
      <h2 className="mb-6 text-xl font-semibold tracking-tight text-gray-900">
        {t("product.youMayAlsoLike") || "You may also like"}
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/shop/${p.category}/${p.slug}`}
            className="group rounded-lg border border-gray-100 bg-white p-3 transition-shadow hover:shadow-md"
          >
            <div className="relative mb-3 aspect-square overflow-hidden rounded-md bg-gray-50">
              {p.imageUrl ? (
                <Image
                  src={p.imageUrl}
                  alt={p.name}
                  fill
                  className="object-contain transition-transform group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-300">
                  <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            <h3 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600">
              {p.name}
            </h3>
            {p.price > 0 && (
              <p className="mt-1 text-xs text-gray-500">
                {t("search.from") || "From"} {formatCad(p.price)}
              </p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
