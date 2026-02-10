"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";

const REVIEWS = [
  { id: 1, name: "Mike R.", company: "GTA Logistics", text: "Fast turnaround on our fleet lettering. 50 trucks done in a week.", rating: 5, date: "2025-12-15" },
  { id: 2, name: "Sarah T.", company: "Fresh Foods Inc.", text: "The retractable banner stands look amazing at trade shows. Great quality.", rating: 5, date: "2025-11-20" },
  { id: 3, name: "David L.", company: "ProBuild Construction", text: "Ordered safety decals for the entire crew. Great quality and unbeatable price.", rating: 5, date: "2025-10-08" },
  { id: 4, name: "Jennifer K.", company: "Maple Realty Group", text: "Magnetic signs and X-banner stands for open houses. Outstanding print quality.", rating: 5, date: "2025-09-22" },
  { id: 5, name: "Carlos M.", company: "QuickShip Couriers", text: "CVOR and DOT numbers done same day. Exactly what we needed.", rating: 5, date: "2025-08-14" },
  { id: 6, name: "Lisa W.", company: "Bloom Event Co.", text: "Tabletop banners are perfect for pop-up events. Compact and premium feel.", rating: 4, date: "2025-07-30" },
];

function Stars({ count }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          className={`h-4 w-4 ${i < count ? "text-amber-400" : "text-gray-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function ReviewsSection() {
  const { t } = useTranslation();
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? REVIEWS : REVIEWS.slice(0, 3);
  const avgRating = (REVIEWS.reduce((s, r) => s + r.rating, 0) / REVIEWS.length).toFixed(1);

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{t("reviews.title")}</h2>
          <p className="mt-1 text-xs text-gray-500">{t("reviews.count", { count: REVIEWS.length })}</p>
        </div>
        <div className="flex items-center gap-2">
          <Stars count={Math.round(Number(avgRating))} />
          <span className="text-sm font-semibold text-gray-900">{t("reviews.avgRating", { rating: avgRating })}</span>
        </div>
      </div>

      <div className="space-y-4">
        {displayed.map((review) => (
          <div key={review.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">{review.name}</p>
                <p className="text-xs text-gray-500">{review.company}</p>
              </div>
              <div className="text-right">
                <Stars count={review.rating} />
                <p className="mt-0.5 text-[10px] text-gray-400">{t("reviews.verified")}</p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-gray-700">{review.text}</p>
          </div>
        ))}
      </div>

      {REVIEWS.length > 3 && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="mt-4 w-full rounded-full border border-gray-300 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-gray-700 transition-colors hover:bg-gray-50"
        >
          {showAll ? t("reviews.showLess") : t("reviews.showMore")}
        </button>
      )}
    </section>
  );
}
