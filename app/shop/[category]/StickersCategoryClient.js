"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { getTurnaround, turnaroundI18nKey, turnaroundColor } from "@/lib/turnaroundConfig";
import { getProductImage, isSvgImage } from "@/lib/product-image";
import Breadcrumbs from "@/components/Breadcrumbs";
import CategoryHero from "@/components/category/CategoryHero";
import CategoryFaq from "@/components/category/CategoryFaq";
import QuickAddButton from "@/components/product/QuickAddButton";

const BASE = "/shop/stickers-labels-decals";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

/* ── Core sticker products shown on main page (whitelist, in display order) ── */
const CORE_STICKER_SLUGS = [
  "die-cut-stickers",
  "kiss-cut-stickers",
  "sticker-sheets",
  "kiss-cut-sticker-sheets",
  "roll-labels",
  "vinyl-lettering",
];
const CORE_SET = new Set(CORE_STICKER_SLUGS);
const CORE_ORDER = new Map(CORE_STICKER_SLUGS.map((s, i) => [s, i]));

/* ── Slug → filter tag mapping (core products only) ── */
const SLUG_TAG = {
  "die-cut-stickers": "stickers",
  "kiss-cut-stickers": "stickers",
  "sticker-sheets": "sheets",
  "kiss-cut-sticker-sheets": "sheets",
  "roll-labels": "roll-labels",
  "vinyl-lettering": "lettering",
};

const FILTER_TABS = [
  { id: "all", key: "stickerCat.filter.all" },
  { id: "stickers", key: "stickerCat.filter.stickers" },
  { id: "sheets", key: "stickerCat.filter.sheets" },
  { id: "roll-labels", key: "stickerCat.filter.rollLabels" },
  { id: "lettering", key: "stickerCat.filter.lettering" },
];

/* ── Related categories ── */
const RELATED = [
  { titleKey: "stickerCat.related.safety", title: "Safety & Warning Decals", titleZh: "安全警示贴纸", desc: "Fire, PPE, hazard, lockout/tagout", descZh: "消防、PPE、危险、锁定/标签", href: `${BASE}/safety-warning-decals` },
  { titleKey: "stickerCat.related.industrial", title: "Industrial Labels", titleZh: "工业标签", desc: "Pipe markers, chemical, electrical", descZh: "管道标识、化学品、电气", href: `${BASE}/industrial-labels` },
  { titleKey: "stickerCat.related.facility", title: "Facility & Asset Labels", titleZh: "设施资产标签", desc: "Asset tags, cable labels, bin labels", descZh: "资产标签、线缆标签、箱标", href: `${BASE}/facility-asset-labels` },
];

