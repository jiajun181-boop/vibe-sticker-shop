"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function DualEntryHero({ totalCount }) {
  const { t } = useTranslation();

  return (
    <div className="bg-black text-white pt-16 pb-14 px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute -right-20 -top-20 opacity-[0.03] pointer-events-none">
        <Image src="/logo-lunarprint.png" alt="" width={400} height={400} className="opacity-30" />
      </div>

      <div className="max-w-7xl mx-auto relative text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase backdrop-blur-sm mb-4">
          <Image src="/logo-lunarprint.png" alt="" width={16} height={16} className="h-4 w-4" />
          {t("home.badge")}
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter">
          {t("home.headline")}
        </h1>
        <p className="text-gray-400 max-w-xl mx-auto mt-3 text-base sm:text-lg">
          {t("home.subheadline")}
        </p>

        <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-xs font-bold text-gray-300 mt-4">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          {t("home.productsAvailable", { count: totalCount })}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/shop"
            className="rounded-full bg-white px-6 py-3 text-xs font-black uppercase tracking-[0.15em] text-black transition-colors hover:bg-gray-200"
          >
            {t("home.cta.shop")}
          </Link>
          <Link
            href="/quote"
            className="rounded-full border border-white/30 px-6 py-3 text-xs font-black uppercase tracking-[0.15em] text-white transition-colors hover:border-white hover:bg-white/10"
          >
            {t("home.cta.quote")}
          </Link>
        </div>
      </div>
    </div>
  );
}
