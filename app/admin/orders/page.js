"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
    cents / 100
  );

const statusColors = {
  draft: "bg-gray-100 text-gray-700",
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  canceled: "bg-red-100 text-red-700",
  refunded: "bg-purple-100 text-purple-700",
};

const paymentColors = {
  unpaid: "bg-red-100 text-red-700",
  paid: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-purple-100 text-purple-700",
  partially_refunded: "bg-orange-100 text-orange-700",
};

const productionColors = {
  not_started: "bg-gray-100 text-gray-600",
  preflight: "bg-blue-100 text-blue-700",
  in_production: "bg-indigo-100 text-indigo-700",
  ready_to_ship: "bg-cyan-100 text-cyan-700",
  shipped: "bg-purple-100 text-purple-700",
  completed: "bg-green-100 text-green-700",
  on_hold: "bg-yellow-100 text-yellow-800",
  canceled: "bg-red-100 text-red-700",
};

const statuses = ["all", "pending", "paid", "draft", "canceled", "refunded"];

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="flex h-48 items-center justify-center text-sm text-[#999]">Loading...</div>}>
      <OrdersContent />
    </Suspense>
  );
}

function OrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "all"
  );
  const page = parseInt(searchParams.get("page") || "1");
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [bulkUpdating, setBulkUpdating] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "20");
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (search) params.set("search", search);
    params.set("sort", "createdAt");
    params.set("order", "desc");

    try {
      const res = await fetch(`/api/admin/orders?${params}`);
      const text = await res.text();
      if (!res.ok) {
        console.error("Orders API error:", res.status, text);
        setOrders([]);
        setPagination(null);
        return;
      }
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Orders API returned invalid JSON:", text.slice(0, 200));
        setOrders([]);
        setPagination(null);
        return;
      }
      setOrders(data.orders || []);
      setPagination(data.pagination || null);
    } catch (err) {
      console.error("Failed to load orders:", err);
      setOrders([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  function updateParams(updates) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`/admin/orders?${params}`);
  }

  function handleSearch(e) {
    e.preventDefault();
    updateParams({ search: search || null, page: "1" });
  }

  function toggleSelectOrder(orderId) {
    setSelectedOrders(prev =>
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  }

  function toggleSelectAll() {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(o => o.id));
    }
  }

  async function handleBulkUpdateStatus(status) {
    if (!status || selectedOrders.length === 0) return;
    const confirmed = confirm(`Update ${selectedOrders.length} orders to status: ${status}?`);
    if (!confirmed) return;

    setBulkUpdating(true);
    try {
      await fetch('/api/admin/orders/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: selectedOrders, updates: { status } })
      });
      setSelectedOrders([]);
      await fetchOrders();
    } catch (err) {
      console.error('Bulk update failed:', err);
    } finally {
      setBulkUpdating(false);
    }
  }

  async function handleBulkExport() {
    if (selectedOrders.length === 0) return;
    try {
      const res = await fetch('/api/admin/orders/bulk-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: selectedOrders })
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'orders-export.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-black">Orders</h1>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Status tabs */}
        <div className="flex flex-wrap gap-1">
          {statuses.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setStatusFilter(s);
                updateParams({ status: s === "all" ? null : s, page: "1" });
              }}
              className={`rounded-[3px] px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                statusFilter === s
                  ? "bg-black text-white"
                  : "bg-white text-[#666] border border-[#e0e0e0] hover:border-black hover:text-black"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email or order ID..."
            className="w-full sm:w-64 rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
          />
          <button
            type="submit"
            className="rounded-[3px] bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-[#222]"
          >
            Search
          </button>
        </form>
      </div>

      {/* Bulk Action Bar */}
      {selectedOrders.length > 0 && (
        <div className="sticky top-0 z-10 rounded-[3px] border border-[#e0e0e0] bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-medium text-black">
              {selectedOrders.length} order{selectedOrders.length > 1 ? "s" : ""} selected
            </span>
            <div className="flex flex-wrap gap-2">
              <select
                onChange={(e) => { handleBulkUpdateStatus(e.target.value); e.target.value = ""; }}
                disabled={bulkUpdating}
                className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs text-black"
                defaultValue=""
              >
                <option value="" disabled>Update Status...</option>
                <option value="pending">Mark Pending</option>
                <option value="paid">Mark Paid</option>
                <option value="canceled">Mark Canceled</option>
                <option value="refunded">Mark Refunded</option>
              </select>
              <button
                onClick={handleBulkExport}
                disabled={bulkUpdating}
                className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:border-black"
              >
                Export CSV
              </button>
              <button
                onClick={() => setSelectedOrders([])}
                className="text-xs text-[#999] hover:text-black"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-[3px] border border-[#e0e0e0] bg-white">
        {loading ? (
          <div className="flex h-48 items-center justify-center text-sm text-[#999]">
            Loading...
          </div>
        ) : orders.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-[#999]">
            No orders found
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={selectedOrders.length === orders.length && orders.length > 0}
                        onChange={toggleSelectAll}
                        className="h-4 w-4"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#999]">
                      Order
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#999]">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#999]">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#999]">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#999]">
                      Payment
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#999]">
                      Production
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#999]">
                      Date
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e0e0e0]">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#fafafa]">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order.id)}
                          onChange={() => toggleSelectOrder(order.id)}
                          className="h-4 w-4"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-[#666]">
                          {order.id.slice(0, 8)}...
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-black">
                            {order.customerEmail}
                          </p>
                          {order.customerName && (
                            <p className="text-xs text-[#999]">
                              {order.customerName}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold tabular-nums text-black">
                        {formatCad(order.totalAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-[2px] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            statusColors[order.status] || "bg-gray-100"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-[2px] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            paymentColors[order.paymentStatus] || "bg-gray-100"
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-[2px] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            productionColors[order.productionStatus] ||
                            "bg-gray-100"
                          }`}
                        >
                          {order.productionStatus?.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#999]">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-xs font-medium text-black underline hover:no-underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-[#e0e0e0] lg:hidden">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[#fafafa]"
                >
                  <input
                    type="checkbox"
                    checked={selectedOrders.includes(order.id)}
                    onChange={() => toggleSelectOrder(order.id)}
                    className="mt-1 h-4 w-4"
                  />
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="block flex-1"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-black">
                          {order.customerEmail}
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-[#999]">
                          {order.id.slice(0, 12)}...
                        </p>
                      </div>
                      <span className="text-sm font-semibold tabular-nums text-black">
                        {formatCad(order.totalAmount)}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span
                        className={`rounded-[2px] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          statusColors[order.status] || "bg-gray-100"
                        }`}
                      >
                        {order.status}
                      </span>
                      <span
                        className={`rounded-[2px] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          productionColors[order.productionStatus] ||
                          "bg-gray-100"
                        }`}
                      >
                        {order.productionStatus?.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-[#999]">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-[#999]">
            Showing {(pagination.page - 1) * pagination.limit + 1}-
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total}
          </p>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => updateParams({ page: String(page - 1) })}
              className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:border-black disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= pagination.totalPages}
              onClick={() => updateParams({ page: String(page + 1) })}
              className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:border-black disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
