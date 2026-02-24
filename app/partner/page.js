"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { useLocale } from "@/lib/i18n";

const TIER_LABELS = { bronze: "Bronze", silver: "Silver", gold: "Gold", platinum: "Platinum" };
const TIER_LABELS_ZH = { bronze: "铜牌", silver: "银牌", gold: "金牌", platinum: "铂金" };
const TIER_COLORS = {
  bronze: "from-amber-600 to-amber-800",
  silver: "from-gray-400 to-gray-600",
  gold: "from-yellow-500 to-yellow-700",
  platinum: "from-purple-500 to-purple-700",
};

const STATUS_BADGE = {
  pending: { label: "Pending", labelZh: "待处理", cls: "bg-amber-100 text-amber-700" },
  paid: { label: "Paid", labelZh: "已付款", cls: "bg-emerald-100 text-emerald-700" },
  canceled: { label: "Canceled", labelZh: "已取消", cls: "bg-red-100 text-red-700" },
  refunded: { label: "Refunded", labelZh: "已退款", cls: "bg-gray-100 text-gray-700" },
  shipped: { label: "Shipped", labelZh: "已发货", cls: "bg-blue-100 text-blue-700" },
  processing: { label: "Processing", labelZh: "处理中", cls: "bg-indigo-100 text-indigo-700" },
};

export default function PartnerPage() {
  const locale = useLocale();
  const isZh = locale === "zh";

  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="text-sm text-[#999]">{isZh ? "加载中..." : "Loading..."}</div></div>}>
      <PartnerDashboard />
    </Suspense>
  );
}

function PartnerDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isWelcome = searchParams.get("welcome") === "1";
  const locale = useLocale();
  const isZh = locale === "zh";

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
      .catch(() => setError(isZh ? "加载失败" : "Failed to load"))
      .finally(() => setLoading(false));
  }, [router, isZh]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f6f0]">
        <div className="text-sm text-[#9a9184]">{isZh ? "加载合作伙伴面板..." : "Loading partner dashboard..."}</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f6f0]">
        <div className="text-sm text-red-600">{error || (isZh ? "出错了" : "Something went wrong")}</div>
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
            <h2 className="text-sm font-semibold text-emerald-800">{isZh ? "欢迎加入合作伙伴计划！" : "Welcome to the partner program!"}</h2>
            <p className="mt-1 text-xs text-emerald-700">{isZh ? "您的账户已设置批发定价。立即开始购物，享受合作伙伴折扣。" : "Your account has been set up with wholesale pricing. Start shopping to enjoy your partner discount."}</p>
          </div>
        )}

        {/* Header card */}
        <div className={`rounded-xl bg-gradient-to-br ${tierGradient} p-6 text-[#fff] shadow-lg sm:p-8`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[#fff]/60">{isZh ? "合作伙伴面板" : "Partner Dashboard"}</p>
              <h1 className="mt-1 text-xl font-bold sm:text-2xl">{user.companyName || user.name}</h1>
              <p className="mt-1 text-sm text-[#fff]/70">{user.email}</p>
            </div>
            <div className="text-right">
              <div className="rounded-xl bg-white/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                {isZh ? TIER_LABELS_ZH[tier] : TIER_LABELS[tier]} {isZh ? "合作伙伴" : "Partner"}
              </div>
              {user.partnerDiscount > 0 && (
                <p className="mt-2 text-lg font-bold">{user.partnerDiscount}% {isZh ? "折扣" : "off"}</p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-[11px] font-medium uppercase tracking-wider text-[#fff]/60">{isZh ? "总订单" : "Total Orders"}</p>
              <p className="mt-1 text-xl font-bold">{stats.orderCount}</p>
            </div>
            <div className="rounded-lg bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-[11px] font-medium uppercase tracking-wider text-[#fff]/60">{isZh ? "总消费" : "Total Spent"}</p>
              <p className="mt-1 text-xl font-bold">${(stats.totalSpent / 100).toLocaleString("en-CA", { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="rounded-lg bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-[11px] font-medium uppercase tracking-wider text-[#fff]/60">{isZh ? "推荐" : "Referrals"}</p>
              <p className="mt-1 text-xl font-bold">{stats.referralCount}</p>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Link href="/shop" className="flex items-center gap-3 rounded-xl border border-[#e0dbd0] bg-white p-4 transition-colors hover:border-[#7A1028]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f8f6f0] text-lg">🛒</div>
            <div>
              <p className="text-sm font-semibold text-[#1a1816]">{isZh ? "浏览商店" : "Browse Shop"}</p>
              <p className="text-[11px] text-[#9a9184]">{isZh ? "使用合作伙伴价格下单" : "Order with partner pricing"}</p>
            </div>
          </Link>
          <Link href="/quote" className="flex items-center gap-3 rounded-xl border border-[#e0dbd0] bg-white p-4 transition-colors hover:border-[#7A1028]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f8f6f0] text-lg">📋</div>
            <div>
              <p className="text-sm font-semibold text-[#1a1816]">{isZh ? "获取报价" : "Request Quote"}</p>
              <p className="text-[11px] text-[#9a9184]">{isZh ? "定制或批量订单" : "Custom or bulk orders"}</p>
            </div>
          </Link>
          <Link href="/account/profile" className="flex items-center gap-3 rounded-xl border border-[#e0dbd0] bg-white p-4 transition-colors hover:border-[#7A1028]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f8f6f0] text-lg">⚙️</div>
            <div>
              <p className="text-sm font-semibold text-[#1a1816]">{isZh ? "账户设置" : "Account Settings"}</p>
              <p className="text-[11px] text-[#9a9184]">{isZh ? "个人资料、地址、密码" : "Profile, addresses, password"}</p>
            </div>
          </Link>
        </div>

        {/* Recent orders */}
        <div className="mt-6 rounded-xl border border-[#e0dbd0] bg-white">
          <div className="flex items-center justify-between border-b border-[#e0dbd0] px-6 py-4">
            <h2 className="text-sm font-semibold text-[#1a1816]">{isZh ? "最近订单" : "Recent Orders"}</h2>
            <Link href="/account" className="text-xs font-medium text-[#7A1028] hover:underline">{isZh ? "查看全部" : "View all"}</Link>
          </div>

          {orders.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-[#9a9184]">
              {isZh ? "暂无订单。" : "No orders yet."} <Link href="/shop" className="text-[#7A1028] hover:underline">{isZh ? "去购物吧" : "Start shopping"}</Link>
            </div>
          ) : (
            <div className="divide-y divide-[#e0dbd0]">
              {orders.map((order) => {
                const badge = STATUS_BADGE[order.status] || STATUS_BADGE.pending;
                return (
                  <div key={order.id} className="flex items-center justify-between px-6 py-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#1a1816]">
                        {order.items.map((i) => i.productName).join(", ") || (isZh ? "订单" : "Order")}
                      </p>
                      <p className="mt-0.5 text-xs text-[#9a9184]">
                        {new Date(order.createdAt).toLocaleDateString(isZh ? "zh-CN" : "en-CA")} · {order.items.reduce((s, i) => s + i.quantity, 0)} {isZh ? "件" : "items"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className={`rounded-[2px] px-2 py-0.5 text-[10px] font-semibold ${badge.cls}`}>
                        {isZh ? badge.labelZh : badge.label}
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
          <h2 className="mb-4 text-sm font-semibold text-[#1a1816]">{isZh ? "您的合作伙伴权益" : "Your Partner Benefits"}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: "💰", title: isZh ? `${user.partnerDiscount}% 批发折扣` : `${user.partnerDiscount}% Wholesale Discount`, desc: isZh ? "结账时自动应用" : "Applied automatically at checkout" },
              { icon: "⚡", title: isZh ? "优先生产" : "Priority Production", desc: isZh ? "您的订单优先处理" : "Your orders are processed first" },
              { icon: "📦", title: isZh ? "白标发货" : "White-Label Fulfillment", desc: isZh ? "直接发给您的客户" : "Ship directly to your customers" },
              { icon: "📞", title: isZh ? "专属支持" : "Dedicated Support", desc: isZh ? "直达合作伙伴团队" : "Direct line to our partner team" },
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
