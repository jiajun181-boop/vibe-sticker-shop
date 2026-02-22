"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";

const cad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

const BADGE_MAP = {
  "retractable-banner-stand-premium": { labelKey: "featured.badge.bestSeller", color: "from-amber-500 to-orange-500" },
  "x-banner-stand-standard": { labelKey: "featured.badge.budgetFriendly", color: "from-green-500 to-emerald-500" },
  "x-banner-stand-large": { labelKey: "featured.badge.highImpact", color: "from-[var(--color-moon-blue)] to-[var(--color-moon-blue-deep)]" },
  "tabletop-banner-a4": { labelKey: "featured.badge.compact", color: "from-[var(--color-gray-600)] to-[var(--color-gray-800)]" },
  "tabletop-banner-a3": { labelKey: "featured.badge.popular", color: "from-[var(--color-moon-gold)] to-amber-600" },
  "deluxe-tabletop-retractable-a3": { labelKey: "featured.badge.premium", color: "from-[var(--color-gray-700)] to-[var(--color-gray-900)]" },
};

const SIZE_LABELS = {
  "retractable-banner-stand-premium": '33" x 81"',
  "x-banner-stand-standard": '24" x 63"',
  "x-banner-stand-large": '31" x 71"',
  "tabletop-banner-a4": '8.3" x 11.7" (A4)',
  "tabletop-banner-a3": '11.7" x 16.5" (A3)',
  "deluxe-tabletop-retractable-a3": '11.7" x 16.5" (A3)',
};

export default function FeaturedBanner({ products }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const { t } = useTranslation();

  const next = useCallback(() => {
    setActive((i) => (i + 1) % Math.max(1, Math.ceil((products?.length || 1) / 2)));
  }, [products?.length]);

  useEffect(() => {
    if (paused || !products || products.length <= 2) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [paused, next, products?.length]);

  if (!products || products.length === 0) return null;

  const pages = [];
  for (let i = 0; i < products.length; i += 2) {
    pages.push(products.slice(i, i + 2));
  }

  return (
    <section
      className="relative overflow-hidden rounded-2xl shadow-[var(--shadow-card)] bg-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative z-10 p-6 md:p-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-gray-500)]" />
            <h2 className="label-xs tracking-[0.16em] text-[var(--color-gray-600)]">
              {t("featured.title")}
            </h2>
          </div>
          <Link
            href="/shop?category=display-stands"
            className="label-xs tracking-[0.14em] text-[var(--color-gray-500)] transition-colors hover:text-[var(--color-gray-800)]"
          >
            {t("featured.viewAll")} &rarr;
          </Link>
        </div>

        {/* Desktop: 3-column grid showing all 6 */}
        <div className="hidden md:grid md:grid-cols-3 gap-4">
          {products.map((p) => (
            <FeaturedCard key={p.id} product={p} />
          ))}
        </div>

        {/* Mobile: 2-per-page carousel */}
        <div className="md:hidden">
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${active * 100}%)` }}
            >
              {pages.map((page, pi) => (
                <div key={pi} className="w-full flex-shrink-0 grid grid-cols-2 gap-3 px-0.5">
                  {page.map((p) => (
                    <FeaturedCard key={p.id} product={p} compact />
                  ))}
                </div>
              ))}
            </div>
          </div>
          {pages.length > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {pages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === active ? "bg-white w-6" : "bg-white/30 w-1.5"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function FeaturedCard({ product, compact }) {
  const { t } = useTranslation();
  const badge = BADGE_MAP[product.slug];
  const sizeLabel = SIZE_LABELS[product.slug];
  const img = product.images?.[0]?.url;

  return (
    <Link
      href={`/shop/${product.category}/${product.slug}`}
      className="group block rounded-xl shadow-[var(--shadow-card)] bg-white p-4 md:p-5 transition-all duration-200 hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-1"
    >
      {/* Badge */}
      {badge && (
        <div className="mb-3 inline-block rounded-full bg-[var(--color-brand-50)] text-[var(--color-brand-dark)] px-2.5 py-1 label-xs">
          {t(badge.labelKey)}
        </div>
      )}

      {/* Image */}
      <div className={`${compact ? "aspect-[3/4]" : "aspect-[4/5]"} mb-3 overflow-hidden rounded-xl bg-[var(--color-gray-50)] md:mb-4 flex items-center justify-center`}>
        {img ? (
          <Image
            src={img}
            alt={product.name}
            width={400}
            height={500}
            className="h-full w-full rounded-xl object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="text-3xl opacity-20">&#128444;</span>
        )}
      </div>

      {/* Info */}
      <h3 className={`mb-1 leading-tight text-[var(--color-gray-900)] font-semibold ${compact ? "body-sm" : "body-base"}`}>
        {product.name}
      </h3>

      {sizeLabel && (
        <p className="label-xs text-[var(--color-gray-500)] font-mono mb-2 tracking-normal">{sizeLabel}</p>
      )}

      {!compact && product.description && (
        <p className="mb-3 line-clamp-2 text-xs font-normal tracking-normal text-[var(--color-gray-500)]">{product.description}</p>
      )}

      <div className="flex items-end justify-between mt-auto">
        <div>
          <span className="label-xs block text-[var(--color-gray-500)]">{t("home.from")}</span>
          <p className="text-base font-bold tracking-tight text-[var(--color-gray-900)] md:text-lg">
            {cad(product.basePrice)}
          </p>
        </div>
        <span className="whitespace-nowrap rounded-full bg-[var(--color-brand)] px-3 py-1.5 label-xs tracking-wide text-white opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
          {t("featured.customize")} &rarr;
        </span>
      </div>
    </Link>
  );
}
