"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { turnaroundI18nKey, turnaroundColor } from "@/lib/turnaroundConfig";
import Breadcrumbs from "@/components/Breadcrumbs";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
    cents / 100
  );

// Deterministic pseudo-random number from a string (for social proof)
function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function SubGroupCard({ group, t, maxCount }) {
  const [hovered, setHovered] = useState(false);
  const inquiryCount = 5 + (hashCode(group.slug) % 42);
  const barWidth = maxCount > 0 ? Math.max(8, Math.round((group.count / maxCount) * 100)) : 0;

  return (
    <div
      id={`sg-${group.slug}`}
      className="scroll-mt-32 relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link
        href={group.href}
        className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--color-gray-200)] bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-[var(--color-gray-400)]"
      >
        {/* Preview images or placeholder */}
        <div className="relative aspect-[4/3] bg-[var(--color-gray-100)]">
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
                  <div key={`empty-${i}`} className="bg-[var(--color-gray-50)]" />
                ))}
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--color-gray-50)] to-[var(--color-gray-100)]">
              <svg
                className="h-10 w-10 text-[var(--color-gray-200)]"
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

          {/* Corner badges */}
          {(group.hasNew || group.hasFeatured) && (
            <div className="absolute top-2 left-2 flex gap-1">
              {group.hasNew && (
                <span className="rounded-md bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm">
                  {t("shop.badge.new")}
                </span>
              )}
              {group.hasFeatured && !group.hasNew && (
                <span className="rounded-md bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm">
                  {t("shop.badge.popular")}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-3 sm:p-4">
          <h3 className="text-sm font-semibold text-[var(--color-gray-900)] group-hover:text-[var(--color-moon-gold)] transition-colors">
            {group.title}
          </h3>

          {/* Product count + bar */}
          {group.count > 0 && (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1 flex-1 rounded-full bg-[var(--color-gray-100)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--color-gray-300)] transition-all duration-500 group-hover:bg-gray-500"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              <span className="text-[10px] font-medium text-[var(--color-gray-400)] tabular-nums shrink-0">
                {group.count}
              </span>
            </div>
          )}

          {/* Turnaround + Price badges */}
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {group.turnaround && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${turnaroundColor(group.turnaround)}`}>
                {t(turnaroundI18nKey(group.turnaround))}
              </span>
            )}
            {group.minPrice > 0 && (
              <span className="text-[11px] font-semibold text-[var(--color-gray-700)]">
                {t("product.from", { price: formatCad(group.minPrice) })}
              </span>
            )}
          </div>

          {/* Social proof */}
          <p className="mt-1 text-[10px] text-[var(--color-gray-400)]">
            {t("shop.inquiredRecently", { count: inquiryCount })}
          </p>

          <span className="mt-auto pt-3 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--color-gray-500)] group-hover:text-[var(--color-gray-900)] transition-colors">
            {t("mp.landing.browse")}
            <svg className="h-3 w-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </span>
        </div>
      </Link>

      {/* Hover preview popover (desktop only) */}
      {hovered && group.topProducts?.length > 0 && (
        <div className="hidden md:block absolute left-1/2 -translate-x-1/2 top-full z-20 mt-1 w-56 rounded-xl border border-[var(--color-gray-200)] bg-white p-3 shadow-xl pointer-events-none animate-in fade-in-0 zoom-in-95 duration-150">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-gray-400)] mb-2">
            {t("shop.hoverViewProducts")}
          </p>
          <div className="space-y-2">
            {group.topProducts.slice(0, 3).map((prod, i) => (
              <div key={i} className="flex items-center gap-2">
                {prod.imageUrl ? (
                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md bg-[var(--color-gray-100)]">
                    <Image
                      src={prod.imageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="32px"
                      unoptimized={prod.imageUrl.endsWith(".svg")}
                    />
                  </div>
                ) : (
                  <div className="h-8 w-8 shrink-0 rounded-md bg-[var(--color-gray-100)]" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-[var(--color-gray-800)] truncate">
                    {prod.name}
                  </p>
                  {prod.price > 0 && (
                    <p className="text-[10px] text-[var(--color-gray-500)]">
                      {t("product.from", { price: formatCad(prod.price) })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SubGroupLandingClient({
  category,
  categoryTitle,
  categoryIcon,
  subGroups,
  groupedSubGroups = [],
  siblingCategories = [],
  totalCount,
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [activeSlug, setActiveSlug] = useState(null);
  const pillBarRef = useRef(null);

  const maxCount = useMemo(
    () => Math.max(...subGroups.map((sg) => sg.count || 0), 1),
    [subGroups]
  );

  // IntersectionObserver to track which sub-group card is in view
  useEffect(() => {
    if (subGroups.length <= 4) return;
    const ids = subGroups.map((sg) => `sg-${sg.slug}`);
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const slug = entry.target.id.replace("sg-", "");
            setActiveSlug(slug);
            // scroll the active pill into view
            const pill = pillBarRef.current?.querySelector(`[data-pill="${slug}"]`);
            if (pill) pill.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
            break;
          }
        }
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [subGroups]);

  const filteredSubGroups = useMemo(() => {
    if (!search.trim()) return subGroups;
    const q = search.trim().toLowerCase();
    return subGroups.filter((sg) => sg.title.toLowerCase().includes(q));
  }, [subGroups, search]);

  const filteredGroupedSubGroups = useMemo(() => {
    if (!groupedSubGroups.length) return [];
    const bySlug = new Set(filteredSubGroups.map((sg) => sg.slug));
    return groupedSubGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => bySlug.has(item.slug)),
      }))
      .filter((group) => group.items.length > 0);
  }, [groupedSubGroups, filteredSubGroups]);

  return (
    <main className="bg-[var(--color-gray-50)] pb-20 pt-10 text-[var(--color-gray-900)]">
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
          <p className="mt-1 text-sm text-[var(--color-gray-500)]">
            {totalCount} {t("mp.landing.products")}
          </p>

          {/* Search */}
          <div className="relative mt-4 w-full sm:w-72">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-gray-400)] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("shop.searchCategory") || "Search this category..."}
              className="w-full rounded-full border border-[var(--color-gray-200)] bg-white pl-9 pr-4 py-2 text-sm focus:border-[var(--color-gray-400)] focus:outline-none"
            />
          </div>
        </header>

        {/* Quick-jump pill bar */}
        {subGroups.length > 4 && (
          <div className="sticky top-[64px] z-10 -mx-4 px-4 sm:-mx-6 sm:px-6 mt-6 pb-3 bg-[var(--color-gray-50)]/95 backdrop-blur-sm border-b border-[var(--color-gray-200)]/50">
            <div ref={pillBarRef} className="flex gap-2 overflow-x-auto scrollbar-hide scroll-fade py-1">
              {subGroups.map((group) => (
                <button
                  key={group.slug}
                  data-pill={group.slug}
                  onClick={() => {
                    const el = document.getElementById(`sg-${group.slug}`);
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                    activeSlug === group.slug
                      ? "bg-[var(--color-gray-900)] text-white"
                      : "border border-[var(--color-gray-200)] bg-white text-[var(--color-gray-600)] hover:border-[var(--color-gray-400)] hover:text-[var(--color-gray-900)]"
                  }`}
                >
                  {group.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sub-group card grid */}
        {filteredGroupedSubGroups.length > 0 ? (
          <div className={subGroups.length > 4 ? "mt-4 space-y-8" : "mt-8 space-y-8"}>
            {filteredGroupedSubGroups.map((segment) => (
              <section key={segment.key}>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-gray-500)]">
                  {segment.title}
                </h2>
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                  {segment.items.map((group) => (
                    <SubGroupCard key={group.slug} group={group} t={t} maxCount={maxCount} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className={`grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 ${subGroups.length > 4 ? "mt-4" : "mt-8"}`}>
            {filteredSubGroups.map((group) => (
              <SubGroupCard key={group.slug} group={group} t={t} maxCount={maxCount} />
            ))}
          </div>
        )}

        {filteredSubGroups.length === 0 && search.trim() && (
          <div className="mt-8 text-center">
            <p className="text-sm text-[var(--color-gray-500)]">{t("shop.noResults")}</p>
            <button
              onClick={() => setSearch("")}
              className="mt-3 rounded-full border border-[var(--color-gray-300)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-gray-700)] hover:border-[var(--color-gray-900)]"
            >
              {t("shop.clearFilters")}
            </button>
          </div>
        )}

        {/* Sibling categories — explore more */}
        {siblingCategories.length > 0 && (
          <section className="mt-12">
            <h2 className="text-lg font-semibold tracking-tight text-[var(--color-gray-900)]">
              {t("shop.exploreMore") || "Explore More"}
            </h2>
            <div className="mt-4 flex gap-3 overflow-x-auto scrollbar-hide scroll-fade pb-2">
              {siblingCategories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={cat.href}
                  className="group shrink-0 flex items-center gap-2.5 rounded-xl border border-[var(--color-gray-200)] bg-white px-5 py-3.5 transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-[var(--color-gray-400)]"
                >
                  {cat.icon && <span className="text-lg">{cat.icon}</span>}
                  <span className="text-sm font-semibold text-[var(--color-gray-700)] group-hover:text-[var(--color-gray-900)] whitespace-nowrap">
                    {cat.title}
                  </span>
                  <svg className="h-3.5 w-3.5 text-[var(--color-gray-400)] group-hover:text-[var(--color-gray-600)] transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-gray-300)] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-gray-600)] transition-colors hover:border-[var(--color-gray-900)] hover:text-[var(--color-gray-900)]"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            {t("shop.backToCategories")}
          </Link>
        </div>

        {/* Info Footer */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-gray-600)]">
              {t("mp.landing.qualityTitle")}
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-[var(--color-gray-700)]">
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
          <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-gray-600)]">
              {t("mp.landing.turnaroundTitle")}
            </h3>
            <p className="mt-3 text-sm text-[var(--color-gray-700)]">{t("mp.landing.turnaroundText")}</p>
          </div>
          <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-gray-600)]">
              {t("mp.landing.customTitle")}
            </h3>
            <p className="mt-3 text-sm text-[var(--color-gray-700)]">{t("mp.landing.customText")}</p>
            <Link href="/quote" className="mt-3 inline-block rounded-full bg-[var(--color-gray-900)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-white hover:bg-black">
              {t("home.cta.quote")}
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Quote FAB */}
      <QuickQuoteFAB t={t} />
    </main>
  );
}

function QuickQuoteFAB({ t }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <Link
      href="/quote"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-[var(--color-gray-900)] px-5 py-3 pb-safe text-white shadow-lg transition-all hover:bg-black hover:shadow-xl hover:scale-105 animate-in fade-in-0 slide-in-from-bottom-4 duration-300"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
      </svg>
      <span className="text-xs font-semibold uppercase tracking-[0.12em]">
        {t("shop.quickQuote")}
      </span>
    </Link>
  );
}
