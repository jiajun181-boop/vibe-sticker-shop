"use client";

import { useState } from "react";

/**
 * Tabbed content panel — horizontal tabs on desktop, <details> accordion on mobile.
 *
 * Props:
 *  - tabs: { [key]: { label, rows?, content? } }
 *    - rows: [{ label, value }] — renders as a spec table
 *    - content: [{ heading, text }] — renders as text blocks
 */
export default function ProductDetailsTabs({ tabs }) {
  const keys = Object.keys(tabs || {});
  const [activeTab, setActiveTab] = useState(keys[0] || "");

  if (keys.length === 0) return null;

  return (
    <section>
      {/* Desktop: horizontal tab bar */}
      <div className="hidden sm:block">
        <div className="flex border-b border-gray-200">
          {keys.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`px-5 py-3 text-sm font-semibold transition-colors ${
                activeTab === key
                  ? "border-b-2 border-gray-900 text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tabs[key].label}
            </button>
          ))}
        </div>
        <div className="rounded-b-xl border border-t-0 border-gray-200 bg-white p-6">
          <TabContent tab={tabs[activeTab]} />
        </div>
      </div>

      {/* Mobile: accordion */}
      <div className="space-y-3 sm:hidden">
        {keys.map((key) => (
          <details
            key={key}
            className="group rounded-xl border border-gray-200 bg-white shadow-sm"
            open={key === keys[0]}
          >
            <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-semibold text-gray-900">
              {tabs[key].label}
              <svg
                className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-open:rotate-180"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="px-4 pb-4">
              <TabContent tab={tabs[key]} />
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

function TabContent({ tab }) {
  if (!tab) return null;

  // Spec table format
  if (tab.rows) {
    return (
      <table className="w-full text-sm">
        <tbody>
          {tab.rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : ""}>
              <td className="px-4 py-2.5 font-medium text-gray-700 w-1/3">
                {row.label}
              </td>
              <td className="px-4 py-2.5 text-gray-600">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  // Text block format
  if (tab.content) {
    return (
      <div className="space-y-5">
        {tab.content.map((block, i) => (
          <div key={i}>
            <h3 className="text-sm font-bold text-gray-900">{block.heading}</h3>
            <p className="mt-1 text-sm leading-relaxed text-gray-600">
              {block.text}
            </p>
          </div>
        ))}
      </div>
    );
  }

  return null;
}
