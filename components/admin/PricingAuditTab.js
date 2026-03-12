"use client";

// components/admin/PricingAuditTab.js
// ═══════════════════════════════════════════════════════════════════
// Read-only pricing audit display for the Materials page.
// Fetches from GET /api/admin/pricing/audit and shows:
//   - Summary stats
//   - Pricing source breakdown
//   - Material gaps
//   - Hardware gaps
//   - Product completeness table (with filters)
// ═══════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useMemo, useState } from "react";

// ── Status badge colors ──────────────────────────────────────────
const SOURCE_COLORS = {
  PRESET: "bg-blue-100 text-blue-800",
  FIXED: "bg-indigo-100 text-indigo-800",
  TEMPLATE: "bg-green-100 text-green-800",
  LEGACY: "bg-amber-100 text-amber-800",
  QUOTE_ONLY: "bg-gray-100 text-gray-600",
  MISSING: "bg-red-100 text-red-800",
};

const COMPLETENESS_COLORS = {
  COMPLETE: "bg-emerald-100 text-emerald-800",
  PARTIAL: "bg-yellow-100 text-yellow-800",
  MISSING: "bg-red-100 text-red-800",
};

function Badge({ label, colorClass }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${colorClass}`}>
      {label}
    </span>
  );
}

function StatCard({ label, value, sub, alert }) {
  return (
    <div className={`rounded-lg border p-4 ${alert ? "border-red-200 bg-red-50" : "border-gray-200 bg-white"}`}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
      <p className={`mt-1 text-2xl font-black ${alert ? "text-red-700" : "text-gray-900"}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

export default function PricingAuditTab() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sourceFilter, setSourceFilter] = useState("all");
  const [completenessFilter, setCompletenessFilter] = useState("all");

  const fetchAudit = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/pricing/audit");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setReport(data);
    } catch (err) {
      setError(err.message || "Failed to load audit data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAudit(); }, [fetchAudit]);

  const filteredRows = useMemo(() => {
    if (!report) return [];
    return report.productRows.filter((row) => {
      if (sourceFilter !== "all" && row.pricingSourceKind !== sourceFilter) return false;
      if (completenessFilter !== "all" && row.completenessStatus !== completenessFilter) return false;
      return true;
    });
  }, [report, sourceFilter, completenessFilter]);

  if (loading) {
    return (
      <div className="space-y-4 py-8">
        {[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm font-bold text-red-700">Audit load failed: {error}</p>
        <button onClick={fetchAudit} className="mt-2 text-sm text-red-600 underline hover:text-red-800">
          Retry
        </button>
      </div>
    );
  }

  if (!report) return null;

  const { summary, materialGaps, hardwareGaps, templateGroups } = report;
  const bd = summary.pricingSourceBreakdown;

  return (
    <div className="space-y-6">
      {/* ── Summary Cards ───────────────────────────────────────── */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">
            Pricing Audit <span className="text-xs font-normal text-gray-400">Live · Read-Only</span>
          </h2>
          <button
            onClick={fetchAudit}
            className="rounded border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Active Products" value={summary.activeProductCount} />
          <StatCard label="Missing Price" value={summary.productsMissingPrice} alert={summary.productsMissingPrice > 0} />
          <StatCard label="Zero-Cost Materials" value={summary.materialsWithZeroCost} alert={summary.materialsWithZeroCost > 0} />
          <StatCard label="Suspicious Hardware" value={summary.suspiciousHardwarePrices} alert={summary.suspiciousHardwarePrices > 0} />
          <StatCard label="Missing displayFromPrice" value={summary.productsMissingDisplayFromPrice} alert={summary.productsMissingDisplayFromPrice > 0} />
        </div>
      </div>

      {/* ── Pricing Source Breakdown ────────────────────────────── */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-bold text-gray-700">Pricing Source Breakdown</h3>
        <div className="flex flex-wrap gap-3">
          {[
            { key: "preset", label: "Preset", count: bd.preset },
            { key: "fixed", label: "Fixed Table", count: bd.fixed },
            { key: "template", label: "Template", count: bd.template },
            { key: "legacy", label: "Legacy", count: bd.legacy },
            { key: "quoteOnly", label: "Quote Only", count: bd.quoteOnly },
            { key: "missing", label: "Missing", count: bd.missing },
          ].map(({ key, label, count }) => (
            <div key={key} className="flex items-center gap-1.5">
              <Badge label={label} colorClass={SOURCE_COLORS[key.toUpperCase()] || SOURCE_COLORS[label.toUpperCase().replace(/ /g, "_")] || "bg-gray-100 text-gray-600"} />
              <span className={`text-sm font-bold ${count === 0 ? "text-gray-300" : "text-gray-800"}`}>{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Material Gaps ───────────────────────────────────────── */}
      {materialGaps.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-bold text-red-700">
            Material Gaps ({materialGaps.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 pr-4">Name</th>
                  <th className="pb-2 pr-4">Type</th>
                  <th className="pb-2 pr-4">$/sqft</th>
                  <th className="pb-2 pr-4">Roll $</th>
                  <th className="pb-2">Issue</th>
                </tr>
              </thead>
              <tbody>
                {materialGaps.map((g) => (
                  <tr key={g.materialId} className="border-b border-gray-50">
                    <td className="py-1.5 pr-4 font-medium text-gray-800">{g.name}</td>
                    <td className="py-1.5 pr-4 text-gray-500">{g.type}</td>
                    <td className="py-1.5 pr-4 font-mono">${g.costPerSqft.toFixed(2)}</td>
                    <td className="py-1.5 pr-4 font-mono">${g.rollCost.toFixed(2)}</td>
                    <td className="py-1.5">
                      <Badge
                        label={g.issue.replace(/_/g, " ")}
                        colorClass={g.issue === "placeholder" ? "bg-orange-100 text-orange-800" : "bg-red-100 text-red-800"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Hardware Gaps ──────────────────────────────────────── */}
      {hardwareGaps.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-bold text-amber-700">
            Hardware Price Gaps ({hardwareGaps.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 pr-4">Name</th>
                  <th className="pb-2 pr-4">Category</th>
                  <th className="pb-2 pr-4">Price</th>
                  <th className="pb-2">Issue</th>
                </tr>
              </thead>
              <tbody>
                {hardwareGaps.map((g) => (
                  <tr key={g.hardwareId} className="border-b border-gray-50">
                    <td className="py-1.5 pr-4 font-medium text-gray-800">{g.name}</td>
                    <td className="py-1.5 pr-4 text-gray-500">{g.category}</td>
                    <td className="py-1.5 pr-4 font-mono">${(g.priceCents / 100).toFixed(2)}</td>
                    <td className="py-1.5">
                      <Badge label={g.issue.replace(/_/g, " ")} colorClass="bg-amber-100 text-amber-800" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Template Candidate Groups ──────────────────────────── */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-bold text-gray-700">Template Candidate Groups</h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {templateGroups.map((g) => (
            <div key={g.template} className={`rounded border p-3 ${g.template === "UNKNOWN" ? "border-red-200 bg-red-50" : "border-gray-100 bg-gray-50"}`}>
              <p className="text-xs font-bold text-gray-700">{g.label}</p>
              <p className="text-lg font-black text-gray-900">{g.productCount}</p>
              <p className="mt-1 text-[10px] text-gray-400 line-clamp-2">{g.slugs.slice(0, 5).join(", ")}{g.slugs.length > 5 ? ` +${g.slugs.length - 5} more` : ""}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Product Audit Table ─────────────────────────────────── */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h3 className="text-sm font-bold text-gray-700">
            Product Completeness ({filteredRows.length})
          </h3>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-xs"
          >
            <option value="all">All Sources</option>
            <option value="PRESET">Preset</option>
            <option value="FIXED">Fixed</option>
            <option value="TEMPLATE">Template</option>
            <option value="LEGACY">Legacy</option>
            <option value="QUOTE_ONLY">Quote Only</option>
            <option value="MISSING">Missing</option>
          </select>
          <select
            value={completenessFilter}
            onChange={(e) => setCompletenessFilter(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-xs"
          >
            <option value="all">All Statuses</option>
            <option value="COMPLETE">Complete</option>
            <option value="PARTIAL">Partial</option>
            <option value="MISSING">Missing</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2 pr-3">Slug</th>
                <th className="pb-2 pr-3">Category</th>
                <th className="pb-2 pr-3">Source</th>
                <th className="pb-2 pr-3">Template</th>
                <th className="pb-2 pr-3">Status</th>
                <th className="pb-2 pr-3">Ledger</th>
                <th className="pb-2 pr-3">Floor</th>
                <th className="pb-2">Missing Fields</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.slice(0, 100).map((row) => (
                <tr key={row.productId} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-1.5 pr-3 font-medium text-gray-800">{row.slug}</td>
                  <td className="py-1.5 pr-3 text-gray-500">{row.category}</td>
                  <td className="py-1.5 pr-3">
                    <Badge label={row.pricingSourceKind} colorClass={SOURCE_COLORS[row.pricingSourceKind] || "bg-gray-100 text-gray-600"} />
                  </td>
                  <td className="py-1.5 pr-3 text-gray-500 text-[10px]">{row.candidateCostTemplate}</td>
                  <td className="py-1.5 pr-3">
                    <Badge label={row.completenessStatus} colorClass={COMPLETENESS_COLORS[row.completenessStatus] || "bg-gray-100 text-gray-600"} />
                  </td>
                  <td className="py-1.5 pr-3 text-center">{row.hasReadableLedger ? "Y" : "—"}</td>
                  <td className="py-1.5 pr-3 text-center">{row.hasFloorPolicy ? "Y" : "—"}</td>
                  <td className="py-1.5 text-[10px] text-red-600">
                    {row.missingFields.length > 0 ? row.missingFields.join(", ") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredRows.length > 100 && (
            <p className="mt-2 text-center text-xs text-gray-400">Showing first 100 of {filteredRows.length} rows</p>
          )}
        </div>
      </div>

      {/* ── Timestamp ──────────────────────────────────────────── */}
      <p className="text-right text-[10px] text-gray-300">
        Generated: {new Date(report.generatedAt).toLocaleString()}
      </p>
    </div>
  );
}
