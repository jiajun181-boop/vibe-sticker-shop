"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
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
    color: "#111111",
  },
  {
    id: "approval",
    labelKey: "admin.tools.stamp.presetApproval",
    modelId: "round-40mm",
    text: "APPROVED\n[Company Name]\nDate: ____/____/____",
    font: "Helvetica",
    color: "#2563EB",
    curve: 60,
    border: "double",
  },
  {
    id: "date-received",
    labelKey: "admin.tools.stamp.presetDateReceived",
    modelId: "rect-58x22",
    text: "RECEIVED\nDate: ____/____/____\nBy: __________",
    font: "Helvetica",
    color: "#2563EB",
  },
  {
    id: "signature",
    labelKey: "admin.tools.stamp.presetSignature",
    modelId: "rect-70x30",
    text: "[Name]\n[Title]",
    font: "Helvetica",
    color: "#111111",
  },
  {
    id: "book-name",
    labelKey: "admin.tools.stamp.presetBookName",
    modelId: "rect-58x22",
    text: "FROM THE LIBRARY OF\n[Name]",
    font: "Georgia",
    color: "#111111",
  },
  {
    id: "funny-approval",
    labelKey: "admin.tools.stamp.presetFunny",
    modelId: "round-50mm",
    text: "BOSS APPROVED\n★★★★★\nNo Questions Asked",
    font: "Helvetica",
    color: "#DC2626",
    curve: 70,
    border: "single",
  },
  {
    id: "face-stamp",
    labelKey: "admin.tools.stamp.presetFaceStamp",
    modelId: "round-50mm",
    text: "[YOUR NAME]\n★ OFFICIAL ★",
    font: "Playfair Display",
    color: "#1E40AF",
    curve: 65,
    border: "double",
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

// M2 Change 3: Smarter download filename
function buildFileName(text, modelId) {
  const firstLine = (text || "").split("\n")[0] || "";
  const sanitized = firstLine.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 20);
  const prefix = sanitized || "stamp";
  return `stamp-${prefix}-${modelId}.png`;
}

