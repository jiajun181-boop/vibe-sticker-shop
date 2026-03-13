"use client";

import { useCallback, useEffect, useState } from "react";
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

const TAB_IDS = ["accounts", "adjust", "rules"];

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

function SortArrow({ active, order }) {
  if (!active) return null;
  return <span className="ml-1 text-[10px]">{order === "asc" ? "\u25B2" : "\u25BC"}</span>;
}

function AccountsTab({ t, locale }) {
  const [accounts, setAccounts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("pointsBalance");
  const [order, setOrder] = useState("desc");
  const [page, setPage] = useState(1);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
        sort,
        order,
      });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/loyalty?${params}`);
      const data = await res.json();
      setAccounts(data.accounts || []);
      setPagination(data.pagination || null);
    } catch {
      setAccounts([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [order, page, search, sort]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  function handleSort(field) {
    if (sort === field) {
      setOrder((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSort(field);
      setOrder("desc");
    }
    setPage(1);
  }

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder={t("admin.loyalty.searchPlaceholder")}
          className="w-full max-w-sm rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm outline-none transition-colors focus:border-[#333]"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-[#f5f5f5]" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#ddd] p-10 text-center text-sm text-[#999]">
          {t("admin.loyalty.noAccounts")}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-[#e5e5e5]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e5e5e5] bg-[#fafafa]">
                  <th className="px-4 py-2.5 text-left font-semibold text-[#555]">
                    {t("admin.loyalty.tableUser")}
                  </th>
                  <th
                    className="cursor-pointer px-4 py-2.5 text-left font-semibold text-[#555] hover:text-[#111]"
                    onClick={() => handleSort("pointsBalance")}
                  >
                    {t("admin.loyalty.tableBalance")}
                    <SortArrow active={sort === "pointsBalance"} order={order} />
                  </th>
                  <th
                    className="cursor-pointer px-4 py-2.5 text-left font-semibold text-[#555] hover:text-[#111]"
                    onClick={() => handleSort("totalEarned")}
                  >
                    {t("admin.loyalty.tableTotalEarned")}
                    <SortArrow active={sort === "totalEarned"} order={order} />
                  </th>
                  <th className="px-4 py-2.5 text-left font-semibold text-[#555]">
                    {t("admin.loyalty.tableTier")}
                  </th>
                  <th
                    className="cursor-pointer px-4 py-2.5 text-left font-semibold text-[#555] hover:text-[#111]"
                    onClick={() => handleSort("updatedAt")}
                  >
                    {t("admin.loyalty.tableLastActivity")}
                    <SortArrow active={sort === "updatedAt"} order={order} />
                  </th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((acct) => (
                  <tr
                    key={acct.id}
                    className="border-b border-[#f0f0f0] last:border-0 hover:bg-[#fafafa]"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#111]">{acct.name || "-"}</p>
                      <p className="text-xs text-[#999]">{acct.email}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#111]">
                      {acct.pointsBalance.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-[#555]">
                      {acct.totalEarned.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                          TIER_COLORS[acct.tier] || "bg-gray-100 text-[#999]"
                        }`}
                      >
                        {getTierLabel(t, acct.tier)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#999]">
                      {formatDate(acct.updatedAt, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-[#999]">
              <span>
                {t("admin.loyalty.pageSummary", {
                  page: pagination.page,
                  totalPages: pagination.totalPages,
                  total: pagination.total,
                })}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1}
                  className="rounded-lg border border-[#e5e5e5] px-3 py-1.5 text-xs font-semibold hover:border-[#999] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t("admin.common.previous")}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPage((current) => Math.min(pagination.totalPages, current + 1))
                  }
                  disabled={page >= pagination.totalPages}
                  className="rounded-lg border border-[#e5e5e5] px-3 py-1.5 text-xs font-semibold hover:border-[#999] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t("admin.common.next")}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AdjustTab({ t }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [points, setPoints] = useState("");
  const [type, setType] = useState("bonus");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  async function searchUsers() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `/api/admin/customers?search=${encodeURIComponent(searchQuery)}&limit=10`
      );
      const data = await res.json();
      setSearchResults(
        (data.customers || []).map((customer, index) => ({
          id: customer.id || `${customer.email || "user"}-${index}`,
          email: customer.email,
          name: customer.name,
          userId: customer.userId || null,
        }))
      );
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedUser || !points || !reason.trim()) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const payload = {
        points: parseInt(points, 10),
        type,
        description: reason.trim(),
      };
      if (selectedUser.userId) {
        payload.userId = selectedUser.userId;
      } else {
        payload.email = selectedUser.email;
      }

      const res = await fetch("/api/admin/loyalty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || t("admin.loyalty.adjustFailed"));
      }
      setMessage({
        type: "success",
        text: t("admin.loyalty.adjustedBalance", {
          balance: data.account.pointsBalance.toLocaleString(),
        }),
      });
      setPoints("");
      setReason("");
    } catch (err) {
      setMessage({
        type: "error",
        text: err.message || t("admin.loyalty.adjustFailed"),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#555]">
          {t("admin.loyalty.findUser")}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchUsers()}
            placeholder={t("admin.loyalty.searchUsersPlaceholder")}
            className="flex-1 rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm outline-none focus:border-[#333]"
          />
          <button
            type="button"
            onClick={searchUsers}
            disabled={searching}
            className="rounded-lg bg-[#111] px-4 py-2 text-xs font-semibold text-white hover:bg-black disabled:opacity-50"
          >
            {searching ? t("admin.loyalty.searching") : t("admin.common.search")}
          </button>
        </div>

        {searchResults.length > 0 && !selectedUser && (
          <div className="mt-2 divide-y divide-[#f0f0f0] rounded-lg border border-[#e5e5e5]">
            {searchResults.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => {
                  setSelectedUser(user);
                  setSearchResults([]);
                }}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-[#fafafa]"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f0f0f0] text-xs font-bold text-[#555]">
                  {(user.name || user.email || "?")[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-[#111]">{user.name || "-"}</p>
                  <p className="text-xs text-[#999]">{user.email}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {selectedUser && (
          <div className="mt-2 flex items-center justify-between rounded-lg border border-[#e5e5e5] bg-[#fafafa] px-3 py-2.5">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e5e5e5] text-xs font-bold text-[#555]">
                {(selectedUser.name || selectedUser.email || "?")[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-[#111]">
                  {selectedUser.name || "-"}
                </p>
                <p className="text-xs text-[#999]">{selectedUser.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedUser(null)}
              className="text-xs text-[#999] hover:text-red-600"
            >
              {t("admin.loyalty.changeUser")}
            </button>
          </div>
        )}
      </div>

      {selectedUser && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#555]">
              {t("admin.loyalty.adjustmentType")}
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType("bonus")}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  type === "bonus"
                    ? "border-[#111] bg-[#111] text-white"
                    : "border-[#e5e5e5] text-[#555] hover:border-[#999]"
                }`}
              >
                {t("admin.loyalty.typeBonus")}
              </button>
              <button
                type="button"
                onClick={() => setType("adjust")}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  type === "adjust"
                    ? "border-[#111] bg-[#111] text-white"
                    : "border-[#e5e5e5] text-[#555] hover:border-[#999]"
                }`}
              >
                {t("admin.loyalty.typeAdjust")}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#555]">
              {t("admin.loyalty.pointsLabel")}
            </label>
            <input
              type="number"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              placeholder={t("admin.loyalty.pointsPlaceholder")}
              required
              className="w-full rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm outline-none focus:border-[#333]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#555]">
              {t("admin.loyalty.reasonLabel")}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("admin.loyalty.reasonPlaceholder")}
              required
              rows={3}
              className="w-full resize-none rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm outline-none focus:border-[#333]"
            />
          </div>

          {message && (
            <div
              className={`rounded-lg border px-3 py-2.5 text-sm ${
                message.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !points || !reason.trim()}
            className="w-full rounded-lg bg-[#111] px-4 py-2.5 text-sm font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? t("admin.loyalty.applying") : t("admin.loyalty.applyAdjustment")}
          </button>
        </form>
      )}
    </div>
  );
}

function RulesTab({ t }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const [earnRate, setEarnRate] = useState("");
  const [redeemRate, setRedeemRate] = useState("");
  const [tierSilver, setTierSilver] = useState("");
  const [tierGold, setTierGold] = useState("");
  const [tierPlatinum, setTierPlatinum] = useState("");
  const [bonusFirstOrder, setBonusFirstOrder] = useState("");
  const [bonusReferral, setBonusReferral] = useState("");
  const [bonusReview, setBonusReview] = useState("");

  useEffect(() => {
    fetch("/api/admin/loyalty/rules")
      .then((r) => r.json())
      .then((data) => {
        const rules = data.rules || {};
        setEarnRate(String(rules.earnRate ?? 1));
        setRedeemRate(String(rules.redeemRate ?? 100));
        setTierSilver(String(rules.tiers?.silver ?? 1000));
        setTierGold(String(rules.tiers?.gold ?? 5000));
        setTierPlatinum(String(rules.tiers?.platinum ?? 20000));
        setBonusFirstOrder(String(rules.bonusEvents?.firstOrder ?? 100));
        setBonusReferral(String(rules.bonusEvents?.referral ?? 200));
        setBonusReview(String(rules.bonusEvents?.review ?? 50));
      })
      .catch(() => {
        setMessage({ type: "error", text: t("admin.loyalty.loadRulesFailed") });
      })
      .finally(() => setLoading(false));
  }, [t]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const body = {
        earnRate: Number(earnRate),
        redeemRate: Number(redeemRate),
        tiers: {
          bronze: 0,
          silver: Number(tierSilver),
          gold: Number(tierGold),
          platinum: Number(tierPlatinum),
        },
        bonusEvents: {
          firstOrder: Number(bonusFirstOrder),
          referral: Number(bonusReferral),
          review: Number(bonusReview),
        },
      };

      const res = await fetch("/api/admin/loyalty/rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || t("admin.loyalty.saveFailed"));
      }
      setMessage({ type: "success", text: t("admin.loyalty.rulesSaved") });
    } catch (err) {
      setMessage({ type: "error", text: err.message || t("admin.loyalty.saveFailed") });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-[#f5f5f5]" />
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="max-w-lg space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-[#111]">
          {t("admin.loyalty.pointsRates")}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#555]">
              {t("admin.loyalty.earnRateLabel")}
            </label>
            <input
              type="number"
              value={earnRate}
              onChange={(e) => setEarnRate(e.target.value)}
              min="0"
              max="100"
              step="0.1"
              className="w-full rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm outline-none focus:border-[#333]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#555]">
              {t("admin.loyalty.redeemRateLabel")}
            </label>
            <input
              type="number"
              value={redeemRate}
              onChange={(e) => setRedeemRate(e.target.value)}
              min="1"
              max="10000"
              className="w-full rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm outline-none focus:border-[#333]"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-[#111]">
          {t("admin.loyalty.tierThresholds")}
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-20 text-xs font-bold uppercase tracking-wider text-amber-700">
              {t("loyalty.tierBronze")}
            </span>
            <input
              type="number"
              value="0"
              disabled
              className="flex-1 rounded-lg border border-[#e5e5e5] bg-[#fafafa] px-3 py-2 text-sm text-[#999]"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="w-20 text-xs font-bold uppercase tracking-wider text-gray-500">
              {t("loyalty.tierSilver")}
            </span>
            <input
              type="number"
              value={tierSilver}
              onChange={(e) => setTierSilver(e.target.value)}
              min="1"
              className="flex-1 rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm outline-none focus:border-[#333]"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="w-20 text-xs font-bold uppercase tracking-wider text-yellow-700">
              {t("loyalty.tierGold")}
            </span>
            <input
              type="number"
              value={tierGold}
              onChange={(e) => setTierGold(e.target.value)}
              min="1"
              className="flex-1 rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm outline-none focus:border-[#333]"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="w-20 text-xs font-bold uppercase tracking-wider text-purple-700">
              {t("loyalty.tierPlatinum")}
            </span>
            <input
              type="number"
              value={tierPlatinum}
              onChange={(e) => setTierPlatinum(e.target.value)}
              min="1"
              className="flex-1 rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm outline-none focus:border-[#333]"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-[#111]">
          {t("admin.loyalty.bonusEvents")}
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-28 text-xs font-semibold text-[#555]">
              {t("admin.loyalty.bonusFirstOrder")}
            </span>
            <input
              type="number"
              value={bonusFirstOrder}
              onChange={(e) => setBonusFirstOrder(e.target.value)}
              min="0"
              className="flex-1 rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm outline-none focus:border-[#333]"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="w-28 text-xs font-semibold text-[#555]">
              {t("admin.loyalty.bonusReferral")}
            </span>
            <input
              type="number"
              value={bonusReferral}
              onChange={(e) => setBonusReferral(e.target.value)}
              min="0"
              className="flex-1 rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm outline-none focus:border-[#333]"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="w-28 text-xs font-semibold text-[#555]">
              {t("admin.loyalty.bonusReview")}
            </span>
            <input
              type="number"
              value={bonusReview}
              onChange={(e) => setBonusReview(e.target.value)}
              min="0"
              className="flex-1 rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm outline-none focus:border-[#333]"
            />
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-lg border px-3 py-2.5 text-sm ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-[#111] px-4 py-2.5 text-sm font-semibold text-white hover:bg-black disabled:opacity-50"
      >
        {saving ? t("admin.common.saving") : t("admin.loyalty.saveRules")}
      </button>
    </form>
  );
}

export default function AdminLoyaltyPage() {
  const { t, locale } = useTranslation();
  const [activeTab, setActiveTab] = useState("accounts");

  const tabs = [
    { id: TAB_IDS[0], label: t("admin.loyalty.tabAccounts") },
    { id: TAB_IDS[1], label: t("admin.loyalty.tabAdjust") },
    { id: TAB_IDS[2], label: t("admin.loyalty.tabRules") },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#111]">{t("admin.loyalty.title")}</h1>
        <p className="mt-1 text-sm text-[#999]">{t("admin.loyalty.subtitle")}</p>
      </div>

      <div className="mb-6 flex gap-1 border-b border-[#e5e5e5]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-[#111] text-[#111]"
                : "border-transparent text-[#999] hover:text-[#555]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "accounts" && <AccountsTab t={t} locale={locale} />}
      {activeTab === "adjust" && <AdjustTab t={t} />}
      {activeTab === "rules" && <RulesTab t={t} />}
    </div>
  );
}
