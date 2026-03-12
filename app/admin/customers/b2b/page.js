"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { buildCustomerCenterHref, buildCustomerDetailHref } from "@/lib/admin-centers";

const FILTER_KEYS = [
  { key: "all", labelKey: "admin.b2b.all" },
  { key: "pending", labelKey: "admin.b2b.pending" },
  { key: "approved", labelKey: "admin.b2b.approved" },
];

const TIER_KEYS = [
  { key: "bronze", labelKey: "admin.b2b.bronze" },
  { key: "silver", labelKey: "admin.b2b.silver" },
  { key: "gold", labelKey: "admin.b2b.gold" },
  { key: "platinum", labelKey: "admin.b2b.platinum" },
];

export default function AdminB2BPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState("accounts"); // "accounts" | "invites"
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Invite state
  const [invites, setInvites] = useState([]);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", companyName: "", tier: "bronze", discount: "15", note: "" });
  const [inviteSending, setInviteSending] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (tab === "accounts") loadUsers();
    if (tab === "invites") loadInvites();
  }, [tab, filter]);

  function loadUsers() {
    setLoading(true);
    fetch(`/api/admin/b2b?filter=${filter}`)
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.users || []);
        setTotal(data.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  function loadInvites() {
    setInvitesLoading(true);
    fetch("/api/admin/b2b/invites")
      .then((r) => r.json())
      .then((data) => setInvites(data.invites || []))
      .catch(() => {})
      .finally(() => setInvitesLoading(false));
  }

  async function handleAction(userId, action) {
    const user = users.find((u) => u.id === userId);
    const label = user?.companyName || user?.name || user?.email || userId;
    const verb = action === "approve" ? t("admin.b2b.approve") : t("admin.b2b.reject");
    if (!confirm(`${verb} B2B — "${label}"?`)) return;

    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/b2b/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) loadUsers();
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSendInvite(e) {
    e.preventDefault();
    setInviteSending(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/b2b/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inviteForm),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: `${t("admin.b2b.inviteSent")} ${inviteForm.email}` });
        setShowInviteForm(false);
        setInviteForm({ email: "", companyName: "", tier: "bronze", discount: "15", note: "" });
        loadInvites();
      } else {
        setMessage({ type: "error", text: data.error || t("admin.b2b.inviteFailed") });
      }
    } catch {
      setMessage({ type: "error", text: t("admin.b2b.networkError") });
    } finally {
      setInviteSending(false);
    }
  }

  async function handleRevokeInvite(id) {
    if (!confirm(t("admin.b2b.revokeConfirm"))) return;
    await fetch(`/api/admin/b2b/invites?id=${id}`, { method: "DELETE" });
    loadInvites();
  }

  function copyInviteLink(token) {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setMessage({ type: "success", text: t("admin.b2b.linkCopied") });
      setTimeout(() => setMessage(null), 2000);
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href={buildCustomerCenterHref()}
            className="mb-1 inline-block text-[11px] text-[#666] underline hover:text-black hover:no-underline"
          >
            {t("admin.customers.title")}
          </Link>
          <h1 className="text-xl font-semibold text-black">{t("admin.b2b.title")}</h1>
          <p className="text-sm text-[#999]">{t("admin.b2b.description")}</p>
        </div>
        <button
          type="button"
          onClick={() => { setShowInviteForm(true); setTab("invites"); }}
          className="rounded-[3px] bg-black px-4 py-2 text-xs font-semibold text-[#fff] hover:bg-[#222]"
        >
          {t("admin.b2b.invitePartner")}
        </button>
      </div>

      {message && (
        <div className={`mb-4 rounded-[3px] px-4 py-3 text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-[3px] border border-[#e0e0e0] p-1 w-fit">
        {[
          { key: "accounts", labelKey: "admin.b2b.accounts" },
          { key: "invites", labelKey: "admin.b2b.invitations" },
        ].map((tb) => (
          <button
            key={tb.key}
            type="button"
            onClick={() => setTab(tb.key)}
            className={`rounded-md px-4 py-1.5 text-xs font-semibold transition-colors ${
              tab === tb.key ? "bg-black text-[#fff]" : "text-[#999] hover:text-black"
            }`}
          >
            {t(tb.labelKey)}
          </button>
        ))}
      </div>

      {/* ── Accounts Tab ── */}
      {tab === "accounts" && (
        <>
          <div className="mb-4 flex flex-wrap gap-1 rounded-[3px] border border-[#e0e0e0] p-1 w-fit">
            {FILTER_KEYS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  filter === f.key ? "bg-black text-[#fff]" : "text-[#999] hover:text-black"
                }`}
              >
                {t(f.labelKey)}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-[3px] bg-[#f5f5f5]" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="rounded-[3px] border border-[#e0e0e0] p-8 text-center text-sm text-[#999]">
              {t("admin.b2b.noAccounts")}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto rounded-[3px] border border-[#e0e0e0] lg:block">
                <table className="w-full text-sm">
                  <thead className="bg-[#fafafa] text-left text-xs font-semibold uppercase tracking-wider text-[#999]">
                    <tr>
                      <th className="px-4 py-3">{t("admin.b2b.companyName")}</th>
                      <th className="px-4 py-3">{t("admin.b2b.email")}</th>
                      <th className="px-4 py-3">{t("admin.b2b.tier")}</th>
                      <th className="px-4 py-3">{t("admin.b2b.discount")}</th>
                      <th className="px-4 py-3">{t("admin.b2b.orders")}</th>
                      <th className="px-4 py-3">{t("admin.b2b.status")}</th>
                      <th className="px-4 py-3">{t("admin.b2b.registered")}</th>
                      <th className="px-4 py-3">{t("admin.common.actions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e0e0e0]">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-[#fafafa]">
                        <td className="px-4 py-3">
                          <p className="font-medium text-black">{user.companyName || "—"}</p>
                          <p className="text-xs text-[#999]">{user.name} {user.companyRole ? `(${user.companyRole})` : ""}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Link href={buildCustomerDetailHref(user.email)} className="text-sm text-[#666] hover:text-[#4f46e5] hover:underline">
                            {user.email}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          {user.partnerTier ? (
                            <TierBadge tier={user.partnerTier} />
                          ) : (
                            <span className="text-xs text-[#ccc]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[#666]">
                          {user.partnerDiscount > 0 ? `${user.partnerDiscount}%` : "—"}
                        </td>
                        <td className="px-4 py-3 text-[#666]">{user._count?.orders || 0}</td>
                        <td className="px-4 py-3">
                          {user.b2bApproved ? (
                            <span className="rounded-[2px] bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">{t("admin.b2b.approved")}</span>
                          ) : (
                            <span className="rounded-[2px] bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">{t("admin.b2b.pending")}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-[#999]">{new Date(user.createdAt).toLocaleDateString("en-CA")}</td>
                        <td className="px-4 py-3">
                          {!user.b2bApproved && (
                            <div className="flex gap-2">
                              <button type="button" onClick={() => handleAction(user.id, "approve")} disabled={actionLoading === user.id} className="rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-[#fff] hover:bg-emerald-700 disabled:opacity-50">{t("admin.b2b.approve")}</button>
                              <button type="button" onClick={() => handleAction(user.id, "reject")} disabled={actionLoading === user.id} className="rounded-md bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-200 disabled:opacity-50">{t("admin.b2b.reject")}</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile cards */}
              <div className="space-y-3 lg:hidden">
                {users.map((user) => (
                  <div key={user.id} className="rounded-[3px] border border-[#e0e0e0] bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-black">{user.companyName || "—"}</p>
                        <p className="text-xs text-[#999]">{user.name} {user.companyRole ? `(${user.companyRole})` : ""}</p>
                        <Link href={buildCustomerDetailHref(user.email)} className="mt-1 block truncate text-xs text-[#666] hover:text-[#4f46e5] hover:underline">
                          {user.email}
                        </Link>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        {user.b2bApproved ? (
                          <span className="rounded-[2px] bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">{t("admin.b2b.approved")}</span>
                        ) : (
                          <span className="rounded-[2px] bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">{t("admin.b2b.pending")}</span>
                        )}
                        {user.partnerTier && <TierBadge tier={user.partnerTier} />}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-[#999]">
                      <span>{user.partnerDiscount > 0 ? t("admin.b2b.ordersWithDiscount").replace("{count}", user._count?.orders || 0).replace("{discount}", user.partnerDiscount) : t("admin.b2b.ordersOnly").replace("{count}", user._count?.orders || 0)}</span>
                      <span>{new Date(user.createdAt).toLocaleDateString("en-CA")}</span>
                    </div>
                    {!user.b2bApproved && (
                      <div className="mt-3 flex gap-2">
                        <button type="button" onClick={() => handleAction(user.id, "approve")} disabled={actionLoading === user.id} className="rounded-md bg-emerald-600 px-2.5 py-1.5 text-[11px] font-semibold text-[#fff] hover:bg-emerald-700 disabled:opacity-50">{t("admin.b2b.approve")}</button>
                        <button type="button" onClick={() => handleAction(user.id, "reject")} disabled={actionLoading === user.id} className="rounded-md bg-red-100 px-2.5 py-1.5 text-[11px] font-semibold text-red-700 hover:bg-red-200 disabled:opacity-50">{t("admin.b2b.reject")}</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ── Invites Tab ── */}
      {tab === "invites" && (
        <>
          {/* Invite form */}
          {showInviteForm && (
            <div className="mb-4 rounded-[3px] border border-[#e0e0e0] bg-white p-5">
              <h2 className="mb-3 text-sm font-semibold text-black">{t("admin.b2b.sendInvite")}</h2>
              <form onSubmit={handleSendInvite} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#666]">{t("admin.b2b.email")} *</label>
                    <input
                      type="email"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                      required
                      placeholder="partner@company.com"
                      className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#666]">{t("admin.b2b.companyName")}</label>
                    <input
                      type="text"
                      value={inviteForm.companyName}
                      onChange={(e) => setInviteForm({ ...inviteForm, companyName: e.target.value })}
                      placeholder={t("admin.b2b.companyNamePlaceholder")}
                      className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#666]">{t("admin.b2b.tier")}</label>
                    <select
                      value={inviteForm.tier}
                      onChange={(e) => setInviteForm({ ...inviteForm, tier: e.target.value })}
                      className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                    >
                      {TIER_KEYS.map((tk) => (
                        <option key={tk.key} value={tk.key}>{t(tk.labelKey)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#666]">{t("admin.b2b.discount")} %</label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={inviteForm.discount}
                      onChange={(e) => setInviteForm({ ...inviteForm, discount: e.target.value })}
                      className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#666]">{t("admin.b2b.internalNote")}</label>
                  <input
                    type="text"
                    value={inviteForm.note}
                    onChange={(e) => setInviteForm({ ...inviteForm, note: e.target.value })}
                    placeholder={t("admin.b2b.notePlaceholder")}
                    className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={inviteSending} className="rounded-[3px] bg-black px-4 py-2 text-xs font-semibold text-[#fff] hover:bg-[#222] disabled:bg-[#999]">
                    {inviteSending ? t("admin.b2b.sending") : t("admin.b2b.sendInviteBtn")}
                  </button>
                  <button type="button" onClick={() => setShowInviteForm(false)} className="rounded-[3px] border border-[#d0d0d0] px-4 py-2 text-xs font-semibold text-[#666] hover:border-black">
                    {t("admin.common.cancel")}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Invites list */}
          {invitesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-[3px] bg-[#f5f5f5]" />
              ))}
            </div>
          ) : invites.length === 0 ? (
            <div className="rounded-[3px] border border-[#e0e0e0] p-8 text-center text-sm text-[#999]">
              {t("admin.b2b.noInvites")}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[3px] border border-[#e0e0e0]">
              <table className="w-full text-sm">
                <thead className="bg-[#fafafa] text-left text-xs font-semibold uppercase tracking-wider text-[#999]">
                  <tr>
                    <th className="px-4 py-3">{t("admin.b2b.email")}</th>
                    <th className="px-4 py-3">{t("admin.b2b.companyName")}</th>
                    <th className="px-4 py-3">{t("admin.b2b.tier")}</th>
                    <th className="px-4 py-3">{t("admin.b2b.discount")}</th>
                    <th className="px-4 py-3">{t("admin.b2b.status")}</th>
                    <th className="px-4 py-3">{t("admin.b2b.sent")}</th>
                    <th className="px-4 py-3">{t("admin.common.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e0e0e0]">
                  {invites.map((inv) => {
                    const expired = new Date(inv.expiresAt) < new Date();
                    const accepted = !!inv.acceptedAt;
                    return (
                      <tr key={inv.id} className="hover:bg-[#fafafa]">
                        <td className="px-4 py-3 font-medium text-black">{inv.email}</td>
                        <td className="px-4 py-3 text-[#666]">{inv.companyName || "—"}</td>
                        <td className="px-4 py-3"><TierBadge tier={inv.tier} /></td>
                        <td className="px-4 py-3 text-[#666]">{inv.discount > 0 ? `${inv.discount}%` : "—"}</td>
                        <td className="px-4 py-3">
                          {accepted ? (
                            <span className="rounded-[2px] bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">{t("admin.b2b.accepted")}</span>
                          ) : expired ? (
                            <span className="rounded-[2px] bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">{t("admin.b2b.expired")}</span>
                          ) : (
                            <span className="rounded-[2px] bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">{t("admin.b2b.pending")}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-[#999]">{new Date(inv.createdAt).toLocaleDateString("en-CA")}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            {!accepted && !expired && (
                              <button type="button" onClick={() => copyInviteLink(inv.token)} className="rounded-md border border-[#d0d0d0] px-2.5 py-1 text-[11px] font-semibold text-[#666] hover:border-black hover:text-black">
                                {t("admin.b2b.copyLink")}
                              </button>
                            )}
                            {!accepted && (
                              <button type="button" onClick={() => handleRevokeInvite(inv.id)} className="rounded-md bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-200">
                                {t("admin.b2b.revoke")}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const TIER_COLORS = {
  bronze: "bg-amber-100 text-amber-800",
  silver: "bg-gray-100 text-gray-700",
  gold: "bg-yellow-100 text-yellow-800",
  platinum: "bg-purple-100 text-purple-800",
};

const TIER_LABEL_KEYS = {
  bronze: "admin.b2b.bronze",
  silver: "admin.b2b.silver",
  gold: "admin.b2b.gold",
  platinum: "admin.b2b.platinum",
};

function TierBadge({ tier }) {
  const { t } = useTranslation();
  const cls = TIER_COLORS[tier] || TIER_COLORS.bronze;
  return (
    <span className={`rounded-[2px] px-2 py-0.5 text-[10px] font-semibold ${cls}`}>
      {t(TIER_LABEL_KEYS[tier] || tier)}
    </span>
  );
}
