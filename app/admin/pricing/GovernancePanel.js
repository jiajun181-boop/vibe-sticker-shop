"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { formatCad } from "@/lib/admin/format-cad";
import { pricingGovernancePath, pricingQuotePath } from "@/lib/admin/pricing-routes";

// ── Sub-tab definitions ──────────────────────────────────────────
const SUB_TAB_IDS = ["approvals", "b2b", "vendor", "snapshots", "changelog"];
const SUB_TAB_LABEL_KEYS = {
  approvals: "admin.pc.approvals",
  b2b: "admin.pc.b2bRules",
  vendor: "admin.pc.vendorCosts",
  snapshots: "admin.pc.snapshots",
  changelog: "admin.pc.changeLog",
};

export default function GovernancePanel({ returnTo }) {
  const { t, locale } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const sectionParam = searchParams.get("section") || "approvals";
  const [activeSection, setActiveSection] = useState(sectionParam);

  // Sync with URL param changes
  useEffect(() => {
    if (sectionParam && SUB_TAB_IDS.includes(sectionParam)) {
      setActiveSection(sectionParam);
    }
  }, [sectionParam]);

  function switchSection(id) {
    setActiveSection(id);
    // Preserve returnTo across sub-section switches
    router.push(pricingGovernancePath(id, undefined, returnTo || undefined), { scroll: false });
  }

  return (
    <div className="space-y-5">
      {/* Sub-tab bar */}
      <div className="flex flex-wrap gap-1">
        {SUB_TAB_IDS.map((id) => (
          <button
            key={id}
            onClick={() => switchSection(id)}
            className={`rounded-[3px] px-3.5 py-2 text-xs font-medium transition-colors ${
              activeSection === id
                ? "bg-black text-white"
                : "bg-[#f0f0f0] text-[#666] hover:bg-[#e0e0e0] hover:text-[#111]"
            }`}
          >
            {t(SUB_TAB_LABEL_KEYS[id])}
          </button>
        ))}
      </div>

      {/* Section content */}
      {activeSection === "approvals" && <ApprovalsSection returnTo={returnTo} />}
      {activeSection === "b2b" && <B2BRulesSection />}
      {activeSection === "vendor" && <VendorCostsSection returnTo={returnTo} />}
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

function ApprovalsSection({ returnTo }) {
  const { t, locale } = useTranslation();
  const searchParams = useSearchParams();
  const hasApprovalTarget = !!searchParams.get("approvalId");
  const [tab, setTab] = useState("pending");
  const fmtDate = (d) => new Date(d).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-CA");
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#111]">{t("admin.pc.pricingApprovals")}</h3>
          <p className="mt-0.5 text-xs text-[#999]">
            {hasApprovalTarget ? t("admin.pc.focusedView") : t("admin.pc.approvalsDesc")}
          </p>
        </div>
        <div className="flex gap-1">
          {hasApprovalTarget && (
            <button
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.delete("approvalId");
                window.history.replaceState(null, "", url.toString());
                window.location.reload();
              }}
              className="rounded-[3px] border border-[#e0e0e0] bg-white px-2.5 py-1.5 text-xs text-[#666] hover:border-black hover:text-[#111]"
            >
              {t("admin.pc.showAll")}
            </button>
          )}
          <button
            onClick={() => setTab("pending")}
            className={`rounded-[3px] px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === "pending" ? "bg-black text-white" : "border border-[#e0e0e0] text-[#666] hover:text-[#111]"
            }`}
          >
            {t("admin.pc.pending")}
          </button>
          <button
            onClick={() => setTab("history")}
            className={`rounded-[3px] px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === "history" ? "bg-black text-white" : "border border-[#e0e0e0] text-[#666] hover:text-[#111]"
            }`}
          >
            {t("admin.pc.history")}
          </button>
        </div>
      </div>
      {tab === "pending" ? <ApprovalsPending returnTo={returnTo} /> : <ApprovalsHistory />}
    </div>
  );
}

