"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { UploadButton } from "@/utils/uploadthing";
import { showErrorToast } from "@/components/Toast";
import { applyHalftone } from "@/lib/stamp/halftone";
import { useTranslation } from "@/lib/i18n/useTranslation";

const INTENSITIES = ["light", "medium", "heavy"];

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
  halftoneDataRef, // ref to store processed canvas for StampEditor
}) {
  const { t } = useTranslation();
  const imgRef = useRef(null);
  const [processing, setProcessing] = useState(false);

  // Process halftone when image, intensity, or color changes
  const processHalftone = useCallback(() => {
    if (!logoFile?.url || !halftoneEnabled) {
      if (halftoneDataRef) halftoneDataRef.current = null;
      return;
    }
    setProcessing(true);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      const result = applyHalftone(img, { intensity: halftoneIntensity, color, circular: false });
      if (halftoneDataRef) halftoneDataRef.current = result;
      setProcessing(false);
    };
    img.onerror = () => setProcessing(false);
    img.src = logoFile.url;
  }, [logoFile?.url, halftoneEnabled, halftoneIntensity, color, halftoneDataRef]);

  useEffect(() => {
    processHalftone();
  }, [processHalftone]);

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-500)] mb-2">
        {t("stamp.logoUpload")}
      </p>

      {logoFile ? (
        <div className="space-y-3 rounded-xl border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] p-3">
          {/* File info */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
              <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--color-gray-800)]">
              {logoFile.name}
            </span>
            <button
              type="button"
              onClick={onLogoRemove}
              className="rounded-full p-1 text-[var(--color-gray-400)] hover:bg-[var(--color-gray-200)] hover:text-red-500"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scale slider */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-[var(--color-gray-500)]">{t("stamp.imageScale")}</span>
              <span className="text-[10px] text-[var(--color-gray-400)]">{logoScale}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              value={logoScale}
              onChange={(e) => onLogoScaleChange(Number(e.target.value))}
              className="mt-1 w-full accent-gray-900"
            />
          </div>

          {/* Halftone toggle */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--color-gray-700)]">{t("stamp.halftoneEffect")}</span>
            <button
              type="button"
              onClick={() => onHalftoneToggle(!halftoneEnabled)}
              className={`relative h-6 w-11 rounded-full transition-colors ${halftoneEnabled ? "bg-[var(--color-gray-900)]" : "bg-[var(--color-gray-300)]"}`}
            >
              <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${halftoneEnabled ? "translate-x-5" : ""}`} />
            </button>
          </div>

          {/* Halftone intensity */}
          {halftoneEnabled && (
            <div>
              <span className="text-[10px] font-medium text-[var(--color-gray-500)]">{t("stamp.halftoneIntensity")}</span>
              <div className="mt-1 flex gap-2">
                {INTENSITIES.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => onHalftoneIntensityChange(level)}
                    className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                      halftoneIntensity === level
                        ? "bg-[var(--color-gray-900)] text-[#fff]"
                        : "bg-[var(--color-gray-100)] text-[var(--color-gray-600)] hover:bg-[var(--color-gray-200)]"
                    }`}
                  >
                    {t(`stamp.halftone.${level}`)}
                  </button>
                ))}
              </div>
              {processing && (
                <p className="mt-1 text-[10px] text-[var(--color-gray-400)]">{t("stamp.processing")}</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-[var(--color-gray-300)] bg-white p-4 text-center transition-colors hover:border-[var(--color-gray-400)]">
          <p className="mb-2 text-xs text-[var(--color-gray-500)]">{t("stamp.uploadHint")}</p>
          <UploadButton
            endpoint="artworkUploader"
            onClientUploadComplete={(res) => {
              const first = Array.isArray(res) ? res[0] : null;
              if (!first) return;
              onLogoUpload({
                url: first.ufsUrl || first.url,
                key: first.key,
                name: first.name,
                size: first.size,
              });
            }}
            onUploadError={(err) => showErrorToast(err?.message || "Upload failed")}
            appearance={{
              button: "ut-ready:bg-gray-900 ut-ready:hover:bg-gray-800 ut-uploading:bg-gray-600 rounded-full px-5 py-2 text-xs font-semibold text-[#fff] transition-colors",
              allowedContent: "hidden",
            }}
          />
        </div>
      )}
    </div>
  );
}
