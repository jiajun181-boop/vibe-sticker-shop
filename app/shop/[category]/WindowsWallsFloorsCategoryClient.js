"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useMemo } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { getTurnaround, turnaroundI18nKey, turnaroundColor } from "@/lib/turnaroundConfig";
import { getProductImage, isSvgImage } from "@/lib/product-image";
import Breadcrumbs from "@/components/Breadcrumbs";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
    cents / 100
  );

const FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "window", label: "Window Films", slugs: ["one-way-vision", "frosted-window-film", "static-cling", "transparent-color-film", "blockout-vinyl", "opaque-window-graphics", "glass-waistline"] },
  { key: "wall", label: "Wall", slugs: ["wall-graphics"] },
  { key: "floor", label: "Floor", slugs: ["floor-graphics"] },
];

const CATEGORY = "windows-walls-floors";

function WwfProductCard({ product }) {
  const { t } = useTranslation();
  const imageSrc = getProductImage(product, CATEGORY);
  const price = product.fromPrice || product.basePrice;
  const tk = getTurnaround(product);
  const href = `/shop/${CATEGORY}/${product.slug}`;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--color-gray-200)] bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <Link href={href} className="block">
        <div className="relative aspect-[4/3] overflow-hidden">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={product.images?.[0]?.alt || product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              unoptimized={isSvgImage(imageSrc)}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-cyan-100">
              <span className="text-4xl">{"\uD83E\uDE9F"}</span>
              <p className="mt-2 px-3 text-center text-sm font-semibold text-gray-700">
                {product.name}
              </p>
            </div>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <span className={`inline-block w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold mb-1.5 ${turnaroundColor(tk)}`}>
          {t(turnaroundI18nKey(tk))}
        </span>
        <h3 className="text-sm font-semibold text-[var(--color-gray-900)] leading-snug">
          {product.name}
        </h3>
        {product.description && (
          <p className="mt-1 text-[11px] text-[var(--color-gray-500)] line-clamp-2">
            {product.description}
          </p>
        )}
        <div className="mt-auto pt-3">
          {price > 0 && (
            <p className="text-sm font-bold text-[var(--color-gray-900)] mb-2">
              From {formatCad(price)}
            </p>
          )}
          <Link
            href={href}
            className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors bg-[var(--color-gray-900)] text-white hover:bg-black"
          >
            Configure
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function WindowsWallsFloorsCategoryClient({
  category,
  categoryTitle,
  products,
  totalCount,
}) {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredProducts = useMemo(() => {
    if (activeFilter === "all") return products;
    const tab = FILTER_TABS.find((t) => t.key === activeFilter);
    if (!tab || !tab.slugs) return products;
    const slugSet = new Set(tab.slugs);
    return products.filter((p) => slugSet.has(p.slug));
  }, [products, activeFilter]);

  return (
    <main className="bg-[var(--color-gray-50)] pb-20 pt-10 text-[var(--color-gray-900)]">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 2xl:px-4">
        <Breadcrumbs
          items={[
            { label: t("product.shop"), href: "/shop" },
            { label: categoryTitle },
          ]}
        />

        {/* Header */}
        <header className="mt-6">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            {categoryTitle}
          </h1>
          <p className="mt-2 text-sm text-[var(--color-gray-500)] max-w-2xl">
            Custom window films, wall graphics, and floor decals. Professional installation-ready vinyl with full-colour printing.
          </p>
        </header>

        {/* Filter tabs */}
        <div className="mt-4 flex gap-1.5 overflow-x-auto scrollbar-hide pb-2">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition-colors ${
                activeFilter === tab.key
                  ? "bg-[var(--color-gray-900)] text-white"
                  : "bg-white border border-[var(--color-gray-200)] text-[var(--color-gray-600)] hover:bg-[var(--color-gray-100)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div className="mt-6 grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <WwfProductCard key={product.id} product={product} />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <p className="mt-12 text-center text-sm text-[var(--color-gray-500)]">
            No products available yet.
          </p>
        )}

        {/* Back to shop */}
        <div className="mt-12 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-gray-300)] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-gray-600)] transition-colors hover:border-[var(--color-gray-900)] hover:text-[var(--color-gray-900)]"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            All Categories
          </Link>
        </div>

        {/* Info Footer */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-600)]">
              Professional Installation
            </h3>
            <p className="mt-3 text-sm text-[var(--color-gray-700)]">
              All films ship ready for professional or DIY installation.
              We provide detailed application instructions with every order
              and offer on-site installation in the GTA.
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-600)]">
              Indoor &amp; Outdoor
            </h3>
            <p className="mt-3 text-sm text-[var(--color-gray-700)]">
              Our window films and wall graphics are rated for both indoor
              and outdoor use. UV-protective laminates extend lifespan to
              3&ndash;5 years in direct sunlight.
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-600)]">
              Same Day Available
            </h3>
            <p className="mt-3 text-sm text-[var(--color-gray-700)]">
              Need graphics fast? Same day production available for standard
              sizes. Order before 12pm for same day GTA pickup or rush shipping.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
