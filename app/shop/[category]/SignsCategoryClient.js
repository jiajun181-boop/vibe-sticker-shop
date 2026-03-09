"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import FamilyLandingShell from "@/components/storefront/FamilyLandingShell";
import ProductCard from "@/components/storefront/ProductCard";
import {
  SIGNS_FAMILY_COMPARISON_COLUMNS,
  SIGNS_FAMILY_COMPARISON_FEATURES,
  SIGNS_FAMILY_BROWSE_CASES,
  SIGNS_FAMILY_USE_CASES,
  SIGNS_FAMILY_VALUE_PROPS,
  enrichSignsProduct,
} from "@/lib/storefront/signs-displays-family";

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
      const offset = 120;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  return (
    <FamilyLandingShell
      bgClassName="bg-[var(--color-gray-50)]"
      breadcrumbs={[
        { label: t("product.shop"), href: "/shop" },
        { label: categoryTitle },
      ]}
      heroCategory="signs-rigid-boards"
      heroTitle={categoryTitle}
      heroIcon="\uD83E\uDEA7"
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
      faqCategory="signs-rigid-boards"
    >
      {/* Filter tab bar — scroll-synced */}
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

      {/* Product sections */}
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
              const enriched = enrichSignsProduct(product, t);
              return (
                <ProductCard
                  key={product.id}
                  product={enriched}
                  badge={enriched.badge}
                  showTurnaround={true}
                  showDescription={true}
                  aspect="aspect-[4/5]"
                  ctaKey={enriched.ctaKey || "shop.configure"}
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

      {sections.flatMap((s) => s.products).length === 0 && (
        <p className="mt-12 text-center text-sm text-[var(--color-gray-500)]">
          {t("shop.noProducts")}
        </p>
      )}

      {/* Cross-link to Banners */}
      <section className="mt-10">
        <p className="text-xs font-medium text-[var(--color-gray-500)] mb-2">{t("storefront.signsFamily.alsoExplore")}</p>
        <Link
          href="/shop/banners-displays"
          className="group flex items-center gap-4 rounded-xl border border-[var(--color-gray-200)] bg-white p-5 transition-all hover:border-[var(--color-brand)] hover:shadow-md"
        >
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-[var(--color-gray-900)] group-hover:text-[var(--color-brand)]">
              {t("storefront.signsFamily.crossLink.banners")}
            </h3>
            <p className="mt-1 text-xs text-[var(--color-gray-500)]">
              {t("storefront.signsFamily.crossLink.bannersDesc")}
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
