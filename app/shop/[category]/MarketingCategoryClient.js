"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Breadcrumbs from "@/components/Breadcrumbs";

const BASE = "/shop/marketing-business-print";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

/* ── Section definitions ── */
const SECTIONS = [
  {
    key: "essentials",
    title: "The Essentials",
    subtitle: "Our most popular products \u2014 trusted by thousands of Toronto businesses.",
    size: "large",
    items: [
      { key: "business-cards", name: "Business Cards", href: `${BASE}/business-cards`, gradient: "from-amber-400 to-orange-400" },
      { key: "flyers", name: "Flyers", href: `${BASE}/flyers`, gradient: "from-rose-400 to-pink-400" },
      { key: "brochures", name: "Brochures", href: `${BASE}/brochures`, gradient: "from-violet-400 to-fuchsia-400" },
      { key: "postcards", name: "Postcards", href: `${BASE}/postcards`, gradient: "from-sky-400 to-cyan-400" },
      { key: "posters", name: "Posters", href: `${BASE}/posters`, gradient: "from-emerald-400 to-teal-400" },
      { key: "booklets", name: "Booklets", href: `${BASE}/booklets`, gradient: "from-indigo-400 to-blue-400" },
    ],
  },
  {
    key: "corporate",
    title: "Corporate & Office Stationery",
    subtitle: "Polished materials for law firms, real estate, and corporate offices.",
    size: "medium",
    items: [
      { key: "letterhead", name: "Letterhead", href: `${BASE}/letterhead`, gradient: "from-slate-400 to-gray-400" },
      { key: "notepads", name: "Notepads", href: `${BASE}/notepads`, gradient: "from-amber-400 to-yellow-400" },
      { key: "stamps", name: "Custom Stamps", href: `${BASE}/stamps`, gradient: "from-red-400 to-rose-400" },
      { key: "calendars", name: "Calendars", href: `${BASE}/calendars`, gradient: "from-teal-400 to-cyan-400" },
      { key: "certificates", name: "Certificates", href: `${BASE}/certificates`, gradient: "from-orange-400 to-amber-400" },
      { key: "envelopes", name: "Envelopes", href: `${BASE}/envelopes`, gradient: "from-blue-400 to-indigo-400" },
    ],
  },
  {
    key: "retail",
    title: "Retail, Restaurant & Packaging",
    subtitle: "Print materials for storefronts, restaurants, and e-commerce brands.",
    size: "medium",
    items: [
      { key: "menus", name: "Menus", href: `${BASE}/menus`, gradient: "from-orange-400 to-red-400" },
      { key: "table-tents", name: "Table Tents", href: `${BASE}/table-tents`, gradient: "from-pink-400 to-fuchsia-400" },
      { key: "shelf-displays", name: "Shelf Displays", href: `${BASE}/shelf-displays`, gradient: "from-emerald-400 to-green-400" },
      { key: "rack-cards", name: "Rack Cards", href: `${BASE}/rack-cards`, gradient: "from-cyan-400 to-sky-400" },
      { key: "door-hangers", name: "Door Hangers", href: `${BASE}/door-hangers`, gradient: "from-violet-400 to-purple-400" },
      { key: "tags", name: "Hang Tags", href: `${BASE}/tags`, gradient: "from-amber-400 to-orange-400" },
    ],
  },
  {
    key: "forms",
    title: "Forms, Operations & Events",
    subtitle: "Practical print for logistics, contractors, and event organizers.",
    size: "medium",
    items: [
      { key: "ncr-forms", name: "NCR Forms", href: `${BASE}/ncr-forms`, gradient: "from-slate-400 to-zinc-400" },
      { key: "tickets-coupons", name: "Tickets & Coupons", href: `${BASE}/tickets-coupons`, gradient: "from-rose-400 to-pink-400" },
      { key: "greeting-invitation-cards", name: "Greeting & Invitation Cards", href: `${BASE}/greeting-invitation-cards`, gradient: "from-fuchsia-400 to-pink-400" },
      { key: "bookmarks", name: "Bookmarks", href: `${BASE}/bookmarks`, gradient: "from-indigo-400 to-violet-400" },
      { key: "loyalty-cards", name: "Loyalty & Punch Cards", href: `${BASE}/loyalty-cards`, gradient: "from-emerald-400 to-teal-400" },
      { key: "document-printing", name: "Document Printing", href: `${BASE}/document-printing`, gradient: "from-gray-400 to-slate-400" },
    ],
  },
];

function ProductCard({ item, price, size, imageUrl }) {
  const isLarge = size === "large";
  return (
    <Link
      href={item.href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--color-gray-200)] bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
    >
      <div className={`relative overflow-hidden ${isLarge ? "aspect-[3/2]" : "aspect-[4/3]"}`}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={item.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 25vw"
          />
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

export default function MarketingCategoryClient({ marketingPrices = {}, marketingImages = {} }) {
  const { t } = useTranslation();

  return (
    <main className="bg-gradient-to-b from-amber-50 to-white pb-20 pt-10 text-[var(--color-gray-900)]">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 2xl:px-4">
        <Breadcrumbs
          items={[
            { label: t("product.shop"), href: "/shop" },
            { label: "Marketing & Business Print" },
          ]}
        />

        {/* Hero */}
        <header className="mt-6">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Marketing & Business Print
          </h1>
          <p className="mt-2 max-w-2xl text-sm sm:text-base text-[var(--color-gray-500)]">
            Professional quality printing for Toronto businesses. From everyday essentials to custom corporate stationery.
          </p>
        </header>

        {/* Sections */}
        {SECTIONS.map((section) => {
          const visibleItems = section.items.filter((item) => item.key in marketingPrices);
          if (visibleItems.length === 0) return null;

          return (
            <section key={section.key} className="mt-12">
              <h2 className="text-xl font-semibold tracking-tight">{section.title}</h2>
              <p className="mt-1 text-sm text-[var(--color-gray-500)]">{section.subtitle}</p>
              <div className={`mt-4 grid gap-4 ${
                section.size === "large"
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                  : "grid-cols-2 sm:grid-cols-3"
              }`}>
                {visibleItems.map((item) => (
                  <ProductCard
                    key={item.key}
                    item={item}
                    price={marketingPrices[item.key] || 0}
                    size={section.size}
                    imageUrl={marketingImages[item.key]}
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

        {/* Section 5 — Value Props */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl shadow-[var(--shadow-card)] bg-white p-5">
            <h3 className="text-sm font-semibold text-[var(--color-gray-600)]">
              Local Toronto Production
            </h3>
            <p className="mt-3 text-sm text-[var(--color-gray-700)]">
              Made in Scarborough. Same-day and next-day pickup available.
            </p>
          </div>
          <div className="rounded-2xl shadow-[var(--shadow-card)] bg-white p-5">
            <h3 className="text-sm font-semibold text-[var(--color-gray-600)]">
              Premium Paper Stocks
            </h3>
            <p className="mt-3 text-sm text-[var(--color-gray-700)]">
              14pt card stock, 100lb gloss, uncoated, linen, and specialty finishes.
            </p>
          </div>
          <div className="rounded-2xl shadow-[var(--shadow-card)] bg-white p-5">
            <h3 className="text-sm font-semibold text-[var(--color-gray-600)]">
              B2B & Wholesale Support
            </h3>
            <p className="mt-3 text-sm text-[var(--color-gray-700)]">
              Dedicated support for repeat orders, bulk pricing, and corporate accounts.
            </p>
            <Link
              href="/quote"
              className="mt-3 inline-block rounded-full bg-[var(--color-brand)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--color-brand-dark)]"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
