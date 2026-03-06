"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Breadcrumbs from "@/components/Breadcrumbs";
import CategoryHero from "@/components/category/CategoryHero";
import CategoryFaq from "@/components/category/CategoryFaq";
import { isSvgImage } from "@/lib/product-image";

const BASE = "/shop/vehicle-graphics-fleet";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
    cents / 100
  );

function minPrice(vehiclePrices, keys = []) {
  const prices = keys.map((k) => vehiclePrices[k]).filter((v) => Number(v) > 0);
  return prices.length ? Math.min(...prices) : 0;
}

/* ── Item slug → i18n key map ── */
const ITEM_I18N = {
  "full-vehicle-wrap-design-print": "vc.item.fullWrap",
  "partial-wrap-spot-graphics": "vc.item.partialWrap",
  "trailer-box-truck-large-graphics": "vc.item.trailerGraphics",
  "vehicle-roof-wrap": "vc.item.roofWrap",
  "custom-truck-door-lettering-kit": "vc.item.doorLettering",
  "magnetic-truck-door-signs": "vc.item.magneticTruck",
  "car-door-magnets-pair": "vc.item.magneticCar",
  "printed-truck-door-decals-full-color": "vc.item.printedDoorDecals",
  "usdot-number-decals": "vc.item.usdot",
  "cvor-number-decals": "vc.item.cvor",
  "mc-nsc-number-decals": "vc.item.mcNsc",
  "tssa-truck-number-lettering-cut-vinyl": "vc.item.tssa",
  "gvw-tare-weight-lettering": "vc.item.gvwTare",
  "fleet-unit-number-stickers": "vc.item.fleetUnit",
  "vehicle-inspection-maintenance-stickers": "vc.item.inspection",
  "fuel-type-labels-diesel-gas": "vc.item.fuelType",
  "dangerous-goods-placards": "vc.item.dangerousGoods",
  "tire-pressure-load-labels": "vc.item.tirePressure",
  "reflective-conspicuity-chevron-kits": "vc.item.reflectiveTape",
};

const NOTE_I18N = {
  "full-vehicle-wrap-design-print": "vc.item.fullWrap.note",
  "partial-wrap-spot-graphics": "vc.item.partialWrap.note",
  "trailer-box-truck-large-graphics": "vc.item.trailerGraphics.note",
  "vehicle-roof-wrap": "vc.item.roofWrap.note",
  "custom-truck-door-lettering-kit": "vc.item.doorLettering.note",
  "magnetic-truck-door-signs": "vc.item.magneticTruck.note",
  "car-door-magnets-pair": "vc.item.magneticCar.note",
  "printed-truck-door-decals-full-color": "vc.item.printedDoorDecals.note",
  "vehicle-inspection-maintenance-stickers": "vc.item.inspection.note",
  "fuel-type-labels-diesel-gas": "vc.item.fuelType.note",
  "dangerous-goods-placards": "vc.item.dangerousGoods.note",
  "tire-pressure-load-labels": "vc.item.tirePressure.note",
  "reflective-conspicuity-chevron-kits": "vc.item.reflectiveTape.note",
};

const BADGE_I18N = {
  "Quote-Only": "vc.badge.quoteOnly",
  "Install Available": "vc.badge.installAvailable",
  "Same-Day": "vc.badge.sameDay",
  "Premium": "vc.badge.premium",
};

