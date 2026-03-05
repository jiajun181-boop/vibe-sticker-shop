"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function PriceChangeLogPage() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const limit = 30;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/price-change-log?page=${page}&limit=${limit}`);
      if (!res.ok) throw new Error("Failed to load change log");
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <nav className="flex items-center gap-2 text-sm text-gray-400">
            <Link href="/admin/pricing-dashboard" className="text-indigo-600 hover:underline">
              {t("admin.priceDash.title")}
            </Link>
            <span>/</span>
            <span className="text-gray-700">{t("admin.priceDash.changeLog")}</span>
          </nav>
          <h1 className="mt-2 text-xl font-bold text-gray-900">{t("admin.changeLog.title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("admin.changeLog.subtitle")}</p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-12 text-center text-base text-gray-400">{t("admin.common.loading")}</div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-base text-red-700">{error}</p>
          <button onClick={fetchLogs} className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
            {t("admin.common.retry")}
          </button>
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <svg className="mx-auto h-12 w-12 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mt-4 text-lg text-gray-500">{t("admin.changeLog.empty")}</p>
          <p className="mt-1 text-sm text-gray-400">{t("admin.changeLog.emptyDesc")}</p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">{t("admin.changeLog.colTime")}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">{t("admin.changeLog.colProduct")}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">{t("admin.changeLog.colField")}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">{t("admin.changeLog.colChange")}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">{t("admin.changeLog.colOperator")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map(log => (
                  <tr key={log.id} className="transition-colors hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/pricing-dashboard/${log.productSlug}`}
                        className="text-sm font-medium text-indigo-600 hover:underline"
                      >
                        {log.productName || log.productSlug}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{log.field}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm">
                        {log.labelBefore && (
                          <span className="rounded bg-red-50 px-2 py-0.5 text-red-700 line-through">{log.labelBefore}</span>
                        )}
                        {log.labelBefore && log.labelAfter && (
                          <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                          </svg>
                        )}
                        {log.labelAfter && (
                          <span className="rounded bg-green-50 px-2 py-0.5 text-green-700">{log.labelAfter}</span>
                        )}
                        {log.driftPct != null && (
                          <span className={`text-xs font-medium ${log.driftPct > 0 ? "text-red-500" : "text-green-500"}`}>
                            {log.driftPct > 0 ? "+" : ""}{log.driftPct.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{log.operatorName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {t("admin.changeLog.pagination").replace("{page}", page).replace("{total}", totalPages)}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
                >
                  {t("admin.changeLog.prev")}
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
                >
                  {t("admin.changeLog.next")}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
