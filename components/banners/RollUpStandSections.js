"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";

const INCLUDED_ITEMS = [
  "Retractable aluminum base with adjustable pole",
  "Full-color printed banner (vinyl or fabric)",
  "Nylon carrying bag",
  "Top rail & bottom rail with adhesive strip",
  "Assembly instructions card",
];

const SETUP_STEPS = [
  { title: "Unpack", desc: "Remove the stand base and pole sections from the carrying bag." },
  { title: "Extend pole", desc: "Connect the telescoping pole sections and insert into the base." },
  { title: "Pull up banner", desc: "Gently pull the banner up from the base using the top rail handle." },
  { title: "Attach to pole", desc: "Hook the top rail onto the pole at the desired height. Adjust tension." },
  { title: "Position", desc: "Place on a flat surface. Adjust the swivel feet for stability if available." },
];

const STAND_COMPARISON = [
  { feature: "Base Width", economy: '10"', standard: '12"', premium: '14"' },
  { feature: "Material", economy: "Aluminum", standard: "Aluminum", premium: "Aluminum + Steel" },
  { feature: "Banner Changes", economy: "Non-swappable", standard: "Swappable", premium: "Swappable" },
  { feature: "Warranty", economy: "6 months", standard: "1 year", premium: "2 years" },
  { feature: "Best For", economy: "Single events", standard: "Repeated use", premium: "Premium displays" },
];

export default function RollUpStandSections() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("included");

  return (
    <div className="mt-16 space-y-16">
      {/* ── Tab bar ── */}
      <section>
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex gap-6 overflow-x-auto scrollbar-hide">
            {[
              { id: "included", label: t("banner.stand.whatsIncluded") },
              { id: "setup", label: t("banner.stand.setupGuide") },
              { id: "compare", label: t("banner.stand.compareStands") },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-6">
          {activeTab === "included" && (
            <div className="space-y-3">
              {INCLUDED_ITEMS.map((item, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white px-4 py-3">
                  <svg className="h-5 w-5 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === "setup" && (
            <div className="space-y-4">
              {SETUP_STEPS.map((step, i) => (
                <div key={i} className="flex items-start gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{step.title}</h3>
                    <p className="mt-0.5 text-sm text-gray-500">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "compare" && (
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-900 text-white">
                    <th className="px-4 py-3 text-left font-medium">Feature</th>
                    <th className="px-4 py-3 text-left font-medium">Economy</th>
                    <th className="px-4 py-3 text-left font-medium">Standard</th>
                    <th className="px-4 py-3 text-left font-medium">Premium</th>
                  </tr>
                </thead>
                <tbody>
                  {STAND_COMPARISON.map((row, i) => (
                    <tr key={row.feature} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-4 py-2.5 font-medium text-gray-900">{row.feature}</td>
                      <td className="px-4 py-2.5 text-gray-600">{row.economy}</td>
                      <td className="px-4 py-2.5 text-gray-600">{row.standard}</td>
                      <td className="px-4 py-2.5 text-gray-600">{row.premium}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
