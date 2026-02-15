"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { turnaroundI18nKey, turnaroundColor } from "@/lib/turnaroundConfig";
import Breadcrumbs from "@/components/Breadcrumbs";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
    cents / 100
  );

function SubGroupCard({ group, t }) {
  return (
    <div id={`sg-${group.slug}`} className="scroll-mt-32">
      <Link
        href={group.href}
        className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-gray-400"
      >
        {/* Preview images or placeholder */}
        <div className="relative aspect-[4/3] bg-gray-100">
          {group.previews?.length > 0 ? (
            <div className="grid h-full w-full grid-cols-3">
              {group.previews.slice(0, 3).map((url, i) => (
                <div key={i} className="relative overflow-hidden">
                  <Image
                    src={url}
                    alt=""
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 33vw, 15vw"
                    unoptimized={url.endsWith(".svg")}
                  />
                </div>
              ))}
              {group.previews.length < 3 &&
                Array.from({ length: 3 - group.previews.length }).map((_, i) => (
                  <div key={`empty-${i}`} className="bg-gray-50" />
                ))}
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
              <svg
                className="h-10 w-10 text-gray-200"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-3 sm:p-4">
          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {group.title}
          </h3>
          {group.count > 0 && (
            <p className="mt-1 text-[11px] text-gray-400">
              {group.count} {t("mp.landing.products")}
            </p>
          )}

          {/* Turnaround + Price badges */}
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {group.turnaround && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${turnaroundColor(group.turnaround)}`}>
                {t(turnaroundI18nKey(group.turnaround))}
              </span>
            )}
            {group.minPrice > 0 && (
              <span className="text-[11px] font-semibold text-gray-700">
                {t("product.from", { price: formatCad(group.minPrice) })}
              </span>
            )}
          </div>

          <span className="mt-auto pt-3 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-500 group-hover:text-gray-900 transition-colors">
            {t("mp.landing.browse")}
            <svg className="h-3 w-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </span>
        </div>
      </Link>
    </div>
  );
}

export default function SubGroupLandingClient({
  category,
  categoryTitle,
  categoryIcon,
  subGroups,
  siblingCategories = [],
  totalCount,
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const filteredSubGroups = useMemo(() => {
    if (!search.trim()) return subGroups;
    const q = search.trim().toLowerCase();
    return subGroups.filter((sg) => sg.title.toLowerCase().includes(q));
  }, [subGroups, search]);

  return (
    <main className="bg-gray-50 pb-20 pt-10 text-gray-900">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Breadcrumbs
          items={[
            { label: t("product.shop"), href: "/shop" },
            { label: categoryTitle },
          ]}
        />

        {/* Header */}
        <header className="mt-6">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            {categoryIcon && <span className="mr-2">{categoryIcon}</span>}
            {categoryTitle}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {totalCount} {t("mp.landing.products")}
          </p>

          {/* Search */}
          <div className="relative mt-4 w-full sm:w-72">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("shop.searchCategory") || "Search this category..."}
              className="w-full rounded-full border border-gray-200 bg-white pl-9 pr-4 py-2 text-sm focus:border-gray-400 focus:outline-none"
            />
          </div>
        </header>

        {/* Quick-jump pill bar */}
        {subGroups.length > 4 && (
          <div className="sticky top-[64px] z-10 -mx-4 px-4 sm:-mx-6 sm:px-6 mt-6 pb-3 bg-gray-50/95 backdrop-blur-sm border-b border-gray-200/50">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide scroll-fade py-1">
              {subGroups.map((group) => (
                <button
                  key={group.slug}
                  onClick={() => {
                    const el = document.getElementById(`sg-${group.slug}`);
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="shrink-0 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-gray-400 hover:text-gray-900 transition-colors whitespace-nowrap"
                >
                  {group.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sub-group card grid */}
        <div className={`grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-4 ${subGroups.length > 4 ? "mt-4" : "mt-8"}`}>
          {filteredSubGroups.map((group) => (
            <SubGroupCard key={group.slug} group={group} t={t} />
          ))}
        </div>

        {filteredSubGroups.length === 0 && search.trim() && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">{t("shop.noResults")}</p>
            <button
              onClick={() => setSearch("")}
              className="mt-3 rounded-full border border-gray-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-gray-700 hover:border-gray-900"
            >
              {t("shop.clearFilters")}
            </button>
          </div>
        )}

        {/* Sibling categories — explore more */}
        {siblingCategories.length > 0 && (
          <section className="mt-12">
            <h2 className="text-lg font-semibold tracking-tight text-gray-900">
              {t("shop.exploreMore") || "Explore More"}
            </h2>
            <div className="mt-4 flex gap-3 overflow-x-auto scrollbar-hide scroll-fade pb-2">
              {siblingCategories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={cat.href}
                  className="group shrink-0 flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-5 py-3.5 transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-gray-400"
                >
                  {cat.icon && <span className="text-lg">{cat.icon}</span>}
                  <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 whitespace-nowrap">
                    {cat.title}
                  </span>
                  <svg className="h-3.5 w-3.5 text-gray-400 group-hover:text-gray-600 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Back to shop */}
        <div className="mt-12 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-gray-600 transition-colors hover:border-gray-900 hover:text-gray-900"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            {t("shop.backToCategories")}
          </Link>
        </div>

        {/* Info Footer */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
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
            <p className="mt-3 text-sm text-gray-700">{t("mp.landing.turnaroundText")}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-600">
              {t("mp.landing.customTitle")}
            </h3>
            <p className="mt-3 text-sm text-gray-700">{t("mp.landing.customText")}</p>
            <Link href="/quote" className="mt-3 inline-block rounded-full bg-gray-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-white hover:bg-black">
              {t("home.cta.quote")}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
