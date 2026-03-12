"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { statusColor } from "@/lib/admin/status-labels";
import { buildCustomerCenterHref, buildCustomerDetailHref } from "@/lib/admin-centers";
import { useTranslation } from "@/lib/i18n/useTranslation";

const STATUSES = ["open", "in_progress", "waiting_customer", "resolved", "closed"];
const PRIORITIES = ["low", "normal", "high", "urgent"];

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

export default function AdminTicketDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const fetchTicket = () => {
    fetch(`/api/admin/support/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => setTicket(data.ticket))
      .catch(() => setError(t("admin.support.ticketNotFound")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/support/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: reply.trim(), authorName: "Support Team" }),
      });
      if (!res.ok) throw new Error();
      setReply("");
      fetchTicket();
    } catch {
      setError(t("admin.support.replyFailed"));
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await fetch(`/api/admin/support/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchTicket();
    } catch {
      setError(t("admin.support.statusUpdateFailed"));
    }
  };

  const handlePriorityChange = async (newPriority) => {
    try {
      await fetch(`/api/admin/support/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority }),
      });
      fetchTicket();
    } catch {
      setError(t("admin.support.priorityUpdateFailed"));
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    );
  }

  if (error && !ticket) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <Link href="/admin/customers/support" className="mt-3 inline-block text-sm font-semibold hover:underline">
          {t("admin.support.backToSupport")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="mb-1 text-[11px] text-[#666]">
          <Link href={buildCustomerCenterHref()} className="underline hover:text-black hover:no-underline">
            {t("admin.customers.title")}
          </Link>
          <span className="mx-1">/</span>
          <Link href="/admin/customers/support" className="underline hover:text-black hover:no-underline">
            {t("admin.customers.viewSupport")}
          </Link>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-black">{ticket?.subject}</h1>
            <p className="mt-0.5 text-xs text-[#999]">
              #{ticket?.id.slice(0, 8)} &bull;{" "}
              <Link href={buildCustomerDetailHref(ticket?.email)} className="underline hover:text-black hover:no-underline">
                {ticket?.email}
              </Link>
              {" "}&bull; {ticket?.createdAt && new Date(ticket.createdAt).toLocaleDateString("en-CA")}
            </p>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${
              statusColor(ticket?.status)
            }`}
          >
            {t(STATUS_LABEL_KEYS[ticket?.status] || ticket?.status)}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 rounded-lg border bg-gray-50 p-3">
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase text-gray-400">{t("admin.support.statusLabel")}</label>
          <select
            value={ticket?.status || "open"}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(STATUS_LABEL_KEYS[s] || s)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase text-gray-400">{t("admin.support.priorityLabel")}</label>
          <select
            value={ticket?.priority || "normal"}
            onChange={(e) => handlePriorityChange(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {t(PRIORITY_LABEL_KEYS[p] || p)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-3">
        {ticket?.messages?.map((msg) => {
          const isAdmin = msg.authorType === "admin" || msg.authorType === "system";
          return (
            <div
              key={msg.id}
              className={`rounded-lg border p-4 ${
                isAdmin ? "border-indigo-200 bg-indigo-50" : "border-gray-200 bg-white"
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-700">
                    {msg.authorName || (isAdmin ? t("admin.support.authorSupport") : t("admin.support.authorCustomer"))}
                  </span>
                  <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                    isAdmin ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-500"
                  }`}>
                    {msg.authorType === "admin" ? t("admin.support.authorLabelAdmin") : msg.authorType === "system" ? t("admin.support.authorLabelSystem") : t("admin.support.authorLabelCustomer")}
                  </span>
                </div>
                <span className="text-[10px] text-gray-400">
                  {new Date(msg.createdAt).toLocaleDateString("en-CA", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{msg.body}</p>
            </div>
          );
        })}
      </div>

      {/* Reply form */}
      <form onSubmit={handleReply} className="space-y-3">
        {error && <p className="text-sm text-red-600">{error}</p>}
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder={t("admin.support.replyPlaceholder")}
          rows={4}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"
          required
        />
        <button
          type="submit"
          disabled={sending || !reply.trim()}
          className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-[#fff] hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {sending ? t("admin.support.sending") : t("admin.support.sendReply")}
        </button>
      </form>
    </div>
  );
}
