"use client";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
    cents / 100
  );

/**
 * Displays a per-unit "from" price on a card.
 * E.g. "From $0.15/ea"
 */
export default function LivePriceTag({ priceCents }) {
  if (!priceCents || priceCents <= 0) return null;

  return (
    <span className="text-sm font-bold text-[var(--color-gray-900)]">
      From {formatCad(priceCents)}/ea
    </span>
  );
}
