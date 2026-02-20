"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";

const SPECS = [
  { label: "Material", value: "8oz or 9oz mesh banner (perforated PVC)" },
  { label: "Printing", value: "Single-sided, full-color CMYK eco-solvent inks" },
  { label: "Resolution", value: "720 \u00d7 1440 dpi" },
  { label: "Wind Permeability", value: "~30% airflow through micro-perforations" },
  { label: "Durability", value: "3\u20135 years outdoor, UV & water resistant" },
  { label: "Finishing", value: "Heat-welded hems, brass grommets, wind slits" },
  { label: "Min Size", value: "1' \u00d7 1' (12\u2033 \u00d7 12\u2033)" },
  { label: "Max Size", value: "6' \u00d7 50' (single piece)" },
];

const FAQ = [
  { q: "Why choose mesh over vinyl?", a: "Mesh banners allow wind to pass through, making them ideal for windy outdoor locations like fences, scaffolding, and building facades." },
  { q: "Can mesh banners be double-sided?", a: "No. Mesh is perforated so light passes through, making double-sided printing impractical. For double-sided banners, choose vinyl instead." },
  { q: "Are mesh banners see-through?", a: "Slightly. Mesh has about 70% opacity, so they are semi-transparent when backlit. Graphics remain vibrant and clearly visible from the front." },
  { q: "What finishing options are available?", a: "We offer hemmed edges with brass grommets (standard) or wind slits for extra wind resistance in extreme conditions." },
];

export default function MeshBannerSections() {
  const { t } = useTranslation();
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="mt-16 space-y-16">
      {/* ── Wind Resistance Callout ── */}
      <section className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
            <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 12h6.75m0 0l-3.375-3.375M10.25 12l-3.375 3.375M17.5 6.5c1.5 0 3 1 3 2.5s-1.5 2.5-3 2.5h-3M17.5 17.5c1.5 0 3-1 3-2.5s-1.5-2.5-3-2.5h-5" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-blue-900">{t("banner.mesh.windCallout.title")}</h3>
            <p className="mt-1 text-sm text-blue-700">{t("banner.mesh.windCallout.text")}</p>
          </div>
        </div>
      </section>

      {/* ── Specifications ── */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900">{t("banner.tabs.specs")}</h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <tbody>
              {SPECS.map((row, i) => (
                <tr key={row.label} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-4 py-3 font-medium text-gray-900 w-40">{row.label}</td>
                  <td className="px-4 py-3 text-gray-600">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Compare link ── */}
      <section className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <span className="text-sm text-gray-700">{t("banner.mesh.compareHint")}</span>
        <Link href="/order/vinyl-banners" className="text-sm font-semibold text-gray-900 underline underline-offset-2 hover:text-gray-700">
          {t("banner.mesh.compareLink")}
        </Link>
      </section>

      {/* ── FAQ ── */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900">{t("banner.faq.title")}</h2>
        <div className="mt-4 divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white">
          {FAQ.map((item, i) => (
            <div key={i}>
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-gray-900 hover:bg-gray-50"
              >
                {item.q}
                <svg
                  className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 text-sm text-gray-600">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
