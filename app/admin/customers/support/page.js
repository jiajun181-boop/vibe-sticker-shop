"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { statusColor, priorityColor } from "@/lib/admin/status-labels";
import { buildCustomerCenterHref, buildCustomerDetailHref } from "@/lib/admin-centers";
import { useTranslation } from "@/lib/i18n/useTranslation";

const STATUSES = ["all", "open", "in_progress", "waiting_customer", "resolved", "closed"];

const STATUS_LABEL_KEYS = {
  open: "admin.support.statusOpen",
  in_progress: "admin.support.statusInProgress",
  waiting_customer: "admin.support.statusWaiting",
  resolved: "admin.support.statusResolved",
  closed: "admin.support.statusClosed",
};

const PRIORITY_LABEL_KEYS = {
  low: "admin.support.priorityLow",
  normal: "admin.support.priorityNormal",
  high: "admin.support.priorityHigh",
  urgent: "admin.support.priorityUrgent",
};

export default function AdminSupportPage() {
  const { t, locale } = useTranslation();
  const dateLocale = locale === "zh" ? "zh-CN" : "en-CA";
  const searchParams = useSearchParams();
  const scopedEmail = searchParams.get("email");
  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loadError, setLoadError] = useState("");
  const limit = 20;
  const fetchIdRef = useRef(0);
  const searchTimer = useRef(null);

  const fetchTickets = useCallback(
    (s, q, p) => {
      const id = ++fetchIdRef.current;
      setLoading(true);
      const params = new URLSearchParams();
      if (s && s !== "all") params.set("status", s);
      if (scopedEmail) params.set("email", scopedEmail);
      else if (q) params.set("search", q);
      params.set("page", String(p || 1));
      params.set("limit", String(limit));
      setLoadError("");
      fetch(`/api/admin/support?${params}`)
        .then((r) => r.json())
        .then((data) => {
          if (fetchIdRef.current !== id) return;
          setTickets(data.tickets || []);
          setTotal(data.total || 0);
        })
        .catch(() => { if (fetchIdRef.current === id) setLoadError(t("admin.support.loadFailed")); })
        .finally(() => {
          if (fetchIdRef.current === id) setLoading(false);
        });
    },
    [scopedEmail]
  );

  useEffect(() => {
    fetchTickets(status, search, page);
  }, [status, page, fetchTickets]);

  // Auto-refresh every 30s
  useEffect(() => {
    const timer = setInterval(() => fetchTickets(status, search, page), 30_000);
    return () => clearInterval(timer);
  }, [status, search, page, fetchTickets]);

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      fetchTickets(status, val, 1);
    }, 300);
  };

  const handleStatusFilter = (s) => {
    setStatus(s);
    setPage(1);
  };

  const handleInlineStatus = async (ticketId, newStatus) => {
    try {
      await fetch(`/api/admin/support/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchTickets(status, search, page);
    } catch {
      setLoadError(t("admin.support.actionFailed"));
    }
  };

  const handleInlinePriority = async (ticketId, newPriority) => {
    try {
      await fetch(`/api/admin/support/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority }),
      });
      fetchTickets(status, search, page);
    } catch {
      setLoadError(t("admin.support.actionFailed"));
    }
  };

  const totalPages = Math.ceil(total / limit);

  // Status counts for filter badges
  const openCount = tickets.filter((t) => t.status === "open").length;
  const urgentCount = tickets.filter((t) => t.priority === "urgent" || t.priority === "high").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {scopedEmail ? (
            <div className="mb-1 text-[11px] text-[#666]">
              <Link href={buildCustomerCenterHref()} className="underline hover:text-black hover:no-underline">
                {t("admin.customers.title")}
              </Link>
              <span className="mx-1">/</span>
              <Link href={buildCustomerDetailHref(scopedEmail)} className="underline hover:text-black hover:no-underline">
                {scopedEmail}
              </Link>
            </div>
          ) : (
            <Link
              href={buildCustomerCenterHref()}
              className="mb-1 inline-block text-[11px] text-[#666] underline hover:text-black hover:no-underline"
            >
              {t("admin.customers.title")}
            </Link>
          )}
          <h1 className="text-xl font-semibold text-black">{t("admin.support.title")}</h1>
          <p className="text-sm text-[#999]">
            {scopedEmail
              ? scopedEmail
              : t("admin.support.total").replace("{total}", total)}{urgentCount > 0 && ` - ${t("admin.support.urgentCount").replace("{count}", urgentCount)}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {scopedEmail && (
            <Link
              href="/admin/customers/support"
              className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-[11px] font-medium text-[#666] hover:border-black hover:text-black"
            >
              {t("admin.support.viewAll") || "View all"}
            </Link>
          )}
          {!scopedEmail && (
            <input
              type="text"
              placeholder={t("admin.support.searchPlaceholder")}
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs outline-none focus:border-black w-56"
            />
          )}
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto">
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => handleStatusFilter(s)}
            className={`whitespace-nowrap rounded-[3px] px-3 py-1.5 text-[11px] font-medium transition-colors ${
              status === s
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s === "all" ? t("admin.support.filterAll") : t(STATUS_LABEL_KEYS[s] || s)}
          </button>
        ))}
      </div>

      {loadError && (
        <div className="rounded-[3px] border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
          {loadError}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-[3px] bg-gray-100" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-8 text-center text-sm text-gray-500">
          {search ? t("admin.support.noTicketsSearch").replace("{search}", search) : t("admin.support.noTickets")}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[3px] border border-[#e0e0e0] bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3">{t("admin.support.colTicket")}</th>
                <th className="px-4 py-3">{t("admin.support.colCustomer")}</th>
                <th className="px-4 py-3">{t("admin.support.colStatus")}</th>
                <th className="px-4 py-3">{t("admin.support.colPriority")}</th>
                <th className="px-4 py-3 text-center">{t("admin.support.colMsgs")}</th>
                <th className="px-4 py-3">{t("admin.support.colUpdated")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tickets.map((tk) => (
                <tr key={tk.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/customers/support/${tk.id}`}
                      className="font-medium text-gray-900 hover:underline"
                    >
                      {tk.subject}
                    </Link>
                    <p className="text-[10px] text-gray-400">#{tk.id.slice(0, 8)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={buildCustomerDetailHref(tk.email)} className="text-xs text-gray-700 hover:text-[#4f46e5] hover:underline">
                      {tk.user?.name || tk.email}
                    </Link>
                    {tk.user?.name && tk.email && (
                      <p className="text-[10px] text-gray-400">{tk.email}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={tk.status}
                      onChange={(e) => handleInlineStatus(tk.id, e.target.value)}
                      className={`rounded-full border-0 px-2 py-0.5 text-[10px] font-semibold uppercase cursor-pointer ${
                        statusColor(tk.status)
                      }`}
                    >
                      {STATUSES.filter((s) => s !== "all").map((s) => (
                        <option key={s} value={s}>
                          {t(STATUS_LABEL_KEYS[s] || s)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={tk.priority}
                      onChange={(e) => handleInlinePriority(tk.id, e.target.value)}
                      className={`border-0 bg-transparent text-xs font-medium uppercase cursor-pointer ${
                        priorityColor(tk.priority)
                      }`}
                    >
                      {["low", "normal", "high", "urgent"].map((p) => (
                        <option key={p} value={p}>
                          {t(PRIORITY_LABEL_KEYS[p] || p)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500 tabular-nums">
                    {tk._count?.messages || 0}
                  </td>
                  <td className="px-4 py-3 text-[11px] text-gray-500">
                    {new Date(tk.updatedAt).toLocaleDateString(dateLocale, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-gray-400">
            {t("admin.support.pageInfo").replace("{page}", page).replace("{total}", totalPages)}
          </p>
          <div className="flex gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-[3px] border border-[#d0d0d0] px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30"
            >
              {t("admin.support.prev")}
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-[3px] border border-[#d0d0d0] px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30"
            >
              {t("admin.support.next")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