function ApprovalsPending({ returnTo }) {
  const { t, locale } = useTranslation();
  const searchParams = useSearchParams();
  const targetApprovalId = searchParams.get("approvalId");
  const targetRef = useRef(null);
  const [highlightedApprovalId, setHighlightedApprovalId] = useState(targetApprovalId);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [actionDone, setActionDone] = useState(false);
  const [remainingPending, setRemainingPending] = useState(null);
  const [notes, setNotes] = useState({});

  // Focused mode: when approvalId exists, scope the API query
  const isFocused = !!targetApprovalId;

  const fetchPending = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (targetApprovalId) params.set("approvalId", targetApprovalId);
      const res = await fetch(`/api/admin/pricing/approvals?${params}`);
      if (!res.ok) throw new Error("failedLoadApprovals");
      const data = await res.json();
      setApprovals(data.approvals || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [targetApprovalId]);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  // Auto-scroll to target approval row after data loads
  useEffect(() => {
    if (targetApprovalId && targetRef.current && !loading) {
      targetRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [targetApprovalId, loading]);

  // Clear highlight after 5 seconds
  useEffect(() => {
    if (highlightedApprovalId) {
      const timer = setTimeout(() => setHighlightedApprovalId(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [highlightedApprovalId]);

  async function handleAction(approvalId, action) {
    setActionLoading(approvalId);
    try {
      const res = await fetch("/api/admin/pricing/approvals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalId, action, note: notes[approvalId] || "" }),
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "actionFailed");
      }
      setApprovals((prev) => prev.filter((a) => a.id !== approvalId));
      setActionDone(true);
      // Use server-provided remaining count so UI reflects truthful queue state
      if (resData.remainingPending != null) setRemainingPending(resData.remainingPending);
      // Clear highlight on the actioned item so it doesn't persist
      if (highlightedApprovalId === approvalId) setHighlightedApprovalId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) return <div className="py-8 text-center text-sm text-[#999]">{t("admin.pc.loading")}</div>;
  if (error) return <ErrorRetry message={error} onRetry={fetchPending} />;
  if (approvals.length === 0) {
    return (
      <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-8 text-center">
        <p className="text-sm text-[#999]">{t("admin.pc.noPending")}</p>
        <p className="mt-0.5 text-xs text-[#ccc]">{t("admin.pc.allReviewed")}</p>
        {actionDone && returnTo && (
          <Link href={returnTo} className="mt-2 inline-flex items-center gap-1 text-xs text-green-700 hover:underline">
            {t("admin.pc.returnAfterFix")} &rarr;
          </Link>
        )}
      </div>
    );
  }

  const hasOverdue = approvals.some((a) => {
    const age = Date.now() - new Date(a.createdAt).getTime();
    return age > 7 * 24 * 60 * 60 * 1000;
  });

  return (
    <div className="space-y-3">
      {actionDone && returnTo && (
        <div className="flex items-center gap-2 rounded-[3px] border border-green-200 bg-green-50 px-3 py-2">
          <Link href={returnTo} className="text-xs text-green-700 hover:underline">
            {t("admin.pc.returnAfterFix")} &rarr;
          </Link>
        </div>
      )}
      {/* Urgency banner — prefer server-provided remainingPending over local count */}
      {(() => {
        const displayCount = remainingPending != null ? remainingPending : approvals.length;
        return (
      <div className={`flex items-center gap-2 rounded-[3px] px-3 py-2 text-xs font-medium ${hasOverdue ? "border border-red-200 bg-red-50 text-red-800" : "border border-amber-200 bg-amber-50 text-amber-800"}`}>
        <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${hasOverdue ? "bg-red-600" : "bg-amber-600"}`}>
          {displayCount}
        </span>
        <span>{t("admin.pc.approvalsWaiting", { n: displayCount })}</span>
        {hasOverdue && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
            {t("admin.pc.overdue")}
          </span>
        )}
      </div>
        );
      })()}
      <div className="overflow-hidden rounded-[3px] border border-[#e0e0e0] bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#666]">{t("admin.pc.colChange")}</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#666]">{t("admin.pc.colScopeTarget")}</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#666]">{t("admin.pc.colRequester")}</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#666]">{t("admin.pc.colDate")}</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#666]">{t("admin.pc.colNote")}</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#666]">{t("admin.pc.colActions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ececec]">
            {approvals.map((a) => {
              const isTarget = highlightedApprovalId && a.id === highlightedApprovalId;
              return (
              <tr
                key={a.id}
                ref={isTarget ? targetRef : undefined}
                className={`hover:bg-[#fafafa] ${isTarget ? "border-l-[3px] border-l-amber-400 bg-amber-50/30" : ""}`}
              >
                <td className="px-3 py-2.5">
                  <p className="text-sm font-medium text-[#111]">{a.changeType}</p>
                  <p className="mt-0.5 text-xs text-[#999] max-w-[180px] truncate">{a.description}</p>
                </td>
                <td className="px-3 py-2.5">
                  <p className="text-sm text-[#111]">{a.targetName || "--"}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[#999]">{a.scope}</span>
                    {a.targetSlug && a.scope === "product" && (
                      <Link href={pricingQuotePath(a.targetSlug)} className="text-[10px] font-medium text-blue-600 hover:text-blue-800 hover:underline">
                        {t("admin.pc.viewProduct")}
                      </Link>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <p className="text-sm text-[#111]">{a.requesterName}</p>
                  <p className="text-xs text-[#999]">{a.requesterRole}</p>
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap text-xs text-[#666]">
                  {new Date(a.createdAt).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-CA")}
                </td>
                <td className="px-3 py-2.5">
                  <input
                    type="text"
                    placeholder={t("admin.pc.notePlaceholder")}
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
                      {t("admin.pc.approve")}
                    </button>
                    <button
                      onClick={() => handleAction(a.id, "reject")}
                      disabled={actionLoading === a.id}
                      className="rounded-[3px] bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {t("admin.pc.reject")}
                    </button>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ApprovalsHistory() {
  const { t, locale } = useTranslation();
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
      if (!res.ok) throw new Error("failedLoadHistory");
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

  if (loading) return <div className="py-8 text-center text-sm text-[#999]">{t("admin.pc.loading")}</div>;
  if (error) return <ErrorRetry message={error} onRetry={fetchHistory} />;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-[3px] border border-[#e0e0e0] bg-white px-3 py-1.5 text-sm text-[#111] outline-none focus:border-black"
        >
          <option value="">{t("admin.pc.allStatuses")}</option>
          <option value="approved">{t("admin.pc.approvedStatus")}</option>
          <option value="rejected">{t("admin.pc.rejectedStatus")}</option>
          <option value="expired">{t("admin.pc.expiredStatus")}</option>
        </select>
        <span className="text-xs text-[#999]">{t("admin.pc.nResults", { n: total })}</span>
      </div>

      {approvals.length === 0 ? (
        <div className="py-8 text-center text-sm text-[#999]">{t("admin.pc.noApprovalsFound")}</div>
      ) : (
        <>
          <div className="overflow-hidden rounded-[3px] border border-[#e0e0e0] bg-white">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#666]">{t("admin.pc.colStatus")}</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#666]">{t("admin.pc.colChange")}</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#666]">{t("admin.pc.colDescription")}</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#666]">{t("admin.pc.colRequester")}</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#666]">{t("admin.pc.colReviewer")}</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#666]">{t("admin.pc.colReviewed")}</th>
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
                      {a.reviewedAt ? new Date(a.reviewedAt).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-CA") : "--"}
                      {a.reviewNote && (
                        <p className="text-[10px] text-[#999] italic max-w-[120px] truncate">{"\u201C"}{a.reviewNote}{"\u201D"}</p>
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

const RULE_TYPE_KEYS = {
  pct_discount: "admin.pc.ruleTypePctDiscount",
  fixed_price: "admin.pc.ruleTypeFixedPrice",
  cost_plus_override: "admin.pc.ruleTypeCostPlus",
  margin_override: "admin.pc.ruleTypeMarginOverride",
};
const RULE_TYPES = Object.keys(RULE_TYPE_KEYS);
const TIERS = ["bronze", "silver", "gold", "platinum"];

const EMPTY_B2B_FORM = {
  userId: "", companyName: "", partnerTier: "",
  productSlug: "", category: "", templateKey: "",
  ruleType: "pct_discount", value: "",
  minQty: "", maxQty: "",
  validFrom: "", validUntil: "", note: "",
};

function B2BRulesSection() {
  const { t } = useTranslation();
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
      if (!res.ok) throw new Error("failedLoadB2B");
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
    const timer = setTimeout(() => setSuccessMsg(null), 5000);
    return () => clearTimeout(timer);
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
        setSuccessMsg(t("admin.pc.ruleSubmitted", { id: data.approvalId }));
      } else if (data.rule) {
        setSuccessMsg(t("admin.pc.ruleCreated"));
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
    if (!confirm(t("admin.pc.confirmDeactivateB2B"))) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/pricing/b2b-rules/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t("admin.pc.failedDeactivateRule"));
      }
      setSuccessMsg(t("admin.pc.ruleDeactivated"));
      fetchRules();
    } catch (err) {
      setError(err.message);
    }
  }

  function formatTarget(rule) {
    if (rule.userId) return t("admin.pc.targetUser", { id: rule.userId });
    if (rule.companyName) return t("admin.pc.targetCompany", { name: rule.companyName });
    if (rule.partnerTier) return t("admin.pc.targetTier", { tier: rule.partnerTier });
    return t("admin.pc.targetGlobal");
  }

  function formatScope(rule) {
    const parts = [];
    if (rule.productSlug) parts.push(t("admin.pc.scopeProduct", { slug: rule.productSlug }));
    if (rule.category) parts.push(t("admin.pc.scopeCategory", { cat: rule.category }));
    if (rule.templateKey) parts.push(t("admin.pc.scopeTemplate", { key: rule.templateKey }));
    return parts.length ? parts.join(", ") : t("admin.pc.scopeAllProducts");
  }

  function formatRuleValue(rule) {
    if (rule.ruleType === "pct_discount") return `${rule.value}%`;
    if (rule.ruleType === "fixed_price") return formatCad(rule.value);
    return t("admin.pc.pctMargin", { val: rule.value });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#111]">{t("admin.pc.b2bTitle")}</h3>
          <p className="mt-0.5 text-xs text-[#999]">{t("admin.pc.b2bDesc")}</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setForm({ ...EMPTY_B2B_FORM }); }}
          className="rounded-[3px] bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-[#222]"
        >
          {showForm ? t("admin.pc.cancel") : t("admin.pc.newRule")}
        </button>
      </div>

      {successMsg && (
        <div className="rounded-[3px] border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800">{successMsg}</div>
      )}
      {error && (
        <div className="rounded-[3px] border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-medium underline">{t("admin.pc.dismiss")}</button>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-[3px] border border-[#e0e0e0] bg-white p-4 space-y-3">
          <h4 className="text-xs font-bold text-[#111]">{t("admin.pc.createNewB2BRule")}</h4>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <MiniField label={t("admin.pc.fieldUserId")} value={form.userId} onChange={(v) => setForm({ ...form, userId: v })} />
            <MiniField label={t("admin.pc.fieldCompany")} value={form.companyName} onChange={(v) => setForm({ ...form, companyName: v })} />
            <div>
              <label className="block text-[10px] font-medium text-[#666]">{t("admin.pc.fieldPartnerTier")}</label>
              <select
                value={form.partnerTier}
                onChange={(e) => setForm({ ...form, partnerTier: e.target.value })}
                className="mt-0.5 w-full rounded-[3px] border border-[#e0e0e0] px-2 py-1.5 text-sm text-[#111] outline-none focus:border-black"
              >
                <option value="">{t("admin.pc.optionNone")}</option>
                {TIERS.map((tier) => <option key={tier} value={tier}>{tier.charAt(0).toUpperCase() + tier.slice(1)}</option>)}
              </select>
            </div>
            <MiniField label={t("admin.pc.fieldProductSlug")} value={form.productSlug} onChange={(v) => setForm({ ...form, productSlug: v })} />
            <MiniField label={t("admin.pc.fieldCategory")} value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
            <MiniField label={t("admin.pc.fieldTemplateKey")} value={form.templateKey} onChange={(v) => setForm({ ...form, templateKey: v })} />
            <div>
              <label className="block text-[10px] font-medium text-[#666]">{t("admin.pc.fieldRuleType")}</label>
              <select
                value={form.ruleType}
                onChange={(e) => setForm({ ...form, ruleType: e.target.value })}
                className="mt-0.5 w-full rounded-[3px] border border-[#e0e0e0] px-2 py-1.5 text-sm text-[#111] outline-none focus:border-black"
                required
              >
                {RULE_TYPES.map((rt) => <option key={rt} value={rt}>{t(RULE_TYPE_KEYS[rt])}</option>)}
              </select>
            </div>
            <MiniField label={t("admin.pc.fieldValue")} value={form.value} onChange={(v) => setForm({ ...form, value: v })} type="number" required />
            <MiniField label={t("admin.pc.fieldMinQty")} value={form.minQty} onChange={(v) => setForm({ ...form, minQty: v })} type="number" />
            <MiniField label={t("admin.pc.fieldMaxQty")} value={form.maxQty} onChange={(v) => setForm({ ...form, maxQty: v })} type="number" />
            <MiniField label={t("admin.pc.fieldValidFrom")} value={form.validFrom} onChange={(v) => setForm({ ...form, validFrom: v })} type="date" />
            <MiniField label={t("admin.pc.fieldValidUntil")} value={form.validUntil} onChange={(v) => setForm({ ...form, validUntil: v })} type="date" />
            <MiniField label={t("admin.pc.fieldNote")} value={form.note} onChange={(v) => setForm({ ...form, note: v })} />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="rounded-[3px] bg-black px-4 py-1.5 text-xs font-medium text-white hover:bg-[#222] disabled:opacity-50">
              {saving ? t("admin.pc.saving") : t("admin.pc.createRule")}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-[3px] border border-[#e0e0e0] px-4 py-1.5 text-xs text-[#666] hover:bg-[#fafafa]">
              {t("admin.pc.cancel")}
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
          <option value="">{t("admin.pc.allTiers")}</option>
          {TIERS.map((tier) => <option key={tier} value={tier}>{tier.charAt(0).toUpperCase() + tier.slice(1)}</option>)}
        </select>
        <select
          value={filterActive}
          onChange={(e) => { setFilterActive(e.target.value); setPage(1); }}
          className="rounded-[3px] border border-[#e0e0e0] bg-white px-3 py-1.5 text-sm text-[#111] outline-none focus:border-black"
        >
          <option value="all">{t("admin.pc.allStatusesFilter")}</option>
          <option value="active">{t("admin.pc.activeOnly")}</option>
          <option value="inactive">{t("admin.pc.inactiveOnly")}</option>
        </select>
      </div>

      {/* Rules list */}
      {loading ? (
        <div className="py-8 text-center text-sm text-[#999]">{t("admin.pc.loading")}</div>
      ) : rules.length === 0 ? (
        <div className="py-8 text-center text-sm text-[#999]">{t("admin.pc.noB2BRules")}</div>
      ) : (
        <>
          <p className="text-xs text-[#999]">{t("admin.pc.nOfTotal", { n: rules.length, total })}</p>
          <div className="overflow-x-auto rounded-[3px] border border-[#e0e0e0] bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#666]">{t("admin.pc.colTarget")}</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#666]">{t("admin.pc.colScope")}</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#666]">{t("admin.pc.colRule")}</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#666]">{t("admin.pc.colValue")}</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#666]">{t("admin.pc.colStatus")}</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#666]">{t("admin.pc.colActions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ececec]">
                {rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-[#fafafa]">
                    <td className="px-3 py-2.5 text-[#111]">{formatTarget(rule)}</td>
                    <td className="px-3 py-2.5 max-w-[200px]">
                      {rule.productSlug && (
                        <Link href={pricingQuotePath(rule.productSlug)} className="block text-sm text-blue-600 hover:text-blue-800 hover:underline truncate" title={rule.productSlug}>
                          {t("admin.pc.scopeProduct", { slug: rule.productSlug })}
                        </Link>
                      )}
                      {(rule.category || rule.templateKey || !rule.productSlug) && (
                        <span className="text-[#666] truncate block">{formatScope({ ...rule, productSlug: null })}</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-[#666]">{t(RULE_TYPE_KEYS[rule.ruleType]) || rule.ruleType}</td>
                    <td className="px-3 py-2.5 font-medium text-[#111]">{formatRuleValue(rule)}</td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        rule.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"
                      }`}>
                        {rule.isActive ? t("admin.pc.active") : t("admin.pc.inactive")}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {rule.isActive && (
                        <button
                          onClick={() => handleDeactivate(rule.id)}
                          className="rounded-[3px] border border-red-200 px-2 py-0.5 text-xs text-red-600 hover:bg-red-50"
                        >
                          {t("admin.pc.deactivate")}
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

function VendorCostsSection({ returnTo }) {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const targetProductSlug = searchParams.get("productSlug");
  const isFocused = !!targetProductSlug;
  const targetRef = useRef(null);
  const [highlightedSlug, setHighlightedSlug] = useState(targetProductSlug);
  const [costs, setCosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterVendor, setFilterVendor] = useState("");
  const [filterProduct, setFilterProduct] = useState(targetProductSlug || "");
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
      if (!res.ok) throw new Error("failedLoadVendor");
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

  // Auto-scroll to target vendor cost row after data loads
  useEffect(() => {
    if (targetProductSlug && targetRef.current && !loading) {
      targetRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [targetProductSlug, loading]);

  // Clear highlight after 5 seconds
  useEffect(() => {
    if (highlightedSlug) {
      const timer = setTimeout(() => setHighlightedSlug(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [highlightedSlug]);

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
    if (!form.vendorName.trim()) { setFormError(t("admin.pc.vendorRequired")); return; }
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
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || t("admin.pc.saveFailed")); }
      cancelForm();
      fetchCosts();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t("admin.pc.confirmDeactivateVendor"))) return;
    try {
      const res = await fetch(`/api/admin/pricing/vendor-costs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(t("admin.pc.deleteFailed"));
      fetchCosts();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#111]">{t("admin.pc.vendorTitle")}</h3>
          <p className="mt-0.5 text-xs text-[#999]">
            {isFocused ? t("admin.pc.focusedView") : <>{t("admin.pc.vendorDesc")} {total} entries.</>}
          </p>
        </div>
        <div className="flex gap-1">
          {isFocused && (
            <button
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.delete("productSlug");
                window.history.replaceState(null, "", url.toString());
                setFilterProduct("");
              }}
              className="rounded-[3px] border border-[#e0e0e0] bg-white px-2.5 py-1.5 text-xs text-[#666] hover:border-black hover:text-[#111]"
            >
              {t("admin.pc.showAll")}
            </button>
          )}
          <button onClick={openNew} className="rounded-[3px] bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-[#222]">
            {t("admin.pc.newVendorCost")}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <input
          type="text" value={filterVendor}
          onChange={(e) => { setFilterVendor(e.target.value); setPage(1); }}
          placeholder={t("admin.pc.filterByVendor")}
          className="flex-1 rounded-[3px] border border-[#e0e0e0] px-3 py-1.5 text-sm text-[#111] outline-none focus:border-black"
        />
        <input
          type="text" value={filterProduct}
          onChange={(e) => { setFilterProduct(e.target.value); setPage(1); }}
          placeholder={t("admin.pc.filterByProductSlug")}
          className="flex-1 rounded-[3px] border border-[#e0e0e0] px-3 py-1.5 text-sm text-[#111] outline-none focus:border-black"
        />
      </div>

      {error && <div className="rounded-[3px] border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{error}</div>}

      {/* Form */}
      {showForm && (
        <form onSubmit={submitForm} className="rounded-[3px] border border-[#e0e0e0] bg-white p-4 space-y-3">
          <h4 className="text-xs font-bold text-[#111]">{editId ? t("admin.pc.editVendorCost") : t("admin.pc.newVendorCost")}</h4>
          {formError && <div className="rounded-[3px] border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-800">{formError}</div>}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <MiniField label={t("admin.pc.fieldProductSlug")} value={form.productSlug} onChange={(v) => setField("productSlug", v)} />
            <MiniField label={t("admin.pc.fieldProductName")} value={form.productName} onChange={(v) => setField("productName", v)} />
            <MiniField label={t("admin.pc.fieldVendorName")} value={form.vendorName} onChange={(v) => setField("vendorName", v)} required />
            <MiniField label={t("admin.pc.fieldVendorSku")} value={form.vendorSku} onChange={(v) => setField("vendorSku", v)} />
            <MiniField label={t("admin.pc.fieldSizeKey")} value={form.sizeKey} onChange={(v) => setField("sizeKey", v)} />
            <MiniField label={t("admin.pc.fieldQtyTier")} value={form.qtyTier} onChange={(v) => setField("qtyTier", v)} type="number" />
            <MiniField label={t("admin.pc.fieldUnitCost")} value={form.unitCostCents} onChange={(v) => setField("unitCostCents", v)} type="number" />
            <MiniField label={t("admin.pc.fieldSetupFee")} value={form.setupFeeCents} onChange={(v) => setField("setupFeeCents", v)} type="number" />
            <MiniField label={t("admin.pc.fieldShipping")} value={form.shippingCents} onChange={(v) => setField("shippingCents", v)} type="number" />
            <MiniField label={t("admin.pc.fieldLeadTime")} value={form.leadTimeDays} onChange={(v) => setField("leadTimeDays", v)} type="number" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="rounded-[3px] bg-black px-4 py-1.5 text-xs font-medium text-white hover:bg-[#222] disabled:opacity-50">
              {saving ? t("admin.pc.saving") : editId ? t("admin.pc.update") : t("admin.pc.create")}
            </button>
            <button type="button" onClick={cancelForm} className="rounded-[3px] border border-[#e0e0e0] px-4 py-1.5 text-xs text-[#666] hover:bg-[#fafafa]">
              {t("admin.pc.cancel")}
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      {loading ? (
        <div className="py-8 text-center text-sm text-[#999]">{t("admin.pc.loadingVendor")}</div>
      ) : costs.length === 0 ? (
        <div className="py-8 text-center text-sm text-[#999]">
          {t("admin.pc.noVendorCosts")} <button onClick={openNew} className="text-[#111] underline">{t("admin.pc.addOne")}</button>.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-[3px] border border-[#e0e0e0] bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[#666]">{t("admin.pc.colProduct")}</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[#666]">{t("admin.pc.colVendor")}</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[#666]">{t("admin.pc.colSku")}</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-[#666]">{t("admin.pc.colUnitCost")}</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-[#666]">{t("admin.pc.colSetup")}</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[#666]">{t("admin.pc.colLead")}</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[#666]">{t("admin.pc.colActions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ececec]">
                {costs.map((c) => {
                  const isTarget = highlightedSlug && c.productSlug === highlightedSlug;
                  return (
                  <tr
                    key={c.id}
                    ref={isTarget ? targetRef : undefined}
                    className={`hover:bg-[#fafafa] ${isTarget ? "border-l-[3px] border-l-amber-400 bg-amber-50/30" : ""}`}
                  >
                    <td className="px-3 py-2">
                      {c.productSlug ? (
                        <Link href={pricingQuotePath(c.productSlug)} className="font-medium text-blue-600 hover:text-blue-800 hover:underline" title={c.productSlug}>
                          {c.productName || c.productSlug}
                        </Link>
                      ) : (
                        <p className="font-medium text-[#111]">{c.productName || "-"}</p>
                      )}
                    </td>
                    <td className="px-3 py-2 text-[#111]">{c.vendorName}</td>
                    <td className="px-3 py-2 text-[#888] font-mono text-xs">{c.vendorSku || "-"}</td>
                    <td className="px-3 py-2 text-right font-mono text-[#111]">{formatCad(c.unitCostCents)}</td>
                    <td className="px-3 py-2 text-right font-mono text-[#888]">{c.setupFeeCents ? formatCad(c.setupFeeCents) : "-"}</td>
                    <td className="px-3 py-2 text-[#111]">{c.leadTimeDays != null ? `${c.leadTimeDays}d` : "-"}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(c)} className="rounded-[3px] border border-[#e0e0e0] px-2 py-0.5 text-xs text-[#666] hover:bg-[#fafafa]">{t("admin.pc.edit")}</button>
                        <button onClick={() => handleDelete(c.id)} className="rounded-[3px] border border-red-200 px-2 py-0.5 text-xs text-red-600 hover:bg-red-50">{t("admin.pc.delete")}</button>
                      </div>
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
// SNAPSHOTS SECTION
// ════════════════════════════════════════════════════════════════════

function SnapshotsSection() {
  const { t, locale } = useTranslation();
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
      if (!res.ok) throw new Error("failedLoadSnapshots");
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

  const dateLoc = locale === "zh" ? "zh-CN" : "en-CA";
  const formatDate = (dateStr) => {
    if (!dateStr) return "--";
    const d = new Date(dateStr);
    return d.toLocaleDateString(dateLoc) + " " + d.toLocaleTimeString(dateLoc, { hour: "2-digit", minute: "2-digit" });
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
          <h3 className="text-sm font-bold text-[#111]">{t("admin.pc.quoteSnapshots")}</h3>
          <p className="mt-0.5 text-xs text-[#999]">{t("admin.pc.quoteSnapshotsDesc")} {total > 0 && t("admin.pc.nTotal", { n: total })}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <input
          type="text" value={filterSlug}
          onChange={(e) => { setFilterSlug(e.target.value); setPage(1); }}
          placeholder={t("admin.pc.filterByProductSlug")}
          className="flex-1 rounded-[3px] border border-[#e0e0e0] px-3 py-1.5 text-sm text-[#111] outline-none focus:border-black"
        />
        <input
          type="text" value={filterOperator}
          onChange={(e) => { setFilterOperator(e.target.value); setPage(1); }}
          placeholder={t("admin.pc.filterByOperator")}
          className="flex-1 rounded-[3px] border border-[#e0e0e0] px-3 py-1.5 text-sm text-[#111] outline-none focus:border-black"
        />
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-[#999]">{t("admin.pc.loadingSnapshots")}</div>
      ) : error ? (
        <ErrorRetry message={error} onRetry={fetchSnapshots} />
      ) : snapshots.length === 0 ? (
        <div className="py-8 text-center text-sm text-[#999]">{t("admin.pc.noSnapshots")}</div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-[3px] border border-[#e0e0e0] bg-white">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                  <th className="px-3 py-2.5 text-left font-semibold text-[#666]">{t("admin.pc.colProduct")}</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-[#666]">{t("admin.pc.colSource")}</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-[#666]">{t("admin.pc.sell")}</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-[#666]">{t("admin.pc.cost")}</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-[#666]">{t("admin.pc.margin")}</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-[#666]">{t("admin.pc.colOperator")}</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-[#666]">{t("admin.pc.colDate")}</th>
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
  const { t } = useTranslation();
  return (
    <>
      <tr onClick={onToggle} className="cursor-pointer hover:bg-[#fafafa]">
        <td className="px-3 py-2.5">
          {s.productSlug ? (
            <Link href={pricingQuotePath(s.productSlug)} onClick={(e) => e.stopPropagation()} className="font-medium text-blue-600 hover:text-blue-800 hover:underline">
              {s.productName || s.productSlug}
            </Link>
          ) : (
            <p className="font-medium text-[#111]">{s.productName || "--"}</p>
          )}
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
                  <p className="text-[10px] font-semibold uppercase text-[#999]">{t("admin.pc.noteLabel")}</p>
                  <p className="mt-0.5 text-xs text-[#666]">{s.note}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] font-semibold uppercase text-[#999]">{t("admin.pc.configInput")}</p>
                <pre className="mt-0.5 overflow-x-auto whitespace-pre-wrap rounded-[3px] border border-[#e0e0e0] bg-white p-2 text-[11px] font-mono text-[#666]">
                  {JSON.stringify(s.configInput, null, 2)}
                </pre>
              </div>
              {s.quoteLedger && (
                <div>
                  <p className="text-[10px] font-semibold uppercase text-[#999]">{t("admin.pc.quoteLedger")}</p>
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
  { value: "", key: "admin.pc.scopeAll" },
  { value: "product", key: "admin.pc.scopeProductOpt" },
  { value: "material", key: "admin.pc.scopeMaterial" },
  { value: "setting", key: "admin.pc.scopeSetting" },
  { value: "preset", key: "admin.pc.scopePreset" },
  { value: "b2b", key: "admin.pc.scopeB2B" },
];

const SCOPE_COLORS = {
  product: "bg-blue-100 text-blue-800",
  material: "bg-green-100 text-green-800",
  setting: "bg-purple-100 text-purple-800",
  preset: "bg-amber-100 text-amber-800",
  b2b: "bg-pink-100 text-pink-800",
};

function ChangeLogSection() {
  const { t, locale } = useTranslation();
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
      if (!res.ok) throw new Error("failedLoadChangeLog");
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
    return d.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-CA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
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
        <h3 className="text-sm font-bold text-[#111]">{t("admin.pc.priceVersionHistory")}</h3>
        <p className="mt-0.5 text-xs text-[#999]">{t("admin.pc.priceVersionHistoryDesc")}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-[10px] font-medium text-[#666]">{t("admin.pc.scopeLabel")}</label>
          <select
            value={scope}
            onChange={(e) => { setScope(e.target.value); setPage(1); }}
            className="mt-0.5 rounded-[3px] border border-[#e0e0e0] bg-white px-3 py-1.5 text-sm text-[#111] outline-none focus:border-black"
          >
            {SCOPE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{t(opt.key)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-medium text-[#666]">{t("admin.pc.productSlugLabel")}</label>
          <input
            type="text" value={productSlug}
            onChange={(e) => { setProductSlug(e.target.value); setPage(1); }}
            placeholder={t("admin.pc.productSlugPlaceholder")}
            className="mt-0.5 rounded-[3px] border border-[#e0e0e0] px-3 py-1.5 text-sm text-[#111] outline-none focus:border-black"
          />
        </div>
        <label className="flex items-center gap-1.5 text-xs text-[#111] pb-0.5">
          <input
            type="checkbox" checked={highDrift}
            onChange={(e) => { setHighDrift(e.target.checked); setPage(1); }}
            className="rounded-[2px] border-[#e0e0e0]"
          />
          {t("admin.pc.highDriftLabel")}
        </label>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-[#999]">{t("admin.pc.loadingChangeLog")}</div>
      ) : error ? (
        <ErrorRetry message={error} onRetry={fetchChanges} />
      ) : changes.length === 0 ? (
        <div className="py-8 text-center text-sm text-[#999]">{t("admin.pc.noChangesFound")}</div>
      ) : (
        <>
          <p className="text-xs text-[#999]">
            {t("admin.pc.showingRange", { start: (page - 1) * limit + 1, end: Math.min(page * limit, total), total })}
          </p>
          <div className="overflow-x-auto rounded-[3px] border border-[#e0e0e0] bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#666]">{t("admin.pc.colDate")}</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#666]">{t("admin.pc.colScope")}</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#666]">{t("admin.pc.colField")}</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#666]">{t("admin.pc.colBefore")}</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#666]">{t("admin.pc.colAfter")}</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#666]">{t("admin.pc.colDrift")}</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#666]">{t("admin.pc.colOperator")}</th>
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
                        {c.productSlug && (
                          <Link href={pricingQuotePath(c.productSlug)} className="ml-1.5 text-[10px] font-medium text-blue-600 hover:text-blue-800 hover:underline" title={c.productSlug}>
                            {c.productName || c.productSlug}
                          </Link>
                        )}
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
  const { t } = useTranslation();
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between">
      <p className="text-xs text-[#999]">{t("admin.pc.pageOf", { page, total: totalPages })}</p>
      <div className="flex gap-1">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          className="rounded-[3px] border border-[#e0e0e0] px-3 py-1 text-xs text-[#666] hover:bg-[#fafafa] disabled:opacity-40"
        >
          {t("admin.pc.previous")}
        </button>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          className="rounded-[3px] border border-[#e0e0e0] px-3 py-1 text-xs text-[#666] hover:bg-[#fafafa] disabled:opacity-40"
        >
          {t("admin.pc.next")}
        </button>
      </div>
    </div>
  );
}

function ErrorRetry({ message, onRetry }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-[3px] border border-red-200 bg-red-50 p-4 text-center">
      <p className="text-sm text-red-700">{t("admin.pc." + message) || message}</p>
      <button
        onClick={onRetry}
        className="mt-2 rounded-[3px] bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
      >
        {t("admin.pc.retry")}
      </button>
    </div>
  );
}
