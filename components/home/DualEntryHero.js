"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useScrollAnimation } from "@/lib/useScrollAnimation";

export default function DualEntryHero({ totalCount }) {
  const { t } = useTranslation();
  const ref = useScrollAnimation();

  return (
    <div
      ref={ref}
      className="pt-20 pb-16 md:pt-28 md:pb-20 px-4 sm:px-6 relative overflow-hidden bg-[linear-gradient(180deg,var(--color-paper-cream),var(--color-paper-white))]"
    >
      {/* Double glow halos */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-[var(--color-moon-gold)] opacity-[0.06] blur-[100px]" />
        <div className="absolute -top-20 left-1/3 w-[500px] h-[300px] rounded-full bg-[var(--color-moon-blue)] opacity-[0.04] blur-[80px]" />
      </div>

      <div className="absolute -right-20 -top-20 opacity-[0.06] pointer-events-none">
        <Image src="/logo-lunarprint.png" alt="" width={400} height={400} className="opacity-40" />
      </div>

      <div className="max-w-7xl mx-auto relative text-center">
        <div className="animate-on-scroll inline-flex items-center gap-2 border border-[var(--color-gray-200)] bg-white px-3 py-1 rounded-full label-xs text-[var(--color-gray-600)] mb-5">
          <Image src="/logo-lunarprint.png" alt="" width={16} height={16} className="h-4 w-4" />
          {t("home.badge")}
        </div>

        <h1 className="animate-on-scroll delay-1 heading-display text-[var(--color-gray-800)]">
          {t("home.headline")}
        </h1>
        <p className="animate-on-scroll delay-2 text-[var(--color-gray-600)] max-w-xl mx-auto mt-4 body-lg">
          {t("home.subheadline")}
        </p>

        <div className="animate-on-scroll delay-3 inline-flex items-center gap-2 border border-[var(--color-gray-200)] bg-white rounded-full px-4 py-1.5 label-xs text-[var(--color-gray-600)] mt-5">
          <span className="w-2 h-2 rounded-full bg-[var(--color-moon-blue)] animate-pulse" />
          {t("home.productsAvailable", { count: totalCount })}
        </div>

        <div className="animate-on-scroll delay-4 mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/shop"
            className="btn-primary-pill btn-md font-black tracking-[0.15em]"
          >
            {t("home.cta.shop")}
          </Link>
          <Link
            href="/quote"
            className="btn-secondary-pill btn-md font-black tracking-[0.15em]"
          >
            {t("home.cta.quote")}
          </Link>
        </div>
      </div>
    </div>
  );
}
