"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const STATUS_COLORS = {
  open: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  waiting_customer: "bg-purple-100 text-purple-700",
  resolved: "bg-emerald-100 text-emerald-700",
  closed: "bg-[var(--color-gray-100)] text-[var(--color-gray-500)]",
};

export default function TicketDetailPage() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const fetchTicket = () => {
    fetch(`/api/support/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => setTicket(data.ticket))
      .catch(() => setError("Ticket not found"))
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
      const res = await fetch(`/api/support/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: reply.trim() }),
      });
      if (!res.ok) throw new Error();
      setReply("");
      fetchTicket();
    } catch {
      setError("Failed to send reply.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-[var(--color-gray-100)]" />
        ))}
      </div>
    );
  }

  if (error && !ticket) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <Link href="/account/support" className="mt-3 inline-block text-sm font-semibold hover:underline">
          ← Back to Support
        </Link>
      </div>
    );
  }

  const isClosed = ticket?.status === "closed" || ticket?.status === "resolved";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/account/support" className="text-xs text-[var(--color-gray-500)] hover:text-[var(--color-gray-900)]">
          ← Support
        </Link>
        <div className="mt-2 flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[var(--color-gray-900)]">{ticket?.subject}</h1>
            <p className="mt-0.5 text-xs text-[var(--color-gray-500)]">
              #{ticket?.id.slice(0, 8)} &bull;{" "}
              {ticket?.createdAt && new Date(ticket.createdAt).toLocaleDateString("en-CA", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${
              STATUS_COLORS[ticket?.status] || "bg-[var(--color-gray-100)] text-[var(--color-gray-500)]"
            }`}
          >
            {ticket?.status?.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-3">
        {ticket?.messages?.map((msg) => {
          const isAdmin = msg.authorType === "admin" || msg.authorType === "system";
          return (
            <div
              key={msg.id}
              className={`rounded-xl border p-4 ${
                isAdmin
                  ? "border-blue-200 bg-blue-50"
                  : "border-[var(--color-gray-200)] bg-white"
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--color-gray-700)]">
                  {msg.authorName || (isAdmin ? "Support" : "You")}
                </span>
                <span className="text-[10px] text-[var(--color-gray-400)]">
                  {new Date(msg.createdAt).toLocaleDateString("en-CA", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-sm text-[var(--color-gray-800)] whitespace-pre-wrap">{msg.body}</p>
            </div>
          );
        })}
      </div>

      {/* Reply form */}
      {!isClosed ? (
        <form onSubmit={handleReply} className="space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write your reply..."
            rows={3}
            className="w-full rounded-lg border border-[var(--color-gray-200)] px-3 py-2 text-sm text-[var(--color-gray-900)] placeholder:text-[var(--color-gray-400)] focus:border-[var(--color-gray-400)] focus:outline-none"
            required
          />
          <button
            type="submit"
            disabled={sending || !reply.trim()}
            className="rounded-lg bg-[var(--color-gray-900)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-black disabled:opacity-50 transition-colors"
          >
            {sending ? "Sending..." : "Send Reply"}
          </button>
        </form>
      ) : (
        <div className="rounded-xl border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] p-4 text-center">
          <p className="text-sm text-[var(--color-gray-500)]">This ticket has been {ticket?.status?.replace(/_/g, " ")}.</p>
        </div>
      )}
    </div>
  );
}
