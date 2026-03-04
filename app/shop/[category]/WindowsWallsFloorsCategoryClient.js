"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Breadcrumbs from "@/components/Breadcrumbs";
import CategoryHero from "@/components/category/CategoryHero";
import CategoryFaq from "@/components/category/CategoryFaq";
import { isSvgImage } from "@/lib/product-image";

const BASE = "/shop/windows-walls-floors";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

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

/* ── Section definitions ── */
const SECTIONS = [
  {
    key: "window",
    titleKey: "wwf.section.window.title",
    subtitleKey: "wwf.section.window.subtitle",
    size: "large",
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
    size: "large",
    items: [
      { key: "wall-graphics", href: `${BASE}/wall-graphics`, gradient: "from-emerald-400 to-teal-400" },
    ],
  },
  {
    key: "floor",
    titleKey: "wwf.section.floor.title",
    subtitleKey: "wwf.section.floor.subtitle",
    size: "large",
    items: [
      { key: "floor-graphics", href: `${BASE}/floor-graphics`, gradient: "from-orange-400 to-red-400" },
    ],
  },
  {
    key: "decals-banners",
    titleKey: "wwf.section.decalsBanners.title",
    subtitleKey: "wwf.section.decalsBanners.subtitle",
    size: "large",
    items: [
      { key: "decals", href: `${BASE}/decals`, gradient: "from-rose-400 to-pink-400" },
      { key: "vinyl-banners", href: "/shop/banners-displays/vinyl-banners", gradient: "from-sky-400 to-blue-400" },
      { key: "telescopic-backdrop", href: "/shop/banners-displays/telescopic-backdrop", gradient: "from-violet-400 to-purple-400" },
    ],
  },
];

function ProductCard({ item, price, size, imageUrl, hoverImageUrl, t }) {
  const isLarge = size === "large";
  const [hovered, setHovered] = useState(false);
  const showUrl = hovered && hoverImageUrl ? hoverImageUrl : imageUrl;
  const isSvg = showUrl && isSvgImage(showUrl);
  const name = t(ITEM_I18N[item.key] || item.key);
  return (
    <Link
      href={item.href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--color-gray-200)] bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={`relative overflow-hidden bg-[var(--color-gray-100)] ${isLarge ? "aspect-[3/2]" : "aspect-[4/3]"}`}>
        {showUrl ? (
          isSvg ? (
            <img src={showUrl} alt={name} className="h-full w-full object-cover transition-opacity duration-300" />
          ) : (
            <Image src={showUrl} alt={name} fill className="object-cover transition-opacity duration-300 group-hover:scale-105" sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw" />
          )
        ) : (
          <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${item.gradient}`}>
            <p className="px-6 text-center text-lg font-bold text-[#fff] drop-shadow-md">
              {name}
            </p>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className={`font-semibold text-[var(--color-gray-900)] ${isLarge ? "text-base" : "text-sm"}`}>
          {name}
        </h3>
        <div className="mt-auto pt-3 flex items-center justify-between">
          {price > 0 ? (
            <span className="text-sm font-bold text-[var(--color-gray-900)]">
              {t("shop.fromLabel")} {formatCad(price)}
            </span>
          ) : (
            <span className="text-xs text-[var(--color-gray-400)]">{t("shop.getQuote")}</span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-brand)] px-3.5 py-1.5 text-[10px] font-semibold text-[#fff] transition-colors group-hover:bg-[var(--color-brand-dark)]">
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

export default function WindowsWallsFloorsCategoryClient({ wwfPrices = {}, wwfImages = {}, wwfImages2 = {} }) {
  const { t } = useTranslation();

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
              <div className={`mt-4 grid gap-4 ${
                visibleItems.length <= 2
                  ? "grid-cols-1 sm:grid-cols-2"
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              }`}>
                {visibleItems.map((item) => (
                  <ProductCard
                    key={item.key}
                    item={item}
                    price={wwfPrices[item.key] || 0}
                    size={section.size}
                    imageUrl={wwfImages[item.key]}
                    hoverImageUrl={wwfImages2[item.key]}
                    t={t}
                  />
                ))}
              </div>
            </section>
          );
        })}

        <CategoryFaq category="windows-walls-floors" />

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
