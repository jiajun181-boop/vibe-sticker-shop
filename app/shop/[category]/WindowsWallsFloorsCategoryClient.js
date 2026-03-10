"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Breadcrumbs from "@/components/Breadcrumbs";
import CategoryHero from "@/components/category/CategoryHero";
import CategoryFaq from "@/components/category/CategoryFaq";
import { isSvgImage } from "@/lib/product-image";
import { formatCad } from "@/lib/product-helpers";

const BASE = "/shop/windows-walls-floors";

/* ── Item slug → i18n key map ── */
const ITEM_I18N = {
  "one-way-vision": "wwf.item.oneWayVision",
  "frosted-window-film": "wwf.item.frostedFilm",
  "static-cling": "wwf.item.staticCling",
  "transparent-color-film": "wwf.item.transparentColor",
  "blockout-vinyl": "wwf.item.blockoutVinyl",
  "opaque-window-graphics": "wwf.item.opaqueGraphics",
  "glass-waistline": "wwf.item.glassWaistline",
  "wall-graphics": "wwf.item.wallGraphics",
  "floor-graphics": "wwf.item.floorGraphics",
  "decals": "wwf.item.customDecals",
  "vinyl-banners": "wwf.item.vinylBanners",
  "telescopic-backdrop": "wwf.item.displayBackdrop",
};

/* ── Taglines (i18n keys) ── */
const TAGLINE_KEYS = {
  "one-way-vision": "wwf.tagline.oneWayVision",
  "frosted-window-film": "wwf.tagline.frostedFilm",
  "static-cling": "wwf.tagline.staticCling",
  "transparent-color-film": "wwf.tagline.transparentColor",
  "blockout-vinyl": "wwf.tagline.blockoutVinyl",
  "opaque-window-graphics": "wwf.tagline.opaqueGraphics",
  "glass-waistline": "wwf.tagline.glassWaistline",
  "wall-graphics": "wwf.tagline.wallGraphics",
  "floor-graphics": "wwf.tagline.floorGraphics",
  "decals": "wwf.tagline.customDecals",
  "vinyl-banners": "wwf.tagline.vinylBanners",
  "telescopic-backdrop": "wwf.tagline.telescopicBackdrop",
};

/* ── Compare cues (i18n keys) ── */
const CUES = {
  "one-way-vision": ["cue.privacy", "cue.outdoor"],
  "frosted-window-film": ["cue.privacy", "cue.decorative"],
  "static-cling": ["cue.noAdhesive", "cue.removable"],
  "transparent-color-film": ["cue.decorative"],
  "blockout-vinyl": ["cue.opaque", "cue.privacy"],
  "opaque-window-graphics": ["cue.fullColor", "cue.outdoor"],
  "glass-waistline": ["cue.safety"],
  "wall-graphics": ["cue.indoor", "cue.fullColor"],
  "floor-graphics": ["cue.antiSlip", "cue.indoor"],
  "decals": ["cue.outdoor", "cue.customShape"],
  "vinyl-banners": ["cue.outdoor", "cue.durable"],
  "telescopic-backdrop": ["cue.portable", "cue.event"],
};

/* ── Section definitions ── */
const SECTIONS = [
  {
    key: "window-decals-films",
    titleKey: "wwf.section.window.title",
    subtitleKey: "wwf.section.window.subtitle",
    items: [
      { key: "one-way-vision", href: `${BASE}/one-way-vision`, gradient: "from-sky-400 to-blue-400" },
      { key: "frosted-window-film", href: `${BASE}/frosted-window-film`, gradient: "from-slate-300 to-blue-200" },
      { key: "static-cling", href: `${BASE}/static-cling`, gradient: "from-cyan-400 to-teal-400" },
      { key: "transparent-color-film", href: `${BASE}/transparent-color-film`, gradient: "from-violet-400 to-fuchsia-400" },
      { key: "blockout-vinyl", href: `${BASE}/blockout-vinyl`, gradient: "from-gray-500 to-slate-600" },
      { key: "opaque-window-graphics", href: `${BASE}/opaque-window-graphics`, gradient: "from-indigo-400 to-blue-400" },
      { key: "glass-waistline", href: `${BASE}/glass-waistline`, gradient: "from-amber-300 to-orange-300" },
    ],
  },
  {
    key: "wall",
    titleKey: "wwf.section.wall.title",
    subtitleKey: "wwf.section.wall.subtitle",
    items: [
      { key: "wall-graphics", href: `${BASE}/wall-graphics`, gradient: "from-emerald-400 to-teal-400" },
    ],
  },
  {
    key: "floor",
    titleKey: "wwf.section.floor.title",
    subtitleKey: "wwf.section.floor.subtitle",
    items: [
      { key: "floor-graphics", href: `${BASE}/floor-graphics`, gradient: "from-orange-400 to-red-400" },
    ],
  },
  {
    key: "custom-decals",
    titleKey: "wwf.section.customDecals.title",
    subtitleKey: "wwf.section.customDecals.subtitle",
    items: [
      { key: "decals", href: `${BASE}/decals`, gradient: "from-rose-400 to-pink-400" },
    ],
  },
  {
    key: "related-banners",
    titleKey: "wwf.section.relatedBanners.title",
    subtitleKey: "wwf.section.relatedBanners.subtitle",
    items: [
      { key: "vinyl-banners", href: "/shop/banners-displays/vinyl-banners", gradient: "from-sky-400 to-blue-400" },
      { key: "telescopic-backdrop", href: "/shop/banners-displays/telescopic-backdrop", gradient: "from-violet-400 to-purple-400" },
    ],
  },
];

