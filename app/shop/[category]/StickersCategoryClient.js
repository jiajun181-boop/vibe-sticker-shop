"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Breadcrumbs from "@/components/Breadcrumbs";

const BASE = "/shop/stickers-labels-decals";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

const MAIN_CARDS = [
  {
    slug: "die-cut",
    title: "Die-Cut Stickers",
    description: "Cut precisely to your design's shape. Weatherproof vinyl, any size.",
    href: `${BASE}/die-cut`,
    gradient: "from-violet-100 to-fuchsia-100",
    icon: "scissors",
  },
  {
    slug: "kiss-cut",
    title: "Kiss-Cut Stickers",
    description: "Easy-peel on backing sheet. Great for retail packaging & giveaways.",
    href: `${BASE}/kiss-cut`,
    gradient: "from-sky-100 to-cyan-100",
    icon: "layers",
  },
  {
    slug: "vinyl-lettering",
    title: "Vinyl Lettering",
    description: "Individual cut letters & logos. For windows, walls & vehicles.",
    href: `${BASE}/vinyl-lettering`,
    gradient: "from-amber-100 to-orange-100",
    icon: "type",
  },
];

const SECONDARY_CARDS = [
  {
    slug: "sticker-sheets",
    title: "Sticker Sheets",
    description: "Full page of stickers on paper or vinyl. Great for product labels.",
    href: `${BASE}/sticker-sheets`,
    cta: "Configure",
  },
  {
    slug: "roll-labels",
    title: "Roll Labels",
    description: "High volume on rolls. Min 500+. 5-7 day lead time.",
    href: `${BASE}/roll-labels`,
    cta: "Get a Quote",
  },
];

const MATERIAL_GROUPS = [
  {
    title: "Vinyl",
    materials: [
      { id: "white-vinyl", label: "White Vinyl", href: `${BASE}/die-cut?material=white_vinyl` },
      { id: "matte-vinyl", label: "Matte Vinyl", href: `${BASE}/die-cut?material=matte_vinyl` },
      { id: "clear-vinyl", label: "Clear Vinyl", href: `${BASE}/die-cut?material=clear_vinyl` },
      { id: "frosted-vinyl", label: "Frosted Vinyl", href: `${BASE}/die-cut?material=frosted_vinyl` },
      { id: "3m-reflective", label: "3M Reflective", href: `${BASE}/die-cut?material=reflective_3m` },
    ],
  },
  {
    title: "Paper",
    materials: [
      { id: "gloss-paper", label: "Gloss Paper", href: `${BASE}/die-cut?material=paper_gloss` },
      { id: "matte-paper", label: "Matte Paper", href: `${BASE}/die-cut?material=paper_matte` },
      { id: "soft-touch", label: "Soft Touch", href: `${BASE}/die-cut?material=paper_soft` },
      { id: "foil-stamping", label: "Foil Stamping", href: `${BASE}/die-cut?material=paper_foil` },
    ],
  },
  {
    title: "Static Clings (No Adhesive)",
    materials: [
      { id: "clear-cling", label: "Clear Cling", href: `${BASE}/die-cut?material=static_cling_clear` },
      { id: "frosted-cling", label: "Frosted Cling", href: `${BASE}/die-cut?material=static_cling_frosted` },
      { id: "white-cling", label: "White Cling", href: `${BASE}/die-cut?material=static_cling_white` },
    ],
  },
];

function CardIcon({ type, className }) {
  if (type === "scissors") return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.848 8.25l1.536.887M7.848 8.25a3 3 0 11-5.196-3 3 3 0 015.196 3zm1.536.887a2.165 2.165 0 011.083 1.839c.005.351.054.695.14 1.024M9.384 9.137l2.077 1.199M7.848 15.75l1.536-.887m-1.536.887a3 3 0 01-5.196 3 3 3 0 015.196-3zm1.536-.887a2.165 2.165 0 001.083-1.838c.005-.352.054-.695.14-1.025m-1.223 2.863l2.077-1.199m0-3.328a4.323 4.323 0 012.068-1.379l5.325-1.628a4.5 4.5 0 012.48-.044l.803.215-7.794 4.5m-2.882-1.664A4.331 4.331 0 0010.607 12m3.736 0l7.794 4.5-.802.215a4.5 4.5 0 01-2.48-.043l-5.326-1.629a4.324 4.324 0 01-2.068-1.379M14.343 12l-2.882 1.664" />
    </svg>
  );
  if (type === "layers") return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0L12 17.25 6.429 14.25m11.142 0l4.179 2.25L12 21.75l-9.75-5.25 4.179-2.25" />
    </svg>
  );
  if (type === "type") return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  );
  return null;
}

