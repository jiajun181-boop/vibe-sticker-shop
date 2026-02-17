"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";

const DEPT_ICONS = {
  "marketing-business-print": "\uD83D\uDDA8\uFE0F",
  "stickers-labels-decals": "\uD83C\uDFF7\uFE0F",
  "signs-rigid-boards": "\uD83E\uDEA7",
  "banners-displays": "\uD83C\uDFF3\uFE0F",
  "windows-walls-floors": "\uD83E\uDE9F",
  "vehicle-graphics-fleet": "\uD83D\uDE9A",
};

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

function formatPrice(dollars) {
  if (dollars >= 1) {
    return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(dollars);
  }
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", minimumFractionDigits: 2, maximumFractionDigits: 3 }).format(dollars);
}

/* ── QTY_TIERED table ─────────────────────────────────────────── */
function QtyTierTable({ tiers, t }) {
  if (!tiers?.length) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-gray-200)]">
            <th className="pb-2 pr-4 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-gray-500)]">
              {t("pricing.qty")}
            </th>
            <th className="pb-2 pr-4 text-right text-xs font-medium uppercase tracking-wider text-[var(--color-gray-500)]">
              {t("pricing.perUnit")}
            </th>
            <th className="pb-2 text-right text-xs font-medium uppercase tracking-wider text-[var(--color-gray-500)]">
              {t("pricing.total")}
            </th>
          </tr>
        </thead>
        <tbody>
          {tiers.map((tier, i) => {
            const total = tier.minQty * tier.unitPrice;
            return (
              <tr
                key={i}
                className={`border-b border-[var(--color-gray-100)] ${i === 0 ? "text-[var(--color-gray-900)] font-medium" : "text-[var(--color-gray-700)]"}`}
              >
                <td className="py-2 pr-4">{tier.minQty.toLocaleString()}+</td>
                <td className="py-2 pr-4 text-right font-mono text-xs">{formatPrice(tier.unitPrice)}</td>
                <td className="py-2 text-right font-mono text-xs">{formatPrice(total)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── AREA_TIERED table ────────────────────────────────────────── */
function AreaTierTable({ tiers, t }) {
  if (!tiers?.length) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-gray-200)]">
            <th className="pb-2 pr-4 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-gray-500)]">
              {t("pricing.area")}
            </th>
            <th className="pb-2 text-right text-xs font-medium uppercase tracking-wider text-[var(--color-gray-500)]">
              {t("pricing.perSqft")}
            </th>
          </tr>
        </thead>
        <tbody>
          {tiers.map((tier, i) => (
            <tr
              key={i}
              className={`border-b border-[var(--color-gray-100)] ${i === 0 ? "text-[var(--color-gray-900)] font-medium" : "text-[var(--color-gray-700)]"}`}
            >
              <td className="py-2 pr-4">
                {tier.upToSqft >= 9999 ? `${tiers[i - 1]?.upToSqft || 0}+ sqft` : `\u2264 ${tier.upToSqft} sqft`}
              </td>
              <td className="py-2 text-right font-mono text-xs">{formatPrice(tier.rate)}/sqft</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Sub-group card ───────────────────────────────────────────── */
function SubGroupCard({ sg, t }) {
  const [expanded, setExpanded] = useState(false);
  const hasTiers = sg.tiers?.length > 0;

  // Show first tier as "from" price
  let fromLabel = "";
  if (hasTiers && sg.pricingModel === "AREA_TIERED") {
    const lowestRate = Math.min(...sg.tiers.map((t) => t.rate));
    fromLabel = `${t("pricing.fromLabel")} ${formatPrice(lowestRate)}/sqft`;
  } else if (hasTiers) {
    const firstTier = sg.tiers[0];
    const total = firstTier.minQty * firstTier.unitPrice;
    fromLabel = `${t("pricing.fromLabel")} ${formatPrice(total)}`;
  }

  return (
    <div className="rounded-xl border border-[var(--color-gray-200)] bg-white p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-[var(--color-gray-900)] leading-tight">{sg.title}</h3>
          {fromLabel && (
            <p className="mt-1 text-xs font-medium text-[var(--color-primary-600)]">{fromLabel}</p>
          )}
          {hasTiers && (
            <span className="mt-1 inline-block rounded-full bg-[var(--color-gray-100)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-gray-500)] uppercase tracking-wider">
              {sg.pricingModel === "AREA_TIERED" ? t("pricing.areaBased") : t("pricing.qtyTiers")}
            </span>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          {hasTiers && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="rounded-lg border border-[var(--color-gray-200)] px-3 py-1.5 text-xs font-medium text-[var(--color-gray-700)] transition-colors hover:bg-[var(--color-gray-50)]"
            >
              {expanded ? t("pricing.collapse") : t("pricing.expandTiers")}
            </button>
          )}
          <Link
            href={sg.href}
            className="rounded-lg bg-[var(--color-primary-600)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--color-primary-700)]"
          >
            {t("pricing.viewDetails")}
          </Link>
        </div>
      </div>

      {expanded && hasTiers && (
        <div className="mt-4 pt-3 border-t border-[var(--color-gray-100)]">
          {sg.pricingModel === "AREA_TIERED" ? (
            <AreaTierTable tiers={sg.tiers} t={t} />
          ) : (
            <QtyTierTable tiers={sg.tiers} t={t} />
          )}
        </div>
      )}
    </div>
  );
}

/* ── Department section ───────────────────────────────────────── */
function DepartmentSection({ dept, t }) {
  const hasAnyPricing = dept.subGroups.some((sg) => sg.tiers?.length > 0);

  return (
    <section id={dept.key} className="scroll-mt-28">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">{dept.icon}</span>
        <div>
          <h2 className="text-lg font-bold text-[var(--color-gray-900)]">{dept.title}</h2>
          <p className="text-xs text-[var(--color-gray-500)]">
            {dept.productCount} {t("pricing.products")}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {dept.subGroups.map((sg) => (
          <SubGroupCard key={sg.slug} sg={sg} t={t} />
        ))}
      </div>

      {/* Bulk CTA */}
      <div className="mt-4 rounded-xl bg-[var(--color-gray-100)] px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-sm text-[var(--color-gray-700)]">{t("pricing.contactBulk")}</p>
        <Link
          href="/quote"
          className="rounded-lg bg-[var(--color-gray-900)] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[var(--color-gray-800)]"
        >
          {t("pricing.getQuote")}
        </Link>
      </div>
    </section>
  );
}

/* ── Main Pricing Client ──────────────────────────────────────── */
export default function PricingClient({ departments }) {
  const { t } = useTranslation();
  const [activeDept, setActiveDept] = useState(departments[0]?.key || "");
  const navRef = useRef(null);
  const sectionRefs = useRef({});

  // Scroll active tab into view
  useEffect(() => {
    if (!navRef.current) return;
    const activeBtn = navRef.current.querySelector(`[data-dept="${activeDept}"]`);
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [activeDept]);

  // Intersection observer to highlight active department on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveDept(entry.target.id);
          }
        }
      },
      { rootMargin: "-120px 0px -60% 0px", threshold: 0 }
    );

    for (const dept of departments) {
      const el = document.getElementById(dept.key);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [departments]);

  const scrollToDept = (key) => {
    setActiveDept(key);
    const el = document.getElementById(key);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      {/* Hero */}
      <div className="bg-gradient-to-br from-[var(--color-gray-900)] to-[var(--color-gray-800)] text-white px-6 py-14">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-gray-400)] mb-3">
            {t("pricing.badge")}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{t("pricing.title")}</h1>
          <p className="mt-4 text-sm sm:text-base text-[var(--color-gray-300)] max-w-2xl mx-auto leading-relaxed">
            {t("pricing.heroDescription")}
          </p>
        </div>
      </div>

      {/* Sticky department tabs */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-[var(--color-gray-200)] shadow-sm">
        <div className="mx-auto max-w-5xl px-4">
          <nav
            ref={navRef}
            className="flex gap-1 overflow-x-auto py-2 scrollbar-hide"
            role="tablist"
          >
            {departments.map((dept) => (
              <button
                key={dept.key}
                data-dept={dept.key}
                role="tab"
                aria-selected={activeDept === dept.key}
                onClick={() => scrollToDept(dept.key)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                  activeDept === dept.key
                    ? "bg-[var(--color-primary-600)] text-white"
                    : "bg-[var(--color-gray-100)] text-[var(--color-gray-600)] hover:bg-[var(--color-gray-200)]"
                }`}
              >
                <span className="mr-1.5">{dept.icon}</span>
                {dept.title}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Department sections */}
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-12">
        {departments.map((dept) => (
          <DepartmentSection key={dept.key} dept={dept} t={t} />
        ))}

        {/* Bottom CTA */}
        <div className="rounded-2xl bg-gradient-to-r from-[var(--color-primary-600)] to-[var(--color-primary-700)] p-8 text-center text-white">
          <h2 className="text-xl font-bold">{t("pricing.ctaTitle")}</h2>
          <p className="mt-2 text-sm opacity-90">{t("pricing.ctaDescription")}</p>
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/quote"
              className="rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-[var(--color-primary-700)] transition-colors hover:bg-[var(--color-gray-100)]"
            >
              {t("pricing.getQuote")}
            </Link>
            <Link
              href="/contact"
              className="rounded-lg border border-white/30 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              {t("pricing.contactCta")}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