/* ── Related categories ── */
const WWF_RELATED = [
  { title: "Signs & Display Boards", titleZh: "标牌和展示板", desc: "Coroplast, foam board, acrylic & aluminum", descZh: "瓦楞板、泡沫板、亚克力和铝板", href: "/shop/signs-rigid-boards" },
  { title: "Banners & Displays", titleZh: "横幅和展示", desc: "Vinyl banners, retractable stands & flags", descZh: "乙烯基横幅、伸缩展架和旗帜", href: "/shop/banners-displays" },
  { title: "Vehicle Graphics", titleZh: "车辆图形", desc: "Wraps, magnets, decals & fleet branding", descZh: "车贴、磁性贴、贴花和车队品牌", href: "/shop/vehicle-graphics-fleet" },
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
        <div className="mt-auto pt-2 flex items-center justify-between">
          {price > 0 ? (
            <span className="text-sm font-bold text-[var(--color-gray-900)]">
              {t("shop.fromLabel")} {formatCad(price)}
            </span>
          ) : (
            <span className="text-xs text-[var(--color-gray-400)]">{t("shop.getQuote")}</span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-brand)] px-2.5 py-1 text-[9px] font-semibold text-[#fff] transition-colors group-hover:bg-[var(--color-brand-dark)]">
            {t("shop.configureQuote")}
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function WindowsWallsFloorsCategoryClient({ wwfPrices = {}, wwfImages = {}, wwfImages2 = {} }) {
  const { t, locale } = useTranslation();

  return (
    <main className="bg-gradient-to-b from-blue-50 to-white pb-20 pt-10 text-[var(--color-gray-900)]">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 2xl:px-4">
        <Breadcrumbs
          items={[
            { label: t("product.shop"), href: "/shop" },
            { label: t("wwf.breadcrumb") },
          ]}
        />

        <div className="mt-6">
          <CategoryHero category="windows-walls-floors" title={t("wwf.title")} icon="🪟" />
        </div>

        {/* Sections */}
        {SECTIONS.map((section) => {
          const visibleItems = section.items.filter((item) => item.key in wwfPrices);
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
                    price={wwfPrices[item.key] || 0}
                    imageUrl={wwfImages[item.key]}
                    hoverImageUrl={wwfImages2[item.key]}
                    t={t}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {SECTIONS.every((section) => section.items.every((item) => !(item.key in wwfPrices))) && (
          <p className="mt-12 text-center text-sm text-[var(--color-gray-500)]">
            {t("shop.noProducts")}
          </p>
        )}

        <CategoryFaq category="windows-walls-floors" />

        {/* Related categories */}
        <section className="mt-12">
          <h2 className="text-xl font-semibold tracking-tight">{t("wwf.related")}</h2>
          <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-3">
            {WWF_RELATED.map((cat) => (
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
              {t("wwf.vp1.title")}
            </h3>
            <p className="mt-3 text-sm text-[var(--color-gray-700)]">
              {t("wwf.vp1.desc")}
            </p>
          </div>
          <div className="rounded-2xl shadow-[var(--shadow-card)] bg-white p-5">
            <h3 className="text-sm font-semibold text-[var(--color-gray-600)]">
              {t("wwf.vp2.title")}
            </h3>
            <p className="mt-3 text-sm text-[var(--color-gray-700)]">
              {t("wwf.vp2.desc")}
            </p>
          </div>
          <div className="rounded-2xl shadow-[var(--shadow-card)] bg-white p-5">
            <h3 className="text-sm font-semibold text-[var(--color-gray-600)]">
              {t("wwf.vp3.title")}
            </h3>
            <p className="mt-3 text-sm text-[var(--color-gray-700)]">
              {t("wwf.vp3.desc")}
            </p>
            <Link
              href="/quote"
              className="mt-3 inline-block rounded-full bg-[var(--color-brand)] px-4 py-2 text-xs font-semibold text-[#fff] hover:bg-[var(--color-brand-dark)]"
            >
              {t("nav.getQuote")}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
