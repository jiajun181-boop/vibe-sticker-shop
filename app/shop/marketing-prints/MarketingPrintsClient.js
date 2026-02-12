"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Breadcrumbs from "@/components/Breadcrumbs";

const SUB_CATEGORIES = [
  { key: "flyers", href: "/shop/marketing-prints/flyers", icon: "\uD83D\uDCC4" },
  { key: "brochures", href: "/shop/marketing-prints/brochures", icon: "\uD83D\uDCF0" },
  { key: "postcards", href: "/shop/marketing-prints/postcards", icon: "\uD83D\uDC8C" },
  { key: "booklets", href: "/shop/marketing-prints/booklets", icon: "\uD83D\uDCD6" },
  { key: "businessCards", href: "/shop/business-cards", icon: "\uD83D\uDCB3" },
  { key: "stamps", href: "/shop/marketing-prints/stamps", icon: "\uD83D\uDD16" },
  { key: "menus", href: "/shop/marketing-prints/menus", icon: "\uD83C\uDF7D\uFE0F" },
  { key: "stationery", href: "/shop/marketing-prints/stationery", icon: "\u2709\uFE0F" },
  { key: "marketing", href: "/shop/marketing-prints/marketing", icon: "\uD83D\uDCE3" },
  { key: "cards", href: "/shop/marketing-prints/cards", icon: "\uD83C\uDCB4" },
];

export default function MarketingPrintsClient({ counts }) {
  const { t } = useTranslation();

  return (
    <main className="bg-gray-50 pb-20 pt-10 text-gray-900">
      <div className="mx-auto max-w-6xl px-6">
        <Breadcrumbs
          items={[
            { label: t("product.shop"), href: "/shop" },
            { label: t("mp.landing.title") },
          ]}
        />

        {/* Header */}
        <header className="mt-6">
          <h1 className="text-4xl font-semibold tracking-tight">
            {t("mp.landing.title")}
          </h1>
          <p className="mt-2 max-w-2xl text-base text-gray-600">
            {t("mp.landing.subtitle")}
          </p>
        </header>

        {/* Category Card Grid */}
        <div className="mt-8 grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {SUB_CATEGORIES.map((cat) => {
            const count = counts?.[cat.key] || 0;
            return (
              <Link
                key={cat.key}
                href={cat.href}
                className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-gray-400"
              >
                <span className="text-2xl">{cat.icon}</span>
                <h3 className="mt-2 text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {t(`mp.sub.${cat.key}.title`)}
                </h3>
                <p className="mt-0.5 text-[11px] text-gray-500 line-clamp-2">
                  {t(`mp.sub.${cat.key}.subtitle`)}
                </p>
                {count > 0 && (
                  <p className="mt-2 text-[11px] text-gray-400">
                    {count} {t("mp.landing.products")}
                  </p>
                )}
                <span className="mt-auto pt-3 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-500 group-hover:text-gray-900 transition-colors">
                  {t("mp.landing.browse")}
                  <svg className="h-3 w-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </span>
              </Link>
            );
          })}
        </div>

        {/* Info Footer */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-600">
              {t("mp.landing.qualityTitle")}
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              {["quality1", "quality2", "quality3", "quality4"].map((k) => (
                <li key={k} className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t(`mp.landing.${k}`)}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-600">
              {t("mp.landing.turnaroundTitle")}
            </h3>
            <p className="mt-3 text-sm text-gray-700">
              {t("mp.landing.turnaroundText")}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              {t("mp.landing.turnaroundDetail")}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-600">
              {t("mp.landing.customTitle")}
            </h3>
            <p className="mt-3 text-sm text-gray-700">
              {t("mp.landing.customText")}
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
