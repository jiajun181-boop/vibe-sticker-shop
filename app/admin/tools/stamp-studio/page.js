"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { uploadDesignSnapshot } from "@/lib/design-studio/upload-snapshot";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { timeAgo } from "@/lib/admin/time-ago";
import StatusBadge from "@/components/admin/StatusBadge";

const StampEditor = dynamic(() => import("@/components/product/StampEditor"), { ssr: false });

const STAMP_MODELS = [
  { id: "round-40mm", label: "Round 40mm", shape: "round", diameterIn: 1.57 },
  { id: "round-50mm", label: "Round 50mm", shape: "round", diameterIn: 1.97 },
  { id: "rect-47x18", label: "Rectangle 47x18mm", shape: "rect", widthIn: 1.85, heightIn: 0.71 },
  { id: "rect-58x22", label: "Rectangle 58x22mm", shape: "rect", widthIn: 2.28, heightIn: 0.87 },
  { id: "rect-70x30", label: "Rectangle 70x30mm", shape: "rect", widthIn: 2.76, heightIn: 1.18 },
];

const QUICK_START_PRESETS = [
  {
    id: "address",
    labelKey: "admin.tools.stamp.presetAddress",
    modelId: "rect-70x30",
    text: "COMPANY NAME\n123 Street\nCity, Province A1A 1A1\nPhone: (416) 555-0000",
    font: "Helvetica",
  },
  {
    id: "approval",
    labelKey: "admin.tools.stamp.presetApproval",
    modelId: "round-40mm",
    text: "APPROVED\n[Company Name]\nDate: ____/____/____",
    font: "Helvetica",
  },
  {
    id: "date-received",
    labelKey: "admin.tools.stamp.presetDateReceived",
    modelId: "rect-58x22",
    text: "RECEIVED\nDate: ____/____/____\nBy: __________",
    font: "Helvetica",
  },
  {
    id: "signature",
    labelKey: "admin.tools.stamp.presetSignature",
    modelId: "rect-70x30",
    text: "[Name]\n[Title]",
    font: "Helvetica",
  },
  {
    id: "blank",
    labelKey: "admin.tools.stamp.presetBlank",
    modelId: "rect-58x22",
    text: "",
    font: "Helvetica",
  },
];