// M2 Change 4: Check if a date is today
function isToday(dateString) {
  const d = new Date(dateString);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export default function StampStudioPageWrapper() {
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center text-sm text-[#999]">Loading…</div>}>
      <StampStudioPage />
    </Suspense>
  );
}

function StampStudioPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [modelId, setModelId] = useState(STAMP_MODELS[0].id);
  const [orderId, setOrderId] = useState(() => searchParams.get("orderId") || "");
  const [itemId] = useState(() => searchParams.get("itemId") || "");
  const [itemContext, setItemContext] = useState(null); // { productName, quantity }
  const [notes, setNotes] = useState("");
  const [stampConfig, setStampConfig] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [saveIsError, setSaveIsError] = useState(false);
  const [savedOrderId, setSavedOrderId] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [editorKey, setEditorKey] = useState(0);
  const [initialText, setInitialText] = useState("");
  const [initialFont, setInitialFont] = useState("Helvetica");
  const [initialColor, setInitialColor] = useState("#111111");
  const [initialCurve, setInitialCurve] = useState(undefined);
  const [initialBorder, setInitialBorder] = useState(undefined);
  const [reopenedFrom, setReopenedFrom] = useState(null);
  const [detailJob, setDetailJob] = useState(null);
  const [hasEditorContent, setHasEditorContent] = useState(false);
  const editorWrapRef = useRef(null);
  // M2 Change 2: Track active preset label for context bar
  const [activePresetLabel, setActivePresetLabel] = useState(null);

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

  // M2 Change 1: Unsaved-changes browser guard
  useEffect(() => {
    if (!hasEditorContent) return;
    const handler = (e) => { e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasEditorContent]);

  // M2 Change 6: Keyboard shortcuts (Ctrl+S save, Ctrl+D download)
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        handleDownload();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  // Fetch item context when opened from an order with a specific item
  useEffect(() => {
    if (!orderId || !itemId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/orders/${orderId}`);
        if (!res.ok || cancelled) return;
        const order = await res.json();
        const item = (order.items || []).find((i) => i.id === itemId);
        if (item && !cancelled) {
          setItemContext({ productName: item.productName, quantity: item.quantity });
        }
      } catch { /* non-critical */ }
    })();
    return () => { cancelled = true; };
  }, [orderId, itemId]);

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
    // M2 Change 1: Check unsaved content before reopening
    if (hasEditorContent) {
      const ok = window.confirm(t("admin.tools.stamp.discardConfirm"));
      if (!ok) return;
    }
    const data = job.inputData || {};
    const targetModelId = STAMP_MODELS.find((m) => m.id === data.model) ? data.model : STAMP_MODELS[0].id;
    setModelId(targetModelId);
    setInitialText(data.text || "");
    setInitialFont(data.font || "Helvetica");
    setInitialColor(data.color || "#111111");
    setInitialCurve(data.curveAmount ?? undefined);
    setInitialBorder(data.border ?? undefined);
    setOrderId(job.orderId || "");
    setNotes(job.notes || "");
    setStampConfig({});
    setReopenedFrom(job);
    setDetailJob(null);
    setHasEditorContent(false);
    // M2 Change 2: Clear preset label on reopen
    setActivePresetLabel(null);
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
    setInitialColor(preset.color || "#111111");
    setInitialCurve(preset.curve ?? undefined);
    setInitialBorder(preset.border ?? undefined);
    setOrderId("");
    setNotes("");
    setStampConfig({});
    setReopenedFrom(null);
    setHasEditorContent(false);
    // M2 Change 2: Set active preset label
    setActivePresetLabel(t(preset.labelKey));
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

  // M2 Change 3: Use smarter filename
  async function handleDownload() {
    const blob = await exportCanvasBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = buildFileName(stampConfig.text || initialText, modelId);
    anchor.click();
    URL.revokeObjectURL(url);
  }

  // M2 Change 3: Use smarter filename
  async function handleSave() {
    const blob = await exportCanvasBlob();
    if (!blob) return;

    setSaving(true);
    setSaveMsg("");

    try {
      const fileName = buildFileName(stampConfig.text || initialText, modelId);
      const uploaded = await uploadDesignSnapshot(blob, fileName);

      const res = await fetch("/api/admin/tools/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolType: "stamp-studio",
          inputData: { model: modelId, ...stampConfig, ...(itemId ? { itemId } : {}) },
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
      if (orderId) setSavedOrderId(orderId);
      setReopenedFrom(null);
      setHasEditorContent(false);
      fetchJobs();
      if (!orderId) setTimeout(() => setSaveMsg(""), 3000);
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : t("admin.common.saveFailed"));
      setSaveIsError(true);
    } finally {
      setSaving(false);
    }
  }

  // M2 Change 2: Derive context bar label
  const contextLabel = activePresetLabel
    ? `${t("admin.tools.stamp.contextFrom")}: ${activePresetLabel}`
    : reopenedFrom
    ? t("admin.tools.stamp.contextReopened")
    : hasEditorContent
    ? t("admin.tools.stamp.contextCustom")
    : null;

  // M2 Change 4: Split jobs into today and earlier
  const todayJobs = jobs.filter((j) => isToday(j.createdAt));
  const earlierJobs = jobs.filter((j) => !isToday(j.createdAt));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-[#999]">
        <Link href="/admin/workstation" className="hover:text-[#111]">{t("admin.workstation.title")}</Link>
        <span>/</span>
        <Link href="/admin/tools" className="hover:text-[#111]">{t("admin.tools.hubTitle")}</Link>
        <span>/</span>
        <span className="text-[#111] font-medium">{t("admin.tools.stamp.title")}</span>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-black">{t("admin.tools.stamp.title")}</h1>
          <p className="mt-1 text-sm text-[#666]">{t("admin.tools.stamp.subtitle")}</p>
          <div className="mt-3 grid gap-3 text-xs sm:grid-cols-4">
            <div>
              <p className="font-semibold text-[#111]">{t("admin.tools.meta.whatItDoes")}</p>
              <p className="mt-0.5 text-[#666]">{t("admin.tools.stamp.metaWhat")}</p>
            </div>
            <div>
              <p className="font-semibold text-[#111]">{t("admin.tools.meta.input")}</p>
              <p className="mt-0.5 text-[#666]">{t("admin.tools.stamp.metaInput")}</p>
            </div>
            <div>
              <p className="font-semibold text-[#111]">{t("admin.tools.meta.output")}</p>
              <p className="mt-0.5 text-[#666]">{t("admin.tools.stamp.metaOutput")}</p>
            </div>
            <div>
              <p className="font-semibold text-[#111]">{t("admin.tools.meta.nextStep")}</p>
              <p className="mt-0.5 text-[#666]">{t("admin.tools.stamp.metaNext")}</p>
            </div>
          </div>
        </div>
        {/* Active task indicator */}
        {(hasEditorContent || reopenedFrom) && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold text-amber-700">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            {reopenedFrom ? t("admin.tools.stamp.editingReopen") : t("admin.tools.stamp.editing")}
          </span>
        )}
      </div>

      {/* Order context banner — shown when opened from an order */}
      {searchParams.get("orderId") && (
        <div className="flex items-center justify-between gap-3 rounded-[3px] border border-indigo-200 bg-indigo-50 px-4 py-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-block h-2 w-2 rounded-full bg-indigo-500" />
            <p className="text-xs text-indigo-800">
              <span className="font-semibold">{t("admin.tools.orderContext")}</span>{" "}
              <span className="font-mono">#{orderId.slice(0, 8)}</span>
              {itemContext && (
                <span className="ml-2 text-indigo-600">
                  \u2014 {itemContext.productName} (\u00d7{itemContext.quantity})
                </span>
              )}
            </p>
          </div>
          <Link
            href={`/admin/orders/${orderId}`}
            className="shrink-0 rounded-[3px] border border-indigo-300 px-2.5 py-1 text-[10px] font-semibold text-indigo-700 hover:bg-indigo-100"
          >
            {t("admin.tools.viewOrder")}
          </Link>
        </div>
      )}

      {/* Quick Start Presets */}
      <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-4">
        <p className="mb-3 text-xs font-bold text-[#666]">{t("admin.tools.stamp.quickStart")}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {QUICK_START_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset)}
              className="rounded-[3px] border border-[#e0e0e0] bg-[#fafafa] p-3 text-left transition-colors hover:border-black hover:bg-white"
            >
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 shrink-0 rounded-full border border-[#e0e0e0]"
                  style={{ backgroundColor: preset.color || "#111111" }}
                />
                <p className="text-xs font-semibold text-[#111]">{t(preset.labelKey)}</p>
              </div>
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
            onChange={(e) => { setModelId(e.target.value); setActivePresetLabel(null); }}
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
        {/* M2 Change 2: Enhanced current task context bar */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#111]">{t("admin.tools.stamp.currentTask")}</span>
            <span className="rounded-[2px] bg-[#f0f0f0] px-2 py-0.5 text-[10px] font-medium text-[#666]">{modelLabel(modelId)}</span>
            <span className="rounded-[2px] bg-[#f0f0f0] px-2 py-0.5 text-[10px] font-medium text-[#666]">{model.shape === "round" ? t("admin.tools.stamp.shapeRound") : t("admin.tools.stamp.shapeRectangle")}</span>
            {contextLabel && (
              <span className="rounded-[2px] bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">{contextLabel}</span>
            )}
            {hasEditorContent && !saving && (
              <span className="inline-flex items-center gap-1 rounded-[2px] bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                {t("admin.tools.stamp.unsaved")}
              </span>
            )}
          </div>
          {orderId && (
            <span className="text-[10px] text-[#999]">{t("admin.common.order")}: #{orderId.slice(0, 8)}</span>
          )}
        </div>
        <StampEditor
          key={`${modelId}-${editorKey}`}
          shape={model.shape}
          widthIn={model.widthIn}
          heightIn={model.heightIn}
          diameterIn={model.diameterIn}
          text={initialText}
          font={initialFont}
          color={initialColor}
          initialCurve={initialCurve}
          initialBorder={initialBorder}
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
        {/* M2 Change 6: Keyboard shortcut hints */}
        <span className="text-[10px] text-[#bbb]">{t("admin.tools.stamp.shortcutHint")}</span>
      </div>

      {/* ── Post-save guidance (when saved with order link) ──────────── */}
      {savedOrderId && !saveIsError && (
        <div className="flex items-center justify-between gap-3 rounded-[3px] border border-green-300 bg-green-50 px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-green-800">{t("admin.tools.stamp.savedSuccess")}</p>
            <p className="mt-0.5 text-[11px] text-green-700">{t("admin.tools.postSaveGuidance")}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/admin/orders/${savedOrderId}`}
              className="rounded-[3px] bg-black px-3 py-1.5 text-[10px] font-bold text-white hover:bg-[#222]"
            >
              {t("admin.tools.viewOrder")}
            </Link>
            <button
              type="button"
              onClick={() => setSavedOrderId(null)}
              className="text-green-600 hover:text-green-800"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Recent Jobs ──────────────────────────────────────────────── */}
      <div className="rounded-[3px] border border-[#e0e0e0] bg-white">
        <div className="border-b border-[#e0e0e0] px-5 py-3">
          <h2 className="text-sm font-bold text-black">{t("admin.tools.stamp.recentTitle")}</h2>
          <p className="mt-0.5 text-[10px] text-[#999]">{t("admin.tools.stamp.recentSubtitle")}</p>
        </div>
        {loadingJobs ? (
          <div className="px-5 py-8 text-center text-sm text-[#999]">{t("admin.tools.loading")}</div>
        ) : jobs.length === 0 ? (
          <div className="px-5 py-8 text-center">
            {/* M2 Change 7: Getting Started guide when no jobs and no editor content */}
            {!hasEditorContent && (
              <div className="mx-auto mb-4 max-w-sm space-y-2">
                <p className="text-xs font-bold text-[#333]">{t("admin.tools.stamp.gettingStarted")}</p>
                <div className="flex items-start gap-2 text-left">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">1</span>
                  <p className="text-xs text-[#666]">{t("admin.tools.stamp.guideStep1")}</p>
                </div>
                <div className="flex items-start gap-2 text-left">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">2</span>
                  <p className="text-xs text-[#666]">{t("admin.tools.stamp.guideStep2")}</p>
                </div>
                <div className="flex items-start gap-2 text-left">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">3</span>
                  <p className="text-xs text-[#666]">{t("admin.tools.stamp.guideStep3")}</p>
                </div>
              </div>
            )}
            <p className="text-sm text-[#999]">{t("admin.tools.stamp.noJobs")}</p>
            <p className="mt-1 text-xs text-[#bbb]">{t("admin.tools.stamp.noJobsHint")}</p>
          </div>
        ) : (
          <div className="divide-y divide-[#e0e0e0]">
            {/* M2 Change 4: Today / Earlier grouping */}
            {todayJobs.length > 0 && (
              <>
                <div className="px-5 py-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#999]">{t("admin.tools.stamp.groupToday")}</span>
                </div>
                {todayJobs.map((job) => (
                  <StampJobRow key={job.id} job={job} t={t} onPreview={setPreviewUrl} onDetail={setDetailJob} onReopen={handleReopen} onDuplicate={handleDuplicate} fetchJobs={fetchJobs} />
                ))}
              </>
            )}
            {earlierJobs.length > 0 && (
              <>
                <div className="px-5 py-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#999]">{t("admin.tools.stamp.groupEarlier")}</span>
                </div>
                {earlierJobs.map((job) => (
                  <StampJobRow key={job.id} job={job} t={t} onPreview={setPreviewUrl} onDetail={setDetailJob} onReopen={handleReopen} onDuplicate={handleDuplicate} fetchJobs={fetchJobs} />
                ))}
              </>
            )}
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

function StampJobRow({ job, t, onPreview, onDetail, onReopen, onDuplicate, fetchJobs }) {
  const data = job.inputData || {};
  const output = job.outputData || {};
  const shapeLabel = output.shape === "round" ? t("admin.tools.stamp.shapeRound") : output.shape === "rect" ? t("admin.tools.stamp.shapeRectangle") : "";
  const dims = output.diameterIn
    ? `\u2300${output.diameterIn}"`
    : output.widthIn && output.heightIn
    ? `${output.widthIn}" × ${output.heightIn}"`
    : "";
  const textPreview = data.text ? (data.text.length > 30 ? data.text.slice(0, 30) + "…" : data.text) : null;

  // M2 Change 5: Inline notes editing
  const [editingNotes, setEditingNotes] = useState(false);
  const [noteValue, setNoteValue] = useState(job.notes || "");
  const [noteSaving, setNoteSaving] = useState(false);
  const noteInputRef = useRef(null);

  useEffect(() => {
    if (editingNotes && noteInputRef.current) noteInputRef.current.focus();
  }, [editingNotes]);

  async function saveNotes() {
    if (noteValue === (job.notes || "")) { setEditingNotes(false); return; }
    setNoteSaving(true);
    try {
      const res = await fetch(`/api/admin/tools/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: noteValue || null }),
      });
      if (res.ok) fetchJobs();
    } catch { /* non-critical */ }
    setNoteSaving(false);
    setEditingNotes(false);
  }

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
        {/* M2 Change 5: Notes with inline editing */}
        <div className="mt-0.5 flex items-center gap-1">
          {editingNotes ? (
            <input
              ref={noteInputRef}
              type="text"
              value={noteValue}
              onChange={(e) => setNoteValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") saveNotes(); if (e.key === "Escape") setEditingNotes(false); }}
              onBlur={saveNotes}
              disabled={noteSaving}
              className="w-full max-w-xs rounded-[2px] border border-[#d0d0d0] px-1.5 py-0.5 text-xs text-[#111] outline-none focus:border-black"
            />
          ) : (
            <>
              {(job.notes && !textPreview) && <p className="truncate text-xs text-[#777]">{job.notes}</p>}
              <button type="button" onClick={() => { setNoteValue(job.notes || ""); setEditingNotes(true); }} className="shrink-0 text-[#bbb] hover:text-[#666]" title={t("admin.tools.stamp.editNotes")}>
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" /></svg>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Actions — prominent, grouped by priority */}
      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => onReopen(job)}
          className="rounded-[3px] bg-black px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#222]"
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
        {job.outputFileUrl && (
          <a
            href={job.outputFileUrl}
            download={`stamp-${data.model || "stamp"}.png`}
            className="rounded-[3px] border border-[#e0e0e0] px-3 py-1.5 text-xs font-medium text-[#666] transition-colors hover:border-black hover:text-black"
          >
            {t("admin.tools.downloadPng")}
          </a>
        )}
        {job.outputFileUrl && (
          <button
            type="button"
            onClick={() => onPreview(job.outputFileUrl)}
            className="rounded-[3px] border border-[#e0e0e0] px-3 py-1.5 text-xs font-medium text-[#666] transition-colors hover:border-black hover:text-black"
          >
            {t("admin.tools.preview")}
          </button>
        )}
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
