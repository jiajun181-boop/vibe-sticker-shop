"use client";

import { FAQSchema } from "@/components/JsonLd";

/**
 * FAQ accordion with FAQPage JSON-LD structured data.
 *
 * Props:
 *  - items: [{ question, answer }]
 *  - title: section heading (default: "Frequently Asked Questions")
 */
export default function FaqAccordion({ items, title = "Frequently Asked Questions" }) {
  if (!items || items.length === 0) return null;

  return (
    <section>
      <FAQSchema items={items} />
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
      <div className="space-y-3">
        {items.map((item, i) => (
          <details
            key={i}
            className="group rounded-xl border border-gray-200 bg-white shadow-sm"
          >
            <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-semibold text-gray-900">
              {item.question}
              <svg
                className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-open:rotate-180"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="px-5 pb-4 text-sm leading-relaxed text-gray-600">
              {item.answer}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
