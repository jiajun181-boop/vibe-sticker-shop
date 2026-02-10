"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";

const FAQ_CATEGORIES = [
  {
    key: "ordering",
    items: [
      { q: "faq.ordering.q1", a: "faq.ordering.a1" },
      { q: "faq.ordering.q2", a: "faq.ordering.a2" },
      { q: "faq.ordering.q3", a: "faq.ordering.a3" },
    ],
  },
  {
    key: "files",
    items: [
      { q: "faq.files.q1", a: "faq.files.a1" },
      { q: "faq.files.q2", a: "faq.files.a2" },
      { q: "faq.files.q3", a: "faq.files.a3" },
    ],
  },
  {
    key: "shipping",
    items: [
      { q: "faq.shipping.q1", a: "faq.shipping.a1" },
      { q: "faq.shipping.q2", a: "faq.shipping.a2" },
    ],
  },
  {
    key: "returns",
    items: [
      { q: "faq.returns.q1", a: "faq.returns.a1" },
      { q: "faq.returns.q2", a: "faq.returns.a2" },
    ],
  },
  {
    key: "payment",
    items: [
      { q: "faq.payment.q1", a: "faq.payment.a1" },
      { q: "faq.payment.q2", a: "faq.payment.a2" },
    ],
  },
];

export default function FAQClient() {
  const { t } = useTranslation();
  const [openItem, setOpenItem] = useState(null);

  return (
    <div className="space-y-8">
      {FAQ_CATEGORIES.map((cat) => (
        <section key={cat.key} id={cat.key}>
          <h2 className="mb-4 text-lg font-semibold">{t(`faq.category.${cat.key}`)}</h2>
          <div className="space-y-2">
            {cat.items.map((item, i) => {
              const id = `${cat.key}-${i}`;
              const isOpen = openItem === id;
              return (
                <div key={id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                  <button
                    type="button"
                    onClick={() => setOpenItem(isOpen ? null : id)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold text-gray-900"
                  >
                    <span>{t(item.q)}</span>
                    <svg
                      className={`h-4 w-4 flex-shrink-0 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="border-t border-gray-100 px-5 pb-4 pt-3 text-sm leading-relaxed text-gray-600">
                      {t(item.a)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
