"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { formatCad } from "@/lib/admin/format-cad";

const STATUSES = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "reviewing", label: "Reviewing" },
  { value: "quoted", label: "Quoted" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
  { value: "converted", label: "Converted" },
];

const STATUS_COLORS = {
  new: "bg-blue-100 text-blue-700",
  reviewing: "bg-amber-100 text-amber-700",
  quoted: "bg-indigo-100 text-indigo-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  expired: "bg-gray-100 text-gray-500",
  converted: "bg-emerald-100 text-emerald-700",
};

export default function AdminQuotesPage() {
  const [quotes, setQuotes] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);

  // Detail panel
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editNotes, setEditNotes] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [saveMsg, setSaveMsg] = useState("");

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "20");
    if (status !== "all") params.set("status", status);
    if (search) params.set("search", search);
    try {
      const res = await fetch(`/api/admin/quotes?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setQuotes(data.quotes || []);
      setPagination(data.pagination || null);
    } catch {
      setError("Failed to load quotes");
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => { fetchQuotes(); }, [fetchQuotes]);

  async function loadDetail(id) {
    setSelected(id);
    setDetail(null);
    setSaveMsg("");
    try {
      const res = await fetch(`/api/admin/quotes/${id}`);
      const data = await res.json();
      setDetail(data.quote);
      setEditNotes(data.quote.adminNotes || "");
      setEditAmount(data.quote.quotedAmountCents ? String(data.quote.quotedAmountCents / 100) : "");
      setEditStatus(data.quote.status);
    } catch {
      setDetail(null);
    }
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    setSaveMsg("");
    try {
      const body = {};
      if (editStatus !== detail.status) body.status = editStatus;
      if (editNotes !== (detail.adminNotes || "")) body.adminNotes = editNotes;
      const amountCents = editAmount ? Math.round(parseFloat(editAmount) * 100) : null;
      if (amountCents !== detail.quotedAmountCents) body.quotedAmountCents = amountCents;

      if (Object.keys(body).length === 0) {
        setSaveMsg("No changes");
        setTimeout(() => setSaveMsg(""), 3000);
        setSaving(false);
        return;
      }

      const res = await fetch(`/api/admin/quotes/${selected}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        setDetail(data.quote);
        setSaveMsg("Saved");
        fetchQuotes();
      } else {
        const data = await res.json().catch(() => ({}));
        setSaveMsg(data.error || "Save failed");
      }
    } catch {
      setSaveMsg("Network error");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 4000);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold text-black">Quote Requests</h1>
        {pagination && (
          <span className="inline-flex items-center rounded-[2px] bg-black px-2.5 py-0.5 text-xs font-medium text-[#fff]">
            {pagination.total}
          </span>
        )}
        <Link
          href="/admin/orders/create"
          className="ml-auto rounded-[3px] bg-black px-4 py-2 text-xs font-semibold text-[#fff] hover:bg-[#222]"
        >
          + Create Order
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex gap-1.5 overflow-x-auto">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => { setStatus(s.value); setPage(1); }}
              className={`whitespace-nowrap rounded-[3px] px-3 py-1.5 text-[11px] font-medium transition-colors ${
                status === s.value ? "bg-black text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchQuotes(); }} className="flex gap-2 sm:ml-auto">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, reference..."
            className="w-full sm:w-64 rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
          />
          <button type="submit" className="rounded-[3px] bg-black px-4 py-2 text-xs font-semibold text-[#fff] hover:bg-[#222]">
            Search
          </button>
        </form>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-[3px] border border-red-300 bg-red-50 px-4 py-3">
          <span className="text-sm font-medium text-red-800">{error}</span>
          <button type="button" onClick={fetchQuotes} className="text-xs font-medium text-red-600 hover:text-red-900">Retry</button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* List */}
        <div className="space-y-2 lg:col-span-2">
          {loading ? (
            <div className="flex h-48 items-center justify-center text-sm text-[#999]">Loading...</div>
          ) : quotes.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-[#999]">No quotes found</div>
          ) : (
            <>
              {quotes.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => loadDetail(q.id)}
                  className={`w-full text-left rounded-[3px] border p-4 transition-colors ${
                    selected === q.id ? "border-black bg-gray-50" : "border-[#e0e0e0] bg-white hover:border-[#999]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-semibold text-black">{q.reference}</span>
                        <span className={`rounded-[2px] px-1.5 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[q.status] || "bg-gray-100 text-gray-600"}`}>
                          {q.status}
                        </span>
                        {q.isRush && <span className="rounded-[2px] bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">RUSH</span>}
                      </div>
                      <p className="mt-0.5 text-xs text-[#666]">
                        {q.customerName}{q.companyName ? ` — ${q.companyName}` : ""} &bull; {q.customerEmail}
                      </p>
                      <p className="mt-0.5 text-[10px] text-[#999]">
                        {q.productType || "Custom"}{q.quantity ? ` × ${q.quantity}` : ""}
                        {q.widthIn && q.heightIn ? ` — ${q.widthIn}" × ${q.heightIn}"` : ""}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      {q.quotedAmountCents != null && (
                        <p className="text-sm font-bold text-black">{formatCad(q.quotedAmountCents)}</p>
                      )}
                      <p className="text-[10px] text-[#999]">
                        {new Date(q.createdAt).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                </button>
              ))}

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium disabled:opacity-30"
                  >
                    Prev
                  </button>
                  <span className="text-xs text-[#999]">
                    {page} / {pagination.totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={page >= pagination.totalPages}
                    className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium disabled:opacity-30"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-1">
          {!selected ? (
            <div className="rounded-[3px] border border-dashed border-[#d0d0d0] p-8 text-center text-xs text-[#999]">
              Select a quote to view details
            </div>
          ) : !detail ? (
            <div className="flex h-48 items-center justify-center text-sm text-[#999]">Loading...</div>
          ) : (
            <div className="space-y-4 rounded-[3px] border border-[#e0e0e0] bg-white p-4">
              <div>
                <h2 className="text-sm font-bold text-black">{detail.reference}</h2>
                <p className="text-[10px] text-[#999]">{new Date(detail.createdAt).toLocaleString("en-CA")}</p>
              </div>

              {/* Customer */}
              <div className="space-y-1 text-xs">
                <p className="font-medium text-[#999]">Customer</p>
                <p className="text-black">{detail.customerName}</p>
                <p className="text-[#666]">{detail.customerEmail}</p>
                {detail.customerPhone && <p className="text-[#666]">{detail.customerPhone}</p>}
                {detail.companyName && <p className="text-[#666]">{detail.companyName}</p>}
              </div>

              {/* Product */}
              <div className="space-y-1 text-xs">
                <p className="font-medium text-[#999]">Product Details</p>
                {detail.productType && <p>Type: <strong>{detail.productType}</strong></p>}
                {detail.quantity && <p>Qty: <strong>{detail.quantity}</strong></p>}
                {detail.widthIn && detail.heightIn && <p>Size: <strong>{detail.widthIn}&quot; &times; {detail.heightIn}&quot;</strong></p>}
                {detail.material && <p>Material: <strong>{detail.material}</strong></p>}
                {detail.colorMode && <p>Color: <strong>{detail.colorMode}</strong></p>}
                {detail.neededBy && <p>Needed by: <strong>{detail.neededBy}</strong></p>}
                {detail.isRush && <p className="font-bold text-red-600">RUSH ORDER</p>}
              </div>

              {detail.description && (
                <div className="text-xs">
                  <p className="font-medium text-[#999]">Description</p>
                  <p className="mt-1 whitespace-pre-wrap text-[#333]">{detail.description}</p>
                </div>
              )}

              {detail.fileUrls?.length > 0 && (
                <div className="text-xs">
                  <p className="font-medium text-[#999]">Files ({detail.fileUrls.length})</p>
                  {detail.fileUrls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="mt-1 block truncate text-blue-600 hover:underline">
                      {url.split("/").pop() || `File ${i + 1}`}
                    </a>
                  ))}
                </div>
              )}

              <hr className="border-[#e0e0e0]" />

              {/* Admin actions */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-[#999]">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="mt-1 w-full rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs"
                  >
                    {STATUSES.filter((s) => s.value !== "all").map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase text-[#999]">Quoted Amount (CAD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    placeholder="e.g. 125.00"
                    className="mt-1 w-full rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase text-[#999]">Admin Notes</label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full rounded-[3px] bg-black px-4 py-2 text-xs font-semibold text-[#fff] hover:bg-[#222] disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>

                {saveMsg && (
                  <p className={`text-center text-xs font-medium ${saveMsg === "Saved" ? "text-green-600" : "text-red-600"}`}>
                    {saveMsg}
                  </p>
                )}

                {/* Convert to order */}
                {!detail.convertedOrderId && detail.status !== "converted" && (
                  <Link
                    href={`/admin/orders/create?fromQuote=${detail.id}&email=${encodeURIComponent(detail.customerEmail)}&name=${encodeURIComponent(detail.customerName)}&phone=${encodeURIComponent(detail.customerPhone || "")}&product=${encodeURIComponent(detail.productType || "")}&qty=${detail.quantity || ""}&width=${detail.widthIn || ""}&height=${detail.heightIn || ""}`}
                    className="block w-full rounded-[3px] border border-[#d0d0d0] px-4 py-2 text-center text-xs font-semibold text-black hover:border-black hover:bg-[#fafafa]"
                  >
                    Convert to Order &rarr;
                  </Link>
                )}

                {detail.convertedOrderId && (
                  <Link
                    href={`/admin/orders/${detail.convertedOrderId}`}
                    className="block w-full rounded-[3px] border border-green-300 bg-green-50 px-4 py-2 text-center text-xs font-semibold text-green-700 hover:bg-green-100"
                  >
                    View Converted Order &rarr;
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
