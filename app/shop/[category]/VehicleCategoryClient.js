"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Breadcrumbs from "@/components/Breadcrumbs";

const BASE = "/shop/vehicle-graphics-fleet";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

/* ── Section definitions ── */
const SECTIONS = [
  {
    key: "compliance",
    title: "Compliance & ID Numbers",
    subtitle: "Regulatory decals and identification numbers for commercial vehicles.",
    size: "medium",
    items: [
      { key: "truck-door-compliance-kit", name: "Truck Door Compliance Kit", href: `${BASE}/truck-door-compliance-kit`, gradient: "from-slate-500 to-gray-600" },
      { key: "cvor-number-decals", name: "CVOR Number Decals", href: `${BASE}/cvor-number-decals`, gradient: "from-slate-400 to-gray-400" },
      { key: "usdot-number-decals", name: "US DOT Number Decals", href: `${BASE}/usdot-number-decals`, gradient: "from-blue-400 to-indigo-400" },
      { key: "mc-number-decals", name: "MC Number Decals", href: `${BASE}/mc-number-decals`, gradient: "from-indigo-400 to-violet-400" },
      { key: "nsc-number-decals", name: "NSC Number Decals", href: `${BASE}/nsc-number-decals`, gradient: "from-violet-400 to-purple-400" },
      { key: "tssa-truck-number-lettering-cut-vinyl", name: "TSSA Truck Numbers", href: `${BASE}/tssa-truck-number-lettering-cut-vinyl`, gradient: "from-gray-400 to-slate-400" },
      { key: "gvw-tare-weight-lettering", name: "GVW / Tare Weight", href: `${BASE}/gvw-tare-weight-lettering`, gradient: "from-zinc-400 to-gray-400" },
      { key: "fleet-unit-number-stickers", name: "Fleet Unit Numbers", href: `${BASE}/fleet-unit-number-stickers`, gradient: "from-sky-400 to-blue-400" },
      { key: "trailer-id-number-decals", name: "Trailer ID Numbers", href: `${BASE}/trailer-id-number-decals`, gradient: "from-cyan-400 to-teal-400" },
      { key: "equipment-id-decals-cut-vinyl", name: "Equipment ID Decals", href: `${BASE}/equipment-id-decals-cut-vinyl`, gradient: "from-emerald-400 to-green-400" },
      { key: "tire-pressure-load-labels", name: "Tire Pressure Labels", href: `${BASE}/tire-pressure-load-labels`, gradient: "from-amber-400 to-yellow-400" },
      { key: "fuel-type-labels-diesel-gas", name: "Fuel Type Labels", href: `${BASE}/fuel-type-labels-diesel-gas`, gradient: "from-orange-400 to-amber-400" },
      { key: "vehicle-inspection-maintenance-stickers", name: "Inspection Stickers", href: `${BASE}/vehicle-inspection-maintenance-stickers`, gradient: "from-red-400 to-rose-400" },
    ],
  },
  {
    key: "wraps",
    title: "Vehicle Wraps & Large Graphics",
    subtitle: "Full and partial wraps, hood decals, roof wraps, and trailer graphics.",
    size: "large",
    cta: "Request a Quote",
    items: [
      { key: "full-vehicle-wrap-design-print", name: "Full Vehicle Wrap", href: `${BASE}/full-vehicle-wrap-design-print`, gradient: "from-violet-500 to-fuchsia-500" },
      { key: "partial-wrap-spot-graphics", name: "Partial Wrap Graphics", href: `${BASE}/partial-wrap-spot-graphics`, gradient: "from-indigo-400 to-blue-400" },
      { key: "car-graphics", name: "Car Graphics", href: `${BASE}/car-graphics`, gradient: "from-sky-400 to-cyan-400" },
      { key: "car-hood-decal", name: "Car Hood Decal", href: `${BASE}/car-hood-decal`, gradient: "from-rose-400 to-pink-400" },
      { key: "vehicle-roof-wrap", name: "Vehicle Roof Wrap", href: `${BASE}/vehicle-roof-wrap`, gradient: "from-emerald-400 to-teal-400" },
      { key: "trailer-full-wrap", name: "53ft Trailer Full Wrap", href: `${BASE}/trailer-full-wrap`, gradient: "from-slate-500 to-indigo-500" },
      { key: "trailer-box-truck-large-graphics", name: "Trailer Large Graphics", href: `${BASE}/trailer-box-truck-large-graphics`, gradient: "from-amber-400 to-orange-400" },
      { key: "fleet-graphic-package", name: "Fleet Graphic Package", href: `${BASE}/fleet-graphic-package`, gradient: "from-teal-400 to-cyan-400" },
      { key: "vehicle-wrap-print-only-quote", name: "Wrap Print Only", href: `${BASE}/vehicle-wrap-print-only-quote`, gradient: "from-gray-400 to-slate-400" },
    ],
  },
  {
    key: "lettering",
    title: "Vinyl Lettering & Decals",
    subtitle: "Custom cut vinyl lettering, logo decals, and promotional graphics for any vehicle.",
    size: "medium",
    items: [
      { key: "custom-cut-vinyl-lettering-any-text", name: "Custom Vinyl Lettering", href: `${BASE}/custom-cut-vinyl-lettering-any-text`, gradient: "from-emerald-400 to-teal-400" },
      { key: "custom-truck-door-lettering-kit", name: "Truck Door Lettering Kit", href: `${BASE}/custom-truck-door-lettering-kit`, gradient: "from-blue-400 to-indigo-400" },
      { key: "printed-truck-door-decals-full-color", name: "Printed Truck Door Decals", href: `${BASE}/printed-truck-door-decals-full-color`, gradient: "from-violet-400 to-purple-400" },
      { key: "truck-side-panel-printed-decal", name: "Truck Side Panel Decal", href: `${BASE}/truck-side-panel-printed-decal`, gradient: "from-pink-400 to-rose-400" },
      { key: "tailgate-rear-door-printed-decal", name: "Tailgate Decal", href: `${BASE}/tailgate-rear-door-printed-decal`, gradient: "from-amber-400 to-orange-400" },
      { key: "custom-printed-vehicle-logo-decals", name: "Custom Van Logo Decals", href: `${BASE}/custom-printed-vehicle-logo-decals`, gradient: "from-cyan-400 to-sky-400" },
      { key: "boat-lettering-registration", name: "Boat Registration Lettering", href: `${BASE}/boat-lettering-registration`, gradient: "from-sky-400 to-blue-400" },
      { key: "long-term-outdoor-vehicle-decals", name: "Long-Term Outdoor Decals", href: `${BASE}/long-term-outdoor-vehicle-decals`, gradient: "from-teal-400 to-emerald-400" },
      { key: "removable-promo-vehicle-decals", name: "Removable Promo Decals", href: `${BASE}/removable-promo-vehicle-decals`, gradient: "from-fuchsia-400 to-pink-400" },
      { key: "social-qr-vehicle-decals", name: "Social Media QR Decals", href: `${BASE}/social-qr-vehicle-decals`, gradient: "from-indigo-400 to-violet-400" },
      { key: "bumper-sticker-custom", name: "Custom Bumper Sticker", href: `${BASE}/bumper-sticker-custom`, gradient: "from-red-400 to-rose-400" },
      { key: "stay-back-warning-decals", name: "Stay Back Warning", href: `${BASE}/stay-back-warning-decals`, gradient: "from-yellow-400 to-amber-400" },
    ],
  },
  {
    key: "magnetic",
    title: "Magnetic Signs",
    subtitle: "Removable magnetic signs for cars, trucks, and rooftops. No permanent adhesive.",
    size: "medium",
    items: [
      { key: "magnetic-car-signs", name: "Magnetic Car Signs", href: `${BASE}/magnetic-car-signs`, gradient: "from-sky-400 to-blue-400" },
      { key: "magnetic-truck-door-signs", name: "Magnetic Truck Door Signs", href: `${BASE}/magnetic-truck-door-signs`, gradient: "from-indigo-400 to-blue-400" },
      { key: "magnetic-rooftop-sign", name: "Magnetic Rooftop Topper", href: `${BASE}/magnetic-rooftop-sign`, gradient: "from-violet-400 to-fuchsia-400" },
      { key: "car-door-magnets-pair", name: "Car Door Magnets (Pair)", href: `${BASE}/car-door-magnets-pair`, gradient: "from-emerald-400 to-teal-400" },
      { key: "magnets-flexible", name: "Flexible Magnets", href: `${BASE}/magnets-flexible`, gradient: "from-amber-400 to-orange-400" },
    ],
  },
  {
    key: "safety",
    title: "Fleet Safety & Operations",
    subtitle: "Reflective safety markings, conspicuity tape, and fleet management supplies.",
    size: "medium",
    items: [
      { key: "reflective-conspicuity-tape-kit", name: "Conspicuity Tape Kit", href: `${BASE}/reflective-conspicuity-tape-kit`, gradient: "from-yellow-400 to-orange-400" },
      { key: "reflective-safety-stripes-kit", name: "Reflective Safety Stripes", href: `${BASE}/reflective-safety-stripes-kit`, gradient: "from-orange-400 to-red-400" },
      { key: "high-visibility-rear-chevron-kit", name: "Rear Chevron Kit", href: `${BASE}/high-visibility-rear-chevron-kit`, gradient: "from-red-400 to-rose-400" },
      { key: "dangerous-goods-placards", name: "Dangerous Goods Placards", href: `${BASE}/dangerous-goods-placards`, gradient: "from-rose-500 to-red-500" },
      { key: "fleet-vehicle-inspection-book", name: "Vehicle Inspection Book", href: `${BASE}/fleet-vehicle-inspection-book`, gradient: "from-slate-400 to-gray-400" },
      { key: "hours-of-service-log-holder", name: "Hours of Service Log Holder", href: `${BASE}/hours-of-service-log-holder`, gradient: "from-gray-400 to-zinc-400" },
      { key: "ifta-cab-card-holder", name: "IFTA Cab Card Holder", href: `${BASE}/ifta-cab-card-holder`, gradient: "from-zinc-400 to-slate-400" },
    ],
  },
];

