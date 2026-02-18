"use client";

import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductClient from "./ProductClient";

/**
 * SEO scene landing page — content-rich page with embedded ProductClient.
 * Targets specific use-case keywords (e.g. "candle labels", "laptop stickers").
 *
 * Props:
 *   sceneConfig — from getSceneConfig() in lib/sceneConfig.js
 *   product     — the default product data (already serialized)
 *   category    — category slug (e.g. "custom-stickers")
 */
export default function SceneLandingPage({ sceneConfig, product, category }) {
  const { title, content, variantParent } = sceneConfig;
  const categoryLabel = category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <main className="bg-[radial-gradient(circle_at_top,_var(--color-gray-50),_var(--color-gray-100)_45%,_var(--color-gray-50))] pb-20 pt-10 text-[var(--color-gray-800)]">
      <div className="mx-auto max-w-[1600px] space-y-8 lg:space-y-12 px-4 sm:px-6 2xl:px-4">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: "Shop", href: "/shop" },
            { label: categoryLabel, href: `/shop/${category}` },
            { label: variantParent.replace(/\b\w/g, (c) => c.toUpperCase()), href: `/shop/${category}/${variantParent}` },
            { label: title },
          ]}
        />

        {/* Hero */}
        <header className="text-center max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--color-gray-900)]">
            {title}
          </h1>
          <p className="mt-4 text-base sm:text-lg text-[var(--color-gray-500)] leading-relaxed">
            {content.intro}
          </p>
        </header>

        {/* Features */}
        {content.features?.length > 0 && (
          <section className="max-w-3xl mx-auto">
            <ul className="grid gap-3 sm:grid-cols-2">
              {content.features.map((feat, i) => (
                <li key={i} className="flex items-start gap-3 rounded-xl bg-white p-4 shadow-sm border border-[var(--color-gray-100)]">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-ink-black)] text-white text-xs font-bold">
                    {i + 1}
                  </span>
                  <span className="text-sm text-[var(--color-gray-700)] leading-relaxed">{feat}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Embedded product */}
        <section>
          <ProductClient product={product} embedded={true} />
        </section>

        {/* FAQ with structured data */}
        {content.faq?.length > 0 && (
          <section className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-[var(--color-gray-900)] mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {content.faq.map((item, i) => (
                <details key={i} className="group rounded-xl bg-white border border-[var(--color-gray-100)] shadow-sm">
                  <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-[var(--color-gray-900)] flex items-center justify-between">
                    {item.q}
                    <svg className="h-4 w-4 shrink-0 text-[var(--color-gray-400)] transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-5 pb-4 text-sm text-[var(--color-gray-600)] leading-relaxed">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>

            {/* FAQ structured data */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  mainEntity: content.faq.map((item) => ({
                    "@type": "Question",
                    name: item.q,
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: item.a,
                    },
                  })),
                }),
              }}
            />
          </section>
        )}

        {/* Link to parent variant page */}
        <div className="text-center">
          <Link
            href={`/shop/${category}/${variantParent}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-gray-500)] hover:text-[var(--color-gray-900)] transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Browse all {variantParent}
          </Link>
        </div>
      </div>
    </main>
  );
}
