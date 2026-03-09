"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { uploadDesignSnapshot } from "@/lib/design-studio/upload-snapshot";

function formatJobTime(dateString) {
  const date = new Date(dateString);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

async function blobFromUrl(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch generated file");
  return res.blob();
}

// Status: idle → processing → ready / failed
const STATUS_STYLES = {
  idle: "bg-gray-100 text-gray-600",
  processing: "bg-yellow-100 text-yellow-700",
  ready: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};
const STATUS_LABELS = {
  idle: "Idle — upload artwork to start",
  processing: "Processing...",
  ready: "Ready — contour generated",
  failed: "Failed — see error below",
};

export default function ContourToolPage() {
  return (
    <Suspense fallback={<div className="flex h-48 items-center justify-center text-sm text-[#999]">Loading...</div>}>
      <ContourToolContent />
    </Suspense>
  );
}

function ContourToolContent() {
  const searchParams = useSearchParams();
  const [imageUrl, setImageUrl] = useState(null);
  const [imageName, setImageName] = useState("");
  const [sourceFile, setSourceFile] = useState(null);
  const [contourResult, setContourResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [bleedMm, setBleedMm] = useState(3);
  const [orderId, setOrderId] = useState(searchParams.get("orderId") || "");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [applyingToOrder, setApplyingToOrder] = useState(false);
  const [applyMsg, setApplyMsg] = useState("");
  const [errorDetail, setErrorDetail] = useState("");
  const fileInputRef = useRef(null);

  // --- Item selector state ---
  const [orderItems, setOrderItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [fetchingOrder, setFetchingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");

  // Derived status
  const status = processing ? "processing" : errorDetail ? "failed" : contourResult ? "ready" : "idle";

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

  // --- Fetch order items when orderId changes ---
  useEffect(() => {
    if (!orderId || orderId.length < 6) {
      setOrderItems([]);
      setSelectedItemId("");
      setOrderError("");
      return;
    }
    const timer = setTimeout(async () => {
      setFetchingOrder(true);
      setOrderError("");
      try {
        const res = await fetch(`/api/admin/orders/${orderId}`);
        if (!res.ok) {
          setOrderError("Order not found");
          setOrderItems([]);
          setSelectedItemId("");
          return;
        }
        const data = await res.json();
        const items = data.items || [];
        setOrderItems(items);
        if (items.length === 0) {
          setOrderError("Order has no items");
          setSelectedItemId("");
          return;
        }
        // Auto-select: prefer sticker/label/decal item, else first
        const stickerItem = items.find((it) => {
          const n = (it.productName || "").toLowerCase();
          return n.includes("sticker") || n.includes("label") || n.includes("decal") || n.includes("die-cut") || n.includes("kiss-cut");
        });
        setSelectedItemId((stickerItem || items[0]).id);
      } catch {
        setOrderError("Failed to fetch order");
        setOrderItems([]);
        setSelectedItemId("");
      } finally {
        setFetchingOrder(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [orderId]);

  // Auto-load artwork from selected order item
  useEffect(() => {
    if (!selectedItemId || !orderItems.length) return;
    const item = orderItems.find((it) => it.id === selectedItemId);
    if (!item) return;
    const meta = item.meta && typeof item.meta === "object" ? item.meta : {};
    const artUrl = meta.artworkUrl || meta.fileUrl || item.fileUrl;
    if (!artUrl || artUrl === imageUrl) return;
    // Load the artwork into the tool and auto-process
    setImageUrl(artUrl);
    setImageName(meta.fileName || item.productName || "artwork");
    setSourceFile(null);
    setContourResult(null);
    setErrorDetail("");
    processContour(artUrl);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItemId]);

  function resetPreviewState(objectUrl, fileName, file) {
    setImageName(fileName);
    setSourceFile(file);
    setImageUrl(objectUrl);
    setContourResult(null);
    setErrorDetail("");
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
    setErrorDetail("");

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
      const msg = err instanceof Error ? err.message : "Failed to trace contour";
      setProgress("");
      setErrorDetail(msg);
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

      setSaveMsg("Saved to records");
      fetchJobs();
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (err) {
      setSaveMsg(`Error: ${err instanceof Error ? err.message : "Failed to save"}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleApplyToOrder() {
    if (!orderId || !selectedItemId) return;
    const targetItem = orderItems.find((it) => it.id === selectedItemId);
    if (!targetItem) return;

    setApplyingToOrder(true);
    setApplyMsg("");
    try {
      // Build contour SVG and upload
      const svgBlob = await buildSvgBlob();
      if (!svgBlob) throw new Error("Failed to build SVG");
      const uploaded = await uploadDesignSnapshot(svgBlob, `contour-${Date.now()}.svg`);

      // Merge contour data into item meta
      const metaPatch = {
        contourSvg: uploaded.url,
        contourSvgKey: uploaded.key,
        bleedMm,
        contourAppliedAt: new Date().toISOString(),
      };
      if (contourResult.processedImageUrl) {
        const processedBlob = await blobFromUrl(contourResult.processedImageUrl);
        const processedAsset = await uploadDesignSnapshot(processedBlob, `processed-${Date.now()}.png`);
        metaPatch.processedImageUrl = processedAsset.url;
        metaPatch.processedImageKey = processedAsset.key;
      }

      const patchRes = await fetch(`/api/admin/orders/${orderId}/items`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: targetItem.id, meta: metaPatch }),
      });
      if (!patchRes.ok) {
        const err = await patchRes.json().catch(() => null);
        throw new Error(err?.error || "Failed to update item");
      }

      setApplyMsg(`Applied to "${targetItem.productName}"`);
      setTimeout(() => setApplyMsg(""), 5000);
    } catch (err) {
      setApplyMsg(`Error: ${err instanceof Error ? err.message : "Failed"}`);
    } finally {
      setApplyingToOrder(false);
    }
  }

  // --- Reuse a previous job ---
  function handleReuseJob(job) {
    // Load input image from the saved job URL
    if (job.inputFileUrl) {
      setImageUrl(job.inputFileUrl);
      setImageName(job.inputData?.fileName || "artwork");
      setSourceFile(null); // Can't reconstruct File from URL; save will re-upload from URL if needed
      setContourResult(null);
      setErrorDetail("");
    }
    if (job.inputData?.bleedMm != null) {
      setBleedMm(job.inputData.bleedMm);
    }
    if (job.orderId) {
      setOrderId(job.orderId);
    }
    if (job.notes) {
      setNotes(job.notes);
    }
    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function onDrop(event) {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  }

  const selectedItem = orderItems.find((it) => it.id === selectedItemId);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header + Status */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-black">Contour Tool</h1>
          <p className="mt-1 text-sm text-[#666]">
            Generate, save, and download production contour files for stickers, labels, and die-cuts.
          </p>
        </div>
        <div className={`inline-flex items-center gap-2 rounded-[3px] px-3 py-1.5 text-xs font-bold ${STATUS_STYLES[status]}`}>
          <span className={`inline-block h-2 w-2 rounded-full ${status === "processing" ? "animate-pulse bg-yellow-500" : status === "ready" ? "bg-green-500" : status === "failed" ? "bg-red-500" : "bg-gray-400"}`} />
          {STATUS_LABELS[status]}
        </div>
      </div>

      {/* Config row: Order + Item selector */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-[11px] font-medium text-[#666]">Order # (optional)</label>
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Paste order ID to link"
            className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
          />
          {fetchingOrder && <p className="mt-0.5 text-[10px] text-[#999]">Loading order...</p>}
          {orderError && <p className="mt-0.5 text-[10px] text-red-600">{orderError}</p>}
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-[#666]">
            Target Item {orderItems.length > 0 && <span className="text-[#999]">({orderItems.length} items)</span>}
          </label>
          {orderItems.length > 0 ? (
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
            >
              {orderItems.map((item) => {
                const n = (item.productName || "").toLowerCase();
                const isRecommended = n.includes("sticker") || n.includes("label") || n.includes("decal") || n.includes("die-cut") || n.includes("kiss-cut");
                return (
                  <option key={item.id} value={item.id}>
                    {item.productName} ({item.quantity}x){isRecommended ? " — recommended" : ""}
                  </option>
                );
              })}
            </select>
          ) : (
            <div className="rounded-[3px] border border-dashed border-[#d0d0d0] px-3 py-2 text-sm text-[#999]">
              {orderId ? "Enter a valid order ID" : "Enter order # to select item"}
            </div>
          )}
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-[#666]">Bleed Offset</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="6"
              step="0.5"
              value={bleedMm}
              onChange={(e) => handleBleedChange(parseFloat(e.target.value))}
              className="flex-1"
            />
            <span className="w-14 text-right text-sm font-semibold tabular-nums text-black">{bleedMm}mm</span>
          </div>
        </div>
      </div>

      {/* Upload + Result panels */}
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
              <p className="mt-2 text-center text-xs text-[#999]">{imageName} — click to replace</p>
            </div>
          ) : (
            <>
              <svg className="h-12 w-12 text-[#ccc]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <p className="mt-3 text-sm font-medium text-[#666]">Drop artwork here or click to upload</p>
              <p className="mt-1 text-xs text-[#999]">PNG, JPG, SVG supported</p>
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
                  <span className="inline-block h-0.5 w-4 bg-red-500" /> Cut line
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-0.5 w-4 border-t-2 border-dashed border-red-400" /> Bleed
                </span>
                <span>
                  {contourResult.imageWidth}x{contourResult.imageHeight}px
                </span>
              </div>
            </div>
          ) : errorDetail ? (
            <div className="text-center">
              <p className="text-sm font-medium text-red-600">Contour generation failed</p>
              <p className="mt-1 text-xs text-red-500">{errorDetail}</p>
              <button
                type="button"
                onClick={() => imageUrl && processContour(imageUrl)}
                className="mt-3 rounded-[3px] border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm text-[#999]">Upload an image to generate contour</p>
              <p className="mt-1 text-xs text-[#bbb]">Or click &quot;Reuse&quot; on a recent job below</p>
            </div>
          )}
        </div>
      </div>

      {/* Notes + Actions — only shown when we have a result */}
      {contourResult ? (
        <>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-[#666]">Production Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Customer name, special bleed requirements, manual adjustments needed..."
              className="w-full resize-none rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={handleDownloadSvg}
              className="inline-flex items-center justify-center gap-2 rounded-[3px] border border-[#e0e0e0] bg-white px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:border-black"
            >
              Download SVG
            </button>
            {contourResult.processedImageUrl ? (
              <button
                type="button"
                onClick={handleDownloadPng}
                className="inline-flex items-center justify-center gap-2 rounded-[3px] border border-[#e0e0e0] bg-white px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:border-black"
              >
                Download PNG
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !sourceFile}
              className="inline-flex items-center justify-center gap-2 rounded-[3px] bg-black px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#222] disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save to Records"}
            </button>
            {orderId && selectedItemId && selectedItem && (
              <button
                type="button"
                onClick={handleApplyToOrder}
                disabled={applyingToOrder}
                className="inline-flex items-center justify-center gap-2 rounded-[3px] border-2 border-blue-600 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-50"
                title={`Will write contour data to: ${selectedItem.productName}`}
              >
                {applyingToOrder
                  ? "Applying..."
                  : `Apply to: ${selectedItem.productName.length > 25 ? selectedItem.productName.slice(0, 25) + "..." : selectedItem.productName}`}
              </button>
            )}
            {saveMsg ? (
              <span className={`text-xs font-medium ${saveMsg.startsWith("Error") ? "text-red-600" : "text-green-600"}`}>
                {saveMsg}
              </span>
            ) : null}
            {applyMsg ? (
              <span className={`text-xs font-medium ${applyMsg.startsWith("Error") ? "text-red-600" : "text-blue-600"}`}>
                {applyMsg}
              </span>
            ) : null}
          </div>
        </>
      ) : null}

      {/* Recent Contour Jobs */}
      <div className="rounded-[3px] border border-[#e0e0e0] bg-white">
        <div className="border-b border-[#e0e0e0] px-5 py-3">
          <h2 className="text-sm font-bold text-black">Recent Contour Jobs</h2>
          <p className="mt-0.5 text-[10px] text-[#999]">Click &quot;Reuse&quot; to load a previous job back into the tool.</p>
        </div>
        {loadingJobs ? (
          <div className="px-5 py-8 text-center text-sm text-[#999]">Loading...</div>
        ) : jobs.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-[#999]">No contour jobs yet</p>
            <p className="mt-1 text-xs text-[#bbb]">Upload artwork above and save your first contour to start building your job history.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#e0e0e0]">
            {jobs.map((job) => (
              <div key={job.id} className="flex flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-black">
                    {job.inputData?.fileName || "artwork"} {job.operatorName ? `· ${job.operatorName}` : ""}
                  </p>
                  <p className="text-xs text-[#999]">
                    {formatJobTime(job.createdAt)}
                    {job.inputData?.bleedMm != null ? <span> · Bleed: {job.inputData.bleedMm}mm</span> : null}
                    {job.orderId ? <span> · Order: {job.orderId.slice(0, 8)}...</span> : null}
                  </p>
                  {job.notes ? <p className="mt-0.5 truncate text-xs text-[#777]">{job.notes}</p> : null}
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <button
                    type="button"
                    onClick={() => handleReuseJob(job)}
                    className="rounded-[3px] border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
                  >
                    Reuse
                  </button>
                  {job.inputFileUrl ? (
                    <a
                      href={job.inputFileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-[3px] border border-[#e0e0e0] px-3 py-1.5 text-xs font-medium text-[#666] transition-colors hover:border-black hover:text-black"
                    >
                      Input
                    </a>
                  ) : null}
                  {job.outputData?.processedFileUrl ? (
                    <button
                      type="button"
                      onClick={() => setPreviewUrl(job.outputData.processedFileUrl)}
                      className="rounded-[3px] border border-[#e0e0e0] px-3 py-1.5 text-xs font-medium text-[#666] transition-colors hover:border-black hover:text-black"
                    >
                      Preview
                    </button>
                  ) : null}
                  {job.outputData?.svgFileUrl ? (
                    <a
                      href={job.outputData.svgFileUrl}
                      download
                      className="rounded-[3px] border border-[#e0e0e0] px-3 py-1.5 text-xs font-medium text-[#666] transition-colors hover:border-black hover:text-black"
                    >
                      SVG
                    </a>
                  ) : null}
                  {job.outputData?.processedFileUrl ? (
                    <a
                      href={job.outputData.processedFileUrl}
                      download
                      className="rounded-[3px] border border-[#e0e0e0] px-3 py-1.5 text-xs font-medium text-[#666] transition-colors hover:border-black hover:text-black"
                    >
                      PNG
                    </a>
                  ) : null}
                  {job.orderId ? (
                    <Link
                      href={`/admin/orders/${job.orderId}`}
                      className="rounded-[3px] border border-[#e0e0e0] px-3 py-1.5 text-xs font-medium text-[#666] transition-colors hover:border-black hover:text-black"
                    >
                      View Order
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

      {/* Preview Modal */}
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
    </div>
  );
}
