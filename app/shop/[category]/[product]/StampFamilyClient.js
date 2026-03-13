"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
import FamilyLandingShell from "@/components/storefront/FamilyLandingShell";
import ProductCard from "@/components/storefront/ProductCard";
import CrossLinks from "@/components/storefront/CrossLinks";
import {
  STAMP_BROWSE_CASES,
  STAMP_COMPARISON_COLUMNS,
  STAMP_COMPARISON_FEATURES,
  STAMP_SECTIONS,
  STAMP_VALUE_PROPS,
  STAMP_USE_CASES,
  STAMP_CROSS_LINKS,
} from "@/lib/storefront/stamp-family";

export default function StampFamilyClient({ products = [], category }) {
  const { t } = useTranslation();

  const familyContext = { family: "stamps" };

  // Build slug → product lookup
  const bySlug = {};
  for (const p of products) {
    bySlug[p.slug] = p;
  }

  return (
    <FamilyLandingShell
      bgClassName="bg-gradient-to-b from-amber-50 to-white"
      breadcrumbs={[
        { label: t("product.shop"), href: "/shop" },
        { label: t("stf.parentCategory"), href: `/shop/${category}` },
        { label: t("stf.breadcrumb") },
      ]}
      heroCategory="stamps"
      heroTitle={t("stf.title")}
      heroIcon="\u2712\uFE0F"
      browseByNeed={{
        titleKey: "stf.browse.title",
        subtitleKey: "stf.browse.subtitle",
        cases: STAMP_BROWSE_CASES,
      }}
      comparison={{
        title: "stf.cmp.title",
        subtitle: "stf.cmp.subtitle",
        columns: STAMP_COMPARISON_COLUMNS,
        features: STAMP_COMPARISON_FEATURES,
      }}
      useCases={{
        title: "stf.uc.title",
        cases: STAMP_USE_CASES,
      }}
      valueProps={STAMP_VALUE_PROPS}
      faqCategory="stamps"
      familyContext={familyContext}
    >
      {/* ── Product sections ── */}
      {STAMP_SECTIONS.map((section) => {
        const sectionProducts = section.slugs
          .map((slug) => bySlug[slug])
          .filter(Boolean);
        if (sectionProducts.length === 0) return null;

        return (
          <section key={section.key} id={section.key} className="mt-12">
            <h2 className="text-xl font-semibold tracking-tight">
              {t(section.titleKey)}
            </h2>
            <p className="mt-1 text-sm text-[var(--color-gray-500)]">
              {t(section.subtitleKey)}
            </p>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
              {sectionProducts.map((product) => (
                <ProductCard
                  key={product.slug}
                  product={product}
                  showDescription
                  showTurnaround={false}
                  ctaKey="stf.customize"
                />
              ))}
            </div>
          </section>
        );
      })}

      {products.length === 0 && (
        <p className="mt-12 text-center text-sm text-[var(--color-gray-500)]">
          {t("shop.noProducts")}
        </p>
      )}

      {/* ── Cross-links ── */}
      <CrossLinks titleKey="stf.related" links={STAMP_CROSS_LINKS} />
    </FamilyLandingShell>
  );
}
