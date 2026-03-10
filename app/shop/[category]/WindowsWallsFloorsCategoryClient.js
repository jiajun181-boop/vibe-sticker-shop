"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import FamilyLandingShell from "@/components/storefront/FamilyLandingShell";
import { isSvgImage } from "@/lib/product-image";
import { formatCad } from "@/lib/product-helpers";
import {
  WWF_BROWSE_CASES,
  WWF_COMPARISON_COLUMNS,
  WWF_COMPARISON_FEATURES,
  WWF_SECTIONS,
  ITEM_I18N,
  TAGLINE_KEYS,
  CUES,
  WWF_VALUE_PROPS,
  WWF_USE_CASES,
  WWF_CROSS_LINKS,
} from "@/lib/storefront/windows-family";

/* ── ProductCard with hover image swap ── */
function ProductCard({ item, price, imageUrl, hoverImageUrl, t }) {
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const showUrl = hovered && hoverImageUrl ? hoverImageUrl : imageUrl;
  const isSvg = showUrl && isSvgImage(showUrl);
  const name = t(ITEM_I18N[item.key] || item.key);
  const tagline = TAGLINE_KEYS[item.key] ? t(TAGLINE_KEYS[item.key]) : "";
  const cues = CUES[item.key] || [];
  return (
    <Link
      href={item.href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--color-gray-200)] bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative overflow-hidden bg-[var(--color-gray-100)] aspect-[4/3]">
        {showUrl && !imgError ? (
          isSvg ? (
            <img src={showUrl} alt={name} loading="lazy" onError={() => setImgError(true)} className="h-full w-full object-cover transition-opacity duration-300" />
          ) : (
            <Image src={showUrl} alt={name} fill onError={() => setImgError(true)} className="object-cover transition-opacity duration-300 group-hover:scale-105" sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw" />
          )
        ) : (
          <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${item.gradient}`}>
            <p className="px-6 text-center text-lg font-bold text-[#fff] drop-shadow-md">
              {name}
            </p>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-2.5 sm:p-3">
        <h3 className="text-sm font-semibold text-[var(--color-gray-900)]">
          {name}
        </h3>
        {tagline && (
          <p className="mt-0.5 text-[11px] leading-tight text-gray-500 line-clamp-2">
            {tagline}
          </p>
        )}
        {cues.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {cues.map((c) => (
              <span key={c} className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-medium text-gray-600">
                {t(c)}
              </span>
            ))}
          </div>
        )}
        <div className="mt-auto pt-2 flex items-center justify-between">
          {price > 0 ? (
            <span className="text-sm font-bold text-[var(--color-gray-900)]">
              {t("shop.fromLabel")} {formatCad(price)}
            </span>
          ) : (
            <span className="text-xs text-[var(--color-gray-400)]">{t("shop.getQuote")}</span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-brand)] px-2.5 py-1 text-[9px] font-semibold text-[#fff] transition-colors group-hover:bg-[var(--color-brand-dark)]">
            {t("shop.configureQuote")}
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ── CrossLinks component ── */
function CrossLinks({ t }) {
  return (
    <section className="mt-12">
      <h2 className="text-xl font-semibold tracking-tight">{t("wwf.related")}</h2>
      <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-3">
        {WWF_CROSS_LINKS.map((cat) => (
          <Link
            key={cat.href}
            href={cat.href}
            className="group flex items-center gap-4 rounded-xl border border-[var(--color-gray-200)] bg-white p-5 transition-all hover:border-[var(--color-brand)] hover:shadow-md"
          >
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-[var(--color-gray-900)] group-hover:text-[var(--color-brand)]">
                {t(cat.titleKey)}
              </h3>
              <p className="mt-1 text-xs text-[var(--color-gray-500)] truncate">
                {t(cat.descKey)}
              </p>
            </div>
            <svg className="h-4 w-4 shrink-0 text-[var(--color-gray-400)] group-hover:text-[var(--color-brand)] transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function WindowsWallsFloorsCategoryClient({ wwfPrices = {}, wwfImages = {}, wwfImages2 = {} }) {
  const { t } = useTranslation();

  const familyContext = { family: "wwf" };

  return (
    <FamilyLandingShell
      bgClassName="bg-gradient-to-b from-blue-50 to-white"
      breadcrumbs={[
        { label: t("product.shop"), href: "/shop" },
        { label: t("wwf.breadcrumb") },
      ]}
      heroCategory="windows-walls-floors"
      heroTitle={t("wwf.title")}
      heroIcon="\uD83E\uDE9F"
      browseByNeed={{
        titleKey: "wwf.browse.title",
        subtitleKey: "wwf.browse.subtitle",
        cases: WWF_BROWSE_CASES,
      }}
      comparison={{
        title: "wwf.cmp.title",
        subtitle: "wwf.cmp.subtitle",
        columns: WWF_COMPARISON_COLUMNS,
        features: WWF_COMPARISON_FEATURES,
      }}
      useCases={{
        title: "wwf.uc.title",
        cases: WWF_USE_CASES,
      }}
      valueProps={WWF_VALUE_PROPS}
      faqCategory="windows-walls-floors"
      familyContext={familyContext}
    >
      {/* ── Product sections ── */}
      {WWF_SECTIONS.map((section) => {
        const visibleItems = section.items.filter((item) => item.key in wwfPrices);
        if (visibleItems.length === 0) return null;

        return (
          <section key={section.key} id={section.key} className="mt-12">
            <h2 className="text-xl font-semibold tracking-tight">{t(section.titleKey)}</h2>
            <p className="mt-1 text-sm text-[var(--color-gray-500)]">{t(section.subtitleKey)}</p>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
              {visibleItems.map((item) => (
                <ProductCard
                  key={item.key}
                  item={item}
                  price={wwfPrices[item.key] || 0}
                  imageUrl={wwfImages[item.key]}
                  hoverImageUrl={wwfImages2[item.key]}
                  t={t}
                />
              ))}
            </div>
          </section>
        );
      })}

      {WWF_SECTIONS.every((section) => section.items.every((item) => !(item.key in wwfPrices))) && (
        <p className="mt-12 text-center text-sm text-[var(--color-gray-500)]">
          {t("shop.noProducts")}
        </p>
      )}

      {/* ── Cross-links ── */}
      <CrossLinks t={t} />
    </FamilyLandingShell>
  );
}
