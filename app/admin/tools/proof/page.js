"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { uploadDesignSnapshot } from "@/lib/design-studio/upload-snapshot";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { timeAgo } from "@/lib/admin/time-ago";
import StatusBadge from "@/components/admin/StatusBadge";

const STATUS_FILTERS = [
  { value: "all", labelKey: "admin.tools.proof.filterAll" },
  { value: "pending", labelKey: "admin.tools.proof.filterPending" },
  { value: "approved", labelKey: "admin.tools.proof.filterApproved" },
  { value: "rejected", labelKey: "admin.tools.proof.filterRejected" },
  { value: "revised", labelKey: "admin.tools.proof.filterRevised" },
  { value: "standalone", labelKey: "admin.tools.proof.filterStandalone" },
];

// Colors now provided by shared StatusBadge via lib/admin/status-labels.js

function isPdf(item) {
  const f = item?.fileName || item?.outputData?.fileType || "";
  return String(f).toLowerCase().includes("pdf");
}

/** Same-day comparison for Today/Earlier grouping. */
function isToday(dateString) {
  const d = new Date(dateString);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

// ─── Normalize both data sources into unified proof items ─────────────────

function normalizeOrderProof(p) {
  return {
    id: p.id,
    source: "order",
    imageUrl: p.imageUrl,
    fileName: p.fileName,
    status: p.status,
    customerName: p.order?.customerName || null,
    customerEmail: p.order?.customerEmail || null,
    orderId: p.orderId,
    version: p.version,
    notes: p.notes,
    customerComment: p.customerComment,
    uploadedBy: p.uploadedBy,
    createdAt: p.createdAt,
    description: null,
    pdf: isPdf(p),
  };
}

function normalizeStandaloneJob(j) {
  return {
    id: j.id,
    source: "standalone",
    imageUrl: j.outputFileUrl,
    fileName: j.outputData?.fileName || null,
    status: "standalone",
    customerName: j.inputData?.customerName || null,
    customerEmail: j.inputData?.customerEmail || null,
    orderId: null,
    version: null,
    notes: j.notes,
    customerComment: null,
    uploadedBy: j.operatorName,
    createdAt: j.createdAt,
    description: j.inputData?.description || null,
    pdf: isPdf(j),
  };
}

export default function ProofManagerPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [orderProofs, setOrderProofs] = useState([]);
  const [standaloneJobs, setStandaloneJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [detailItem, setDetailItem] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [deepLinked, setDeepLinked] = useState(false);

  // ── Modals ──
  const [orderProofModal, setOrderProofModal] = useState(false);
  const [orderProofData, setOrderProofData] = useState({ orderId: "", notes: "", file: null });
  const [orderProofSaving, setOrderProofSaving] = useState(false);
  const [standaloneModal, setStandaloneModal] = useState(false);
  const [standaloneData, setStandaloneData] = useState({ customerName: "", customerEmail: "", description: "", notes: "", file: null });
  const [standaloneSaving, setStandaloneSaving] = useState(false);

  // ── Revision upload from detail modal ──
  const [revisionFile, setRevisionFile] = useState(null);
  const [revisionSaving, setRevisionSaving] = useState(false);

  // ── Fetch ──
  const fetchOrderProofs = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/proofs?limit=100");
      if (res.ok) {
        const data = await res.json();
        setOrderProofs((data.proofs || []).map(normalizeOrderProof));
      }
    } catch { /* ignore */ }
  }, []);

  const fetchStandaloneJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/tools/jobs?toolType=proof&limit=50");
      if (res.ok) {
        const data = await res.json();
        setStandaloneJobs((data.jobs || []).map(normalizeStandaloneJob));
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    Promise.all([fetchOrderProofs(), fetchStandaloneJobs()]).finally(() => setLoading(false));
  }, [fetchOrderProofs, fetchStandaloneJobs]);

  // ── Deep link: open detail for ?proofId=xxx ──
  useEffect(() => {
    if (deepLinked || loading) return;
    const proofId = searchParams.get("proofId");
    if (!proofId) return;

    const all = [...orderProofs, ...standaloneJobs];
    const match = all.find((p) => p.id === proofId);
    if (match) {
      setDetailItem(match);
      setDeepLinked(true);
    }
  }, [loading, orderProofs, standaloneJobs, searchParams, deepLinked]);

  // ── Unified + filtered list ──
  const allProofs = [...orderProofs, ...standaloneJobs].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const filteredProofs = statusFilter === "all"
    ? allProofs
    : allProofs.filter((p) => p.status === statusFilter);

  // ── Counts for filter badges ──
  const counts = {};
  for (const p of allProofs) counts[p.status] = (counts[p.status] || 0) + 1;

  // Summary stat cards
  const needsReviewCount = counts["pending"] || 0;
  const now = new Date();
  const approvedTodayCount = allProofs.filter((p) => {
    if (p.status !== "approved") return false;
    const d = new Date(p.createdAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  }).length;

  // Today / Earlier grouping
  const todayProofs = filteredProofs.filter((p) => isToday(p.createdAt));
  const earlierProofs = filteredProofs.filter((p) => !isToday(p.createdAt));

  // ── Actions ──
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  async function handleUpdateStatus(item, newStatus) {
    if (item.source !== "order") return;
    setUpdatingId(item.id);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/proofs/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || t("admin.tools.proof.errorUpdate"));
      }
      await fetchOrderProofs();
      if (detailItem?.id === item.id) {
        setDetailItem((prev) => prev ? { ...prev, status: newStatus } : null);
      }
      // Success feedback
      const msgKey = newStatus === "approved" ? "admin.tools.proof.successApproved"
        : newStatus === "rejected" ? "admin.tools.proof.successRejected"
        : newStatus === "pending" ? "admin.tools.proof.successReopened" : null;
      if (msgKey) {
        setActionSuccess(t(msgKey));
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t("admin.tools.proof.errorUpdate"));
    } finally {
      setUpdatingId(null);
    }
  }

  // Approve/reject with confirmation dialogs
  function handleApproveWithConfirm(item) {
    if (!window.confirm(t("admin.tools.proof.confirmApprove"))) return;
    handleUpdateStatus(item, "approved");
  }

  function handleRejectWithConfirm(item) {
    if (!window.confirm(t("admin.tools.proof.confirmReject"))) return;
    handleUpdateStatus(item, "rejected");
  }

  // Reopen action
  function handleReopenWithConfirm(item) {
    if (!window.confirm(t("admin.tools.proof.confirmReopen"))) return;
    handleUpdateStatus(item, "pending");
  }

  async function handleUploadRevision(item) {
    if (!revisionFile || !item.orderId) return;
    setRevisionSaving(true);
    try {
      const uploaded = await uploadDesignSnapshot(revisionFile, revisionFile.name || `revision-${Date.now()}`);
      const res = await fetch(`/api/admin/orders/${item.orderId}/proofs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: uploaded.url, fileName: revisionFile.name || null, notes: t("admin.tools.proof.revisionNote").replace("{version}", item.version) }),
      });
      if (!res.ok) { const err = await res.json().catch(() => null); throw new Error(err?.error || t("admin.tools.proof.errorUploadRevision")); }
      // POST already auto-marks the old proof as revised — no separate PATCH needed
      setRevisionFile(null);
      setDetailItem(null);
      setActionSuccess(t("admin.tools.proof.successRevisionUploaded"));
      setTimeout(() => setActionSuccess(null), 3000);
      setLoading(true);
      await fetchOrderProofs();
      setLoading(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t("admin.tools.proof.errorUploadRevision"));
    } finally {
      setRevisionSaving(false);
    }
  }

  async function handleOrderProofSave() {
    if (!orderProofData.file || !orderProofData.orderId.trim()) return;
    setOrderProofSaving(true);
    try {
      const uploaded = await uploadDesignSnapshot(orderProofData.file, orderProofData.file.name || `proof-${Date.now()}`);
      const res = await fetch(`/api/admin/orders/${orderProofData.orderId.trim()}/proofs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: uploaded.url, fileName: orderProofData.file.name || null, notes: orderProofData.notes || null }),
      });
      if (!res.ok) { const err = await res.json().catch(() => null); throw new Error(err?.error || t("admin.tools.proof.errorUpload")); }
      setOrderProofModal(false);
      setOrderProofData({ orderId: "", notes: "", file: null });
      setActionSuccess(t("admin.tools.proof.successUploaded"));
      setTimeout(() => setActionSuccess(null), 3000);
      setLoading(true);
      await fetchOrderProofs();
      setLoading(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t("admin.tools.proof.errorUpload"));
    } finally {
      setOrderProofSaving(false);
    }
  }

  async function handleStandaloneSave() {
    if (!standaloneData.file) return;
    setStandaloneSaving(true);
    try {
      const uploaded = await uploadDesignSnapshot(standaloneData.file, standaloneData.file.name || `proof-${Date.now()}`);
      const res = await fetch("/api/admin/tools/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolType: "proof",
          inputData: { customerName: standaloneData.customerName || null, customerEmail: standaloneData.customerEmail || null, description: standaloneData.description || null, originalFileName: standaloneData.file.name || null },
          outputFileUrl: uploaded.url, outputFileKey: uploaded.key,
          outputData: { fileName: standaloneData.file.name || null, fileType: standaloneData.file.type || null },
          notes: standaloneData.notes || null, status: "completed",
        }),
      });
      if (!res.ok) throw new Error(t("admin.tools.proof.errorSaveStandalone"));
      setStandaloneModal(false);
      setStandaloneData({ customerName: "", customerEmail: "", description: "", notes: "", file: null });
      setActionSuccess(t("admin.tools.proof.successStandaloneCreated"));
      setTimeout(() => setActionSuccess(null), 3000);
      setLoading(true);
      await fetchStandaloneJobs();
      setLoading(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t("admin.tools.proof.errorSaveStandalone"));
    } finally {
      setStandaloneSaving(false);
    }
  }

  // ── Render ──
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-[#999]">
        <Link href="/admin/workstation" className="hover:text-[#111]">{t("admin.workstation.title")}</Link>
        <span>/</span>
        <Link href="/admin/tools" className="hover:text-[#111]">{t("admin.tools.hubTitle")}</Link>
        <span>/</span>
        <span className="text-[#111] font-medium">{t("admin.tools.proof.title")}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-black">{t("admin.tools.proof.title")}</h1>
          <p className="mt-1 text-sm text-[#666]">{t("admin.tools.proof.subtitle")}</p>
          <div className="mt-3 grid gap-3 text-xs sm:grid-cols-4">
            <div>
              <p className="font-semibold text-[#111]">{t("admin.tools.meta.whatItDoes")}</p>
              <p className="mt-0.5 text-[#666]">{t("admin.tools.proof.metaWhat")}</p>
            </div>
            <div>
              <p className="font-semibold text-[#111]">{t("admin.tools.meta.input")}</p>
              <p className="mt-0.5 text-[#666]">{t("admin.tools.proof.metaInput")}</p>
            </div>
            <div>
              <p className="font-semibold text-[#111]">{t("admin.tools.meta.output")}</p>
              <p className="mt-0.5 text-[#666]">{t("admin.tools.proof.metaOutput")}</p>
            </div>
            <div>
              <p className="font-semibold text-[#111]">{t("admin.tools.meta.nextStep")}</p>
              <p className="mt-0.5 text-[#666]">{t("admin.tools.proof.metaNext")}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setOrderProofModal(true)} className="inline-flex items-center gap-1.5 rounded-[3px] bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-[#222]">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            {t("admin.tools.proof.uploadOrderProof")}
          </button>
          <button type="button" onClick={() => setStandaloneModal(true)} className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#e0e0e0] px-4 py-2 text-xs font-semibold text-[#666] hover:border-black hover:text-black">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            {t("admin.tools.proof.standaloneProof")}
          </button>
        </div>
      </div>

      {/* Action error banner */}
      {actionError && (
        <div className="flex items-center justify-between rounded-[3px] border border-red-200 bg-red-50 px-4 py-2.5">
          <p className="text-xs text-red-700">{actionError}</p>
          <button type="button" onClick={() => setActionError(null)} className="text-red-400 hover:text-red-700">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* Action success banner */}
      {actionSuccess && (
        <div className="flex items-center justify-between rounded-[3px] border border-green-200 bg-green-50 px-4 py-2.5">
          <p className="text-xs font-medium text-green-700">{actionSuccess}</p>
          <button type="button" onClick={() => setActionSuccess(null)} className="text-green-400 hover:text-green-700">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* Summary stat cards */}
      {!loading && (
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setStatusFilter("pending")}
            className={`rounded-[3px] border p-3 text-left transition-colors ${needsReviewCount > 0 ? "border-yellow-300 bg-yellow-50 hover:border-yellow-400" : "border-[#e0e0e0] bg-white hover:border-[#ccc]"}`}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#999]">{t("admin.tools.proof.statNeedsReview")}</p>
            <p className={`text-2xl font-bold ${needsReviewCount > 0 ? "text-yellow-700" : "text-[#111]"}`}>{needsReviewCount}</p>
          </button>
          <div className={`rounded-[3px] border p-3 ${approvedTodayCount > 0 ? "border-green-200 bg-green-50" : "border-[#e0e0e0] bg-white"}`}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#999]">{t("admin.tools.proof.statApprovedToday")}</p>
            <p className={`text-2xl font-bold ${approvedTodayCount > 0 ? "text-green-700" : "text-[#111]"}`}>{approvedTodayCount}</p>
          </div>
          <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#999]">{t("admin.tools.proof.statTotal")}</p>
            <p className="text-2xl font-bold text-[#111]">{allProofs.length}</p>
          </div>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto">
        {STATUS_FILTERS.map((f) => {
          const c = f.value === "all" ? allProofs.length : (counts[f.value] || 0);
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatusFilter(f.value)}
              className={`shrink-0 rounded-[3px] px-3 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === f.value ? "bg-black text-white" : "border border-[#e0e0e0] bg-white text-[#666] hover:border-black"
              }`}
            >
              {t(f.labelKey)} {c > 0 ? `(${c})` : ""}
            </button>
          );
        })}
      </div>

      {/* Unified Proof List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-[3px] bg-[#f0f0f0]" />)}
        </div>
      ) : filteredProofs.length === 0 ? (
        /* Filter-aware empty states */
        <div className="py-12 text-center">
          {statusFilter === "pending" ? (
            <>
              <svg className="mx-auto h-8 w-8 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="mt-2 text-sm font-medium text-green-700">{t("admin.tools.proof.emptyPending")}</p>
            </>
          ) : statusFilter === "rejected" ? (
            <p className="text-sm text-[#999]">{t("admin.tools.proof.emptyRejected")}</p>
          ) : statusFilter === "standalone" ? (
            <>
              <p className="text-sm text-[#999]">{t("admin.tools.proof.emptyStandalone")}</p>
              <button type="button" onClick={() => setStandaloneModal(true)} className="mt-3 rounded-[3px] border border-[#e0e0e0] px-4 py-2 text-xs font-semibold text-[#666] hover:border-black hover:text-black">
                {t("admin.tools.proof.standaloneProof")}
              </button>
            </>
          ) : allProofs.length === 0 ? (
            /* Getting Started guide — first time user */
            <div className="mx-auto max-w-lg space-y-5 text-left">
              <h3 className="text-center text-sm font-bold text-black">{t("admin.tools.proof.gettingStarted")}</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[3px] bg-[#fafafa] border border-[#e0e0e0] p-3 text-center">
                  <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-black text-white text-xs font-bold">1</div>
                  <p className="text-xs font-medium text-[#333]">{t("admin.tools.proof.guideStep1")}</p>
                </div>
                <div className="rounded-[3px] bg-[#fafafa] border border-[#e0e0e0] p-3 text-center">
                  <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-black text-white text-xs font-bold">2</div>
                  <p className="text-xs font-medium text-[#333]">{t("admin.tools.proof.guideStep2")}</p>
                </div>
                <div className="rounded-[3px] bg-[#fafafa] border border-[#e0e0e0] p-3 text-center">
                  <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-black text-white text-xs font-bold">3</div>
                  <p className="text-xs font-medium text-[#333]">{t("admin.tools.proof.guideStep3")}</p>
                </div>
              </div>
              <div className="flex justify-center gap-2">
                <button type="button" onClick={() => setOrderProofModal(true)} className="rounded-[3px] bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-[#222]">
                  {t("admin.tools.proof.uploadOrderProof")}
                </button>
                <button type="button" onClick={() => setStandaloneModal(true)} className="rounded-[3px] border border-[#e0e0e0] px-4 py-2 text-xs font-semibold text-[#666] hover:border-black hover:text-black">
                  {t("admin.tools.proof.standaloneProof")}
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-[#999]">{t("admin.tools.proof.noProofs")}</p>
              <p className="mt-1 text-xs text-[#bbb]">{t("admin.tools.proof.noProofsHint")}</p>
              <div className="mt-4 flex justify-center gap-2">
                <button type="button" onClick={() => setOrderProofModal(true)} className="rounded-[3px] bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-[#222]">
                  {t("admin.tools.proof.uploadOrderProof")}
                </button>
                <button type="button" onClick={() => setStandaloneModal(true)} className="rounded-[3px] border border-[#e0e0e0] px-4 py-2 text-xs font-semibold text-[#666] hover:border-black hover:text-black">
                  {t("admin.tools.proof.standaloneProof")}
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div>
          {/* Today group */}
          {todayProofs.length > 0 && (
            <>
              <div className="mb-2">
                <p className="text-[10px] font-semibold uppercase text-[#999]">{t("admin.tools.proof.groupToday")}</p>
              </div>
              <div className="space-y-2 mb-4">
                {todayProofs.map((item) => (
                  <ProofRow
                    key={`${item.source}-${item.id}`}
                    item={item}
                    t={t}
                    updatingId={updatingId}
                    onDetail={setDetailItem}
                    onApprove={handleApproveWithConfirm}
                    onReject={handleRejectWithConfirm}
                    onReopen={handleReopenWithConfirm}
                    fetchStandaloneJobs={fetchStandaloneJobs}
                  />
                ))}
              </div>
            </>
          )}
          {/* Earlier group */}
          {earlierProofs.length > 0 && (
            <>
              <div className="mb-2">
                <p className="text-[10px] font-semibold uppercase text-[#999]">{t("admin.tools.proof.groupEarlier")}</p>
              </div>
              <div className="space-y-2">
                {earlierProofs.map((item) => (
                  <ProofRow
                    key={`${item.source}-${item.id}`}
                    item={item}
                    t={t}
                    updatingId={updatingId}
                    onDetail={setDetailItem}
                    onApprove={handleApproveWithConfirm}
                    onReject={handleRejectWithConfirm}
                    onReopen={handleReopenWithConfirm}
                    fetchStandaloneJobs={fetchStandaloneJobs}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {detailItem ? (
        <ProofDetailModal
          item={detailItem}
          t={t}
          updatingId={updatingId}
          onClose={() => { setDetailItem(null); setRevisionFile(null); }}
          onApprove={handleApproveWithConfirm}
          onReject={handleRejectWithConfirm}
          onReopen={handleReopenWithConfirm}
          revisionFile={revisionFile}
          onRevisionFileChange={setRevisionFile}
          onUploadRevision={handleUploadRevision}
          revisionSaving={revisionSaving}
          allOrderProofs={orderProofs}
          onSwitchProof={setDetailItem}
          fetchStandaloneJobs={fetchStandaloneJobs}
        />
      ) : null}

      {/* Upload Order Proof Modal */}
      {orderProofModal ? (
        <ModalOverlay onClose={() => setOrderProofModal(false)}>
          <h3 className="mb-4 text-sm font-bold text-black">{t("admin.tools.proof.orderProofModalTitle")}</h3>
          <p className="mb-4 text-xs text-[#999]">{t("admin.tools.proof.orderProofModalSub")}</p>
          <div className="space-y-3">
            <Field label={t("admin.tools.proof.orderIdLabel")} required>
              <input type="text" value={orderProofData.orderId} onChange={(e) => setOrderProofData((prev) => ({ ...prev, orderId: e.target.value }))} placeholder={t("admin.tools.proof.orderIdPlaceholder")} className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black" />
            </Field>
            <Field label={t("admin.tools.proof.proofFileLabel")} required>
              <input type="file" accept="image/*,.pdf,application/pdf" onChange={(e) => setOrderProofData((prev) => ({ ...prev, file: e.target.files?.[0] || null }))} className="block w-full text-sm text-[#666] file:mr-3 file:rounded-[3px] file:border-0 file:bg-black file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white" />
              {orderProofData.file ? <p className="mt-1 text-[10px] text-[#999]">{orderProofData.file.name}</p> : null}
            </Field>
            <Field label={t("admin.tools.notesLabel")}>
              <textarea rows={2} value={orderProofData.notes} onChange={(e) => setOrderProofData((prev) => ({ ...prev, notes: e.target.value }))} placeholder={t("admin.tools.proof.notesPlaceholder")} className="w-full resize-none rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black" />
            </Field>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={handleOrderProofSave} disabled={orderProofSaving || !orderProofData.file || !orderProofData.orderId.trim()} className="flex-1 rounded-[3px] bg-black py-2 text-xs font-semibold text-white hover:bg-[#222] disabled:opacity-50">
              {orderProofSaving ? t("admin.tools.proof.uploading") : t("admin.tools.proof.uploadProof")}
            </button>
            <button type="button" onClick={() => setOrderProofModal(false)} className="rounded-[3px] border border-[#d0d0d0] px-4 py-2 text-xs font-medium text-[#666] hover:bg-[#fafafa]">{t("admin.tools.cancel")}</button>
          </div>
        </ModalOverlay>
      ) : null}

      {/* Standalone Proof Modal */}
      {standaloneModal ? (
        <ModalOverlay onClose={() => setStandaloneModal(false)}>
          <h3 className="mb-4 text-sm font-bold text-black">{t("admin.tools.proof.standaloneModalTitle")}</h3>
          <p className="mb-4 text-xs text-[#999]">{t("admin.tools.proof.standaloneModalSub")}</p>
          <div className="space-y-3">
            <Field label={t("admin.tools.proof.customerName")}>
              <input type="text" value={standaloneData.customerName} onChange={(e) => setStandaloneData((prev) => ({ ...prev, customerName: e.target.value }))} className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black" />
            </Field>
            <Field label={t("admin.tools.proof.customerEmail")}>
              <input type="email" value={standaloneData.customerEmail} onChange={(e) => setStandaloneData((prev) => ({ ...prev, customerEmail: e.target.value }))} className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black" />
            </Field>
            <Field label={t("admin.tools.proof.description")}>
              <input type="text" value={standaloneData.description} onChange={(e) => setStandaloneData((prev) => ({ ...prev, description: e.target.value }))} placeholder={t("admin.tools.proof.descPlaceholder")} className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black" />
            </Field>
            <Field label={t("admin.tools.proof.proofFileLabel")} required>
              <input type="file" accept="image/*,.pdf,application/pdf" onChange={(e) => setStandaloneData((prev) => ({ ...prev, file: e.target.files?.[0] || null }))} className="block w-full text-sm text-[#666] file:mr-3 file:rounded-[3px] file:border-0 file:bg-black file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white" />
              {standaloneData.file ? <p className="mt-1 text-[10px] text-[#999]">{standaloneData.file.name}</p> : null}
            </Field>
            <Field label={t("admin.tools.notesLabel")}>
              <textarea rows={2} value={standaloneData.notes} onChange={(e) => setStandaloneData((prev) => ({ ...prev, notes: e.target.value }))} className="w-full resize-none rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black" />
            </Field>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={handleStandaloneSave} disabled={standaloneSaving || !standaloneData.file} className="flex-1 rounded-[3px] bg-black py-2 text-xs font-semibold text-white hover:bg-[#222] disabled:opacity-50">
              {standaloneSaving ? t("admin.tools.saving") : t("admin.tools.proof.createRecord")}
            </button>
            <button type="button" onClick={() => setStandaloneModal(false)} className="rounded-[3px] border border-[#d0d0d0] px-4 py-2 text-xs font-medium text-[#666] hover:bg-[#fafafa]">{t("admin.tools.cancel")}</button>
          </div>
        </ModalOverlay>
      ) : null}
    </div>
  );
}

// ─── Proof Row ────────────────────────────────────────────────────────────────

function ProofRow({ item, t, updatingId, onDetail, onApprove, onReject, onReopen, fetchStandaloneJobs }) {
  const isActionable = item.source === "order" && item.status === "pending";
  const canReopen = item.source === "order" && (item.status === "approved" || item.status === "rejected");
  const customerLabel = item.customerName || item.customerEmail || "—";

  // Inline notes editing for standalone proofs
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(item.notes || "");
  const [notesSaving, setNotesSaving] = useState(false);
  const notesInputRef = useRef(null);

  useEffect(() => {
    if (editingNotes && notesInputRef.current) notesInputRef.current.focus();
  }, [editingNotes]);

  async function saveNotes() {
    if (notesValue === (item.notes || "")) {
      setEditingNotes(false);
      return;
    }
    setNotesSaving(true);
    try {
      if (item.source === "standalone") {
        const res = await fetch(`/api/admin/tools/jobs/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: notesValue }),
        });
        if (res.ok) {
          item.notes = notesValue;
          setEditingNotes(false);
          if (fetchStandaloneJobs) fetchStandaloneJobs();
        }
      } else {
        setEditingNotes(false);
      }
    } catch { /* ignore */ } finally {
      setNotesSaving(false);
    }
  }

  return (
    <div className={`flex flex-col gap-3 rounded-[3px] border bg-white p-3 sm:flex-row sm:items-center ${isActionable ? "border-yellow-300 bg-yellow-50/30" : "border-[#e0e0e0]"}`}>
      {/* Thumbnail — click opens detail */}
      <button type="button" onClick={() => onDetail(item)} className="h-14 w-14 shrink-0 overflow-hidden rounded-[3px] border border-[#e0e0e0] bg-[#fafafa] transition-opacity hover:opacity-80">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-[#ccc]">—</div>
        )}
      </button>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {item.source === "order" ? (
            <span className="text-sm font-semibold text-[#111]">{t("admin.tools.proof.proofVersion").replace("{version}", item.version)}</span>
          ) : (
            /* Description label for standalone proofs */
            <span className="text-sm font-semibold text-[#111]">
              {item.description ? `${t("admin.tools.proof.standaloneLabel")} — ${item.description.length > 40 ? item.description.slice(0, 40) + "…" : item.description}` : t("admin.tools.proof.standaloneLabel")}
            </span>
          )}
          <StatusBadge status={item.status} t={t} />
          {item.source === "order" && (
            <span className="text-[10px] text-[#999]">#{item.orderId?.slice(-8)}</span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-[#999]">
          <span>{customerLabel}</span>
          <span>·</span>
          <span>{timeAgo(item.createdAt, t)}</span>
          {item.uploadedBy ? <><span>·</span><span>{item.uploadedBy}</span></> : null}
        </div>
        {item.customerComment ? <p className="mt-1 truncate text-xs italic text-[#555]">&ldquo;{item.customerComment}&rdquo;</p> : null}
        {/* Inline notes with edit */}
        <div className="mt-0.5 flex items-center gap-1">
          {editingNotes ? (
            <input
              ref={notesInputRef}
              type="text"
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") saveNotes(); if (e.key === "Escape") setEditingNotes(false); }}
              onBlur={saveNotes}
              disabled={notesSaving}
              className="flex-1 rounded-[2px] border border-[#d0d0d0] px-1.5 py-0.5 text-xs outline-none focus:border-black"
              placeholder={t("admin.tools.proof.editNotesPlaceholder")}
            />
          ) : (
            <>
              {item.notes && <p className="truncate text-xs text-[#777]">{item.notes}</p>}
              {item.source === "standalone" && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setNotesValue(item.notes || ""); setEditingNotes(true); }}
                  className="shrink-0 text-[#bbb] hover:text-[#666]"
                  title={t("admin.tools.proof.editNotes")}
                >
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Actions — always prominent */}
      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
        {isActionable && (
          <>
            <button type="button" onClick={() => onApprove(item)} disabled={updatingId === item.id} className="rounded-[3px] bg-green-600 px-3.5 py-1.5 text-[11px] font-bold text-white hover:bg-green-700 disabled:opacity-50">
              {t("admin.tools.proof.approve")}
            </button>
            <button type="button" onClick={() => onReject(item)} disabled={updatingId === item.id} className="rounded-[3px] bg-red-600 px-3.5 py-1.5 text-[11px] font-bold text-white hover:bg-red-700 disabled:opacity-50">
              {t("admin.tools.proof.reject")}
            </button>
          </>
        )}
        {/* Reopen link for approved/rejected proofs */}
        {canReopen && (
          <button type="button" onClick={() => onReopen(item)} disabled={updatingId === item.id} className="text-[11px] font-medium text-[#999] underline hover:text-[#111] disabled:opacity-50">
            {t("admin.tools.proof.reopenAction")}
          </button>
        )}
        <button type="button" onClick={() => onDetail(item)} className="rounded-[3px] border border-[#e0e0e0] px-3 py-1.5 text-[11px] font-medium text-[#666] hover:border-black hover:text-black">
          {t("admin.tools.proof.openProof")}
        </button>
        {item.imageUrl && (
          <a href={item.imageUrl} download={item.fileName || undefined} className="rounded-[3px] border border-[#e0e0e0] px-3 py-1.5 text-[11px] font-medium text-[#666] hover:border-black hover:text-black">
            {t("admin.tools.download")}
          </a>
        )}
        {item.orderId && (
          <Link href={`/admin/orders/${item.orderId}`} className="rounded-[3px] border border-[#e0e0e0] px-3 py-1.5 text-[11px] font-medium text-[#666] hover:border-black hover:text-black">
            {t("admin.tools.viewOrder")}
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Proof Detail Modal ───────────────────────────────────────────────────────

function ProofDetailModal({ item, t, updatingId, onClose, onApprove, onReject, onReopen, revisionFile, onRevisionFileChange, onUploadRevision, revisionSaving, allOrderProofs, onSwitchProof, fetchStandaloneJobs }) {
  const isActionable = item.source === "order" && item.status === "pending";
  const canRevise = item.source === "order" && item.status === "rejected";
  const canReopen = item.source === "order" && (item.status === "approved" || item.status === "rejected");

  // Version history — find all proofs for same order
  const versionHistory = item.source === "order" && item.orderId
    ? (allOrderProofs || []).filter((p) => p.orderId === item.orderId).sort((a, b) => (a.version || 0) - (b.version || 0))
    : [];

  // Inline notes editing in modal (standalone)
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(item.notes || "");
  const [notesSaving, setNotesSaving] = useState(false);
  const notesInputRef = useRef(null);

  useEffect(() => {
    if (editingNotes && notesInputRef.current) notesInputRef.current.focus();
  }, [editingNotes]);

  async function saveNotes() {
    if (notesValue === (item.notes || "")) {
      setEditingNotes(false);
      return;
    }
    setNotesSaving(true);
    try {
      if (item.source === "standalone") {
        const res = await fetch(`/api/admin/tools/jobs/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: notesValue }),
        });
        if (res.ok) {
          item.notes = notesValue;
          setEditingNotes(false);
          if (fetchStandaloneJobs) fetchStandaloneJobs();
        }
      } else {
        setEditingNotes(false);
      }
    } catch { /* ignore */ } finally {
      setNotesSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="mx-4 flex w-full max-w-4xl flex-col rounded-[3px] bg-white shadow-xl" style={{ maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
        {/* Header — status-aware context bar */}
        <div className={`flex items-center justify-between border-b px-5 py-4 ${
          isActionable ? "border-yellow-300 bg-yellow-50" : canRevise ? "border-amber-200 bg-amber-50" : "border-[#e0e0e0] bg-white"
        }`}>
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-bold text-black">{t("admin.tools.proof.detailTitle")}</h3>
            <StatusBadge status={item.status} t={t} />
            {isActionable && (
              <span className="text-[11px] font-semibold text-yellow-700">{t("admin.tools.proof.needsDecision")}</span>
            )}
            {canRevise && (
              <span className="text-[11px] font-semibold text-amber-700">{t("admin.tools.proof.needsRevision")}</span>
            )}
            {item.status === "approved" && (
              <span className="text-[11px] font-semibold text-green-700">{t("admin.tools.proof.statusApprovedHint")}</span>
            )}
          </div>
          <button type="button" onClick={onClose} className="text-[#999] hover:text-black">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid gap-5 lg:grid-cols-[1fr,300px]">
            {/* Preview */}
            <div className="min-h-[200px] rounded-[3px] border border-[#e0e0e0] bg-[#fafafa] p-2">
              {item.pdf ? (
                <iframe src={item.imageUrl} title="Proof" className="h-[60vh] w-full rounded-[3px]" />
              ) : item.imageUrl ? (
                <img src={item.imageUrl} alt="Proof" className="mx-auto max-h-[60vh] rounded-[3px] object-contain" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-[#999]">—</div>
              )}
            </div>

            {/* Sidebar — action-first layout */}
            <div className="space-y-4">
              {/* Primary Actions — always visible at top */}
              {isActionable && (
                <div className="space-y-2 rounded-[3px] border-2 border-yellow-300 bg-yellow-50 p-3">
                  <p className="text-[11px] font-bold text-yellow-800">{t("admin.tools.proof.actionRequired")}</p>
                  <button type="button" onClick={() => onApprove(item)} disabled={updatingId === item.id} className="w-full rounded-[3px] bg-green-600 py-2.5 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-50">
                    {t("admin.tools.proof.approve")}
                  </button>
                  <button type="button" onClick={() => onReject(item)} disabled={updatingId === item.id} className="w-full rounded-[3px] bg-red-600 py-2.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50">
                    {t("admin.tools.proof.reject")}
                  </button>
                </div>
              )}

              {/* Reopen button for approved/rejected proofs */}
              {canReopen && (
                <button type="button" onClick={() => onReopen(item)} disabled={updatingId === item.id} className="w-full rounded-[3px] border border-[#e0e0e0] py-2 text-xs font-medium text-[#666] hover:border-black hover:text-black disabled:opacity-50">
                  {t("admin.tools.proof.reopenAction")}
                </button>
              )}

              {/* Next step guidance based on status */}
              <NextStepGuidance item={item} t={t} />

              {/* Upload revision for rejected proofs */}
              {canRevise && (
                <div className="rounded-[3px] border-2 border-amber-300 bg-amber-50 p-3 space-y-2">
                  <p className="text-[11px] font-bold text-amber-800">{t("admin.tools.proof.uploadRevisionTitle")}</p>
                  <p className="text-[10px] text-amber-700">{t("admin.tools.proof.uploadRevisionDesc")}</p>
                  <input
                    type="file"
                    accept="image/*,.pdf,application/pdf"
                    onChange={(e) => onRevisionFileChange?.(e.target.files?.[0] || null)}
                    className="block w-full text-xs text-[#666] file:mr-2 file:rounded-[3px] file:border-0 file:bg-black file:px-3 file:py-1.5 file:text-[10px] file:font-semibold file:text-white"
                  />
                  {revisionFile && (
                    <button
                      type="button"
                      onClick={() => onUploadRevision?.(item)}
                      disabled={revisionSaving}
                      className="w-full rounded-[3px] bg-amber-600 py-2 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50"
                    >
                      {revisionSaving ? t("admin.tools.proof.uploading") : t("admin.tools.proof.uploadRevision")}
                    </button>
                  )}
                </div>
              )}

              {/* Context: who, when, source */}
              <div className="space-y-2 rounded-[3px] border border-[#e0e0e0] bg-[#fafafa] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#999]">{t("admin.tools.proof.contextLabel")}</p>
                <div className="space-y-2 text-sm">
                  <MetaRow label={t("admin.tools.proof.sourceLabel")} value={item.source === "order" ? t("admin.tools.proof.orderSource").replace("{orderId}", item.orderId?.slice(-8) || "—") : t("admin.tools.proof.standaloneLabel")} />
                  {item.version != null && <MetaRow label={t("admin.tools.proof.versionLabel")} value={`v${item.version}`} />}
                  <MetaRow label={t("admin.tools.proof.customerLabel")} value={item.customerName || item.customerEmail || "—"} />
                  {item.customerEmail && item.customerName && <MetaRow label={t("admin.tools.proof.customerEmail")} value={item.customerEmail} />}
                  <MetaRow label={t("admin.tools.proof.uploadedByLabel")} value={item.uploadedBy || "—"} />
                  <MetaRow label={t("admin.tools.proof.createdLabel")} value={item.createdAt ? new Date(item.createdAt).toLocaleString() : "—"} />
                </div>
              </div>

              {/* Notes + description with inline editing */}
              <div className="space-y-2 rounded-[3px] border border-[#e0e0e0] bg-white p-3">
                {/* Notes section */}
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-[11px] font-medium text-[#666]">{t("admin.tools.notesLabel")}</p>
                    {!editingNotes && item.source === "standalone" && (
                      <button
                        type="button"
                        onClick={() => { setNotesValue(item.notes || ""); setEditingNotes(true); }}
                        className="text-[#bbb] hover:text-[#666]"
                        title={t("admin.tools.proof.editNotes")}
                      >
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
                        </svg>
                      </button>
                    )}
                  </div>
                  {editingNotes ? (
                    <input
                      ref={notesInputRef}
                      type="text"
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") saveNotes(); if (e.key === "Escape") setEditingNotes(false); }}
                      onBlur={saveNotes}
                      disabled={notesSaving}
                      className="mt-1 w-full rounded-[2px] border border-[#d0d0d0] px-2 py-1 text-sm outline-none focus:border-black"
                      placeholder={t("admin.tools.proof.editNotesPlaceholder")}
                    />
                  ) : (
                    <p className="text-sm text-[#111]">{item.notes || "—"}</p>
                  )}
                </div>
                {/* Description (standalone) */}
                {item.description && (
                  <MetaRow label={t("admin.tools.proof.description")} value={item.description} />
                )}
              </div>

              {/* Customer comment */}
              {item.customerComment && (
                <div className="rounded-[3px] border border-blue-200 bg-blue-50 p-3">
                  <p className="text-[11px] font-bold text-blue-800">{t("admin.tools.proof.customerFeedback")}</p>
                  <p className="mt-1 text-sm italic text-blue-700">&ldquo;{item.customerComment}&rdquo;</p>
                </div>
              )}

              {/* Version History */}
              {versionHistory.length > 1 && (
                <div className="space-y-2 rounded-[3px] border border-[#e0e0e0] bg-[#fafafa] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#999]">{t("admin.tools.proof.versionHistory")}</p>
                  <div className="space-y-1">
                    {versionHistory.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => onSwitchProof(v)}
                        className={`flex w-full items-center justify-between rounded-[2px] px-2 py-1.5 text-left text-xs transition-colors ${v.id === item.id ? "bg-black text-white" : "hover:bg-[#e8e8e8] text-[#666]"}`}
                      >
                        <span className="font-medium">v{v.version}</span>
                        <span className="flex items-center gap-1.5">
                          <StatusBadge status={v.status} t={t} />
                          <span className={`text-[10px] ${v.id === item.id ? "text-white/70" : "text-[#999]"}`}>{timeAgo(v.createdAt, t)}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex flex-col gap-2">
                {item.imageUrl && (
                  <a href={item.imageUrl} download={item.fileName || undefined} className="rounded-[3px] border border-[#e0e0e0] px-4 py-2.5 text-center text-xs font-semibold text-[#666] hover:border-black hover:text-black">
                    {t("admin.tools.download")}
                  </a>
                )}
                {item.orderId && (
                  <Link href={`/admin/orders/${item.orderId}`} className="rounded-[3px] border border-[#e0e0e0] px-4 py-2.5 text-center text-xs font-semibold text-[#666] hover:border-black hover:text-black">
                    {t("admin.tools.viewOrder")}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Next Step Guidance ───────────────────────────────────────────────────────

function NextStepGuidance({ item, t }) {
  if (item.status === "approved") {
    return (
      <div className="rounded-[3px] border border-green-200 bg-green-50 px-3 py-2">
        <p className="text-[11px] font-bold text-green-800">{t("admin.tools.proof.nextStepApprovedTitle")}</p>
        <p className="mt-0.5 text-[10px] text-green-700">{t("admin.tools.proof.nextStepApproved")}</p>
      </div>
    );
  }
  if (item.status === "rejected") {
    return (
      <div className="rounded-[3px] border border-red-200 bg-red-50 px-3 py-2">
        <p className="text-[11px] font-bold text-red-800">{t("admin.tools.proof.nextStepRejectedTitle")}</p>
        <p className="mt-0.5 text-[10px] text-red-700">{t("admin.tools.proof.nextStepRejected")}</p>
      </div>
    );
  }
  if (item.status === "standalone") {
    return (
      <div className="rounded-[3px] border border-[#e0e0e0] bg-[#fafafa] px-3 py-2">
        <p className="text-[11px] font-bold text-[#666]">{t("admin.tools.proof.nextStepStandaloneTitle")}</p>
        <p className="mt-0.5 text-[10px] text-[#999]">{t("admin.tools.proof.nextStepStandalone")}</p>
      </div>
    );
  }
  return null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function MetaRow({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-[#666]">{label}</p>
      <p className="text-[#111]">{value}</p>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-[#666]">{label}{required ? " *" : ""}</label>
      {children}
    </div>
  );
}

function ModalOverlay({ onClose, children }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="mx-4 w-full max-w-md rounded-[3px] bg-white p-6 shadow-xl">
        {children}
      </div>
    </div>
  );
}
