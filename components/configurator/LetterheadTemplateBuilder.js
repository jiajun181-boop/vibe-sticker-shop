"use client";

import { useCallback, useRef, useState } from "react";
import { UploadButton } from "@/utils/uploadthing";
import { showErrorToast } from "@/components/Toast";

/**
 * Simple letterhead template builder.
 * Users place their logo and edit company info text,
 * or skip the template and upload their own design.
 *
 * Props:
 *  - onTemplateData(data)  — called with { logo, fields } when data changes
 *  - t                     — translation function
 */
export default function LetterheadTemplateBuilder({ onTemplateData, t }) {
  const [logo, setLogo] = useState(null); // { url, name }
  const [fields, setFields] = useState({
    companyName: "",
    tagline: "",
    address: "",
    phone: "",
    email: "",
    website: "",
  });

  const update = useCallback(
    (key, value) => {
      setFields((prev) => {
        const next = { ...prev, [key]: value };
        onTemplateData?.({ logo, fields: next });
        return next;
      });
    },
    [logo, onTemplateData]
  );

  const handleLogoUploaded = useCallback(
    (file) => {
      setLogo(file);
      onTemplateData?.({ logo: file, fields });
    },
    [fields, onTemplateData]
  );

  const removeLogo = useCallback(() => {
    setLogo(null);
    onTemplateData?.({ logo: null, fields });
  }, [fields, onTemplateData]);

  const hasContent =
    logo || Object.values(fields).some((v) => v.trim().length > 0);

  return (
    <div className="space-y-4">
      {/* Live Preview */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="bg-gray-50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
          {t?.("letterhead.preview") || "Preview"}
        </div>
        <div className="p-4">
          <div
            className="relative mx-auto border border-gray-200 bg-white shadow-sm"
            style={{ width: "100%", maxWidth: 340, aspectRatio: "8.5 / 11" }}
          >
            {/* Header area with logo + company name */}
            <div className="flex items-start gap-3 border-b border-gray-200 px-5 py-4"
              style={{ minHeight: "22%" }}
            >
              {/* Logo */}
              <div className="flex-shrink-0">
                {logo ? (
                  <img
                    src={logo.url}
                    alt="Logo"
                    className="h-12 w-12 rounded object-contain"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded border-2 border-dashed border-gray-300 bg-gray-50">
                    <svg
                      className="h-5 w-5 text-gray-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
                      />
                    </svg>
                  </div>
                )}
              </div>
              {/* Company info */}
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-sm font-bold text-gray-900"
                  style={{ fontSize: "clamp(10px, 2.5vw, 14px)" }}
                >
                  {fields.companyName || (
                    <span className="text-gray-300">Your Company Name</span>
                  )}
                </p>
                {(fields.tagline || !hasContent) && (
                  <p
                    className="truncate text-gray-500"
                    style={{ fontSize: "clamp(7px, 1.8vw, 10px)" }}
                  >
                    {fields.tagline || (
                      <span className="text-gray-300">Tagline or slogan</span>
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* Body area — simulated lines */}
            <div className="space-y-1.5 px-5 py-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="h-1.5 rounded-full bg-gray-100"
                  style={{ width: i === 7 ? "60%" : "100%" }}
                />
              ))}
            </div>

            {/* Footer area with contact info */}
            <div
              className="absolute bottom-0 left-0 right-0 border-t border-gray-200 px-5 py-2"
              style={{ fontSize: "clamp(6px, 1.5vw, 9px)" }}
            >
              <div className="flex flex-wrap justify-center gap-x-3 text-gray-500">
                {fields.address && <span>{fields.address}</span>}
                {fields.phone && <span>{fields.phone}</span>}
                {fields.email && <span>{fields.email}</span>}
                {fields.website && <span>{fields.website}</span>}
                {!fields.address &&
                  !fields.phone &&
                  !fields.email &&
                  !fields.website && (
                    <span className="text-gray-300">
                      123 Main St &bull; (555) 123-4567 &bull;
                      info@company.com
                    </span>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Input Fields */}
      <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
        {/* Logo Upload */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
            {t?.("letterhead.logo") || "Logo"}
          </label>
          {logo ? (
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <img
                src={logo.url}
                alt="Logo"
                className="h-8 w-8 rounded object-contain"
              />
              <span className="flex-1 truncate text-sm text-gray-700">
                {logo.name}
              </span>
              <button
                type="button"
                onClick={removeLogo}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-red-500"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ) : (
            <UploadButton
              endpoint="artworkUploader"
              onClientUploadComplete={(res) => {
                const first = Array.isArray(res) ? res[0] : null;
                if (!first) return;
                handleLogoUploaded({
                  url: first.ufsUrl || first.url,
                  key: first.key,
                  name: first.name,
                });
              }}
              onUploadError={(err) =>
                showErrorToast(err?.message || "Upload failed")
              }
              appearance={{
                button:
                  "ut-ready:bg-gray-900 ut-ready:hover:bg-gray-800 ut-uploading:bg-gray-600 rounded-full px-5 py-2 text-sm font-semibold text-white transition-colors",
                allowedContent: "hidden",
              }}
              content={{
                button: t?.("letterhead.uploadLogo") || "Upload Logo",
              }}
            />
          )}
        </div>

        {/* Text Fields */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label={t?.("letterhead.companyName") || "Company Name"}
            value={fields.companyName}
            onChange={(v) => update("companyName", v)}
            placeholder="Acme Corp"
            full
          />
          <Field
            label={t?.("letterhead.tagline") || "Tagline / Slogan"}
            value={fields.tagline}
            onChange={(v) => update("tagline", v)}
            placeholder="Your trusted partner"
            full
          />
          <Field
            label={t?.("letterhead.address") || "Address"}
            value={fields.address}
            onChange={(v) => update("address", v)}
            placeholder="123 Main St, Toronto, ON"
            full
          />
          <Field
            label={t?.("letterhead.phone") || "Phone"}
            value={fields.phone}
            onChange={(v) => update("phone", v)}
            placeholder="(555) 123-4567"
          />
          <Field
            label={t?.("letterhead.email") || "Email"}
            value={fields.email}
            onChange={(v) => update("email", v)}
            placeholder="info@company.com"
          />
          <Field
            label={t?.("letterhead.website") || "Website"}
            value={fields.website}
            onChange={(v) => update("website", v)}
            placeholder="www.company.com"
          />
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, full }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="mb-1 block text-xs font-medium text-gray-500">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
      />
    </div>
  );
}
