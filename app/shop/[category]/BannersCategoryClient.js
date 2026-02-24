"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Breadcrumbs from "@/components/Breadcrumbs";
import { isSvgImage } from "@/lib/product-image";

const BASE = "/shop/banners-displays";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

/* ── Section definitions ── */
const SECTIONS = [
  {
    key: "banners",
    title: "Custom Banners",
    subtitle: "Indoor & outdoor banners printed on heavy-duty vinyl and mesh.",
    size: "large",
    items: [
      { key: "vinyl-banners", name: "Vinyl Banners", href: `${BASE}/vinyl-banners`, gradient: "from-rose-400 to-pink-400" },
      { key: "mesh-banners", name: "Mesh Banners", href: `${BASE}/mesh-banners`, gradient: "from-sky-400 to-cyan-400" },
      { key: "pole-banners", name: "Pole Banners", href: `${BASE}/pole-banners`, gradient: "from-amber-400 to-orange-400" },
      { key: "double-sided-banners", name: "Two-Sided Banners", href: `${BASE}/double-sided-banners`, gradient: "from-violet-400 to-fuchsia-400" },
    ],
  },
  {
    key: "stands",
    title: "Banner Stands & Displays",
    subtitle: "Portable retractable and X-banner stands for events and retail.",
    size: "medium",
    items: [
      { key: "roll-up-banners", name: "Roll-Up Banners", href: `${BASE}/roll-up-banners`, gradient: "from-emerald-400 to-teal-400" },
      { key: "x-banner-frame-print", name: "X-Banner Stand", href: `${BASE}/x-banner-frame-print`, gradient: "from-indigo-400 to-blue-400" },
      { key: "tabletop-x-banner", name: "Tabletop X-Banner", href: `${BASE}/tabletop-x-banner`, gradient: "from-pink-400 to-rose-400" },
      { key: "deluxe-tabletop-retractable-a3", name: "Tabletop Retractable", href: `${BASE}/deluxe-tabletop-retractable-a3`, gradient: "from-amber-400 to-yellow-400" },
    ],
  },
  {
    key: "tradeshow",
    title: "Trade Show & Backdrops",
    subtitle: "Large-format backdrops and displays for trade shows and events.",
    size: "medium",
    items: [
      { key: "telescopic-backdrop", name: "Telescopic Backdrop", href: `${BASE}/telescopic-backdrop`, gradient: "from-slate-400 to-gray-400" },
      { key: "popup-display-curved-8ft", name: "Pop-Up Display 8ft", href: `${BASE}/popup-display-curved-8ft`, gradient: "from-blue-400 to-indigo-400" },
      { key: "table-cloth", name: "Custom Table Cloth", href: `${BASE}/table-cloth`, gradient: "from-teal-400 to-cyan-400" },
    ],
  },
  {
    key: "outdoor",
    title: "Outdoor Flags & Tents",
    subtitle: "Feather flags, teardrop flags, and canopy tents for outdoor events.",
    size: "medium",
    items: [
      { key: "feather-flags", name: "Feather Flags", href: `${BASE}/feather-flags`, gradient: "from-orange-400 to-red-400" },
      { key: "teardrop-flags", name: "Teardrop Flags", href: `${BASE}/teardrop-flags`, gradient: "from-cyan-400 to-sky-400" },
      { key: "outdoor-canopy-tent-10x10", name: "Canopy Tent 10×10", href: `${BASE}/outdoor-canopy-tent-10x10`, gradient: "from-emerald-400 to-green-400" },
    ],
  },
];

