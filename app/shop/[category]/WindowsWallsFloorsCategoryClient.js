"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
import FamilyLandingShell from "@/components/storefront/FamilyLandingShell";
import ProductCard from "@/components/storefront/ProductCard";
import CrossLinks from "@/components/storefront/CrossLinks";
import {
  WWF_BROWSE_CASES,
  WWF_COMPARISON_COLUMNS,
  WWF_COMPARISON_FEATURES,
  WWF_SECTIONS,
  WWF_VALUE_PROPS,
  WWF_USE_CASES,
  WWF_CROSS_LINKS,
  enrichWwfItem,
} from "@/lib/storefront/windows-family";

export default function WindowsWallsFloorsCategoryClient({ wwfPrices = {}, wwfImages = {}, wwfImages2 = {} }) {
  const { t } = useTranslation();

  const familyContext = { family: "wwf" };

  return (
    <FamilyLandingShell
      bgClassName="bg-gradient-to-b from-blue-50 to-white"
      breadcrumbs={[
        { label: t("product.shop"), href: "/shop" },
        { label: t("wwf.breadcrumb") },
      ]}
      heroCategory="windows-walls-floors"
      heroTitle={t("wwf.title")}
      heroIcon="\uD83E\uDE9F"
      browseByNeed={{
        titleKey: "wwf.browse.title",
        subtitleKey: "wwf.browse.subtitle",
        cases: WWF_BROWSE_CASES,
      }}
      comparison={{
        title: "wwf.cmp.title",
        subtitle: "wwf.cmp.subtitle",
        columns: WWF_COMPARISON_COLUMNS,
        features: WWF_COMPARISON_FEATURES,
      }}
      useCases={{
        title: "wwf.uc.title",
        cases: WWF_USE_CASES,
      }}
      valueProps={WWF_VALUE_PROPS}
      faqCategory="windows-walls-floors"
      familyContext={familyContext}
    >
      {/* ── Product sections ── */}
      {WWF_SECTIONS.map((section) => {
        const visibleItems = section.items.filter((item) => item.key in wwfPrices);
        if (visibleItems.length === 0) return null;

        return (
          <section key={section.key} id={section.key} className="mt-12">
            <h2 className="text-xl font-semibold tracking-tight">{t(section.titleKey)}</h2>
            <p className="mt-1 text-sm text-[var(--color-gray-500)]">{t(section.subtitleKey)}</p>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
              {visibleItems.map((item) => {
                const enriched = enrichWwfItem(item, {
                  prices: wwfPrices,
                  images: wwfImages,
                  images2: wwfImages2,
                  t,
                });
                return (
                  <ProductCard
                    key={item.key}
                    product={enriched.product}
                    href={enriched.href}
                    imageSrc={enriched.imageSrc}
                    hoverImageSrc={enriched.hoverImageSrc}
                    tags={enriched.tags}
                    gradientFallback={enriched.gradientFallback}
                    showDescription
                    showTurnaround={false}
                    ctaKey="shop.configureQuote"
                  />
                );
              })}
            </div>
          </section>
        );
      })}

      {WWF_SECTIONS.every((section) => section.items.every((item) => !(item.key in wwfPrices))) && (
        <p className="mt-12 text-center text-sm text-[var(--color-gray-500)]">
          {t("shop.noProducts")}
        </p>
      )}

      {/* ── Cross-links ── */}
      <CrossLinks titleKey="wwf.related" links={WWF_CROSS_LINKS} />
    </FamilyLandingShell>
  );
}
