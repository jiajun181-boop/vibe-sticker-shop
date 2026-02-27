"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";

/**
 * Maps each category to relevant FAQ question keys (from the existing 28-question FAQ).
 * Keys reference: faq.{category}.q{N} / faq.{category}.a{N}
 */
const CATEGORY_FAQ_MAP = {
  "stickers-labels-decals": [
    { cat: "files", n: 1 },     // accepted file formats
    { cat: "files", n: 3 },     // what is bleed
    { cat: "production", n: 1 }, // standard turnaround
    { cat: "ordering", n: 3 },  // minimum order qty
    { cat: "proofs", n: 1 },    // what is proof
    { cat: "shipping", n: 1 },  // shipping time
  ],
  "marketing-business-print": [
    { cat: "ordering", n: 1 },  // how to place order
    { cat: "files", n: 1 },     // accepted formats
    { cat: "files", n: 2 },     // what DPI
    { cat: "proofs", n: 1 },    // what is proof
    { cat: "production", n: 1 }, // turnaround
    { cat: "payment", n: 3 },   // volume discounts
  ],
  "signs-rigid-boards": [
    { cat: "ordering", n: 3 },  // minimum qty
    { cat: "files", n: 1 },     // formats
    { cat: "production", n: 1 }, // turnaround
    { cat: "production", n: 2 }, // rush
    { cat: "shipping", n: 1 },  // shipping
    { cat: "returns", n: 1 },   // return policy
  ],
  "banners-displays": [
    { cat: "files", n: 1 },     // formats
    { cat: "files", n: 3 },     // bleed
    { cat: "production", n: 1 }, // turnaround
    { cat: "production", n: 2 }, // rush
    { cat: "shipping", n: 1 },  // shipping
    { cat: "ordering", n: 4 },  // custom quotes
  ],
  "windows-walls-floors": [
    { cat: "ordering", n: 4 },  // custom quotes
    { cat: "files", n: 1 },     // formats
    { cat: "design", n: 1 },    // design team
    { cat: "production", n: 1 }, // turnaround
    { cat: "shipping", n: 3 },  // local pickup
    { cat: "returns", n: 1 },   // return policy
  ],
  "canvas-prints": [
    { cat: "files", n: 2 },     // DPI
    { cat: "files", n: 4 },     // photo quality
    { cat: "production", n: 1 }, // turnaround
    { cat: "proofs", n: 1 },    // proof
    { cat: "shipping", n: 1 },  // shipping
    { cat: "returns", n: 1 },   // returns
  ],
  "vehicle-graphics-fleet": [
    { cat: "ordering", n: 4 },  // custom quotes
    { cat: "design", n: 1 },    // design team
    { cat: "design", n: 2 },    // rough ideas
    { cat: "production", n: 1 }, // turnaround
    { cat: "shipping", n: 3 },  // local pickup
    { cat: "returns", n: 1 },   // returns
  ],
};

export default function CategoryFaq({ category }) {
  const { t } = useTranslation();
  const [openIdx, setOpenIdx] = useState(null);

  const faqKeys = CATEGORY_FAQ_MAP[category];
  if (!faqKeys || faqKeys.length === 0) return null;

  const items = faqKeys.map(({ cat, n }) => ({
    question: t(`faq.${cat}.q${n}`),
    answer: t(`faq.${cat}.a${n}`),
  }));

  return (
    <section className="mt-12">
      <h2 className="text-xl font-semibold tracking-tight text-[var(--color-gray-900)]">
        {t("categoryFaq.title")}
      </h2>
      <div className="mt-4 divide-y divide-[var(--color-gray-200)] rounded-2xl border border-[var(--color-gray-200)] bg-white">
        {items.map((item, i) => (
          <details
            key={i}
            open={openIdx === i}
            onToggle={(e) => setOpenIdx(e.target.open ? i : null)}
            className="group"
          >
            <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-sm font-medium text-[var(--color-gray-900)] hover:bg-[var(--color-gray-50)] [&::-webkit-details-marker]:hidden">
              <span>{item.question}</span>
              <svg
                className="h-4 w-4 shrink-0 text-[var(--color-gray-400)] transition-transform group-open:rotate-180"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </summary>
            <div className="px-5 pb-4 text-sm leading-relaxed text-[var(--color-gray-600)]">
              {item.answer}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