/* ── Product Card ── */
function ProductCard({ product, t }) {
  const href = `/shop/${product.category}/${product.slug}`;
  const imageSrc = getProductImage(product, product.category);
  const isSvg = imageSrc && isSvgImage(imageSrc);
  const price = product.fromPrice || product.basePrice || 0;
  const turnaround = getTurnaround(product);
  const tag = SLUG_TAG[product.slug];

  return (
    <article className="group overflow-hidden rounded-xl shadow-[var(--shadow-card)] bg-white transition-all duration-200 hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-1">
      <Link href={href} className="block">
        <div className="relative aspect-[4/3] bg-[var(--color-gray-100)] overflow-hidden">
          {imageSrc ? (
            isSvg ? (
              <img src={imageSrc} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <Image
                src={imageSrc}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
              />
            )
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-200 to-fuchsia-100">
              <p className="px-4 text-center text-sm font-semibold text-gray-700 drop-shadow-sm">
                {product.name}
              </p>
            </div>
          )}

          {/* Turnaround badge — constrained inside image area */}
          {turnaround && (
            <span className={`absolute top-1.5 left-1.5 max-w-[calc(100%-12px)] truncate rounded-full px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold text-white ${turnaroundColor(turnaround)}`}>
              {t(turnaroundI18nKey(turnaround))}
            </span>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link href={href}>
          <h3 className="text-sm font-semibold text-[var(--color-gray-900)] group-hover:text-[var(--color-brand)] transition-colors line-clamp-2">
            {product.name}
          </h3>
          {price > 0 ? (
            <p className="mt-1 text-sm font-bold text-[var(--color-brand)]">
              {t("product.from", { price: formatCad(price) })}
            </p>
          ) : (
            <p className="mt-1 text-xs text-[var(--color-gray-400)]">
              {t("configurator.requestQuote")}
            </p>
          )}
          {product.description && (
            <p className="mt-1 text-[11px] text-[var(--color-gray-500)] line-clamp-1 sm:line-clamp-2">
              {product.description}
            </p>
          )}
        </Link>
        <div className="mt-3 flex items-center justify-between">
          <span /> {/* price moved above */}
          <Link
            href={href}
            className="inline-flex items-center gap-1 rounded-full bg-[var(--color-brand)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white hover:bg-[var(--color-brand-dark)] transition-colors"
          >
            {t("mp.landing.viewOrder")}
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}

/* ── Why Choose Us icons ── */
function WaterproofIcon() {
  return (
    <svg className="h-5 w-5 text-[var(--color-brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg className="h-5 w-5 text-[var(--color-brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  );
}

function ShapeIcon() {
  return (
    <svg className="h-5 w-5 text-[var(--color-brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.848 8.25l1.536.887M7.848 8.25a3 3 0 11-5.196-3 3 3 0 015.196 3zm1.536.887a2.165 2.165 0 011.083 1.839c.005.351.054.695.14 1.024M9.384 9.137l2.077 1.199M7.848 15.75l1.536-.887m-1.536.887a3 3 0 01-5.196 3 3 3 0 015.196-3zm1.536-.887a2.165 2.165 0 001.083-1.838c.005-.352.054-.695.14-1.025m-1.223 2.863l2.077-1.199m0-3.328a4.323 4.323 0 012.068-1.379l5.325-1.628a4.5 4.5 0 012.48-.044l.803.215-7.794 4.5m-2.882-1.664A4.331 4.331 0 0010.607 12m3.736 0l7.794 4.5-.802.215a4.5 4.5 0 01-2.48-.043l-5.326-1.629a4.324 4.324 0 01-2.068-1.379M14.343 12l-2.882 1.664" />
    </svg>
  );
}

/* ── Main Component ── */
export default function StickersCategoryClient({ products = [] }) {
  const { t, locale } = useTranslation();
  const [activeFilter, setActiveFilter] = useState("all");

  // Whitelist: only show core sticker products, sorted by display order
  const taggedProducts = useMemo(() => {
    return products
      .filter((p) => p.isActive !== false && CORE_SET.has(p.slug))
      .map((p) => ({ ...p, filterTag: SLUG_TAG[p.slug] || "stickers" }))
      .sort((a, b) => (CORE_ORDER.get(a.slug) ?? 99) - (CORE_ORDER.get(b.slug) ?? 99));
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (activeFilter === "all") return taggedProducts;
    return taggedProducts.filter((p) => p.filterTag === activeFilter);
  }, [taggedProducts, activeFilter]);

  // Count per filter
  const filterCounts = useMemo(() => {
    const counts = { all: taggedProducts.length };
    for (const tab of FILTER_TABS) {
      if (tab.id !== "all") {
        counts[tab.id] = taggedProducts.filter((p) => p.filterTag === tab.id).length;
      }
    }
    return counts;
  }, [taggedProducts]);

  return (
    <main className="bg-[var(--color-gray-50)] pb-20 pt-10 text-[var(--color-gray-900)]">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 2xl:px-4">
        <Breadcrumbs
          items={[
            { label: t("product.shop"), href: "/shop" },
            { label: t("footer.stickersLabels") },
          ]}
        />

        {/* Hero */}
        <div className="mt-6">
          <CategoryHero
            category="stickers-labels-decals"
            title="Custom Stickers & Labels"
            icon="🏷️"
          />
        </div>

        {/* Filter tabs — sticky on scroll */}
        <div className="sticky top-[calc(var(--promo-offset,0px)+var(--nav-offset,72px))] z-10 -mx-4 sm:-mx-6 mt-6 border-b border-[var(--color-gray-200)] bg-[var(--color-gray-50)]/95 px-4 sm:px-6 py-3 backdrop-blur-sm">
        <div className="flex flex-wrap gap-2">
          {FILTER_TABS.map((tab) => {
            const count = filterCounts[tab.id] || 0;
            if (tab.id !== "all" && count === 0) return null;
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[var(--color-brand)] text-white shadow-sm"
                    : "bg-white text-[var(--color-gray-600)] border border-[var(--color-gray-200)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
                }`}
              >
                {t(tab.key)}
                <span className={`ml-1.5 text-xs ${isActive ? "text-white/70" : "text-[var(--color-gray-400)]"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        </div>

        {/* Product grid */}
        <div className="mt-6 grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} t={t} />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="mt-12 text-center">
            <p className="text-sm text-[var(--color-gray-400)]">{t("shop.noProducts")}</p>
          </div>
        )}

        {/* Related categories */}
        <section className="mt-12">
          <h2 className="text-xl font-semibold tracking-tight">{t("stickerCat.related")}</h2>
          <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-3">
            {RELATED.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className="group flex items-center gap-4 rounded-xl border border-[var(--color-gray-200)] bg-white p-5 transition-all hover:border-[var(--color-brand)] hover:shadow-md"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-[var(--color-gray-900)] group-hover:text-[var(--color-brand)]">
                    {locale === "zh" ? cat.titleZh : cat.title}
                  </h3>
                  <p className="mt-1 text-xs text-[var(--color-gray-500)] truncate">
                    {locale === "zh" ? cat.descZh : cat.desc}
                  </p>
                </div>
                <svg className="h-4 w-4 shrink-0 text-[var(--color-gray-400)] group-hover:text-[var(--color-brand)] transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            ))}
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="mt-12">
          <h2 className="text-xl font-semibold tracking-tight">{t("stickerCat.whyChooseUs")}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl shadow-[var(--shadow-card)] bg-white p-5">
              <div className="flex items-center gap-2 mb-3">
                <WaterproofIcon />
                <h3 className="text-sm font-semibold text-[var(--color-gray-600)]">{t("stickerCat.waterproof")}</h3>
              </div>
              <p className="text-sm text-[var(--color-gray-700)]">{t("stickerCat.waterproofDesc")}</p>
            </div>
            <div className="rounded-2xl shadow-[var(--shadow-card)] bg-white p-5">
              <div className="flex items-center gap-2 mb-3">
                <BoltIcon />
                <h3 className="text-sm font-semibold text-[var(--color-gray-600)]">{t("stickerCat.fastTurnaround")}</h3>
              </div>
              <p className="text-sm text-[var(--color-gray-700)]">{t("stickerCat.fastTurnaroundDesc")}</p>
            </div>
            <div className="rounded-2xl shadow-[var(--shadow-card)] bg-white p-5">
              <div className="flex items-center gap-2 mb-3">
                <ShapeIcon />
                <h3 className="text-sm font-semibold text-[var(--color-gray-600)]">{t("stickerCat.anyShape")}</h3>
              </div>
              <p className="text-sm text-[var(--color-gray-700)]">{t("stickerCat.anyShapeDesc")}</p>
              <Link
                href="/quote"
                className="mt-3 inline-block rounded-full bg-[var(--color-brand)] px-4 py-2 text-xs font-semibold text-[#fff] hover:bg-[var(--color-brand-dark)]"
              >
                {t("configurator.requestQuote")}
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <CategoryFaq category="stickers-labels-decals" />

        {/* Back to shop */}
        <div className="mt-12 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-gray-300)] px-5 py-2.5 text-xs font-semibold text-[var(--color-gray-600)] transition-colors hover:border-[var(--color-gray-900)] hover:text-[var(--color-gray-900)]"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            {t("product.allCategories")}
          </Link>
        </div>
      </div>
    </main>
  );
}
