"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Breadcrumbs from "@/components/Breadcrumbs";
import { isSvgImage } from "@/lib/product-image";

const BASE = "/shop/stickers-labels-decals";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

/* ── Section 1: Custom Stickers (Individual) ── */
const INDIVIDUAL_CARDS = [
  {
    priceKey: "die-cut",
    title: "Die-Cut Stickers",
    description: "Cut to the exact shape of your design. Premium, standalone look.",
    href: `${BASE}/die-cut-stickers`,
    gradient: "from-violet-400 to-fuchsia-400",
    fallbackPrice: "From $25 / 25 pcs",
    cta: "Configure",
  },
  {
    priceKey: "kiss-cut",
    title: "Kiss-Cut Singles",
    description: "Easy-peel backing stays intact. Great for giveaways and packaging.",
    href: `${BASE}/kiss-cut-singles`,
    gradient: "from-pink-400 to-rose-400",
    fallbackPrice: "From $25 / 25 pcs",
    cta: "Configure",
  },
];

/* ── Section 2: Labels & Sheets (For Packaging) ── */
const PACKAGING_CARDS = [
  {
    priceKey: "sticker-sheets",
    title: "Sticker Sheets",
    description: "Full page of stickers on paper or vinyl. Great for product labels.",
    href: `${BASE}/sticker-pages`,
    gradient: "from-sky-400 to-cyan-400",
    fallbackPrice: "From $74 / 10 sheets",
    cta: "Configure",
  },
  {
    priceKey: "roll-labels",
    title: "Roll Labels",
    description: "High volume on rolls. Min 500+. 5\u20137 day lead time.",
    href: `${BASE}/sticker-rolls`,
    gradient: "from-amber-400 to-orange-400",
    fallbackPrice: "From $159 / 500 pcs",
    cta: "Get a Quote",
  },
];

/* ── Section 3: Specialty Decals & Lettering ── */
const SPECIALTY_CARDS = [
  {
    priceKey: "holographic",
    title: "Holographic Stickers",
    description: "Eye-catching rainbow holographic finish. Die-cut to any shape.",
    href: `${BASE}/die-cut-stickers?material=holographic`,
    gradient: "from-indigo-400 to-purple-400",
    fallbackPrice: "From $93 / 100 pcs",
    cta: "Configure",
  },
  {
    priceKey: "vinyl-lettering",
    title: "Vinyl Lettering",
    description: "Individual cut letters & logos. For windows, walls & vehicles.",
    href: "/order/vinyl-lettering",
    gradient: "from-emerald-400 to-teal-400",
    fallbackPrice: "From $80",
    cta: "Configure",
  },
];

/* ── Section 4: Shop by Material pills ── */
const MATERIAL_PILLS = [
  { id: "white-vinyl", label: "White Vinyl", href: `${BASE}/die-cut-stickers?material=white_vinyl` },
  { id: "matte-vinyl", label: "Matte Vinyl", href: `${BASE}/die-cut-stickers?material=matte_vinyl` },
  { id: "clear-vinyl", label: "Clear Vinyl", href: `${BASE}/die-cut-stickers?material=clear_vinyl` },
  { id: "frosted-vinyl", label: "Frosted Vinyl", href: `${BASE}/die-cut-stickers?material=frosted_vinyl` },
  { id: "3m-reflective", label: "3M Reflective", href: `${BASE}/die-cut-stickers?material=reflective_3m` },
  { id: "gloss-paper", label: "Gloss Paper", href: `${BASE}/die-cut-stickers?material=paper_gloss` },
  { id: "matte-paper", label: "Matte Paper", href: `${BASE}/die-cut-stickers?material=paper_matte` },
  { id: "soft-touch", label: "Soft Touch", href: `${BASE}/die-cut-stickers?material=paper_soft` },
  { id: "foil-stamping", label: "Foil Stamping", href: `${BASE}/die-cut-stickers?material=paper_foil` },
  { id: "clear-cling", label: "Clear Cling", href: `${BASE}/die-cut-stickers?material=static_cling_clear` },
  { id: "frosted-cling", label: "Frosted Cling", href: `${BASE}/die-cut-stickers?material=static_cling_frosted` },
  { id: "white-cling", label: "White Cling", href: `${BASE}/die-cut-stickers?material=static_cling_white` },
];

