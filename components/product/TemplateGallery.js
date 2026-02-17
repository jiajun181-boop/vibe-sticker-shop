"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function TemplateGallery({ templates }) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(null);

  if (!Array.isArray(templates) || templates.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-5">
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-gray-600)]">
        {t("bc.templates")}
      </h3>
      <p className="mt-1 text-xs text-[var(--color-gray-500)]">{t("bc.templatesHint")}</p>

      <div className="mt-3 grid grid-cols-2 gap-3">
        {templates.map((tmpl, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setSelected(i)}
            className="group relative overflow-hidden rounded-xl border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] transition-all hover:border-[var(--color-gray-400)] hover:shadow-sm"
          >
            <div className="aspect-[3.5/2] relative">
              {tmpl.url ? (
                <Image
                  src={tmpl.url}
                  alt={tmpl.alt || `Template ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 40vw, 20vw"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--color-gray-100)] to-[var(--color-gray-200)]">
                  <div className="text-center">
                    <svg className="mx-auto h-6 w-6 text-[var(--color-gray-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                    </svg>
                    <p className="mt-1 text-[10px] text-[var(--color-gray-400)]">{tmpl.alt || `Template ${i + 1}`}</p>
                  </div>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox overlay */}
      {selected !== null && templates[selected] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative max-h-[80vh] max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[var(--color-gray-700)] shadow-sm hover:bg-white"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="aspect-[3.5/2] relative w-[min(600px,90vw)]">
              {templates[selected].url ? (
                <Image
                  src={templates[selected].url}
                  alt={templates[selected].alt || `Template ${selected + 1}`}
                  fill
                  className="object-contain"
                  sizes="600px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[var(--color-gray-100)]">
                  <p className="text-sm text-[var(--color-gray-500)]">{templates[selected].alt || "Template preview"}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
