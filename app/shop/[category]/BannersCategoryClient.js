"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Breadcrumbs from "@/components/Breadcrumbs";
import CategoryHero from "@/components/category/CategoryHero";
import CategoryFaq from "@/components/category/CategoryFaq";
import { isSvgImage } from "@/lib/product-image";

const BASE = "/shop/banners-displays";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

/* ── Section definitions ── */
const ITEM_I18N = {
  "vinyl-banners": "bd.item.vinylBanners",
  "mesh-banners": "bd.item.meshBanners",
  "pole-banners": "bd.item.poleBanners",
  "double-sided-banners": "bd.item.doubleSided",
  "roll-up-banners": "bd.item.rollUp",
  "x-banner-frame-print": "bd.item.xBanner",
  "tabletop-x-banner": "bd.item.tabletopX",
  "deluxe-tabletop-retractable-a3": "bd.item.tabletopRetractable",
  "telescopic-backdrop": "bd.item.telescopic",
  "popup-display-curved-8ft": "bd.item.popupDisplay",
  "table-cloth": "bd.item.tableCloth",
  "feather-flags": "bd.item.featherFlags",
  "teardrop-flags": "bd.item.teardropFlags",
  "outdoor-canopy-tent-10x10": "bd.item.canopyTent",
};

/* ── Taglines (i18n keys) ── */
const TAGLINE_KEYS = {
  "vinyl-banners": "bd.tagline.vinylBanners",
  "mesh-banners": "bd.tagline.meshBanners",
  "pole-banners": "bd.tagline.poleBanners",
  "double-sided-banners": "bd.tagline.doubleSided",
  "roll-up-banners": "bd.tagline.rollUp",
  "x-banner-frame-print": "bd.tagline.xBanner",
  "tabletop-x-banner": "bd.tagline.tabletopX",
  "deluxe-tabletop-retractable-a3": "bd.tagline.tabletopRetractable",
  "telescopic-backdrop": "bd.tagline.telescopic",
  "popup-display-curved-8ft": "bd.tagline.popupDisplay",
  "table-cloth": "bd.tagline.tableCloth",
  "feather-flags": "bd.tagline.featherFlags",
  "teardrop-flags": "bd.tagline.teardropFlags",
  "outdoor-canopy-tent-10x10": "bd.tagline.canopyTent",
};

/* ── Compare cues (i18n keys) ── */
const CUES = {
  "vinyl-banners": ["cue.outdoor", "cue.durable"],
  "mesh-banners": ["cue.windProof", "cue.outdoor"],
  "pole-banners": ["cue.doubleSided", "cue.outdoor"],
  "double-sided-banners": ["cue.doubleSided"],
  "roll-up-banners": ["cue.portable", "cue.standIncl"],
  "x-banner-frame-print": ["cue.portable", "cue.standIncl"],
  "tabletop-x-banner": ["cue.tabletop", "cue.portable"],
  "deluxe-tabletop-retractable-a3": ["cue.tabletop", "cue.portable"],
  "telescopic-backdrop": ["cue.portable", "cue.event"],
  "popup-display-curved-8ft": ["cue.portable", "cue.event"],
  "table-cloth": ["cue.event", "cue.fitted"],
  "feather-flags": ["cue.outdoor", "cue.poleKit"],
  "teardrop-flags": ["cue.outdoor", "cue.poleKit"],
  "outdoor-canopy-tent-10x10": ["cue.outdoor", "cue.event"],
};

