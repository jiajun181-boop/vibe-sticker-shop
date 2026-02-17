"use client";

import { UploadButton } from "@/utils/uploadthing";
import { showErrorToast } from "@/components/Toast";

/**
 * Artwork upload section for configurators.
 *
 * Props:
 *  - uploadedFile: { url, key, name, size } | null
 *  - onUploaded(file)  — called with { url, key, name, size }
 *  - onRemove()        — clear the file
 *  - onBegin()         — optional tracking callback
 *  - slug              — product slug for tracking
 *  - t                 — translation function
 */
export default function ArtworkUpload({ uploadedFile, onUploaded, onRemove, onBegin, t }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white p-6 text-center transition-colors hover:border-gray-400">
      {uploadedFile ? (
        <div className="flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
            <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-800">{uploadedFile.name}</p>
            <p className="text-xs text-gray-400">
              {t?.("configurator.fileUploaded") || "File uploaded successfully"}
            </p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="ml-2 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-500"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
            <svg className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">
              {t?.("configurator.dragDrop") || "Drag & drop or click to upload"}
            </p>
            <p className="mt-1 text-xs text-gray-400">PDF, AI, PNG, JPG — Max 16 MB</p>
          </div>
          <UploadButton
            endpoint="artworkUploader"
            onUploadBegin={() => onBegin?.()}
            onClientUploadComplete={(res) => {
              const first = Array.isArray(res) ? res[0] : null;
              if (!first) return;
              onUploaded({
                url: first.ufsUrl || first.url,
                key: first.key,
                name: first.name,
                size: first.size,
              });
            }}
            onUploadError={(err) => showErrorToast(err?.message || "Upload failed")}
            appearance={{
              button: "ut-ready:bg-gray-900 ut-ready:hover:bg-gray-800 ut-uploading:bg-gray-600 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-colors",
              allowedContent: "hidden",
            }}
          />
        </div>
      )}
    </div>
  );
}
