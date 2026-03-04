"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

const HERO_GRADIENTS = {
  "stickers-labels-decals": "from-violet-600 via-fuchsia-500 to-pink-500",
  "marketing-business-print": "from-amber-600 via-orange-500 to-red-500",
  "signs-rigid-boards": "from-emerald-600 via-teal-500 to-cyan-500",
  "banners-displays": "from-rose-600 via-pink-500 to-fuchsia-500",
  "windows-walls-floors": "from-blue-600 via-indigo-500 to-violet-500",
  "canvas-prints": "from-slate-700 via-gray-600 to-zinc-500",
  "vehicle-graphics-fleet": "from-indigo-700 via-purple-600 to-fuchsia-500",
};

/* ── Trust badge icons ── */
function StarIcon() {
  return (
    <svg className="h-4 w-4 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  );
}

export default function CategoryHero({ category, title, icon, hideVolumeBanner }) {
  const { t } = useTranslation();
  const gradient = HERO_GRADIENTS[category] || "from-gray-700 via-gray-600 to-gray-500";

  return (
    <section className="space-y-3">
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${gradient} px-6 py-8 sm:px-10 sm:py-10`}>
      {/* Decorative pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-10">
        <svg className="h-full w-full" viewBox="0 0 800 400" fill="none">
          <circle cx="700" cy="50" r="200" fill="white" />
          <circle cx="100" cy="350" r="150" fill="white" />
        </svg>
      </div>

      <div className="relative z-10">
        {/* Title */}
        <div className="flex items-center gap-3">
          {icon && <span className="text-3xl">{icon}</span>}
          <h1 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
            {title}
          </h1>
        </div>

        {/* Description */}
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
          {t(`categoryHero.desc.${category}`)}
        </p>

        {/* Trust badges */}
        <div className="mt-5 flex flex-wrap gap-2 sm:gap-3">
          {/* Google Reviews */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
            <StarIcon />
            {t("categoryHero.badge.googleReviews")}
          </span>
          {/* Made in Toronto */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
            <MapPinIcon />
            {t("categoryHero.badge.madeInToronto")}
          </span>
          {/* Same-Day Rush */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
            <BoltIcon />
            {t("categoryHero.badge.sameDayRush")}
          </span>
        </div>
      </div>
    </div>
    {/* Volume discount banner */}
    {!hideVolumeBanner && (
      <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-lg" aria-hidden="true">📦</span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-amber-900 truncate">
              {t("category.volumeTitle")}
            </p>
            <p className="text-xs text-amber-700 truncate">
              {t("category.volumeDesc")}
            </p>
          </div>
        </div>
        <a
          href="/contact"
          className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-amber-700 sm:px-4 sm:py-2"
        >
          {t("category.volumeCta")}
        </a>
      </div>
    )}
    </section>
  );
}
