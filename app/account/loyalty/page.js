"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";

const TIER_COLORS = {
  bronze: "bg-amber-100 text-amber-800",
  silver: "bg-gray-200 text-gray-700",
  gold: "bg-yellow-100 text-yellow-800",
  platinum: "bg-purple-100 text-purple-800",
};

const TIER_LABEL_KEYS = {
  bronze: "loyalty.tierBronze",
  silver: "loyalty.tierSilver",
  gold: "loyalty.tierGold",
  platinum: "loyalty.tierPlatinum",
};

const TX_ICONS = {
  earn: "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  redeem: "M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z",
  bonus: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z",
  adjust: "M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75",
  expire: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
};

function formatDate(dateStr, locale) {
  return new Date(dateStr).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getTierLabel(t, tier) {
  return TIER_LABEL_KEYS[tier] ? t(TIER_LABEL_KEYS[tier]) : tier;
}

export default function LoyaltyPage() {
  const { t, locale } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/account/loyalty")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then((d) => setData(d))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-lg font-semibold tracking-[0.14em] text-[var(--color-gray-900)]">
          {t("loyalty.title")}
        </h1>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl bg-[var(--color-gray-100)]"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-lg font-semibold tracking-[0.14em] text-[var(--color-gray-900)]">
          {t("loyalty.title")}
        </h1>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-700">{t("loyalty.loadError")}</p>
        </div>
      </div>
    );
  }

  const { account, transactions, nextTier, rules } = data;
  const tierColorClass = TIER_COLORS[account.tier] || TIER_COLORS.bronze;
  const currentTierLabel = getTierLabel(t, account.tier);
  const nextTierLabel = nextTier ? getTierLabel(t, nextTier.name) : "";

  // Progress bar calculation
  let progressPercent = 100;
  if (nextTier) {
    const currentThreshold = rules.tiers[account.tier] || 0;
    const range = nextTier.threshold - currentThreshold;
    const progress = account.totalEarned - currentThreshold;
    progressPercent = range > 0 ? Math.min(100, Math.round((progress / range) * 100)) : 100;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold tracking-[0.14em] text-[var(--color-gray-900)]">
        {t("loyalty.title")}
      </h1>

      {/* Points Balance Card */}
      <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-400)]">
              {t("loyalty.currentBalance")}
            </p>
            <p className="mt-1 text-3xl font-bold text-[var(--color-gray-900)]">
              {account.pointsBalance.toLocaleString()}
            </p>
            <p className="mt-0.5 text-xs text-[var(--color-gray-500)]">
              {t("loyalty.points")}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span
              className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${tierColorClass}`}
            >
              {currentTierLabel}
            </span>
            <p className="mt-1 text-xs text-[var(--color-gray-500)]">
              {t("loyalty.memberSince")}{" "}
              {formatDate(account.createdAt, locale)}
            </p>
          </div>
        </div>

        {/* Tier Progress */}
        {nextTier && (
          <div className="mt-6">
            <div className="flex items-center justify-between text-xs text-[var(--color-gray-500)]">
              <span>{currentTierLabel}</span>
              <span>{nextTierLabel}</span>
            </div>
            <div className="mt-1.5 h-2 w-full rounded-full bg-[var(--color-gray-100)]">
              <div
                className="h-2 rounded-full bg-[var(--color-gray-900)] transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-[var(--color-gray-500)]">
              {t("loyalty.pointsToNext", {
                points: nextTier.pointsNeeded.toLocaleString(),
                tier: nextTierLabel,
              })}
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-[var(--color-gray-100)] pt-4">
          <div>
            <p className="text-xs text-[var(--color-gray-400)]">
              {t("loyalty.totalEarned")}
            </p>
            <p className="text-sm font-semibold text-[var(--color-gray-900)]">
              {account.totalEarned.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-gray-400)]">
              {t("loyalty.totalRedeemed")}
            </p>
            <p className="text-sm font-semibold text-[var(--color-gray-900)]">
              {account.totalRedeemed.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* How to Earn Section */}
      <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-6">
        <h2 className="text-sm font-semibold tracking-[0.12em] text-[var(--color-gray-900)]">
          {t("loyalty.howToEarn")}
        </h2>
        <div className="mt-4 space-y-3">
          <div className="flex items-start gap-3 rounded-xl bg-[var(--color-gray-50)] p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-gray-200)]">
              <svg
                className="h-4 w-4 text-[var(--color-gray-600)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--color-gray-900)]">
                {t("loyalty.earnByPurchase")}
              </p>
              <p className="text-xs text-[var(--color-gray-500)]">
                {t("loyalty.earnRateDesc", {
                  rate: rules.earnRate,
                })}
              </p>
            </div>
          </div>

          {rules.bonusEvents?.firstOrder > 0 && (
            <div className="flex items-start gap-3 rounded-xl bg-[var(--color-gray-50)] p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-gray-200)]">
                <svg
                  className="h-4 w-4 text-[var(--color-gray-600)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={TX_ICONS.bonus}
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--color-gray-900)]">
                  {t("loyalty.firstOrderBonus")}
                </p>
                <p className="text-xs text-[var(--color-gray-500)]">
                  {t("loyalty.firstOrderBonusDesc", {
                    points: rules.bonusEvents.firstOrder,
                  })}
                </p>
              </div>
            </div>
          )}

          {rules.bonusEvents?.referral > 0 && (
            <div className="flex items-start gap-3 rounded-xl bg-[var(--color-gray-50)] p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-gray-200)]">
                <svg
                  className="h-4 w-4 text-[var(--color-gray-600)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--color-gray-900)]">
                  {t("loyalty.referralBonus")}
                </p>
                <p className="text-xs text-[var(--color-gray-500)]">
                  {t("loyalty.referralBonusDesc", {
                    points: rules.bonusEvents.referral,
                  })}
                </p>
              </div>
            </div>
          )}

          {rules.bonusEvents?.review > 0 && (
            <div className="flex items-start gap-3 rounded-xl bg-[var(--color-gray-50)] p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-gray-200)]">
                <svg
                  className="h-4 w-4 text-[var(--color-gray-600)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--color-gray-900)]">
                  {t("loyalty.reviewBonus")}
                </p>
                <p className="text-xs text-[var(--color-gray-500)]">
                  {t("loyalty.reviewBonusDesc", {
                    points: rules.bonusEvents.review,
                  })}
                </p>
              </div>
            </div>
          )}

          {/* Redemption info */}
          <div className="mt-2 rounded-xl border border-dashed border-[var(--color-gray-300)] p-3">
            <p className="text-xs font-medium text-[var(--color-gray-700)]">
              {t("loyalty.redeemInfo")}
            </p>
            <p className="mt-0.5 text-xs text-[var(--color-gray-500)]">
              {t("loyalty.redeemInfoDesc", {
                rate: rules.redeemRate,
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Tier Breakdown */}
      <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-6">
        <h2 className="text-sm font-semibold tracking-[0.12em] text-[var(--color-gray-900)]">
          {t("loyalty.tierLevels")}
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Object.entries(rules.tiers)
            .sort(([, a], [, b]) => a - b)
            .map(([name, threshold]) => {
              const isActive = name === account.tier;
              return (
                <div
                  key={name}
                  className={`rounded-xl border p-3 text-center transition-colors ${
                    isActive
                      ? "border-[var(--color-gray-900)] bg-[var(--color-gray-50)]"
                      : "border-[var(--color-gray-200)]"
                  }`}
                >
                  <p
                  className={`text-xs font-bold uppercase tracking-[0.12em] ${
                    isActive
                      ? "text-[var(--color-gray-900)]"
                      : "text-[var(--color-gray-500)]"
                  }`}
                >
                    {getTierLabel(t, name)}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-gray-600)]">
                    {threshold.toLocaleString()} {t("loyalty.pts")}
                  </p>
                  {isActive && (
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-gray-900)]">
                      {t("loyalty.currentTier")}
                    </p>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-6">
        <h2 className="text-sm font-semibold tracking-[0.12em] text-[var(--color-gray-900)]">
          {t("loyalty.recentActivity")}
        </h2>

        {transactions.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-[var(--color-gray-300)] p-8 text-center">
            <p className="text-sm text-[var(--color-gray-500)]">
              {t("loyalty.noActivity")}
            </p>
            <p className="mt-1 text-xs text-[var(--color-gray-400)]">
              {t("loyalty.noActivityHint")}
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {transactions.map((tx) => {
              const isPositive = tx.points > 0;
              const icon = TX_ICONS[tx.type] || TX_ICONS.adjust;
              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-[var(--color-gray-50)]"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-gray-100)]">
                    <svg
                      className="h-4 w-4 text-[var(--color-gray-500)]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d={icon}
                      />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--color-gray-900)]">
                      {tx.description}
                    </p>
                    <p className="text-xs text-[var(--color-gray-400)]">
                      {formatDate(tx.createdAt, locale)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-bold ${
                      isPositive
                        ? "text-emerald-600"
                        : "text-red-600"
                    }`}
                  >
                    {isPositive ? "+" : ""}
                    {tx.points.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
