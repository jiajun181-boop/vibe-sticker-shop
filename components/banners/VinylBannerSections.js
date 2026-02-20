"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";

const TABS = ["specs", "installation", "fileGuidelines", "shipping"];

const SPECS = [
  { label: "Material", value: "13oz or 15oz scrim vinyl (PVC)" },
  { label: "Printing", value: "Full-color CMYK, UV-resistant eco-solvent inks" },
  { label: "Resolution", value: "720 \u00d7 1440 dpi" },
  { label: "Durability", value: "3\u20135 years outdoor, UV & water resistant" },
  { label: "Finishing", value: "Heat-welded hems, brass grommets, pole pockets" },
  { label: "Min Size", value: "1' \u00d7 1' (12\u2033 \u00d7 12\u2033)" },
  { label: "Max Size", value: "5' \u00d7 50' (single piece)" },
];

const INSTALLATION_TIPS = [
  "Use zip ties or bungee cords through grommets for temporary installation",
  "For permanent mounting, use screws with washers through grommets into a solid surface",
  "Pole pockets slide over standard 1\u2033 or 1.5\u2033 diameter poles",
  "Leave 6\u2033 clearance from edges when mounting near walls",
  "For wind-prone areas, consider mesh banners instead",
];

const FILE_GUIDELINES = [
  "File format: PDF, AI, EPS, or high-res JPG/PNG (300 DPI minimum)",
  "Color mode: CMYK for best color accuracy",
  "Bleed: Add 0.5\u2033 bleed on all sides",
  "Safe zone: Keep text and logos 1\u2033 from trim edges",
  "Font: Convert all text to outlines/curves",
  "Max file size: 200 MB per upload",
];

const SHIPPING_INFO = [
  "Standard shipping: 5\u20137 business days (free on orders over $150)",
  "Express shipping: 2\u20133 business days",
  "Local pickup available in Toronto (same day for rush orders)",
  "Banners are rolled for shipping to prevent creases",
  "Tracking number provided via email once shipped",
];

const USE_CASES = [
  { title: "Grand Openings", desc: "Announce your new business with bold, eye-catching banners" },
  { title: "Events & Festivals", desc: "Promote events, sponsors, and wayfinding signage" },
  { title: "Construction Sites", desc: "Project info boards, safety notices, and branding" },
  { title: "Sales & Promotions", desc: "Seasonal sales, clearance events, and special offers" },
];

const COMPARISON = [
  { feature: "Material", vinyl: "Solid PVC vinyl", mesh: "Perforated mesh" },
  { feature: "Wind Resistance", vinyl: "Moderate", mesh: "Excellent" },
  { feature: "Visibility", vinyl: "100% opaque", mesh: "~70% opaque" },
  { feature: "Best For", vinyl: "Indoor & calm outdoor", mesh: "High-wind outdoor" },
  { feature: "Double-Sided", vinyl: "Available", mesh: "Not available" },
  { feature: "Weight", vinyl: "13\u201315 oz/sq yd", mesh: "8\u20139 oz/sq yd" },
  { feature: "Durability", vinyl: "3\u20135 years", mesh: "3\u20135 years" },
];

const FAQ = [
  { q: "How long do vinyl banners last outdoors?", a: "With proper care, vinyl banners last 3\u20135 years outdoors. UV-resistant inks and reinforced hems extend lifespan." },
  { q: "Can I get a double-sided banner?", a: "Yes! Select the double-sided option in the configurator. We print on both sides with a blockout layer in between to prevent show-through." },
  { q: "What finishing should I choose?", a: "Grommets are best for hanging with ropes or zip ties. Pole pockets work for pole-mounted displays. Hemmed edges give a clean look for framed mounting." },
  { q: "Do you offer same-day banner printing?", a: "Yes, rush orders with same/next day turnaround are available for an additional 30% surcharge. Select Rush in the turnaround step." },
  { q: "What file format should I send?", a: "We accept PDF, AI, EPS, JPG, and PNG. For best results, provide a 300 DPI CMYK PDF with 0.5\u2033 bleed." },
  { q: "Can I order a custom size not listed?", a: "Absolutely! Use the custom size input (feet + inches) to enter any dimensions. Min 1\u00d71 ft, max 5\u00d750 ft." },
  { q: "How are banners shipped?", a: "Banners are rolled (never folded) and shipped in sturdy tubes. Free shipping on orders over $150." },
];

export default function VinylBannerSections() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("specs");
  const [openFaq, setOpenFaq] = useState(null);

  const tabLabels = {
    specs: t("banner.tabs.specs"),
    installation: t("banner.tabs.installation"),
    fileGuidelines: t("banner.tabs.fileGuidelines"),
    shipping: t("banner.tabs.shipping"),
  };

  return (
    <div className="mt-16 space-y-16">
      {/* ── Tabs ── */}
      <section>
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex gap-6 overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                {tabLabels[tab]}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-6">
          {activeTab === "specs" && (
            <div className="overflow-hidden rounded-xl border border-gray-200">
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
          )}

          {activeTab === "installation" && (
            <ul className="space-y-3">
              {INSTALLATION_TIPS.map((tip, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-900 text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          )}

          {activeTab === "fileGuidelines" && (
            <ul className="space-y-2">
              {FILE_GUIDELINES.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          )}

          {activeTab === "shipping" && (
            <ul className="space-y-2">
              {SHIPPING_INFO.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25m-2.25 0h-2.25m0 0V4.5m0 10.5h2.25" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ── Use Cases ── */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900">{t("banner.useCases.title")}</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {USE_CASES.map((uc) => (
            <div key={uc.title} className="rounded-xl border border-gray-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-gray-900">{uc.title}</h3>
              <p className="mt-1 text-xs text-gray-500">{uc.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Vinyl vs Mesh Comparison ── */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900">{t("banner.comparison.title")}</h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-900 text-white">
                <th className="px-4 py-3 text-left font-medium">Feature</th>
                <th className="px-4 py-3 text-left font-medium">Vinyl Banner</th>
                <th className="px-4 py-3 text-left font-medium">Mesh Banner</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row, i) => (
                <tr key={row.feature} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-4 py-2.5 font-medium text-gray-900">{row.feature}</td>
                  <td className="px-4 py-2.5 text-gray-600">{row.vinyl}</td>
                  <td className="px-4 py-2.5 text-gray-600">{row.mesh}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
