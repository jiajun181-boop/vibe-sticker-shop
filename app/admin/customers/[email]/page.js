"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { formatCad } from "@/lib/admin/format-cad";
import { statusColor, productionColor } from "@/lib/admin/status-labels";

const segmentStyles = {
  VIP: "bg-amber-100 text-amber-800 border-amber-300",
  Regular: "bg-blue-100 text-blue-700 border-blue-300",
  New: "bg-green-100 text-green-700 border-green-300",
  "At Risk": "bg-red-100 text-red-700 border-red-300",
};


export default function CustomerDetailPage() {
  const { email: rawEmail } = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const email = decodeURIComponent(rawEmail);

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [notes, setNotes] = useState([]);
  const [noteContent, setNoteContent] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/customers/${encodeURIComponent(email)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (data.error) {
          setCustomer(null);
        } else {
          setCustomer(data);
        }
      })
      .catch((err) => {
        console.error("[Customer Detail] Load failed:", err);
        setCustomer(null);
      })
      .finally(() => setLoading(false));
  }, [email]);

  // Fetch customer intelligence stats
  useEffect(() => {
    fetch(`/api/admin/customers/${encodeURIComponent(email)}/stats`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setStats(data); })
      .catch((err) => console.error("[Customer Stats] Load failed:", err));
  }, [email]);

  // Fetch customer notes
  const fetchNotes = useCallback(() => {
    fetch(`/api/admin/customers/${encodeURIComponent(email)}/notes`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.data) setNotes(data.data); })
      .catch((err) => console.error("[Customer Notes] Load failed:", err));
  }, [email]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  async function handleAddNote() {
    if (!noteContent.trim()) return;
    setNoteSaving(true);
    try {
      const res = await fetch(`/api/admin/customers/${encodeURIComponent(email)}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: noteContent }),
      });
      if (res.ok) {
        setNoteContent("");
        fetchNotes();
      }
    } catch (err) {
      console.error("[Customer Notes] Add note failed:", err);
    } finally {
      setNoteSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-[#999]">
        {t("admin.common.loading")}
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <p className="text-sm text-[#999]">{t("admin.customerDetail.customerNotFound")}</p>
        <Link
          href="/admin/customers"
          className="text-sm text-black underline hover:no-underline"
        >
          {t("admin.customerDetail.backToCustomers")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          type="button"
          onClick={() => router.push("/admin/customers")}
          className="mb-1 text-xs text-[#999] hover:text-black"
        >
          &larr; {t("admin.customerDetail.backToCustomers")}
        </button>
        <h1 className="text-xl font-semibold text-black">
          {t("admin.customerDetail.title")}
        </h1>
      </div>

      {/* Customer Intelligence Card */}
      {stats && (
        <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5">
          <div className="mb-4 flex items-center gap-3">
            <h2 className="text-sm font-semibold text-black">Customer Intelligence</h2>
            <span className={`rounded-[2px] border px-2.5 py-0.5 text-xs font-bold ${segmentStyles[stats.segment] || "bg-[#f5f5f5] text-[#666]"}`}>
              {stats.segment}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <p className="text-[11px] text-[#999]">Lifetime Value</p>
              <p className="mt-0.5 text-sm font-bold text-black">{formatCad(stats.lifetimeSpend)}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#999]">Avg Order Value</p>
              <p className="mt-0.5 text-sm font-semibold text-black">{formatCad(stats.avgOrderValue)}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#999]">Total Orders</p>
              <p className="mt-0.5 text-sm font-semibold text-black">{stats.totalOrders}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#999]">Last Ordered</p>
              <p className="mt-0.5 text-sm font-semibold text-black">
                {stats.daysSinceLastOrder != null ? `${stats.daysSinceLastOrder} days ago` : "\u2014"}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[#999]">Order Frequency</p>
              <p className="mt-0.5 text-sm font-semibold text-black">{stats.orderFrequency}/mo</p>
            </div>
          </div>
          {stats.topProducts && stats.topProducts.length > 0 && (
            <div className="mt-4">
              <p className="mb-1.5 text-[11px] text-[#999]">Top Products</p>
              <div className="flex flex-wrap gap-1.5">
                {stats.topProducts.map((p) => (
                  <span
                    key={p.name}
                    className="rounded-[2px] bg-[#f0f0f0] px-2 py-0.5 text-[11px] font-medium text-[#444]"
                  >
                    {p.name} ({p.count})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Customer summary card */}
      <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-[#999]">{t("admin.customers.email")}</p>
            <p className="mt-0.5 text-sm font-medium text-black">
              {customer.email}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#999]">{t("admin.customers.name")}</p>
            <p className="mt-0.5 text-sm font-medium text-black">
              {customer.name || "\u2014"}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#999]">{t("admin.customerDetail.totalOrders")}</p>
            <p className="mt-0.5 text-sm font-semibold text-black">
              {customer.orderCount}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#999]">{t("admin.customerDetail.lifetimeSpend")}</p>
            <p className="mt-0.5 text-sm font-semibold text-black">
              {formatCad(customer.totalSpent)}
            </p>
          </div>
        </div>
      </div>

      {/* Order history */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-black">
          {t("admin.customerDetail.orderHistory")} ({customer.orders?.length || 0})
        </h2>

        <div className="overflow-hidden rounded-[3px] border border-[#e0e0e0] bg-white">
          {customer.orders && customer.orders.length > 0 ? (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                        {t("admin.customerDetail.orderId")}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                        {t("admin.orders.status")}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                        {t("admin.orders.production")}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                        {t("admin.customerDetail.items")}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                        {t("admin.orders.amount")}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                        {t("admin.orders.date")}
                      </th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e0e0e0]">
                    {customer.orders.map((order) => (
                      <tr key={order.id} className="hover:bg-[#fafafa]">
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-[#666]">
                            {order.id.slice(0, 8)}...
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-[2px] px-2.5 py-0.5 text-xs font-medium ${
                              statusColor(order.status)
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-[2px] px-2.5 py-0.5 text-xs font-medium ${
                              productionColor(order.productionStatus)
                            }`}
                          >
                            {order.productionStatus?.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#666]">
                          {order.items?.length || 0}{" "}
                          {(order.items?.length || 0) === 1 ? t("admin.customerDetail.item") : t("admin.customerDetail.items")}
                        </td>
                        <td className="px-4 py-3 font-semibold text-black">
                          {formatCad(order.totalAmount)}
                        </td>
                        <td className="px-4 py-3 text-xs text-[#999]">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="text-xs font-medium text-black underline hover:no-underline"
                          >
                            {t("admin.common.view")}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="divide-y divide-[#e0e0e0] lg:hidden">
                {customer.orders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="block px-4 py-3 transition-colors hover:bg-[#fafafa]"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-mono text-xs text-[#666]">
                          {order.id.slice(0, 12)}...
                        </p>
                        <p className="mt-0.5 text-xs text-[#999]">
                          {order.items?.length || 0}{" "}
                          {(order.items?.length || 0) === 1 ? t("admin.customerDetail.item") : t("admin.customerDetail.items")}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-black">
                        {formatCad(order.totalAmount)}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span
                        className={`rounded-[2px] px-2 py-0.5 text-xs font-medium ${
                          statusColor(order.status)
                        }`}
                      >
                        {order.status}
                      </span>
                      <span
                        className={`rounded-[2px] px-2 py-0.5 text-xs font-medium ${
                          productionColor(order.productionStatus)
                        }`}
                      >
                        {order.productionStatus?.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-[#999]">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-32 items-center justify-center text-sm text-[#999]">
              {t("admin.customerDetail.noOrdersFound")}
            </div>
          )}
        </div>
      </div>

      {/* Notes Section */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-black">
          Notes ({notes.length})
        </h2>

        <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-4">
          {/* Add note form */}
          <div className="mb-4">
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Add a note about this customer..."
              className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none placeholder:text-[#999] focus:border-black"
              rows={3}
            />
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={handleAddNote}
                disabled={noteSaving || !noteContent.trim()}
                className="rounded-[3px] bg-black px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#222] disabled:opacity-40"
              >
                {noteSaving ? "Saving..." : "Add Note"}
              </button>
            </div>
          </div>

          {/* Notes list */}
          {notes.length > 0 ? (
            <div className="divide-y divide-[#f0f0f0]">
              {notes.map((note) => (
                <div key={note.id} className="py-3 first:pt-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-semibold text-black">{note.authorName}</span>
                    <span className="shrink-0 text-[10px] text-[#bbb]">
                      {new Date(note.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-[#444]">{note.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-xs text-[#999]">No notes yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
