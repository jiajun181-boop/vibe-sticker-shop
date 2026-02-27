"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";

const GOOGLE_REVIEWS_URL =
  "https://www.google.com/maps/place/La+Lunar+Printing+Inc./@43.7758678,-79.2546498,17z/data=!4m8!3m7!1s0x89d4d1a45bfaaaab:0xf0a6d0a6c8b8b8b8!8m2!3d43.7758678!4d-79.2520749!9m1!1b1!16s%2Fg%2F11fmq0lv9y";

const REVIEWS = [
  {
    name: "Mike R.",
    text: "google.review.1",
    rating: 5,
    timeAgo: "google.review.1.time",
  },
  {
    name: "Sarah T.",
    text: "google.review.2",
    rating: 5,
    timeAgo: "google.review.2.time",
  },
  {
    name: "David L.",
    text: "google.review.3",
    rating: 5,
    timeAgo: "google.review.3.time",
  },
  {
    name: "Jennifer K.",
    text: "google.review.4",
    rating: 5,
    timeAgo: "google.review.4.time",
  },
  {
    name: "Carlos M.",
    text: "google.review.5",
    rating: 5,
    timeAgo: "google.review.5.time",
  },
  {
    name: "Lisa W.",
    text: "google.review.6",
    rating: 5,
    timeAgo: "google.review.6.time",
  },
];

function GoogleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function Stars({ count = 5 }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }, (_, i) => (
        <svg key={i} className="h-4 w-4 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function GoogleReviews() {
  const { t } = useTranslation();
  const [idx, setIdx] = useState(0);

  // Show 3 reviews at a time on desktop, rotate through all 6
  useEffect(() => {
    const timer = setInterval(() => {
      setIdx((i) => (i + 3) % REVIEWS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const visible = [
    REVIEWS[idx % REVIEWS.length],
    REVIEWS[(idx + 1) % REVIEWS.length],
    REVIEWS[(idx + 2) % REVIEWS.length],
  ];

  return (
    <section className="py-16 md:py-20 bg-[var(--color-gray-50)] animate-on-scroll">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 2xl:px-4">
        {/* Google Rating Badge */}
        <div className="flex flex-col items-center gap-4 mb-10">
          <div className="flex items-center gap-3">
            <GoogleIcon className="h-8 w-8 sm:h-10 sm:w-10" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-3xl sm:text-4xl font-black text-[var(--color-gray-900)]">5.0</span>
                <Stars />
              </div>
              <p className="text-sm text-[var(--color-gray-500)]">
                {t("google.reviewCount")}
              </p>
            </div>
          </div>
          <p className="text-center text-lg sm:text-xl font-semibold text-[var(--color-gray-900)]">
            {t("google.heading")}
          </p>
        </div>

        {/* Review Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {visible.map((review, i) => (
            <div
              key={`${idx}-${i}`}
              className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-5 md:p-6 shadow-[var(--shadow-card)] transition-all duration-500 animate-fade-in"
            >
              <div className="flex items-center gap-2 mb-3">
                <Stars />
                <span className="text-xs text-[var(--color-gray-400)]">{t(review.timeAgo)}</span>
              </div>
              <blockquote className="text-sm text-[var(--color-gray-700)] leading-relaxed line-clamp-3">
                &ldquo;{t(review.text)}&rdquo;
              </blockquote>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-brand-50)] text-xs font-bold text-[var(--color-brand-dark)]">
                  {review.name[0]}
                </div>
                <span className="text-sm font-semibold text-[var(--color-gray-900)]">{review.name}</span>
                <GoogleIcon className="ml-auto h-4 w-4 opacity-40" />
              </div>
            </div>
          ))}
        </div>

        {/* See All on Google link */}
        <div className="mt-8 text-center">
          <a
            href={GOOGLE_REVIEWS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-gray-200)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--color-gray-700)] shadow-[var(--shadow-card)] transition-all hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5"
          >
            <GoogleIcon className="h-4 w-4" />
            {t("google.seeAll")}
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
