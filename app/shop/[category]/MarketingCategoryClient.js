"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
import FamilyLandingShell from "@/components/storefront/FamilyLandingShell";
import FamilySectionHeader from "@/components/storefront/FamilySectionHeader";
import ProductCard from "@/components/storefront/ProductCard";
import {
  MARKETING_ITEM_I18N,
  MARKETING_SECTIONS,
  MARKETING_COMPARISON_COLUMNS,
  MARKETING_COMPARISON_FEATURES,
  MARKETING_BROWSE_CASES,
  MARKETING_USE_CASES,
  MARKETING_VALUE_PROPS,
} from "@/lib/storefront/marketing-family";

export default function MarketingCategoryClient({ marketingPrices = {}, marketingImages = {}, marketingImages2 = {} }) {
  const { t } = useTranslation();

  return (
    <FamilyLandingShell
      bgClassName="bg-gradient-to-b from-amber-50 to-white"
      breadcrumbs={[
        { label: t("product.shop"), href: "/shop" },
        { label: t("mc.breadcrumb") },
      ]}
      heroCategory="marketing-business-print"
      heroTitle={t("mc.title")}
      heroIcon="\uD83D\uDCC4"
      browseByNeed={{
        titleKey: "storefront.browseByNeed.title",
        subtitleKey: "storefront.browseByNeed.subtitle",
        cases: MARKETING_BROWSE_CASES,
      }}
      comparison={{
        title: "storefront.comparison.title",
        subtitle: "storefront.comparison.subtitle",
        columns: MARKETING_COMPARISON_COLUMNS,
        features: MARKETING_COMPARISON_FEATURES,
      }}
      useCases={{
        title: "storefront.useCases.title",
        cases: MARKETING_USE_CASES,
      }}
      valueProps={MARKETING_VALUE_PROPS}
      familyContext={{ family: "marketing" }}
      faqCategory="marketing-business-print"
    >
      {/* Product sections \u2014 each with anchor ID for BrowseByNeed scroll targets */}
      {MARKETING_SECTIONS.map((section) => {
        const visibleItems = section.items.filter((item) => item.key in marketingPrices);
        if (visibleItems.length === 0) return null;

        return (
          <section key={section.key} id={section.id} className="mt-8 scroll-mt-32">
            <FamilySectionHeader titleKey={section.titleKey} subtitleKey={section.subtitleKey} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {visibleItems.map((item) => {
                const name = t(MARKETING_ITEM_I18N[item.key] || item.key);
                const product = {
                  slug: item.key,
                  name,
                  category: "marketing-business-print",
                  fromPrice: marketingPrices[item.key] || 0,
                };
                return (
                  <ProductCard
                    key={item.key}
                    product={product}
                    href={item.href}
                    imageSrc={marketingImages[item.key]}
                    hoverImageSrc={marketingImages2[item.key]}
                    showTurnaround={false}
                    gradientFallback={item.gradient}
                  />
                );
              })}
            </div>
          </section>
        );
      })}
    </FamilyLandingShell>
  );
}
