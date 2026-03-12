"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatCad } from "@/lib/admin/format-cad";
import { pricingGovernancePath, pricingOpsPath, pricingQuotePath } from "@/lib/admin/pricing-routes";

// ── Sub-tab definitions ──────────────────────────────────────────
const SUB_TABS = [
  { id: "alerts", label: "Profit Alerts" },
  { id: "reminders", label: "Ops Reminders" },
];

export default function OpsPanel() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sectionParam = searchParams.get("section") || "alerts";
  const [activeSection, setActiveSection] = useState(sectionParam);

  useEffect(() => {
    if (sectionParam && SUB_TABS.some((t) => t.id === sectionParam)) {
      setActiveSection(sectionParam);
    }
  }, [sectionParam]);

  function switchSection(id) {
    setActiveSection(id);
    router.push(pricingOpsPath(id), { scroll: false });
  }

  return (
    <div className="space-y-5">
      {/* Sub-tab bar */}
      <div className="flex flex-wrap gap-1">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => switchSection(tab.id)}
            className={`rounded-[3px] px-3.5 py-2 text-xs font-medium transition-colors ${
              activeSection === tab.id
                ? "bg-black text-white"
                : "bg-[#f0f0f0] text-[#666] hover:bg-[#e0e0e0] hover:text-[#111]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeSection === "alerts" && <ProfitAlertsSection />}
      {activeSection === "reminders" && <OpsRemindersSection />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// PROFIT ALERTS SECTION
// ════════════════════════════════════════════════════════════════════

const DAYS_OPTIONS = [7, 14, 30, 60, 90];

const ALERT_TYPE_CONFIG = {
  negative_margin: { label: "Negative Margin", bg: "bg-red-100", text: "text-red-800", border: "border-red-200" },
  cost_exceeds_revenue: { label: "Cost > Revenue", bg: "bg-red-100", text: "text-red-800", border: "border-red-200" },
  below_floor: { label: "Below Floor", bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-200" },
  below_target: { label: "Below Target", bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-200" },
  missing_actual_cost: { label: "Missing Actual Cost", bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200" },
  missing_vendor_cost: { label: "Missing Vendor Cost", bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-200" },
};

function AlertBadge({ type }) {
  const cfg = ALERT_TYPE_CONFIG[type] || { label: type, bg: "bg-gray-100", text: "text-gray-800", border: "border-gray-200" };
  return (
    <span className={`inline-flex items-center rounded-[3px] border px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {cfg.label}
    </span>
  );
}

function ProfitAlertsSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(30);
  const [floor, setFloor] = useState(15);
  const [limit, setLimit] = useState(50);
  const [expandedOrder, setExpandedOrder] = useState(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/pricing/profit-alerts?days=${days}&floor=${floor}&limit=${limit}`);
      if (!res.ok) throw new Error("Failed to load profit alerts");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [days, floor, limit]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const alertBreakdown = {};
  if (data?.alerts) {
    for (const order of data.alerts) {
      for (const alert of order.alerts) {
        alertBreakdown[alert.alertType] = (alertBreakdown[alert.alertType] || 0) + 1;
      }
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-[#111]">Profit Alerts</h3>
        <p className="mt-0.5 text-xs text-[#999]">Orders with margin warnings, missing costs, or profitability issues.</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-end gap-4 rounded-[3px] border border-[#e0e0e0] bg-white p-4">
        <div>
          <label className="block text-[10px] font-medium text-[#666]">Date Range</label>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="mt-0.5 rounded-[3px] border border-[#e0e0e0] px-3 py-1.5 text-sm text-[#111] focus:border-black focus:outline-none"
          >
            {DAYS_OPTIONS.map((d) => <option key={d} value={d}>Last {d} days</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-medium text-[#666]">Floor Margin: {floor}%</label>
          <input type="range" min={0} max={50} step={1} value={floor} onChange={(e) => setFloor(Number(e.target.value))} className="mt-0.5 w-36" />
        </div>
        <div>
          <label className="block text-[10px] font-medium text-[#666]">Limit</label>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="mt-0.5 rounded-[3px] border border-[#e0e0e0] px-3 py-1.5 text-sm text-[#111] focus:border-black focus:outline-none"
          >
            {[25, 50, 100].map((l) => <option key={l} value={l}>{l} orders</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-[#999]">Loading profit alerts...</div>
      ) : error ? (
        <div className="rounded-[3px] border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={fetchAlerts} className="mt-2 rounded-[3px] bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700">Retry</button>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryCard label="Orders with Alerts" value={data?.ordersWithAlerts || 0} sub={`of last ${days} days`} />
            <SummaryCard label="Total Alerts" value={data?.totalAlerts || 0} />
            <SummaryCard
              label="Most Common"
              value={
                Object.keys(alertBreakdown).length > 0
                  ? (ALERT_TYPE_CONFIG[Object.entries(alertBreakdown).sort((a, b) => b[1] - a[1])[0][0]]?.label || "None")
                  : "None"
              }
              sub={Object.keys(alertBreakdown).length > 0
                ? `${Object.entries(alertBreakdown).sort((a, b) => b[1] - a[1])[0][1]} alerts` : undefined}
            />
            <SummaryCard
              label="Critical"
              value={(alertBreakdown.negative_margin || 0) + (alertBreakdown.cost_exceeds_revenue || 0)}
              sub="Negative margin / cost overruns"
            />
          </div>

          {/* Alert type breakdown */}
          {Object.keys(alertBreakdown).length > 0 && (
            <div className="flex flex-wrap gap-3">
              {Object.entries(alertBreakdown).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                <div key={type} className="flex items-center gap-2">
                  <AlertBadge type={type} />
                  <span className="text-sm font-medium text-[#666]">{count}</span>
                </div>
              ))}
            </div>
          )}

          {/* Orders table */}
          {(!data?.alerts || data.alerts.length === 0) ? (
            <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-8 text-center">
              <p className="text-sm text-[#999]">No profit alerts found for the selected criteria.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[3px] border border-[#e0e0e0] bg-white">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                    <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-[#999]">Order</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-[#999]">Customer</th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase text-[#999]">Total</th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase text-[#999]">Est. Margin</th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase text-[#999]">Act. Margin</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase text-[#999]">Alerts</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase text-[#999]">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {data.alerts.map((row) => (
                    <OrderAlertRow
                      key={row.orderId}
                      row={row}
                      isExpanded={expandedOrder === row.orderId}
                      onToggle={() => setExpandedOrder((prev) => (prev === row.orderId ? null : row.orderId))}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function OrderAlertRow({ row, isExpanded, onToggle }) {
  const estMargin = row.profit?.estimatedMarginPct;
  const actMargin = row.profit?.actualMarginPct;

  return (
    <>
      <tr className="border-b border-[#f0f0f0] hover:bg-[#fafafa]">
        <td className="px-3 py-2.5">
          <Link href={`/admin/orders/${row.orderId}`} className="text-sm font-medium text-[#111] hover:underline">
            {row.orderId.slice(0, 8)}...
          </Link>
        </td>
        <td className="px-3 py-2.5 text-sm text-[#666]">{row.customerEmail}</td>
        <td className="px-3 py-2.5 text-right text-sm font-medium text-[#111]">{formatCad(row.totalAmount)}</td>
        <td className="px-3 py-2.5 text-right text-sm"><MarginValue value={estMargin} /></td>
        <td className="px-3 py-2.5 text-right text-sm">
          {actMargin != null ? <MarginValue value={actMargin} /> : <span className="text-[#ccc]">--</span>}
        </td>
        <td className="px-3 py-2.5 text-center">
          <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
            {row.alerts.length}
          </span>
        </td>
        <td className="px-3 py-2.5 text-center">
          <button onClick={onToggle} className="rounded-[3px] border border-[#e0e0e0] px-2.5 py-1 text-xs font-medium text-[#666] hover:border-black hover:text-black">
            {isExpanded ? "Hide" : "View"}
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={7} className="bg-[#f8f8f8] px-4 py-3">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase text-[#999]">Per-Item Alerts ({row.alerts.length})</p>
              <div className="overflow-hidden rounded-[3px] border border-[#e0e0e0] bg-white">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                      <th className="px-3 py-1.5 text-left text-xs font-medium text-[#999]">Product</th>
                      <th className="px-3 py-1.5 text-right text-xs font-medium text-[#999]">Sell</th>
                      <th className="px-3 py-1.5 text-right text-xs font-medium text-[#999]">Cost</th>
                      <th className="px-3 py-1.5 text-left text-xs font-medium text-[#999]">Alert</th>
                      <th className="px-3 py-1.5 text-left text-xs font-medium text-[#999]">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {row.alerts.map((alert, idx) => (
                      <tr key={idx} className="border-b border-[#f0f0f0] last:border-0">
                        <td className="px-3 py-1.5 text-sm text-[#111]">{alert.productName}</td>
                        <td className="px-3 py-1.5 text-right text-sm text-[#111]">{formatCad(alert.sellPriceCents)}</td>
                        <td className="px-3 py-1.5 text-right text-sm text-[#111]">{formatCad(alert.costCents)}</td>
                        <td className="px-3 py-1.5"><AlertBadge type={alert.alertType} /></td>
                        <td className="px-3 py-1.5 text-xs text-[#666]">{alert.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function MarginValue({ value }) {
  if (value == null) return <span className="text-[#ccc]">--</span>;
  let color = "text-green-700";
  if (value < 0) color = "text-red-700 font-semibold";
  else if (value < 15) color = "text-orange-700";
  else if (value < 40) color = "text-amber-700";
  return <span className={color}>{value.toFixed(1)}%</span>;
}

// ════════════════════════════════════════════════════════════════════
// OPS REMINDERS SECTION
// ════════════════════════════════════════════════════════════════════

const SEVERITY_STYLES = {
  critical: { border: "border-red-300", bg: "bg-red-50", badge: "bg-red-600 text-white", text: "text-red-800" },
  warning: { border: "border-amber-300", bg: "bg-amber-50", badge: "bg-amber-500 text-white", text: "text-amber-800" },
  ok: { border: "border-green-200", bg: "bg-green-50", badge: "bg-green-600 text-white", text: "text-green-800" },
};

function OpsRemindersSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReminders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/pricing/ops-reminders");
      if (!res.ok) throw new Error("Failed to load ops reminders");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReminders(); }, [fetchReminders]);

  const r = data?.reminders;
  const totalIssues = r
    ? r.missingDisplayPrice.count + r.missingFloorPolicy.count + r.placeholderMaterials.count +
      r.suspiciousHardware.count + r.missingVendorCost.count + r.highDriftChanges.count + r.pendingApprovals.count
    : 0;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-[#111]">Pricing Ops Reminders</h3>
        <p className="mt-0.5 text-xs text-[#999]">Automated health checks for pricing data completeness, drift alerts, and pending actions.</p>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-[#999]">Running pricing health checks...</div>
      ) : error ? (
        <div className="rounded-[3px] border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={fetchReminders} className="mt-2 rounded-[3px] bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700">Retry</button>
        </div>
      ) : !r ? (
        <div className="py-8 text-center text-sm text-[#999]">No data available.</div>
      ) : (
        <>
          {/* Summary bar */}
          <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#666]">
                {totalIssues === 0 ? "All pricing checks passed." : `${totalIssues} issue${totalIssues !== 1 ? "s" : ""} detected`}
              </span>
              <span className="text-xs text-[#999]">
                Generated {data.generatedAt ? new Date(data.generatedAt).toLocaleTimeString("en-CA") : ""}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <ReminderCard
              title="Missing Display Price"
              severity={r.missingDisplayPrice.severity}
              count={r.missingDisplayPrice.count}
              defaultExpanded={r.missingDisplayPrice.count > 0 && r.missingDisplayPrice.count <= 10}
            >
              <p className="mb-2 text-xs text-[#999]">Products without a &quot;From $X&quot; display price.</p>
              <SlugList slugs={r.missingDisplayPrice.slugs} />
            </ReminderCard>

            <ReminderCard
              title="Missing Floor Policy"
              severity={r.missingFloorPolicy.severity}
              count={r.missingFloorPolicy.count}
              defaultExpanded={r.missingFloorPolicy.count > 0 && r.missingFloorPolicy.count <= 10}
            >
              <p className="mb-2 text-xs text-[#999]">Products without a minimum price (floor) set.</p>
              <SlugList slugs={r.missingFloorPolicy.slugs} />
            </ReminderCard>

            <ReminderCard
              title="Placeholder Materials"
              severity={r.placeholderMaterials.severity}
              count={r.placeholderMaterials.count}
              defaultExpanded={r.placeholderMaterials.count > 0}
            >
              <p className="mb-2 text-xs text-[#999]">Active materials still named &quot;New Material&quot; or with empty names.</p>
              {r.placeholderMaterials.names?.length > 0 ? (
                <ul className="space-y-1">
                  {r.placeholderMaterials.names.map((name, i) => <li key={i} className="text-xs text-[#666]">{name}</li>)}
                </ul>
              ) : <p className="text-xs text-[#999]">None found.</p>}
            </ReminderCard>

            <ReminderCard
              title="Suspicious Hardware Prices"
              severity={r.suspiciousHardware.severity}
              count={r.suspiciousHardware.count}
              defaultExpanded={r.suspiciousHardware.count > 0}
            >
              <p className="mb-2 text-xs text-[#999]">Hardware items with zero or suspiciously low prices.</p>
              {r.suspiciousHardware.items?.length > 0 ? (
                <ul className="space-y-1">
                  {r.suspiciousHardware.items.map((item) => (
                    <li key={item.slug} className="text-xs text-[#666]">
                      <span className="font-medium">{item.name}</span>
                      <span className="ml-2 text-[#999]">
                        ({item.issue === "zero_price" ? "$0.00" : `$${(item.priceCents / 100).toFixed(2)}`})
                      </span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-xs text-[#999]">None found.</p>}
            </ReminderCard>

            <ReminderCard
              title="Missing Vendor Cost"
              severity={r.missingVendorCost.severity}
              count={r.missingVendorCost.count}
              defaultExpanded={r.missingVendorCost.count > 0 && r.missingVendorCost.count <= 10}
            >
              <p className="mb-2 text-xs text-[#999]">Fixed-price products without vendor cost data.</p>
              <SlugList slugs={r.missingVendorCost.slugs} />
            </ReminderCard>

            <ReminderCard
              title="High Drift Changes (Last 7 Days)"
              severity={r.highDriftChanges.severity}
              count={r.highDriftChanges.count}
            >
              <p className="mb-2 text-xs text-[#999]">Price changes with &gt;20% drift. May need review.</p>
              {r.highDriftChanges.count > 0 ? (
                <Link
                  href={pricingGovernancePath("changelog")}
                  className="inline-flex items-center gap-1 text-xs text-[#111] underline hover:no-underline"
                >
                  View in Change Log
                </Link>
              ) : <p className="text-xs text-[#999]">No high-drift changes.</p>}
            </ReminderCard>

            <ReminderCard
              title="Pending Approvals"
              severity={r.pendingApprovals.severity}
              count={r.pendingApprovals.count}
            >
              <p className="mb-2 text-xs text-[#999]">Pricing changes awaiting review and approval.</p>
              {r.pendingApprovals.count > 0 ? (
                <Link
                  href={pricingGovernancePath("approvals")}
                  className="inline-flex items-center gap-1 text-xs text-[#111] underline hover:no-underline"
                >
                  Review Approvals
                </Link>
              ) : <p className="text-xs text-[#999]">No pending approvals.</p>}
            </ReminderCard>
          </div>
        </>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ════════════════════════════════════════════════════════════════════

function SummaryCard({ label, value, sub }) {
  return (
    <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-3">
      <p className="text-[10px] font-medium uppercase tracking-wide text-[#999]">{label}</p>
      <p className="mt-1 text-xl font-bold text-[#111]">{value}</p>
      {sub && <p className="mt-0.5 text-[10px] text-[#999]">{sub}</p>}
    </div>
  );
}

function ReminderCard({ title, severity, count, children, defaultExpanded }) {
  const [expanded, setExpanded] = useState(defaultExpanded || false);
  const styles = SEVERITY_STYLES[severity] || SEVERITY_STYLES.ok;

  return (
    <div className={`rounded-[3px] border ${styles.border} ${styles.bg} overflow-hidden`}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left"
      >
        <div className="flex items-center gap-2.5">
          <span className={`inline-flex min-w-[24px] items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-bold ${styles.badge}`}>
            {count}
          </span>
          <span className={`text-sm font-medium ${styles.text}`}>{title}</span>
        </div>
        <svg
          className={`h-3.5 w-3.5 text-[#999] transition-transform ${expanded ? "rotate-180" : ""}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {expanded && <div className="border-t border-[#e0e0e0] px-4 py-2.5">{children}</div>}
    </div>
  );
}

function SlugList({ slugs }) {
  if (!slugs || slugs.length === 0) return <p className="text-xs text-[#999]">None found.</p>;
  return (
    <ul className="space-y-0.5">
      {slugs.map((slug) => (
        <li key={slug} className="text-xs text-[#666]">
          <Link href={pricingQuotePath(slug)} className="text-[#111] hover:underline">{slug}</Link>
        </li>
      ))}
    </ul>
  );
}
