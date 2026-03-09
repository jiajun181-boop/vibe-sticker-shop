"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { WHITE_INK_MATERIALS } from "@/lib/sticker-order-config";
import { generateAutoWhite, generateFollowColor } from "@/lib/white-ink";

const MODES = [
  { id: "auto", label: "Automatic", desc: "We add a white base under your entire design" },
  { id: "follow", label: "Match Design", desc: "White density follows your artwork edges smoothly" },
  { id: "upload", label: "Upload Your Own", desc: "Provide your own white ink layer (PNG, white = print)" },
];

/**
 * Check if a material requires white ink options.
 * @param {string} materialId
 * @returns {boolean}
 */
export function needsWhiteInk(materialId) {
  return WHITE_INK_MATERIALS.includes(materialId);
}

/**
 * Upload a blob (generated or user-provided) to the server
 * via /api/design-studio/upload-snapshot and return persistent URL + key.
 */
async function uploadWhiteInkBlob(blob, filename = "white-ink-layer.png") {
  const form = new FormData();
  form.append("file", blob, filename);
  const res = await fetch("/api/design-studio/upload-snapshot", {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Upload failed");
  }
  return res.json(); // { url, key }
}

/**
 * White ink step for sticker/label order pages.
 * Only renders when material is transparent AND artwork is uploaded.
 *
 * onChange signature:
 *   { enabled, mode, whiteInkUrl, whiteInkKey, whiteInkWidth, whiteInkHeight }
 *   — all URLs are server-persisted (not blob/object URLs)
 */
export default function WhiteInkStep({ materialId, artworkUrl, onChange }) {
  const [enabled, setEnabled] = useState(true);
  const [mode, setMode] = useState("auto");
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [error, setError] = useState(null);
  const genIdRef = useRef(0);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Core generation function: generate on canvas, upload to server, notify parent
  const runGeneration = useCallback((genMode, url) => {
    if (!url || genMode === "upload") return;
    const id = ++genIdRef.current;
    setGenerating(true);
    setError(null);
    setPreviewUrl(null);
    // Immediately tell parent: white ink is in-flight, URL not ready yet
    onChangeRef.current?.({ enabled: true, mode: genMode, whiteInkUrl: null, whiteInkKey: null, whiteInkWidth: null, whiteInkHeight: null });

    const gen = genMode === "auto" ? generateAutoWhite : generateFollowColor;
    gen(url)
      .then((result) => {
        if (genIdRef.current !== id) return;
        // Show local preview immediately while uploading
        setPreviewUrl(result.dataUrl);
        setUploading(true);
        // Upload the generated PNG to the server for persistence
        return uploadWhiteInkBlob(result.blob, `white-ink-${genMode}.png`)
          .then((uploaded) => {
            if (genIdRef.current !== id) return;
            onChangeRef.current?.({
              enabled: true,
              mode: genMode,
              whiteInkUrl: uploaded.url,
              whiteInkKey: uploaded.key,
              whiteInkWidth: result.width,
              whiteInkHeight: result.height,
            });
          });
      })
      .catch(() => {
        if (genIdRef.current !== id) return;
        setError("Could not generate white layer. Try uploading manually.");
        setPreviewUrl(null);
      })
      .finally(() => {
        if (genIdRef.current === id) {
          setGenerating(false);
          setUploading(false);
        }
      });
  }, []);

  // Auto-trigger generation on mount when conditions are met
  useEffect(() => {
    if (enabled && artworkUrl && mode !== "upload") {
      runGeneration(mode, artworkUrl);
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      if (!next) {
        // Turning off: clear everything
        setPreviewUrl(null);
        genIdRef.current++;
        onChangeRef.current?.({ enabled: false, mode: null, whiteInkUrl: null, whiteInkKey: null, whiteInkWidth: null, whiteInkHeight: null });
      }
      return next;
    });
  }, []);

  // Re-enable: trigger regeneration after toggle back on
  const prevEnabledRef = useRef(enabled);
  useEffect(() => {
    if (enabled && !prevEnabledRef.current && artworkUrl && mode !== "upload") {
      runGeneration(mode, artworkUrl);
    }
    prevEnabledRef.current = enabled;
  }, [enabled, artworkUrl, mode, runGeneration]);

  const handleModeChange = useCallback((newMode) => {
    setMode(newMode);
    setPreviewUrl(null);
    setUploadedFile(null);
    setError(null);
    // Immediately invalidate parent data — old mode's asset must not carry over
    onChangeRef.current?.({ enabled: true, mode: newMode, whiteInkUrl: null, whiteInkKey: null, whiteInkWidth: null, whiteInkHeight: null });
    if (newMode !== "upload" && artworkUrl) {
      runGeneration(newMode, artworkUrl);
    }
  }, [artworkUrl, runGeneration]);

  const handleUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setUploadedFile(file);
    setUploading(true);
    setError(null);
    // Immediately tell parent: file selected but not yet persisted
    onChangeRef.current?.({ enabled: true, mode: "upload", whiteInkUrl: null, whiteInkKey: null, whiteInkWidth: null, whiteInkHeight: null });

    // Upload to server for persistence
    uploadWhiteInkBlob(file, file.name)
      .then((uploaded) => {
        onChangeRef.current?.({
          enabled: true,
          mode: "upload",
          whiteInkUrl: uploaded.url,
          whiteInkKey: uploaded.key,
          whiteInkWidth: null,
          whiteInkHeight: null,
        });
      })
      .catch(() => {
        setError("Upload failed. Please try again.");
        setPreviewUrl(null);
      })
      .finally(() => setUploading(false));
  }, []);

  if (!needsWhiteInk(materialId) || !artworkUrl) return null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">White Ink Layer</p>
          <p className="text-xs text-gray-500">Needed for your design to show on transparent material</p>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? "bg-teal-600" : "bg-gray-300"}`}
          aria-label="Toggle white ink"
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`} />
        </button>
      </div>

      {enabled && (
        <>
          <div className="grid grid-cols-3 gap-2">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => handleModeChange(m.id)}
                className={`rounded-xl border p-3 text-left transition-all ${
                  mode === m.id ? "border-teal-500 bg-teal-50 ring-1 ring-teal-500" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <p className="text-xs font-semibold text-gray-900">{m.label}</p>
                <p className="mt-0.5 text-[10px] text-gray-500 leading-tight">{m.desc}</p>
              </button>
            ))}
          </div>

          {mode === "upload" && (
            <label className="flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-300 p-4 hover:border-teal-400 transition-colors">
              <input type="file" accept="image/png" className="sr-only" onChange={handleUpload} />
              <span className="text-sm text-gray-600">
                {uploadedFile ? uploadedFile.name : "Click to upload white layer (PNG)"}
              </span>
            </label>
          )}

          {(generating || uploading) && (
            <div className="flex items-center gap-2 py-3">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
              <span className="text-xs text-gray-500">
                {generating ? "Generating white ink layer…" : "Uploading…"}
              </span>
            </div>
          )}

          {error && <p className="text-xs text-red-600">{error}</p>}

          {previewUrl && !generating && (
            <div className="rounded-xl border border-gray-200 bg-[#333] p-3">
              <p className="mb-2 text-[10px] font-semibold uppercase text-gray-400">White Ink Preview</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="White ink layer preview" className="mx-auto max-h-48 rounded" />
              <p className="mt-1 text-center text-[9px] text-gray-500">
                White areas = where white ink will be printed under your design
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
