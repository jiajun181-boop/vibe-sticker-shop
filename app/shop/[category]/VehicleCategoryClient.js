"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import FamilyLandingShell from "@/components/storefront/FamilyLandingShell";
import { isSvgImage } from "@/lib/product-image";
import { formatCad } from "@/lib/product-helpers";
import {
  VEHICLE_BROWSE_CASES,
  VEHICLE_COMPARISON_COLUMNS,
  VEHICLE_COMPARISON_FEATURES,
  VEHICLE_SECTIONS,
  VEHICLE_VALUE_PROPS,
  VEHICLE_USE_CASES,
  VEHICLE_PRODUCTION_GUIDE,
  VEHICLE_CROSS_LINKS,
  ITEM_I18N,
  NOTE_I18N,
  TAGLINE_KEYS,
  BADGE_I18N,
} from "@/lib/storefront/vehicle-family";

function minPrice(vehiclePrices, keys = []) {
  const prices = keys.map((k) => vehiclePrices[k]).filter((v) => Number(v) > 0);
  return prices.length ? Math.min(...prices) : 0;
}

function PriceLabel({ price }) {
  const { t } = useTranslation();
  if (price > 0) {
    return (
      <span className="text-xs font-bold text-[var(--color-gray-900)]">
        {t("vc.from")} {formatCad(price)}
      </span>
    );
  }
  return <span className="text-[11px] text-[var(--color-gray-400)]">{t("vc.getQuote")}</span>;
}

function Badge({ label, tone = "neutral" }) {
  const cls =
    tone === "success"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : tone === "dark"
        ? "bg-black/15 text-[#fff] border-white/25"
        : "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] ${cls}`}>
      {label}
    </span>
  );
}

