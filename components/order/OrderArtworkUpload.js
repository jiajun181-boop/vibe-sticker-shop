"use client";

import { useState } from "react";
import { UploadButton } from "@/utils/uploadthing";

const PREFLIGHT_COLORS = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

/**
 * Post-order artwork upload component.
 * Works for both authenticated (account) and guest (track-order) flows.
 *
 * Props:
 *   orderId        — order ID
 *   email          — customer email (guest flow)
 *   isGuest        — true = guest flow (email verification)
 *   itemsNeeding   — [{ id, productName }] items that need artwork
 *   existingFiles  — [{ id, fileName, preflightStatus, createdAt }]
 *   onUploadComplete — callback after successful upload
 */
export default function OrderArtworkUpload({
  orderId,
  email,
  isGuest = false,
  itemsNeeding = [],
  existingFiles = [],
  onUploadComplete,
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [recentUploads, setRecentUploads] = useState([]);

  const hasItemsNeeding = itemsNeeding.length > 0;

  async function linkFileToOrder(file) {
    const payload = {
      fileUrl: file.ufsUrl || file.url,
      fileName: file.name,
      storageKey: file.key,
      mimeType: file.type,
      sizeBytes: file.size,
      itemId: selectedItemId || undefined,
    };

    let res;
    if (isGuest) {
      res = await fetch("/api/orders/upload-artwork", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, orderId, ...payload }),
      });
    } else {
      res = await fetch(`/api/account/orders/${orderId}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to link file");
    }
    return res.json();
  }

  // Nothing to show if no items need artwork and no existing files
  if (!hasItemsNeeding && existingFiles.length === 0 && recentUploads.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-[var(--color-gray-200)] overflow-hidden">
      <div className="border-b border-[var(--color-gray-200)] px-4 py-3 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-400)]">
          Artwork Files
        </p>
        {hasItemsNeeding && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
            {itemsNeeding.length} needed
          </span>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Items needing artwork */}
        {hasItemsNeeding && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
            <p className="text-sm font-medium text-amber-800">
              The following items need artwork:
            </p>
            <ul className="space-y-1">
              {itemsNeeding.map((item) => (
                <li key={item.id} className="flex items-center gap-2 text-sm text-amber-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  {item.productName}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Item selector (if multiple items need artwork) */}
        {itemsNeeding.length > 1 && (
          <div>
            <label className="block text-xs font-medium text-[var(--color-gray-600)] mb-1">
              Upload for which item?
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-gray-200)] bg-white px-3 py-2 text-sm text-[var(--color-gray-900)] focus:border-[var(--color-gray-400)] focus:outline-none"
            >
              <option value="">All items / general artwork</option>
              {itemsNeeding.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.productName}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Upload button */}
        {hasItemsNeeding && (
          <div className="space-y-2">
            <UploadButton
              endpoint={isGuest ? "guestArtworkUploader" : "artworkUploader"}
              onUploadBegin={() => {
                setUploading(true);
                setUploadError("");
              }}
              onClientUploadComplete={async (files) => {
                try {
                  for (const file of files) {
                    await linkFileToOrder(file);
                    setRecentUploads((prev) => [
                      { name: file.name, status: "pending", date: new Date().toISOString() },
                      ...prev,
                    ]);
                  }
                  onUploadComplete?.();
                } catch (err) {
                  setUploadError(err.message || "Upload failed");
                } finally {
                  setUploading(false);
                }
              }}
              onUploadError={(err) => {
                setUploadError(err.message || "Upload failed");
                setUploading(false);
              }}
              appearance={{
                button: `rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                  uploading
                    ? "bg-[var(--color-gray-200)] text-[var(--color-gray-500)] cursor-wait"
                    : "bg-[var(--color-gray-900)] text-[#fff] hover:bg-black"
                }`,
                allowedContent: "text-xs text-[var(--color-gray-400)]",
              }}
              content={{
                button: uploading ? "Uploading..." : "Upload Artwork",
                allowedContent: "Images & PDFs up to 16MB",
              }}
            />
            {uploadError && (
              <p className="text-xs text-red-600">{uploadError}</p>
            )}
          </div>
        )}

        {/* Existing + recent files */}
        {(existingFiles.length > 0 || recentUploads.length > 0) && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-[var(--color-gray-500)]">Uploaded files</p>
            <div className="space-y-1.5">
              {recentUploads.map((f, i) => (
                <div key={`recent-${i}`} className="flex items-center justify-between rounded-lg bg-[var(--color-gray-50)] px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <svg className="h-4 w-4 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-[var(--color-gray-700)] truncate">{f.name}</span>
                  </div>
                  <span className="text-[10px] font-medium text-emerald-600">Just uploaded</span>
                </div>
              ))}
              {existingFiles.map((f) => (
                <div key={f.id} className="flex items-center justify-between rounded-lg bg-[var(--color-gray-50)] px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <svg className="h-4 w-4 flex-shrink-0 text-[var(--color-gray-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <span className="text-sm text-[var(--color-gray-700)] truncate">{f.fileName}</span>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${PREFLIGHT_COLORS[f.preflightStatus] || PREFLIGHT_COLORS.pending}`}>
                    {f.preflightStatus || "pending"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
