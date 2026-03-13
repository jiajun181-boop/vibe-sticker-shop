"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";

const STATUS_COLORS = {
  ok: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-200" },
  warning: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", border: "border-amber-200" },
  critical: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", border: "border-red-200" },
  info: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", border: "border-blue-200" },
};

export default function SystemHealthPage() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/system-health");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message || "Failed to load health data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHealth(); }, [fetchHealth]);

  const overallColor = data ? STATUS_COLORS[data.status] || STATUS_COLORS.info : STATUS_COLORS.info;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#111]">{t("admin.systemHealth.title")}</h1>
          <p className="text-sm text-[#666]">{t("admin.systemHealth.subtitle")}</p>
        </div>
        <button
          onClick={fetchHealth}
          disabled={loading}
          className="rounded-md border border-[#ddd] bg-white px-4 py-2 text-sm font-medium text-[#333] shadow-sm transition hover:bg-[#f5f5f5] disabled:opacity-50"
        >
          {loading ? t("admin.common.loading") : t("admin.systemHealth.refresh")}
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {data && (
        <>
          {/* Overall status banner */}
          <div className={`mb-6 flex items-center gap-3 rounded-lg border p-4 ${overallColor.bg} ${overallColor.border}`}>
            <span className={`h-3 w-3 rounded-full ${overallColor.dot}`} />
            <span className={`text-sm font-semibold ${overallColor.text}`}>
              {data.status === "ok" && t("admin.systemHealth.allGood")}
              {data.status === "warning" && t("admin.systemHealth.warnings")}
              {data.status === "critical" && t("admin.systemHealth.critical")}
            </span>
            <span className="ml-auto text-xs text-[#999]">
              {t("admin.systemHealth.lastChecked")}: {new Date(data.checkedAt).toLocaleTimeString()}
            </span>
          </div>

          {/* Summary cards */}
          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-[#e5e5e5] bg-white p-4 text-center">
              <div className="text-2xl font-bold text-[#111]">{data.summary.totalProducts}</div>
              <div className="text-xs text-[#888]">{t("admin.systemHealth.products")}</div>
            </div>
            <div className="rounded-lg border border-[#e5e5e5] bg-white p-4 text-center">
              <div className="text-2xl font-bold text-[#111]">{data.summary.totalOrders}</div>
              <div className="text-xs text-[#888]">{t("admin.systemHealth.orders")}</div>
            </div>
            <div className="rounded-lg border border-[#e5e5e5] bg-white p-4 text-center">
              <div className="text-2xl font-bold text-[#111]">{data.summary.totalJobs}</div>
              <div className="text-xs text-[#888]">{t("admin.systemHealth.jobs")}</div>
            </div>
          </div>

          {/* Health checks */}
          <div className="space-y-3">
            {data.checks.map((check) => {
              const colors = STATUS_COLORS[check.status] || STATUS_COLORS.info;
              return (
                <div key={check.id} className={`flex items-start gap-3 rounded-lg border p-4 ${colors.bg} ${colors.border}`}>
                  <span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${colors.dot}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className={`text-sm font-semibold ${colors.text}`}>{check.label}</span>
                      <span className={`text-lg font-bold ${colors.text}`}>
                        {check.count}
                        {check.total != null && <span className="text-xs font-normal opacity-60">/{check.total}</span>}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs opacity-70">{check.hint}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {loading && !data && (
        <div className="flex h-60 items-center justify-center text-sm text-[#999]">
          {t("admin.common.loading")}
        </div>
      )}
    </div>
  );
}
