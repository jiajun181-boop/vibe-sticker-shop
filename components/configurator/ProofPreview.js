"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { generateContour, regenerateBleed } from "@/lib/contour/generate-contour";
import { clipImageToContour } from "@/lib/contour/clip-to-contour";
import ConfigStep from "./ConfigStep";
import ContourPreviewCanvas from "./ContourPreviewCanvas";
import MockupPreview from "./MockupPreview";

const TABS = ["proof", "laptop", "bottle", "phone"];

const TAB_LABELS = {
  proof: "configurator.proofTabProof",
  laptop: "configurator.proofTabLaptop",
  bottle: "configurator.proofTabBottle",
  phone: "configurator.proofTabPhone",
};

const TAB_LABELS_FALLBACK = {
  proof: "Proof",
  laptop: "Laptop",
  bottle: "Bottle",
  phone: "Phone",
};

/**
 * Proof Preview step for the sticker configurator.
 * Auto-generates die-cut contour and shows an interactive preview.
 *
 * Props:
 *  - uploadedFile   { url, key, name, size }
 *  - widthIn        sticker width in inches
 *  - heightIn       sticker height in inches
 *  - cuttingId      "die-cut" | "kiss-cut" etc.
 *  - materialId     current material (for display)
 *  - onConfirmProof({ contourSvg, bleedSvg, previewDataUrl, bleedMm, bgRemoved, processedImageUrl })
 *  - onRejectProof  () => void – go back / change artwork
 *  - t              translation function
 */