export default function StickersCategoryClient({ stickerPrices = {} }) {
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

        {/* ── Section 1: Custom Stickers (main entry by cut type) ── */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight text-[var(--color-gray-900)]">
            Custom Stickers
          </h2>
          <p className="mt-1 text-sm text-[var(--color-gray-500)]">Choose your cutting method</p>

          <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-3">
            {MAIN_CARDS.map((card) => (
              <Link
                key={card.slug}
                href={card.href}
                className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--color-gray-200)] bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
              >
                {/* Card image / gradient */}
                <div className={`relative flex items-center justify-center aspect-[4/3] bg-gradient-to-br ${card.gradient}`}>
                  <CardIcon type={card.icon} className="h-16 w-16 text-white/70 drop-shadow-sm transition-transform duration-300 group-hover:scale-110" />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-lg font-semibold text-[var(--color-gray-900)]">
                    {card.title}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--color-gray-500)] leading-relaxed">
                    {card.description}
                  </p>
                  <div className="mt-auto pt-4 flex items-center justify-between">
                    {stickerPrices[card.slug] ? (
                      <span className="text-sm font-bold text-[var(--color-gray-900)]">From {formatCad(stickerPrices[card.slug])}</span>
                    ) : (
                      <span />
                    )}
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-brand)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white transition-colors group-hover:bg-[var(--color-brand-dark)]">
                      Configure
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Section 2: Sheets & Rolls ── */}
        <section className="mt-12">
          <h2 className="text-xl font-semibold tracking-tight text-[var(--color-gray-900)]">
            Sheets & Rolls
          </h2>

          <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2">
            {SECONDARY_CARDS.map((card) => (
              <Link
                key={card.slug}
                href={card.href}
                className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--color-gray-200)] bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <h3 className="text-lg font-semibold text-[var(--color-gray-900)]">
                  {card.title}
                </h3>
                <p className="mt-1 text-sm text-[var(--color-gray-500)] leading-relaxed">
                  {card.description}
                </p>
                <div className="mt-auto pt-4 flex items-center justify-between">
                  {stickerPrices[card.slug] ? (
                    <span className="text-sm font-bold text-[var(--color-gray-900)]">From {formatCad(stickerPrices[card.slug])}</span>
                  ) : (
                    <span />
                  )}
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-brand)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white transition-colors group-hover:bg-[var(--color-brand-dark)]">
                    {card.cta}
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Section 3: Browse by Material ── */}
        <section className="mt-12">
          <h2 className="text-xl font-semibold tracking-tight text-[var(--color-gray-900)]">
            Browse by Material
          </h2>
          <p className="mt-1 text-sm text-[var(--color-gray-500)]">
            Not sure which sticker type? Start by choosing your preferred material.
          </p>

          <div className="mt-6 space-y-6">
            {MATERIAL_GROUPS.map((group) => (
              <div key={group.title}>
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-500)] mb-2">
                  {group.title}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {group.materials.map((mat) => (
                    <Link
                      key={mat.id}
                      href={mat.href}
                      className="group/mat inline-flex items-center gap-2 rounded-xl border border-[var(--color-gray-200)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-gray-700)] transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-[var(--color-gray-400)] hover:text-[var(--color-gray-900)]"
                    >
                      <span className="h-3 w-3 rounded-full border border-[var(--color-gray-300)] bg-gradient-to-br from-[var(--color-gray-100)] to-[var(--color-gray-200)]" />
                      {mat.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

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
          <div className="rounded-2xl shadow-[var(--shadow-card)] bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-600)]">
              Waterproof & UV Protected
            </h3>
            <p className="mt-3 text-sm text-[var(--color-gray-700)]">
              Our vinyl stickers are waterproof, dishwasher safe, and UV
              protected for 3-5 years outdoor and 7+ years indoor use.
            </p>
          </div>

          <div className="rounded-2xl shadow-[var(--shadow-card)] bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-600)]">
              Fast Turnaround
            </h3>
            <p className="mt-3 text-sm text-[var(--color-gray-700)]">
              Standard 2-3 business days. Rush production available.
              Free shipping on orders over $99 across Canada.
            </p>
          </div>

          <div className="rounded-2xl shadow-[var(--shadow-card)] bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-600)]">
              Any Shape, Any Size
            </h3>
            <p className="mt-3 text-sm text-[var(--color-gray-700)]">
              Custom die-cut to any shape from 0.5&quot; to 12&quot;.
              Full color CMYK + white ink printing at 1440 DPI.
            </p>
            <Link
              href="/quote"
              className="mt-3 inline-block rounded-full bg-[var(--color-brand)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white hover:bg-[var(--color-brand-dark)]"
            >
              Get a Quote
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
