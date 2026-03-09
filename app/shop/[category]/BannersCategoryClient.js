"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import FamilyLandingShell from "@/components/storefront/FamilyLandingShell";
import FamilySectionHeader from "@/components/storefront/FamilySectionHeader";
import ProductCard from "@/components/storefront/ProductCard";
import {
  SIGNS_FAMILY_COMPARISON_COLUMNS,
  SIGNS_FAMILY_COMPARISON_FEATURES,
  SIGNS_FAMILY_BROWSE_CASES,
  SIGNS_FAMILY_USE_CASES,
  SIGNS_FAMILY_VALUE_PROPS,
} from "@/lib/storefront/signs-displays-family";

const BASE = "/shop/banners-displays";

/* ── Item slug \u2192 i18n key map ── */
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

const SECTIONS = [
  {
    key: "banners",
    titleKey: "bd.section.banners.title",
    subtitleKey: "bd.section.banners.subtitle",
    size: "large",
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
    size: "medium",
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
    size: "medium",
    items: [
      { key: "telescopic-backdrop", href: `${BASE}/telescopic-backdrop`, gradient: "from-slate-400 to-gray-400" },
      { key: "popup-display-curved-8ft", href: `${BASE}/popup-display-curved-8ft`, gradient: "from-blue-400 to-indigo-400" },
      { key: "table-cloth", href: `${BASE}/table-cloth`, gradient: "from-teal-400 to-cyan-400" },
    ],
  },
  {
    key: "outdoor",
    titleKey: "bd.section.outdoor.title",
    subtitleKey: "bd.section.outdoor.subtitle",
    size: "medium",
    items: [
      { key: "feather-flags", href: `${BASE}/feather-flags`, gradient: "from-orange-400 to-red-400" },
      { key: "teardrop-flags", href: `${BASE}/teardrop-flags`, gradient: "from-cyan-400 to-sky-400" },
      { key: "outdoor-canopy-tent-10x10", href: `${BASE}/outdoor-canopy-tent-10x10`, gradient: "from-emerald-400 to-green-400" },
    ],
  },
];

export default function BannersCategoryClient({ bannerPrices = {}, bannerImages = {}, bannerImages2 = {} }) {
  const { t } = useTranslation();

  return (
    <FamilyLandingShell
      bgClassName="bg-gradient-to-b from-rose-50 to-white"
      breadcrumbs={[
        { label: t("product.shop"), href: "/shop" },
        { label: t("bd.breadcrumb") },
      ]}
      heroCategory="banners-displays"
      heroTitle={t("bd.title")}
      heroIcon="\uD83C\uDFAA"
      browseByNeed={{
        titleKey: "storefront.browseByNeed.title",
        subtitleKey: "storefront.browseByNeed.subtitle",
        cases: SIGNS_FAMILY_BROWSE_CASES,
      }}
      comparison={{
        title: "storefront.comparison.title",
        subtitle: "storefront.comparison.subtitle",
        columns: SIGNS_FAMILY_COMPARISON_COLUMNS,
        features: SIGNS_FAMILY_COMPARISON_FEATURES,
      }}
      useCases={{
        title: "storefront.useCases.title",
        cases: SIGNS_FAMILY_USE_CASES,
      }}
      valueProps={SIGNS_FAMILY_VALUE_PROPS}
      faqCategory="banners-displays"
    >
      {/* Product sections */}
      {SECTIONS.map((section) => {
        const visibleItems = section.items.filter((item) => item.key in bannerPrices);
        if (visibleItems.length === 0) return null;

        return (
          <section key={section.key} className="mt-10">
            <FamilySectionHeader titleKey={section.titleKey} subtitleKey={section.subtitleKey} />
            <div className={`grid gap-4 ${
              section.size === "large"
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                : "grid-cols-2 sm:grid-cols-3"
            }`}>
              {visibleItems.map((item) => {
                const name = t(ITEM_I18N[item.key] || item.key);
                const product = {
                  slug: item.key,
                  name,
                  category: "banners-displays",
                  fromPrice: bannerPrices[item.key] || 0,
                };
                return (
                  <ProductCard
                    key={item.key}
                    product={product}
                    href={item.href}
                    imageSrc={bannerImages[item.key]}
                    hoverImageSrc={bannerImages2[item.key]}
                    showTurnaround={false}
                    aspect={section.size === "large" ? "aspect-[3/2]" : "aspect-[4/3]"}
                    gradientFallback={item.gradient}
                  />
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Cross-link to Signs */}
      <section className="mt-10">
        <p className="text-xs font-medium text-[var(--color-gray-500)] mb-2">{t("storefront.signsFamily.alsoExplore")}</p>
        <Link
          href="/shop/signs-rigid-boards"
          className="group flex items-center gap-4 rounded-xl border border-[var(--color-gray-200)] bg-white p-5 transition-all hover:border-[var(--color-brand)] hover:shadow-md"
        >
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-[var(--color-gray-900)] group-hover:text-[var(--color-brand)]">
              {t("storefront.signsFamily.crossLink.signs")}
            </h3>
            <p className="mt-1 text-xs text-[var(--color-gray-500)]">
              {t("storefront.signsFamily.crossLink.signsDesc")}
            </p>
          </div>
          <svg className="h-4 w-4 shrink-0 text-[var(--color-gray-400)] group-hover:text-[var(--color-brand)] transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      </section>
    </FamilyLandingShell>
  );
}
