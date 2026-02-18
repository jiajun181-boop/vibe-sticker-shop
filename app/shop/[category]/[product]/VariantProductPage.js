"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductClient from "./ProductClient";

/**
 * Variant product page — renders a style selector above an embedded ProductClient.
 * When the user clicks a different style, `key={activeSlug}` forces a clean remount.
 *
 * Props:
 *   variantConfig — from getVariantConfig() in lib/variantProductConfig.js
 *   productMap    — { [slug]: productData } for all child products
 *   category      — category slug (e.g. "custom-stickers")
 */
export default function VariantProductPage({ variantConfig, productMap, category }) {
  const searchParams = useSearchParams();
  const styleParam = searchParams?.get("style");

  // Determine initial active slug from ?style= or the default variant
  const defaultSlug = useMemo(() => {
    const def = variantConfig.variants.find((v) => v.isDefault);
    return def?.slug || variantConfig.variants[0]?.slug;
  }, [variantConfig]);

  const initialSlug = useMemo(() => {
    if (styleParam && productMap[styleParam]) return styleParam;
    return defaultSlug;
  }, [styleParam, productMap, defaultSlug]);

  const [activeSlug, setActiveSlug] = useState(initialSlug);
  const scrollRef = useRef(null);

  // Only show variants that have a matching product in the DB
  const availableVariants = useMemo(
    () => variantConfig.variants.filter((v) => productMap[v.slug]),
    [variantConfig, productMap]
  );

  const activeVariant = useMemo(
    () => availableVariants.find((v) => v.slug === activeSlug) || availableVariants[0],
    [availableVariants, activeSlug]
  );

  const handleStyleChange = useCallback(
    (slug) => {
      setActiveSlug(slug);
      // Update URL without full navigation
      const url = new URL(window.location.href);
      url.searchParams.set("style", slug);
      window.history.replaceState({}, "", url.toString());
    },
    []
  );

  const activeProduct = productMap[activeSlug] || productMap[defaultSlug];

  if (!activeProduct) return null;

  const categoryLabel = category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <main className="bg-[radial-gradient(circle_at_top,_var(--color-gray-50),_var(--color-gray-100)_45%,_var(--color-gray-50))] pb-20 pt-10 text-[var(--color-gray-800)]">
      <div className="mx-auto max-w-[1600px] space-y-6 lg:space-y-8 px-4 sm:px-6 2xl:px-4">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: "Shop", href: "/shop" },
            { label: categoryLabel, href: `/shop/${category}` },
            { label: variantConfig.title },
          ]}
        />

        {/* Hero header */}
        <header className="text-center max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--color-gray-900)]">
            {variantConfig.title}
          </h1>
          <p className="mt-3 text-base text-[var(--color-gray-500)] leading-relaxed">
            {variantConfig.description}
          </p>
        </header>

        {/* Style selector */}
        <div ref={scrollRef} className="scroll-mt-24">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {availableVariants.map((v) => {
              const isActive = v.slug === activeSlug;
              return (
                <button
                  key={v.slug}
                  type="button"
                  onClick={() => handleStyleChange(v.slug)}
                  className={`group relative rounded-xl border-2 px-4 py-2.5 text-left transition-all ${
                    isActive
                      ? "border-[var(--color-ink-black)] bg-[var(--color-ink-black)] text-white shadow-lg"
                      : "border-[var(--color-gray-200)] bg-white text-[var(--color-gray-700)] hover:border-[var(--color-gray-400)] hover:shadow-md"
                  }`}
                  title={v.description}
                >
                  <span className="block text-sm font-semibold">{v.shortLabel || v.label}</span>
                  <span
                    className={`mt-0.5 block text-[11px] ${
                      isActive ? "text-[var(--color-gray-300)]" : "text-[var(--color-gray-400)]"
                    }`}
                  >
                    {v.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Embedded ProductClient — key forces remount on style change */}
        <ProductClient key={activeSlug} product={activeProduct} embedded={true} />
      </div>
    </main>
  );
}
