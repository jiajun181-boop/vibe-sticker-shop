"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { uploadDesignSnapshot } from "@/lib/design-studio/upload-snapshot";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { timeAgo } from "@/lib/admin/time-ago";
import StatusBadge from "@/components/admin/StatusBadge";

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

/** Detect touch-only mobile device (no hover). */
function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    setMobile(
      typeof window !== "undefined" &&
      ("ontouchstart" in window || navigator.maxTouchPoints > 0) &&
      window.innerWidth < 768
    );
  }, []);
  return mobile;
}

/** Same-day comparison for Today/Earlier grouping. */
function isToday(dateString) {
  const d = new Date(dateString);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

/** Build a descriptive download filename from the artwork name. */
function buildContourFileName(imageName, suffix, ext) {
  const base = (imageName || "artwork")
    .replace(/\.[^.]+$/, "")         // strip extension
    .replace(/[^a-zA-Z0-9_-]/g, "-") // sanitize
    .replace(/-+/g, "-")             // collapse dashes
    .slice(0, 30);                   // max length
  return `${base}-${suffix}.${ext}`;
}

export default function ContourToolPageWrapper() {
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center text-sm text-[#999]">Loading…</div>}>
      <ContourToolPage />
    </Suspense>
  );
}

function ContourToolPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const [imageUrl, setImageUrl] = useState(null);
  const [imageName, setImageName] = useState("");
  const [sourceFile, setSourceFile] = useState(null);
  const [contourResult, setContourResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [progressHuman, setProgressHuman] = useState("");
  const [bleedMm, setBleedMm] = useState(3);
  const [orderId, setOrderId] = useState(() => searchParams.get("orderId") || "");
  const [itemId] = useState(() => searchParams.get("itemId") || "");
  const [itemContext, setItemContext] = useState(null); // { productName, quantity }
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [saveIsError, setSaveIsError] = useState(false);
  const [savedOrderId, setSavedOrderId] = useState(null); // post-save guidance
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [detailJob, setDetailJob] = useState(null);
  const [reopening, setReopening] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [previewMode, setPreviewMode] = useState("contour"); // "contour" | "mask" | "source"
  const [taskSource, setTaskSource] = useState(null); // "new" | "reopened" | "duplicated"
  const fileInputRef = useRef(null);
  const prevObjectUrlRef = useRef(null);
  const processingRef = useRef(false);

  const hasEditorContent = !!(imageUrl || contourResult);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/tools/jobs?toolType=contour&limit=10");
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (err) {
      console.error("[Contour] Failed to fetch jobs:", err);
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Unsaved-changes browser guard
  useEffect(() => {
    if (!hasEditorContent) return;
    function onBeforeUnload(e) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasEditorContent]);

  // Keyboard shortcuts: Ctrl+S save, Ctrl+D download SVG
  useEffect(() => {
    function onKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (contourResult && !saving) handleSave("completed");
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        if (contourResult) handleDownloadSvg();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contourResult, saving]);

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
      } catch (err) { console.error("[Contour] Failed to load item context:", err); }
    })();
    return () => { cancelled = true; };
  }, [orderId, itemId]);

  // Cleanup blob URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (prevObjectUrlRef.current) URL.revokeObjectURL(prevObjectUrlRef.current);
      if (contourResult?.processedImageUrl) URL.revokeObjectURL(contourResult.processedImageUrl);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetPreviewState(objectUrl, fileName, file) {
    // Revoke previous ObjectURLs to free memory (critical on mobile)
    if (prevObjectUrlRef.current) {
      URL.revokeObjectURL(prevObjectUrlRef.current);
    }
    if (contourResult?.processedImageUrl) {
      URL.revokeObjectURL(contourResult.processedImageUrl);
    }
    prevObjectUrlRef.current = objectUrl;
    setImageName(fileName);
    setSourceFile(file);
    setImageUrl(objectUrl);
    setContourResult(null);
    setErrorMsg("");
  }

  function handleFile(file) {
    if (!file || !file.type.startsWith("image/")) {
      setErrorMsg(t("admin.tools.contour.errorNotImage"));
      return;
    }
    // Guard: reject files > 25MB (mobile devices can OOM on large images)
    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg(t("admin.tools.contour.errorTooLarge"));
      return;
    }
    setErrorMsg("");
    setTaskSource("new");
    const objectUrl = URL.createObjectURL(file);
    resetPreviewState(objectUrl, file.name, file);
    processContour(objectUrl);
  }

  // Human-readable progress labels
  const PROGRESS_LABELS = {
    loading: "admin.tools.contour.progressLoading",
    analyzing: "admin.tools.contour.progressAnalyzing",
    "removing-bg": "admin.tools.contour.progressBgRemoval",
    tracing: "admin.tools.contour.progressTracing",
    done: "admin.tools.contour.progressDone",
  };

  async function processContour(url) {
    // Guard: skip if another processContour is already running
    if (processingRef.current) return;
    processingRef.current = true;
    setProcessing(true);
    setProgress("");
    setProgressHuman(t("admin.tools.contour.progressLoading"));

    try {
      await new Promise((resolve) => requestAnimationFrame(() => resolve()));
      const { generateContour } = await import("@/lib/contour/generate-contour");
      setProgressHuman(t("admin.tools.contour.progressTracing"));
      const result = await generateContour(url, {
        bleedMm,
        // On mobile, skip background removal (too memory-intensive)
        skipBgRemoval: isMobile,
        // Bias toward the fast foreground-mask path in admin so common JPG uploads do not lock the tab.
        preferFastMode: true,
        maxProcessingDim: isMobile ? 320 : 384,
        onProgress: (stage) => {
          setProgress(stage);
          const key = PROGRESS_LABELS[stage];
          if (key) setProgressHuman(t(key));
        },
      });
      setContourResult(result);
      setProgress("");
      setProgressHuman("");
    } catch (err) {
      console.error("Contour error:", err);
      const msg = err instanceof Error ? err.message : t("admin.tools.contour.errorTrace");
      setErrorMsg(msg);
      setProgressHuman("");
    } finally {
      setProcessing(false);
      processingRef.current = false;
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
      setErrorMsg(t("admin.tools.contour.errorBleedRegen"));
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
    anchor.download = buildContourFileName(imageName, `contour-${bleedMm}mm`, "svg");
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleDownloadPng() {
    if (!contourResult?.processedImageUrl) return;
    const blob = await blobFromUrl(contourResult.processedImageUrl);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = buildContourFileName(imageName, "preview", "png");
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleDownloadMask() {
    if (!contourResult?.maskOverlayUrl) return;
    const blob = await blobFromUrl(contourResult.maskOverlayUrl);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = buildContourFileName(imageName, "mask", "png");
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleDownloadSource() {
    if (!sourceFile) return;
    const url = URL.createObjectURL(sourceFile);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = imageName || "source.png";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleSave(saveStatus) {
    if (!contourResult || !sourceFile) return;

    setSaving(true);
    setSaveMsg("");

    try {
      const [uploadedInput, svgBlob] = await Promise.all([
        uploadDesignSnapshot(sourceFile, sourceFile.name),
        buildSvgBlob(),
      ]);
      if (!svgBlob) throw new Error(t("admin.tools.contour.errorBuildSvg"));

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
            ...(itemId ? { itemId } : {}),
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
            contourConfidence: contourResult.quality?.confidence || null,
            contourShapeType: contourResult.quality?.shapeType || null,
            contourWarnings: contourResult.quality?.warnings || [],
            contourSuggestion: contourResult.quality?.suggestion || null,
            areaCoverage: contourResult.quality?.areaCoverage || null,
            rectangularity: contourResult.quality?.rectangularity || null,
            pointCount: contourResult.quality?.pointCount || null,
            contourBounds: contourResult.quality?.contourBounds || null,
            imageBounds: contourResult.quality?.imageBounds || null,
            // M6.1b: extraction metadata
            extractionMode: contourResult.extractionMode || null,
            maskCoverage: contourResult.extractionMeta?.maskCoverage || null,
            componentCount: contourResult.extractionMeta?.componentCount || null,
            selectedComponentArea: contourResult.extractionMeta?.selectedComponentArea || null,
            backgroundUniformity: contourResult.extractionMeta?.bgUniformity || null,
          },
          notes: notes || null,
          orderId: orderId || null,
          status: saveStatus,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || t("admin.tools.contour.errorSave"));
      }

      setSaveMsg(saveStatus === "completed" ? t("admin.tools.savedMsg") : t("admin.tools.contour.savedForReview"));
      setSaveIsError(false);
      if (orderId) setSavedOrderId(orderId);
      fetchJobs();
      if (!orderId) setTimeout(() => setSaveMsg(""), 3000);
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : t("admin.common.saveFailed"));
      setSaveIsError(true);
    } finally {
      setSaving(false);
    }
  }

  async function handleReopen(job) {
    // Unsaved-changes guard on reopen
    if (hasEditorContent && !window.confirm(t("admin.tools.contour.confirmDiscard"))) return;

    const data = job.inputData || {};
    setBleedMm(data.bleedMm ?? 3);
    setOrderId(job.orderId || "");
    setNotes(job.notes || "");
    setDetailJob(null);
    setTaskSource("reopened");

    if (job.inputFileUrl) {
      setReopening(true);
      try {
        const res = await fetch(job.inputFileUrl);
        if (!res.ok) {
          setErrorMsg(t("admin.tools.contour.errorReopenFetch"));
          setReopening(false);
          return;
        }
        const blob = await res.blob();
        if (!blob.type.startsWith("image/") && blob.size < 100) {
          setErrorMsg(t("admin.tools.contour.errorReopenFetch"));
          setReopening(false);
          return;
        }
        const file = new File([blob], data.fileName || "artwork.png", { type: blob.type || "image/png" });
        const objectUrl = URL.createObjectURL(blob);
        resetPreviewState(objectUrl, data.fileName || "artwork.png", file);
        processContour(objectUrl);
      } catch (err) {
        console.error("Failed to reopen contour job:", err);
        setErrorMsg(t("admin.tools.contour.errorReopenFetch"));
      } finally {
        setReopening(false);
      }
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDuplicate(job) {
    // Like reopen but clears orderId — for walk-in reuse
    if (hasEditorContent && !window.confirm(t("admin.tools.contour.confirmDiscard"))) return;

    const data = job.inputData || {};
    setBleedMm(data.bleedMm ?? 3);
    setOrderId("");
    setNotes("");
    setDetailJob(null);
    setTaskSource("duplicated");

    if (job.inputFileUrl) {
      setReopening(true);
      try {
        const res = await fetch(job.inputFileUrl);
        if (!res.ok) {
          setErrorMsg(t("admin.tools.contour.errorReopenFetch"));
          setReopening(false);
          return;
        }
        const blob = await res.blob();
        if (!blob.type.startsWith("image/") && blob.size < 100) {
          setErrorMsg(t("admin.tools.contour.errorReopenFetch"));
          setReopening(false);
          return;
        }
        const file = new File([blob], data.fileName || "artwork.png", { type: blob.type || "image/png" });
        const objectUrl = URL.createObjectURL(blob);
        resetPreviewState(objectUrl, data.fileName || "artwork.png", file);
        processContour(objectUrl);
      } catch (err) {
        console.error("Failed to duplicate contour job:", err);
        setErrorMsg(t("admin.tools.contour.errorReopenFetch"));
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

  // Split jobs into Today / Earlier groups
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
        <span className="text-[#111] font-medium">{t("admin.tools.contour.title")}</span>
      </div>

      {/* Page header — what / input / output / next step */}
      <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5">
        <h1 className="text-xl font-bold text-black">{t("admin.tools.contour.title")}</h1>
        <p className="mt-1 text-sm text-[#666]">{t("admin.tools.contour.subtitle")}</p>
        <div className="mt-3 grid gap-3 text-xs sm:grid-cols-4">
          <div>
            <p className="font-semibold text-[#111]">{t("admin.tools.meta.whatItDoes")}</p>
            <p className="mt-0.5 text-[#666]">{t("admin.tools.contour.metaWhat")}</p>
          </div>
          <div>
            <p className="font-semibold text-[#111]">{t("admin.tools.meta.input")}</p>
            <p className="mt-0.5 text-[#666]">{t("admin.tools.contour.metaInput")}</p>
          </div>
          <div>
            <p className="font-semibold text-[#111]">{t("admin.tools.meta.output")}</p>
            <p className="mt-0.5 text-[#666]">{t("admin.tools.contour.metaOutput")}</p>
          </div>
          <div>
            <p className="font-semibold text-[#111]">{t("admin.tools.meta.nextStep")}</p>
            <p className="mt-0.5 text-[#666]">{t("admin.tools.contour.metaNext")}</p>
          </div>
        </div>
      </div>

      {/* Mobile degradation notice */}
      {isMobile && (
        <div className="rounded-[3px] border border-amber-300 bg-amber-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
            </svg>
            <div>
              <p className="text-xs font-semibold text-amber-800">{t("admin.tools.contour.mobileWarningTitle")}</p>
              <p className="mt-0.5 text-xs text-amber-700">{t("admin.tools.contour.mobileWarningBody")}</p>
            </div>
          </div>
          <div className="mt-2.5 ml-7 grid grid-cols-2 gap-2 text-[10px]">
            <div className="rounded-[2px] bg-green-100 px-2 py-1.5">
              <p className="font-semibold text-green-800">{t("admin.tools.contour.mobileCanDo")}</p>
              <p className="mt-0.5 text-green-700">{t("admin.tools.contour.mobileCanDoList")}</p>
            </div>
            <div className="rounded-[2px] bg-red-100 px-2 py-1.5">
              <p className="font-semibold text-red-800">{t("admin.tools.contour.mobileCannotDo")}</p>
              <p className="mt-0.5 text-red-700">{t("admin.tools.contour.mobileCannotDoList")}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Current Task Context Bar ──────────────────────────────── */}
      {hasEditorContent && (
        <div className="flex items-center justify-between gap-3 rounded-[3px] border border-[#e0e0e0] bg-[#fafafa] px-4 py-2.5">
          <div className="flex items-center gap-2 min-w-0 text-xs">
            {/* Order context */}
            {orderId ? (
              <span className="rounded-[2px] bg-indigo-100 px-2 py-0.5 font-semibold text-indigo-700">
                {t("admin.tools.contour.order")} #{orderId.slice(0, 8)}
              </span>
            ) : (
              <span className="rounded-[2px] bg-gray-100 px-2 py-0.5 font-semibold text-[#666]">
                {t("admin.tools.contour.contextNoOrder")}
              </span>
            )}
            {/* Task source */}
            {taskSource === "reopened" && (
              <span className="text-[#999]">{t("admin.tools.contour.contextReopened")}</span>
            )}
            {taskSource === "duplicated" && (
              <span className="text-[#999]">{t("admin.tools.contour.contextDuplicated")}</span>
            )}
            {taskSource === "new" && (
              <span className="text-[#999]">{t("admin.tools.contour.contextNew")}</span>
            )}
            {/* File name */}
            {imageName && <span className="truncate text-[#999]">· {imageName}</span>}
            {/* Unsaved dot */}
            {hasEditorContent && !saving && (
              <span className="flex items-center gap-1 text-amber-600">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
                {t("admin.tools.contour.unsaved")}
              </span>
            )}
          </div>
          {/* Shortcut hint */}
          <span className="hidden sm:inline text-[10px] text-[#bbb]">{t("admin.tools.contour.shortcutHint")}</span>
        </div>
      )}

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

      {/* Usage guidance banner */}
      <div className="flex items-start gap-3 rounded-[3px] border border-blue-200 bg-blue-50 px-4 py-3">
        <svg className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
        <p className="text-xs text-blue-700">{t("admin.tools.contour.guidanceBanner")}</p>
      </div>

      {/* Error banner */}
      {errorMsg && (
        <div className="flex items-center justify-between rounded-[3px] border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-xs text-red-700">{errorMsg}</p>
          <button type="button" onClick={() => setErrorMsg("")} className="ml-3 text-red-400 hover:text-red-700">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

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
              <p className="mt-3 text-sm text-[#666]">{progressHuman || t("admin.common.processing")}</p>
              {isMobile && <p className="mt-1 text-[10px] text-[#999]">{t("admin.tools.contour.mobileSlower")}</p>}
            </div>
          ) : contourResult ? (
            <div className="relative w-full">
              {/* View mode toggle: Source / Mask / Contour */}
              <div className="mb-2 flex items-center justify-center gap-1">
                {["source", contourResult.maskOverlayUrl ? "mask" : null, "contour"].filter(Boolean).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPreviewMode(mode)}
                    className={`rounded-[3px] px-2.5 py-1 text-[10px] font-semibold transition-colors ${
                      previewMode === mode
                        ? "bg-black text-white"
                        : "bg-[#f0f0f0] text-[#666] hover:bg-[#e0e0e0]"
                    }`}
                  >
                    {t(`admin.tools.contour.view_${mode}`)}
                  </button>
                ))}
              </div>

              {/* Source view */}
              {previewMode === "source" && (
                <img
                  src={imageUrl}
                  alt="Source"
                  className="mx-auto max-h-[260px] rounded-[3px] object-contain"
                  style={{ background: "repeating-conic-gradient(#e0e0e0 0% 25%, transparent 0% 50%) 50% / 16px 16px" }}
                />
              )}

              {/* Mask view — shows detected foreground/background */}
              {previewMode === "mask" && contourResult.maskOverlayUrl && (
                <div>
                  <img
                    src={contourResult.maskOverlayUrl}
                    alt="Detected mask"
                    className="mx-auto max-h-[260px] rounded-[3px] object-contain"
                    style={{ background: "repeating-conic-gradient(#e0e0e0 0% 25%, transparent 0% 50%) 50% / 16px 16px" }}
                  />
                  <p className="mt-1.5 text-center text-[10px] text-[#999]">
                    {t("admin.tools.contour.maskHint")}
                  </p>
                </div>
              )}

              {/* Contour view (default) */}
              {previewMode === "contour" && (
                <svg
                  viewBox={`0 0 ${contourResult.imageWidth} ${contourResult.imageHeight}`}
                  className="mx-auto max-h-[260px] w-auto"
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
              )}

              {/* Extraction mode badge + legend */}
              <div className="mt-2 flex items-center justify-center gap-3 text-[10px] text-[#999]">
                {previewMode === "contour" && (
                  <>
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-0.5 w-4 bg-red-500" /> {t("admin.tools.contour.cutLine")}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-0.5 w-4 border-t-2 border-dashed border-red-400" /> {t("admin.tools.contour.bleedLine")}
                    </span>
                  </>
                )}
                <span>
                  {contourResult.imageWidth}x{contourResult.imageHeight}px
                </span>
                {contourResult.extractionMode && (
                  <ExtractionModeBadge mode={contourResult.extractionMode} t={t} />
                )}
              </div>
              {/* Quality grade + suggestion */}
              {contourResult.quality && (
                <QualityBanner quality={contourResult.quality} t={t} />
              )}
              {contourResult.quality?.suggestion && (
                <SuggestionBanner suggestion={contourResult.quality.suggestion} t={t} />
              )}
            </div>
          ) : (
            <p className="text-sm text-[#999]">{t("admin.tools.contour.dropzoneEmpty")}</p>
          )}
        </div>
      </div>

      {contourResult ? (
        <>
          <div className="space-y-2">
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
            <div className="flex items-center gap-1.5">
              {[
                { mm: 0, key: "bleedNone" },
                { mm: 1.5, key: "bleedTight" },
                { mm: 3, key: "bleedStandard" },
                { mm: 5, key: "bleedWide" },
              ].map((preset) => (
                <button
                  key={preset.mm}
                  type="button"
                  onClick={() => handleBleedChange(preset.mm)}
                  className={`rounded-[3px] px-2.5 py-1 text-[10px] font-semibold transition-colors ${
                    bleedMm === preset.mm
                      ? "bg-black text-white"
                      : "bg-[#f0f0f0] text-[#666] hover:bg-[#e0e0e0]"
                  }`}
                >
                  {t(`admin.tools.contour.${preset.key}`)} ({preset.mm}mm)
                </button>
              ))}
            </div>
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

          {/* Next-step guidance based on quality */}
          {contourResult.quality && (
            <QualityGuidance confidence={contourResult.quality.confidence} t={t} />
          )}

          {/* ── Export Panel ──────────────────────────────────────────── */}
          <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-4 space-y-3">
            <h3 className="text-xs font-bold text-[#333]">{t("admin.tools.contour.exportTitle")}</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {/* Production files */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-[#999] uppercase">{t("admin.tools.contour.exportProduction")}</p>
                <button
                  type="button"
                  onClick={handleDownloadSvg}
                  className="flex w-full items-center gap-2 rounded-[3px] border border-[#e0e0e0] px-3 py-2 text-left text-xs font-medium text-[#333] transition-colors hover:border-black"
                >
                  <span className="rounded-[2px] bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">SVG</span>
                  {t("admin.tools.contour.exportContourSvg")}
                </button>
                {contourResult.processedImageUrl && (
                  <button
                    type="button"
                    onClick={handleDownloadPng}
                    className="flex w-full items-center gap-2 rounded-[3px] border border-[#e0e0e0] px-3 py-2 text-left text-xs font-medium text-[#333] transition-colors hover:border-black"
                  >
                    <span className="rounded-[2px] bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">PNG</span>
                    {t("admin.tools.contour.exportPreviewPng")}
                  </button>
                )}
              </div>
              {/* Reference files */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-[#999] uppercase">{t("admin.tools.contour.exportReference")}</p>
                {contourResult.maskOverlayUrl && (
                  <button
                    type="button"
                    onClick={handleDownloadMask}
                    className="flex w-full items-center gap-2 rounded-[3px] border border-[#e0e0e0] px-3 py-2 text-left text-xs font-medium text-[#333] transition-colors hover:border-black"
                  >
                    <span className="rounded-[2px] bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold text-purple-700">MASK</span>
                    {t("admin.tools.contour.exportMaskPng")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleDownloadSource}
                  className="flex w-full items-center gap-2 rounded-[3px] border border-[#e0e0e0] px-3 py-2 text-left text-xs font-medium text-[#333] transition-colors hover:border-black"
                >
                  <span className="rounded-[2px] bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-[#666]">SRC</span>
                  {t("admin.tools.contour.exportSourceImg")}
                </button>
              </div>
            </div>
            {/* Quality-gated save buttons */}
            <div className="flex flex-col gap-2 border-t border-[#e0e0e0] pt-3 sm:flex-row sm:items-center">
              <QualityGatedSave
                confidence={contourResult.quality?.confidence}
                saving={saving}
                onSave={handleSave}
                t={t}
              />
              {saveMsg ? (
                <span className={`text-xs font-medium ${saveIsError ? "text-red-600" : "text-green-600"}`}>
                  {saveMsg}
                </span>
              ) : null}
            </div>
          </div>
        </>
      ) : null}

      {/* ── Post-save guidance (when saved with order link) ──────────── */}
      {savedOrderId && !saveIsError && (
        <div className="flex items-center justify-between gap-3 rounded-[3px] border border-green-300 bg-green-50 px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-green-800">{t("admin.tools.contour.savedSuccess")}</p>
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

      {/* ── Getting Started Guide (empty state) ────────────────────── */}
      {jobs.length === 0 && !hasEditorContent && !loadingJobs && (
        <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5 space-y-4">
          <h3 className="text-sm font-bold text-black">{t("admin.tools.contour.gettingStarted")}</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[3px] bg-[#fafafa] p-3 text-center">
              <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-black text-white text-xs font-bold">1</div>
              <p className="text-xs font-medium text-[#333]">{t("admin.tools.contour.guideStep1")}</p>
            </div>
            <div className="rounded-[3px] bg-[#fafafa] p-3 text-center">
              <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-black text-white text-xs font-bold">2</div>
              <p className="text-xs font-medium text-[#333]">{t("admin.tools.contour.guideStep2")}</p>
            </div>
            <div className="rounded-[3px] bg-[#fafafa] p-3 text-center">
              <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-black text-white text-xs font-bold">3</div>
              <p className="text-xs font-medium text-[#333]">{t("admin.tools.contour.guideStep3")}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Good/Bad Input Examples (collapsible) ────────────────────── */}
      <InputExamples t={t} />

      {/* ── Recent Jobs ──────────────────────────────────────────────── */}
      <div className="rounded-[3px] border border-[#e0e0e0] bg-white">
        <div className="border-b border-[#e0e0e0] px-5 py-3">
          <h2 className="text-sm font-bold text-black">{t("admin.tools.contour.recentTitle")}</h2>
          <p className="mt-0.5 text-[10px] text-[#999]">{t("admin.tools.contour.recentSubtitle")}</p>
        </div>
        {loadingJobs ? (
          <div className="px-5 py-8 text-center text-sm text-[#999]">{t("admin.tools.loading")}</div>
        ) : jobs.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-[#999]">{t("admin.tools.contour.noJobs")}</p>
            <p className="mt-1 text-xs text-[#bbb]">{t("admin.tools.contour.noJobsHint")}</p>
          </div>
        ) : (
          <div>
            {todayJobs.length > 0 && (
              <>
                <div className="px-5 pt-3 pb-1">
                  <p className="text-[10px] font-semibold uppercase text-[#999]">{t("admin.tools.contour.groupToday")}</p>
                </div>
                <div className="divide-y divide-[#e0e0e0]">
                  {todayJobs.map((job) => (
                    <ContourJobRow
                      key={job.id}
                      job={job}
                      t={t}
                      onPreview={setPreviewUrl}
                      onDetail={setDetailJob}
                      onReopen={handleReopen}
                      onDuplicate={handleDuplicate}
                      reopening={reopening}
                    />
                  ))}
                </div>
              </>
            )}
            {earlierJobs.length > 0 && (
              <>
                <div className="px-5 pt-3 pb-1">
                  <p className="text-[10px] font-semibold uppercase text-[#999]">{t("admin.tools.contour.groupEarlier")}</p>
                </div>
                <div className="divide-y divide-[#e0e0e0]">
                  {earlierJobs.map((job) => (
                    <ContourJobRow
                      key={job.id}
                      job={job}
                      t={t}
                      onPreview={setPreviewUrl}
                      onDetail={setDetailJob}
                      onReopen={handleReopen}
                      onDuplicate={handleDuplicate}
                      reopening={reopening}
                    />
                  ))}
                </div>
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
          onDuplicate={handleDuplicate}
          reopening={reopening}
          fetchJobs={fetchJobs}
        />
      ) : null}
    </div>
  );
}

// ─── Contour Job Row ──────────────────────────────────────────────────────────

function ContourJobRow({ job, t, onPreview, onDetail, onReopen, onDuplicate, reopening }) {
  const data = job.inputData || {};
  const output = job.outputData || {};
  const thumbUrl = output.processedFileUrl || job.inputFileUrl;
  const dims = data.imageWidth && data.imageHeight ? `${data.imageWidth}×${data.imageHeight}px` : null;

  // Inline notes editing
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(job.notes || "");
  const [notesSaving, setNotesSaving] = useState(false);
  const notesInputRef = useRef(null);

  useEffect(() => {
    if (editingNotes && notesInputRef.current) notesInputRef.current.focus();
  }, [editingNotes]);

  async function saveNotes() {
    if (notesValue === (job.notes || "")) {
      setEditingNotes(false);
      return;
    }
    setNotesSaving(true);
    try {
      const res = await fetch(`/api/admin/tools/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesValue }),
      });
      if (res.ok) {
        job.notes = notesValue; // update in-place for immediate UI
        setEditingNotes(false);
      }
    } catch (err) { console.error("[Contour] Failed to save notes:", err); } finally {
      setNotesSaving(false);
    }
  }

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
            <span className="rounded-[2px] bg-[#f0f0f0] px-1.5 py-0.5 text-[10px] font-medium text-[#666]">{data.bleedMm}{t("admin.tools.contour.mmBleed")}</span>
          )}
          {dims && (
            <span className="rounded-[2px] bg-[#f0f0f0] px-1.5 py-0.5 text-[10px] font-medium text-[#666]">{dims}</span>
          )}
          {output.bgRemoved && (
            <span className="rounded-[2px] bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-700">{t("admin.tools.contour.bgRemoved")}</span>
          )}
          {output.contourConfidence && (
            <ConfidenceBadge confidence={output.contourConfidence} shapeType={output.contourShapeType} t={t} />
          )}
          <StatusBadge status={job.status} t={t} />
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-[#999]">
          <span>{timeAgo(job.createdAt, t)}</span>
          {job.operatorName && <><span>·</span><span>{job.operatorName}</span></>}
          {job.orderId && <><span>·</span><span>{t("admin.common.order")}: #{job.orderId.slice(0, 8)}</span></>}
        </div>
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
              placeholder={t("admin.tools.contour.editNotesPlaceholder")}
            />
          ) : (
            <>
              {job.notes && <p className="truncate text-xs text-[#777]">{job.notes}</p>}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setNotesValue(job.notes || ""); setEditingNotes(true); }}
                className="shrink-0 text-[#bbb] hover:text-[#666]"
                title={t("admin.tools.contour.editNotes")}
              >
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
                </svg>
              </button>
            </>
          )}
        </div>
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
        <button
          type="button"
          onClick={() => onDuplicate(job)}
          disabled={reopening}
          className="rounded-[3px] border border-[#e0e0e0] px-3 py-1.5 text-xs font-medium text-[#666] transition-colors hover:border-black hover:text-black disabled:opacity-50"
        >
          {t("admin.tools.contour.duplicate")}
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

function ContourDetailModal({ job, t, onClose, onReopen, onDuplicate, reopening, fetchJobs }) {
  // Inline notes editing in modal
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(job.notes || "");
  const [notesSaving, setNotesSaving] = useState(false);
  const notesInputRef = useRef(null);

  useEffect(() => {
    if (editingNotes && notesInputRef.current) notesInputRef.current.focus();
  }, [editingNotes]);

  async function saveNotes() {
    if (notesValue === (job.notes || "")) {
      setEditingNotes(false);
      return;
    }
    setNotesSaving(true);
    try {
      const res = await fetch(`/api/admin/tools/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesValue }),
      });
      if (res.ok) {
        job.notes = notesValue;
        setEditingNotes(false);
        if (fetchJobs) fetchJobs();
      }
    } catch (err) { console.error("[Contour] Failed to save notes:", err); } finally {
      setNotesSaving(false);
    }
  }

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
          {/* Quality Assessment — prominent section */}
          {job.outputData?.contourConfidence && (
            <div className={`rounded-[3px] border-2 p-4 space-y-3 ${
              job.outputData.contourConfidence === "good" ? "border-green-300 bg-green-50" :
              job.outputData.contourConfidence === "rectangular" ? "border-amber-300 bg-amber-50" :
              "border-red-300 bg-red-50"
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#333]">{t("admin.tools.contour.qualityLabel")}</span>
                  <ConfidenceBadge confidence={job.outputData.contourConfidence} shapeType={job.outputData.contourShapeType} t={t} />
                </div>
                {job.outputData.contourShapeType && (
                  <span className="text-[10px] font-medium text-[#666]">{t("admin.tools.contour.shapeTypeLabel")}: {job.outputData.contourShapeType}</span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {job.outputData.areaCoverage != null && (
                  <div className="rounded-[3px] bg-white/60 px-2 py-1.5">
                    <span className="block text-[10px] text-[#666]">{t("admin.tools.contour.coverage")}</span>
                    <span className="font-bold text-[#111]">{job.outputData.areaCoverage}%</span>
                  </div>
                )}
                {job.outputData.rectangularity != null && (
                  <div className="rounded-[3px] bg-white/60 px-2 py-1.5">
                    <span className="block text-[10px] text-[#666]">{t("admin.tools.contour.rectangularity")}</span>
                    <span className="font-bold text-[#111]">{job.outputData.rectangularity}%</span>
                  </div>
                )}
                {job.outputData.pointCount != null && (
                  <div className="rounded-[3px] bg-white/60 px-2 py-1.5">
                    <span className="block text-[10px] text-[#666]">{t("admin.tools.contour.points")}</span>
                    <span className="font-bold text-[#111]">{job.outputData.pointCount}</span>
                  </div>
                )}
              </div>
              {job.outputData.contourWarnings?.length > 0 && (
                <div className="space-y-1 rounded-[3px] bg-white/50 px-3 py-2">
                  {job.outputData.contourWarnings.map((w) => (
                    <p key={w} className="text-xs text-amber-700">⚠ {t(`admin.tools.contour.${w}`)}</p>
                  ))}
                </div>
              )}
              {/* Recommendation */}
              <QualityGuidance confidence={job.outputData.contourConfidence} t={t} />
            </div>
          )}
          {/* Suggestion */}
          {job.outputData?.contourSuggestion && (
            <SuggestionBanner suggestion={job.outputData.contourSuggestion} t={t} />
          )}
          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <MetaCell label={t("admin.tools.contour.fileName")} value={job.inputData?.fileName || "—"} />
            <MetaCell label={t("admin.tools.contour.bleedLine")} value={`${job.inputData?.bleedMm ?? "—"}mm`} />
            <MetaCell label={t("admin.tools.contour.imageSize")} value={`${job.inputData?.imageWidth || "—"} × ${job.inputData?.imageHeight || "—"}px`} />
            <MetaCell label={t("admin.tools.contour.operator")} value={job.operatorName || "—"} />
            <MetaCell label={t("admin.tools.contour.created")} value={formatJobTime(job.createdAt)} />
            {job.outputData?.extractionMode && (
              <MetaCell label={t("admin.tools.contour.extractionModeLabel")} value={
                <ExtractionModeBadge mode={job.outputData.extractionMode} t={t} />
              } />
            )}
            {job.outputData?.maskCoverage != null && (
              <MetaCell label={t("admin.tools.contour.maskCoverageLabel")} value={`${Math.round(job.outputData.maskCoverage * 100)}%`} />
            )}
            {job.outputData?.backgroundUniformity != null && (
              <MetaCell label={t("admin.tools.contour.bgUniformityLabel")} value={`${Math.round(job.outputData.backgroundUniformity * 100)}%`} />
            )}
            {job.outputData?.componentCount != null && (
              <MetaCell label={t("admin.tools.contour.componentCountLabel")} value={job.outputData.componentCount} />
            )}
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
          {/* Notes with inline edit */}
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-[11px] font-medium text-[#666]">{t("admin.tools.notesLabel")}</p>
              {!editingNotes && (
                <button
                  type="button"
                  onClick={() => { setNotesValue(job.notes || ""); setEditingNotes(true); }}
                  className="text-[#bbb] hover:text-[#666]"
                  title={t("admin.tools.contour.editNotes")}
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
                placeholder={t("admin.tools.contour.editNotesPlaceholder")}
              />
            ) : (
              <p className="text-sm text-[#111]">{job.notes || "—"}</p>
            )}
          </div>
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
            <button
              type="button"
              onClick={() => onDuplicate(job)}
              disabled={reopening}
              className="rounded-[3px] border border-[#e0e0e0] px-4 py-2 text-xs font-medium text-[#666] hover:border-black hover:text-black disabled:opacity-50"
            >
              {t("admin.tools.contour.duplicate")}
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

// ─── Quality Components ───────────────────────────────────────────────────────

const CONFIDENCE_STYLES = {
  good: "bg-green-100 text-green-700",
  rectangular: "bg-amber-100 text-amber-700",
  low: "bg-red-100 text-red-700",
};

function ConfidenceBadge({ confidence, shapeType, t }) {
  const cls = CONFIDENCE_STYLES[confidence] || CONFIDENCE_STYLES.low;
  const label = t(`admin.tools.contour.grade_${confidence}`) || confidence;
  return (
    <span className={`rounded-[2px] px-1.5 py-0.5 text-[10px] font-bold ${cls}`}>
      {label}
    </span>
  );
}

function QualityBanner({ quality, t }) {
  if (!quality) return null;
  const isGood = quality.confidence === "good" && quality.warnings.length === 0;
  return (
    <div className={`mt-2 rounded-[3px] px-3 py-2 text-xs ${
      isGood ? "bg-green-50 text-green-700" : quality.confidence === "low" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
    }`}>
      <div className="flex items-center gap-2 font-semibold">
        <ConfidenceBadge confidence={quality.confidence} shapeType={quality.shapeType} t={t} />
        <span>{quality.shapeType} · {quality.areaCoverage}% {t("admin.tools.contour.coverage").toLowerCase()}</span>
      </div>
      {quality.warnings.filter((w) => !w.startsWith("info_")).map((w) => (
        <p key={w} className="mt-1">⚠ {t(`admin.tools.contour.${w}`)}</p>
      ))}
    </div>
  );
}

// ─── Extraction Mode Badge ────────────────────────────────────────────────────

const EXTRACTION_MODE_STYLES = {
  alpha: "bg-blue-100 text-blue-700",
  corner_flood: "bg-teal-100 text-teal-700",
  edge_gradient: "bg-purple-100 text-purple-700",
  bg_removal: "bg-violet-100 text-violet-700",
  hybrid: "bg-indigo-100 text-indigo-700",
};

function ExtractionModeBadge({ mode, t }) {
  const cls = EXTRACTION_MODE_STYLES[mode] || "bg-gray-100 text-gray-600";
  const label = t(`admin.tools.contour.mode_${mode}`) || mode;
  return (
    <span className={`rounded-[2px] px-1.5 py-0.5 text-[10px] font-bold ${cls}`}>
      {label}
    </span>
  );
}

// ─── Human-readable Suggestion Banner ─────────────────────────────────────────

function SuggestionBanner({ suggestion, t }) {
  if (!suggestion) return null;
  const text = t(`admin.tools.contour.${suggestion}`);
  if (!text || text === `admin.tools.contour.${suggestion}`) return null;
  return (
    <div className="mt-1.5 rounded-[3px] bg-blue-50 border border-blue-200 px-3 py-2">
      <p className="text-xs text-blue-700">{text}</p>
    </div>
  );
}

// ─── Quality-Gated Save Button ────────────────────────────────────────────────

function QualityGatedSave({ confidence, saving, onSave, t }) {
  if (confidence === "good" || !confidence) {
    return (
      <button
        type="button"
        onClick={() => onSave("completed")}
        disabled={saving}
        className="inline-flex items-center justify-center gap-2 rounded-[3px] bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
      >
        {saving ? t("admin.tools.saving") : t("admin.tools.contour.saveApprove")}
      </button>
    );
  }

  if (confidence === "rectangular") {
    // Mark for Review is PRIMARY — save-as-completed is secondary/smaller
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onSave("needs_review")}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-[3px] bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
        >
          {saving ? t("admin.tools.saving") : t("admin.tools.contour.markForReview")}
        </button>
        <button
          type="button"
          onClick={() => {
            if (window.confirm(t("admin.tools.contour.confirmRectSave"))) onSave("completed");
          }}
          disabled={saving}
          className="inline-flex items-center justify-center gap-1 rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-xs font-medium text-[#666] transition-colors hover:border-black hover:text-black disabled:opacity-50"
        >
          {t("admin.tools.contour.saveAnywayShort")}
        </button>
      </div>
    );
  }

  // low confidence — NO approve/completed path, only flag for review
  return (
    <button
      type="button"
      onClick={() => onSave("needs_review")}
      disabled={saving}
      className="inline-flex items-center justify-center gap-2 rounded-[3px] bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
    >
      {saving ? t("admin.tools.saving") : t("admin.tools.contour.saveFlag")}
    </button>
  );
}

// ─── Quality Next-Step Guidance ───────────────────────────────────────────────

function QualityGuidance({ confidence, t }) {
  const configs = {
    good: { border: "border-green-200", bg: "bg-green-50", text: "text-green-700", icon: "✓", titleKey: "admin.tools.contour.guidanceGoodTitle", key: "admin.tools.contour.guidanceGood" },
    rectangular: { border: "border-amber-200", bg: "bg-amber-50", text: "text-amber-700", icon: "⚠", titleKey: "admin.tools.contour.guidanceRectTitle", key: "admin.tools.contour.guidanceRectangular" },
    low: { border: "border-red-200", bg: "bg-red-50", text: "text-red-700", icon: "✗", titleKey: "admin.tools.contour.guidanceLowTitle", key: "admin.tools.contour.guidanceLow" },
  };
  const c = configs[confidence] || configs.low;
  return (
    <div className={`rounded-[3px] border ${c.border} ${c.bg} px-4 py-3`}>
      <p className={`text-xs font-bold ${c.text}`}>{c.icon} {t(c.titleKey)}</p>
      <p className={`mt-1 text-xs ${c.text}`}>{t(c.key)}</p>
    </div>
  );
}

// ─── Good/Bad Input Examples ──────────────────────────────────────────────────

function InputExamples({ t }) {
  return (
    <details className="rounded-[3px] border border-[#e0e0e0] bg-white">
      <summary className="cursor-pointer px-5 py-3 text-sm font-semibold text-[#666] hover:bg-[#fafafa]">
        {t("admin.tools.contour.examplesTitle")}
      </summary>
      <div className="border-t border-[#e0e0e0] px-5 py-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Good inputs */}
          <div className="rounded-[3px] border border-green-200 bg-green-50 p-4">
            <p className="text-xs font-bold text-green-800">{t("admin.tools.contour.exGoodTitle")}</p>
            <ul className="mt-2 space-y-1.5 text-xs text-green-700">
              <li>✓ {t("admin.tools.contour.exGood1")}</li>
              <li>✓ {t("admin.tools.contour.exGood2")}</li>
              <li>✓ {t("admin.tools.contour.exGood3")}</li>
            </ul>
          </div>
          {/* Bad inputs */}
          <div className="rounded-[3px] border border-red-200 bg-red-50 p-4">
            <p className="text-xs font-bold text-red-800">{t("admin.tools.contour.exBadTitle")}</p>
            <ul className="mt-2 space-y-1.5 text-xs text-red-700">
              <li>✗ {t("admin.tools.contour.exBad1")}</li>
              <li>✗ {t("admin.tools.contour.exBad2")}</li>
              <li>✗ {t("admin.tools.contour.exBad3")}</li>
            </ul>
          </div>
        </div>
        <p className="text-[11px] text-[#999]">{t("admin.tools.contour.exTip")}</p>
      </div>
    </details>
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