function ProductCard({ item, price, premium = false, cta = "View", imageUrl }) {
  const { t } = useTranslation();
  const [imgError, setImgError] = useState(false);
  const isSvg = imageUrl && isSvgImage(imageUrl);
  const name = t(ITEM_I18N[item.key] || item.key);
  const note = NOTE_I18N[item.key] ? t(NOTE_I18N[item.key]) : null;
  const tagline = TAGLINE_KEYS[item.key] ? t(TAGLINE_KEYS[item.key]) : null;
  const badges = (item.badgeKeys || []).map((b) => ({ label: t(BADGE_I18N[b] || b), raw: b }));
  return (
    <Link
      href={item.href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--color-gray-200)] bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className={`relative overflow-hidden ${premium ? "aspect-[4/3]" : "aspect-[16/7]"} ${imageUrl && !imgError ? "bg-[var(--color-gray-100)]" : `bg-gradient-to-br ${item.gradient || "from-slate-400 to-slate-600"}`}`}>
        {imageUrl && !imgError ? (
          <>
            {isSvg ? (
              <img src={imageUrl} alt={name} loading="lazy" onError={() => setImgError(true)} className="h-full w-full object-cover" />
            ) : (
              <Image src={imageUrl} alt={name} fill onError={() => setImgError(true)} className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw" />
            )}
            <div className="absolute left-3 top-2 flex flex-wrap gap-1.5">
              {premium && <Badge label={t("vc.badge.premium")} tone="neutral" />}
              {badges.map((b) => (
                <Badge key={b.raw} label={b.label} tone={b.raw === "Same-Day" ? "success" : "neutral"} />
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_55%)]" />
            <div className="relative flex h-full flex-col justify-between p-4 text-[#fff]">
              <div className="flex flex-wrap gap-1.5">
                {premium && <Badge label={t("vc.badge.premium")} tone="dark" />}
                {badges.map((b) => (
                  <Badge key={b.raw} label={b.label} tone={b.raw === "Same-Day" ? "success" : premium ? "dark" : "neutral"} />
                ))}
              </div>
              <div>
                <p className={`pr-2 font-semibold leading-tight text-[#fff] drop-shadow ${premium ? "text-base" : "text-sm"}`}>
                  {name}
                </p>
                {tagline && <p className="mt-0.5 text-[11px] leading-tight text-[#fff]/70 line-clamp-2">{tagline}</p>}
              </div>
              {premium && note ? <p className="text-xs text-[#fff]/80">{note}</p> : <span />}
            </div>
          </>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        {imageUrl && !imgError && (
          <div>
            <p className={`font-semibold leading-tight text-[var(--color-gray-900)] ${premium ? "text-base" : "text-sm"}`}>{name}</p>
            {tagline && <p className="mt-0.5 text-[11px] leading-tight text-gray-500 line-clamp-2">{tagline}</p>}
            {note && <p className="mt-0.5 text-xs text-[var(--color-gray-500)]">{note}</p>}
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <PriceLabel price={price} />
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-brand)] px-2.5 py-1 text-[9px] font-semibold text-[#fff] transition-colors group-hover:bg-[var(--color-brand-dark)]">
            {cta}
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

function ComplianceListItem({ item, price }) {
  const { t } = useTranslation();
  const name = t(ITEM_I18N[item.key] || item.key);
  const tagline = TAGLINE_KEYS[item.key] ? t(TAGLINE_KEYS[item.key]) : null;
  const badges = (item.badgeKeys || []).map((b) => ({ label: t(BADGE_I18N[b] || b), raw: b }));
  return (
    <Link
      href={item.href}
      className="group flex items-center justify-between gap-3 rounded-xl border border-[var(--color-gray-200)] bg-white px-4 py-3 transition-colors hover:border-[var(--color-brand)] hover:bg-[var(--color-gray-50)]"
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-tight text-[var(--color-gray-900)]">{name}</p>
        {tagline && <p className="mt-0.5 text-[11px] leading-tight text-gray-500 line-clamp-2">{tagline}</p>}
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-[var(--color-gray-500)]">{t("vc.complianceDecal")}</span>
          {badges.map((b) => (
            <Badge key={b.raw} label={b.label} tone="success" />
          ))}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <PriceLabel price={price} />
        <svg className="h-4 w-4 text-[var(--color-gray-400)] group-hover:text-[var(--color-brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </div>
    </Link>
  );
}

function visibleSectionsForPrices(vehiclePrices) {
  return VEHICLE_SECTIONS.filter((section) =>
    section.items.some((item) => (item.priceKeys || [item.key]).some((k) => k in vehiclePrices))
  );
}

function RenderSectionBody({ section, vehiclePrices, vehicleImages = {} }) {
  const { t } = useTranslation();
  const visibleItems = section.items
    .map((item) => ({
      ...item,
      price: minPrice(vehiclePrices, item.priceKeys || [item.key]),
    }))
    .filter((item) => (item.priceKeys || [item.key]).some((k) => k in vehiclePrices));

  if (visibleItems.length === 0) return null;

  if (section.ui === "premium") {
    return (
      <div className="mt-5 grid gap-2.5 sm:gap-3 md:grid-cols-2">
        {visibleItems.map((item) => (
          <ProductCard key={item.key} item={item} price={item.price} premium cta={t("vc.cta.quoteView")} imageUrl={vehicleImages[item.key]} />
        ))}
      </div>
    );
  }

  if (section.ui === "list") {
    return (
      <div className="mt-5 grid gap-2.5 sm:gap-3 lg:grid-cols-2">
        {visibleItems.map((item) => (
          <ComplianceListItem key={item.key} item={item} price={item.price} />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-5 grid gap-2.5 sm:gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {visibleItems.map((item) => (
        <ProductCard key={item.key} item={item} price={item.price} cta={t("vc.cta.view")} imageUrl={vehicleImages[item.key]} />
      ))}
    </div>
  );
}

/* ── Production Guidance Section ── */
function ProductionGuide() {
  const { t } = useTranslation();
  return (
    <section className="mt-12">
      <h2 className="text-xl font-semibold tracking-tight text-[var(--color-gray-900)]">
        {t("vc.prod.sectionTitle")}
      </h2>
      <p className="mt-1 text-sm text-[var(--color-gray-500)]">
        {t("vc.prod.sectionSubtitle")}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {VEHICLE_PRODUCTION_GUIDE.map((g) => (
          <div key={g.key} className="rounded-xl border border-[var(--color-gray-200)] bg-white p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0">{g.iconKey}</span>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-[var(--color-gray-900)]">{t(g.titleKey)}</h3>
                <p className="mt-1 text-xs text-[var(--color-gray-600)] leading-relaxed">{t(g.descKey)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Cross-links to related categories ── */
function CrossLinks() {
  const { t } = useTranslation();
  return (
    <section className="mt-12">
      <h2 className="text-xl font-semibold tracking-tight">{t("vc.related")}</h2>
      <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-3">
        {VEHICLE_CROSS_LINKS.map((cat) => (
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

export default function VehicleCategoryClient({ vehiclePrices = {}, vehicleImages = {} }) {
  const { t } = useTranslation();
  const visibleSections = visibleSectionsForPrices(vehiclePrices);

  return (
    <FamilyLandingShell
      bgClassName="bg-gradient-to-b from-slate-50 via-white to-white"
      breadcrumbs={[
        { label: t("product.shop"), href: "/shop" },
        { label: t("vc.breadcrumb") },
      ]}
      heroCategory="vehicle-graphics-fleet"
      heroTitle={t("vc.title")}
      heroIcon="\uD83D\uDE97"
      browseByNeed={{
        titleKey: "vc.browse.sectionTitle",
        subtitleKey: "vc.browse.sectionSubtitle",
        cases: VEHICLE_BROWSE_CASES,
      }}
      comparison={{
        title: "vc.cmp.sectionTitle",
        subtitle: "vc.cmp.sectionSubtitle",
        columns: VEHICLE_COMPARISON_COLUMNS,
        features: VEHICLE_COMPARISON_FEATURES,
      }}
      useCases={{
        title: "vc.uc.sectionTitle",
        cases: VEHICLE_USE_CASES,
      }}
      valueProps={VEHICLE_VALUE_PROPS}
      faqCategory="vehicle-graphics-fleet"
      familyContext={{ family: "vehicle" }}
    >
      {/* Quick-jump nav */}
      {visibleSections.length > 0 && (
        <div className="sticky top-[calc(var(--promo-offset,0px)+var(--nav-offset,72px)+8px)] z-10 -mx-4 mt-5 border-y border-slate-200/70 bg-white/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6 2xl:-mx-4 2xl:px-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              {t("vc.quickJump")}
            </span>
            {visibleSections.map((section) => (
              <a
                key={section.key}
                href={`#${section.key}`}
                className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-[var(--color-brand)] hover:text-[var(--color-gray-900)]"
              >
                {t(section.jumpLabelKey || section.titleKey)}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Product sections */}
      {visibleSections.map((section, index) => (
        <section
          key={section.key}
          id={section.key}
          className={`${index === 0 ? "mt-8" : "mt-12"} scroll-mt-40`}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{t(section.titleKey)}</h2>
              <p className="mt-1 text-sm text-[var(--color-gray-500)]">{t(section.subtitleKey)}</p>
            </div>
            {section.ui === "premium" && (
              <Link
                href="/quote"
                className="inline-flex items-center gap-2 self-start rounded-full border border-[var(--color-gray-300)] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-gray-700)] transition-colors hover:border-[var(--color-gray-900)] hover:text-[var(--color-gray-900)]"
              >
                {t("vc.requestFleetQuote")}
              </Link>
            )}
          </div>
          <RenderSectionBody section={section} vehiclePrices={vehiclePrices} vehicleImages={vehicleImages} />
        </section>
      ))}

      {visibleSections.length === 0 && (
        <p className="mt-12 text-center text-sm text-[var(--color-gray-500)]">
          {t("shop.noProducts")}
        </p>
      )}

      {/* Production guidance — key differences that matter */}
      <ProductionGuide />

      {/* Cross-links to related categories */}
      <CrossLinks />
    </FamilyLandingShell>
  );
}
