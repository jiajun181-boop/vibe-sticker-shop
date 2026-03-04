"use client";

/**
 * Slim volume discount banner for category pages.
 * Shows "Order 500+ and save up to 40%" with a CTA.
 *
 * Props:
 *  - t: translation function
 */
export default function VolumeBanner({ t }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 sm:px-6">
      <div className="flex items-center gap-3 min-w-0">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-lg" aria-hidden="true">
          📦
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-amber-900 truncate">
            {t?.("category.volumeTitle") || "Bulk Order? Save Big!"}
          </p>
          <p className="text-xs text-amber-700 truncate">
            {t?.("category.volumeDesc") || "Order 500+ units and save up to 40% per piece"}
          </p>
        </div>
      </div>
      <a
        href="/contact"
        className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-amber-700 sm:px-4 sm:py-2"
      >
        {t?.("category.volumeCta") || "Get Quote"}
      </a>
    </div>
  );
}
