"use client";

import Link from "next/link";
import { useCallback } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import FamilyLandingShell from "@/components/storefront/FamilyLandingShell";
import FamilySectionHeader from "@/components/storefront/FamilySectionHeader";
import ProductCard from "@/components/storefront/ProductCard";
import {
  SIGNS_FAMILY_COMPARISON_COLUMNS,
  SIGNS_FAMILY_COMPARISON_FEATURES,
  BANNERS_BROWSE_CASES,
  SIGNS_FAMILY_USE_CASES,
  SIGNS_FAMILY_VALUE_PROPS,
  BANNERS_CROSS_LINKS,
  BANNERS_ITEM_I18N,
  BANNERS_SECTIONS,
} from "@/lib/storefront/signs-displays-family";

export default function BannersCategoryClient({ bannerPrices = {}, bannerImages = {}, bannerImages2 = {} }) {
  const { t } = useTranslation();

  // BrowseByNeed action handler: parse "scroll:sectionId" and scroll to it
  const handleBrowseAction = useCallback((action) => {
    if (!action?.startsWith("scroll:")) return;
    const id = action.slice(7);
    const el = document.getElementById(id);
    if (el) {
      const offset = 120;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }, []);

  return (
    <FamilyLandingShell
      bgClassName="bg-gradient-to-b from-rose-50 to-white"
      breadcrumbs={[
        { label: t("product.shop"), href: "/shop" },
        { label: t("bd.breadcrumb") },
      ]}
      heroCategory="banners-displays"
      heroTitle={t("bd.title")}
      heroIcon={"\uD83C\uDFAA"}
      browseByNeed={{
        titleKey: "storefront.browseByNeed.title",
        subtitleKey: "storefront.browseByNeed.subtitle",
        cases: BANNERS_BROWSE_CASES,
      }}
      onBrowseAction={handleBrowseAction}
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
      familyContext={{ family: "banners" }}
      faqCategory="banners-displays"
    >
      {/* Product sections */}
      {BANNERS_SECTIONS.map((section) => {
        const visibleItems = section.items.filter((item) => item.key in bannerPrices);
        if (visibleItems.length === 0) return null;

        return (
          <section key={section.key} id={section.id} className="mt-10 scroll-mt-32">
            <FamilySectionHeader titleKey={section.titleKey} subtitleKey={section.subtitleKey} />
            <div className={`grid gap-4 ${
              section.size === "large"
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                : "grid-cols-2 sm:grid-cols-3"
            }`}>
              {visibleItems.map((item) => {
                const name = t(BANNERS_ITEM_I18N[item.key] || item.key);
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

      {/* Cross-links with explicit reasons */}
      <section className="mt-10 space-y-3">
        {BANNERS_CROSS_LINKS.map((link) => (
          <div key={link.href}>
            <p className="text-xs font-medium text-[var(--color-brand)] mb-1.5">{t(link.reasonKey)}</p>
            <Link
              href={link.href}
              className="group flex items-center gap-4 rounded-xl border border-[var(--color-gray-200)] bg-white p-5 transition-all hover:border-[var(--color-brand)] hover:shadow-md"
            >
              <span className="text-2xl shrink-0">{link.icon}</span>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-[var(--color-gray-900)] group-hover:text-[var(--color-brand)]">
                  {t(link.titleKey)}
                </h3>
                <p className="mt-1 text-xs text-[var(--color-gray-500)]">
                  {t(link.descKey)}
                </p>
              </div>
              <svg className="h-4 w-4 shrink-0 text-[var(--color-gray-400)] group-hover:text-[var(--color-brand)] transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          </div>
        ))}
      </section>
    </FamilyLandingShell>
  );
}