function ProductCard({ item, price, size, imageUrl, hoverImageUrl }) {
  const isLarge = size === "large";
  const [hovered, setHovered] = useState(false);
  const showUrl = hovered && hoverImageUrl ? hoverImageUrl : imageUrl;
  const isSvg = showUrl && isSvgImage(showUrl);
  return (
    <Link
      href={item.href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--color-gray-200)] bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={`relative overflow-hidden bg-[var(--color-gray-100)] ${isLarge ? "aspect-[3/2]" : "aspect-[4/3]"}`}>
        {showUrl ? (
          isSvg ? (
            <img src={showUrl} alt={item.name} className="h-full w-full object-cover transition-opacity duration-300" />
          ) : (
            <Image src={showUrl} alt={item.name} fill className="object-cover transition-opacity duration-300 group-hover:scale-105" sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw" />
          )
        ) : (
          <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${item.gradient}`}>
            <p className="px-6 text-center text-lg font-bold text-[#fff] drop-shadow-md">
              {item.name}
            </p>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className={`font-semibold text-[var(--color-gray-900)] ${isLarge ? "text-base" : "text-sm"}`}>
          {item.name}
        </h3>
        <div className="mt-auto pt-3 flex items-center justify-between">
          {price > 0 ? (
            <span className="text-sm font-bold text-[var(--color-gray-900)]">
              From {formatCad(price)}
            </span>
          ) : (
            <span className="text-xs text-[var(--color-gray-400)]">Get a quote</span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-brand)] px-3.5 py-1.5 text-[10px] font-semibold text-[#fff] transition-colors group-hover:bg-[var(--color-brand-dark)]">
            Configure
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function BannersCategoryClient({ bannerPrices = {}, bannerImages = {}, bannerImages2 = {} }) {
  const { t } = useTranslation();

  return (
    <main className="bg-gradient-to-b from-rose-50 to-white pb-20 pt-10 text-[var(--color-gray-900)]">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 2xl:px-4">
        <Breadcrumbs
          items={[
            { label: t("product.shop"), href: "/shop" },
            { label: "Banners & Displays" },
          ]}
        />

        {/* Hero */}
        <header className="mt-6">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Banners & Displays
          </h1>
          <p className="mt-2 max-w-2xl text-sm sm:text-base text-[var(--color-gray-500)]">
            Custom printed banners, retractable stands, backdrops, flags & tents. Perfect for events, trade shows, and storefronts.
          </p>
        </header>

        {/* Sections */}
        {SECTIONS.map((section) => {
          const visibleItems = section.items.filter((item) => item.key in bannerPrices);
          if (visibleItems.length === 0) return null;

          return (
            <section key={section.key} className="mt-12">
              <h2 className="text-xl font-semibold tracking-tight">{section.title}</h2>
              <p className="mt-1 text-sm text-[var(--color-gray-500)]">{section.subtitle}</p>
              <div className={`mt-4 grid gap-4 ${
                section.size === "large"
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                  : "grid-cols-2 sm:grid-cols-3"
              }`}>
                {visibleItems.map((item) => (
                  <ProductCard
                    key={item.key}
                    item={item}
                    price={bannerPrices[item.key] || 0}
                    size={section.size}
                    imageUrl={bannerImages[item.key]}
                    hoverImageUrl={bannerImages2[item.key]}
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
              Heavy-Duty Materials
            </h3>
            <p className="mt-3 text-sm text-[var(--color-gray-700)]">
              13oz scrim vinyl, mesh wind-through, and premium polyester fabrics. Built for Canadian weather.
            </p>
          </div>
          <div className="rounded-2xl shadow-[var(--shadow-card)] bg-white p-5">
            <h3 className="text-sm font-semibold text-[var(--color-gray-600)]">
              Finishing Options
            </h3>
            <p className="mt-3 text-sm text-[var(--color-gray-700)]">
              Grommets, pole pockets, hemmed edges, and wind slits included. Hardware ships with every stand.
            </p>
          </div>
          <div className="rounded-2xl shadow-[var(--shadow-card)] bg-white p-5">
            <h3 className="text-sm font-semibold text-[var(--color-gray-600)]">
              Same Day Production
            </h3>
            <p className="mt-3 text-sm text-[var(--color-gray-700)]">
              Rush production available on vinyl banners and roll-up stands. Order before 12pm for same day GTA pickup.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
