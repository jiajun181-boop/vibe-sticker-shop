"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { formatCad } from "@/lib/admin/format-cad";
import { statusColor } from "@/lib/admin/status-labels";
import { pricingCenterPath } from "@/lib/admin/pricing-routes";

const STATUS_KEYS = [
  { value: "all", key: "admin.pc.statusAll" },
  { value: "new", key: "admin.pc.statusNew" },
  { value: "reviewing", key: "admin.pc.statusReviewing" },
  { value: "quoted", key: "admin.pc.statusQuoted" },
  { value: "accepted", key: "admin.pc.statusAccepted" },
  { value: "rejected", key: "admin.pc.statusRejected" },
  { value: "expired", key: "admin.pc.statusExpired" },
  { value: "converted", key: "admin.pc.statusConverted" },
];

// Queue state badge colors — driven by workflow.queueState from API
const QUEUE_STATE_STYLE = {
  needs_action: "bg-amber-100 text-amber-800 border-amber-200",
  waiting: "bg-blue-100 text-blue-800 border-blue-200",
  done: "bg-gray-100 text-gray-600 border-gray-200",
};

// Fallback client-side mirror — only used when PATCH response doesn't return allowedTransitions.
// The server is authoritative; this is a safety net so the UI stays scoped.
const TRANSITIONS_FOR = {
  new:       ["reviewing", "rejected", "expired"],
  reviewing: ["quoted", "rejected", "expired"],
  quoted:    ["accepted", "rejected", "expired"],
  accepted:  ["reviewing"],
  rejected:  ["reviewing"],
  expired:   ["reviewing"],
  converted: [],
};

