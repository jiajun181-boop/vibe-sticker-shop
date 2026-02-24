"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { resizeImageFile } from "@/lib/client-image-resize";

/**
 * Floating "Upload Image" button rendered on frontend product pages.
 * Only visible when admin_session cookie exists (logged-in admin).
 */
export default function AdminUploadOverlay({ productId, productName }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    // Check for admin session cookie (HttpOnly=false cookie or session endpoint)
    // We ping the lightweight session endpoint to confirm admin status
    let cancelled = false;
    fetch("/api/admin/session")
      .then((r) => { if (r.ok && !cancelled) setIsAdmin(true); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const filenameToAlt = (name) =>
    String(name || "")
      .replace(/\.[^.]+$/, "")
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();

  const handleUpload = useCallback(async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (fileRef.current) fileRef.current.value = "";

    setUploading(true);
    setDone(false);

    try {
      for (const rawFile of files) {
        const file = await resizeImageFile(rawFile);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("altText", productName || filenameToAlt(file.name));
        formData.append("tags", "product");

        const uploadRes = await fetch("/api/admin/assets", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");

        const asset = uploadData.asset;

        await fetch(`/api/admin/assets/${asset.id}/links`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entityType: "product", entityId: productId, purpose: "gallery" }),
        });

        await fetch(`/api/admin/products/${productId}/images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: asset.originalUrl, alt: asset.altText }),
        });
      }
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (err) {
      alert("Upload failed: " + (err.message || "Unknown error"));
    } finally {
      setUploading(false);
    }
  }, [productId, productName]);

  if (!isAdmin) return null;

  return (
    <div className="absolute bottom-3 right-3 z-30">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={handleUpload}
      />
      {/* Mobile: 48px icon-only circle · Desktop: icon+text pill */}
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-black/80 text-[#fff] shadow-lg backdrop-blur transition-all hover:bg-black disabled:opacity-60 sm:h-auto sm:w-auto sm:gap-1.5 sm:rounded-lg sm:px-3 sm:py-2 sm:text-xs sm:font-semibold"
        title="Admin: Upload product image"
      >
        {uploading ? (
          <>
            <svg className="h-5 w-5 animate-spin sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <span className="hidden sm:inline">Uploading...</span>
          </>
        ) : done ? (
          <>
            <svg className="h-5 w-5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="hidden sm:inline">Done! Reload to see</span>
          </>
        ) : (
          <>
            <svg className="h-5 w-5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
            <span className="hidden sm:inline">Upload Image</span>
          </>
        )}
      </button>
    </div>
  );
}
