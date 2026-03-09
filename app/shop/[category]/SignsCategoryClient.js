"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Breadcrumbs from "@/components/Breadcrumbs";
import CategoryHero from "@/components/category/CategoryHero";
import CategoryFaq from "@/components/category/CategoryFaq";
import ProductCard from "@/components/storefront/ProductCard";
import ComparisonTable from "@/components/storefront/ComparisonTable";
import UseCaseCards from "@/components/storefront/UseCaseCards";
import ValueProps from "@/components/storefront/ValueProps";

// Badge config per product slug
const PRODUCT_BADGES = {
  "real-estate-sign": { labelKey: "shop.bestSeller", color: "bg-orange-100 text-orange-700" },
  "yard-sign": { labelKey: "shop.sameDayAvailable", color: "bg-emerald-100 text-emerald-700" },
};

// Products that use "Add to Cart" instead of "Configure"
const SIMPLE_ADD_SLUGS = new Set(["h-stakes", "real-estate-frame"]);

/* ── Comparison data ── */
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
    href: "/shop/banners-displays/vinyl-banners",
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
    href: "/shop/banners-displays/roll-up-banners",
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

/* ── Use cases ── */
const USE_CASES = [
  { key: "realEstate", icon: "🏠", titleKey: "storefront.signs.uc.realEstate.title", descKey: "storefront.signs.uc.realEstate.desc", href: "/shop/signs-rigid-boards/real-estate-sign" },
  { key: "events", icon: "💒", titleKey: "storefront.signs.uc.events.title", descKey: "storefront.signs.uc.events.desc", href: "/shop/signs-rigid-boards/selfie-frame-board" },
  { key: "retail", icon: "🏪", titleKey: "storefront.signs.uc.retail.title", descKey: "storefront.signs.uc.retail.desc", href: "/shop/banners-displays/roll-up-banners" },
  { key: "construction", icon: "🚧", titleKey: "storefront.signs.uc.construction.title", descKey: "storefront.signs.uc.construction.desc", href: "/shop/signs-rigid-boards/construction-site-signs" },
  { key: "tradeshow", icon: "🎪", titleKey: "storefront.signs.uc.tradeshow.title", descKey: "storefront.signs.uc.tradeshow.desc", href: "/shop/banners-displays/telescopic-backdrop" },
  { key: "community", icon: "🗳️", titleKey: "storefront.signs.uc.community.title", descKey: "storefront.signs.uc.community.desc", href: "/shop/signs-rigid-boards/election-signs" },
];

/* ── Value props ── */
const VALUE_PROPS = [
  { icon: "🌧️", titleKey: "sc.vp1.title", descKey: "sc.vp1.desc" },
  { icon: "⚡", titleKey: "sc.vp2.title", descKey: "sc.vp2.desc" },
  { icon: "📐", titleKey: "sc.vp3.title", descKey: "sc.vp3.desc" },
];

export default function SignsCategoryClient({
  category,
  categoryTitle,
  sections,
  totalCount,
}) {
  const { t } = useTranslation();
  const sectionRefs = useRef({});
  const [activeSection, setActiveSection] = useState(sections[0]?.key || "");

  // IntersectionObserver for scroll-based active tab
  useEffect(() => {
    const observers = [];
    for (const section of sections) {
      const el = sectionRefs.current[section.key];
      if (!el) continue;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(section.key);
          }
        },
        { rootMargin: "-20% 0px -60% 0px" }
      );
      observer.observe(el);
      observers.push(observer);
    }
    return () => observers.forEach((o) => o.disconnect());
  }, [sections]);

  const scrollToSection = (key) => {
    const el = sectionRefs.current[key];
    if (el) {
      const offset = 120; // account for sticky header + tab bar
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  const allProducts = sections.flatMap((s) => s.products);

  return (
    <main className="bg-[var(--color-gray-50)] pb-20 pt-10 text-[var(--color-gray-900)]">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 2xl:px-4">
        <Breadcrumbs
          items={[
            { label: t("product.shop"), href: "/shop" },
            { label: categoryTitle },
          ]}
        />

        <div className="mt-6">
          <CategoryHero category="signs-rigid-boards" title={categoryTitle} icon="🪧" />
        </div>

        {/* Filter tab bar */}
        <div className="sticky top-[var(--nav-offset,64px)] z-20 -mx-4 sm:-mx-6 2xl:-mx-4 mt-4 border-b border-[var(--color-gray-200)] bg-[var(--color-gray-50)]/95 backdrop-blur-sm px-4 sm:px-6 2xl:px-4">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide py-2">
            {sections.map((section) => (
              <button
                key={section.key}
                onClick={() => scrollToSection(section.key)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                  activeSection === section.key
                    ? "bg-[var(--color-gray-900)] text-[#fff]"
                    : "bg-white border border-[var(--color-gray-200)] text-[var(--color-gray-600)] hover:bg-[var(--color-gray-100)] hover:text-[var(--color-gray-800)]"
                }`}
              >
                {section.title}
              </button>
            ))}
          </div>
        </div>

        {/* Sections — using unified ProductCard */}
        {sections.map((section) => (
          <section
            key={section.key}
            ref={(el) => { sectionRefs.current[section.key] = el; }}
            className="mt-10"
          >
            <div className="mb-4">
              <h2 className="text-xl font-semibold tracking-tight text-[var(--color-gray-900)]">
                {section.title}
              </h2>
              {section.description && (
                <p className="mt-1 text-sm text-[var(--color-gray-500)]">
                  {section.description}
                </p>
              )}
            </div>

            <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {section.products.map((product) => {
                const badgeCfg = PRODUCT_BADGES[product.slug];
                const badge = badgeCfg ? { label: t(badgeCfg.labelKey), color: badgeCfg.color } : undefined;
                const isSimpleAdd = SIMPLE_ADD_SLUGS.has(product.slug);

                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    badge={badge}
                    showTurnaround={true}
                    showDescription={true}
                    aspect="aspect-[4/5]"
                    ctaKey={isSimpleAdd ? "shop.addToCart" : "shop.configure"}
                    gradientFallback={section.noImageGradient || "from-gray-200 to-gray-300"}
                  />
                );
              })}
            </div>

            {/* Divider between sections (except last) */}
            {section !== sections[sections.length - 1] && (
              <hr className="mt-10 border-[var(--color-gray-200)]" />
            )}
          </section>
        ))}

        {allProducts.length === 0 && (
          <p className="mt-12 text-center text-sm text-[var(--color-gray-500)]">
            {t("shop.noProducts")}
          </p>
        )}

        {/* Comparison Table: Signs vs Banners — which is right for you? */}
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

        <CategoryFaq category="signs-rigid-boards" />

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