function formatJobTime(dateString) {
  const date = new Date(dateString);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function modelLabel(modelId) {
  const m = STAMP_MODELS.find((e) => e.id === modelId);
  return m ? m.label : modelId || "stamp";
}

export default function StampStudioPage() {
  const { t } = useTranslation();
  const [modelId, setModelId] = useState(STAMP_MODELS[0].id);
  const [orderId, setOrderId] = useState("");
  const [notes, setNotes] = useState("");
  const [stampConfig, setStampConfig] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [saveIsError, setSaveIsError] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [editorKey, setEditorKey] = useState(0);
  const [initialText, setInitialText] = useState("");
  const [initialFont, setInitialFont] = useState("Helvetica");
  const [initialColor, setInitialColor] = useState("#111111");
  const [reopenedFrom, setReopenedFrom] = useState(null);
  const [detailJob, setDetailJob] = useState(null);
  const [hasEditorContent, setHasEditorContent] = useState(false);
  const editorWrapRef = useRef(null);

  const model = STAMP_MODELS.find((entry) => entry.id === modelId) || STAMP_MODELS[0];

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/tools/jobs?toolType=stamp-studio&limit=10");
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch {
      // Ignore fetch errors on admin helper pages.
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  function getCanvas() {
    return editorWrapRef.current?.querySelector("canvas");
  }

  function exportCanvasBlob() {
    const canvas = getCanvas();
    if (!canvas) return Promise.resolve(null);
    return new Promise((resolve) => {
      canvas.toBlob(resolve, "image/png");
    });
  }

  function handleReopen(job) {
    const data = job.inputData || {};
    const targetModelId = STAMP_MODELS.find((m) => m.id === data.model) ? data.model : STAMP_MODELS[0].id;
    setModelId(targetModelId);
    setInitialText(data.text || "");
    setInitialFont(data.font || "Helvetica");
    setInitialColor(data.color || "#111111");
    setOrderId(job.orderId || "");
    setNotes(job.notes || "");
    setStampConfig({});
    setReopenedFrom(job);
    setDetailJob(null);
    setHasEditorContent(false);
    setEditorKey((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function applyPreset(preset) {
    if (hasEditorContent) {
      const ok = window.confirm(t("admin.tools.stamp.discardConfirm"));
      if (!ok) return;
    }
    const targetModelId = STAMP_MODELS.find((m) => m.id === preset.modelId) ? preset.modelId : STAMP_MODELS[0].id;
    setModelId(targetModelId);
    setInitialText(preset.text);
    setInitialFont(preset.font || "Helvetica");
    setInitialColor("#111111");
    setOrderId("");
    setNotes("");
    setStampConfig({});
    setReopenedFrom(null);
    setHasEditorContent(false);
    setEditorKey((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDuplicate(job) {
    const data = job.inputData || {};
    const output = job.outputData || {};
    // Create a new pending job with same config
    try {
      const res = await fetch("/api/admin/tools/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolType: "stamp-studio",
          inputData: { model: data.model, text: data.text, font: data.font, color: data.color },
          outputFileUrl: job.outputFileUrl || null,
          outputFileKey: job.outputFileKey || null,
          outputData: {
            fileName: `stamp-dup-${Date.now()}.png`,
            shape: output.shape || null,
            widthIn: output.widthIn || null,
            heightIn: output.heightIn || null,
            diameterIn: output.diameterIn || null,
          },
          notes: job.notes ? `${t("admin.tools.stamp.duplicatedFrom")} · ${job.notes}` : t("admin.tools.stamp.duplicatedFrom"),
          orderId: job.orderId || null,
          status: "completed",
        }),
      });
      if (!res.ok) throw new Error();
      fetchJobs();
    } catch {
      // Silently fail duplicate — not critical
    }
  }

  async function handleDownload() {
    const blob = await exportCanvasBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `stamp-${modelId}-${Date.now()}.png`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleSave() {
    const blob = await exportCanvasBlob();
    if (!blob) return;

    setSaving(true);
    setSaveMsg("");

    try {
      const fileName = `stamp-${modelId}-${Date.now()}.png`;
      const uploaded = await uploadDesignSnapshot(blob, fileName);

      const res = await fetch("/api/admin/tools/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolType: "stamp-studio",
          inputData: { model: modelId, ...stampConfig },
          outputFileUrl: uploaded.url,
          outputFileKey: uploaded.key,
          outputData: {
            fileName,
            shape: model.shape,
            widthIn: model.widthIn || null,
            heightIn: model.heightIn || null,
            diameterIn: model.diameterIn || null,
          },
          notes: notes || null,
          orderId: orderId || null,
          status: "completed",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || t("admin.tools.stamp.errorSave"));
      }

      setSaveMsg(t("admin.tools.savedMsg"));
      setSaveIsError(false);
      setReopenedFrom(null);
      setHasEditorContent(false);
      fetchJobs();
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : t("admin.common.saveFailed"));
      setSaveIsError(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-black">{t("admin.tools.stamp.title")}</h1>
          <p className="mt-1 text-sm text-[#666]">
            {t("admin.tools.stamp.subtitle")}
          </p>
        </div>
        {/* Active task indicator */}
        {(hasEditorContent || reopenedFrom) && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold text-amber-700">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            {reopenedFrom ? t("admin.tools.stamp.editingReopen") : t("admin.tools.stamp.editing")}
          </span>
        )}
      </div>

      {/* Quick Start Presets */}
      <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-4">
        <p className="mb-3 text-xs font-bold text-[#666]">{t("admin.tools.stamp.quickStart")}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {QUICK_START_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset)}
              className="rounded-[3px] border border-[#e0e0e0] bg-[#fafafa] p-3 text-left transition-colors hover:border-black hover:bg-white"
            >
              <p className="text-xs font-semibold text-[#111]">{t(preset.labelKey)}</p>
              <p className="mt-1 text-[10px] text-[#999]">{modelLabel(preset.modelId)}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Reopened-task banner */}
      {reopenedFrom && (
        <div className="flex items-center gap-3 rounded-[3px] border border-yellow-300 bg-yellow-50 px-4 py-2.5">
          <svg className="h-4 w-4 shrink-0 text-yellow-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" /></svg>
          <span className="flex-1 text-xs text-yellow-800">
            {t("admin.tools.stamp.reopenedBanner")} <span className="font-semibold">{modelLabel(reopenedFrom.inputData?.model)}</span>
          </span>
          <button type="button" onClick={() => setReopenedFrom(null)} className="text-yellow-600 hover:text-yellow-800">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-[11px] font-medium text-[#666]">{t("admin.tools.stamp.modelLabel")}</label>
          <select
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
          >
            {STAMP_MODELS.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-[#666]">{t("admin.tools.orderLabel")}</label>
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder={t("admin.tools.orderPlaceholder")}
            className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
          />
        </div>
      </div>

      <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-4 sm:p-6" ref={editorWrapRef}>
        <StampEditor
          key={`${modelId}-${editorKey}`}
          shape={model.shape}
          widthIn={model.widthIn}
          heightIn={model.heightIn}
          diameterIn={model.diameterIn}
          text={initialText}
          font={initialFont}
          color={initialColor}
          hideInkColor
          onChange={(patch) => { setStampConfig((prev) => ({ ...prev, ...patch })); setHasEditorContent(true); }}
        />
      </div>

      <div>
        <label className="mb-1 block text-[11px] font-medium text-[#666]">{t("admin.tools.notesLabel")}</label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t("admin.tools.stamp.notesPlaceholder")}
          className="w-full resize-none rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex items-center justify-center gap-2 rounded-[3px] border border-[#e0e0e0] bg-white px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:border-black"
        >
          {t("admin.tools.downloadPng")}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-[3px] bg-black px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#222] disabled:opacity-50"
        >
          {saving ? t("admin.tools.saving") : t("admin.tools.saveToRecords")}
        </button>
        {saveMsg ? (
          <span className={`text-xs font-medium ${saveIsError ? "text-red-600" : "text-green-600"}`}>
            {saveMsg}
          </span>
        ) : null}
      </div>

      {/* ── Recent Jobs ──────────────────────────────────────────────── */}
      <div className="rounded-[3px] border border-[#e0e0e0] bg-white">
        <div className="border-b border-[#e0e0e0] px-5 py-3">
          <h2 className="text-sm font-bold text-black">{t("admin.tools.stamp.recentTitle")}</h2>
          <p className="mt-0.5 text-[10px] text-[#999]">{t("admin.tools.stamp.recentSubtitle")}</p>
        </div>
        {loadingJobs ? (
          <div className="px-5 py-8 text-center text-sm text-[#999]">{t("admin.tools.loading")}</div>
        ) : jobs.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-[#999]">{t("admin.tools.stamp.noJobs")}</div>
        ) : (
          <div className="divide-y divide-[#e0e0e0]">
            {jobs.map((job) => (
              <StampJobRow
                key={job.id}
                job={job}
                t={t}
                onPreview={setPreviewUrl}
                onDetail={setDetailJob}
                onReopen={handleReopen}
                onDuplicate={handleDuplicate}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Preview Lightbox ─────────────────────────────────────── */}
      {previewUrl ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70" onClick={() => setPreviewUrl(null)}>
          <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewUrl(null)}
              className="absolute -right-3 -top-3 rounded-full bg-white p-1.5 shadow-lg hover:bg-[#f5f5f5]"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img src={previewUrl} alt="Stamp preview" className="max-h-[85vh] max-w-[85vw] rounded-[3px] shadow-2xl" />
          </div>
        </div>
      ) : null}

      {/* ── Detail Modal ─────────────────────────────────────────── */}
      {detailJob ? (
        <StampDetailModal
          job={detailJob}
          t={t}
          onClose={() => setDetailJob(null)}
          onReopen={handleReopen}
        />
      ) : null}
    </div>
  );
}

// ─── Stamp Job Row ────────────────────────────────────────────────────────────

function StampJobRow({ job, t, onPreview, onDetail, onReopen, onDuplicate }) {
  const data = job.inputData || {};
  const output = job.outputData || {};
  const shapeLabel = output.shape === "round" ? t("admin.tools.stamp.shapeRound") : output.shape === "rect" ? t("admin.tools.stamp.shapeRectangle") : "";
  const dims = output.diameterIn
    ? `\u2300${output.diameterIn}"`
    : output.widthIn && output.heightIn
    ? `${output.widthIn}" × ${output.heightIn}"`
    : "";
  const textPreview = data.text ? (data.text.length > 30 ? data.text.slice(0, 30) + "…" : data.text) : null;

  return (
    <div className="flex flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Thumbnail — click opens detail */}
      <button type="button" onClick={() => onDetail(job)} className="h-12 w-12 shrink-0 overflow-hidden rounded-[3px] border border-[#e0e0e0] bg-[#fafafa] transition-opacity hover:opacity-80">
        {job.outputFileUrl ? (
          <img src={job.outputFileUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-[#ccc]">—</div>
        )}
      </button>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-black">{modelLabel(data.model)}</span>
          {shapeLabel && dims && (
            <span className="rounded-[2px] bg-[#f0f0f0] px-1.5 py-0.5 text-[10px] font-medium text-[#666]">{shapeLabel} · {dims}</span>
          )}
          {data.font && data.font !== "Helvetica" && (
            <span className="text-[10px] text-[#999]">{data.font}</span>
          )}
          <StatusBadge status={job.status} t={t} />
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-[#999]">
          <span>{timeAgo(job.createdAt, t)}</span>
          {job.operatorName && <><span>·</span><span>{job.operatorName}</span></>}
          {job.orderId && <><span>·</span><span>{t("admin.common.order")}: #{job.orderId.slice(0, 8)}</span></>}
        </div>
        {textPreview && <p className="mt-0.5 truncate text-xs italic text-[#777]">&ldquo;{textPreview}&rdquo;</p>}
        {job.notes && !textPreview && <p className="mt-0.5 truncate text-xs text-[#777]">{job.notes}</p>}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
        {job.outputFileUrl && (
          <button
            type="button"
            onClick={() => onPreview(job.outputFileUrl)}
            className="rounded-[3px] border border-[#e0e0e0] px-3 py-1.5 text-xs font-medium text-[#666] transition-colors hover:border-black hover:text-black"
          >
            {t("admin.tools.preview")}
          </button>
        )}
        <button
          type="button"
          onClick={() => onDetail(job)}
          className="rounded-[3px] border border-[#e0e0e0] px-3 py-1.5 text-xs font-medium text-[#666] transition-colors hover:border-black hover:text-black"
        >
          {t("admin.tools.stamp.detail")}
        </button>
        <button
          type="button"
          onClick={() => onReopen(job)}
          className="rounded-[3px] border border-[#e0e0e0] px-3 py-1.5 text-xs font-medium text-[#666] transition-colors hover:border-black hover:text-black"
        >
          {t("admin.tools.reopen")}
        </button>
        <button
          type="button"
          onClick={() => onDuplicate(job)}
          className="rounded-[3px] border border-[#e0e0e0] px-3 py-1.5 text-xs font-medium text-[#666] transition-colors hover:border-black hover:text-black"
        >
          {t("admin.tools.stamp.duplicate")}
        </button>
        {job.orderId && (
          <Link
            href={`/admin/orders/${job.orderId}`}
            className="rounded-[3px] border border-[#e0e0e0] px-3 py-1.5 text-xs font-medium text-[#666] transition-colors hover:border-black hover:text-black"
          >
            {t("admin.tools.viewOrder")}
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Stamp Detail Modal ───────────────────────────────────────────────────────

function StampDetailModal({ job, t, onClose, onReopen }) {
  const data = job.inputData || {};
  const output = job.outputData || {};

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="mx-4 w-full max-w-2xl rounded-[3px] bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e0e0e0] px-5 py-4">
          <h3 className="text-sm font-bold text-black">{t("admin.tools.stamp.detailTitle")}</h3>
          <button type="button" onClick={onClose} className="text-[#999] hover:text-black">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5 space-y-4">
          {/* Preview */}
          {job.outputFileUrl && (
            <div className="rounded-[3px] border border-[#e0e0e0] bg-[#fafafa] p-4">
              <img src={job.outputFileUrl} alt="Stamp" className="mx-auto max-h-[300px] object-contain" />
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <MetaCell label={t("admin.tools.stamp.modelLabel")} value={modelLabel(data.model)} />
            <MetaCell label={t("admin.tools.stamp.shapeLabel")} value={output.shape === "round" ? t("admin.tools.stamp.shapeRound") : output.shape === "rect" ? t("admin.tools.stamp.shapeRectangle") : "—"} />
            <MetaCell label={t("admin.tools.stamp.dimensionsLabel")} value={
              output.diameterIn ? `\u2300${output.diameterIn}"` : output.widthIn && output.heightIn ? `${output.widthIn}" × ${output.heightIn}"` : "—"
            } />
            <MetaCell label={t("admin.tools.stamp.fontLabel")} value={data.font || "Helvetica"} />
            <MetaCell label={t("admin.tools.stamp.colorLabel")} value={
              <span className="flex items-center gap-2">
                <span className="inline-block h-3.5 w-3.5 rounded-sm border border-[#e0e0e0]" style={{ backgroundColor: data.color || "#111111" }} />
                {data.color || "#111111"}
              </span>
            } />
            <MetaCell label={t("admin.tools.contour.operator")} value={job.operatorName || "—"} />
            <MetaCell label={t("admin.tools.contour.created")} value={formatJobTime(job.createdAt)} />
            {job.orderId && (
              <MetaCell label={t("admin.tools.contour.order")} value={
                <Link href={`/admin/orders/${job.orderId}`} className="text-[#4f46e5] hover:underline">#{job.orderId.slice(-8)}</Link>
              } />
            )}
          </div>

          {/* Text content */}
          {data.text && (
            <div>
              <p className="text-[11px] font-medium text-[#666]">{t("admin.tools.stamp.textLabel")}</p>
              <p className="mt-1 whitespace-pre-wrap rounded-[3px] border border-[#e0e0e0] bg-[#fafafa] px-3 py-2 text-sm text-[#111]">{data.text}</p>
            </div>
          )}

          {job.notes && (
            <div>
              <p className="text-[11px] font-medium text-[#666]">{t("admin.tools.notesLabel")}</p>
              <p className="text-sm text-[#111]">{job.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 border-t border-[#e0e0e0] pt-4">
            <button
              type="button"
              onClick={() => onReopen(job)}
              className="rounded-[3px] bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-[#222]"
            >
              {t("admin.tools.stamp.reopenEdit")}
            </button>
            {job.outputFileUrl && (
              <a href={job.outputFileUrl} download={output.fileName || undefined} className="rounded-[3px] border border-[#e0e0e0] px-4 py-2 text-xs font-medium text-[#666] hover:border-black hover:text-black">
                {t("admin.tools.downloadPng")}
              </a>
            )}
            {job.orderId && (
              <Link href={`/admin/orders/${job.orderId}`} className="rounded-[3px] border border-[#e0e0e0] px-4 py-2 text-xs font-medium text-[#666] hover:border-black hover:text-black">
                {t("admin.tools.viewOrder")}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function MetaCell({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-[#666]">{label}</p>
      <p className="text-[#111]">{value}</p>
    </div>
  );
}
