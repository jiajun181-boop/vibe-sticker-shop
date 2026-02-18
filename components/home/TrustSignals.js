"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import StarRating from "@/components/product/StarRating";

const STATS = [
  { value: 15000, suffix: "+", labelKey: "trust.ordersDelivered", icon: "check" },
  { value: 24, suffix: "h", labelKey: "trust.sameDayPrinting", icon: "bolt" },
  { value: 150, suffix: "", labelKey: "trust.freeShippingOver", icon: "truck", prefix: "$" },
  { value: 100, suffix: "%", labelKey: "trust.satisfactionGuarantee", icon: "shield" },
];

const REVIEWS = [
  { name: "Mike R.", company: "GTA Logistics", text: "Fast turnaround on our fleet lettering. 50 trucks done in a week. Pricing beat everyone else we quoted.", rating: 5 },
  { name: "Sarah T.", company: "Fresh Foods Inc.", text: "The retractable banner stands look amazing at trade shows. Setup takes 30 seconds. Very professional.", rating: 5 },
  { name: "David L.", company: "ProBuild Construction", text: "Ordered safety decals and hard hat stickers for the entire crew. Great quality and unbeatable price.", rating: 5 },
  { name: "Jennifer K.", company: "Maple Realty Group", text: "We ordered magnetic signs and X-banner stands for open houses. The print quality is outstanding.", rating: 5 },
  { name: "Carlos M.", company: "QuickShip Couriers", text: "CVOR and DOT numbers done same day. Exactly what we needed for compliance on our new trucks.", rating: 5 },
  { name: "Lisa W.", company: "Bloom Event Co.", text: "The tabletop banners are perfect for our pop-up events. Compact, portable, and they look premium.", rating: 5 },
];

function AnimatedCounter({ value, suffix = "", prefix = "", text, decimals = 0 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (text) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 1500;
          const start = performance.now();
          const step = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(eased * value);
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, text]);

  if (text) {
    return <span ref={ref}>{text}</span>;
  }

  const display = decimals > 0 ? count.toFixed(decimals) : Math.floor(count).toLocaleString();
  return <span ref={ref} className="tabular-nums">{prefix}{display}{suffix}</span>;
}

const STAT_ICONS = {
  check: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  ),
  bolt: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  ),
  truck: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  ),
  shield: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  ),
};

export default function TrustSignals() {
  const { t } = useTranslation();
  const [reviewIdx, setReviewIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setReviewIdx((i) => (i + 1) % REVIEWS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-8">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {STATS.map((stat) => (
          <div
            key={stat.labelKey}
            className="bg-white rounded-2xl border border-[var(--color-gray-100)] p-5 md:p-6 text-center hover-lift-subtle"
          >
            <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-gradient-to-br from-[var(--color-moon-gold)] to-[var(--color-moon-gold-dark)] text-white flex items-center justify-center">
              {STAT_ICONS[stat.icon]}
            </div>
            <div className="text-3xl md:text-4xl font-black tracking-tight text-[var(--color-gray-900)]">
              <AnimatedCounter value={stat.value} suffix={stat.suffix} prefix={stat.prefix} text={stat.textKey ? t(stat.textKey) : undefined} />
            </div>
            <p className="label-xs text-[var(--color-gray-400)] mt-1.5 font-normal tracking-[0.14em]">{t(stat.labelKey)}</p>
          </div>
        ))}
      </div>

      {/* Reviews */}
      <div className="bg-white rounded-2xl border border-[var(--color-gray-100)] p-6 md:p-8 overflow-hidden">
        <div className="flex items-center gap-2 mb-6">
          <StarRating value={5} size={16} />
          <span className="label-xs text-[var(--color-gray-400)] tracking-[0.14em]">
            {t("trust.customersSay")}
          </span>
        </div>

        <div className="relative h-24 md:h-20">
          {REVIEWS.map((review, i) => (
            <div
              key={i}
              className={`absolute inset-0 transition-all duration-500 ${
                i === reviewIdx
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4 pointer-events-none"
              }`}
            >
              <blockquote className="text-[var(--color-gray-700)] body-base leading-relaxed">
                &ldquo;{review.text}&rdquo;
              </blockquote>
              <div className="mt-3 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[var(--color-moon-blue-deep)] flex items-center justify-center label-xs text-white">
                  {review.name[0]}
                </div>
                <span className="body-sm font-bold">{review.name}</span>
                <span className="body-sm text-[var(--color-gray-400)]">&mdash; {review.company}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-1.5 mt-4">
          {REVIEWS.map((_, i) => (
            <button
              key={i}
              onClick={() => setReviewIdx(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === reviewIdx ? "bg-[var(--color-ink-black)] w-4" : "bg-[var(--color-gray-200)] w-1.5"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
