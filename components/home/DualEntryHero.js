"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function DualEntryHero({ totalCount }) {
  const { t } = useTranslation();

  return (
    <div className="pt-14 pb-12 px-4 sm:px-6 relative overflow-hidden bg-[linear-gradient(180deg,var(--color-paper-cream),var(--color-paper-white))]">
      <div className="absolute -right-20 -top-20 opacity-[0.08] pointer-events-none">
        <Image src="/logo-lunarprint.png" alt="" width={400} height={400} className="opacity-40" />
      </div>

      <div className="max-w-7xl mx-auto relative text-center">
        <div className="inline-flex items-center gap-2 border border-[var(--color-gray-200)] bg-white px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase text-[var(--color-gray-600)] mb-4">
          <Image src="/logo-lunarprint.png" alt="" width={16} height={16} className="h-4 w-4" />
          {t("home.badge")}
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-[var(--color-gray-800)]">
          {t("home.headline")}
        </h1>
        <p className="text-[var(--color-gray-600)] max-w-xl mx-auto mt-3 text-base sm:text-lg">
          {t("home.subheadline")}
        </p>

        <div className="inline-flex items-center gap-2 border border-[var(--color-gray-200)] bg-white rounded-full px-4 py-1.5 text-xs font-bold text-[var(--color-gray-600)] mt-4">
          <span className="w-2 h-2 rounded-full bg-[var(--color-moon-blue)] animate-pulse" />
          {t("home.productsAvailable", { count: totalCount })}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/shop"
            className="btn-primary-pill px-6 py-3 text-xs font-black tracking-[0.15em]"
          >
            {t("home.cta.shop")}
          </Link>
          <Link
            href="/quote"
            className="btn-secondary-pill px-6 py-3 text-xs font-black tracking-[0.15em]"
          >
            {t("home.cta.quote")}
          </Link>
        </div>
      </div>
    </div>
  );
}
