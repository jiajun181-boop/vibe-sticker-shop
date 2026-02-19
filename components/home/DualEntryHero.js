"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useScrollAnimation } from "@/lib/useScrollAnimation";

export default function DualEntryHero({ totalCount }) {
  const { t } = useTranslation();
  const ref = useScrollAnimation();

  return (
    <div
      ref={ref}
      className="pt-28 pb-24 md:pt-40 md:pb-32 px-4 sm:px-6 relative bg-white"
    >
      <div className="max-w-3xl mx-auto text-center">
        <p className="animate-on-scroll label-xs text-[var(--color-gray-400)] mb-8 tracking-[0.18em]">
          {t("home.badge")}
        </p>

        <h1 className="animate-on-scroll delay-1 heading-display text-[var(--color-ink-black)]">
          {t("home.headline")}
        </h1>
        <p className="animate-on-scroll delay-2 text-[var(--color-gray-500)] max-w-2xl mx-auto mt-6 body-lg leading-relaxed">
          {t("home.subheadline")}
        </p>

        <div className="animate-on-scroll delay-3 mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/shop"
            className="btn-primary-pill btn-md tracking-[0.14em]"
          >
            {t("home.cta.shop")}
          </Link>
          <Link
            href="/quote"
            className="inline-flex items-center gap-2 border-b-2 border-[var(--color-ink-black)] px-1 pb-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-black)] transition-colors hover:border-[var(--color-moon-gold)] hover:text-[var(--color-moon-gold)]"
          >
            {t("home.cta.quote")}
          </Link>
        </div>

        <p className="animate-on-scroll delay-4 label-xs text-[var(--color-gray-400)] mt-8 tracking-[0.15em]">
          {t("home.productsAvailable", { count: totalCount })}
        </p>
      </div>
    </div>
  );
}