const SECTIONS = [
  {
    key: "vinyl-outdoor",
    titleKey: "bd.section.banners.title",
    subtitleKey: "bd.section.banners.subtitle",
    items: [
      { key: "vinyl-banners", href: `${BASE}/vinyl-banners`, gradient: "from-rose-400 to-pink-400" },
      { key: "mesh-banners", href: `${BASE}/mesh-banners`, gradient: "from-sky-400 to-cyan-400" },
      { key: "pole-banners", href: `${BASE}/pole-banners`, gradient: "from-amber-400 to-orange-400" },
      { key: "double-sided-banners", href: `${BASE}/double-sided-banners`, gradient: "from-violet-400 to-fuchsia-400" },
    ],
  },
  {
    key: "stands",
    titleKey: "bd.section.stands.title",
    subtitleKey: "bd.section.stands.subtitle",
    items: [
      { key: "roll-up-banners", href: `${BASE}/roll-up-banners`, gradient: "from-emerald-400 to-teal-400" },
      { key: "x-banner-frame-print", href: `${BASE}/x-banner-frame-print`, gradient: "from-indigo-400 to-blue-400" },
      { key: "tabletop-x-banner", href: `${BASE}/tabletop-x-banner`, gradient: "from-pink-400 to-rose-400" },
      { key: "deluxe-tabletop-retractable-a3", href: `${BASE}/deluxe-tabletop-retractable-a3`, gradient: "from-amber-400 to-yellow-400" },
    ],
  },
  {
    key: "tradeshow",
    titleKey: "bd.section.tradeshow.title",
    subtitleKey: "bd.section.tradeshow.subtitle",
    items: [
      { key: "telescopic-backdrop", href: `${BASE}/telescopic-backdrop`, gradient: "from-slate-400 to-gray-400" },
      { key: "popup-display-curved-8ft", href: `${BASE}/popup-display-curved-8ft`, gradient: "from-blue-400 to-indigo-400" },
      { key: "table-cloth", href: `${BASE}/table-cloth`, gradient: "from-teal-400 to-cyan-400" },
    ],
  },
  {
    key: "flags-outdoor",
    titleKey: "bd.section.outdoor.title",
    subtitleKey: "bd.section.outdoor.subtitle",
    items: [
      { key: "feather-flags", href: `${BASE}/feather-flags`, gradient: "from-orange-400 to-red-400" },
      { key: "teardrop-flags", href: `${BASE}/teardrop-flags`, gradient: "from-cyan-400 to-sky-400" },
      { key: "outdoor-canopy-tent-10x10", href: `${BASE}/outdoor-canopy-tent-10x10`, gradient: "from-emerald-400 to-green-400" },
    ],
  },
];

