"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import StarRating from "@/components/product/StarRating";

const REVIEWS = [
  { id: 1, name: "Mike R.", company: "GTA Logistics", text: "Fast turnaround on our fleet lettering. 50 trucks done in a week.", rating: 5, date: "2025-12-15" },
  { id: 2, name: "Sarah T.", company: "Fresh Foods Inc.", text: "The retractable banner stands look amazing at trade shows. Great quality.", rating: 5, date: "2025-11-20" },
  { id: 3, name: "David L.", company: "ProBuild Construction", text: "Ordered safety decals for the entire crew. Great quality and unbeatable price.", rating: 5, date: "2025-10-08" },
  { id: 4, name: "Jennifer K.", company: "Maple Realty Group", text: "Magnetic signs and X-banner stands for open houses. Outstanding print quality.", rating: 5, date: "2025-09-22" },
  { id: 5, name: "Carlos M.", company: "QuickShip Couriers", text: "CVOR and DOT numbers done same day. Exactly what we needed.", rating: 5, date: "2025-08-14" },
  { id: 6, name: "Lisa W.", company: "Bloom Event Co.", text: "Tabletop banners are perfect for pop-up events. Compact and premium feel.", rating: 4, date: "2025-07-30" },
];

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
          <StarRating value={Number(avgRating)} size={16} />
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
                <StarRating value={review.rating} size={16} />
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
