"use client";

import { useEffect, useState, Suspense } from "react";
import { formatCad } from "@/lib/admin/format-cad";

export default function ProductionAnalyticsPage() {
  return (
    <Suspense fallback={<div className="flex h-48 items-center justify-center text-sm text-[#999]">Loading...</div>}>
      <ProductionAnalyticsContent />
    </Suspense>
  );
}

function ProductionAnalyticsContent() {
  const [efficiency, setEfficiency] = useState(null);
  const [equipment, setEquipment] = useState(null);
  const [materials, setMaterials] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/admin/analytics/production-efficiency?days=${days}`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/admin/analytics/equipment?days=${days}`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/admin/analytics/materials?days=${days}`).then((r) => r.ok ? r.json() : null),
    ]).then(([eff, eq, mat]) => {
      setEfficiency(eff);
      setEquipment(eq);
      setMaterials(mat);
    }).finally(() => setLoading(false));
  }, [days]);

  if (loading) return <div className="flex h-48 items-center justify-center text-sm text-[#999]">Loading production analytics...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-black">Production Analytics</h1>
          <p className="text-xs text-[#999]">Efficiency, equipment utilization, and material usage</p>
        </div>
        <div className="flex gap-1">
          {[7, 30, 90, 365].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                days === d ? "bg-black text-white" : "bg-[#f5f5f5] text-[#666] hover:bg-[#e5e5e5]"
              }`}
            >
              {d === 365 ? "1Y" : `${d}D`}
            </button>
          ))}
        </div>
      </div>

      {/* Efficiency Summary */}
      {efficiency?.summary && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="On-Time Rate" value={`${efficiency.summary.onTimeRate}%`} color={efficiency.summary.onTimeRate >= 90 ? "green" : efficiency.summary.onTimeRate >= 70 ? "yellow" : "red"} />
          <StatCard label="Avg Turnaround" value={`${efficiency.summary.avgTurnaroundHours}h`} />
          <StatCard label="Jobs Completed" value={efficiency.summary.totalCompleted} />
          <StatCard label="Active Operators" value={efficiency.summary.operatorCount} />
        </div>
      )}

      {/* Turnaround Distribution */}
      {efficiency?.turnaround && efficiency.turnaround.length > 0 && (
        <div className="rounded-lg border border-[#e5e5e5] bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-black">Turnaround Time Distribution</h2>
          <div className="flex items-end gap-2 h-24">
            {(() => {
              const max = Math.max(...efficiency.turnaround.map((t) => t.count), 1);
              const labels = { same_day: "Same Day", "1_day": "1 Day", "2_days": "2 Days", "3_5_days": "3-5 Days", over_5_days: "5+ Days" };
              const colors = { same_day: "#34d399", "1_day": "#60a5fa", "2_days": "#fbbf24", "3_5_days": "#f97316", over_5_days: "#ef4444" };
              return efficiency.turnaround.map((t) => (
                <div key={t.bucket} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] font-medium text-[#666]">{t.count}</span>
                  <div className="w-full rounded-t" style={{ height: `${Math.max(4, (t.count / max) * 80)}px`, background: colors[t.bucket] || "#94a3b8" }} />
                  <span className="text-[9px] text-[#999] text-center">{labels[t.bucket] || t.bucket}</span>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* Operator Performance */}
      {efficiency?.operators && efficiency.operators.length > 0 && (
        <div className="rounded-lg border border-[#e5e5e5] bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-black">Operator Performance</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#f0f0f0] text-left text-[#999]">
                  <th className="pb-2 pr-4">Operator</th>
                  <th className="pb-2 pr-4 text-right">Total Jobs</th>
                  <th className="pb-2 pr-4 text-right">Completed</th>
                  <th className="pb-2 pr-4 text-right">Avg Hours</th>
                  <th className="pb-2 text-right">On-Time</th>
                </tr>
              </thead>
              <tbody>
                {efficiency.operators.map((op) => (
                  <tr key={op.operator} className="border-b border-[#f8f8f8]">
                    <td className="py-2 pr-4 font-medium">{op.operator}</td>
                    <td className="py-2 pr-4 text-right">{op.totalJobs}</td>
                    <td className="py-2 pr-4 text-right">{op.completed}</td>
                    <td className="py-2 pr-4 text-right">{op.avgHours ?? "—"}</td>
                    <td className="py-2 text-right">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        op.onTimeRate >= 90 ? "bg-green-50 text-green-700" : op.onTimeRate >= 70 ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-700"
                      }`}>
                        {op.onTimeRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Equipment/Factory Utilization */}
      {equipment?.factories && equipment.factories.length > 0 && (
        <div className="rounded-lg border border-[#e5e5e5] bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-black">Factory Utilization</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#f0f0f0] text-left text-[#999]">
                  <th className="pb-2 pr-4">Factory</th>
                  <th className="pb-2 pr-4 text-right">Total</th>
                  <th className="pb-2 pr-4 text-right">Active</th>
                  <th className="pb-2 pr-4 text-right">Completed</th>
                  <th className="pb-2 pr-4 text-right">Rush</th>
                  <th className="pb-2 pr-4 text-right">Completion</th>
                  <th className="pb-2 text-right">Avg Hours</th>
                </tr>
              </thead>
              <tbody>
                {equipment.factories.map((f) => (
                  <tr key={f.factoryName} className="border-b border-[#f8f8f8]">
                    <td className="py-2 pr-4 font-medium">{f.factoryName}</td>
                    <td className="py-2 pr-4 text-right">{f.totalJobs}</td>
                    <td className="py-2 pr-4 text-right text-blue-600">{f.activeJobs}</td>
                    <td className="py-2 pr-4 text-right text-green-700">{f.completedJobs}</td>
                    <td className="py-2 pr-4 text-right text-orange-600">{f.rushJobs}</td>
                    <td className="py-2 pr-4 text-right">{f.completionRate}%</td>
                    <td className="py-2 text-right">{f.avgHoursToComplete ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Material Usage */}
      {materials?.materialUsage && materials.materialUsage.length > 0 && (
        <div className="rounded-lg border border-[#e5e5e5] bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-black">Material Usage</h2>
          {materials.summary && (
            <div className="mb-3 flex gap-4 text-xs text-[#666]">
              <span>Total sqft: {materials.summary.totalSqFtUsed}</span>
              <span>Materials used: {materials.summary.totalMaterials}</span>
              <span>Low stock: <span className={materials.summary.lowStockCount > 0 ? "text-red-600 font-medium" : ""}>{materials.summary.lowStockCount}</span></span>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#f0f0f0] text-left text-[#999]">
                  <th className="pb-2 pr-4">Material</th>
                  <th className="pb-2 pr-4 text-right">Jobs</th>
                  <th className="pb-2 pr-4 text-right">Units</th>
                  <th className="pb-2 pr-4 text-right">Sq Ft</th>
                  <th className="pb-2 text-right">Orders</th>
                </tr>
              </thead>
              <tbody>
                {materials.materialUsage.slice(0, 15).map((m) => (
                  <tr key={m.materialId} className="border-b border-[#f8f8f8]">
                    <td className="py-2 pr-4 font-medium">{m.materialName}</td>
                    <td className="py-2 pr-4 text-right">{m.jobCount}</td>
                    <td className="py-2 pr-4 text-right">{m.totalUnits}</td>
                    <td className="py-2 pr-4 text-right">{m.totalSqFt}</td>
                    <td className="py-2 text-right">{m.orderCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bottlenecks */}
      {efficiency?.bottlenecks && efficiency.bottlenecks.length > 0 && (
        <div className="rounded-lg border border-[#e5e5e5] bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-black">Current Bottlenecks</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {efficiency.bottlenecks.map((b) => (
              <div key={b.status} className={`rounded-lg border p-3 ${b.avgHours > 48 ? "border-red-200 bg-red-50" : "border-[#f0f0f0]"}`}>
                <p className="text-xs font-medium text-[#666] capitalize">{b.status.replace(/_/g, " ")}</p>
                <p className="mt-1 text-lg font-bold text-black">{b.count}</p>
                <p className="text-[10px] text-[#999]">Avg {b.avgHours}h in status</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  const borderColor = color === "green" ? "border-green-200" : color === "red" ? "border-red-200" : color === "yellow" ? "border-yellow-200" : "border-[#e5e5e5]";
  return (
    <div className={`rounded-lg border ${borderColor} bg-white p-3`}>
      <p className="text-[10px] font-medium uppercase tracking-wider text-[#999]">{label}</p>
      <p className="mt-1 text-lg font-bold text-black">{value}</p>
    </div>
  );
}
