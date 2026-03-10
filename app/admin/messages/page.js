"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { timeAgo as sharedTimeAgo } from "@/lib/admin/time-ago";
import { useTranslation } from "@/lib/i18n/useTranslation";

function truncate(str, len) {
  if (!str) return "";
  return str.length > len ? str.slice(0, len) + "..." : str;
}

export default function AdminMessagesPage() {
  const { t } = useTranslation();
  const timeAgo = (d) => sharedTimeAgo(d, t);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [mobileView, setMobileView] = useState("list"); // "list" | "detail"
  const scrollRef = useRef(null);
  const pollRef = useRef(null);

  const fetchConversations = useCallback(async () => {
    try {
      const url = filter === "all" ? "/api/conversations" : `/api/conversations?status=${filter}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      setConversations(data.conversations || []);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  const fetchMessages = useCallback(async (convId) => {
    if (!convId) return;
    setMsgLoading(true);
    try {
      const res = await fetch(`/api/messages?conversationId=${convId}&viewer=staff`);
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages || []);
    } finally {
      setMsgLoading(false);
    }
  }, []);

  const selectConversation = (id) => {
    setSelectedId(id);
    setMobileView("detail");
    fetchMessages(id);
  };

  // Poll messages for selected conversation
  useEffect(() => {
    if (!selectedId) return;
    pollRef.current = setInterval(() => fetchMessages(selectedId), 10000);
    return () => clearInterval(pollRef.current);
  }, [selectedId, fetchMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!reply.trim() || !selectedId || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedId,
          content: reply.trim(),
          senderType: "staff",
          senderName: "Support",
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setMessages((prev) => [...prev, data.message]);
      setReply("");
      fetchConversations();
    } finally {
      setSending(false);
    }
  };

  const handleClose = async () => {
    if (!selectedId) return;
    await fetch("/api/conversations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selectedId, status: "closed" }),
    });
    fetchConversations();
  };

  const handleReopen = async () => {
    if (!selectedId) return;
    await fetch("/api/conversations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selectedId, status: "open" }),
    });
    fetchConversations();
  };

  const selectedConv = conversations.find((c) => c.id === selectedId);

  const filtered = conversations.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (c.customerName || "").toLowerCase().includes(q) ||
      (c.customerEmail || "").toLowerCase().includes(q)
    );
  });

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  if (loading) {
    return (
      <div className="p-8">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Messages</h1>
          <p className="text-sm text-gray-500">
            Customer conversations
            {totalUnread > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                {totalUnread} unread
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="flex h-[calc(100vh-200px)] overflow-hidden rounded-xl border border-gray-200 bg-white">
        {/* Left: Conversation list */}
        <div
          className={`w-full flex-shrink-0 border-r border-gray-200 md:w-[300px] ${
            mobileView === "detail" ? "hidden md:flex md:flex-col" : "flex flex-col"
          }`}
        >
          {/* Filters */}
          <div className="border-b border-gray-100 px-3 py-2 space-y-2">
            <div className="flex gap-1">
              {["all", "open", "closed"].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold capitalize ${
                    filter === f
                      ? "bg-gray-900 text-[#fff]"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email..."
              className="w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-xs outline-none focus:border-gray-400"
            />
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">No conversations</p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectConversation(c.id)}
                  className={`w-full border-b border-gray-50 px-3 py-3 text-left transition-colors hover:bg-gray-50 ${
                    selectedId === c.id ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm ${
                          c.unreadCount > 0
                            ? "font-bold text-gray-900"
                            : "font-medium text-gray-700"
                        }`}
                      >
                        {c.customerName || c.customerEmail || "Anonymous"}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-gray-500">
                        {truncate(c.lastMessage, 40)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[10px] text-gray-400">
                        {timeAgo(c.lastMessageAt)}
                      </span>
                      {c.unreadCount > 0 && (
                        <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-[#fff]">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Message detail */}
        <div
          className={`flex flex-1 flex-col ${
            mobileView === "list" ? "hidden md:flex" : "flex"
          }`}
        >
          {!selectedId ? (
            <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
              Select a conversation
            </div>
          ) : (
            <>
              {/* Detail header */}
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMobileView("list")}
                    className="rounded p-1 text-gray-400 hover:text-gray-600 md:hidden"
                    aria-label="Back"
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
                        d="M15.75 19.5L8.25 12l7.5-7.5"
                      />
                    </svg>
                  </button>
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {selectedConv?.customerName || "Anonymous"}
                    </p>
                    {selectedConv?.customerEmail && (
                      <p className="text-xs text-gray-500">{selectedConv.customerEmail}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedConv?.status === "open" ? (
                    <button
                      type="button"
                      onClick={handleClose}
                      className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-200"
                    >
                      Close
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleReopen}
                      className="rounded-md bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-200"
                    >
                      Reopen
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {msgLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-gray-600" />
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.senderType === "staff" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                          msg.senderType === "staff"
                            ? "bg-blue-600 text-[#fff]"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        <p
                          className={`mt-1 text-[10px] ${
                            msg.senderType === "staff" ? "text-white/60" : "text-gray-400"
                          }`}
                        >
                          {msg.senderName && `${msg.senderName} · `}
                          {timeAgo(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Reply input */}
              <div className="border-t border-gray-100 px-4 py-3">
                <div className="flex items-end gap-2">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Type a reply..."
                    rows={2}
                    className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 max-h-24"
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!reply.trim() || sending}
                    className="shrink-0 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-[#fff] hover:bg-blue-700 disabled:opacity-50"
                  >
                    {sending ? "..." : "Send"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
