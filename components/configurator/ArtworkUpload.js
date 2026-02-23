"use client";

import { useState } from "react";
import Link from "next/link";
import { UploadButton } from "@/utils/uploadthing";
import { showErrorToast } from "@/components/Toast";

const ARTWORK_OPTIONS = [
  {
    id: "upload",
    label: "Upload Print-Ready File Now",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
    ),
  },
  {
    id: "email-later",
    label: "Email Artwork Later",
    desc: "We'll send you instructions after checkout",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    ),
  },
  {
    id: "design-help",
    label: "Need Design Help?",
    desc: "Our designers will create your artwork",
    badge: "+$45",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
      </svg>
    ),
  },
];

/**
 * Artwork upload section with 3 radio options for configurators.
 *
 * Props:
 *  - uploadedFile: { url, key, name, size } | null
 *  - onUploaded(file)        — called with { url, key, name, size }
 *  - onRemove()              — clear the file
 *  - onBegin()               — optional tracking callback
 *  - artworkOption           — "upload" | "email-later" | "design-help" | null (controlled)
 *  - onArtworkOptionChange   — called with option id
 *  - slug                    — product slug for tracking
 *  - t                       — translation function
 */
export default function ArtworkUpload({
  uploadedFile,
  onUploaded,
  onRemove,
  onBegin,
  artworkOption: controlledOption,
  onArtworkOptionChange,
  t,
}) {
  // Internal state fallback if parent doesn't control
  const [internalOption, setInternalOption] = useState(null);
  const selectedOption = controlledOption !== undefined ? controlledOption : internalOption;

  const handleOptionChange = (id) => {
    if (onArtworkOptionChange) {
      onArtworkOptionChange(id);
    } else {
      setInternalOption(id);
    }
    // Clear uploaded file when switching away from upload
    if (id !== "upload" && uploadedFile) {
      onRemove?.();
    }
  };

  return (
    <div className="space-y-3">
      {/* Radio options */}
      {ARTWORK_OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => handleOptionChange(opt.id)}
          className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left transition-all ${
            selectedOption === opt.id
              ? "border-gray-900 bg-gray-50 shadow-sm"
              : "border-gray-200 bg-white hover:border-gray-400"
          }`}
        >
          {/* Radio circle */}
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
              selectedOption === opt.id ? "border-gray-900" : "border-gray-300"
            }`}
          >
            {selectedOption === opt.id && (
              <span className="h-2.5 w-2.5 rounded-full bg-gray-900" />
            )}
          </span>
          {/* Icon */}
          <span className={selectedOption === opt.id ? "text-gray-900" : "text-gray-400"}>
            {opt.icon}
          </span>
          {/* Label + desc */}
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${selectedOption === opt.id ? "text-gray-900" : "text-gray-700"}`}>
                {opt.label}
              </span>
              {opt.badge && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                  {opt.badge}
                </span>
              )}
            </span>
            {opt.desc && (
              <span className="block text-xs text-gray-400">{opt.desc}</span>
            )}
          </span>
        </button>
      ))}

      {/* Upload area — only when "upload" is selected */}
      {selectedOption === "upload" && (
        <div className="ml-8 rounded-2xl border-2 border-dashed border-gray-300 bg-white p-5 text-center transition-colors hover:border-gray-400">
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
              <Link
                href="/artwork-guidelines"
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 underline-offset-2 hover:text-gray-800 hover:underline"
              >
                View print-ready file requirements
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Email later note */}
      {selectedOption === "email-later" && (
        <div className="ml-8 rounded-xl bg-gray-50 px-4 py-3">
          <p className="text-sm text-gray-500">
            Send your artwork to <span className="font-medium text-gray-700">info@lunarprint.ca</span> after placing your order. Include your order number in the subject line.
          </p>
        </div>
      )}

      {/* Design help note */}
      {selectedOption === "design-help" && (
        <div className="ml-8 rounded-xl bg-amber-50 px-4 py-3">
          <p className="text-sm text-gray-600">
            A designer will contact you within 1 business day to discuss your project. Design fee of <span className="font-bold text-amber-700">$45.00</span> will be added to your order.
          </p>
        </div>
      )}
    </div>
  );
}
