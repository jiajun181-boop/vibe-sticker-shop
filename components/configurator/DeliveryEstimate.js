"use client";

import { useEffect, useState } from "react";

/**
 * Category-based production days (business days).
 * These are typical turnaround times — rush production halves them.
 */
const PRODUCTION_DAYS = {
  "stickers-labels-decals": 3,
  "marketing-business-print": 3,
  "marketing-prints": 3,
  "banners-displays": 2,
  "signs-rigid-boards": 4,
  "canvas-prints": 5,
  "vehicle-graphics-fleet": 7,
  "vehicle-branding-advertising": 7,
  "windows-walls-floors": 3,
  "display-stands": 3,
  "fleet-compliance-id": 4,
  "safety-warning-decals": 3,
  "facility-asset-labels": 3,
  default: 3,
};

const SHIPPING_MIN = 2;
const SHIPPING_MAX = 5;

/** Add N business days to a date (skip weekends) */
function addBusinessDays(date, days) {
  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dow = result.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return result;
}

/** Get the next cutoff time (today 2 PM ET). If past, next business day 2 PM. */
function getNextCutoff() {
  const now = new Date();
  // Toronto is ET (UTC-5 / UTC-4 DST)
  const etString = now.toLocaleString("en-US", { timeZone: "America/Toronto" });
  const et = new Date(etString);

  const cutoff = new Date(et);
  cutoff.setHours(14, 0, 0, 0); // 2 PM

  if (et < cutoff) {
    // Still before today's cutoff
    return { cutoff, sameDay: true };
  }
  // Past cutoff — next business day
  const nextBiz = addBusinessDays(et, 1);
  nextBiz.setHours(14, 0, 0, 0);
  return { cutoff: nextBiz, sameDay: false };
}

function formatDate(date, locale) {
  return date.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-CA", {
    month: "short",
    day: "numeric",
    weekday: "short",
  });
}

/**
 * DeliveryEstimate — shows estimated delivery date + countdown timer.
 *
 * Props:
 *  - categorySlug: string — product category for production days lookup
 *  - rushProduction: boolean — if rush, halve production days
 *  - t: function — translation function
 *  - locale: string — "en" or "zh"
 */
export default function DeliveryEstimate({ categorySlug, rushProduction, t, locale }) {
  const [now, setNow] = useState(() => new Date());

  // Tick every minute for countdown
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const baseProdDays = PRODUCTION_DAYS[categorySlug] || PRODUCTION_DAYS.default;
  const prodDays = rushProduction ? Math.max(1, Math.ceil(baseProdDays / 2)) : baseProdDays;

  const { cutoff, sameDay } = getNextCutoff();

  // Production starts after cutoff
  const prodStart = sameDay ? new Date() : cutoff;
  const earliestShip = addBusinessDays(prodStart, prodDays);
  const deliveryMin = addBusinessDays(earliestShip, SHIPPING_MIN);
  const deliveryMax = addBusinessDays(earliestShip, SHIPPING_MAX);

  // Countdown to cutoff
  const diffMs = cutoff.getTime() - now.getTime();
  const hoursLeft = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
  const minutesLeft = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)));
  const showCountdown = diffMs > 0 && sameDay;

  const deliveryLabel = rushProduction
    ? t?.("configurator.rushDelivery") || "Rush: receive by"
    : t?.("configurator.orderToday") || "Order today, receive by";

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 space-y-2">
      {/* Delivery date */}
      <div className="flex items-center gap-2">
        <svg className="h-4 w-4 flex-shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-blue-800">
            {deliveryLabel}{" "}
            <span className="font-black">
              {formatDate(deliveryMin, locale)} – {formatDate(deliveryMax, locale)}
            </span>
          </p>
        </div>
      </div>

      {/* Countdown timer */}
      {showCountdown && (
        <div className="flex items-center gap-1.5 text-[11px] text-blue-700">
          <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            {t?.("configurator.orderBy") || "Order within"}{" "}
            <span className="font-bold text-blue-900">
              {hoursLeft}{t?.("configurator.hours") || "h"}{" "}
              {minutesLeft}{t?.("configurator.minutes") || "m"}
            </span>{" "}
            {(t?.("configurator.toGetBy") || "to get it by {date}").replace("{date}", formatDate(deliveryMin, locale))}
          </span>
        </div>
      )}

      {/* Production + shipping breakdown */}
      <div className="flex items-center gap-3 text-[10px] text-blue-600">
        <span>{(t?.("configurator.productionDays") || "Production: {days} business days").replace("{days}", prodDays)}</span>
        <span className="text-blue-300">|</span>
        <span>
          {(t?.("configurator.shippingDays") || "Shipping: {min}–{max} business days")
            .replace("{min}", SHIPPING_MIN)
            .replace("{max}", SHIPPING_MAX)}
        </span>
      </div>
    </div>
  );
}
