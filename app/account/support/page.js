"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STATUS_COLORS = {
  open: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  waiting_customer: "bg-purple-100 text-purple-700",
  resolved: "bg-emerald-100 text-emerald-700",
  closed: "bg-[var(--color-gray-100)] text-[var(--color-gray-500)]",
};

export default function SupportPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/support")
      .then((r) => r.json())
      .then((data) => setTickets(data.tickets || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim(), message: message.trim() }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTickets((prev) => [data.ticket, ...prev]);
      setShowNew(false);
      setSubject("");
      setMessage("");
    } catch {
      setError("Failed to create ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-[var(--color-gray-900)]">Support</h1>
        <button
          type="button"
          onClick={() => setShowNew(!showNew)}
          className="rounded-lg bg-[var(--color-gray-900)] px-4 py-2 text-sm font-semibold text-white hover:bg-black transition-colors"
        >
          {showNew ? "Cancel" : "New Ticket"}
        </button>
      </div>

      {showNew && (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-[var(--color-gray-200)] p-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--color-gray-500)]">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief description of your issue"
              className="w-full rounded-lg border border-[var(--color-gray-200)] px-3 py-2 text-sm text-[var(--color-gray-900)] placeholder:text-[var(--color-gray-400)] focus:border-[var(--color-gray-400)] focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--color-gray-500)]">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue in detail..."
              rows={4}
              className="w-full rounded-lg border border-[var(--color-gray-200)] px-3 py-2 text-sm text-[var(--color-gray-900)] placeholder:text-[var(--color-gray-400)] focus:border-[var(--color-gray-400)] focus:outline-none"
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-[var(--color-gray-900)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-black disabled:opacity-50 transition-colors"
          >
            {submitting ? "Submitting..." : "Submit Ticket"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-[var(--color-gray-100)]" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-gray-200)] p-8 text-center">
          <p className="text-sm text-[var(--color-gray-500)]">No support tickets yet.</p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--color-gray-100)] rounded-xl border border-[var(--color-gray-200)]">
          {tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/account/support/${ticket.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-[var(--color-gray-50)] transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--color-gray-900)]">{ticket.subject}</p>
                <p className="mt-0.5 text-xs text-[var(--color-gray-500)]">
                  #{ticket.id.slice(0, 8)} &bull;{" "}
                  {new Date(ticket.updatedAt).toLocaleDateString("en-CA", {
                    month: "short",
                    day: "numeric",
                  })}
                  {ticket._count?.messages > 1 && ` \u00B7 ${ticket._count.messages} messages`}
                </p>
              </div>
              <span
                className={`ml-3 shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
                  STATUS_COLORS[ticket.status] || "bg-[var(--color-gray-100)] text-[var(--color-gray-500)]"
                }`}
              >
                {ticket.status.replace(/_/g, " ")}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
