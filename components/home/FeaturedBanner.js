"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";

const cad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

const BADGE_MAP = {
  "retractable-banner-stand-premium": { labelKey: "featured.badge.bestSeller", color: "from-amber-500 to-orange-500" },
  "x-banner-stand-standard": { labelKey: "featured.badge.budgetFriendly", color: "from-green-500 to-emerald-500" },
  "x-banner-stand-large": { labelKey: "featured.badge.highImpact", color: "from-[var(--color-moon-blue)] to-[var(--color-moon-blue-deep)]" },
  "tabletop-banner-a4": { labelKey: "featured.badge.compact", color: "from-violet-500 to-purple-500" },
  "tabletop-banner-a3": { labelKey: "featured.badge.popular", color: "from-rose-500 to-pink-500" },
  "deluxe-tabletop-retractable-a3": { labelKey: "featured.badge.premium", color: "from-gray-700 to-gray-900" },
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
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-black"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Background glow */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[var(--color-moon-blue)] rounded-full blur-[128px]" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[var(--color-moon-gold)] rounded-full blur-[128px]" />
      </div>

      <div className="relative z-10 p-8 md:p-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[var(--color-moon-gold)] animate-pulse" />
            <h2 className="text-white text-xs font-black uppercase tracking-[0.2em]">
              {t("featured.title")}
            </h2>
          </div>
          <Link
            href="/shop?category=display-stands"
            className="text-[10px] font-bold text-gray-400 hover:text-white uppercase tracking-widest transition-colors"
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
      className="group block bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 md:p-5 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-1"
    >
      {/* Badge */}
      {badge && (
        <div className={`inline-block bg-gradient-to-r ${badge.color} text-white text-[8px] md:text-[9px] font-black uppercase tracking-wider px-2 py-0.5 md:px-2.5 md:py-1 rounded-full mb-3`}>
          {t(badge.labelKey)}
        </div>
      )}

      {/* Image */}
      <div className={`${compact ? "aspect-[3/4]" : "aspect-[4/5]"} rounded-xl bg-white/5 mb-3 md:mb-4 overflow-hidden flex items-center justify-center`}>
        {img ? (
          <img
            src={img}
            alt={product.name}
            className="w-full h-full object-cover rounded-xl group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <span className="text-3xl opacity-20">🖼️</span>
        )}
      </div>

      {/* Info */}
      <h3 className={`text-white font-bold ${compact ? "text-xs" : "text-sm"} leading-tight mb-1 group-hover:text-[var(--color-moon-gold)] transition-colors`}>
        {product.name}
      </h3>

      {sizeLabel && (
        <p className="text-[10px] text-gray-500 font-mono mb-2">{sizeLabel}</p>
      )}

      {!compact && product.description && (
        <p className="text-[11px] text-gray-400 line-clamp-2 mb-3">{product.description}</p>
      )}

      <div className="flex items-end justify-between mt-auto">
        <div>
          <span className="text-[9px] text-gray-500 uppercase tracking-widest block">{t("home.from")}</span>
          <p className="text-white font-black text-base md:text-lg tracking-tight">
            {cad(product.basePrice)}
          </p>
        </div>
        <span className="bg-white/10 text-white text-[9px] md:text-[10px] font-bold px-3 py-1.5 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity whitespace-nowrap">
          {t("featured.customize")} &rarr;
        </span>
      </div>
    </Link>
  );
}
