"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatCad } from "@/lib/admin/format-cad";
import { pricingGovernancePath } from "@/lib/admin/pricing-routes";

// ── Sub-tab definitions ──────────────────────────────────────────
const SUB_TABS = [
  { id: "approvals", label: "Approvals" },
  { id: "b2b", label: "B2B Rules" },
  { id: "vendor", label: "Vendor Costs" },
  { id: "snapshots", label: "Snapshots" },
  { id: "changelog", label: "Change Log" },
];

export default function GovernancePanel() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sectionParam = searchParams.get("section") || "approvals";
  const [activeSection, setActiveSection] = useState(sectionParam);

  // Sync with URL param changes
  useEffect(() => {
    if (sectionParam && SUB_TABS.some((t) => t.id === sectionParam)) {
      setActiveSection(sectionParam);
    }
  }, [sectionParam]);

  function switchSection(id) {
    setActiveSection(id);
    router.push(pricingGovernancePath(id), { scroll: false });
  }

  return (
    <div className="space-y-5">
      {/* Sub-tab bar */}
      <div className="flex flex-wrap gap-1">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => switchSection(tab.id)}
            className={`rounded-[3px] px-3.5 py-2 text-xs font-medium transition-colors ${
              activeSection === tab.id
                ? "bg-black text-white"
                : "bg-[#f0f0f0] text-[#666] hover:bg-[#e0e0e0] hover:text-[#111]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Section content */}
      {activeSection === "approvals" && <ApprovalsSection />}
      {activeSection === "b2b" && <B2BRulesSection />}
      {activeSection === "vendor" && <VendorCostsSection />}
      {activeSection === "snapshots" && <SnapshotsSection />}
      {activeSection === "changelog" && <ChangeLogSection />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// APPROVALS SECTION
// ════════════════════════════════════════════════════════════════════

const APPROVAL_STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  expired: "bg-gray-100 text-gray-600 border-gray-200",
};

function ApprovalBadge({ status }) {
  const cls = APPROVAL_STATUS_STYLES[status] || APPROVAL_STATUS_STYLES.pending;
  return (
    <span className={`inline-flex items-center rounded-[3px] border px-2 py-0.5 text-xs font-medium capitalize ${cls}`}>
      {status}
    </span>
  );
}

function ApprovalsSection() {
  const [tab, setTab] = useState("pending");
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#111]">Pricing Approvals</h3>
          <p className="mt-0.5 text-xs text-[#999]">Review and manage pricing change requests.</p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setTab("pending")}
            className={`rounded-[3px] px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === "pending" ? "bg-black text-white" : "border border-[#e0e0e0] text-[#666] hover:text-[#111]"
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setTab("history")}
            className={`rounded-[3px] px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === "history" ? "bg-black text-white" : "border border-[#e0e0e0] text-[#666] hover:text-[#111]"
            }`}
          >
            History
          </button>
        </div>
      </div>
      {tab === "pending" ? <ApprovalsPending /> : <ApprovalsHistory />}
    </div>
  );
}

