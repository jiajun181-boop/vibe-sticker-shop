"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { isSvgImage } from "@/lib/product-image";
import Breadcrumbs from "@/components/Breadcrumbs";
import CategoryHero from "@/components/category/CategoryHero";
import CategoryFaq from "@/components/category/CategoryFaq";

const BASE = "/shop/marketing-business-print";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

/* ── Item slug → i18n key map ── */
const ITEM_I18N = {
  "business-cards": "mc.item.businessCards",
  "flyers": "mc.item.flyers",
  "brochures": "mc.item.brochures",
  "postcards": "mc.item.postcards",
  "posters": "mc.item.posters",
  "booklets": "mc.item.booklets",
  "letterhead": "mc.item.letterhead",
  "notepads": "mc.item.notepads",
  "stamps": "mc.item.stamps",
  "calendars": "mc.item.calendars",
  "certificates": "mc.item.certificates",
  "envelopes": "mc.item.envelopes",
  "menus": "mc.item.menus",
  "table-tents": "mc.item.tableTents",
  "shelf-displays": "mc.item.shelfDisplays",
  "rack-cards": "mc.item.rackCards",
  "door-hangers": "mc.item.doorHangers",
  "tags": "mc.item.tags",
  "ncr-forms": "mc.item.ncrForms",
  "tickets-coupons": "mc.item.ticketsCoupons",
  "greeting-invitation-cards": "mc.item.greetingCards",
  "bookmarks": "mc.item.bookmarks",
  "loyalty-cards": "mc.item.loyaltyCards",
  "document-printing": "mc.item.documentPrinting",
};

/* ── Section definitions ── */
const SECTIONS = [
  {
    key: "essentials",
    titleKey: "mc.section.essentials.title",
    subtitleKey: "mc.section.essentials.subtitle",
    size: "large",
    items: [
      { key: "business-cards", href: `${BASE}/business-cards`, gradient: "from-amber-400 to-orange-400" },
      { key: "flyers", href: `${BASE}/flyers`, gradient: "from-rose-400 to-pink-400" },
      { key: "brochures", href: `${BASE}/brochures`, gradient: "from-violet-400 to-fuchsia-400" },
      { key: "postcards", href: `${BASE}/postcards`, gradient: "from-sky-400 to-cyan-400" },
      { key: "posters", href: `${BASE}/posters`, gradient: "from-emerald-400 to-teal-400" },
      { key: "booklets", href: `${BASE}/booklets`, gradient: "from-indigo-400 to-blue-400" },
    ],
  },
  {
    key: "corporate",
    titleKey: "mc.section.corporate.title",
    subtitleKey: "mc.section.corporate.subtitle",
    size: "medium",
    items: [
      { key: "letterhead", href: `${BASE}/letterhead`, gradient: "from-slate-400 to-gray-400" },
      { key: "notepads", href: `${BASE}/notepads`, gradient: "from-amber-400 to-yellow-400" },
      { key: "stamps", href: `${BASE}/stamps`, gradient: "from-red-400 to-rose-400" },
      { key: "calendars", href: `${BASE}/calendars`, gradient: "from-teal-400 to-cyan-400" },
      { key: "certificates", href: `${BASE}/certificates`, gradient: "from-orange-400 to-amber-400" },
      { key: "magnets-business-card", href: `${BASE}/magnets-business-card`, gradient: "from-blue-400 to-indigo-400" },
    ],
  },
  {
    key: "retail",
    titleKey: "mc.section.retail.title",
    subtitleKey: "mc.section.retail.subtitle",
    size: "medium",
    items: [
      { key: "menus", href: `${BASE}/menus`, gradient: "from-orange-400 to-red-400" },
      { key: "table-tents", href: `${BASE}/table-tents`, gradient: "from-pink-400 to-fuchsia-400" },
      { key: "shelf-displays", href: `${BASE}/shelf-displays`, gradient: "from-emerald-400 to-green-400" },
      { key: "rack-cards", href: `${BASE}/rack-cards`, gradient: "from-cyan-400 to-sky-400" },
      { key: "door-hangers", href: `${BASE}/door-hangers`, gradient: "from-violet-400 to-purple-400" },
      { key: "tags", href: `${BASE}/tags`, gradient: "from-amber-400 to-orange-400" },
      { key: "tabletop-displays", href: `${BASE}/tabletop-displays`, gradient: "from-teal-400 to-emerald-400" },
      { key: "inserts-packaging", href: `${BASE}/inserts-packaging`, gradient: "from-pink-400 to-rose-400" },
    ],
  },
  {
    key: "forms",
    titleKey: "mc.section.forms.title",
    subtitleKey: "mc.section.forms.subtitle",
    size: "medium",
    items: [
      { key: "ncr-forms", href: `${BASE}/ncr-forms`, gradient: "from-slate-400 to-zinc-400" },
      { key: "tickets-coupons", href: `${BASE}/tickets-coupons`, gradient: "from-rose-400 to-pink-400" },
      { key: "greeting-invitation-cards", href: `${BASE}/greeting-invitation-cards`, gradient: "from-fuchsia-400 to-pink-400" },
      { key: "bookmarks", href: `${BASE}/bookmarks`, gradient: "from-indigo-400 to-violet-400" },
      { key: "loyalty-cards", href: `${BASE}/loyalty-cards`, gradient: "from-emerald-400 to-teal-400" },
      { key: "document-printing", href: `${BASE}/document-printing`, gradient: "from-gray-400 to-slate-400" },
      { key: "presentation-folders", href: `${BASE}/presentation-folders`, gradient: "from-slate-400 to-blue-400" },
    ],
  },
];

