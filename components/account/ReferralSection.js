"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Referral program section for the account dashboard.
 * Shows the user's invite code, share link, and referral stats.
 *
 * Props:
 *  - t: translation function
 */
export default function ReferralSection({ t }) {
  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/account/referral")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = useCallback(() => {
    if (!data?.referralLink) return;
    navigator.clipboard.writeText(data.referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [data]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="h-5 w-40 animate-pulse rounded bg-gray-100" />
        <div className="mt-4 h-12 animate-pulse rounded bg-gray-100" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100">
          <svg className="h-5 w-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">
            {t?.("account.referralTitle") || "Refer a Friend"}
          </h3>
          <p className="text-xs text-gray-500">
            {t?.("account.referralDesc") || "Share your link and both get $20 off"}
          </p>
        </div>
      </div>

      {/* Invite code */}
      <div className="rounded-lg border-2 border-dashed border-violet-200 bg-violet-50 px-4 py-3 text-center">
        <p className="text-xs text-violet-500">{t?.("account.yourCode") || "Your referral code"}</p>
        <p className="mt-1 text-2xl font-black tracking-widest text-violet-700">{data.inviteCode}</p>
      </div>

      {/* Share link */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          readOnly
          value={data.referralLink}
          className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600"
        />
        <button
          type="button"
          onClick={handleCopy}
          className={`shrink-0 rounded-lg px-4 py-2 text-xs font-bold transition-colors ${
            copied
              ? "bg-emerald-100 text-emerald-700"
              : "bg-violet-600 text-white hover:bg-violet-700"
          }`}
        >
          {copied ? (t?.("account.copied") || "Copied!") : (t?.("account.copyLink") || "Copy Link")}
        </button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 border-t border-gray-100 pt-3">
        <div>
          <p className="text-2xl font-black text-gray-900">{data.referralCount}</p>
          <p className="text-xs text-gray-500">{t?.("account.referralsCount") || "Friends referred"}</p>
        </div>
        <div>
          <p className="text-2xl font-black text-emerald-600">${data.referralCount * 20}</p>
          <p className="text-xs text-gray-500">{t?.("account.earned") || "Credits earned"}</p>
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-lg bg-gray-50 px-4 py-3 space-y-1.5">
        <p className="text-xs font-semibold text-gray-600">{t?.("account.referralHow") || "How it works"}</p>
        <ol className="list-decimal list-inside space-y-1 text-xs text-gray-500">
          <li>{t?.("account.referralStep1") || "Share your unique link with friends"}</li>
          <li>{t?.("account.referralStep2") || "They get $20 off their first order"}</li>
          <li>{t?.("account.referralStep3") || "You get a $20 credit when they order"}</li>
        </ol>
      </div>
    </div>
  );
}
