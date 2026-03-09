"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { uploadDesignSnapshot } from "@/lib/design-studio/upload-snapshot";
import { useTranslation } from "@/lib/i18n/useTranslation";

const StampEditor = dynamic(() => import("@/components/product/StampEditor"), { ssr: false });

const STAMP_MODELS = [
  { id: "round-40mm", label: "Round 40mm", shape: "round", diameterIn: 1.57 },
  { id: "round-50mm", label: "Round 50mm", shape: "round", diameterIn: 1.97 },
  { id: "rect-47x18", label: "Rectangle 47x18mm", shape: "rect", widthIn: 1.85, heightIn: 0.71 },
  { id: "rect-58x22", label: "Rectangle 58x22mm", shape: "rect", widthIn: 2.28, heightIn: 0.87 },
  { id: "rect-70x30", label: "Rectangle 70x30mm", shape: "rect", widthIn: 2.76, heightIn: 1.18 },
];

function formatJobTime(dateString) {
  const date = new Date(dateString);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export default function StampStudioPage() {
  const { t } = useTranslation();
  const [modelId, setModelId] = useState(STAMP_MODELS[0].id);
  const [orderId, setOrderId] = useState("");
  const [notes, setNotes] = useState("");
  const [stampConfig, setStampConfig] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [editorKey, setEditorKey] = useState(0);
  const [initialText, setInitialText] = useState("");
  const [initialFont, setInitialFont] = useState("Helvetica");
  const [initialColor, setInitialColor] = useState("#111111");
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
    setEditorKey((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
        throw new Error(err?.error || "Failed to save stamp record");
      }

      setSaveMsg("Saved to records");
      fetchJobs();
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (err) {
      setSaveMsg(`Error: ${err instanceof Error ? err.message : "Failed to save"}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-black">{t("admin.tools.stamp.title")}</h1>
        <p className="mt-1 text-sm text-[#666]">
          {t("admin.tools.stamp.subtitle")}
        </p>
      </div>

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
          onChange={(patch) => setStampConfig((prev) => ({ ...prev, ...patch }))}
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
          <span className={`text-xs font-medium ${saveMsg.startsWith("Error") ? "text-red-600" : "text-green-600"}`}>
            {saveMsg}
          </span>
        ) : null}
      </div>

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
              <div key={job.id} className="flex flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-black">
                    {job.inputData?.model || "stamp"} {job.operatorName ? `· ${job.operatorName}` : ""}
                  </p>
                  <p className="text-xs text-[#999]">
                    {formatJobTime(job.createdAt)}
                    {job.orderId ? <span> · Order: {job.orderId.slice(0, 8)}...</span> : null}
                  </p>
                  {job.notes ? <p className="mt-0.5 truncate text-xs text-[#777]">{job.notes}</p> : null}
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  {job.outputFileUrl ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setPreviewUrl(job.outputFileUrl)}
                        className="rounded-[3px] border border-[#e0e0e0] px-3 py-1.5 text-xs font-medium text-[#666] transition-colors hover:border-black hover:text-black"
                      >
                        {t("admin.tools.preview")}
                      </button>
                      <a
                        href={job.outputFileUrl}
                        download={job.outputData?.fileName || undefined}
                        className="rounded-[3px] border border-[#e0e0e0] px-3 py-1.5 text-xs font-medium text-[#666] transition-colors hover:border-black hover:text-black"
                      >
                        {t("admin.tools.download")}
                      </a>
                    </>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => handleReopen(job)}
                    className="rounded-[3px] border border-[#e0e0e0] px-3 py-1.5 text-xs font-medium text-[#666] transition-colors hover:border-black hover:text-black"
                  >
                    {t("admin.tools.reopen")}
                  </button>
                  {job.orderId ? (
                    <Link
                      href={`/admin/orders/${job.orderId}`}
                      className="rounded-[3px] border border-[#e0e0e0] px-3 py-1.5 text-xs font-medium text-[#666] transition-colors hover:border-black hover:text-black"
                    >
                      {t("admin.tools.viewOrder")}
                    </Link>
                  ) : null}
                  <span
                    className={`rounded-[2px] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      job.status === "completed" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {job.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
    </div>
  );
}