const SECTIONS = [
  {
    key: "wraps-large",
    jumpLabelKey: "vc.section.wrapsLarge.jump",
    titleKey: "vc.section.wrapsLarge.title",
    subtitleKey: "vc.section.wrapsLarge.subtitle",
    ui: "premium",
    items: [
      {
        key: "full-vehicle-wrap-design-print",
        href: `${BASE}/full-vehicle-wrap-design-print`,
        priceKeys: ["full-vehicle-wrap-design-print"],
        badgeKeys: ["Quote-Only", "Install Available"],
        gradient: "from-violet-700 via-fuchsia-600 to-pink-500",
      },
      {
        key: "partial-wrap-spot-graphics",
        href: `${BASE}/partial-wrap-spot-graphics`,
        priceKeys: ["partial-wrap-spot-graphics"],
        gradient: "from-indigo-700 via-blue-600 to-cyan-500",
      },
      {
        key: "trailer-box-truck-large-graphics",
        href: `${BASE}/trailer-box-truck-large-graphics`,
        priceKeys: ["trailer-box-truck-large-graphics", "trailer-full-wrap"],
        gradient: "from-slate-700 via-slate-600 to-blue-500",
      },
      {
        key: "vehicle-roof-wrap",
        href: `${BASE}/vehicle-roof-wrap`,
        priceKeys: ["vehicle-roof-wrap"],
        gradient: "from-emerald-700 via-teal-600 to-cyan-500",
      },
    ],
  },
  {
    key: "door-decals-magnets",
    jumpLabelKey: "vc.section.doorDecals.jump",
    titleKey: "vc.section.doorDecals.title",
    subtitleKey: "vc.section.doorDecals.subtitle",
    ui: "cards",
    items: [
      {
        key: "custom-truck-door-lettering-kit",
        href: `${BASE}/custom-truck-door-lettering-kit`,
        priceKeys: ["custom-truck-door-lettering-kit"],
        gradient: "from-blue-500 to-indigo-500",
      },
      {
        key: "magnetic-truck-door-signs",
        href: `${BASE}/magnetic-truck-door-signs`,
        priceKeys: ["magnetic-truck-door-signs"],
        gradient: "from-slate-500 to-slate-700",
      },
      {
        key: "car-door-magnets-pair",
        href: `${BASE}/car-door-magnets-pair`,
        priceKeys: ["car-door-magnets-pair", "magnetic-car-signs"],
        gradient: "from-violet-500 to-fuchsia-500",
      },
      {
        key: "printed-truck-door-decals-full-color",
        href: `${BASE}/printed-truck-door-decals-full-color`,
        priceKeys: ["printed-truck-door-decals-full-color"],
        gradient: "from-cyan-500 to-sky-500",
      },
    ],
  },
  {
    key: "dot-fleet-compliance",
    jumpLabelKey: "vc.section.dotCompliance.jump",
    titleKey: "vc.section.dotCompliance.title",
    subtitleKey: "vc.section.dotCompliance.subtitle",
    ui: "list",
    items: [
      {
        key: "usdot-number-decals",
        href: `${BASE}/usdot-number-decals`,
        priceKeys: ["usdot-number-decals"],
        badgeKeys: ["Same-Day"],
      },
      {
        key: "cvor-number-decals",
        href: `${BASE}/cvor-number-decals`,
        priceKeys: ["cvor-number-decals"],
        badgeKeys: ["Same-Day"],
      },
      {
        key: "mc-nsc-number-decals",
        href: `${BASE}/mc-number-decals`,
        priceKeys: ["mc-number-decals", "nsc-number-decals"],
        badgeKeys: ["Same-Day"],
      },
      {
        key: "tssa-truck-number-lettering-cut-vinyl",
        href: `${BASE}/tssa-truck-number-lettering-cut-vinyl`,
        priceKeys: ["tssa-truck-number-lettering-cut-vinyl"],
      },
      {
        key: "gvw-tare-weight-lettering",
        href: `${BASE}/gvw-tare-weight-lettering`,
        priceKeys: ["gvw-tare-weight-lettering"],
      },
      {
        key: "fleet-unit-number-stickers",
        href: `${BASE}/fleet-unit-number-stickers`,
        priceKeys: ["fleet-unit-number-stickers"],
      },
    ],
  },
  {
    key: "safety-spec-labels",
    jumpLabelKey: "vc.section.safetyLabels.jump",
    titleKey: "vc.section.safetyLabels.title",
    subtitleKey: "vc.section.safetyLabels.subtitle",
    ui: "cards",
    items: [
      {
        key: "vehicle-inspection-maintenance-stickers",
        href: `${BASE}/vehicle-inspection-maintenance-stickers`,
        priceKeys: ["vehicle-inspection-maintenance-stickers"],
        gradient: "from-rose-500 to-red-500",
      },
      {
        key: "fuel-type-labels-diesel-gas",
        href: `${BASE}/fuel-type-labels-diesel-gas`,
        priceKeys: ["fuel-type-labels-diesel-gas"],
        gradient: "from-amber-500 to-orange-500",
      },
      {
        key: "dangerous-goods-placards",
        href: `${BASE}/dangerous-goods-placards`,
        priceKeys: ["dangerous-goods-placards"],
        gradient: "from-red-600 to-rose-600",
      },
      {
        key: "tire-pressure-load-labels",
        href: `${BASE}/tire-pressure-load-labels`,
        priceKeys: ["tire-pressure-load-labels"],
        gradient: "from-zinc-600 to-slate-600",
      },
      {
        key: "reflective-conspicuity-chevron-kits",
        href: `${BASE}/reflective-conspicuity-tape-kit`,
        priceKeys: [
          "reflective-conspicuity-tape-kit",
          "high-visibility-rear-chevron-kit",
          "reflective-safety-stripes-kit",
        ],
        gradient: "from-yellow-500 to-red-500",
      },
    ],
  },
];

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
  const isSvg = imageUrl && isSvgImage(imageUrl);
  const name = t(ITEM_I18N[item.key] || item.key);
  const note = NOTE_I18N[item.key] ? t(NOTE_I18N[item.key]) : null;
  const badges = (item.badgeKeys || []).map((b) => ({ label: t(BADGE_I18N[b] || b), raw: b }));
  return (
    <Link
      href={item.href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--color-gray-200)] bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className={`relative overflow-hidden ${premium ? "h-44" : "h-24"} ${imageUrl ? "bg-[var(--color-gray-100)]" : `bg-gradient-to-br ${item.gradient || "from-slate-400 to-slate-600"}`}`}>
        {imageUrl ? (
          <>
            {isSvg ? (
              <img src={imageUrl} alt={name} loading="lazy" className="h-full w-full object-cover" />
            ) : (
              <Image src={imageUrl} alt={name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw" />
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
              <p className={`pr-2 font-semibold leading-tight text-[#fff] drop-shadow ${premium ? "text-base" : "text-sm"}`}>
                {name}
              </p>
              {premium && note ? <p className="text-xs text-[#fff]/80">{note}</p> : <span />}
            </div>
          </>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        {imageUrl && (
          <div>
            <p className={`font-semibold leading-tight text-[var(--color-gray-900)] ${premium ? "text-base" : "text-sm"}`}>{name}</p>
            {note && <p className="mt-0.5 text-xs text-[var(--color-gray-500)]">{note}</p>}
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <PriceLabel price={price} />
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-brand)] px-3 py-1.5 text-[10px] font-semibold text-[#fff] transition-colors group-hover:bg-[var(--color-brand-dark)]">
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
  const badges = (item.badgeKeys || []).map((b) => ({ label: t(BADGE_I18N[b] || b), raw: b }));
  return (
    <Link
      href={item.href}
      className="group flex items-center justify-between gap-3 rounded-xl border border-[var(--color-gray-200)] bg-white px-4 py-3 transition-colors hover:border-[var(--color-brand)] hover:bg-[var(--color-gray-50)]"
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-tight text-[var(--color-gray-900)]">{name}</p>
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
  return SECTIONS.filter((section) =>
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
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {visibleItems.map((item) => (
          <ProductCard key={item.key} item={item} price={item.price} premium cta={t("vc.cta.quoteView")} imageUrl={vehicleImages[item.key]} />
        ))}
      </div>
    );
  }

  if (section.ui === "list") {
    return (
      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {visibleItems.map((item) => (
          <ComplianceListItem key={item.key} item={item} price={item.price} />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {visibleItems.map((item) => (
        <ProductCard key={item.key} item={item} price={item.price} cta={t("vc.cta.view")} imageUrl={vehicleImages[item.key]} />
      ))}
    </div>
  );
}

export default function VehicleCategoryClient({ vehiclePrices = {}, vehicleImages = {} }) {
  const { t } = useTranslation();
  const visibleSections = visibleSectionsForPrices(vehiclePrices);

  return (
    <main className="bg-gradient-to-b from-slate-50 via-white to-white pb-20 pt-10 text-[var(--color-gray-900)]">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 2xl:px-4">
        <Breadcrumbs
          items={[
            { label: t("product.shop"), href: "/shop" },
            { label: t("vc.breadcrumb") },
          ]}
        />

        <div className="mt-6">
          <CategoryHero category="vehicle-graphics-fleet" title={t("vc.title")} icon="🚗" />
        </div>

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

        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-[var(--color-gray-700)]">{t("vc.feature1.title")}</h3>
            <p className="mt-2 text-sm text-[var(--color-gray-600)]">
              {t("vc.feature1.desc")}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-[var(--color-gray-700)]">{t("vc.feature2.title")}</h3>
            <p className="mt-2 text-sm text-[var(--color-gray-600)]">
              {t("vc.feature2.desc")}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-[var(--color-gray-700)]">{t("vc.feature3.title")}</h3>
            <p className="mt-2 text-sm text-[var(--color-gray-600)]">
              {t("vc.feature3.desc")}
            </p>
            <Link
              href="/quote"
              className="mt-3 inline-block rounded-full bg-[var(--color-brand)] px-4 py-2 text-xs font-semibold text-[#fff] hover:bg-[var(--color-brand-dark)]"
            >
              {t("vc.getQuote")}
            </Link>
          </div>
        </div>

        <CategoryFaq category="vehicle-graphics-fleet" />

        <div className="mt-12 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-gray-300)] px-5 py-2.5 text-xs font-semibold text-[var(--color-gray-600)] transition-colors hover:border-[var(--color-gray-900)] hover:text-[var(--color-gray-900)]"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            {t("vc.allCategories")}
          </Link>
        </div>
      </div>
    </main>
  );
}