function ProductCard({ item, price, size, cta = "View" }) {
  const isLarge = size === "large";
  return (
    <Link
      href={item.href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--color-gray-200)] bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
    >
      <div className={`flex items-center justify-center bg-gradient-to-br ${item.gradient} ${isLarge ? "h-[200px]" : "h-[120px]"}`}>
        <p className="px-4 text-center text-sm font-bold text-white drop-shadow-md leading-tight">
          {item.name}
        </p>
      </div>
      <div className="flex flex-1 flex-col p-3">
        <h3 className={`font-semibold text-[var(--color-gray-900)] leading-tight ${isLarge ? "text-sm" : "text-xs"}`}>
          {item.name}
        </h3>
        <div className="mt-auto pt-2 flex items-center justify-between">
          {price > 0 ? (
            <span className="text-xs font-bold text-[var(--color-gray-900)]">
              From {formatCad(price)}
            </span>
          ) : (
            <span className="text-[10px] text-[var(--color-gray-400)]">Get a quote</span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-brand)] px-2.5 py-1 text-[9px] font-semibold text-white transition-colors group-hover:bg-[var(--color-brand-dark)]">
            {cta}
            <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function VehicleCategoryClient({ vehiclePrices = {} }) {
  const { t } = useTranslation();

  return (
    <main className="bg-gradient-to-b from-slate-50 to-white pb-20 pt-10 text-[var(--color-gray-900)]">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 2xl:px-4">
        <Breadcrumbs
          items={[
            { label: t("product.shop"), href: "/shop" },
            { label: "Vehicle Graphics & Fleet" },
          ]}
        />

        {/* Hero */}
        <header className="mt-6">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Vehicle Graphics & Fleet
          </h1>
          <p className="mt-2 max-w-2xl text-sm sm:text-base text-[var(--color-gray-500)]">
            Commercial vehicle branding, fleet compliance decals, magnetic signs, and safety markings. From single trucks to full fleets.
          </p>
        </header>

        {/* Sections */}
        {SECTIONS.map((section) => {
          const visibleItems = section.items.filter((item) => item.key in vehiclePrices);
          if (visibleItems.length === 0) return null;

          return (
            <section key={section.key} className="mt-12">
              <h2 className="text-xl font-semibold tracking-tight">{section.title}</h2>
              <p className="mt-1 text-sm text-[var(--color-gray-500)]">{section.subtitle}</p>
              <div className={`mt-4 grid gap-3 ${
                section.size === "large"
                  ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
                  : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
              }`}>
                {visibleItems.map((item) => (
                  <ProductCard
                    key={item.key}
                    item={item}
                    price={vehiclePrices[item.key] || 0}
                    size={section.size}
                    cta={section.cta || "View"}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {/* Back to shop */}
        <div className="mt-12 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-gray-300)] px-5 py-2.5 text-xs font-semibold text-[var(--color-gray-600)] transition-colors hover:border-[var(--color-gray-900)] hover:text-[var(--color-gray-900)]"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            All Categories
          </Link>
        </div>

        {/* Value Props */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl shadow-[var(--shadow-card)] bg-white p-5">
            <h3 className="text-sm font-semibold text-[var(--color-gray-600)]">
              DOT & MTO Compliant
            </h3>
            <p className="mt-3 text-sm text-[var(--color-gray-700)]">
              All compliance decals meet federal DOT, CVOR, and Ontario MTO requirements. Reflective and non-reflective options available.
            </p>
          </div>
          <div className="rounded-2xl shadow-[var(--shadow-card)] bg-white p-5">
            <h3 className="text-sm font-semibold text-[var(--color-gray-600)]">
              Fleet Pricing
            </h3>
            <p className="mt-3 text-sm text-[var(--color-gray-700)]">
              Volume discounts for fleet orders. Consistent branding across your entire fleet with bulk production pricing.
            </p>
          </div>
          <div className="rounded-2xl shadow-[var(--shadow-card)] bg-white p-5">
            <h3 className="text-sm font-semibold text-[var(--color-gray-600)]">
              Professional Installation
            </h3>
            <p className="mt-3 text-sm text-[var(--color-gray-700)]">
              On-site installation available in the GTA. We come to your yard or fleet depot. DIY kits also available with instructions.
            </p>
            <Link
              href="/quote"
              className="mt-3 inline-block rounded-full bg-[var(--color-brand)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--color-brand-dark)]"
            >
              Get a Quote
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
