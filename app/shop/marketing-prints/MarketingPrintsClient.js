"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Breadcrumbs from "@/components/Breadcrumbs";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
    cents / 100
  );

// Product groups with display order
const GROUPS = [
  {
    key: "popular",
    slugs: ["flyers", "postcards", "brochures", "posters"],
  },
  {
    key: "folded",
    slugs: ["booklets", "menus", "greeting-cards", "table-display-cards"],
  },
  {
    key: "cards",
    slugs: ["invitation-cards", "certificates", "coupons", "bookmarks", "tickets"],
  },
  {
    key: "business",
    slugs: [
      "letterhead", "envelopes", "ncr-invoices", "order-forms-single",
      "release-forms", "notepads", "presentation-folders",
    ],
  },
  {
    key: "marketing",
    slugs: [
      "rack-cards", "door-hangers", "tags-hang-tags", "calendars",
      "product-inserts", "box-sleeves",
    ],
  },
];

function ProductCard({ product, t }) {
  const href = `/shop/${product.category}/${product.slug}`;
  const image = product.images?.[0];
  const sizeCount = product.optionsConfig?.sizes?.length || 0;

  return (
    <Link
      href={href}
      className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-gray-100">
        {image?.url ? (
          <Image
            src={image.url}
            alt={image.alt || product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <div className="text-center px-3">
              <svg
                className="mx-auto h-8 w-8 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
              <p className="mt-1 text-xs font-medium text-gray-400">
                {product.name}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4">
        <h3 className="text-sm font-semibold text-gray-900 leading-snug">
          {product.name}
        </h3>

        {/* Description snippet */}
        {product.description && (
          <p className="mt-1 text-[11px] text-gray-500 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Size count */}
        {sizeCount > 0 && (
          <p className="mt-1.5 text-[11px] text-gray-400">
            {sizeCount} {t("mp.landing.options")}
          </p>
        )}

        {/* Price */}
        <p className="mt-2 text-sm font-bold text-gray-900">
          {t("product.from", { price: formatCad(product.basePrice) })}
        </p>

        {/* CTA */}
        <span className="mt-2 inline-block rounded-full bg-gray-900 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-white transition-colors group-hover:bg-black">
          {t("mp.landing.viewOrder")}
        </span>
      </div>
    </Link>
  );
}

export default function MarketingPrintsClient({ products, bcCount, stampsCount }) {
  const { t } = useTranslation();

  const grouped = useMemo(() => {
    const slugMap = new Map(products.map((p) => [p.slug, p]));
    const placed = new Set();
    const sections = [];

    for (const g of GROUPS) {
      const items = [];
      for (const slug of g.slugs) {
        const p = slugMap.get(slug);
        if (p) {
          items.push(p);
          placed.add(slug);
        }
      }
      if (items.length > 0) {
        sections.push({ key: g.key, items });
      }
    }

    // Catch any products not in a defined group
    const ungrouped = products.filter((p) => !placed.has(p.slug));
    if (ungrouped.length > 0) {
      sections.push({ key: "other", items: ungrouped });
    }

    return sections;
  }, [products]);

  return (
    <main className="bg-gray-50 pb-20 pt-10 text-gray-900">
      <div className="mx-auto max-w-6xl px-6">
        <Breadcrumbs
          items={[
            { label: t("product.shop"), href: "/shop" },
            { label: t("mp.landing.title") },
          ]}
        />

        {/* Header */}
        <header className="mt-6">
          <h1 className="text-4xl font-semibold tracking-tight">
            {t("mp.landing.title")}
          </h1>
          <p className="mt-2 max-w-2xl text-base text-gray-600">
            {t("mp.landing.subtitle")}
          </p>
        </header>

        {/* Featured Sub-Landing Links (Business Cards & Stamps) */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link
            href="/shop/business-cards"
            className="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-white">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {t("bc.landing.title")}
              </h3>
              <p className="mt-0.5 text-xs text-gray-500">
                {bcCount} {t("mp.landing.finishes")}
              </p>
            </div>
            <svg className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>

          <Link
            href="/shop/marketing-prints/stamps"
            className="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-white">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {t("stamps.landing.title")}
              </h3>
              <p className="mt-0.5 text-xs text-gray-500">
                {stampsCount} {t("mp.landing.models")}
              </p>
            </div>
            <svg className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        </div>

        {/* Product Groups */}
        {grouped.map((section) => (
          <section key={section.key} className="mt-10">
            <h2 className="text-lg font-semibold text-gray-800">
              {t(`mp.landing.group.${section.key}`)}
            </h2>
            <div className="mt-4 grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {section.items.map((product) => (
                <ProductCard key={product.id} product={product} t={t} />
              ))}
            </div>
          </section>
        ))}

        {/* Info Footer */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-600">
              {t("mp.landing.qualityTitle")}
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
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

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-600">
              {t("mp.landing.turnaroundTitle")}
            </h3>
            <p className="mt-3 text-sm text-gray-700">
              {t("mp.landing.turnaroundText")}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              {t("mp.landing.turnaroundDetail")}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-600">
              {t("mp.landing.customTitle")}
            </h3>
            <p className="mt-3 text-sm text-gray-700">
              {t("mp.landing.customText")}
            </p>
            <Link
              href="/quote"
              className="mt-3 inline-block rounded-full bg-gray-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-white hover:bg-black"
            >
              {t("home.cta.quote")}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
