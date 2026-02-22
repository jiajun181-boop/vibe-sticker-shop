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
      className="pt-28 pb-28 md:pt-40 md:pb-36 px-4 sm:px-6 relative bg-gradient-to-br from-[var(--color-brand-50)] to-white"
    >
      <div className="max-w-3xl mx-auto text-center">
        <p className="animate-on-scroll inline-block bg-[var(--color-brand-100)] text-[var(--color-brand-dark)] rounded-full px-4 py-1.5 text-sm font-medium mb-8">
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
            className="btn-primary-pill btn-md"
          >
            {t("home.cta.shop")}
          </Link>
          <Link
            href="/quote"
            className="btn-secondary-pill btn-md"
          >
            {t("home.cta.quote")}
          </Link>
        </div>

        <p className="animate-on-scroll delay-4 text-sm text-[var(--color-gray-400)] mt-8">
          {t("home.productsAvailable", { count: totalCount })}
        </p>
      </div>
    </div>
  );
}
