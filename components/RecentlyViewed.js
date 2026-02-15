"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRecentlyViewedStore } from "@/lib/recently-viewed";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { getProductImage, isSvgImage } from "@/lib/product-image";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

export default function RecentlyViewed({ excludeSlug }) {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);

  useEffect(() => {
    const viewed = useRecentlyViewedStore.getState().viewed;
    const filtered = excludeSlug ? viewed.filter((p) => p.slug !== excludeSlug) : viewed;
    setItems(filtered.slice(0, 6));
  }, [excludeSlug]);

  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">{t("product.recentlyViewed")}</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {items.map((item) => {
          const imageSrc = getProductImage(item);
          return (
          <Link
            key={item.slug}
            href={`/shop/${item.category}/${item.slug}`}
            className="flex-shrink-0 w-40 overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="relative aspect-[4/3] bg-gray-100">
              <Image src={imageSrc} alt={item.name} fill className="object-cover" sizes="160px" unoptimized={isSvgImage(imageSrc)} />
            </div>
            <div className="p-3">
              <p className="truncate text-xs font-semibold text-gray-900">{item.name}</p>
              {item.basePrice && (
                <p className="mt-0.5 text-[11px] text-gray-500">{t("product.from", { price: formatCad(item.basePrice) })}</p>
              )}
            </div>
          </Link>
          );
        })}
      </div>
    </section>
  );
}
