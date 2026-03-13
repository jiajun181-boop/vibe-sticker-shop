"use client";

import { useEffect, useState, useCallback } from "react";

const TIER_COLORS = {
  bronze: "bg-amber-100 text-amber-800",
  silver: "bg-gray-200 text-gray-700",
  gold: "bg-yellow-100 text-yellow-800",
  platinum: "bg-purple-100 text-purple-800",
};

const TABS = [
  { id: "accounts", label: "Accounts" },
  { id: "adjust", label: "Adjust Points" },
  { id: "rules", label: "Rules" },
];

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ── Tab: Accounts ──

function AccountsTab() {
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
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, sort, order, search]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  function handleSort(field) {
    if (sort === field) {
      setOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSort(field);
      setOrder("desc");
    }
    setPage(1);
  }

  function SortArrow({ field }) {
    if (sort !== field) return null;
    return (
      <span className="ml-1 text-[10px]">
        {order === "asc" ? "\u25B2" : "\u25BC"}
      </span>
    );
  }

  return (
    <div>
      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by name or email..."
          className="w-full max-w-sm rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm outline-none focus:border-[#333] transition-colors"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-lg bg-[#f5f5f5]"
            />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#ddd] p-10 text-center text-sm text-[#999]">
          No loyalty accounts found.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-[#e5e5e5]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e5e5e5] bg-[#fafafa]">
                  <th className="px-4 py-2.5 text-left font-semibold text-[#555]">
                    User
                  </th>
                  <th
                    className="cursor-pointer px-4 py-2.5 text-left font-semibold text-[#555] hover:text-[#111]"
                    onClick={() => handleSort("pointsBalance")}
                  >
                    Balance
                    <SortArrow field="pointsBalance" />
                  </th>
                  <th
                    className="cursor-pointer px-4 py-2.5 text-left font-semibold text-[#555] hover:text-[#111]"
                    onClick={() => handleSort("totalEarned")}
                  >
                    Total Earned
                    <SortArrow field="totalEarned" />
                  </th>
                  <th className="px-4 py-2.5 text-left font-semibold text-[#555]">
                    Tier
                  </th>
                  <th
                    className="cursor-pointer px-4 py-2.5 text-left font-semibold text-[#555] hover:text-[#111]"
                    onClick={() => handleSort("updatedAt")}
                  >
                    Last Activity
                    <SortArrow field="updatedAt" />
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
                      <p className="font-medium text-[#111]">
                        {acct.name || "—"}
                      </p>
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
                        {acct.tier}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#999]">
                      {formatDate(acct.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-[#999]">
              <span>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-lg border border-[#e5e5e5] px-3 py-1.5 text-xs font-semibold hover:border-[#999] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPage((p) => Math.min(pagination.totalPages, p + 1))
                  }
                  disabled={page >= pagination.totalPages}
                  className="rounded-lg border border-[#e5e5e5] px-3 py-1.5 text-xs font-semibold hover:border-[#999] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Tab: Adjust Points ──

function AdjustTab() {
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
      // Map customer rows (from order aggregation) into user-like objects
      setSearchResults(
        (data.customers || []).map((c) => ({
          id: null, // resolved server-side via email
          email: c.email,
          name: c.name,
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
        points: parseInt(points),
        type,
        description: reason.trim(),
      };
      // Use userId if available, otherwise fall back to email
      if (selectedUser.id) {
        payload.userId = selectedUser.id;
      } else {
        payload.email = selectedUser.email;
      }

      const res = await fetch("/api/admin/loyalty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to adjust points");
      setMessage({
        type: "success",
        text: `Points adjusted. New balance: ${data.account.pointsBalance.toLocaleString()}`,
      });
      setPoints("");
      setReason("");
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-lg">
      {/* User Search */}
      <div className="mb-6">
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#555] mb-1.5">
          Find User
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchUsers()}
            placeholder="Search by name or email..."
            className="flex-1 rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm outline-none focus:border-[#333]"
          />
          <button
            type="button"
            onClick={searchUsers}
            disabled={searching}
            className="rounded-lg bg-[#111] px-4 py-2 text-xs font-semibold text-white hover:bg-black disabled:opacity-50"
          >
            {searching ? "..." : "Search"}
          </button>
        </div>

        {searchResults.length > 0 && !selectedUser && (
          <div className="mt-2 rounded-lg border border-[#e5e5e5] divide-y divide-[#f0f0f0]">
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
                  <p className="font-medium text-[#111]">
                    {user.name || "—"}
                  </p>
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
                  {selectedUser.name || "—"}
                </p>
                <p className="text-xs text-[#999]">{selectedUser.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedUser(null)}
              className="text-xs text-[#999] hover:text-red-600"
            >
              Change
            </button>
          </div>
        )}
      </div>

      {selectedUser && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#555] mb-1.5">
              Adjustment Type
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
                Bonus
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
                Adjustment
              </button>
            </div>
          </div>

          {/* Points */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#555] mb-1.5">
              Points (negative to deduct)
            </label>
            <input
              type="number"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              placeholder="e.g. 100 or -50"
              required
              className="w-full rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm outline-none focus:border-[#333]"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#555] mb-1.5">
              Reason
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this adjustment being made?"
              required
              rows={3}
              className="w-full rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm outline-none focus:border-[#333] resize-none"
            />
          </div>

          {message && (
            <div
              className={`rounded-lg px-3 py-2.5 text-sm ${
                message.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !points || !reason.trim()}
            className="w-full rounded-lg bg-[#111] px-4 py-2.5 text-sm font-semibold text-white hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Applying..." : "Apply Adjustment"}
          </button>
        </form>
      )}
    </div>
  );
}

// ── Tab: Rules ──

function RulesTab() {
  const [rules, setRules] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Editable fields
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
        const r = data.rules || {};
        setRules(r);
        setEarnRate(String(r.earnRate ?? 1));
        setRedeemRate(String(r.redeemRate ?? 100));
        setTierSilver(String(r.tiers?.silver ?? 1000));
        setTierGold(String(r.tiers?.gold ?? 5000));
        setTierPlatinum(String(r.tiers?.platinum ?? 20000));
        setBonusFirstOrder(String(r.bonusEvents?.firstOrder ?? 100));
        setBonusReferral(String(r.bonusEvents?.referral ?? 200));
        setBonusReview(String(r.bonusEvents?.review ?? 50));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
      if (!res.ok) throw new Error(data.error || "Failed to save rules");
      setRules(data.rules);
      setMessage({ type: "success", text: "Loyalty rules saved." });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-12 animate-pulse rounded-lg bg-[#f5f5f5]"
          />
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="max-w-lg space-y-6">
      {/* Earn & Redeem Rates */}
      <div>
        <h3 className="text-sm font-semibold text-[#111] mb-3">
          Points Rates
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#555] mb-1.5">
              Earn Rate (pts per $1)
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#555] mb-1.5">
              Redeem Rate (cents per pt)
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

      {/* Tier Thresholds */}
      <div>
        <h3 className="text-sm font-semibold text-[#111] mb-3">
          Tier Thresholds (total points earned)
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-20 text-xs font-bold uppercase tracking-wider text-amber-700">
              Bronze
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
              Silver
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
              Gold
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
              Platinum
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

      {/* Bonus Events */}
      <div>
        <h3 className="text-sm font-semibold text-[#111] mb-3">
          Bonus Events (points awarded)
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-28 text-xs font-semibold text-[#555]">
              First Order
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
              Referral
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
              Review
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
          className={`rounded-lg px-3 py-2.5 text-sm ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-red-50 text-red-700 border border-red-200"
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
        {saving ? "Saving..." : "Save Rules"}
      </button>
    </form>
  );
}

// ── Main Page ──

export default function AdminLoyaltyPage() {
  const [activeTab, setActiveTab] = useState("accounts");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#111]">Loyalty Program</h1>
        <p className="mt-1 text-sm text-[#999]">
          Manage customer loyalty accounts, adjust points, and configure reward
          rules.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-[#e5e5e5]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-[#111] text-[#111]"
                : "border-transparent text-[#999] hover:text-[#555]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "accounts" && <AccountsTab />}
      {activeTab === "adjust" && <AdjustTab />}
      {activeTab === "rules" && <RulesTab />}
    </div>
  );
}
