"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

const STATUS_COLORS = {
  open: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  waiting_customer: "bg-purple-100 text-purple-700",
  resolved: "bg-emerald-100 text-emerald-700",
  closed: "bg-gray-100 text-gray-500",
};

const PRIORITY_COLORS = {
  low: "text-gray-400",
  normal: "text-gray-600",
  high: "text-amber-600",
  urgent: "text-red-600",
};

const PRIORITY_DOT = {
  low: "bg-gray-300",
  normal: "bg-gray-500",
  high: "bg-amber-500",
  urgent: "bg-red-500",
};

const STATUSES = ["all", "open", "in_progress", "waiting_customer", "resolved", "closed"];

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;
  const fetchIdRef = useRef(0);
  const searchTimer = useRef(null);

  const fetchTickets = useCallback(
    (s, q, p) => {
      const id = ++fetchIdRef.current;
      setLoading(true);
      const params = new URLSearchParams();
      if (s && s !== "all") params.set("status", s);
      if (q) params.set("search", q);
      params.set("page", String(p || 1));
      params.set("limit", String(limit));
      fetch(`/api/admin/support?${params}`)
        .then((r) => r.json())
        .then((data) => {
          if (fetchIdRef.current !== id) return;
          setTickets(data.tickets || []);
          setTotal(data.total || 0);
        })
        .catch(() => {})
        .finally(() => {
          if (fetchIdRef.current === id) setLoading(false);
        });
    },
    []
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
    } catch {}
  };

  const handleInlinePriority = async (ticketId, newPriority) => {
    try {
      await fetch(`/api/admin/support/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority }),
      });
      fetchTickets(status, search, page);
    } catch {}
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
          <h1 className="text-lg font-semibold">Support Tickets</h1>
          <p className="text-[10px] text-gray-400">
            {total} total{urgentCount > 0 && ` · ${urgentCount} high/urgent`}
          </p>
        </div>
        <input
          type="text"
          placeholder="Search subject or email..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs outline-none focus:border-black w-56"
        />
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
            {s === "all" ? "All" : s.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-[3px] bg-gray-100" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-8 text-center text-sm text-gray-500">
          {search ? `No tickets matching "${search}"` : "No tickets found."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[3px] border border-[#e0e0e0] bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3">Ticket</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3 text-center">Msgs</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tickets.map((tk) => (
                <tr key={tk.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/support/${tk.id}`}
                      className="font-medium text-gray-900 hover:underline"
                    >
                      {tk.subject}
                    </Link>
                    <p className="text-[10px] text-gray-400">#{tk.id.slice(0, 8)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-gray-700">{tk.user?.name || tk.email}</p>
                    {tk.user?.name && tk.email && (
                      <p className="text-[10px] text-gray-400">{tk.email}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={tk.status}
                      onChange={(e) => handleInlineStatus(tk.id, e.target.value)}
                      className={`rounded-full border-0 px-2 py-0.5 text-[10px] font-semibold uppercase cursor-pointer ${
                        STATUS_COLORS[tk.status] || ""
                      }`}
                    >
                      {STATUSES.filter((s) => s !== "all").map((s) => (
                        <option key={s} value={s}>
                          {s.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={tk.priority}
                      onChange={(e) => handleInlinePriority(tk.id, e.target.value)}
                      className={`border-0 bg-transparent text-xs font-medium uppercase cursor-pointer ${
                        PRIORITY_COLORS[tk.priority] || ""
                      }`}
                    >
                      {["low", "normal", "high", "urgent"].map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500 tabular-nums">
                    {tk._count?.messages || 0}
                  </td>
                  <td className="px-4 py-3 text-[11px] text-gray-500">
                    {new Date(tk.updatedAt).toLocaleDateString("en-CA", {
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
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-[3px] border border-[#d0d0d0] px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30"
            >
              Prev
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-[3px] border border-[#d0d0d0] px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
