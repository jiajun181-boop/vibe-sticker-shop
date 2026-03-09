"use client";

import Breadcrumbs from "@/components/Breadcrumbs";
import CategoryHero from "@/components/category/CategoryHero";
import CategoryFaq from "@/components/category/CategoryFaq";
import BrowseByNeed from "./BrowseByNeed";
import ComparisonTable from "./ComparisonTable";
import UseCaseCards from "./UseCaseCards";
import ValueProps from "./ValueProps";
import BackToShop from "./BackToShop";

/**
 * Shared skeleton for all family landing pages.
 * Enforces a consistent section order while keeping family-specific
 * content (filter bars, product grids, special layouts) as children.
 *
 * Section order:
 *   1. Breadcrumbs
 *   2. CategoryHero
 *   3. BrowseByNeed (strong entry — "choose by need" guidance)
 *   4. {children} — family-specific filter tabs + product grids
 *   5. ComparisonTable
 *   6. UseCaseCards (light supplement at bottom)
 *   7. ValueProps
 *   8. CategoryFaq
 *   9. BackToShop
 */
export default function FamilyLandingShell({
  bgClassName = "bg-[var(--color-gray-50)]",
  breadcrumbs,
  heroCategory,
  heroTitle,
  heroIcon,
  browseByNeed,
  children,
  comparison,
  useCases,
  valueProps,
  faqCategory,
  backLabelKey,
  onBrowseAction,
}) {
  return (
    <main className={`${bgClassName} pb-20 pt-10 text-[var(--color-gray-900)]`}>
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 2xl:px-4">
        {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}

        <div className="mt-6">
          <CategoryHero category={heroCategory} title={heroTitle} icon={heroIcon} />
        </div>

        {browseByNeed && <BrowseByNeed {...browseByNeed} onAction={onBrowseAction} />}

        {children}

        {comparison && <ComparisonTable {...comparison} />}

        {useCases && <UseCaseCards {...useCases} />}

        {valueProps && (
          <section className="mt-12">
            <ValueProps props={valueProps} />
          </section>
        )}

        {faqCategory && <CategoryFaq category={faqCategory} />}

        <BackToShop labelKey={backLabelKey} />
      </div>
    </main>
  );
}
