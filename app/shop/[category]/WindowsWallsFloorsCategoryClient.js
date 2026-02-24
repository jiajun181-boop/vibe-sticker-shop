"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Breadcrumbs from "@/components/Breadcrumbs";
import { isSvgImage } from "@/lib/product-image";

const BASE = "/shop/windows-walls-floors";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

/* ── Section definitions ── */
const SECTIONS = [
  {
    key: "window",
    title: "Window Graphics & Films",
    subtitle: "Privacy films, one-way vision, frosted vinyl, and decorative window graphics.",
    size: "large",
    items: [
      { key: "one-way-vision", name: "One-Way Vision Film", href: `${BASE}/one-way-vision`, gradient: "from-sky-400 to-blue-400" },
      { key: "frosted-window-film", name: "Frosted Window Film", href: `${BASE}/frosted-window-film`, gradient: "from-slate-300 to-blue-200" },
      { key: "static-cling", name: "Static Cling Film", href: `${BASE}/static-cling`, gradient: "from-cyan-400 to-teal-400" },
      { key: "transparent-color-film", name: "Transparent Color Film", href: `${BASE}/transparent-color-film`, gradient: "from-violet-400 to-fuchsia-400" },
      { key: "blockout-vinyl", name: "Blockout Vinyl", href: `${BASE}/blockout-vinyl`, gradient: "from-gray-500 to-slate-600" },
      { key: "opaque-window-graphics", name: "Opaque Window Graphics", href: `${BASE}/opaque-window-graphics`, gradient: "from-indigo-400 to-blue-400" },
      { key: "glass-waistline", name: "Glass Waistline Strips", href: `${BASE}/glass-waistline`, gradient: "from-amber-300 to-orange-300" },
    ],
  },
  {
    key: "wall",
    title: "Wall Graphics & Murals",
    subtitle: "Custom wall decals, murals, and adhesive graphics for any surface.",
    size: "large",
    items: [
      { key: "wall-graphics", name: "Wall Graphics", href: `${BASE}/wall-graphics`, gradient: "from-emerald-400 to-teal-400" },
    ],
  },
  {
    key: "floor",
    title: "Floor Graphics & Decals",
    subtitle: "Anti-slip floor decals for retail, events, and wayfinding.",
    size: "large",
    items: [
      { key: "floor-graphics", name: "Floor Graphics", href: `${BASE}/floor-graphics`, gradient: "from-orange-400 to-red-400" },
    ],
  },
  {
    key: "decals-banners",
    title: "Decals, Banners & Backdrops",
    subtitle: "Vinyl decals, banners, and display backdrops for walls and events.",
    size: "large",
    items: [
      { key: "decals", name: "Custom Decals", href: `${BASE}/decals`, gradient: "from-rose-400 to-pink-400" },
      { key: "vinyl-banners", name: "Vinyl Banners", href: "/shop/banners-displays/vinyl-banners", gradient: "from-sky-400 to-blue-400" },
      { key: "telescopic-backdrop", name: "Display Backdrop", href: "/shop/banners-displays/telescopic-backdrop", gradient: "from-violet-400 to-purple-400" },
    ],
  },
];

function ProductCard({ item, price, size, imageUrl }) {
  const isLarge = size === "large";
  const isSvg = imageUrl && isSvgImage(imageUrl);
  return (
    <Link
      href={item.href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--color-gray-200)] bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
    >
      <div className={`relative flex items-center justify-center bg-gray-50 ${isLarge ? "h-[200px]" : "h-[140px]"}`}>
        {imageUrl ? (
          isSvg ? (
            <img src={imageUrl} alt={item.name} className="h-full w-full object-contain p-4" />
          ) : (
            <Image src={imageUrl} alt={item.name} fill className="object-contain p-4" sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw" />
          )
        ) : (
          <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${item.gradient}`}>
            <p className="px-6 text-center text-lg font-bold text-white drop-shadow-md">
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
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-brand)] px-3.5 py-1.5 text-[10px] font-semibold text-white transition-colors group-hover:bg-[var(--color-brand-dark)]">
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

export default function WindowsWallsFloorsCategoryClient({ wwfPrices = {}, wwfImages = {} }) {
  const { t } = useTranslation();

  return (
    <main className="bg-gradient-to-b from-blue-50 to-white pb-20 pt-10 text-[var(--color-gray-900)]">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 2xl:px-4">
        <Breadcrumbs
          items={[
            { label: t("product.shop"), href: "/shop" },
            { label: "Windows, Walls & Floors" },
          ]}
        />

        {/* Hero */}
        <header className="mt-6">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Windows, Walls & Floors
          </h1>
          <p className="mt-2 max-w-2xl text-sm sm:text-base text-[var(--color-gray-500)]">
            Custom window films, wall graphics, and floor decals. Professional installation-ready vinyl with full-colour printing.
          </p>
        </header>

        {/* Sections */}
        {SECTIONS.map((section) => {
          const visibleItems = section.items.filter((item) => item.key in wwfPrices);
          if (visibleItems.length === 0) return null;

          return (
            <section key={section.key} className="mt-12">
              <h2 className="text-xl font-semibold tracking-tight">{section.title}</h2>
              <p className="mt-1 text-sm text-[var(--color-gray-500)]">{section.subtitle}</p>
              <div className={`mt-4 grid gap-4 ${
                visibleItems.length <= 2
                  ? "grid-cols-1 sm:grid-cols-2"
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              }`}>
                {visibleItems.map((item) => (
                  <ProductCard
                    key={item.key}
                    item={item}
                    price={wwfPrices[item.key] || 0}
                    size={section.size}
                    imageUrl={wwfImages[item.key]}
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
              Professional Installation
            </h3>
            <p className="mt-3 text-sm text-[var(--color-gray-700)]">
              All films ship ready for professional or DIY installation. On-site installation available in the GTA.
            </p>
          </div>
          <div className="rounded-2xl shadow-[var(--shadow-card)] bg-white p-5">
            <h3 className="text-sm font-semibold text-[var(--color-gray-600)]">
              Indoor & Outdoor Rated
            </h3>
            <p className="mt-3 text-sm text-[var(--color-gray-700)]">
              UV-protective laminates extend lifespan to 3&ndash;5 years in direct sunlight. Rated for both indoor and outdoor use.
            </p>
          </div>
          <div className="rounded-2xl shadow-[var(--shadow-card)] bg-white p-5">
            <h3 className="text-sm font-semibold text-[var(--color-gray-600)]">
              Custom Sizes
            </h3>
            <p className="mt-3 text-sm text-[var(--color-gray-700)]">
              Any size, any shape. Priced per square foot. Upload your dimensions and get an instant quote.
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
