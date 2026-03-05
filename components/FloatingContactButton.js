"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function FloatingContactButton() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <div className="fab-contact fixed right-4 z-40 md:bottom-20 md:right-6">
      {/* Expanded contact options */}
      {open && (
        <div className="mb-3 flex flex-col gap-2 items-end animate-in fade-in slide-in-from-bottom-2 duration-200">
          <a
            href="tel:+16478869288"
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
            (647) 886-9288
          </a>
          <a
            href="mailto:info@lunarprint.ca"
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            info@lunarprint.ca
          </a>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              window.dispatchEvent(new CustomEvent("open-chat"));
            }}
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            <svg className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
            {t("nav.contact")}
          </button>
        </div>
      )}

      {/* Main FAB button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-200 ${
          open
            ? "bg-gray-800 text-[#fff] rotate-45"
            : "bg-[var(--color-brand)] text-[#fff] hover:bg-[var(--color-brand-dark)] hover:scale-105"
        }`}
        aria-label="Contact us"
      >
        {open ? (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        ) : (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
        )}
      </button>
    </div>
  );
}
