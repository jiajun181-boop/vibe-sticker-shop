"use client";

import Link from "next/link";
import { INDUSTRY_LABELS } from "@/lib/industryTags";
import { USE_CASES, USE_CASE_PRODUCTS } from "@/lib/useCases";
import { useTranslation } from "@/lib/i18n/useTranslation";

/**
 * Internal cross-link blocks for product pages.
 * Shows relevant industry pages, use-case pages, and sibling categories.
 */
export default function RelatedLinks({ product, catalogConfig }) {
  const { departments = [], departmentMeta = {}, categoryMeta = {} } = catalogConfig || {};
  const { t } = useTranslation();
  const tags = product.tags || [];
  const slug = product.slug;
  const category = product.category;

  // 1. Industries this product is tagged with
  const industries = tags
    .filter((tag) => INDUSTRY_LABELS[tag])
    .slice(0, 6);

  // 2. Use cases that include this product
  const useCases = USE_CASES.filter(
    (uc) => USE_CASE_PRODUCTS[uc.slug]?.includes(slug)
  );

  // 3. Sibling categories in the same department
  const dept = departments.find((d) =>
    d.categories.includes(category)
  );
  const siblingCategories = dept
    ? dept.categories
        .filter((c) => c !== category && categoryMeta[c])
        .slice(0, 4)
    : [];

  // Don't render if there's nothing to show
  if (industries.length === 0 && useCases.length === 0 && siblingCategories.length === 0) {
    return null;
  }

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">
        {t("product.explore") || "Explore More"}
      </h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Industry links */}
        {industries.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
              {t("product.byIndustry") || "By Industry"}
            </h3>
            <div className="flex flex-wrap gap-2">
              {industries.map((tag) => {
                const info = INDUSTRY_LABELS[tag];
                return (
                  <Link
                    key={tag}
                    href={`/shop/industry/${tag}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-100"
                  >
                    <span>{info.icon}</span>
                    <span>{info.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Use case links */}
        {useCases.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
              {t("product.byUseCase") || "Ideas & Inspiration"}
            </h3>
            <div className="flex flex-wrap gap-2">
              {useCases.map((uc) => (
                <Link
                  key={uc.slug}
                  href={`/ideas/${uc.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-100"
                >
                  <span>{uc.icon}</span>
                  <span>{t(`ideas.${uc.slug}.title`) || uc.slug}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Sibling category links */}
        {siblingCategories.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
              {t("product.alsoIn") || "Also In"}
              {" "}
              {departmentMeta[dept?.key]?.title || ""}
            </h3>
            <div className="flex flex-wrap gap-2">
              {siblingCategories.map((cat) => {
                const meta = categoryMeta[cat];
                return (
                  <Link
                    key={cat}
                    href={`/shop?category=${cat}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-100"
                  >
                    <span>{meta.icon}</span>
                    <span>{meta.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
