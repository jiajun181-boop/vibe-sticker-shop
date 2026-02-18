"use client";

import React from "react";

/**
 * Pricing Tier Display
 * Shows volume pricing tiers in an elegant grid
 * Call and Response: Hover to highlight tier
 */
export default function PricingTierGrid({
  tiers = [
    { quantity: "1-10", unitPrice: 2.5, total: 25, badge: "Start" },
    { quantity: "11-50", unitPrice: 2.0, total: 100, badge: "Popular" },
    { quantity: "51-100", unitPrice: 1.5, total: 150, badge: "" },
    { quantity: "100+", unitPrice: 1.0, total: null, badge: "Best Value" },
  ],
  currency = "CAD",
}) {
  return (
    <div className="w-full space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-gray-700)]">
        Volume Pricing
      </h3>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiers.map((tier, idx) => (
          <div
            key={idx}
            className="group relative rounded-2xl border-2 border-[var(--color-gray-200)] bg-white p-6 transition-all duration-300 hover:shadow-lg hover:border-[var(--color-ink-black)] hover:scale-105"
          >
            {/* Decorative ring on hover */}
            <div className="absolute -top-8 -right-8 w-16 h-16 border-2 border-[var(--color-ink-black)] rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-500" />

            {/* Badge */}
            {tier.badge && (
              <div className="mb-3 inline-block bg-[var(--color-ink-black)] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white rounded-xl">
                {tier.badge}
              </div>
            )}

            {/* Quantity Range */}
            <p className="text-xs uppercase tracking-wide text-[var(--color-gray-600)]">{tier.quantity}</p>

            {/* Unit Price */}
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-[var(--color-ink-black)]">
                ${tier.unitPrice}
              </span>
              <span className="text-xs text-[var(--color-gray-500)]">/unit</span>
            </div>

            {/* Total for 50 units example */}
            {tier.total && (
              <div className="mt-4 border-t border-[var(--color-gray-200)] pt-4">
                <p className="text-xs text-[var(--color-gray-600)]">50 units:</p>
                <p className="text-xl font-bold text-[var(--color-ink-black)]">
                  ${tier.total}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Savings indicator */}
      <div className="text-center text-xs text-[var(--color-gray-600)] mt-4">
        Save up to <span className="font-bold text-[var(--color-ink-black)]">60%</span> with volume discounts
      </div>
    </div>
  );
}
