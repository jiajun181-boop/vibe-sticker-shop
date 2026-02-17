"use client";

import { useEffect, useState } from "react";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
];

const TIERS = [
  { key: "bronze", label: "Bronze" },
  { key: "silver", label: "Silver" },
  { key: "gold", label: "Gold" },
  { key: "platinum", label: "Platinum" },
];

export default function AdminB2BPage() {
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
    const verb = action === "approve" ? "Approve" : "Reject";
    if (!confirm(`${verb} B2B account for "${label}"?`)) return;

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
        setMessage({ type: "success", text: `Invite sent to ${inviteForm.email}` });
        setShowInviteForm(false);
        setInviteForm({ email: "", companyName: "", tier: "bronze", discount: "15", note: "" });
        loadInvites();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to send invite" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setInviteSending(false);
    }
  }

  async function handleRevokeInvite(id) {
    if (!confirm("Revoke this invite?")) return;
    await fetch(`/api/admin/b2b/invites?id=${id}`, { method: "DELETE" });
    loadInvites();
  }

  function copyInviteLink(token) {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setMessage({ type: "success", text: "Link copied!" });
      setTimeout(() => setMessage(null), 2000);
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-black">B2B / Partners</h1>
          <p className="text-sm text-[#999]">Manage B2B accounts and partner invitations</p>
        </div>
        <button
          type="button"
          onClick={() => { setShowInviteForm(true); setTab("invites"); }}
          className="rounded-[3px] bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-[#222]"
        >
          + Invite Partner
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
          { key: "accounts", label: "B2B Accounts" },
          { key: "invites", label: "Invitations" },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-md px-4 py-1.5 text-xs font-semibold transition-colors ${
              tab === t.key ? "bg-black text-white" : "text-[#999] hover:text-black"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Accounts Tab ── */}
      {tab === "accounts" && (
        <>
          <div className="mb-4 flex flex-wrap gap-1 rounded-[3px] border border-[#e0e0e0] p-1 w-fit">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  filter === f.key ? "bg-black text-white" : "text-[#999] hover:text-black"
                }`}
              >
                {f.label}
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
              No B2B accounts found.
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto rounded-[3px] border border-[#e0e0e0] lg:block">
                <table className="w-full text-sm">
                  <thead className="bg-[#fafafa] text-left text-xs font-semibold uppercase tracking-wider text-[#999]">
                    <tr>
                      <th className="px-4 py-3">Company / Name</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Tier</th>
                      <th className="px-4 py-3">Discount</th>
                      <th className="px-4 py-3">Orders</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Registered</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e0e0e0]">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-[#fafafa]">
                        <td className="px-4 py-3">
                          <p className="font-medium text-black">{user.companyName || "—"}</p>
                          <p className="text-xs text-[#999]">{user.name} {user.companyRole ? `(${user.companyRole})` : ""}</p>
                        </td>
                        <td className="px-4 py-3 text-[#666]">{user.email}</td>
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
                            <span className="rounded-[2px] bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Approved</span>
                          ) : (
                            <span className="rounded-[2px] bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Pending</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-[#999]">{new Date(user.createdAt).toLocaleDateString("en-CA")}</td>
                        <td className="px-4 py-3">
                          {!user.b2bApproved && (
                            <div className="flex gap-2">
                              <button type="button" onClick={() => handleAction(user.id, "approve")} disabled={actionLoading === user.id} className="rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">Approve</button>
                              <button type="button" onClick={() => handleAction(user.id, "reject")} disabled={actionLoading === user.id} className="rounded-md bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-200 disabled:opacity-50">Reject</button>
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
                        <p className="mt-1 truncate text-xs text-[#666]">{user.email}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        {user.b2bApproved ? (
                          <span className="rounded-[2px] bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Approved</span>
                        ) : (
                          <span className="rounded-[2px] bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Pending</span>
                        )}
                        {user.partnerTier && <TierBadge tier={user.partnerTier} />}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-[#999]">
                      <span>{user._count?.orders || 0} orders{user.partnerDiscount > 0 ? ` · ${user.partnerDiscount}% off` : ""}</span>
                      <span>{new Date(user.createdAt).toLocaleDateString("en-CA")}</span>
                    </div>
                    {!user.b2bApproved && (
                      <div className="mt-3 flex gap-2">
                        <button type="button" onClick={() => handleAction(user.id, "approve")} disabled={actionLoading === user.id} className="rounded-md bg-emerald-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">Approve</button>
                        <button type="button" onClick={() => handleAction(user.id, "reject")} disabled={actionLoading === user.id} className="rounded-md bg-red-100 px-2.5 py-1.5 text-[11px] font-semibold text-red-700 hover:bg-red-200 disabled:opacity-50">Reject</button>
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
              <h2 className="mb-3 text-sm font-semibold text-black">Send Partner Invitation</h2>
              <form onSubmit={handleSendInvite} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#666]">Email *</label>
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
                    <label className="mb-1 block text-xs font-medium text-[#666]">Company Name</label>
                    <input
                      type="text"
                      value={inviteForm.companyName}
                      onChange={(e) => setInviteForm({ ...inviteForm, companyName: e.target.value })}
                      placeholder="Their company name"
                      className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#666]">Partner Tier</label>
                    <select
                      value={inviteForm.tier}
                      onChange={(e) => setInviteForm({ ...inviteForm, tier: e.target.value })}
                      className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                    >
                      {TIERS.map((t) => (
                        <option key={t.key} value={t.key}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#666]">Discount %</label>
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
                  <label className="mb-1 block text-xs font-medium text-[#666]">Internal Note</label>
                  <input
                    type="text"
                    value={inviteForm.note}
                    onChange={(e) => setInviteForm({ ...inviteForm, note: e.target.value })}
                    placeholder="e.g. Met at trade show, interested in vehicle wraps"
                    className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={inviteSending} className="rounded-[3px] bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-[#222] disabled:bg-[#999]">
                    {inviteSending ? "Sending..." : "Send Invite"}
                  </button>
                  <button type="button" onClick={() => setShowInviteForm(false)} className="rounded-[3px] border border-[#d0d0d0] px-4 py-2 text-xs font-semibold text-[#666] hover:border-black">
                    Cancel
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
              No invitations sent yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[3px] border border-[#e0e0e0]">
              <table className="w-full text-sm">
                <thead className="bg-[#fafafa] text-left text-xs font-semibold uppercase tracking-wider text-[#999]">
                  <tr>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Company</th>
                    <th className="px-4 py-3">Tier</th>
                    <th className="px-4 py-3">Discount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Sent</th>
                    <th className="px-4 py-3">Actions</th>
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
                            <span className="rounded-[2px] bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Accepted</span>
                          ) : expired ? (
                            <span className="rounded-[2px] bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">Expired</span>
                          ) : (
                            <span className="rounded-[2px] bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">Pending</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-[#999]">{new Date(inv.createdAt).toLocaleDateString("en-CA")}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            {!accepted && !expired && (
                              <button type="button" onClick={() => copyInviteLink(inv.token)} className="rounded-md border border-[#d0d0d0] px-2.5 py-1 text-[11px] font-semibold text-[#666] hover:border-black hover:text-black">
                                Copy Link
                              </button>
                            )}
                            {!accepted && (
                              <button type="button" onClick={() => handleRevokeInvite(inv.id)} className="rounded-md bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-200">
                                Revoke
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

function TierBadge({ tier }) {
  const cls = TIER_COLORS[tier] || TIER_COLORS.bronze;
  return (
    <span className={`rounded-[2px] px-2 py-0.5 text-[10px] font-semibold capitalize ${cls}`}>
      {tier}
    </span>
  );
}