function ApprovalsPending() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [notes, setNotes] = useState({});

  const fetchPending = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/pricing/approvals?limit=100");
      if (!res.ok) throw new Error("Failed to load pending approvals");
      const data = await res.json();
      setApprovals(data.approvals || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  async function handleAction(approvalId, action) {
    setActionLoading(approvalId);
    try {
      const res = await fetch("/api/admin/pricing/approvals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalId, action, note: notes[approvalId] || "" }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Action failed");
      }
      setApprovals((prev) => prev.filter((a) => a.id !== approvalId));
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) return <div className="py-8 text-center text-sm text-[#999]">Loading...</div>;
  if (error) return <ErrorRetry message={error} onRetry={fetchPending} />;
  if (approvals.length === 0) {
    return (
      <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-8 text-center">
        <p className="text-sm text-[#999]">No pending approvals</p>
        <p className="mt-0.5 text-xs text-[#ccc]">All pricing changes have been reviewed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-[#999]">{approvals.length} pending</p>
      <div className="overflow-hidden rounded-[3px] border border-[#e0e0e0] bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#666]">Change</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#666]">Scope / Target</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#666]">Requester</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#666]">Date</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#666]">Note</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#666]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ececec]">
            {approvals.map((a) => (
              <tr key={a.id} className="hover:bg-[#fafafa]">
                <td className="px-3 py-2.5">
                  <p className="text-sm font-medium text-[#111]">{a.changeType}</p>
                  <p className="mt-0.5 text-xs text-[#999] max-w-[180px] truncate">{a.description}</p>
                </td>
                <td className="px-3 py-2.5">
                  <p className="text-sm text-[#111]">{a.targetName || "--"}</p>
                  <p className="text-xs text-[#999]">{a.scope}</p>
                </td>
                <td className="px-3 py-2.5">
                  <p className="text-sm text-[#111]">{a.requesterName}</p>
                  <p className="text-xs text-[#999]">{a.requesterRole}</p>
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap text-xs text-[#666]">
                  {new Date(a.createdAt).toLocaleDateString("en-CA")}
                </td>
                <td className="px-3 py-2.5">
                  <input
                    type="text"
                    placeholder="Note..."
                    value={notes[a.id] || ""}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [a.id]: e.target.value }))}
                    className="w-full min-w-[100px] rounded-[3px] border border-[#e0e0e0] px-2 py-1.5 text-sm text-[#111] outline-none focus:border-black"
                  />
                </td>
                <td className="px-3 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleAction(a.id, "approve")}
                      disabled={actionLoading === a.id}
                      className="rounded-[3px] bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(a.id, "reject")}
                      disabled={actionLoading === a.id}
                      className="rounded-[3px] bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ApprovalsHistory() {
  const [approvals, setApprovals] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const limit = 30;

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/pricing/approvals/history?${params}`);
      if (!res.ok) throw new Error("Failed to load approval history");
      const data = await res.json();
      setApprovals(data.approvals || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);
  useEffect(() => { setPage(1); }, [statusFilter]);

  const totalPages = Math.ceil(total / limit);

  if (loading) return <div className="py-8 text-center text-sm text-[#999]">Loading...</div>;
  if (error) return <ErrorRetry message={error} onRetry={fetchHistory} />;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-[3px] border border-[#e0e0e0] bg-white px-3 py-1.5 text-sm text-[#111] outline-none focus:border-black"
        >
          <option value="">All statuses</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="expired">Expired</option>
        </select>
        <span className="text-xs text-[#999]">{total} results</span>
      </div>

      {approvals.length === 0 ? (
        <div className="py-8 text-center text-sm text-[#999]">No approvals found.</div>
      ) : (
        <>
          <div className="overflow-hidden rounded-[3px] border border-[#e0e0e0] bg-white">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#666]">Status</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#666]">Change</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#666]">Description</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#666]">Requester</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#666]">Reviewer</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#666]">Reviewed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ececec]">
                {approvals.map((a) => (
                  <tr key={a.id} className="hover:bg-[#fafafa]">
                    <td className="px-3 py-2.5"><ApprovalBadge status={a.status} /></td>
                    <td className="px-3 py-2.5 text-sm text-[#111]">{a.changeType}</td>
                    <td className="px-3 py-2.5">
                      <p className="text-sm text-[#111] max-w-[200px] truncate">{a.description}</p>
                      {a.targetName && <p className="text-xs text-[#999]">{a.targetName}</p>}
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="text-sm text-[#111]">{a.requesterName}</p>
                      <p className="text-xs text-[#999]">{a.requesterRole}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      {a.reviewerName ? (
                        <p className="text-sm text-[#111]">{a.reviewerName}</p>
                      ) : (
                        <span className="text-sm text-[#ccc]">--</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-xs text-[#666]">
                      {a.reviewedAt ? new Date(a.reviewedAt).toLocaleDateString("en-CA") : "--"}
                      {a.reviewNote && (
                        <p className="text-[10px] text-[#999] italic max-w-[120px] truncate">&quot;{a.reviewNote}&quot;</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} setPage={setPage} />
        </>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// B2B RULES SECTION
// ════════════════════════════════════════════════════════════════════

const RULE_TYPE_LABELS = {
  pct_discount: "% Discount",
  fixed_price: "Fixed Price",
  cost_plus_override: "Cost Plus Override",
  margin_override: "Margin Override",
};
const RULE_TYPES = Object.keys(RULE_TYPE_LABELS);
const TIERS = ["bronze", "silver", "gold", "platinum"];

const EMPTY_B2B_FORM = {
  userId: "", companyName: "", partnerTier: "",
  productSlug: "", category: "", templateKey: "",
  ruleType: "pct_discount", value: "",
  minQty: "", maxQty: "",
  validFrom: "", validUntil: "", note: "",
};

function B2BRulesSection() {
  const [rules, setRules] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const limit = 20;
  const [filterTier, setFilterTier] = useState("");
  const [filterActive, setFilterActive] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_B2B_FORM });
  const [saving, setSaving] = useState(false);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (filterTier) params.set("partnerTier", filterTier);
      if (filterActive === "active") params.set("isActive", "true");
      if (filterActive === "inactive") params.set("isActive", "false");
      const res = await fetch(`/api/admin/pricing/b2b-rules?${params}`);
      if (!res.ok) throw new Error("Failed to load B2B rules");
      const data = await res.json();
      setRules(data.rules || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, filterTier, filterActive]);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(null), 5000);
    return () => clearTimeout(t);
  }, [successMsg]);

  const totalPages = Math.ceil(total / limit);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = { ruleType: form.ruleType, value: Number(form.value) };
      if (form.userId.trim()) body.userId = form.userId.trim();
      if (form.companyName.trim()) body.companyName = form.companyName.trim();
      if (form.partnerTier) body.partnerTier = form.partnerTier;
      if (form.productSlug.trim()) body.productSlug = form.productSlug.trim();
      if (form.category.trim()) body.category = form.category.trim();
      if (form.templateKey.trim()) body.templateKey = form.templateKey.trim();
      if (form.minQty) body.minQty = Number(form.minQty);
      if (form.maxQty) body.maxQty = Number(form.maxQty);
      if (form.validFrom) body.validFrom = form.validFrom;
      if (form.validUntil) body.validUntil = form.validUntil;
      if (form.note.trim()) body.note = form.note.trim();

      const res = await fetch("/api/admin/pricing/b2b-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.requiresApproval) {
        setSuccessMsg(`Rule submitted for approval (ID: ${data.approvalId}).`);
      } else if (data.rule) {
        setSuccessMsg("Rule created successfully.");
      } else if (data.error) {
        throw new Error(data.error);
      }
      setForm({ ...EMPTY_B2B_FORM });
      setShowForm(false);
      fetchRules();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(id) {
    if (!confirm("Deactivate this B2B rule?")) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/pricing/b2b-rules/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to deactivate rule");
      }
      setSuccessMsg("Rule deactivated.");
      fetchRules();
    } catch (err) {
      setError(err.message);
    }
  }

  function formatTarget(rule) {
    if (rule.userId) return `User: ${rule.userId}`;
    if (rule.companyName) return `Company: ${rule.companyName}`;
    if (rule.partnerTier) return `Tier: ${rule.partnerTier}`;
    return "Global";
  }

  function formatScope(rule) {
    const parts = [];
    if (rule.productSlug) parts.push(`Product: ${rule.productSlug}`);
    if (rule.category) parts.push(`Cat: ${rule.category}`);
    if (rule.templateKey) parts.push(`Template: ${rule.templateKey}`);
    return parts.length ? parts.join(", ") : "All products";
  }

  function formatRuleValue(rule) {
    if (rule.ruleType === "pct_discount") return `${rule.value}%`;
    if (rule.ruleType === "fixed_price") return formatCad(rule.value);
    return `${rule.value}% margin`;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#111]">B2B Price Rules</h3>
          <p className="mt-0.5 text-xs text-[#999]">Special pricing for B2B customers and partner tiers.</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setForm({ ...EMPTY_B2B_FORM }); }}
          className="rounded-[3px] bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-[#222]"
        >
          {showForm ? "Cancel" : "New Rule"}
        </button>
      </div>

      {successMsg && (
        <div className="rounded-[3px] border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800">{successMsg}</div>
      )}
      {error && (
        <div className="rounded-[3px] border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-medium underline">Dismiss</button>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-[3px] border border-[#e0e0e0] bg-white p-4 space-y-3">
          <h4 className="text-xs font-bold text-[#111]">Create New B2B Rule</h4>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <MiniField label="User ID" value={form.userId} onChange={(v) => setForm({ ...form, userId: v })} />
            <MiniField label="Company" value={form.companyName} onChange={(v) => setForm({ ...form, companyName: v })} />
            <div>
              <label className="block text-[10px] font-medium text-[#666]">Partner Tier</label>
              <select
                value={form.partnerTier}
                onChange={(e) => setForm({ ...form, partnerTier: e.target.value })}
                className="mt-0.5 w-full rounded-[3px] border border-[#e0e0e0] px-2 py-1.5 text-sm text-[#111] outline-none focus:border-black"
              >
                <option value="">-- None --</option>
                {TIERS.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <MiniField label="Product Slug" value={form.productSlug} onChange={(v) => setForm({ ...form, productSlug: v })} />
            <MiniField label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
            <MiniField label="Template Key" value={form.templateKey} onChange={(v) => setForm({ ...form, templateKey: v })} />
            <div>
              <label className="block text-[10px] font-medium text-[#666]">Rule Type</label>
              <select
                value={form.ruleType}
                onChange={(e) => setForm({ ...form, ruleType: e.target.value })}
                className="mt-0.5 w-full rounded-[3px] border border-[#e0e0e0] px-2 py-1.5 text-sm text-[#111] outline-none focus:border-black"
                required
              >
                {RULE_TYPES.map((rt) => <option key={rt} value={rt}>{RULE_TYPE_LABELS[rt]}</option>)}
              </select>
            </div>
            <MiniField label="Value" value={form.value} onChange={(v) => setForm({ ...form, value: v })} type="number" required />
            <MiniField label="Min Qty" value={form.minQty} onChange={(v) => setForm({ ...form, minQty: v })} type="number" />
            <MiniField label="Max Qty" value={form.maxQty} onChange={(v) => setForm({ ...form, maxQty: v })} type="number" />
            <MiniField label="Valid From" value={form.validFrom} onChange={(v) => setForm({ ...form, validFrom: v })} type="date" />
            <MiniField label="Valid Until" value={form.validUntil} onChange={(v) => setForm({ ...form, validUntil: v })} type="date" />
            <MiniField label="Note" value={form.note} onChange={(v) => setForm({ ...form, note: v })} />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="rounded-[3px] bg-black px-4 py-1.5 text-xs font-medium text-white hover:bg-[#222] disabled:opacity-50">
              {saving ? "Saving..." : "Create Rule"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-[3px] border border-[#e0e0e0] px-4 py-1.5 text-xs text-[#666] hover:bg-[#fafafa]">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex gap-3">
        <select
          value={filterTier}
          onChange={(e) => { setFilterTier(e.target.value); setPage(1); }}
          className="rounded-[3px] border border-[#e0e0e0] bg-white px-3 py-1.5 text-sm text-[#111] outline-none focus:border-black"
        >
          <option value="">All Tiers</option>
          {TIERS.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
        <select
          value={filterActive}
          onChange={(e) => { setFilterActive(e.target.value); setPage(1); }}
          className="rounded-[3px] border border-[#e0e0e0] bg-white px-3 py-1.5 text-sm text-[#111] outline-none focus:border-black"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>

      {/* Rules list */}
      {loading ? (
        <div className="py-8 text-center text-sm text-[#999]">Loading...</div>
      ) : rules.length === 0 ? (
        <div className="py-8 text-center text-sm text-[#999]">No B2B rules found.</div>
      ) : (
        <>
          <p className="text-xs text-[#999]">{rules.length} of {total} rules</p>
          <div className="overflow-x-auto rounded-[3px] border border-[#e0e0e0] bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#666]">Target</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#666]">Scope</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#666]">Rule</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#666]">Value</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#666]">Status</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#666]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ececec]">
                {rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-[#fafafa]">
                    <td className="px-3 py-2.5 text-[#111]">{formatTarget(rule)}</td>
                    <td className="px-3 py-2.5 text-[#666] max-w-[160px] truncate">{formatScope(rule)}</td>
                    <td className="px-3 py-2.5 text-[#666]">{RULE_TYPE_LABELS[rule.ruleType] || rule.ruleType}</td>
                    <td className="px-3 py-2.5 font-medium text-[#111]">{formatRuleValue(rule)}</td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        rule.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"
                      }`}>
                        {rule.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {rule.isActive && (
                        <button
                          onClick={() => handleDeactivate(rule.id)}
                          className="rounded-[3px] border border-red-200 px-2 py-0.5 text-xs text-red-600 hover:bg-red-50"
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} setPage={setPage} />
        </>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// VENDOR COSTS SECTION
// ════════════════════════════════════════════════════════════════════

const EMPTY_VENDOR_FORM = {
  productSlug: "", productName: "", vendorName: "", vendorSku: "",
  sizeKey: "", qtyTier: "", unitCostCents: "", setupFeeCents: "",
  shippingCents: "", leadTimeDays: "", note: "",
};

function VendorCostsSection() {
  const [costs, setCosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterVendor, setFilterVendor] = useState("");
  const [filterProduct, setFilterProduct] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_VENDOR_FORM });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const LIMIT = 25;

  const fetchCosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (filterVendor.trim()) params.set("vendorName", filterVendor.trim());
      if (filterProduct.trim()) params.set("productSlug", filterProduct.trim());
      const res = await fetch(`/api/admin/pricing/vendor-costs?${params}`);
      if (!res.ok) throw new Error("Failed to load vendor costs");
      const data = await res.json();
      setCosts(data.costs || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, filterVendor, filterProduct]);

  useEffect(() => { fetchCosts(); }, [fetchCosts]);

  const totalPages = Math.ceil(total / LIMIT);
  const setField = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const openNew = () => { setEditId(null); setForm({ ...EMPTY_VENDOR_FORM }); setFormError(null); setShowForm(true); };
  const openEdit = (cost) => {
    setEditId(cost.id);
    setForm({
      productSlug: cost.productSlug || "", productName: cost.productName || "",
      vendorName: cost.vendorName || "", vendorSku: cost.vendorSku || "",
      sizeKey: cost.sizeKey || "", qtyTier: cost.qtyTier != null ? String(cost.qtyTier) : "",
      unitCostCents: String(cost.unitCostCents || 0), setupFeeCents: String(cost.setupFeeCents || 0),
      shippingCents: String(cost.shippingCents || 0),
      leadTimeDays: cost.leadTimeDays != null ? String(cost.leadTimeDays) : "",
      note: cost.note || "",
    });
    setFormError(null);
    setShowForm(true);
  };
  const cancelForm = () => { setShowForm(false); setEditId(null); setForm({ ...EMPTY_VENDOR_FORM }); setFormError(null); };

  const submitForm = async (e) => {
    e.preventDefault();
    if (!form.vendorName.trim()) { setFormError("Vendor name is required"); return; }
    setSaving(true);
    setFormError(null);
    try {
      const body = {
        productSlug: form.productSlug || undefined, productName: form.productName || undefined,
        vendorName: form.vendorName, vendorSku: form.vendorSku || undefined,
        sizeKey: form.sizeKey || undefined, qtyTier: form.qtyTier ? Number(form.qtyTier) : undefined,
        unitCostCents: Number(form.unitCostCents) || 0, setupFeeCents: Number(form.setupFeeCents) || 0,
        shippingCents: Number(form.shippingCents) || 0,
        leadTimeDays: form.leadTimeDays ? Number(form.leadTimeDays) : undefined,
        note: form.note || undefined,
      };
      let res;
      if (editId) {
        res = await fetch(`/api/admin/pricing/vendor-costs/${editId}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
      } else {
        res = await fetch("/api/admin/pricing/vendor-costs", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
      }
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || "Save failed"); }
      cancelForm();
      fetchCosts();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Deactivate this vendor cost entry?")) return;
    try {
      const res = await fetch(`/api/admin/pricing/vendor-costs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      fetchCosts();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#111]">Vendor Costs</h3>
          <p className="mt-0.5 text-xs text-[#999]">Manage outsourced product costs from suppliers. {total} entries.</p>
        </div>
        <button onClick={openNew} className="rounded-[3px] bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-[#222]">
          New Vendor Cost
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <input
          type="text" value={filterVendor}
          onChange={(e) => { setFilterVendor(e.target.value); setPage(1); }}
          placeholder="Filter by vendor..."
          className="flex-1 rounded-[3px] border border-[#e0e0e0] px-3 py-1.5 text-sm text-[#111] outline-none focus:border-black"
        />
        <input
          type="text" value={filterProduct}
          onChange={(e) => { setFilterProduct(e.target.value); setPage(1); }}
          placeholder="Filter by product slug..."
          className="flex-1 rounded-[3px] border border-[#e0e0e0] px-3 py-1.5 text-sm text-[#111] outline-none focus:border-black"
        />
      </div>

      {error && <div className="rounded-[3px] border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{error}</div>}

      {/* Form */}
      {showForm && (
        <form onSubmit={submitForm} className="rounded-[3px] border border-[#e0e0e0] bg-white p-4 space-y-3">
          <h4 className="text-xs font-bold text-[#111]">{editId ? "Edit Vendor Cost" : "New Vendor Cost"}</h4>
          {formError && <div className="rounded-[3px] border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-800">{formError}</div>}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <MiniField label="Product Slug" value={form.productSlug} onChange={(v) => setField("productSlug", v)} />
            <MiniField label="Product Name" value={form.productName} onChange={(v) => setField("productName", v)} />
            <MiniField label="Vendor Name *" value={form.vendorName} onChange={(v) => setField("vendorName", v)} required />
            <MiniField label="Vendor SKU" value={form.vendorSku} onChange={(v) => setField("vendorSku", v)} />
            <MiniField label="Size Key" value={form.sizeKey} onChange={(v) => setField("sizeKey", v)} />
            <MiniField label="Qty Tier" value={form.qtyTier} onChange={(v) => setField("qtyTier", v)} type="number" />
            <MiniField label="Unit Cost (cents)" value={form.unitCostCents} onChange={(v) => setField("unitCostCents", v)} type="number" />
            <MiniField label="Setup Fee (cents)" value={form.setupFeeCents} onChange={(v) => setField("setupFeeCents", v)} type="number" />
            <MiniField label="Shipping (cents)" value={form.shippingCents} onChange={(v) => setField("shippingCents", v)} type="number" />
            <MiniField label="Lead Time (days)" value={form.leadTimeDays} onChange={(v) => setField("leadTimeDays", v)} type="number" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="rounded-[3px] bg-black px-4 py-1.5 text-xs font-medium text-white hover:bg-[#222] disabled:opacity-50">
              {saving ? "Saving..." : editId ? "Update" : "Create"}
            </button>
            <button type="button" onClick={cancelForm} className="rounded-[3px] border border-[#e0e0e0] px-4 py-1.5 text-xs text-[#666] hover:bg-[#fafafa]">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      {loading ? (
        <div className="py-8 text-center text-sm text-[#999]">Loading vendor costs...</div>
      ) : costs.length === 0 ? (
        <div className="py-8 text-center text-sm text-[#999]">
          No vendor costs found. <button onClick={openNew} className="text-[#111] underline">Add one</button>.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-[3px] border border-[#e0e0e0] bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[#666]">Product</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[#666]">Vendor</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[#666]">SKU</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-[#666]">Unit Cost</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-[#666]">Setup</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[#666]">Lead</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[#666]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ececec]">
                {costs.map((c) => (
                  <tr key={c.id} className="hover:bg-[#fafafa]">
                    <td className="px-3 py-2">
                      <p className="font-medium text-[#111]">{c.productName || c.productSlug || "-"}</p>
                    </td>
                    <td className="px-3 py-2 text-[#111]">{c.vendorName}</td>
                    <td className="px-3 py-2 text-[#888] font-mono text-xs">{c.vendorSku || "-"}</td>
                    <td className="px-3 py-2 text-right font-mono text-[#111]">{formatCad(c.unitCostCents)}</td>
                    <td className="px-3 py-2 text-right font-mono text-[#888]">{c.setupFeeCents ? formatCad(c.setupFeeCents) : "-"}</td>
                    <td className="px-3 py-2 text-[#111]">{c.leadTimeDays != null ? `${c.leadTimeDays}d` : "-"}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(c)} className="rounded-[3px] border border-[#e0e0e0] px-2 py-0.5 text-xs text-[#666] hover:bg-[#fafafa]">Edit</button>
                        <button onClick={() => handleDelete(c.id)} className="rounded-[3px] border border-red-200 px-2 py-0.5 text-xs text-red-600 hover:bg-red-50">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} setPage={setPage} />
        </>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// SNAPSHOTS SECTION
// ════════════════════════════════════════════════════════════════════

function SnapshotsSection() {
  const [snapshots, setSnapshots] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterSlug, setFilterSlug] = useState("");
  const [filterOperator, setFilterOperator] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const PER_PAGE = 30;

  const fetchSnapshots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(PER_PAGE));
      if (filterSlug.trim()) params.set("productSlug", filterSlug.trim());
      if (filterOperator.trim()) params.set("operatorName", filterOperator.trim());
      const res = await fetch("/api/admin/pricing/quote-snapshots?" + params.toString());
      if (!res.ok) throw new Error("Failed to load snapshots");
      const data = await res.json();
      setSnapshots(data.snapshots || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, filterSlug, filterOperator]);

  useEffect(() => { fetchSnapshots(); }, [fetchSnapshots]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const formatDate = (dateStr) => {
    if (!dateStr) return "--";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-CA") + " " + d.toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" });
  };

  const marginColor = (pct) => {
    if (pct >= 25) return "text-green-700";
    if (pct >= 10) return "text-amber-700";
    return "text-red-600";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#111]">Quote Snapshots</h3>
          <p className="mt-0.5 text-xs text-[#999]">Saved pricing simulations for audit trail. {total > 0 && `${total} total.`}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <input
          type="text" value={filterSlug}
          onChange={(e) => { setFilterSlug(e.target.value); setPage(1); }}
          placeholder="Filter by product slug..."
          className="flex-1 rounded-[3px] border border-[#e0e0e0] px-3 py-1.5 text-sm text-[#111] outline-none focus:border-black"
        />
        <input
          type="text" value={filterOperator}
          onChange={(e) => { setFilterOperator(e.target.value); setPage(1); }}
          placeholder="Filter by operator..."
          className="flex-1 rounded-[3px] border border-[#e0e0e0] px-3 py-1.5 text-sm text-[#111] outline-none focus:border-black"
        />
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-[#999]">Loading snapshots...</div>
      ) : error ? (
        <ErrorRetry message={error} onRetry={fetchSnapshots} />
      ) : snapshots.length === 0 ? (
        <div className="py-8 text-center text-sm text-[#999]">No snapshots found.</div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-[3px] border border-[#e0e0e0] bg-white">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                  <th className="px-3 py-2.5 text-left font-semibold text-[#666]">Product</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-[#666]">Source</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-[#666]">Sell</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-[#666]">Cost</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-[#666]">Margin</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-[#666]">Operator</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-[#666]">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ececec]">
                {snapshots.map((s) => (
                  <SnapshotRowInline
                    key={s.id}
                    s={s}
                    expanded={expandedId === s.id}
                    onToggle={() => setExpandedId(expandedId === s.id ? null : s.id)}
                    formatDate={formatDate}
                    marginColor={marginColor}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} setPage={setPage} />
        </>
      )}
    </div>
  );
}

function SnapshotRowInline({ s, expanded, onToggle, formatDate, marginColor }) {
  return (
    <>
      <tr onClick={onToggle} className="cursor-pointer hover:bg-[#fafafa]">
        <td className="px-3 py-2.5">
          <p className="font-medium text-[#111]">{s.productName || "--"}</p>
          <p className="text-[10px] text-[#999]">{s.productSlug || ""}</p>
        </td>
        <td className="px-3 py-2.5">
          <span className="rounded-[2px] bg-[#f0f0f0] px-1.5 py-0.5 text-[10px] font-medium text-[#666]">
            {(s.pricingSource || "").replace(/_/g, " ")}
          </span>
        </td>
        <td className="px-3 py-2.5 text-right font-mono text-[#111]">{formatCad(s.sellPriceCents)}</td>
        <td className="px-3 py-2.5 text-right font-mono text-[#666]">{s.totalCostCents > 0 ? formatCad(s.totalCostCents) : "--"}</td>
        <td className={`px-3 py-2.5 text-right font-bold ${marginColor(s.marginPct)}`}>
          {s.totalCostCents > 0 ? (s.marginPct || 0).toFixed(1) + "%" : "--"}
        </td>
        <td className="px-3 py-2.5 text-[#666]">{s.operatorName || "--"}</td>
        <td className="px-3 py-2.5 text-[#999]">{formatDate(s.createdAt)}</td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} className="border-t border-dashed border-[#e0e0e0] bg-[#fafafa] px-4 py-3">
            <div className="space-y-3">
              {s.note && (
                <div>
                  <p className="text-[10px] font-semibold uppercase text-[#999]">Note</p>
                  <p className="mt-0.5 text-xs text-[#666]">{s.note}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] font-semibold uppercase text-[#999]">Config Input</p>
                <pre className="mt-0.5 overflow-x-auto whitespace-pre-wrap rounded-[3px] border border-[#e0e0e0] bg-white p-2 text-[11px] font-mono text-[#666]">
                  {JSON.stringify(s.configInput, null, 2)}
                </pre>
              </div>
              {s.quoteLedger && (
                <div>
                  <p className="text-[10px] font-semibold uppercase text-[#999]">Quote Ledger</p>
                  <pre className="mt-0.5 max-h-48 overflow-auto whitespace-pre-wrap rounded-[3px] border border-[#e0e0e0] bg-white p-2 text-[11px] font-mono text-[#666]">
                    {JSON.stringify(s.quoteLedger, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
// CHANGE LOG SECTION
// ════════════════════════════════════════════════════════════════════

const SCOPE_OPTIONS = [
  { value: "", label: "All scopes" },
  { value: "product", label: "Product" },
  { value: "material", label: "Material" },
  { value: "setting", label: "Setting" },
  { value: "preset", label: "Preset" },
  { value: "b2b", label: "B2B" },
];

const SCOPE_COLORS = {
  product: "bg-blue-100 text-blue-800",
  material: "bg-green-100 text-green-800",
  setting: "bg-purple-100 text-purple-800",
  preset: "bg-amber-100 text-amber-800",
  b2b: "bg-pink-100 text-pink-800",
};

function ChangeLogSection() {
  const [changes, setChanges] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scope, setScope] = useState("");
  const [productSlug, setProductSlug] = useState("");
  const [highDrift, setHighDrift] = useState(false);
  const limit = 50;

  const fetchChanges = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (scope) params.set("scope", scope);
      if (productSlug.trim()) params.set("productSlug", productSlug.trim());
      if (highDrift) params.set("highDrift", "true");
      params.set("page", String(page));
      params.set("limit", String(limit));
      const res = await fetch(`/api/admin/pricing/change-log?${params}`);
      if (!res.ok) throw new Error("Failed to load change history");
      const data = await res.json();
      setChanges(data.changes || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [scope, productSlug, highDrift, page]);

  useEffect(() => { fetchChanges(); }, [fetchChanges]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-CA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  function fmtVal(label, value) {
    if (label) return label;
    if (value == null) return "-";
    if (typeof value === "number") {
      if (Number.isInteger(value) && value > 100) return formatCad(value);
      return String(value);
    }
    if (typeof value === "string") return value;
    try { return JSON.stringify(value); } catch { return String(value); }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-[#111]">Price Version History</h3>
        <p className="mt-0.5 text-xs text-[#999]">Track every pricing change across products, materials, settings, and presets.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-[10px] font-medium text-[#666]">Scope</label>
          <select
            value={scope}
            onChange={(e) => { setScope(e.target.value); setPage(1); }}
            className="mt-0.5 rounded-[3px] border border-[#e0e0e0] bg-white px-3 py-1.5 text-sm text-[#111] outline-none focus:border-black"
          >
            {SCOPE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-medium text-[#666]">Product Slug</label>
          <input
            type="text" value={productSlug}
            onChange={(e) => { setProductSlug(e.target.value); setPage(1); }}
            placeholder="e.g. die-cut-stickers"
            className="mt-0.5 rounded-[3px] border border-[#e0e0e0] px-3 py-1.5 text-sm text-[#111] outline-none focus:border-black"
          />
        </div>
        <label className="flex items-center gap-1.5 text-xs text-[#111] pb-0.5">
          <input
            type="checkbox" checked={highDrift}
            onChange={(e) => { setHighDrift(e.target.checked); setPage(1); }}
            className="rounded-[2px] border-[#e0e0e0]"
          />
          High drift (&gt;20%)
        </label>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-[#999]">Loading change history...</div>
      ) : error ? (
        <ErrorRetry message={error} onRetry={fetchChanges} />
      ) : changes.length === 0 ? (
        <div className="py-8 text-center text-sm text-[#999]">No changes found.</div>
      ) : (
        <>
          <p className="text-xs text-[#999]">
            Showing {(page - 1) * limit + 1} - {Math.min(page * limit, total)} of {total}
          </p>
          <div className="overflow-x-auto rounded-[3px] border border-[#e0e0e0] bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#666]">Date</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#666]">Scope</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#666]">Field</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#666]">Before</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#666]">After</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#666]">Drift</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#666]">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ececec]">
                {changes.map((c) => {
                  const isHighDrift = c.driftPct != null && Math.abs(c.driftPct) >= 20;
                  const isRolledBack = !!c.rolledBackAt;
                  return (
                    <tr key={c.id} className={isHighDrift ? "bg-amber-50" : "hover:bg-[#fafafa]"}>
                      <td className="whitespace-nowrap px-3 py-2 text-xs text-[#666]">{formatDate(c.createdAt)}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${SCOPE_COLORS[c.scope] || "bg-gray-100 text-gray-700"}`}>
                          {c.scope}
                        </span>
                      </td>
                      <td className={`max-w-[160px] truncate px-3 py-2 font-mono text-xs text-[#111] ${isRolledBack ? "line-through" : ""}`} title={c.field}>
                        {c.field}
                      </td>
                      <td className={`max-w-[100px] truncate px-3 py-2 text-[#666] ${isRolledBack ? "line-through" : ""}`}>
                        {fmtVal(c.labelBefore, c.valueBefore)}
                      </td>
                      <td className={`max-w-[100px] truncate px-3 py-2 text-[#111] ${isRolledBack ? "line-through" : ""}`}>
                        {fmtVal(c.labelAfter, c.valueAfter)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right">
                        {c.driftPct != null ? (
                          <span className={`text-xs font-medium ${isHighDrift ? "text-amber-700" : "text-[#666]"}`}>
                            {c.driftPct > 0 ? "+" : ""}{c.driftPct.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-xs text-[#ccc]">-</span>
                        )}
                      </td>
                      <td className="max-w-[80px] truncate px-3 py-2 text-xs text-[#666]">
                        {isRolledBack && <span className="mr-1 text-red-600">[RB]</span>}
                        {c.operatorName || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} setPage={setPage} />
        </>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ════════════════════════════════════════════════════════════════════

function MiniField({ label, value, onChange, type = "text", required = false }) {
  return (
    <div>
      <label className="block text-[10px] font-medium text-[#666]">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        step={type === "number" ? "any" : undefined}
        className="mt-0.5 w-full rounded-[3px] border border-[#e0e0e0] px-2 py-1.5 text-sm text-[#111] outline-none focus:border-black"
      />
    </div>
  );
}

function Pagination({ page, totalPages, setPage }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between">
      <p className="text-xs text-[#999]">Page {page} of {totalPages}</p>
      <div className="flex gap-1">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          className="rounded-[3px] border border-[#e0e0e0] px-3 py-1 text-xs text-[#666] hover:bg-[#fafafa] disabled:opacity-40"
        >
          Previous
        </button>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          className="rounded-[3px] border border-[#e0e0e0] px-3 py-1 text-xs text-[#666] hover:bg-[#fafafa] disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function ErrorRetry({ message, onRetry }) {
  return (
    <div className="rounded-[3px] border border-red-200 bg-red-50 p-4 text-center">
      <p className="text-sm text-red-700">{message}</p>
      <button
        onClick={onRetry}
        className="mt-2 rounded-[3px] bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
      >
        Retry
      </button>
    </div>
  );
}
