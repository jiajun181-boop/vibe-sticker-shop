"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { UploadButton } from "@/utils/uploadthing";
import { applyHalftone, hexToRgb } from "@/lib/stamp/halftone";
import { useTranslation } from "@/lib/i18n/useTranslation";

const INTENSITIES = [
  { id: "light", labelKey: "stamp.halftone.light" },
  { id: "medium", labelKey: "stamp.halftone.medium" },
  { id: "heavy", labelKey: "stamp.halftone.heavy" },
];

export default function StampHalftoneUpload({
  logoFile,
  logoScale,
  halftoneEnabled,
  halftoneIntensity,
  color,
  onLogoUpload,
  onLogoRemove,
  onLogoScaleChange,
  onHalftoneToggle,
  onHalftoneIntensityChange,
  halftoneDataRef,
}) {
  const { t } = useTranslation();
  const [processing, setProcessing] = useState(false);
  const previewCanvasRef = useRef(null);
  const sourceImgRef = useRef(null);

  // Process halftone when settings change
  const processHalftone = useCallback(() => {
    const img = sourceImgRef.current;
    if (!img || !halftoneEnabled) return;

    setProcessing(true);
    try {
      const inkRgb = hexToRgb(color || "#111111");
      const imgData = applyHalftone(img, {
        intensity: halftoneIntensity || "medium",
        inkRgb,
        size: 300,
        circularMask: false, // Let StampEditor handle masking
      });

      // Store processed data for StampEditor canvas
      if (halftoneDataRef) {
        const canvas = document.createElement("canvas");
        canvas.width = 300;
        canvas.height = 300;
        const ctx = canvas.getContext("2d");
        ctx.putImageData(imgData, 0, 0);
        halftoneDataRef.current = canvas;
      }

      // Draw preview
      const preview = previewCanvasRef.current;
      if (preview) {
        const dpr = window.devicePixelRatio || 1;
        preview.width = 120 * dpr;
        preview.height = 120 * dpr;
        const ctx = preview.getContext("2d");
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, 120, 120);
        // Draw scaled
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = 300;
        tempCanvas.height = 300;
        tempCanvas.getContext("2d").putImageData(imgData, 0, 0);
        ctx.drawImage(tempCanvas, 0, 0, 120, 120);
      }
    } finally {
      setProcessing(false);
    }
  }, [halftoneEnabled, halftoneIntensity, color, halftoneDataRef]);

  // Load source image when logo changes
  useEffect(() => {
    if (!logoFile?.url) {
      sourceImgRef.current = null;
      if (halftoneDataRef) halftoneDataRef.current = null;
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      sourceImgRef.current = img;
      if (halftoneEnabled) processHalftone();
    };
    img.src = logoFile.url;
  }, [logoFile?.url]);

  // Re-process when halftone settings change
  useEffect(() => {
    if (sourceImgRef.current && halftoneEnabled) {
      processHalftone();
    } else if (!halftoneEnabled && halftoneDataRef) {
      halftoneDataRef.current = null;
    }
  }, [halftoneEnabled, halftoneIntensity, color, processHalftone]);

  if (!logoFile) {
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-500)] mb-2">
          {t("stamp.image")}
        </p>
        <UploadButton
          endpoint="artworkUploader"
          onClientUploadComplete={(res) => {
            const f = Array.isArray(res) ? res[0] : null;
            if (f) onLogoUpload({ url: f.url, key: f.key, name: f.name });
          }}
          onUploadError={(e) => console.error("[stamp image]", e)}
          appearance={{
            button:
              "!bg-[var(--color-gray-900)] !text-[#fff] !text-xs !rounded-full !px-4 !py-2 !font-semibold hover:!bg-black",
            allowedContent: "!text-[10px] !text-[var(--color-gray-400)]",
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-500)] mb-2">
        {t("stamp.image")}
      </p>
      <div className="rounded-xl border border-[var(--color-gray-200)] p-3 space-y-3">
        {/* File info + remove */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--color-gray-900)] truncate max-w-[200px]">
            {logoFile.name}
          </span>
          <button
            type="button"
            onClick={onLogoRemove}
            className="text-xs font-semibold text-red-600 hover:text-red-800"
          >
            {t("stamp.removeLogo")}
          </button>
        </div>

        {/* Halftone toggle */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[var(--color-gray-700)]">
            {t("stamp.halftone.effect")}
          </span>
          <button
            type="button"
            onClick={() => onHalftoneToggle(!halftoneEnabled)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              halftoneEnabled ? "bg-[var(--color-gray-900)]" : "bg-[var(--color-gray-300)]"
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                halftoneEnabled ? "translate-x-4.5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {/* Halftone intensity selector */}
        {halftoneEnabled && (
          <div className="space-y-2">
            <div className="flex gap-1">
              {INTENSITIES.map((int) => (
                <button
                  key={int.id}
                  type="button"
                  onClick={() => onHalftoneIntensityChange(int.id)}
                  className={`flex-1 rounded-lg px-2 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                    halftoneIntensity === int.id
                      ? "bg-[var(--color-gray-900)] text-[#fff]"
                      : "bg-[var(--color-gray-100)] text-[var(--color-gray-600)] hover:bg-[var(--color-gray-200)]"
                  }`}
                >
                  {t(int.labelKey)}
                </button>
              ))}
            </div>

            {/* Mini preview */}
            {processing ? (
              <div className="flex items-center justify-center h-[120px]">
                <div className="animate-spin h-6 w-6 border-2 border-[var(--color-gray-400)] border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="flex justify-center">
                <canvas
                  ref={previewCanvasRef}
                  style={{ width: 120, height: 120 }}
                  className="rounded-lg border border-[var(--color-gray-200)]"
                />
              </div>
            )}
          </div>
        )}

        {/* Scale slider */}
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--color-gray-500)]">{t("stamp.logoSize")}</span>
            <span className="text-[10px] text-[var(--color-gray-500)]">{logoScale}%</span>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            value={logoScale}
            onChange={(e) => onLogoScaleChange(Number(e.target.value))}
            className="w-full accent-gray-900"
          />
        </div>
      </div>
    </div>
  );
}