/* ── Shared card component ── */
function ProductCard({ card, stickerPrices, size = "large", imageUrl }) {
  const isLarge = size === "large";
  const isSvg = imageUrl && isSvgImage(imageUrl);
  return (
    <Link
      href={card.href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--color-gray-200)] bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className={`relative flex items-center justify-center ${imageUrl ? "bg-gray-50" : `bg-gradient-to-br ${card.gradient}`} ${isLarge ? "aspect-[3/2]" : "aspect-[5/2]"}`}>
        {imageUrl ? (
          isSvg ? (
            <img src={imageUrl} alt={card.title} className="h-full w-full object-contain p-4" />
          ) : (
            <Image src={imageUrl} alt={card.title} fill className="object-contain p-4" sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw" />
          )
        ) : (
          <p className="px-6 text-center text-lg font-bold text-white drop-shadow-md">
            {card.title}
          </p>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className={`font-semibold text-[var(--color-gray-900)] ${isLarge ? "text-lg" : "text-base"}`}>
          {card.title}
        </h3>
        <p className="mt-1 text-sm text-[var(--color-gray-500)] leading-relaxed">
          {card.description}
        </p>
        <div className="mt-auto pt-4 flex items-center justify-between">
          <span className="text-sm font-bold text-[var(--color-gray-900)]">
            {stickerPrices[card.priceKey]
              ? `From ${formatCad(stickerPrices[card.priceKey])}`
              : card.fallbackPrice}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-brand)] px-4 py-2 text-xs font-semibold text-white transition-colors group-hover:bg-[var(--color-brand-dark)]">
            {card.cta}
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function StickersCategoryClient({ stickerPrices = {}, stickerImages = {} }) {
  const { t } = useTranslation();

  return (
    <main className="bg-[var(--color-gray-50)] pb-20 pt-10 text-[var(--color-gray-900)]">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 2xl:px-4">
        <Breadcrumbs
          items={[
            { label: t("product.shop"), href: "/shop" },
            { label: "Custom Stickers & Labels" },
          ]}
        />

        {/* Header */}
        <header className="mt-6">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Custom Stickers & Labels
          </h1>
          <p className="mt-2 max-w-2xl text-sm sm:text-base text-[var(--color-gray-500)]">
            Custom printed stickers & labels on premium vinyl and paper.
            <span className="mx-1.5 text-[var(--color-gray-300)]">&bull;</span>
            Waterproof
            <span className="mx-1.5 text-[var(--color-gray-300)]">&bull;</span>
            UV Resistant
            <span className="mx-1.5 text-[var(--color-gray-300)]">&bull;</span>
            Any Shape, Any Size
          </p>
        </header>

        {/* ── Section 1: Custom Stickers (Individual) ── */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight">Custom Stickers (Individual)</h2>
          <p className="mt-1 text-sm text-[var(--color-gray-500)]">
            Perfect for handouts, events, and retail ready.
          </p>
          <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2">
            {INDIVIDUAL_CARDS.map((card) => (
              <ProductCard key={card.priceKey} card={card} stickerPrices={stickerPrices} imageUrl={stickerImages[card.priceKey]} />
            ))}
          </div>
        </section>

        {/* ── Section 2: Labels & Sheets ── */}
        <section className="mt-12">
          <h2 className="text-xl font-semibold tracking-tight">Labels & Sheets</h2>
          <p className="mt-1 text-sm text-[var(--color-gray-500)]">
            Best for applying to products, boxes, and mailers.
          </p>
          <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2">
            {PACKAGING_CARDS.map((card) => (
              <ProductCard key={card.priceKey} card={card} stickerPrices={stickerPrices} imageUrl={stickerImages[card.priceKey]} />
            ))}
          </div>
        </section>

        {/* ── Section 3: Specialty Decals & Lettering ── */}
        <section className="mt-12">
          <h2 className="text-xl font-semibold tracking-tight">Specialty Decals & Lettering</h2>
          <p className="mt-1 text-sm text-[var(--color-gray-500)]">
            Stand out with unique finishes or window applications.
          </p>
          <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2">
            {SPECIALTY_CARDS.map((card) => (
              <ProductCard key={card.priceKey} card={card} stickerPrices={stickerPrices} size="medium" imageUrl={stickerImages[card.priceKey]} />
            ))}
          </div>
        </section>

        {/* ── Section 4: Shop by Material ── */}
        <section className="mt-12">
          <h2 className="text-xl font-semibold tracking-tight">Shop by Material</h2>
          <p className="mt-1 text-sm text-[var(--color-gray-500)]">
            Know what you need? Jump straight to your preferred material.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {MATERIAL_PILLS.map((mat) => (
              <Link
                key={mat.id}
                href={mat.href}
                className="rounded-full border border-[var(--color-gray-200)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-gray-700)] transition-colors hover:bg-[var(--color-brand-50)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
              >
                {mat.label}
              </Link>
            ))}
          </div>
        </section>

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

        {/* ── Section 5: Why Choose Us ── */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl shadow-[var(--shadow-card)] bg-white p-5">
            <div className="flex items-center gap-2 mb-3">
              <svg className="h-5 w-5 text-[var(--color-brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
              <h3 className="text-sm font-semibold text-[var(--color-gray-600)]">
                Waterproof & UV Protected
              </h3>
            </div>
            <p className="text-sm text-[var(--color-gray-700)]">
              Our vinyl stickers are waterproof, dishwasher safe, and UV
              protected for 3&ndash;5 years outdoor.
            </p>
          </div>

          <div className="rounded-2xl shadow-[var(--shadow-card)] bg-white p-5">
            <div className="flex items-center gap-2 mb-3">
              <svg className="h-5 w-5 text-[var(--color-brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
              <h3 className="text-sm font-semibold text-[var(--color-gray-600)]">
                Fast Turnaround
              </h3>
            </div>
            <p className="text-sm text-[var(--color-gray-700)]">
              Standard 3&ndash;5 business days. Rush production available.
              Free shipping on orders over $99.
            </p>
          </div>

          <div className="rounded-2xl shadow-[var(--shadow-card)] bg-white p-5">
            <div className="flex items-center gap-2 mb-3">
              <svg className="h-5 w-5 text-[var(--color-brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.848 8.25l1.536.887M7.848 8.25a3 3 0 11-5.196-3 3 3 0 015.196 3zm1.536.887a2.165 2.165 0 011.083 1.839c.005.351.054.695.14 1.024M9.384 9.137l2.077 1.199M7.848 15.75l1.536-.887m-1.536.887a3 3 0 01-5.196 3 3 3 0 015.196-3zm1.536-.887a2.165 2.165 0 001.083-1.838c.005-.352.054-.695.14-1.025m-1.223 2.863l2.077-1.199m0-3.328a4.323 4.323 0 012.068-1.379l5.325-1.628a4.5 4.5 0 012.48-.044l.803.215-7.794 4.5m-2.882-1.664A4.331 4.331 0 0010.607 12m3.736 0l7.794 4.5-.802.215a4.5 4.5 0 01-2.48-.043l-5.326-1.629a4.324 4.324 0 01-2.068-1.379M14.343 12l-2.882 1.664" />
              </svg>
              <h3 className="text-sm font-semibold text-[var(--color-gray-600)]">
                Any Shape, Any Size
              </h3>
            </div>
            <p className="text-sm text-[var(--color-gray-700)]">
              Custom die-cut to any shape from 0.5&quot; to 12&quot;.
              Full color CMYK + white ink at 1440 DPI.
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
