"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";

const cad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

const BUNDLES = [
  {
    id: "trade-show-starter",
    nameKey: "bundles.kit.tradeShow.name",
    price: 29900,
    originalPrice: 34900,
    savings: 5000,
    color: "from-[var(--color-moon-blue)] to-[var(--color-moon-blue-deep)]",
    itemKeys: [
      "bundles.kit.tradeShow.item1",
      "bundles.kit.tradeShow.item2",
    ],
    ctaKey: "bundles.kit.tradeShow.cta",
    href: "/shop?category=display-stands",
  },
  {
    id: "premium-display",
    nameKey: "bundles.kit.premium.name",
    price: 54900,
    originalPrice: 66900,
    savings: 12000,
    color: "from-gray-800 to-gray-950",
    itemKeys: [
      "bundles.kit.premium.item1",
      "bundles.kit.premium.item2",
      "bundles.kit.premium.item3",
    ],
    ctaKey: "bundles.kit.premium.cta",
    href: "/shop?category=display-stands",
    popular: true,
  },
  {
    id: "fleet-branding",
    nameKey: "bundles.kit.fleet.name",
    price: 19900,
    originalPrice: 23900,
    savings: 4000,
    color: "from-orange-500 to-red-600",
    itemKeys: [
      "bundles.kit.fleet.item1",
      "bundles.kit.fleet.item2",
      "bundles.kit.fleet.item3",
    ],
    ctaKey: "bundles.kit.fleet.cta",
    href: "/shop?category=fleet-compliance-id",
  },
];

export default function BundlesSection() {
  const { t } = useTranslation();

  return (
    <section>
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-moon-gold)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            {t("bundles.badge")}
          </span>
        </div>
        <h2 className="text-3xl md:text-4xl font-black tracking-tight">
          {t("bundles.title")}
        </h2>
        <p className="text-gray-400 text-sm mt-2 max-w-lg mx-auto">
          {t("bundles.subtitle")}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {BUNDLES.map((bundle) => (
          <div
            key={bundle.id}
            className={`relative bg-white rounded-3xl border ${
              bundle.popular ? "border-amber-200 shadow-lg shadow-amber-100/50" : "border-gray-100"
            } overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}
          >
            {bundle.popular && (
              <div className="absolute -top-px -right-px">
                <div className="bg-gradient-to-r from-[var(--color-moon-gold)] to-amber-600 text-white text-[9px] font-black uppercase tracking-wider px-4 py-1.5 rounded-bl-xl">
                  {t("bundles.mostPopular")}
                </div>
              </div>
            )}

            {/* Gradient header */}
            <div className={`bg-gradient-to-br ${bundle.color} p-6 text-white`}>
              <h3 className="font-black text-lg">{t(bundle.nameKey)}</h3>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black tracking-tight">{cad(bundle.price)}</span>
                <span className="text-white/60 line-through text-sm">{cad(bundle.originalPrice)}</span>
              </div>
              <div className="inline-block bg-white/20 text-[10px] font-bold px-2.5 py-1 rounded-full mt-2">
                {t("bundles.save")} {cad(bundle.savings)}
              </div>
            </div>

            {/* Items list */}
            <div className="p-6">
              <ul className="space-y-2.5 mb-6">
                {bundle.itemKeys.map((itemKey, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {t(itemKey)}
                  </li>
                ))}
              </ul>

              <Link
                href={bundle.href}
                className={`block w-full text-center py-3.5 rounded-xl font-black uppercase text-xs tracking-widest transition-colors ${
                  bundle.popular
                    ? "bg-black text-white hover:bg-gray-800"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {t(bundle.ctaKey)}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
