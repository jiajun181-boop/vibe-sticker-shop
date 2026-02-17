"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";

function useText() {
  const { t } = useTranslation();
  return (key, fallback) => {
    const value = t(key);
    return value === key ? fallback : value;
  };
}

const ENTRY_CARDS = [
  {
    id: "category",
    href: "/shop?view=category",
    title: "Browse by Category",
    subtitle: "Know what you need? Jump straight to product groups.",
    label: "Fast navigation",
  },
  {
    id: "use-case",
    href: "/shop",
    title: "Shop by Use Case",
    subtitle: "New to print? Start from real business scenarios.",
    label: "Guided choice",
  },
  {
    id: "flow",
    href: "/quote",
    title: "Get Service Flow",
    subtitle: "Need custom work? Send requirements and get a clear timeline.",
    label: "Custom project",
  },
];

const FLOW_STEPS = [
  "Submit request",
  "File check",
  "Proof confirm",
  "Production",
  "Delivery",
];

export default function HomeLandingHighlights() {
  const tx = useText();

  return (
    <section className="relative py-14 sm:py-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-40 w-[52rem] -translate-x-1/2 rounded-full bg-[var(--color-moon-gold-glow)] blur-3xl opacity-50" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="animate-on-scroll rounded-3xl border border-[var(--color-gray-200)] bg-white p-5 shadow-sm sm:p-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="label-xs text-[var(--color-gray-500)]">
                {tx("home.shopByUseCase", "Shop by Use Case")}
              </p>
            </div>
            <Link
              href="/shop"
              className="btn-secondary-pill btn-sm"
            >
              {tx("common.browseAll", "Browse All Products")}
            </Link>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {ENTRY_CARDS.map((card, idx) => (
              <Link
                key={card.id}
                href={card.href}
                className={`animate-on-scroll delay-${Math.min(idx + 1, 5)} group rounded-2xl border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-gray-400)] hover:bg-white`}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-500)]">
                  {card.label}
                </p>
                <h3 className="mt-2 text-base font-semibold text-[var(--color-gray-900)]">
                  {card.title}
                </h3>
                <p className="mt-1 text-sm text-[var(--color-gray-600)]">
                  {card.subtitle}
                </p>
                <span className="mt-3 inline-flex items-center text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-gray-700)] transition-transform group-hover:translate-x-0.5">
                  Open
                </span>
              </Link>
            ))}
          </div>

          <div className="animate-on-scroll delay-2 mt-6 rounded-2xl border border-[var(--color-gray-200)] bg-[var(--color-paper-cream)] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-500)]">
              Service Flow
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {FLOW_STEPS.map((step, idx) => (
                <div key={step} className="rounded-xl border border-[var(--color-gray-200)] bg-white px-3 py-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-gray-400)]">
                    {String(idx + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-1 text-sm font-medium text-[var(--color-gray-800)]">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
