"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getSessionId() {
  let id = localStorage.getItem("chat_session_id");
  if (!id) {
    id = "sess_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("chat_session_id", id);
  }
  return id;
}

export default function ChatWidget() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [unread, setUnread] = useState(0);
  const [showIntro, setShowIntro] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const scrollRef = useRef(null);
  const pollRef = useRef(null);

  // Load saved conversation ID from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("chat_conversation_id");
    if (saved) setConversationId(saved);
  }, []);

  // Listen for open-chat custom event from FloatingContactButton
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-chat", handler);
    return () => window.removeEventListener("open-chat", handler);
  }, []);

  // Fetch messages when conversation exists
  const fetchMessages = useCallback(async () => {
    const sessionId = getSessionId();
    try {
      const url = conversationId
        ? `/api/chat?conversationId=${conversationId}&sessionId=${sessionId}`
        : `/api/chat?sessionId=${sessionId}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      if (data.conversation?.id && !conversationId) {
        setConversationId(data.conversation.id);
        localStorage.setItem("chat_conversation_id", data.conversation.id);
      }
      setMessages(data.messages || []);
      if (!open) {
        const unreadStaff = (data.messages || []).filter(
          (m) => m.senderType === "staff" && !m.isRead
        ).length;
        setUnread(unreadStaff);
      }
    } catch {
      // Silently fail for polling
    }
  }, [conversationId, open]);

  // Poll for new messages every 10s
  useEffect(() => {
    if (!conversationId) return;
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 10000);
    return () => clearInterval(pollRef.current);
  }, [conversationId, fetchMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  // Clear unread when opening
  useEffect(() => {
    if (open) setUnread(0);
  }, [open]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    // If no conversation and no guest info yet, show intro form
    if (!conversationId && !showIntro && !guestName && !guestEmail) {
      setShowIntro(true);
      return;
    }

    setSending(true);
    try {
      const body = {
        conversationId: conversationId || undefined,
        content: text,
        sessionId: getSessionId(),
        guestName: guestName || undefined,
        guestEmail: guestEmail || undefined,
      };
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
        localStorage.setItem("chat_conversation_id", data.conversationId);
      }
      setInput("");
      setShowIntro(false);
      // Optimistically add message
      setMessages((prev) => [...prev, data.message]);
    } catch {
      // Ignore
    } finally {
      setSending(false);
    }
  };

  const handleIntroSubmit = (e) => {
    e.preventDefault();
    if (!guestName.trim() || !guestEmail.trim()) return;
    setShowIntro(false);
    // Now send the pending message
    handleSend();
  };

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div
          className="fixed z-50 flex flex-col bg-white shadow-2xl
            inset-0 md:inset-auto md:bottom-24 md:right-4 md:h-[450px] md:w-[350px] md:rounded-2xl md:border md:border-gray-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 bg-[var(--color-brand)] text-[#fff] md:rounded-t-2xl">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                />
              </svg>
              <span className="text-sm font-bold">{t("chat.title", "Chat with Us")}</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded p-1 hover:bg-white/20"
              aria-label="Close chat"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && !showIntro && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <svg
                  className="h-12 w-12 text-gray-200"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                  />
                </svg>
                <p className="mt-3 text-sm font-medium text-gray-400">
                  {t("chat.empty", "Send us a message!")}
                </p>
                <p className="text-xs text-gray-300">
                  {t("chat.replyTime", "We typically reply within a few minutes.")}
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.senderType === "customer" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    msg.senderType === "customer"
                      ? "bg-[var(--color-brand)] text-[#fff]"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <p
                    className={`mt-1 text-[10px] ${
                      msg.senderType === "customer"
                        ? "text-white/60"
                        : "text-gray-400"
                    }`}
                  >
                    {timeAgo(msg.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Guest intro form */}
          {showIntro && (
            <form
              onSubmit={handleIntroSubmit}
              className="border-t border-gray-100 px-4 py-3 space-y-2 bg-gray-50"
            >
              <p className="text-xs font-medium text-gray-600">
                {t("chat.introPrompt", "Before we start, let us know who you are:")}
              </p>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder={t("chat.namePlaceholder", "Your name")}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[var(--color-brand)]"
                required
                autoFocus
              />
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder={t("chat.emailPlaceholder", "Your email")}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[var(--color-brand)]"
                required
              />
              <button
                type="submit"
                className="w-full rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-bold text-[#fff] hover:bg-[var(--color-brand-dark)]"
              >
                {t("chat.startChat", "Start Chat")}
              </button>
            </form>
          )}

          {/* Input */}
          {!showIntro && (
            <div className="border-t border-gray-100 px-3 py-3">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={t("chat.inputPlaceholder", "Type a message...")}
                  rows={1}
                  className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[var(--color-brand)] max-h-20"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="shrink-0 rounded-xl bg-[var(--color-brand)] p-2.5 text-[#fff] hover:bg-[var(--color-brand-dark)] disabled:opacity-50"
                  aria-label="Send"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating chat button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="fab-chat fixed right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-brand)] text-[#fff] shadow-lg hover:bg-[var(--color-brand-dark)] hover:scale-105 transition-all md:bottom-6 md:right-6"
        aria-label="Open chat"
      >
        {open ? (
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
            />
          </svg>
        )}
        {unread > 0 && !open && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-[#fff]">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    </>
  );
}