function ProductCard({ item, price, imageUrl, hoverImageUrl, t }) {
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const showUrl = hovered && hoverImageUrl ? hoverImageUrl : imageUrl;
  const isSvg = showUrl && isSvgImage(showUrl);
  const name = t(ITEM_I18N[item.key] || item.key);
  const tagline = TAGLINE_KEYS[item.key] ? t(TAGLINE_KEYS[item.key]) : "";
  const cues = CUES[item.key] || [];
  return (
    <Link
      href={item.href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--color-gray-200)] bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative overflow-hidden bg-[var(--color-gray-100)] aspect-[4/3]">
        {showUrl && !imgError ? (
          isSvg ? (
            <img src={showUrl} alt={name} loading="lazy" onError={() => setImgError(true)} className="h-full w-full object-cover transition-opacity duration-300" />
          ) : (
            <Image src={showUrl} alt={name} fill onError={() => setImgError(true)} className="object-cover transition-opacity duration-300 group-hover:scale-105" sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw" />
          )
        ) : (
          <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${item.gradient}`}>
            <p className="px-6 text-center text-lg font-bold text-[#fff] drop-shadow-md">
              {name}
            </p>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-2.5 sm:p-3">
        <h3 className="text-sm font-semibold text-[var(--color-gray-900)]">
          {name}
        </h3>
        {tagline && (
          <p className="mt-0.5 text-[11px] leading-tight text-gray-500 line-clamp-2">
            {tagline}
          </p>
        )}
        {cues.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {cues.map((c) => (
              <span key={c} className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-medium text-gray-600">
                {t(c)}
              </span>
            ))}
          </div>
        )}
        <div className="mt-auto pt-3 flex items-center justify-between">
          {price > 0 ? (
            <span className="text-sm font-bold text-[var(--color-gray-900)]">
              {t("shop.fromLabel")} {formatCad(price)}
            </span>
          ) : (
            <span className="text-xs text-[var(--color-gray-400)]">{t("shop.getQuote")}</span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-brand)] px-2.5 py-1 text-[9px] font-semibold text-[#fff] transition-colors group-hover:bg-[var(--color-brand-dark)]">
            {t("shop.configure")}
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ── Related categories ── */
const BD_RELATED = [
  { title: "Signs & Display Boards", titleZh: "标牌和展示板", desc: "Coroplast, foam board, acrylic & aluminum", descZh: "瓦楞板、泡沫板、亚克力和铝板", href: "/shop/signs-rigid-boards" },
  { title: "Vehicle Graphics", titleZh: "车辆图形", desc: "Wraps, magnets, decals & fleet branding", descZh: "车贴、磁性贴、贴花和车队品牌", href: "/shop/vehicle-graphics-fleet" },
  { title: "Window, Wall & Floor", titleZh: "窗墙地面", desc: "Window clings, wall murals & floor graphics", descZh: "窗贴、墙面壁画和地面图形", href: "/shop/windows-walls-floors" },
];

export default function BannersCategoryClient({ bannerPrices = {}, bannerImages = {}, bannerImages2 = {} }) {
  const { t, locale } = useTranslation();

  return (
    <main className="bg-gradient-to-b from-rose-50 to-white pb-20 pt-10 text-[var(--color-gray-900)]">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 2xl:px-4">
        <Breadcrumbs
          items={[
            { label: t("product.shop"), href: "/shop" },
            { label: t("bd.breadcrumb") },
          ]}
        />

        <div className="mt-6">
          <CategoryHero category="banners-displays" title={t("bd.title")} icon="🎪" />
        </div>

        {/* Sections */}
        {SECTIONS.map((section) => {
          const visibleItems = section.items.filter((item) => item.key in bannerPrices);
          if (visibleItems.length === 0) return null;

          return (
            <section key={section.key} className="mt-12">
              <h2 className="text-xl font-semibold tracking-tight">{t(section.titleKey)}</h2>
              <p className="mt-1 text-sm text-[var(--color-gray-500)]">{t(section.subtitleKey)}</p>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
                {visibleItems.map((item) => (
                  <ProductCard
                    key={item.key}
                    item={item}
                    price={bannerPrices[item.key] || 0}
                    imageUrl={bannerImages[item.key]}
                    hoverImageUrl={bannerImages2[item.key]}
                    t={t}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {SECTIONS.every((section) => section.items.every((item) => !(item.key in bannerPrices))) && (
          <p className="mt-12 text-center text-sm text-[var(--color-gray-500)]">
            {t("shop.noProducts")}
          </p>
        )}

        <CategoryFaq category="banners-displays" />

        {/* Related categories */}
        <section className="mt-12">
          <h2 className="text-xl font-semibold tracking-tight">{t("bd.related")}</h2>
          <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-3">
            {BD_RELATED.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className="group flex items-center gap-4 rounded-xl border border-[var(--color-gray-200)] bg-white p-5 transition-all hover:border-[var(--color-brand)] hover:shadow-md"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-[var(--color-gray-900)] group-hover:text-[var(--color-brand)]">
                    {locale === "zh" ? cat.titleZh : cat.title}
                  </h3>
                  <p className="mt-1 text-xs text-[var(--color-gray-500)] truncate">
                    {locale === "zh" ? cat.descZh : cat.desc}
                  </p>
                </div>
                <svg className="h-4 w-4 shrink-0 text-[var(--color-gray-400)] group-hover:text-[var(--color-brand)] transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            ))}
          </div>
        </section>

        {/* Back to shop */}
        <div className="mt-12 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-gray-300)] px-5 py-2.5 text-xs font-semibold text-[var(--color-gray-600)] transition-colors hover:border-[var(--color-gray-900)] hover:text-[var(--color-gray-900)]"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            {t("shop.backToCategories")}
          </Link>
        </div>

        {/* Value Props */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl shadow-[var(--shadow-card)] bg-white p-5">
            <h3 className="text-sm font-semibold text-[var(--color-gray-600)]">
              {t("bd.vp1.title")}
            </h3>
            <p className="mt-3 text-sm text-[var(--color-gray-700)]">
              {t("bd.vp1.desc")}
            </p>
          </div>
          <div className="rounded-2xl shadow-[var(--shadow-card)] bg-white p-5">
            <h3 className="text-sm font-semibold text-[var(--color-gray-600)]">
              {t("bd.vp2.title")}
            </h3>
            <p className="mt-3 text-sm text-[var(--color-gray-700)]">
              {t("bd.vp2.desc")}
            </p>
          </div>
          <div className="rounded-2xl shadow-[var(--shadow-card)] bg-white p-5">
            <h3 className="text-sm font-semibold text-[var(--color-gray-600)]">
              {t("bd.vp3.title")}
            </h3>
            <p className="mt-3 text-sm text-[var(--color-gray-700)]">
              {t("bd.vp3.desc")}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