export default function ProofPreview({
  uploadedFile,
  widthIn,
  heightIn,
  cuttingId,
  materialId,
  onConfirmProof,
  onRejectProof,
  t,
  stepNumber = 6,
}) {
  const [contourData, setContourData] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [stage, setStage] = useState("idle"); // idle|loading|removing-bg|tracing|done|error
  const [error, setError] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [bleedMm, setBleedMm] = useState(3);
  const [activeTab, setActiveTab] = useState("proof");
  const [stickerCanvas, setStickerCanvas] = useState(null);
  const previewRef = useRef(null);

  // Generate contour when uploadedFile changes
  useEffect(() => {
    if (!uploadedFile?.url) {
      setContourData(null);
      setConfirmed(false);
      return;
    }

    let cancelled = false;
    setProcessing(true);
    setError(null);
    setConfirmed(false);
    setStage("loading");

    generateContour(uploadedFile.url, {
      bleedMm,
      onProgress: (s) => { if (!cancelled) setStage(s); },
    })
      .then(async (data) => {
        if (cancelled) return;
        setContourData(data);
        setStage("done");
        setProcessing(false);

        // Generate clipped sticker for mockups
        try {
          const clipped = await clipImageToContour(
            data.processedImageUrl || uploadedFile.url,
            data.contourPoints,
          );
          if (!cancelled) setStickerCanvas(clipped);
        } catch {
          // Non-critical: mockups just won't show
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Contour generation failed:", err);
        setError(err.message || "Contour generation failed");
        setStage("error");
        setProcessing(false);
      });

    return () => { cancelled = true; };
  }, [uploadedFile?.url]); // eslint-disable-line react-hooks/exhaustive-deps

  // Regenerate bleed offset when slider changes (fast, no re-processing)
  useEffect(() => {
    if (!contourData?.contourPoints) return;
    const { bleedPath, bleedPoints } = regenerateBleed(contourData.contourPoints, bleedMm);
    setContourData((prev) => prev ? { ...prev, bleedPath, bleedPoints } : prev);
  }, [bleedMm]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle confirm
  const handleConfirm = useCallback(() => {
    if (!contourData) return;
    setConfirmed(true);

    // Export proof preview as data URL
    let previewDataUrl = null;
    try {
      const canvas = document.createElement("canvas");
      const maxDim = 800;
      const aspect = contourData.imageWidth / contourData.imageHeight;
      const pw = aspect >= 1 ? maxDim : Math.round(maxDim * aspect);
      const ph = aspect >= 1 ? Math.round(maxDim / aspect) : maxDim;
      canvas.width = pw;
      canvas.height = ph;
      const ctx = canvas.getContext("2d");

      // Draw the image
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = contourData.processedImageUrl || uploadedFile.url;
      // Since img may not be loaded yet, use a sync approach with an already-loaded ref
      // For now, we'll pass null and upload on demand later if needed
    } catch {
      // Non-critical
    }

    onConfirmProof({
      contourSvg: contourData.cutPath,
      bleedSvg: contourData.bleedPath,
      svgString: contourData.svgString,
      bleedMm,
      bgRemoved: contourData.bgRemoved,
      processedImageUrl: contourData.processedImageUrl,
      contourPoints: contourData.contourPoints,
      previewDataUrl,
    });
  }, [contourData, bleedMm, uploadedFile, onConfirmProof]);

  // Stage labels
  const stageLabel = {
    loading: t?.("configurator.proofProcessing") || "Generating die-cut contour...",
    "removing-bg": t?.("configurator.proofProcessingBg") || "Removing background...",
    tracing: t?.("configurator.proofProcessingTrace") || "Tracing contour...",
  };

  const displayImageUrl = contourData?.processedImageUrl || uploadedFile?.url;

  return (
    <ConfigStep
      number={stepNumber}
      title={t?.("configurator.proofPreview") || "Proof Preview"}
      subtitle={t?.("configurator.proofSubtitle") || "Review your sticker proof before ordering"}
    >
      {processing ? (
        /* ── Processing Indicator ── */
        <div className="flex flex-col items-center gap-4 py-10">
          <div className="relative h-14 w-14">
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700">
              {stageLabel[stage] || stageLabel.loading}
            </p>
            {stage === "removing-bg" && (
              <p className="mt-1 text-xs text-gray-400">
                This may take a few moments for the first time...
              </p>
            )}
          </div>
        </div>
      ) : error ? (
        /* ── Error State ── */
        <div className="flex flex-col items-center gap-4 rounded-xl border border-red-200 bg-red-50 py-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-sm text-red-700">{error}</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setStage("idle");
                // Force re-run by toggling
                const url = uploadedFile?.url;
                setContourData(null);
                // Trigger re-generation
                if (url) {
                  setProcessing(true);
                  generateContour(url, {
                    bleedMm,
                    onProgress: setStage,
                  }).then((data) => {
                    setContourData(data);
                    setStage("done");
                    setProcessing(false);
                  }).catch((e) => {
                    setError(e.message);
                    setStage("error");
                    setProcessing(false);
                  });
                }
              }}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              {t?.("configurator.proofRetry") || "Retry"}
            </button>
            <button
              type="button"
              onClick={onRejectProof}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              {t?.("configurator.proofChangeArtwork") || "Change Artwork"}
            </button>
          </div>
        </div>
      ) : contourData && !confirmed ? (
        /* ── Proof Preview ── */
        <div className="space-y-5" ref={previewRef}>
          {/* Tab bar */}
          <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex-1 rounded-md px-3 py-2 text-xs font-bold transition-all ${
                  activeTab === tab
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t?.(TAB_LABELS[tab]) || TAB_LABELS_FALLBACK[tab]}
              </button>
            ))}
          </div>

          {/* Preview content */}
          {activeTab === "proof" ? (
            <ContourPreviewCanvas
              imageUrl={displayImageUrl}
              cutPath={contourData.cutPath}
              bleedPath={contourData.bleedPath}
              imageWidth={contourData.imageWidth}
              imageHeight={contourData.imageHeight}
              widthIn={widthIn}
              heightIn={heightIn}
              t={t}
            />
          ) : (
            <MockupPreview
              scene={activeTab}
              stickerCanvas={stickerCanvas}
              t={t}
            />
          )}

          {/* Bleed slider */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-700">
                  {t?.("configurator.proofBleed") || "Bleed"}: {bleedMm}mm
                </p>
                <p className="text-xs text-gray-400">
                  {t?.("configurator.proofBleedHint") || "Extra area beyond cut line for printing tolerance"}
                </p>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={6}
              step={0.5}
              value={bleedMm}
              onChange={(e) => setBleedMm(parseFloat(e.target.value))}
              className="mt-2 w-full accent-gray-900"
            />
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>0mm</span>
              <span>3mm</span>
              <span>6mm</span>
            </div>
          </div>

          {/* Background removal badge */}
          {contourData.bgRemoved && (
            <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
              <svg className="h-4 w-4 shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              <p className="text-xs text-blue-700">
                Background was automatically removed for contour detection
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onRejectProof}
              className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              {t?.("configurator.proofChangeArtwork") || "Change Artwork"}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 hover:shadow-emerald-700/30"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t?.("configurator.proofConfirm") || "Confirm Proof"}
              </span>
            </button>
          </div>
        </div>
      ) : confirmed ? (
        /* ── Confirmed State ── */
        <div className="flex items-center gap-3 rounded-xl border-2 border-emerald-200 bg-emerald-50 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-emerald-800">
              {t?.("configurator.proofConfirmed") || "Proof confirmed"}
            </p>
            <p className="text-xs text-emerald-600">
              Die-cut contour generated with {bleedMm}mm bleed
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setConfirmed(false);
            }}
            className="rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
          >
            Edit
          </button>
        </div>
      ) : null}
    </ConfigStep>
  );
}
