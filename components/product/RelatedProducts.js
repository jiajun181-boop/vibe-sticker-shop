"use client";

import Image from "next/image";
import Link from "next/link";
import { getProductImage, isSvgImage } from "@/lib/product-image";
import { formatCad } from "@/lib/product-helpers";

export default function RelatedProducts({ product, relatedProducts, t }) {
  if (!relatedProducts || relatedProducts.length === 0) return null;

  return (
    <section>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">{t("product.relatedProducts")}</h2>
        <Link href={`/shop?category=${product.category}`} className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-600)] hover:text-[var(--color-gray-900)]">{t("product.viewCategory")}</Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {relatedProducts.map((item) => {
          const relatedImage = getProductImage(item);
          return (
            <Link key={item.id} href={`/shop/${item.category}/${item.slug}`} className="overflow-hidden rounded-2xl border border-[var(--color-gray-200)] bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="relative aspect-[4/3] bg-[var(--color-gray-100)]">
                <Image src={relatedImage} alt={item.images?.[0]?.alt || item.name} fill className="object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" unoptimized={isSvgImage(relatedImage)} />
              </div>
              <div className="p-4">
                <p className="text-sm font-semibold">{item.name}</p>
                {item.basePrice > 0 && (
                  <p className="mt-1 text-xs text-[var(--color-gray-600)]">{t("product.from", { price: formatCad(item.basePrice) })}</p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
