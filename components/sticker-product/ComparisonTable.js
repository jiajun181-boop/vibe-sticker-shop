"use client";

import Link from "next/link";

/**
 * Cross-type comparison table.
 *
 * Props:
 *  - tableData: { columns: [{ id, label, slug }], rows: [{ label, values: { [id]: string } }] }
 *  - currentTypeId: the highlighted column id
 *  - category: category slug for building links
 */
export default function ComparisonTable({ tableData, currentTypeId, category, title = "Compare Sticker Types" }) {
  if (!tableData) return null;
  const { columns, rows } = tableData;

  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {title}
      </h2>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                Feature
              </th>
              {columns.map((col) => (
                <th
                  key={col.id}
                  className={`px-4 py-3 text-center text-xs font-bold uppercase tracking-wider ${
                    col.id === currentTypeId
                      ? "bg-gray-900 text-white"
                      : "bg-gray-50 text-gray-500"
                  }`}
                >
                  {col.id === currentTypeId ? (
                    <span className="flex items-center justify-center gap-1.5">
                      {col.label}
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    </span>
                  ) : (
                    <Link
                      href={`/shop/${category}/${col.slug}`}
                      className="text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      {col.label}
                    </Link>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? "" : "bg-gray-50/50"}>
                <td className="sticky left-0 z-10 bg-white px-4 py-3 font-medium text-gray-700 border-r border-gray-100">
                  {row.label}
                </td>
                {columns.map((col) => (
                  <td
                    key={col.id}
                    className={`px-4 py-3 text-center text-gray-600 ${
                      col.id === currentTypeId
                        ? "bg-gray-900/5 font-medium text-gray-900"
                        : ""
                    }`}
                  >
                    {row.values[col.id] || "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
