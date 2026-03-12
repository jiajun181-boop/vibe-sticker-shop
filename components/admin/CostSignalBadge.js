"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";

/**
 * CostSignalBadge — shared, consistent rendering of pricing/cost health signals.
 *
 * Used on: production list, production detail, order detail, workstation.
 * Renders nothing for "normal" signals (by design — only surfaces risk).
 *
 * When `signal.nextAction.url` exists, renders as a clickable link that routes
 * the operator directly to the resolution target. Otherwise renders as a span.
 *
 * Props:
 *   signal  — { level, reason, nextAction?: { url, summary, action } }
 *   size    — "sm" (inline, 10px) | "md" (badge, xs) | "lg" (pill, sm) — default "md"
 */

const STYLES = {
  "needs-review": {
    sm: "font-bold uppercase text-red-600",
    md: "rounded-[2px] bg-red-100 px-2 py-0.5 text-xs font-bold uppercase text-red-700",
    lg: "rounded-[3px] bg-red-100 px-3 py-1 text-sm font-bold uppercase text-red-700 border border-red-200",
  },
  "missing-cost": {
    sm: "font-bold uppercase text-amber-600",
    md: "rounded-[2px] bg-amber-100 px-2 py-0.5 text-xs font-bold uppercase text-amber-700",
    lg: "rounded-[3px] bg-amber-100 px-3 py-1 text-sm font-bold uppercase text-amber-700 border border-amber-200",
  },
};

const LINK_EXTRA = {
  "needs-review": "hover:bg-red-200 cursor-pointer transition-colors",
  "missing-cost": "hover:bg-amber-200 cursor-pointer transition-colors",
};

const LABEL_KEYS = {
  "needs-review": "admin.costSignal.pricingReview",
  "missing-cost": "admin.costSignal.missingCost",
};

const INLINE_LABEL_KEYS = {
  "needs-review": "admin.costSignal.pricing",
  "missing-cost": "admin.costSignal.cost",
};

export default function CostSignalBadge({ signal, size = "md" }) {
  const { t } = useTranslation();
  if (!signal || signal.level === "normal") return null;

  const styles = STYLES[signal.level] || STYLES["missing-cost"];
  const linkExtra = LINK_EXTRA[signal.level] || "";
  const label = t(LABEL_KEYS[signal.level] || "admin.costSignal.missingCost");
  const className = styles[size] || styles.md;
  const url = signal.nextAction?.url;
  const tooltip = signal.nextAction?.summary || signal.reason;

  if (url) {
    return (
      <Link href={url} className={`${className} ${linkExtra}`} title={tooltip}>
        {label}
      </Link>
    );
  }

  return (
    <span className={className} title={signal.reason}>
      {label}
    </span>
  );
}

/**
 * Inline variant for use in text rows (e.g., specs line in production table).
 * Prefixes with warning indicator. Links to resolution target when available.
 */
export function CostSignalInline({ signal }) {
  const { t } = useTranslation();
  if (!signal || signal.level === "normal") return null;

  const isReview = signal.level === "needs-review";
  const color = isReview ? "text-red-600" : "text-amber-600";
  const label = t(INLINE_LABEL_KEYS[signal.level] || "admin.costSignal.cost");
  const url = signal.nextAction?.url;
  const tooltip = signal.nextAction?.summary || signal.reason;

  if (url) {
    return (
      <Link
        href={url}
        className={`font-bold uppercase ${color} hover:underline`}
        title={tooltip}
      >
        {label}
      </Link>
    );
  }

  return (
    <span
      className={`font-bold uppercase ${color}`}
      title={signal.reason}
    >
      {label}
    </span>
  );
}
