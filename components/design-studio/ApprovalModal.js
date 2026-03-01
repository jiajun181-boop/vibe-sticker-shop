"use client";

import { useState, useEffect, useCallback } from "react";
import { useEditorStore } from "@/lib/design-studio/editor-store";
import { runPreflight } from "@/lib/design-studio/preflight";
import { exportForApproval } from "@/lib/design-studio/export-pipeline";
import { uploadDesignSnapshot } from "@/lib/design-studio/upload-snapshot";
import { useCartStore } from "@/lib/store";

const CHECKLIST_ITEMS = [
  "All text is spelled correctly and content is accurate",
  "Colors are acceptable (screen colors may differ from print)",
  "Important content is inside the safe area and won't be trimmed",
];

/**
 * Approve for Production modal with 4-step flow:
 * review → checklist → uploading → done
 */
export default function ApprovalModal({
  open,
  onClose,
  fabricRef,
  productSpec,
  cartItemContext,
}) {
  const [step, setStep] = useState("review"); // review | checklist | uploading | done
  const [preflightResult, setPreflightResult] = useState(null);
  const [checkedItems, setCheckedItems] = useState([false, false, false]);
  const [uploadProgress, setUploadProgress] = useState("");
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const { setApprovalStatus, setApprovedUploadUrls } = useEditorStore();
  const { addItem, openCart, showToast } = useCartStore();

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setStep("review");
      setCheckedItems([false, false, false]);
      setError(null);
      setUploadProgress("");
      setPreviewUrl(null);

      // Run preflight
      const canvas = fabricRef?.current;
      if (canvas && productSpec) {
        const result = runPreflight(canvas, productSpec);
        setPreflightResult(result);

        // Generate preview
        try {
          const dataUrl = canvas.toDataURL({ format: "png", quality: 0.8 });
          setPreviewUrl(dataUrl);
        } catch {
          // Preview generation failed, non-critical
        }
      }
    }
  }, [open, fabricRef, productSpec]);

  const handleCheckToggle = useCallback((index) => {
    setCheckedItems((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  }, []);

  const allChecked = checkedItems.every(Boolean);

  const handleUploadAndApprove = useCallback(async () => {
    const canvas = fabricRef?.current;
    if (!canvas || !productSpec) return;

    setStep("uploading");
    setError(null);

    try {
      // Step 1: Export
      setUploadProgress("Generating print-ready files...");
      const { pngBlob, pdfBlob } = await exportForApproval(canvas, productSpec);

      // Step 2: Upload PNG
      setUploadProgress("Uploading preview image...");
      const pngResult = await uploadDesignSnapshot(
        pngBlob,
        `design-${productSpec.slug}-${Date.now()}.png`
      );

      // Step 3: Upload PDF
      setUploadProgress("Uploading print-ready PDF...");
      const pdfResult = await uploadDesignSnapshot(
        pdfBlob,
        `design-${productSpec.slug}-${Date.now()}.pdf`
      );

      // Store upload URLs
      setApprovedUploadUrls({
        pngUrl: pngResult.url,
        pdfUrl: pdfResult.url,
      });
      setApprovalStatus("approved");

      // Step 4: Add to cart
      setUploadProgress("Adding to cart...");
      const cartItem = {
        id: cartItemContext?.id || productSpec.slug,
        slug: cartItemContext?.slug || productSpec.slug,
        name: cartItemContext?.name || productSpec.label,
        price: cartItemContext?.price || 0,
        quantity: cartItemContext?.qty || 1,
        options: {
          ...(cartItemContext?.options || {}),
          designStudio: true,
          artworkUrl: pngResult.url,
          artworkPdfUrl: pdfResult.url,
          artworkKey: pngResult.key,
          proofConfirmed: true,
          designApprovedAt: new Date().toISOString(),
          widthIn: productSpec.widthIn,
          heightIn: productSpec.heightIn,
        },
      };

      addItem(cartItem);
      setStep("done");
    } catch (err) {
      console.error("[ApprovalModal] Upload failed:", err);
      setError(err.message || "Upload failed. Please try again.");
      setStep("checklist"); // Go back so they can retry
    }
  }, [
    fabricRef,
    productSpec,
    cartItemContext,
    addItem,
    setApprovalStatus,
    setApprovedUploadUrls,
  ]);

  const handleDone = useCallback(() => {
    showToast("Design approved and added to cart!", "success", {
      label: "View Cart",
      onClick: () => openCart(),
    });
    openCart();
    onClose();
  }, [showToast, openCart, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={step !== "uploading" ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative mx-4 w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">
            {step === "review" && "Review Your Design"}
            {step === "checklist" && "Confirm for Production"}
            {step === "uploading" && "Processing..."}
            {step === "done" && "Design Approved!"}
          </h2>
          {step !== "uploading" && (
            <button
              onClick={onClose}
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          {/* Step 1: Review */}
          {step === "review" && (
            <div className="space-y-4">
              {/* Preview */}
              {previewUrl && (
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                  <img
                    src={previewUrl}
                    alt="Design preview"
                    className="mx-auto max-h-64 object-contain p-2"
                  />
                </div>
              )}

              {/* Preflight results */}
              {preflightResult && (
                <div className="space-y-2">
                  {preflightResult.errors.length > 0 && (
                    <div className="space-y-1">
                      {preflightResult.errors.map((err, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
                        >
                          <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                          </svg>
                          {err.message}
                        </div>
                      ))}
                    </div>
                  )}

                  {preflightResult.warnings.length > 0 && (
                    <div className="space-y-1">
                      {preflightResult.warnings.map((warn, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700"
                        >
                          <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                          </svg>
                          {warn.message}
                        </div>
                      ))}
                    </div>
                  )}

                  {preflightResult.passed && preflightResult.warnings.length === 0 && (
                    <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      All preflight checks passed!
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Checklist */}
          {step === "checklist" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Please confirm the following before we prepare your design for printing:
              </p>
              <div className="space-y-3">
                {CHECKLIST_ITEMS.map((item, i) => (
                  <label
                    key={i}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 px-4 py-3 transition-colors hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={checkedItems[i]}
                      onChange={() => handleCheckToggle(i)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700">{item}</span>
                  </label>
                ))}
              </div>
              {error && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Uploading */}
          {step === "uploading" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-emerald-600" />
              <p className="text-sm font-medium text-gray-600">
                {uploadProgress}
              </p>
              <p className="text-xs text-gray-400">
                Please don't close this window
              </p>
            </div>
          )}

          {/* Step 4: Done */}
          {step === "done" && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900">
                  Design Approved!
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Your design has been added to your cart. Proceed to checkout when ready.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
          {step === "review" && (
            <>
              <button
                onClick={onClose}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Back to Editing
              </button>
              <button
                onClick={() => setStep("checklist")}
                disabled={!preflightResult?.passed}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {preflightResult?.passed
                  ? "Continue"
                  : "Fix Errors to Continue"}
              </button>
            </>
          )}

          {step === "checklist" && (
            <>
              <button
                onClick={() => setStep("review")}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleUploadAndApprove}
                disabled={!allChecked}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                Approve & Add to Cart
              </button>
            </>
          )}

          {step === "done" && (
            <button
              onClick={handleDone}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              View Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
