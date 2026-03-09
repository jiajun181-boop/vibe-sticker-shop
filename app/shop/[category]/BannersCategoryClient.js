"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Breadcrumbs from "@/components/Breadcrumbs";
import CategoryHero from "@/components/category/CategoryHero";
import CategoryFaq from "@/components/category/CategoryFaq";
import ProductCard from "@/components/storefront/ProductCard";
import ComparisonTable from "@/components/storefront/ComparisonTable";
import UseCaseCards from "@/components/storefront/UseCaseCards";
import ValueProps from "@/components/storefront/ValueProps";

const BASE = "/shop/banners-displays";

/* ── Item slug → i18n key map ── */
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

/* ── Comparison (shared with Signs page — same data, signs+banners is one family) ── */
const COMPARISON_COLUMNS = [
  {
    key: "coroplast",
    nameKey: "storefront.signs.cmp.coroplast",
    href: "/shop/signs-rigid-boards/coroplast-signs",
    features: {
      material: "storefront.signs.cmp.mat.coroplast",
      indoor: true,
      outdoor: true,
      portable: true,
      bestFor: "storefront.signs.cmp.bestFor.coroplast",
      customSize: true,
    },
  },
  {
    key: "foamBoard",
    nameKey: "storefront.signs.cmp.foamBoard",
    href: "/shop/signs-rigid-boards/foam-board-prints",
    features: {
      material: "storefront.signs.cmp.mat.foam",
      indoor: true,
      outdoor: false,
      portable: true,
      bestFor: "storefront.signs.cmp.bestFor.foam",
      customSize: true,
    },
  },
  {
    key: "vinylBanner",
    nameKey: "storefront.signs.cmp.vinylBanner",
    href: `${BASE}/vinyl-banners`,
    features: {
      material: "storefront.signs.cmp.mat.vinyl",
      indoor: true,
      outdoor: true,
      portable: true,
      bestFor: "storefront.signs.cmp.bestFor.vinyl",
      customSize: true,
    },
  },
  {
    key: "rollUp",
    nameKey: "storefront.signs.cmp.rollUp",
    href: `${BASE}/roll-up-banners`,
    features: {
      material: "storefront.signs.cmp.mat.rollUp",
      indoor: true,
      outdoor: false,
      portable: true,
      bestFor: "storefront.signs.cmp.bestFor.rollUp",
      customSize: false,
    },
  },
];

const COMPARISON_FEATURES = [
  { key: "material", labelKey: "storefront.signs.cmp.feat.material" },
  { key: "indoor", labelKey: "storefront.signs.cmp.feat.indoor" },
  { key: "outdoor", labelKey: "storefront.signs.cmp.feat.outdoor" },
  { key: "portable", labelKey: "storefront.signs.cmp.feat.portable" },
  { key: "bestFor", labelKey: "storefront.signs.cmp.feat.bestFor" },
  { key: "customSize", labelKey: "storefront.signs.cmp.feat.customSize" },
];

/* ── Use cases (same family as signs) ── */
const USE_CASES = [
  { key: "retail", icon: "🏪", titleKey: "storefront.signs.uc.retail.title", descKey: "storefront.signs.uc.retail.desc", href: `${BASE}/roll-up-banners` },
  { key: "tradeshow", icon: "🎪", titleKey: "storefront.signs.uc.tradeshow.title", descKey: "storefront.signs.uc.tradeshow.desc", href: `${BASE}/telescopic-backdrop` },
  { key: "events", icon: "💒", titleKey: "storefront.signs.uc.events.title", descKey: "storefront.signs.uc.events.desc", href: `${BASE}/vinyl-banners` },
  { key: "construction", icon: "🚧", titleKey: "storefront.signs.uc.construction.title", descKey: "storefront.signs.uc.construction.desc", href: "/shop/signs-rigid-boards/construction-site-signs" },
  { key: "community", icon: "🗳️", titleKey: "storefront.signs.uc.community.title", descKey: "storefront.signs.uc.community.desc", href: `${BASE}/vinyl-banners` },
  { key: "realEstate", icon: "🏠", titleKey: "storefront.signs.uc.realEstate.title", descKey: "storefront.signs.uc.realEstate.desc", href: "/shop/signs-rigid-boards/real-estate-sign" },
];

/* ── Value props ── */
const VALUE_PROPS = [
  { icon: "🌧️", titleKey: "bd.vp1.title", descKey: "bd.vp1.desc" },
  { icon: "⚡", titleKey: "bd.vp2.title", descKey: "bd.vp2.desc" },
  { icon: "📐", titleKey: "bd.vp3.title", descKey: "bd.vp3.desc" },
];

export default function BannersCategoryClient({ bannerPrices = {}, bannerImages = {}, bannerImages2 = {} }) {
  const { t } = useTranslation();

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

        {/* Sections — using unified ProductCard */}
        {SECTIONS.map((section) => {
          const visibleItems = section.items.filter((item) => item.key in bannerPrices);
          if (visibleItems.length === 0) return null;

          return (
            <section key={section.key} className="mt-12">
              <h2 className="text-xl font-semibold tracking-tight">{t(section.titleKey)}</h2>
              <p className="mt-1 text-sm text-[var(--color-gray-500)]">{t(section.subtitleKey)}</p>
              <div className={`mt-4 grid gap-4 ${
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

        {/* Comparison Table: Signs vs Banners — which is right? */}
        <ComparisonTable
          title="storefront.comparison.title"
          subtitle="storefront.comparison.subtitle"
          columns={COMPARISON_COLUMNS}
          features={COMPARISON_FEATURES}
        />

        {/* Popular Use Cases */}
        <UseCaseCards
          title="storefront.useCases.title"
          cases={USE_CASES}
        />

        <CategoryFaq category="banners-displays" />

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

        {/* Value Props — unified */}
        <ValueProps props={VALUE_PROPS} />
      </div>
    </main>
  );
}
