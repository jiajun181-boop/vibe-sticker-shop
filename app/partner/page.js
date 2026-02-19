"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

const TIER_LABELS = { bronze: "Bronze", silver: "Silver", gold: "Gold", platinum: "Platinum" };
const TIER_COLORS = {
  bronze: "from-amber-600 to-amber-800",
  silver: "from-gray-400 to-gray-600",
  gold: "from-yellow-500 to-yellow-700",
  platinum: "from-purple-500 to-purple-700",
};

const STATUS_BADGE = {
  pending: { label: "Pending", cls: "bg-amber-100 text-amber-700" },
  paid: { label: "Paid", cls: "bg-emerald-100 text-emerald-700" },
  canceled: { label: "Canceled", cls: "bg-red-100 text-red-700" },
  refunded: { label: "Refunded", cls: "bg-gray-100 text-gray-700" },
};

export default function PartnerPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="text-sm text-[#999]">Loading...</div></div>}>
      <PartnerDashboard />
    </Suspense>
  );
}

function PartnerDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isWelcome = searchParams.get("welcome") === "1";

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/partner")
      .then((r) => {
        if (r.status === 401) { router.push("/login?redirect=/partner"); return null; }
        if (r.status === 403) { router.push("/account"); return null; }
        return r.json();
      })
      .then((d) => { if (d) setData(d); })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f6f0]">
        <div className="text-sm text-[#9a9184]">Loading partner dashboard...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f6f0]">
        <div className="text-sm text-red-600">{error || "Something went wrong"}</div>
      </div>
    );
  }

  const { user, orders, stats } = data;
  const tier = user.partnerTier || "bronze";
  const tierGradient = TIER_COLORS[tier] || TIER_COLORS.bronze;

  return (
    <div className="min-h-screen bg-[#f8f6f0]">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Welcome banner */}
        {isWelcome && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-4">
            <h2 className="text-sm font-semibold text-emerald-800">Welcome to the partner program!</h2>
            <p className="mt-1 text-xs text-emerald-700">Your account has been set up with wholesale pricing. Start shopping to enjoy your partner discount.</p>
          </div>
        )}

        {/* Header card */}
        <div className={`rounded-xl bg-gradient-to-br ${tierGradient} p-6 text-white shadow-lg sm:p-8`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-white/60">Partner Dashboard</p>
              <h1 className="mt-1 text-xl font-bold sm:text-2xl">{user.companyName || user.name}</h1>
              <p className="mt-1 text-sm text-white/70">{user.email}</p>
            </div>
            <div className="text-right">
              <div className="rounded-xl bg-white/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                {TIER_LABELS[tier]} Partner
              </div>
              {user.partnerDiscount > 0 && (
                <p className="mt-2 text-lg font-bold">{user.partnerDiscount}% off</p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-[11px] font-medium uppercase tracking-wider text-white/60">Total Orders</p>
              <p className="mt-1 text-xl font-bold">{stats.orderCount}</p>
            </div>
            <div className="rounded-lg bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-[11px] font-medium uppercase tracking-wider text-white/60">Total Spent</p>
              <p className="mt-1 text-xl font-bold">${(stats.totalSpent / 100).toLocaleString("en-CA", { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="rounded-lg bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-[11px] font-medium uppercase tracking-wider text-white/60">Referrals</p>
              <p className="mt-1 text-xl font-bold">{stats.referralCount}</p>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Link href="/shop" className="flex items-center gap-3 rounded-xl border border-[#e0dbd0] bg-white p-4 transition-colors hover:border-[#7A1028]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f8f6f0] text-lg">🛒</div>
            <div>
              <p className="text-sm font-semibold text-[#1a1816]">Browse Shop</p>
              <p className="text-[11px] text-[#9a9184]">Order with partner pricing</p>
            </div>
          </Link>
          <Link href="/quote" className="flex items-center gap-3 rounded-xl border border-[#e0dbd0] bg-white p-4 transition-colors hover:border-[#7A1028]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f8f6f0] text-lg">📋</div>
            <div>
              <p className="text-sm font-semibold text-[#1a1816]">Request Quote</p>
              <p className="text-[11px] text-[#9a9184]">Custom or bulk orders</p>
            </div>
          </Link>
          <Link href="/account/profile" className="flex items-center gap-3 rounded-xl border border-[#e0dbd0] bg-white p-4 transition-colors hover:border-[#7A1028]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f8f6f0] text-lg">⚙️</div>
            <div>
              <p className="text-sm font-semibold text-[#1a1816]">Account Settings</p>
              <p className="text-[11px] text-[#9a9184]">Profile, addresses, password</p>
            </div>
          </Link>
        </div>

        {/* Recent orders */}
        <div className="mt-6 rounded-xl border border-[#e0dbd0] bg-white">
          <div className="flex items-center justify-between border-b border-[#e0dbd0] px-6 py-4">
            <h2 className="text-sm font-semibold text-[#1a1816]">Recent Orders</h2>
            <Link href="/account" className="text-xs font-medium text-[#7A1028] hover:underline">View all</Link>
          </div>

          {orders.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-[#9a9184]">
              No orders yet. <Link href="/shop" className="text-[#7A1028] hover:underline">Start shopping</Link>
            </div>
          ) : (
            <div className="divide-y divide-[#e0dbd0]">
              {orders.map((order) => {
                const badge = STATUS_BADGE[order.status] || STATUS_BADGE.pending;
                return (
                  <div key={order.id} className="flex items-center justify-between px-6 py-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#1a1816]">
                        {order.items.map((i) => i.productName).join(", ") || "Order"}
                      </p>
                      <p className="mt-0.5 text-xs text-[#9a9184]">
                        {new Date(order.createdAt).toLocaleDateString("en-CA")} · {order.items.reduce((s, i) => s + i.quantity, 0)} items
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className={`rounded-[2px] px-2 py-0.5 text-[10px] font-semibold ${badge.cls}`}>
                        {badge.label}
                      </span>
                      <span className="text-sm font-semibold text-[#1a1816]">
                        ${(order.totalAmount / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Partner benefits */}
        <div className="mt-6 rounded-xl border border-[#e0dbd0] bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-[#1a1816]">Your Partner Benefits</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: "💰", title: `${user.partnerDiscount}% Wholesale Discount`, desc: "Applied automatically at checkout" },
              { icon: "⚡", title: "Priority Production", desc: "Your orders are processed first" },
              { icon: "📦", title: "White-Label Fulfillment", desc: "Ship directly to your customers" },
              { icon: "📞", title: "Dedicated Support", desc: "Direct line to our partner team" },
            ].map((b) => (
              <div key={b.title} className="flex gap-3 rounded-lg bg-[#f8f6f0] p-3">
                <span className="text-lg">{b.icon}</span>
                <div>
                  <p className="text-xs font-semibold text-[#1a1816]">{b.title}</p>
                  <p className="text-[11px] text-[#9a9184]">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