function ProductCard({ item, price, imageUrl, hoverImageUrl, t }) {
  const [hovered, setHovered] = useState(false);
  const showUrl = hovered && hoverImageUrl ? hoverImageUrl : imageUrl;
  const isSvg = showUrl && isSvgImage(showUrl);
  const name = t(ITEM_I18N[item.key] || item.key);
  return (
    <Link
      href={item.href}
      className="group flex flex-col overflow-hidden rounded-xl border border-[var(--color-gray-200)] bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--color-gray-100)]">
        {showUrl ? (
          isSvg ? (
            <img src={showUrl} alt={name} loading="lazy" className="h-full w-full object-cover transition-all duration-300 group-hover:scale-105" />
          ) : (
            <Image
              src={showUrl}
              alt={name}
              fill
              className="object-cover transition-all duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 25vw"
            />
          )
        ) : (
          <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${item.gradient}`}>
            <p className="px-4 text-center text-sm font-bold text-[#fff] drop-shadow-md">
              {name}
            </p>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-2.5 sm:p-3">
        <h3 className="text-sm font-semibold text-[var(--color-gray-900)] leading-tight">
          {name}
        </h3>
        <div className="mt-1.5 flex items-center justify-between">
          {price > 0 ? (
            <span className="text-xs font-bold text-[var(--color-gray-900)]">
              {t("shop.fromLabel")} {formatCad(price)}
            </span>
          ) : (
            <span className="text-[11px] text-[var(--color-gray-400)]">{t("shop.getQuote")}</span>
          )}
          <span className="inline-flex items-center gap-0.5 rounded-full bg-[var(--color-brand)] px-2.5 py-1 text-[10px] font-semibold text-[#fff] transition-colors group-hover:bg-[var(--color-brand-dark)]">
            {t("shop.configure")}
            <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function MarketingCategoryClient({ marketingPrices = {}, marketingImages = {}, marketingImages2 = {} }) {
  const { t } = useTranslation();

  return (
    <main className="bg-gradient-to-b from-amber-50 to-white pb-20 pt-10 text-[var(--color-gray-900)]">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 2xl:px-4">
        <Breadcrumbs
          items={[
            { label: t("product.shop"), href: "/shop" },
            { label: t("mc.breadcrumb") },
          ]}
        />

        <div className="mt-6">
          <CategoryHero category="marketing-business-print" title={t("mc.title")} icon="📄" />
        </div>

        {/* Sections */}
        {SECTIONS.map((section) => {
          const visibleItems = section.items.filter((item) => item.key in marketingPrices);
          if (visibleItems.length === 0) return null;

          return (
            <section key={section.key} className="mt-8">
              <h2 className="text-base font-semibold tracking-tight">{t(section.titleKey)}</h2>
              <p className="mt-0.5 text-xs text-[var(--color-gray-500)]">{t(section.subtitleKey)}</p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {visibleItems.map((item) => (
                  <ProductCard
                    key={item.key}
                    item={item}
                    price={marketingPrices[item.key] || 0}
                    imageUrl={marketingImages[item.key]}
                    hoverImageUrl={marketingImages2[item.key]}
                    t={t}
                  />
                ))}
              </div>
            </section>
          );
        })}

        <CategoryFaq category="marketing-business-print" />

        {/* Back to shop */}
        <div className="mt-12 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-gray-300)] px-5 py-2.5 text-xs font-semibold text-[var(--color-gray-600)] transition-colors hover:border-[var(--color-gray-900)] hover:text-[var(--color-gray-900)]"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            {t("shop.backToCategories")}
          </Link>
        </div>

        {/* Section 5 — Value Props */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl shadow-[var(--shadow-card)] bg-white p-5">
            <h3 className="text-sm font-semibold text-[var(--color-gray-600)]">
              {t("mc.vp1.title")}
            </h3>
            <p className="mt-3 text-sm text-[var(--color-gray-700)]">
              {t("mc.vp1.desc")}
            </p>
          </div>
          <div className="rounded-2xl shadow-[var(--shadow-card)] bg-white p-5">
            <h3 className="text-sm font-semibold text-[var(--color-gray-600)]">
              {t("mc.vp2.title")}
            </h3>
            <p className="mt-3 text-sm text-[var(--color-gray-700)]">
              {t("mc.vp2.desc")}
            </p>
          </div>
          <div className="rounded-2xl shadow-[var(--shadow-card)] bg-white p-5">
            <h3 className="text-sm font-semibold text-[var(--color-gray-600)]">
              {t("mc.vp3.title")}
            </h3>
            <p className="mt-3 text-sm text-[var(--color-gray-700)]">
              {t("mc.vp3.desc")}
            </p>
            <Link
              href="/quote"
              className="mt-3 inline-block rounded-full bg-[var(--color-brand)] px-4 py-2 text-xs font-semibold text-[#fff] hover:bg-[var(--color-brand-dark)]"
            >
              {t("shop.contactUs")}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
