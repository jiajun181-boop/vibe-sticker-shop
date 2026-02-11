"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Breadcrumbs from "@/components/Breadcrumbs";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
    cents / 100
  );

export default function BusinessCardsClient({ products }) {
  const { t } = useTranslation();

  return (
    <main className="bg-gray-50 pb-20 pt-10 text-gray-900">
      <div className="mx-auto max-w-6xl px-6">
        <Breadcrumbs
          items={[
            { label: t("product.shop"), href: "/shop" },
            { label: t("bc.landing.title") },
          ]}
        />

        {/* Header */}
        <header className="mt-6">
          <h1 className="text-4xl font-semibold tracking-tight">
            {t("bc.landing.title")}
          </h1>
          <p className="mt-2 text-base text-gray-600">
            {t("bc.landing.subtitle")}
          </p>
        </header>

        {/* Product Grid */}
        <div className="mt-8 grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => {
            const href = `/shop/${product.category}/${product.slug}`;
            const image = product.images?.[0];
            const specs = product.optionsConfig?.specs;

            return (
              <Link
                key={product.id}
                href={href}
                className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] bg-gray-100">
                  {image?.url ? (
                    <Image
                      src={image.url}
                      alt={image.alt || product.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <div className="text-center px-3">
                        <svg
                          className="mx-auto h-8 w-8 text-gray-300"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
                          />
                        </svg>
                        <p className="mt-1 text-xs font-medium text-gray-400">
                          {product.name.replace("Business Cards", "").trim() ||
                            product.name}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-3 sm:p-4">
                  <h3 className="text-sm font-semibold text-gray-900 leading-snug">
                    {product.name}
                  </h3>

                  {/* Short spec hint */}
                  {specs?.paper && (
                    <p className="mt-0.5 text-[11px] text-gray-500 line-clamp-1">
                      {specs.paper}
                    </p>
                  )}

                  {/* Price — always visible */}
                  <p className="mt-2 text-sm font-bold text-gray-900">
                    {t("product.from", {
                      price: formatCad(product.basePrice),
                    })}
                  </p>

                  {/* CTA */}
                  <span className="mt-2 inline-block rounded-full bg-gray-900 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-white transition-colors group-hover:bg-black">
                    {t("bc.landing.viewDetails")}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Info Section */}
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {/* Specs */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-600">
              {t("bc.landing.specsTitle")}
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t("bc.landing.spec1")}
              </li>
              <li className="flex items-start gap-2">
                <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t("bc.landing.spec2")}
              </li>
              <li className="flex items-start gap-2">
                <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t("bc.landing.spec3")}
              </li>
              <li className="flex items-start gap-2">
                <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t("bc.landing.spec4")}
              </li>
            </ul>
          </div>

          {/* Multi-name */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-600">
              {t("bc.landing.multiNameTitle")}
            </h3>
            <p className="mt-3 text-sm text-gray-700">
              {t("bc.landing.multiNameHint")}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              {t("bc.landing.multiNameDetail")}
            </p>
          </div>

          {/* Custom CTA */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-600">
              {t("bc.landing.customTitle")}
            </h3>
            <p className="mt-3 text-sm text-gray-700">
              {t("bc.landing.customCta")}
            </p>
            <Link
              href="/quote"
              className="mt-3 inline-block rounded-full bg-gray-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-white hover:bg-black"
            >
              {t("home.cta.quote")}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
