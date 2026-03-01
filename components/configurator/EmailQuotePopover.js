"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Email-yourself-a-quote popover with spring animation.
 *
 * State machine: idle → open → sending → sent → idle
 *
 * Props:
 *  - productName     — product display name
 *  - summaryLines    — [{ label, value }]
 *  - unitCents       — unit price in cents
 *  - subtotalCents   — subtotal in cents
 *  - quantity        — order quantity
 *  - pageUrl         — current page URL (auto-detected if omitted)
 *  - t               — translation function (optional)
 */
export default function EmailQuotePopover({
  productName,
  summaryLines = [],
  unitCents = 0,
  subtotalCents = 0,
  quantity = 1,
  pageUrl,
  t,
}) {
  const [phase, setPhase] = useState("idle"); // idle | open | sending | sent
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const popoverRef = useRef(null);
  const sentTimerRef = useRef(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (phase === "open") {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [phase]);

  // Auto-close after sent
  useEffect(() => {
    if (phase === "sent") {
      sentTimerRef.current = setTimeout(() => {
        setPhase("idle");
        setEmail("");
        setError("");
      }, 3000);
    }
    return () => clearTimeout(sentTimerRef.current);
  }, [phase]);

  // Close on Escape
  useEffect(() => {
    if (phase !== "open" && phase !== "sending") return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        setPhase("idle");
        setError("");
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [phase]);

  // Close on click outside
  useEffect(() => {
    if (phase !== "open") return;
    const onClick = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setPhase("idle");
        setError("");
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [phase]);

  const handleToggle = useCallback(() => {
    setPhase((p) => (p === "idle" ? "open" : "idle"));
    setError("");
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError(t?.("emailQuote.invalidEmail") || "Please enter a valid email");
      return;
    }
    setError("");
    setPhase("sending");

    try {
      const res = await fetch("/api/quote/email-self", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          productName,
          summaryLines,
          unitCents,
          subtotalCents,
          quantity,
          pageUrl: pageUrl || (typeof window !== "undefined" ? window.location.href : ""),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to send. Try again.");
        setPhase("open");
        return;
      }

      setPhase("sent");
    } catch {
      setError("Network error. Please try again.");
      setPhase("open");
    }
  }, [email, productName, summaryLines, unitCents, subtotalCents, quantity, pageUrl, t]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") handleSend();
    },
    [handleSend]
  );

  const isVisible = phase !== "idle";

  return (
    <div className="relative" ref={popoverRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={handleToggle}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-600 transition-all hover:border-gray-400 hover:text-gray-900"
        aria-expanded={isVisible}
      >
        {/* Mail icon */}
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
        {t?.("emailQuote.button") || "Email Me This Quote"}
      </button>

      {/* Popover */}
      {isVisible && (
        <div
          className="absolute left-0 right-0 z-50 mt-2 rounded-xl border border-gray-200 bg-white p-4 shadow-xl"
          style={{
            animation: "emailQuotePopIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both",
          }}
        >
          {phase === "sent" ? (
            /* Success state with checkmark animation */
            <div className="flex flex-col items-center gap-2 py-2">
              <svg
                className="h-10 w-10 text-emerald-500"
                viewBox="0 0 48 48"
                fill="none"
                style={{ overflow: "visible" }}
              >
                <circle cx="24" cy="24" r="22" stroke="#d1fae5" strokeWidth="4" fill="#ecfdf5" />
                <path
                  d="M14 24l7 7 13-17"
                  stroke="#10b981"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  style={{
                    strokeDasharray: 40,
                    strokeDashoffset: 40,
                    animation: "emailQuoteCheck 0.5s 0.15s ease-out forwards",
                  }}
                />
              </svg>
              <p className="text-sm font-bold text-emerald-700">
                {t?.("emailQuote.sent") || "Quote sent!"}
              </p>
              <p className="text-xs text-gray-500">
                {t?.("emailQuote.checkInbox") || "Check your inbox"}
              </p>
            </div>
          ) : (
            /* Input state */
            <>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">
                {t?.("emailQuote.label") || "Your Email"}
              </label>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  onKeyDown={handleKeyDown}
                  placeholder="you@example.com"
                  disabled={phase === "sending"}
                  className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={phase === "sending"}
                  className="shrink-0 rounded-lg bg-gray-900 px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-gray-800 disabled:cursor-wait disabled:opacity-70"
                >
                  {phase === "sending" ? (
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    t?.("emailQuote.send") || "Send"
                  )}
                </button>
              </div>
              {error && (
                <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>
              )}
              <p className="mt-2 text-[10px] text-gray-400">
                {t?.("emailQuote.validFor") || "Quote valid for 7 days. We won't spam you."}
              </p>
            </>
          )}
        </div>
      )}

      {/* Animations */}
      <style jsx>{`
        @keyframes emailQuotePopIn {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes emailQuoteCheck {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}
