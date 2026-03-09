"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { uploadDesignSnapshot } from "@/lib/design-studio/upload-snapshot";
import { useTranslation } from "@/lib/i18n/useTranslation";

function formatJobTime(dateString) {
  const date = new Date(dateString);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

async function blobFromUrl(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch generated file");
  return res.blob();
}

export default function ContourToolPage() {
  const { t } = useTranslation();
  const [imageUrl, setImageUrl] = useState(null);
  const [imageName, setImageName] = useState("");
  const [sourceFile, setSourceFile] = useState(null);
  const [contourResult, setContourResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [bleedMm, setBleedMm] = useState(3);
  const [orderId, setOrderId] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [detailJob, setDetailJob] = useState(null);
  const [reopening, setReopening] = useState(false);
  const fileInputRef = useRef(null);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/tools/jobs?toolType=contour&limit=10");
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch {
      // Ignore admin helper fetch errors.
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  function resetPreviewState(objectUrl, fileName, file) {
    setImageName(fileName);
    setSourceFile(file);
    setImageUrl(objectUrl);
    setContourResult(null);
  }

  function handleFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    const objectUrl = URL.createObjectURL(file);
    resetPreviewState(objectUrl, file.name, file);
    processContour(objectUrl);
  }

  async function processContour(url) {
    setProcessing(true);
    setProgress("Loading contour library...");

    try {
      const { generateContour } = await import("@/lib/contour/generate-contour");
      setProgress("Tracing contour...");
      const result = await generateContour(url, {
        bleedMm,
        onProgress: (stage) => setProgress(stage),
      });
      setContourResult(result);
      setProgress("");
    } catch (err) {
      console.error("Contour error:", err);
      setProgress(`Error: ${err instanceof Error ? err.message : "Failed to trace contour"}`);
    } finally {
      setProcessing(false);
    }
  }

  async function handleBleedChange(newBleed) {
    setBleedMm(newBleed);
    if (!contourResult?.contourPoints) return;

    try {
      const { regenerateBleed } = await import("@/lib/contour/generate-contour");
      const { pointsToCubicBezierPath } = await import("@/lib/contour/svg-path");
      const { bleedPoints } = regenerateBleed(contourResult.contourPoints, newBleed);
      const bleedPath = pointsToCubicBezierPath(bleedPoints, true, 0.3);
      setContourResult((prev) => ({
        ...prev,
        bleedMm: newBleed,
        bleedPath,
        bleedPoints,
      }));
    } catch (err) {
      console.error("Bleed regeneration error:", err);
    }
  }

  async function buildSvgBlob() {
    if (!contourResult) return null;
    const { buildContourSvg } = await import("@/lib/contour/svg-path");
    const svg = buildContourSvg({
      cutPath: contourResult.cutPath,
      bleedPath: contourResult.bleedPath,
      width: contourResult.imageWidth,
      height: contourResult.imageHeight,
    });
    return new Blob([svg], { type: "image/svg+xml" });
  }

  async function handleDownloadSvg() {
    const svgBlob = await buildSvgBlob();
    if (!svgBlob) return;
    const url = URL.createObjectURL(svgBlob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `contour-${imageName || "artwork"}.svg`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleDownloadPng() {
    if (!contourResult?.processedImageUrl) return;
    const blob = await blobFromUrl(contourResult.processedImageUrl);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `processed-${imageName || "artwork"}.png`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleSave() {
    if (!contourResult || !sourceFile) return;

    setSaving(true);
    setSaveMsg("");

    try {
      const [uploadedInput, svgBlob] = await Promise.all([
        uploadDesignSnapshot(sourceFile, sourceFile.name),
        buildSvgBlob(),
      ]);
      if (!svgBlob) throw new Error("Failed to build contour SVG");

      const uploadedSvg = await uploadDesignSnapshot(svgBlob, `contour-${Date.now()}.svg`);

      let processedAsset = null;
      if (contourResult.processedImageUrl) {
        const processedBlob = await blobFromUrl(contourResult.processedImageUrl);
        processedAsset = await uploadDesignSnapshot(processedBlob, `processed-${Date.now()}.png`);
      }

      const res = await fetch("/api/admin/tools/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolType: "contour",
          inputFileUrl: uploadedInput.url,
          inputFileKey: uploadedInput.key,
          inputData: {
            fileName: imageName,
            bleedMm,
            imageWidth: contourResult.imageWidth,
            imageHeight: contourResult.imageHeight,
          },
          outputFileUrl: uploadedSvg.url,
          outputFileKey: uploadedSvg.key,
          outputData: {
            cutPath: contourResult.cutPath,
            bleedPath: contourResult.bleedPath,
            bgRemoved: contourResult.bgRemoved,
            svgFileUrl: uploadedSvg.url,
            svgFileKey: uploadedSvg.key,
            processedFileUrl: processedAsset?.url || null,
            processedFileKey: processedAsset?.key || null,
          },
          notes: notes || null,
          orderId: orderId || null,
          status: "completed",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed to save contour record");
      }

      setSaveMsg(t("admin.tools.savedMsg"));
      fetchJobs();
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (err) {
      setSaveMsg(`Error: ${err instanceof Error ? err.message : "Failed to save"}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleReopen(job) {
    const data = job.inputData || {};
    setBleedMm(data.bleedMm ?? 3);
    setOrderId(job.orderId || "");
    setNotes(job.notes || "");
    setDetailJob(null);

    if (job.inputFileUrl) {
      setReopening(true);
      try {
        const res = await fetch(job.inputFileUrl);
        const blob = await res.blob();
        const file = new File([blob], data.fileName || "artwork.png", { type: blob.type });
        const objectUrl = URL.createObjectURL(blob);
        resetPreviewState(objectUrl, data.fileName || "artwork.png", file);
        processContour(objectUrl);
      } catch (err) {
        console.error("Failed to reopen contour job:", err);
      } finally {
        setReopening(false);
      }
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function onDrop(event) {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-black">{t("admin.tools.contour.title")}</h1>
        <p className="mt-1 text-sm text-[#666]">
          {t("admin.tools.contour.subtitle")}
        </p>
      </div>

      <div className="max-w-xs">
        <label className="mb-1 block text-[11px] font-medium text-[#666]">{t("admin.tools.orderLabel")}</label>
        <input
          type="text"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          placeholder={t("admin.tools.orderPlaceholder")}
          className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-[3px] border-2 border-dashed transition-colors ${
            dragOver ? "border-black bg-[#f5f5f5]" : "border-[#d0d0d0] bg-white hover:border-[#999]"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          {imageUrl ? (
            <div className="relative w-full p-4">
              <img src={imageUrl} alt="Uploaded artwork" className="mx-auto max-h-[280px] object-contain" />
              <p className="mt-2 text-center text-xs text-[#999]">{imageName} - {t("admin.tools.contour.clickReplace")}</p>
            </div>
          ) : (
            <>
              <svg className="h-12 w-12 text-[#ccc]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <p className="mt-3 text-sm font-medium text-[#666]">{t("admin.tools.contour.dropzone")}</p>
              <p className="mt-1 text-xs text-[#999]">{t("admin.tools.contour.dropzoneFormats")}</p>
            </>
          )}
        </div>

        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[3px] border border-[#e0e0e0] bg-[#fafafa] p-4">
          {processing ? (
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#e0e0e0] border-t-black" />
              <p className="mt-3 text-sm text-[#666]">{progress || "Processing..."}</p>
            </div>
          ) : contourResult ? (
            <div className="relative w-full">
              <svg
                viewBox={`0 0 ${contourResult.imageWidth} ${contourResult.imageHeight}`}
                className="mx-auto max-h-[280px] w-auto"
                style={{ background: "repeating-conic-gradient(#e0e0e0 0% 25%, transparent 0% 50%) 50% / 16px 16px" }}
              >
                <image
                  href={contourResult.processedImageUrl || imageUrl}
                  width={contourResult.imageWidth}
                  height={contourResult.imageHeight}
                />
                {contourResult.bleedPath ? (
                  <path d={contourResult.bleedPath} fill="none" stroke="red" strokeWidth="2" strokeDasharray="6,4" opacity="0.4" />
                ) : null}
                {contourResult.cutPath ? (
                  <path d={contourResult.cutPath} fill="none" stroke="red" strokeWidth="2" />
                ) : null}
              </svg>
              <div className="mt-2 flex items-center justify-center gap-3 text-[10px] text-[#999]">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-0.5 w-4 bg-red-500" /> {t("admin.tools.contour.cutLine")}
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-0.5 w-4 border-t-2 border-dashed border-red-400" /> {t("admin.tools.contour.bleedLine")}
                </span>
                <span>
                  {contourResult.imageWidth}x{contourResult.imageHeight}px
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[#999]">{t("admin.tools.contour.dropzoneEmpty")}</p>
          )}
        </div>
      </div>

      {contourResult ? (
        <>
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-[#666]">{t("admin.tools.contour.bleedLabel")}</label>
            <input
              type="range"
              min="0"
              max="6"
              step="0.5"
              value={bleedMm}
              onChange={(e) => handleBleedChange(parseFloat(e.target.value))}
              className="max-w-xs flex-1"
            />
            <span className="w-12 text-sm font-semibold tabular-nums text-black">{bleedMm}mm</span>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium text-[#666]">{t("admin.tools.notesLabel")}</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("admin.tools.notesProdPlaceholder")}
              className="w-full resize-none rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={handleDownloadSvg}
              className="inline-flex items-center justify-center gap-2 rounded-[3px] border border-[#e0e0e0] bg-white px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:border-black"
            >
              {t("admin.tools.downloadSvg")}
            </button>
            {contourResult.processedImageUrl ? (
              <button
                type="button"
                onClick={handleDownloadPng}
                className="inline-flex items-center justify-center gap-2 rounded-[3px] border border-[#e0e0e0] bg-white px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:border-black"
              >
                {t("admin.tools.downloadPng")}
              </button>
            ) : null}
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
        </>
      ) : null}

      {/* ── Recent Jobs ──────────────────────────────────────────────── */}
      <div className="rounded-[3px] border border-[#e0e0e0] bg-white">
        <div className="border-b border-[#e0e0e0] px-5 py-3">
          <h2 className="text-sm font-bold text-black">{t("admin.tools.contour.recentTitle")}</h2>
          <p className="mt-0.5 text-[10px] text-[#999]">{t("admin.tools.contour.recentSubtitle")}</p>
        </div>
        {loadingJobs ? (
          <div className="px-5 py-8 text-center text-sm text-[#999]">{t("admin.tools.loading")}</div>
        ) : jobs.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-[#999]">{t("admin.tools.contour.noJobs")}</div>
        ) : (
          <div className="divide-y divide-[#e0e0e0]">
            {jobs.map((job) => (
              <ContourJobRow
                key={job.id}
                job={job}
                t={t}
                onPreview={setPreviewUrl}
                onDetail={setDetailJob}
                onReopen={handleReopen}
                reopening={reopening}
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
            <img src={previewUrl} alt="Contour preview" className="max-h-[85vh] max-w-[85vw] rounded-[3px] shadow-2xl" />
          </div>
        </div>
      ) : null}

      {/* ── Detail Modal ─────────────────────────────────────────── */}
      {detailJob ? (
        <ContourDetailModal
          job={detailJob}
          t={t}
          onClose={() => setDetailJob(null)}
          onReopen={handleReopen}
          reopening={reopening}
        />
      ) : null}
    </div>
  );
}

// ─── Contour Job Row ──────────────────────────────────────────────────────────

function ContourJobRow({ job, t, onPreview, onDetail, onReopen, reopening }) {
  const data = job.inputData || {};
  const output = job.outputData || {};
  const thumbUrl = output.processedFileUrl || job.inputFileUrl;
  const dims = data.imageWidth && data.imageHeight ? `${data.imageWidth}×${data.imageHeight}px` : null;

  return (
    <div className="flex flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Thumbnail */}
      <button type="button" onClick={() => onDetail(job)} className="h-12 w-12 shrink-0 overflow-hidden rounded-[3px] border border-[#e0e0e0] bg-[#fafafa] transition-opacity hover:opacity-80">
        {thumbUrl ? (
          <img src={thumbUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-[#ccc]">—</div>
        )}
      </button>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-black truncate">{data.fileName || "artwork"}</span>
          {data.bleedMm != null && (
            <span className="rounded-[2px] bg-[#f0f0f0] px-1.5 py-0.5 text-[10px] font-medium text-[#666]">{data.bleedMm}mm bleed</span>
          )}
          {dims && (
            <span className="rounded-[2px] bg-[#f0f0f0] px-1.5 py-0.5 text-[10px] font-medium text-[#666]">{dims}</span>
          )}
          {output.bgRemoved && (
            <span className="rounded-[2px] bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-700">BG removed</span>
          )}
          <span className={`rounded-[2px] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            job.status === "completed" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
          }`}>
            {job.status}
          </span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-[#999]">
          <span>{timeAgo(job.createdAt)}</span>
          {job.operatorName && <><span>·</span><span>{job.operatorName}</span></>}
          {job.orderId && <><span>·</span><span>Order: #{job.orderId.slice(0, 8)}</span></>}
        </div>
        {job.notes && <p className="mt-0.5 truncate text-xs text-[#777]">{job.notes}</p>}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
        {output.processedFileUrl && (
          <button
            type="button"
            onClick={() => onPreview(output.processedFileUrl)}
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
          {t("admin.tools.contour.detail")}
        </button>
        <button
          type="button"
          onClick={() => onReopen(job)}
          disabled={reopening}
          className="rounded-[3px] border border-[#e0e0e0] px-3 py-1.5 text-xs font-medium text-[#666] transition-colors hover:border-black hover:text-black disabled:opacity-50"
        >
          {t("admin.tools.reopen")}
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

// ─── Contour Detail Modal ─────────────────────────────────────────────────────

function ContourDetailModal({ job, t, onClose, onReopen, reopening }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="mx-4 w-full max-w-2xl rounded-[3px] bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#e0e0e0] px-5 py-4">
          <h3 className="text-sm font-bold text-black">{t("admin.tools.contour.detailTitle")}</h3>
          <button type="button" onClick={onClose} className="text-[#999] hover:text-black">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-5 space-y-4">
          {/* Images side by side */}
          <div className="grid gap-3 sm:grid-cols-2">
            {job.inputFileUrl ? (
              <div>
                <p className="mb-1 text-[11px] font-medium text-[#666]">{t("admin.tools.contour.sourceImage")}</p>
                <img src={job.inputFileUrl} alt="Source" className="w-full rounded-[3px] border border-[#e0e0e0] bg-[#fafafa] object-contain" style={{ maxHeight: 240 }} />
              </div>
            ) : null}
            {job.outputData?.processedFileUrl ? (
              <div>
                <p className="mb-1 text-[11px] font-medium text-[#666]">{t("admin.tools.contour.processedOutput")}</p>
                <img src={job.outputData.processedFileUrl} alt="Processed" className="w-full rounded-[3px] border border-[#e0e0e0] bg-[#fafafa] object-contain" style={{ maxHeight: 240 }} />
              </div>
            ) : null}
          </div>
          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <MetaCell label={t("admin.tools.contour.fileName")} value={job.inputData?.fileName || "—"} />
            <MetaCell label={t("admin.tools.contour.bleedLine")} value={`${job.inputData?.bleedMm ?? "—"}mm`} />
            <MetaCell label={t("admin.tools.contour.imageSize")} value={`${job.inputData?.imageWidth || "—"} × ${job.inputData?.imageHeight || "—"}px`} />
            <MetaCell label={t("admin.tools.contour.operator")} value={job.operatorName || "—"} />
            <MetaCell label={t("admin.tools.contour.created")} value={formatJobTime(job.createdAt)} />
            {job.outputData?.bgRemoved && (
              <MetaCell label={t("admin.tools.contour.bgRemoved")} value="Yes" />
            )}
            {job.orderId ? (
              <MetaCell label={t("admin.tools.contour.order")} value={
                <Link href={`/admin/orders/${job.orderId}`} className="text-[#4f46e5] hover:underline">
                  #{job.orderId.slice(-8)}
                </Link>
              } />
            ) : null}
          </div>
          {job.notes ? (
            <div>
              <p className="text-[11px] font-medium text-[#666]">{t("admin.tools.notesLabel")}</p>
              <p className="text-sm text-[#111]">{job.notes}</p>
            </div>
          ) : null}
          {/* Actions */}
          <div className="flex flex-wrap gap-2 border-t border-[#e0e0e0] pt-4">
            <button
              type="button"
              onClick={() => onReopen(job)}
              disabled={reopening}
              className="rounded-[3px] bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-[#222] disabled:opacity-50"
            >
              {reopening ? t("admin.tools.contour.loadingReopen") : t("admin.tools.contour.reopenEdit")}
            </button>
            {job.outputData?.svgFileUrl ? (
              <a href={job.outputData.svgFileUrl} download className="rounded-[3px] border border-[#e0e0e0] px-4 py-2 text-xs font-medium text-[#666] hover:border-black hover:text-black">
                {t("admin.tools.downloadSvg")}
              </a>
            ) : null}
            {job.outputData?.processedFileUrl ? (
              <a href={job.outputData.processedFileUrl} download className="rounded-[3px] border border-[#e0e0e0] px-4 py-2 text-xs font-medium text-[#666] hover:border-black hover:text-black">
                {t("admin.tools.downloadPng")}
              </a>
            ) : null}
            {job.inputFileUrl ? (
              <a href={job.inputFileUrl} download className="rounded-[3px] border border-[#e0e0e0] px-4 py-2 text-xs font-medium text-[#666] hover:border-black hover:text-black">
                {t("admin.tools.contour.downloadSource")}
              </a>
            ) : null}
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