export default function AdminQuotesPage() {
  const { t, locale } = useTranslation();
  const [quotes, setQuotes] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [statusCounts, setStatusCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("new");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);

  // Detail panel
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [allowedTransitions, setAllowedTransitions] = useState([]);
  const [workflow, setWorkflow] = useState(null);
  const [convertedOrder, setConvertedOrder] = useState(null);
  const [detailError, setDetailError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editNotes, setEditNotes] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  // Queue-level summary from list API
  const [queueSummary, setQueueSummary] = useState(null);

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "20");
    if (status !== "all") params.set("status", status);
    if (search) params.set("search", search);
    try {
      const res = await fetch(`/api/admin/quotes?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setQuotes(data.quotes || []);
      setPagination(data.pagination || null);
      if (data.statusCounts) setStatusCounts(data.statusCounts);
      if (data.queueSummary) setQueueSummary(data.queueSummary);
    } catch {
      setError("failedLoadQuotes");
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => { fetchQuotes(); }, [fetchQuotes]);

  async function loadDetail(id) {
    setSelected(id);
    setDetail(null);
    setAllowedTransitions([]);
    setWorkflow(null);
    setConvertedOrder(null);
    setDetailError(false);
    setSaveMsg("");
    try {
      const res = await fetch(`/api/admin/quotes/${id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDetail(data.quote);
      setAllowedTransitions(data.allowedTransitions || []);
      setWorkflow(data.workflow || null);
      setConvertedOrder(data.convertedOrder || null);
      setEditNotes(data.quote.adminNotes || "");
      setEditAmount(data.quote.quotedAmountCents ? String(data.quote.quotedAmountCents / 100) : "");
      setEditStatus(data.quote.status);
    } catch {
      setDetailError(true);
    }
  }

  async function handleMarkAsQuoted() {
    if (!selected || !detail) return;
    setSaving(true);
    setSaveMsg("");
    try {
      const body = { status: "quoted" };
      if (editNotes !== (detail.adminNotes || "")) body.adminNotes = editNotes;
      const amountCents = editAmount ? Math.round(parseFloat(editAmount) * 100) : null;
      if (amountCents !== detail.quotedAmountCents) body.quotedAmountCents = amountCents;

      const res = await fetch(`/api/admin/quotes/${selected}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        applyPatchResponse(data);
        setSaveMsg("savedOk");
        fetchQuotes();
      } else {
        const data = await res.json().catch(() => ({}));
        setSaveMsg(data.error || "saveFailed");
      }
    } catch {
      setSaveMsg("networkError");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 4000);
    }
  }

  /** Apply PATCH/convert response — consumes workflow + allowedTransitions + refreshHint */
  function applyPatchResponse(data) {
    setDetail(data.quote);
    setEditStatus(data.quote.status);
    // Use server-provided workflow hints (authoritative)
    if (data.workflow) setWorkflow(data.workflow);
    // Use server-provided transitions, fallback to client mirror
    setAllowedTransitions(data.allowedTransitions || TRANSITIONS_FOR[data.quote.status] || []);
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    setSaveMsg("");
    try {
      const body = {};
      if (editStatus !== detail.status) body.status = editStatus;
      if (editNotes !== (detail.adminNotes || "")) body.adminNotes = editNotes;
      const amountCents = editAmount ? Math.round(parseFloat(editAmount) * 100) : null;
      if (amountCents !== detail.quotedAmountCents) body.quotedAmountCents = amountCents;

      if (Object.keys(body).length === 0) {
        setSaveMsg("noChanges");
        setTimeout(() => setSaveMsg(""), 3000);
        setSaving(false);
        return;
      }

      const res = await fetch(`/api/admin/quotes/${selected}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        applyPatchResponse(data);
        setSaveMsg("savedOk");
        fetchQuotes();
      } else {
        const data = await res.json().catch(() => ({}));
        setSaveMsg(data.error || "saveFailed");
      }
    } catch {
      setSaveMsg("networkError");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 4000);
    }
  }

  return (
    <div className="space-y-4">
      {/* Pricing Center breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-[#999]">
        <Link href={pricingCenterPath()} className="hover:text-[#111] transition-colors">
          {t("admin.pc.backToCenter")}
        </Link>
        <span>/</span>
        <span className="text-[#111] font-medium">{t("admin.pc.quoteRequests")}</span>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-xl font-semibold text-black">{t("admin.pc.quoteRequests")}</h1>
          <p className="mt-0.5 text-sm text-[#999]">{t("admin.pc.quotesSubtitle")}</p>
        </div>
        {pagination && (
          <span className="inline-flex items-center rounded-[2px] bg-black px-2.5 py-0.5 text-xs font-medium text-[#fff]">
            {pagination.total}
          </span>
        )}
        <Link
          href="/admin/orders/create"
          className="ml-auto rounded-[3px] bg-black px-4 py-2 text-xs font-semibold text-[#fff] hover:bg-[#222]"
        >
          {t("admin.pc.createOrder")}
        </Link>
      </div>

      {/* Queue summary banner — driven by API queueSummary contract */}
      {queueSummary && queueSummary.actionableCount > 0 && (
        <div className={`flex items-center justify-between rounded-[3px] border px-4 py-2.5 ${
          queueSummary.severity === "critical"
            ? "border-red-200 bg-red-50"
            : "border-amber-200 bg-amber-50"
        }`}>
          <span className={`text-sm font-medium ${
            queueSummary.severity === "critical" ? "text-red-800" : "text-amber-800"
          }`}>
            {queueSummary.actionableCount} {t("admin.quotes.awaitingAction")}
          </span>
          {queueSummary.topActionable && (
            <button
              type="button"
              onClick={() => loadDetail(queueSummary.topActionable.id)}
              className={`rounded-[3px] px-3 py-1 text-xs font-medium text-white ${
                queueSummary.severity === "critical"
                  ? "bg-red-700 hover:bg-red-800"
                  : "bg-amber-700 hover:bg-amber-800"
              }`}
            >
              {queueSummary.topActionable.reference} &rarr;
            </button>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex gap-1.5 overflow-x-auto">
          {STATUS_KEYS.map((s) => {
            const cnt = s.value === "all"
              ? Object.values(statusCounts).reduce((a, b) => a + b, 0)
              : (statusCounts[s.value] || 0);
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => { setStatus(s.value); setPage(1); }}
                className={`whitespace-nowrap rounded-[3px] px-3 py-1.5 text-[11px] font-medium transition-colors ${
                  status === s.value ? "bg-black text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {t(s.key)}
                {cnt > 0 && (
                  <span className={`ml-1.5 inline-flex min-w-[18px] items-center justify-center rounded-full px-1 py-0 text-[9px] font-bold ${
                    status === s.value ? "bg-white/20 text-white" : "bg-gray-300 text-gray-700"
                  }`}>
                    {cnt}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchQuotes(); }} className="flex gap-2 sm:ml-auto">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("admin.pc.searchPlaceholder")}
            className="w-full sm:w-64 rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
          />
          <button type="submit" className="rounded-[3px] bg-black px-4 py-2 text-xs font-semibold text-[#fff] hover:bg-[#222]">
            {t("admin.pc.search")}
          </button>
        </form>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-[3px] border border-red-300 bg-red-50 px-4 py-3">
          <span className="text-sm font-medium text-red-800">{t(`admin.pc.${error}`)}</span>
          <button type="button" onClick={fetchQuotes} className="text-xs font-medium text-red-600 hover:text-red-900">{t("admin.pc.retry")}</button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* List */}
        <div className="space-y-2 lg:col-span-2">
          {loading ? (
            <div className="flex h-48 items-center justify-center text-sm text-[#999]">{t("admin.pc.loading")}</div>
          ) : quotes.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-[#999]">{t("admin.pc.noQuotes")}</div>
          ) : (
            <>
              {quotes.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => loadDetail(q.id)}
                  className={`w-full text-left rounded-[3px] border p-4 transition-colors ${
                    selected === q.id ? "border-black bg-gray-50" : "border-[#e0e0e0] bg-white hover:border-[#999]"
                  } ${!selected || selected !== q.id ? (q.workflow?.queueState === "needs_action" ? "border-l-[3px] border-l-amber-400" : q.workflow?.queueState === "waiting" ? "border-l-[3px] border-l-blue-400" : "") : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-semibold text-black">{q.reference}</span>
                        <span className={`rounded-[2px] px-1.5 py-0.5 text-[10px] font-semibold ${statusColor(q.status)}`}>
                          {t(STATUS_KEYS.find((s) => s.value === q.status)?.key || "admin.pc.statusAll")}
                        </span>
                        {q.isRush && <span className="rounded-[2px] bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">{t("admin.pc.rushBadge")}</span>}
                      </div>
                      <p className="mt-0.5 text-xs text-[#666]">
                        {q.customerName}{q.companyName ? ` \u2014 ${q.companyName}` : ""} {"\u00B7"} {q.customerEmail}
                      </p>
                      <p className="mt-0.5 text-[10px] text-[#999]">
                        {q.productType || t("admin.pc.customProduct")}{q.quantity ? ` \u00D7 ${q.quantity}` : ""}
                        {q.widthIn && q.heightIn ? ` \u2014 ${q.widthIn}\u2033 \u00D7 ${q.heightIn}\u2033` : ""}
                      </p>
                      {/* Workflow hint from API — shows primary action label */}
                      {q.workflow?.primaryAction && (
                        <p className={`mt-1 text-[10px] font-medium ${
                          q.workflow.queueState === "needs_action" ? "text-amber-600" : "text-blue-600"
                        }`}>
                          {q.workflow.primaryAction.label}
                        </p>
                      )}
                      {!q.workflow?.primaryAction && q.workflow?.queueState === "waiting" && (
                        <p className="mt-1 text-[10px] font-medium text-blue-600">{t("admin.quotes.waitingOnCustomer")}</p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      {q.quotedAmountCents != null && (
                        <p className="text-sm font-bold text-black">{formatCad(q.quotedAmountCents)}</p>
                      )}
                      <p className="text-[10px] text-[#999]">
                        {new Date(q.createdAt).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-CA", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                </button>
              ))}

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium disabled:opacity-30"
                  >
                    {t("admin.pc.prev")}
                  </button>
                  <span className="text-xs text-[#999]">
                    {page} / {pagination.totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={page >= pagination.totalPages}
                    className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium disabled:opacity-30"
                  >
                    {t("admin.pc.next")}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-1">
          {!selected ? (
            <div className="rounded-[3px] border border-dashed border-[#d0d0d0] p-8 text-center text-xs text-[#999]">
              {t("admin.pc.selectQuote")}
            </div>
          ) : detailError ? (
            <div className="rounded-[3px] border border-red-200 bg-red-50 p-6 text-center">
              <p className="text-sm text-red-700">{t("admin.quotes.detailLoadFailed")}</p>
              <button type="button" onClick={() => loadDetail(selected)} className="mt-2 rounded-[3px] bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700">
                {t("admin.pc.retry")}
              </button>
            </div>
          ) : !detail ? (
            <div className="flex h-48 items-center justify-center text-sm text-[#999]">{t("admin.pc.detailLoading")}</div>
          ) : (
            <div className="space-y-4 rounded-[3px] border border-[#e0e0e0] bg-white p-4">
              <div>
                <h2 className="text-sm font-bold text-black">{detail.reference}</h2>
                <p className="text-[10px] text-[#999]">{new Date(detail.createdAt).toLocaleString(locale === "zh" ? "zh-CN" : "en-CA")}</p>
              </div>

              {/* Workflow-driven banner — uses API workflow hints */}
              {workflow?.queueState === "needs_action" && (
                <div className="flex items-center justify-between rounded-[3px] border border-amber-300 bg-amber-50 px-3 py-2">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 text-amber-500">&#8595;</span>
                    <div>
                      <p className="text-xs font-medium text-amber-800">
                        {workflow.primaryAction?.label || t("admin.quotes.bannerNew")}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {workflow?.queueState === "waiting" && (() => {
                const updatedDate = new Date(detail.updatedAt || detail.createdAt);
                const daysSince = Math.floor((Date.now() - updatedDate.getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <div className="space-y-1 rounded-[3px] border border-blue-300 bg-blue-50 px-3 py-2">
                    <p className="text-xs font-medium text-blue-800">{t("admin.quotes.bannerQuoted")}</p>
                    <p className="text-[10px] text-blue-600">{t("admin.quotes.daysSinceUpdate").replace("{days}", daysSince)}</p>
                    {daysSince >= 3 && <p className="text-[10px] font-semibold text-blue-700">{t("admin.quotes.followUpHint")}</p>}
                  </div>
                );
              })()}
              {workflow?.isTerminal && detail.status === "converted" && (
                <div className="rounded-[3px] border border-green-300 bg-green-50 px-3 py-2">
                  <p className="text-xs font-medium text-green-800">{t("admin.quotes.bannerConverted")}</p>
                </div>
              )}
              {workflow?.isTerminal && (detail.status === "rejected" || detail.status === "expired") && (
                <div className="rounded-[3px] border border-gray-300 bg-gray-50 px-3 py-2">
                  <p className="text-xs font-medium text-gray-600">
                    {detail.status === "rejected" ? t("admin.quotes.bannerRejected") : t("admin.quotes.bannerExpired")}
                  </p>
                  {workflow.secondaryAction && (
                    <button
                      type="button"
                      onClick={() => { setEditStatus("reviewing"); }}
                      className="mt-1.5 text-[10px] font-medium text-[#666] hover:text-black underline"
                    >
                      {workflow.secondaryAction.label}
                    </button>
                  )}
                </div>
              )}

              {/* Customer */}
              <div className="space-y-1 text-xs">
                <p className="font-medium text-[#999]">{t("admin.pc.customer")}</p>
                <p className="text-black">{detail.customerName}</p>
                <p className="text-[#666]">{detail.customerEmail}</p>
                {detail.customerPhone && <p className="text-[#666]">{detail.customerPhone}</p>}
                {detail.companyName && <p className="text-[#666]">{detail.companyName}</p>}
              </div>

              {/* Product */}
              <div className="space-y-1 text-xs">
                <p className="font-medium text-[#999]">{t("admin.pc.productDetails")}</p>
                {detail.productType && <p>{t("admin.pc.typeLabel")} <strong>{detail.productType}</strong></p>}
                {detail.quantity && <p>{t("admin.pc.qtyLabel")} <strong>{detail.quantity}</strong></p>}
                {detail.widthIn && detail.heightIn && <p>{t("admin.pc.sizeDetailLabel")} <strong>{detail.widthIn}{"\u2033"} {"\u00D7"} {detail.heightIn}{"\u2033"}</strong></p>}
                {detail.material && <p>{t("admin.pc.materialLabel")} <strong>{detail.material}</strong></p>}
                {detail.colorMode && <p>{t("admin.pc.colorLabel")} <strong>{detail.colorMode}</strong></p>}
                {detail.neededBy && <p>{t("admin.pc.neededByLabel")} <strong>{detail.neededBy}</strong></p>}
                {detail.isRush && <p className="font-bold text-red-600">{t("admin.pc.rushOrder")}</p>}
              </div>

              {detail.description && (
                <div className="text-xs">
                  <p className="font-medium text-[#999]">{t("admin.pc.description")}</p>
                  <p className="mt-1 whitespace-pre-wrap text-[#333]">{detail.description}</p>
                </div>
              )}

              {detail.fileUrls?.length > 0 && (
                <div className="text-xs">
                  <p className="font-medium text-[#999]">{t("admin.pc.files")} ({detail.fileUrls.length})</p>
                  {detail.fileUrls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="mt-1 block truncate text-blue-600 hover:underline">
                      {url.split("/").pop() || `${t("admin.pc.files")} ${i + 1}`}
                    </a>
                  ))}
                </div>
              )}

              <hr className="border-[#e0e0e0]" />

              {/* Primary action — convert to order (driven by workflow.primaryAction) */}
              {workflow?.primaryAction?.action === "convert" && !detail.convertedOrderId && (
                <Link
                  href={`/admin/orders/create?fromQuote=${detail.id}&email=${encodeURIComponent(detail.customerEmail)}&name=${encodeURIComponent(detail.customerName)}&phone=${encodeURIComponent(detail.customerPhone || "")}&product=${encodeURIComponent(detail.productType || "")}&qty=${detail.quantity || ""}&width=${detail.widthIn || ""}&height=${detail.heightIn || ""}`}
                  className="block w-full rounded-[3px] bg-black px-4 py-2.5 text-center text-xs font-bold text-[#fff] hover:bg-[#222]"
                >
                  {t("admin.pc.convertToOrder")} &rarr;
                </Link>
              )}

              {detail.convertedOrderId && (
                <div className="rounded-[3px] border border-green-200 bg-green-50 p-3 space-y-2">
                  {convertedOrder ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase text-green-700">{t("admin.quotes.linkedOrder")}</span>
                        <span className={`rounded-[2px] px-1.5 py-0.5 text-[10px] font-semibold ${statusColor(convertedOrder.status)}`}>
                          {convertedOrder.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-green-800">{convertedOrder.id.slice(0, 8)}{"\u2026"}</span>
                        <span className="font-bold text-green-800">{formatCad(convertedOrder.totalAmount)}</span>
                      </div>
                      <div className="flex gap-3 text-[10px] text-green-700">
                        <span>{t("admin.quotes.orderItems", { n: convertedOrder.itemCount })}</span>
                        <span>{convertedOrder.paymentStatus}</span>
                        {convertedOrder.productionStatus && convertedOrder.productionStatus !== "none" && (
                          <span>{convertedOrder.productionStatus}</span>
                        )}
                      </div>
                      {convertedOrder.productionJobs?.length > 0 && (
                        <div className="text-[10px] text-green-600 space-y-0.5">
                          {convertedOrder.productionJobs.slice(0, 3).map((j) => (
                            <p key={j.jobId}>{j.productName} {"\u2014"} {j.jobStatus}</p>
                          ))}
                        </div>
                      )}
                    </>
                  ) : null}
                  <Link
                    href={`/admin/orders/${detail.convertedOrderId}`}
                    className="block w-full rounded-[3px] bg-green-700 px-3 py-2 text-center text-xs font-bold text-white hover:bg-green-800"
                  >
                    {t("admin.pc.viewConvertedOrder")} &rarr;
                  </Link>
                </div>
              )}

              {/* Admin actions — hide full form for terminal states (use editStatus so reopen works) */}
              {(workflow?.isTerminal && editStatus === detail.status) || editStatus === "converted" ? (
                <div className="space-y-3">
                  {/* Read-only summary for terminal states */}
                  {detail.quotedAmountCents != null && (
                    <div className="text-xs">
                      <p className="font-medium text-[#999]">{t("admin.pc.quotedAmount")}</p>
                      <p className="mt-0.5 text-sm font-bold text-[#111]">{formatCad(detail.quotedAmountCents)}</p>
                    </div>
                  )}
                  {detail.adminNotes && (
                    <div className="text-xs">
                      <p className="font-medium text-[#999]">{t("admin.pc.adminNotes")}</p>
                      <p className="mt-0.5 whitespace-pre-wrap text-[#333]">{detail.adminNotes}</p>
                    </div>
                  )}
                  {/* Reopen option — only when backend allows reviewing transition */}
                  {allowedTransitions.includes("reviewing") && (
                    <button
                      type="button"
                      onClick={() => { setEditStatus("reviewing"); setEditNotes(detail.adminNotes || ""); setEditAmount(detail.quotedAmountCents ? String(detail.quotedAmountCents / 100) : ""); }}
                      className="w-full rounded-[3px] border border-[#d0d0d0] px-4 py-2 text-center text-xs font-medium text-[#666] hover:border-black hover:text-black"
                    >
                      {t("admin.quotes.reopenQuote")}
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase text-[#999]">{t("admin.pc.status")}</label>
                    {(() => {
                      // Build options: current status + server-allowed transitions only
                      const validNext = allowedTransitions.length > 0 ? allowedTransitions : (TRANSITIONS_FOR[detail.status] || []);
                      const optionValues = [detail.status, ...validNext.filter((v) => v !== detail.status)];
                      const options = optionValues
                        .map((v) => STATUS_KEYS.find((s) => s.value === v))
                        .filter(Boolean);
                      return (
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value)}
                          className="mt-1 w-full rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs"
                        >
                          {options.map((s) => (
                            <option key={s.value} value={s.value}>{t(s.key)}</option>
                          ))}
                        </select>
                      );
                    })()}
                  </div>

                  {(() => {
                    // Show "Mark as Quoted" when backend allows the transition
                    const canQuote = allowedTransitions.includes("quoted");
                    return (
                  <div className={canQuote ? "rounded-[3px] border-l-[3px] border-l-amber-400 bg-amber-50/50 p-2 -mx-2" : ""}>
                    <label className="block text-[10px] font-semibold uppercase text-[#999]">{t("admin.pc.quotedAmount")}</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      placeholder={t("admin.pc.amountPlaceholder")}
                      className={`mt-1 w-full rounded-[3px] border px-3 py-1.5 text-xs ${canQuote ? "border-amber-400 bg-white focus:border-amber-600 ring-1 ring-amber-200" : "border-[#d0d0d0]"}`}
                    />
                    {canQuote && (
                      <button
                        type="button"
                        onClick={handleMarkAsQuoted}
                        disabled={saving || !editAmount}
                        className="mt-2 w-full rounded-[3px] bg-amber-500 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
                      >
                        {saving ? t("admin.pc.saving") : t("admin.quotes.markAsQuoted")}
                      </button>
                    )}
                  </div>
                    );
                  })()}

                  <div>
                    <label className="block text-[10px] font-semibold uppercase text-[#999]">{t("admin.pc.adminNotes")}</label>
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      rows={3}
                      className="mt-1 w-full rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full rounded-[3px] bg-black px-4 py-2 text-xs font-semibold text-[#fff] hover:bg-[#222] disabled:opacity-50"
                  >
                    {saving ? t("admin.pc.saving") : t("admin.pc.saveChanges")}
                  </button>

                  {saveMsg && (
                    <p className={`text-center text-xs font-medium ${saveMsg === "savedOk" ? "text-green-600" : saveMsg === "noChanges" ? "text-[#999]" : "text-red-600"}`}>
                      {t(`admin.pc.${saveMsg}`)}
                    </p>
                  )}

                  {/* Convert to order — secondary link when primary action isn't already convert */}
                  {!detail.convertedOrderId && !workflow?.isTerminal && workflow?.primaryAction?.action !== "convert" && (
                    <Link
                      href={`/admin/orders/create?fromQuote=${detail.id}&email=${encodeURIComponent(detail.customerEmail)}&name=${encodeURIComponent(detail.customerName)}&phone=${encodeURIComponent(detail.customerPhone || "")}&product=${encodeURIComponent(detail.productType || "")}&qty=${detail.quantity || ""}&width=${detail.widthIn || ""}&height=${detail.heightIn || ""}`}
                      className="block w-full rounded-[3px] border border-[#d0d0d0] px-4 py-2 text-center text-xs font-semibold text-[#666] hover:border-black hover:text-black hover:bg-[#fafafa]"
                    >
                      {t("admin.pc.convertToOrder")} &rarr;
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
