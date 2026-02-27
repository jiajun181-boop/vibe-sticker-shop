"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Breadcrumbs from "@/components/Breadcrumbs";
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

const SECTIONS = [
  {
    key: "wraps-large",
    jumpLabel: "Wraps & Large Graphics",
    title: "Commercial Wraps & Large Graphics",
    subtitle:
      "High-ticket branding projects for vans, trucks, trailers, and fleet vehicles.",
    ui: "premium",
    items: [
      {
        key: "full-vehicle-wrap-design-print",
        name: "Full Vehicle Wrap (Design & Print)",
        href: `${BASE}/full-vehicle-wrap-design-print`,
        priceKeys: ["full-vehicle-wrap-design-print"],
        note: "Design, print, and branding rollout for full-coverage vehicles",
        badges: ["Quote-Only", "Install Available"],
        gradient: "from-violet-700 via-fuchsia-600 to-pink-500",
      },
      {
        key: "partial-wrap-spot-graphics",
        name: "Partial Wrap & Spot Graphics",
        href: `${BASE}/partial-wrap-spot-graphics`,
        priceKeys: ["partial-wrap-spot-graphics"],
        note: "Budget-friendly branding with strong visual impact",
        gradient: "from-indigo-700 via-blue-600 to-cyan-500",
      },
      {
        key: "trailer-box-truck-large-graphics",
        name: "Trailer / Box Truck Large Graphics",
        href: `${BASE}/trailer-box-truck-large-graphics`,
        priceKeys: ["trailer-box-truck-large-graphics", "trailer-full-wrap"],
        note: "Large-format side graphics for trailers and box trucks",
        gradient: "from-slate-700 via-slate-600 to-blue-500",
      },
      {
        key: "vehicle-roof-wrap",
        name: "Vehicle Roof Wrap",
        href: `${BASE}/vehicle-roof-wrap`,
        priceKeys: ["vehicle-roof-wrap"],
        note: "Top-view branding for parking lots, condos, and service fleets",
        gradient: "from-emerald-700 via-teal-600 to-cyan-500",
      },
    ],
  },
  {
    key: "door-decals-magnets",
    jumpLabel: "Door Decals & Magnets",
    title: "Door Decals & Magnets",
    subtitle:
      "Fast-turn branding essentials for contractors, local service vans, and field crews.",
    ui: "cards",
    items: [
      {
        key: "custom-truck-door-lettering-kit",
        name: "Custom Truck Door Lettering Kit",
        href: `${BASE}/custom-truck-door-lettering-kit`,
        priceKeys: ["custom-truck-door-lettering-kit"],
        note: "Cut vinyl text for both doors — company name, phone, licence",
        gradient: "from-blue-500 to-indigo-500",
      },
      {
        key: "magnetic-truck-door-signs",
        name: "Magnetic Truck Door Signs",
        href: `${BASE}/magnetic-truck-door-signs`,
        priceKeys: ["magnetic-truck-door-signs"],
        note: "Removable magnetic panels for trucks — swap between vehicles",
        gradient: "from-slate-500 to-slate-700",
      },
      {
        key: "car-door-magnets-pair",
        name: "Magnetic Car Signs (Pair)",
        href: `${BASE}/car-door-magnets-pair`,
        priceKeys: ["car-door-magnets-pair", "magnetic-car-signs"],
        note: "Full-color printed magnet pair for cars and small vans",
        gradient: "from-violet-500 to-fuchsia-500",
      },
      {
        key: "printed-truck-door-decals-full-color",
        name: "Printed Truck Door Decals (Full Color)",
        href: `${BASE}/printed-truck-door-decals-full-color`,
        priceKeys: ["printed-truck-door-decals-full-color"],
        note: "Full-color printed vinyl decals for truck doors",
        gradient: "from-cyan-500 to-sky-500",
      },
    ],
  },
  {
    key: "dot-fleet-compliance",
    jumpLabel: "DOT & Fleet Compliance",
    title: "Fleet Compliance & DOT Numbers",
    subtitle:
      "Essential compliance markings for logistics, transport, and commercial fleet operations.",
    ui: "list",
    items: [
      {
        key: "usdot-number-decals",
        name: "USDOT Number Decals",
        href: `${BASE}/usdot-number-decals`,
        priceKeys: ["usdot-number-decals"],
        badges: ["Same-Day"],
      },
      {
        key: "cvor-number-decals",
        name: "CVOR Number Decals",
        href: `${BASE}/cvor-number-decals`,
        priceKeys: ["cvor-number-decals"],
        badges: ["Same-Day"],
      },
      {
        key: "mc-nsc-number-decals",
        name: "MC / NSC Number Decals",
        href: `${BASE}/mc-number-decals`,
        priceKeys: ["mc-number-decals", "nsc-number-decals"],
        badges: ["Same-Day"],
      },
      {
        key: "tssa-truck-number-lettering-cut-vinyl",
        name: "TSSA Truck Number Lettering",
        href: `${BASE}/tssa-truck-number-lettering-cut-vinyl`,
        priceKeys: ["tssa-truck-number-lettering-cut-vinyl"],
      },
      {
        key: "gvw-tare-weight-lettering",
        name: "GVW / Tare Weight Lettering",
        href: `${BASE}/gvw-tare-weight-lettering`,
        priceKeys: ["gvw-tare-weight-lettering"],
      },
      {
        key: "fleet-unit-number-stickers",
        name: "Fleet Unit Number Stickers",
        href: `${BASE}/fleet-unit-number-stickers`,
        priceKeys: ["fleet-unit-number-stickers"],
      },
    ],
  },
  {
    key: "safety-spec-labels",
    jumpLabel: "Safety & Spec Labels",
    title: "Safety, Inspection & Spec Labels",
    subtitle:
      "Functional labels and safety markings for trucks, trailers, and heavy equipment fleets.",
    ui: "cards",
    items: [
      {
        key: "vehicle-inspection-maintenance-stickers",
        name: "Vehicle Inspection Maintenance Stickers",
        href: `${BASE}/vehicle-inspection-maintenance-stickers`,
        priceKeys: ["vehicle-inspection-maintenance-stickers"],
        note: "Pre-printed inspection and maintenance tracking stickers",
        gradient: "from-rose-500 to-red-500",
      },
      {
        key: "fuel-type-labels-diesel-gas",
        name: "Fuel Type Labels (Diesel / Gas)",
        href: `${BASE}/fuel-type-labels-diesel-gas`,
        priceKeys: ["fuel-type-labels-diesel-gas"],
        note: "Weather-resistant fuel cap labels for mixed fleets",
        gradient: "from-amber-500 to-orange-500",
      },
      {
        key: "dangerous-goods-placards",
        name: "Dangerous Goods Placards",
        href: `${BASE}/dangerous-goods-placards`,
        priceKeys: ["dangerous-goods-placards"],
        note: "DOT/TDG compliant placards for hazmat transport",
        gradient: "from-red-600 to-rose-600",
      },
      {
        key: "tire-pressure-load-labels",
        name: "Tire Pressure / Load Labels",
        href: `${BASE}/tire-pressure-load-labels`,
        priceKeys: ["tire-pressure-load-labels"],
        note: "Durable vinyl labels for tire and axle load specs",
        gradient: "from-zinc-600 to-slate-600",
      },
      {
        key: "reflective-conspicuity-chevron-kits",
        name: "Reflective Conspicuity Tape Kit / Chevron Kits",
        href: `${BASE}/reflective-conspicuity-tape-kit`,
        priceKeys: [
          "reflective-conspicuity-tape-kit",
          "high-visibility-rear-chevron-kit",
          "reflective-safety-stripes-kit",
        ],
        note: "Reflective tape and chevron kits for trailer visibility",
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
  const isSvg = imageUrl && isSvgImage(imageUrl);
  return (
    <Link
      href={item.href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--color-gray-200)] bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className={`relative overflow-hidden ${premium ? "h-44" : "h-24"} ${imageUrl ? "bg-[var(--color-gray-100)]" : `bg-gradient-to-br ${item.gradient || "from-slate-400 to-slate-600"}`}`}>
        {imageUrl ? (
          <>
            {isSvg ? (
              <img src={imageUrl} alt={item.name} className="h-full w-full object-cover" />
            ) : (
              <Image src={imageUrl} alt={item.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw" />
            )}
            <div className="absolute left-3 top-2 flex flex-wrap gap-1.5">
              {premium && <Badge label="Premium" tone="neutral" />}
              {item.badges?.map((b) => (
                <Badge key={b} label={b} tone={b === "Same-Day" ? "success" : "neutral"} />
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_55%)]" />
            <div className="relative flex h-full flex-col justify-between p-4 text-[#fff]">
              <div className="flex flex-wrap gap-1.5">
                {premium && <Badge label="Premium" tone="dark" />}
                {item.badges?.map((b) => (
                  <Badge key={b} label={b} tone={b === "Same-Day" ? "success" : premium ? "dark" : "neutral"} />
                ))}
              </div>
              <p className={`pr-2 font-semibold leading-tight text-[#fff] drop-shadow ${premium ? "text-base" : "text-sm"}`}>
                {item.name}
              </p>
              {premium && item.note ? <p className="text-xs text-[#fff]/80">{item.note}</p> : <span />}
            </div>
          </>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        {imageUrl && (
          <div>
            <p className={`font-semibold leading-tight text-[var(--color-gray-900)] ${premium ? "text-base" : "text-sm"}`}>{item.name}</p>
            {item.note && <p className="mt-0.5 text-xs text-[var(--color-gray-500)]">{item.note}</p>}
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
  return (
    <Link
      href={item.href}
      className="group flex items-center justify-between gap-3 rounded-xl border border-[var(--color-gray-200)] bg-white px-4 py-3 transition-colors hover:border-[var(--color-brand)] hover:bg-[var(--color-gray-50)]"
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-tight text-[var(--color-gray-900)]">{item.name}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-[var(--color-gray-500)]">{t("vc.complianceDecal")}</span>
          {item.badges?.map((b) => (
            <Badge key={b} label={b} tone="success" />
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

function renderSectionBody(section, vehiclePrices, vehicleImages = {}) {
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
          <ProductCard key={item.key} item={item} price={item.price} premium cta="Quote / View" imageUrl={vehicleImages[item.key]} />
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
        <ProductCard key={item.key} item={item} price={item.price} cta="View" imageUrl={vehicleImages[item.key]} />
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

        <header className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {t("vc.tagline")}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                {t("vc.title")}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--color-gray-600)] sm:text-base">
                {t("vc.subtitle")}
              </p>
            </div>
            <div className="grid gap-2 text-xs sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">{t("vc.badge.pickup")}</div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">{t("vc.badge.fleet")}</div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">{t("vc.badge.compliance")}</div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">{t("vc.badge.mobile")}</div>
            </div>
          </div>
        </header>

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
                  {section.jumpLabel || section.title}
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
                <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{section.title}</h2>
                <p className="mt-1 text-sm text-[var(--color-gray-500)]">{section.subtitle}</p>
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
            {renderSectionBody(section, vehiclePrices, vehicleImages)}
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
