"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Breadcrumbs from "@/components/Breadcrumbs";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
    cents / 100
  );

export default function StampsClient({ products }) {
  const { t } = useTranslation();

  return (
    <main className="bg-gray-50 pb-20 pt-10 text-gray-900">
      <div className="mx-auto max-w-6xl px-6">
        <Breadcrumbs
          items={[
            { label: t("product.shop"), href: "/shop" },
            { label: t("stamps.landing.title") },
          ]}
        />

        {/* Header */}
        <header className="mt-6">
          <h1 className="text-4xl font-semibold tracking-tight">
            {t("stamps.landing.title")}
          </h1>
          <p className="mt-2 max-w-2xl text-base text-gray-600">
            {t("stamps.landing.subtitle")}
          </p>
        </header>

        {/* Shape Sections */}
        {["rect", "round"].map((shape) => {
          const group = products.filter(
            (p) => p.optionsConfig?.specs?.shape === (shape === "rect" ? "Rectangular" : "Round") ||
                   p.optionsConfig?.specs?.shape === "Square" && shape === "rect"
          );
          if (group.length === 0) return null;
          const label = shape === "rect"
            ? t("stamps.landing.rectTitle")
            : t("stamps.landing.roundTitle");

          return (
            <section key={shape} className="mt-8">
              <h2 className="text-lg font-semibold text-gray-800">{label}</h2>
              <div className="mt-4 grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {group.map((product) => {
                  const href = `/shop/${product.category}/${product.slug}`;
                  const image = product.images?.[0];
                  const specs = product.optionsConfig?.specs;
                  const model = product.slug.replace("stamps-", "").toUpperCase();

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
                                className="mx-auto h-10 w-10 text-gray-300"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={1}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
                                />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                              </svg>
                              <p className="mt-1 text-xs font-bold text-gray-400">
                                {model}
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

                        {/* Size info */}
                        {specs && (
                          <p className="mt-0.5 text-[11px] text-gray-500 line-clamp-1">
                            {specs.dimensions} ({specs.metric})
                          </p>
                        )}

                        {/* Price */}
                        <p className="mt-2 text-sm font-bold text-gray-900">
                          {formatCad(product.basePrice)}
                        </p>

                        {/* CTA */}
                        <span className="mt-2 inline-block rounded-full bg-gray-900 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-white transition-colors group-hover:bg-black">
                          {t("stamps.landing.viewDetails")}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* Info Section */}
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {/* About */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-600">
              {t("stamps.landing.aboutTitle")}
            </h3>
            <p className="mt-3 text-sm text-gray-700">
              {t("stamps.landing.aboutText")}
            </p>
          </div>

          {/* Features */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-600">
              {t("stamps.landing.featuresTitle")}
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              {["feat1", "feat2", "feat3", "feat4"].map((k) => (
                <li key={k} className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t(`stamps.landing.${k}`)}
                </li>
              ))}
            </ul>
          </div>

          {/* Replacement Pads */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-600">
              {t("stamps.landing.padsTitle")}
            </h3>
            <p className="mt-3 text-sm text-gray-700">
              {t("stamps.landing.padsText")}
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
