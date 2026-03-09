"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

// ── Helpers ──

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
    cents / 100
  );

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-CA") : "—");

const formatWeight = (w) => (w != null ? `${w} kg` : "—");

// ── Tracking URLs ──

const TRACKING_URLS = {
  canada_post: (t) =>
    `https://www.canadapost-postescanada.ca/track-reperage/en#/search?searchFor=${t}`,
  purolator: (t) =>
    `https://www.purolator.com/en/shipping/tracker?pin=${t}`,
  ups: (t) => `https://www.ups.com/track?tracknum=${t}`,
  fedex: (t) => `https://www.fedex.com/fedextrack/?trknbr=${t}`,
};

function getTrackingUrl(carrier, trackingNumber) {
  const fn = TRACKING_URLS[carrier];
  return fn ? fn(trackingNumber) : null;
}

// ── Constants ──

const STATUSES = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "label_created", label: "Label Created" },
  { value: "picked_up", label: "Picked Up" },
  { value: "in_transit", label: "In Transit" },
  { value: "delivered", label: "Delivered" },
  { value: "returned", label: "Returned" },
  { value: "exception", label: "Exception" },
];

const CARRIERS = [
  { value: "all", label: "All Carriers" },
  { value: "canada_post", label: "Canada Post" },
  { value: "purolator", label: "Purolator" },
  { value: "ups", label: "UPS" },
  { value: "fedex", label: "FedEx" },
  { value: "pickup", label: "Pickup" },
];

const STATUS_COLORS = {
  pending: "bg-gray-100 text-gray-700",
  label_created: "bg-blue-100 text-blue-700",
  picked_up: "bg-indigo-100 text-indigo-700",
  in_transit: "bg-amber-100 text-amber-700",
  delivered: "bg-green-100 text-green-700",
  returned: "bg-red-100 text-red-700",
  exception: "bg-red-100 text-red-700",
};

const CARRIER_COLORS = {
  canada_post: "bg-red-100 text-red-700",
  purolator: "bg-purple-100 text-purple-700",
  ups: "bg-amber-100 text-amber-800",
  fedex: "bg-blue-100 text-blue-700",
  pickup: "bg-gray-100 text-gray-600",
};

const CARRIER_LABELS = {
  canada_post: "Canada Post",
  purolator: "Purolator",
  ups: "UPS",
  fedex: "FedEx",
  pickup: "Pickup",
};

const STATUS_LABELS = {
  pending: "Pending",
  label_created: "Label Created",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  delivered: "Delivered",
  returned: "Returned",
  exception: "Exception",
};

const TABS = [
  { key: "shipments", label: "Shipments" },
  { key: "batch", label: "Batch Ship" },
  { key: "stats", label: "Stats" },
];

// ── Main Page ──

export default function ShippingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-48 items-center justify-center text-sm text-[#999]">
          Loading...
        </div>
      }
    >
      <ShippingContent />
    </Suspense>
  );
}

function ShippingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "shipments"
  );

  function switchTab(tab) {
    setActiveTab(tab);
    const params = new URLSearchParams();
    if (tab !== "shipments") params.set("tab", tab);
    router.push(`/admin/shipping${params.toString() ? "?" + params : ""}`);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-black">Shipping</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => switchTab(tab.key)}
            className={`rounded-[3px] px-4 py-1.5 text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-black text-[#fff]"
                : "bg-white text-[#666] border border-[#e0e0e0] hover:border-black hover:text-black"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "shipments" && <ShipmentsTab />}
      {activeTab === "batch" && <BatchShipTab />}
      {activeTab === "stats" && <StatsTab />}
    </div>
  );
}

// ═════════════════════════════════════════════════
// Tab 1: Shipments
// ═════════════════════════════════════════════════

function ShipmentsTab() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [shipments, setShipments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Filters
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "all"
  );
  const [carrierFilter, setCarrierFilter] = useState(
    searchParams.get("carrier") || "all"
  );
  const [dateFrom, setDateFrom] = useState(
    searchParams.get("date_from") || ""
  );
  const [dateTo, setDateTo] = useState(searchParams.get("date_to") || "");
  const page = parseInt(searchParams.get("page") || "1");

  // Create shipment modal
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Edit shipment modal
  const [editShipment, setEditShipment] = useState(null);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState(null);

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "20");
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (carrierFilter !== "all") params.set("carrier", carrierFilter);
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    if (search) params.set("search", search);

    try {
      const res = await fetch(`/api/admin/shipping?${params}`);
      const data = await res.json();
      setShipments(data.data || []);
      setPagination(data.pagination || null);
    } catch (err) {
      console.error("Failed to load shipments:", err);
      setShipments([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, carrierFilter, dateFrom, dateTo, search]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  function updateParams(updates) {
    const params = new URLSearchParams(searchParams.toString());
    // Preserve the tab param
    params.set("tab", "shipments");
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    // Clean up default tab
    if (params.get("tab") === "shipments") params.delete("tab");
    router.push(`/admin/shipping?${params}`);
  }

  function handleSearch(e) {
    e.preventDefault();
    updateParams({ search: search || null, page: "1" });
  }

  function toggleSelect(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleSelectAll() {
    if (selectedIds.length === shipments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(shipments.map((s) => s.id));
    }
  }

  async function handleBulkAction(newStatus) {
    if (!newStatus || selectedIds.length === 0) return;
    const label = STATUS_LABELS[newStatus] || newStatus;
    const confirmed = confirm(
      `Update ${selectedIds.length} shipment(s) to "${label}"?`
    );
    if (!confirmed) return;

    setBulkUpdating(true);
    try {
      const results = await Promise.allSettled(
        selectedIds.map((id) =>
          fetch(`/api/admin/shipping/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
          })
        )
      );
      const failures = results.filter((r) => r.status === "rejected").length;
      if (failures > 0) {
        alert(`${failures} update(s) failed.`);
      }
      setSelectedIds([]);
      await fetchShipments();
    } catch (err) {
      console.error("Bulk action failed:", err);
    } finally {
      setBulkUpdating(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = confirm("Delete this shipment? This cannot be undone.");
    if (!confirmed) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/shipping/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchShipments();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete");
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      {/* Filter bar */}
      <div className="flex flex-col gap-3 rounded-[3px] border border-[#e0e0e0] bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-center">
        {/* Status */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="shipping-status-filter"
            className="text-xs font-medium text-[#999]"
          >
            Status
          </label>
          <select
            id="shipping-status-filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              updateParams({
                status: e.target.value === "all" ? null : e.target.value,
                page: "1",
              });
            }}
            className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black outline-none focus:border-black"
          >
            {STATUSES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Carrier */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="shipping-carrier-filter"
            className="text-xs font-medium text-[#999]"
          >
            Carrier
          </label>
          <select
            id="shipping-carrier-filter"
            value={carrierFilter}
            onChange={(e) => {
              setCarrierFilter(e.target.value);
              updateParams({
                carrier: e.target.value === "all" ? null : e.target.value,
                page: "1",
              });
            }}
            className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black outline-none focus:border-black"
          >
            {CARRIERS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date From */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="shipping-date-from"
            className="text-xs font-medium text-[#999]"
          >
            From
          </label>
          <input
            id="shipping-date-from"
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              updateParams({ date_from: e.target.value || null, page: "1" });
            }}
            className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs text-black outline-none focus:border-black"
          />
        </div>

        {/* Date To */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="shipping-date-to"
            className="text-xs font-medium text-[#999]"
          >
            To
          </label>
          <input
            id="shipping-date-to"
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              updateParams({ date_to: e.target.value || null, page: "1" });
            }}
            className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs text-black outline-none focus:border-black"
          />
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 sm:ml-auto">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tracking # or Order ID..."
            className="w-full sm:w-64 rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
          />
          <button
            type="submit"
            className="rounded-[3px] bg-black px-4 py-2 text-xs font-semibold text-[#fff] hover:bg-[#222]"
          >
            Search
          </button>
        </form>
      </div>

      {/* Create button + Bulk actions */}
      <div className="flex items-center justify-between">
        <div>
          {selectedIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-black">
                {selectedIds.length} selected
              </span>
              <select
                onChange={(e) => {
                  handleBulkAction(e.target.value);
                  e.target.value = "";
                }}
                disabled={bulkUpdating}
                className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs text-black"
                defaultValue=""
              >
                <option value="" disabled>
                  Bulk Action...
                </option>
                <option value="picked_up">Mark Shipped</option>
                <option value="delivered">Mark Delivered</option>
              </select>
              <button
                onClick={() => setSelectedIds([])}
                className="text-xs text-[#999] hover:text-black"
              >
                Clear
              </button>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="rounded-[3px] bg-black px-4 py-2 text-xs font-semibold text-[#fff] hover:bg-[#222]"
        >
          + Create Shipment
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-[3px] border border-[#e0e0e0] bg-white shadow-sm">
        {loading ? (
          <div className="flex h-48 items-center justify-center text-sm text-[#999]">
            Loading...
          </div>
        ) : shipments.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-sm text-[#999]">
            <p>No shipments found</p>
            <p className="text-xs">
              Create a shipment or adjust your filters
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto xl:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={
                          selectedIds.length === shipments.length &&
                          shipments.length > 0
                        }
                        onChange={toggleSelectAll}
                        className="h-4 w-4"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#999]">
                      Order ID
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#999]">
                      Carrier
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#999]">
                      Tracking #
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#999]">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#999]">
                      Shipped
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#999]">
                      Weight
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#999]">
                      Cost
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#999]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e0e0e0]">
                  {shipments.map((s) => {
                    const trackUrl =
                      s.trackingNumber
                        ? getTrackingUrl(s.carrier, s.trackingNumber)
                        : null;
                    return (
                      <tr
                        key={s.id}
                        className={`hover:bg-[#fafafa] ${
                          deletingId === s.id ? "opacity-50" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(s.id)}
                            onChange={() => toggleSelect(s.id)}
                            className="h-4 w-4"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/orders/${s.orderId}`}
                            className="font-mono text-xs text-black underline hover:no-underline"
                          >
                            {s.orderId.slice(0, 8)}...
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-[2px] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              CARRIER_COLORS[s.carrier] || "bg-gray-100"
                            }`}
                          >
                            {CARRIER_LABELS[s.carrier] || s.carrier}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {s.trackingNumber ? (
                            trackUrl ? (
                              <a
                                href={trackUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-xs text-blue-600 underline hover:no-underline"
                              >
                                {s.trackingNumber}
                              </a>
                            ) : (
                              <span className="font-mono text-xs text-[#666]">
                                {s.trackingNumber}
                              </span>
                            )
                          ) : (
                            <span className="text-xs text-[#999]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-[2px] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              STATUS_COLORS[s.status] || "bg-gray-100"
                            }`}
                          >
                            {STATUS_LABELS[s.status] || s.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#999]">
                          {formatDate(s.shippedAt)}
                        </td>
                        <td className="px-4 py-3 text-xs text-[#666]">
                          {formatWeight(s.weight)}
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold tabular-nums text-black">
                          {s.shippingCost != null
                            ? formatCad(s.shippingCost)
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setEditShipment(s)}
                              className="text-xs font-medium text-black underline hover:no-underline"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(s.id)}
                              disabled={deletingId === s.id}
                              className="text-xs font-medium text-red-600 underline hover:no-underline"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-[#e0e0e0] xl:hidden">
              {shipments.map((s) => {
                const trackUrl =
                  s.trackingNumber
                    ? getTrackingUrl(s.carrier, s.trackingNumber)
                    : null;
                return (
                  <div
                    key={s.id}
                    className={`px-4 py-3 transition-colors hover:bg-[#fafafa] ${
                      deletingId === s.id ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(s.id)}
                          onChange={() => toggleSelect(s.id)}
                          className="mt-1 h-4 w-4"
                        />
                        <div className="min-w-0">
                          <Link
                            href={`/admin/orders/${s.orderId}`}
                            className="font-mono text-xs text-black underline hover:no-underline"
                          >
                            Order: {s.orderId.slice(0, 8)}...
                          </Link>
                          {s.trackingNumber && (
                            <p className="mt-0.5">
                              {trackUrl ? (
                                <a
                                  href={trackUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-mono text-xs text-blue-600 underline hover:no-underline"
                                >
                                  {s.trackingNumber}
                                </a>
                              ) : (
                                <span className="font-mono text-xs text-[#666]">
                                  {s.trackingNumber}
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditShipment(s)}
                          className="text-xs font-medium text-black underline hover:no-underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(s.id)}
                          className="text-xs font-medium text-red-600 underline hover:no-underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded-[2px] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          CARRIER_COLORS[s.carrier] || "bg-gray-100"
                        }`}
                      >
                        {CARRIER_LABELS[s.carrier] || s.carrier}
                      </span>
                      <span
                        className={`rounded-[2px] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          STATUS_COLORS[s.status] || "bg-gray-100"
                        }`}
                      >
                        {STATUS_LABELS[s.status] || s.status}
                      </span>
                      {s.shippingCost != null && (
                        <span className="text-xs font-semibold text-black">
                          {formatCad(s.shippingCost)}
                        </span>
                      )}
                      <span className="text-xs text-[#999]">
                        {formatDate(s.shippedAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
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
              className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:bg-[#fafafa] disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= pagination.pages}
              onClick={() => updateParams({ page: String(page + 1) })}
              className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:bg-[#fafafa] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <ShipmentFormModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchShipments();
          }}
        />
      )}

      {/* Edit Modal */}
      {editShipment && (
        <ShipmentFormModal
          shipment={editShipment}
          onClose={() => setEditShipment(null)}
          onSuccess={() => {
            setEditShipment(null);
            fetchShipments();
          }}
        />
      )}
    </>
  );
}

// ── Shipment Form Modal (Create / Edit) ──

function ShipmentFormModal({ shipment, onClose, onSuccess }) {
  const isEdit = !!shipment;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    orderId: shipment?.orderId || "",
    carrier: shipment?.carrier || "canada_post",
    trackingNumber: shipment?.trackingNumber || "",
    status: shipment?.status || "pending",
    weight: shipment?.weight != null ? String(shipment.weight) : "",
    dimensions: shipment?.dimensions || "",
    shippingCost:
      shipment?.shippingCost != null
        ? (shipment.shippingCost / 100).toFixed(2)
        : "",
    notes: shipment?.notes || "",
  });

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!isEdit && !form.orderId.trim()) {
      setError("Order ID is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...(isEdit ? {} : { orderId: form.orderId.trim() }),
        carrier: form.carrier,
        trackingNumber: form.trackingNumber.trim() || null,
        status: form.status,
        weight: form.weight ? form.weight : null,
        dimensions: form.dimensions.trim() || null,
        shippingCost: form.shippingCost
          ? Math.round(parseFloat(form.shippingCost) * 100)
          : null,
        notes: form.notes.trim() || null,
      };

      const url = isEdit
        ? `/api/admin/shipping/${shipment.id}`
        : "/api/admin/shipping";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save shipment");
        return;
      }

      onSuccess();
    } catch (err) {
      console.error("Save failed:", err);
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="mx-4 w-full max-w-lg rounded-[3px] bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-sm font-bold text-[#111]">
          {isEdit ? "Edit Shipment" : "Create Shipment"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Order ID (only for create) */}
          {!isEdit && (
            <div>
              <label className="mb-1 block text-[11px] font-medium text-[#666]">
                Order ID
              </label>
              <input
                type="text"
                value={form.orderId}
                onChange={(e) => updateField("orderId", e.target.value)}
                placeholder="Paste order ID..."
                className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                autoFocus
              />
            </div>
          )}

          {/* Carrier */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-[#666]">
              Carrier
            </label>
            <select
              value={form.carrier}
              onChange={(e) => updateField("carrier", e.target.value)}
              className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
            >
              {CARRIERS.filter((c) => c.value !== "all").map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status (only for edit) */}
          {isEdit && (
            <div>
              <label className="mb-1 block text-[11px] font-medium text-[#666]">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => updateField("status", e.target.value)}
                className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
              >
                {STATUSES.filter((s) => s.value !== "all").map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tracking Number */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-[#666]">
              Tracking Number
            </label>
            <input
              type="text"
              value={form.trackingNumber}
              onChange={(e) => updateField("trackingNumber", e.target.value)}
              placeholder="e.g. 1234567890"
              className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
            />
          </div>

          {/* Weight + Dimensions row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-[#666]">
                Weight (kg)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.weight}
                onChange={(e) => updateField("weight", e.target.value)}
                placeholder="0.50"
                className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-[#666]">
                Dimensions (LxWxH)
              </label>
              <input
                type="text"
                value={form.dimensions}
                onChange={(e) => updateField("dimensions", e.target.value)}
                placeholder="30x20x10"
                className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
              />
            </div>
          </div>

          {/* Shipping Cost */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-[#666]">
              Shipping Cost ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.shippingCost}
              onChange={(e) => updateField("shippingCost", e.target.value)}
              placeholder="12.99"
              className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-[#666]">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              rows={2}
              placeholder="Optional notes..."
              className="w-full resize-none rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-[3px] bg-black py-2 text-xs font-semibold text-[#fff] hover:bg-[#222] disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : isEdit
                ? "Update Shipment"
                : "Create Shipment"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-[3px] border border-[#d0d0d0] px-4 py-2 text-xs font-medium text-[#666] hover:bg-[#fafafa]"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════
// Tab 2: Batch Ship
// ═════════════════════════════════════════════════

function BatchShipTab() {
  const [mode, setMode] = useState("paste"); // "paste" or "select"
  const [batchCarrier, setBatchCarrier] = useState("canada_post");
  const [pasteText, setPasteText] = useState("");
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [trackingInputs, setTrackingInputs] = useState({});
  const [shipping, setShipping] = useState(false);
  const [results, setResults] = useState(null);

  // Fetch pending orders for select mode
  async function loadPendingOrders() {
    setLoadingOrders(true);
    try {
      const res = await fetch(
        "/api/admin/orders?status=paid&limit=100&sort=createdAt&order=desc"
      );
      const data = await res.json();
      setPendingOrders(data.orders || []);
    } catch (err) {
      console.error("Failed to load pending orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  }

  useEffect(() => {
    if (mode === "select") {
      loadPendingOrders();
    }
  }, [mode]);

  function toggleOrderSelect(orderId) {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  }

  function updateTracking(orderId, value) {
    setTrackingInputs((prev) => ({ ...prev, [orderId]: value }));
  }

  // Process paste mode
  function parsePasteEntries() {
    return pasteText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        const parts = line.split(",").map((p) => p.trim());
        return {
          orderId: parts[0] || "",
          carrier: parts[1] || batchCarrier,
          trackingNumber: parts[2] || "",
          weight: parts[3] || null,
        };
      });
  }

  async function handleBatchShip() {
    setResults(null);

    let shipments = [];

    if (mode === "paste") {
      shipments = parsePasteEntries();
      if (shipments.length === 0) {
        setResults({ error: "No entries to ship. Add at least one line." });
        return;
      }
      // Validate orderId present
      const missing = shipments.filter((s) => !s.orderId);
      if (missing.length > 0) {
        setResults({ error: "Some entries are missing an Order ID." });
        return;
      }
    } else {
      // Select mode
      if (selectedOrderIds.length === 0) {
        setResults({ error: "Select at least one order to ship." });
        return;
      }
      shipments = selectedOrderIds.map((orderId) => ({
        orderId,
        carrier: batchCarrier,
        trackingNumber: trackingInputs[orderId] || "",
      }));
    }

    setShipping(true);
    try {
      const res = await fetch("/api/admin/shipping/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipments }),
      });
      const data = await res.json();

      if (!res.ok) {
        setResults({
          error: data.error || "Batch ship failed",
          missingIds: data.missingIds || [],
        });
      } else {
        setResults({
          success: true,
          created: data.created,
          data: data.data,
        });
        // Reset form
        setPasteText("");
        setSelectedOrderIds([]);
        setTrackingInputs({});
      }
    } catch (err) {
      console.error("Batch ship error:", err);
      setResults({ error: "Network error" });
    } finally {
      setShipping(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Mode selector */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("paste")}
          className={`rounded-[3px] px-4 py-1.5 text-xs font-medium transition-colors ${
            mode === "paste"
              ? "bg-black text-[#fff]"
              : "border border-[#e0e0e0] bg-white text-[#666] hover:border-black hover:text-black"
          }`}
        >
          Paste Mode
        </button>
        <button
          type="button"
          onClick={() => setMode("select")}
          className={`rounded-[3px] px-4 py-1.5 text-xs font-medium transition-colors ${
            mode === "select"
              ? "bg-black text-[#fff]"
              : "border border-[#e0e0e0] bg-white text-[#666] hover:border-black hover:text-black"
          }`}
        >
          Select Orders
        </button>
      </div>

      {/* Carrier selector (shared) */}
      <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-[#999]">
            Default Carrier
          </label>
          <select
            value={batchCarrier}
            onChange={(e) => setBatchCarrier(e.target.value)}
            className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black outline-none focus:border-black"
          >
            {CARRIERS.filter((c) => c.value !== "all").map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Paste mode */}
      {mode === "paste" && (
        <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-4 shadow-sm">
          <p className="mb-2 text-xs text-[#999]">
            Paste one shipment per line:{" "}
            <code className="rounded bg-[#f5f5f5] px-1 py-0.5 text-[10px]">
              orderId, carrier, trackingNumber, weight
            </code>
          </p>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={8}
            placeholder={`clxyz123, canada_post, 123456789, 0.5\nclxyz456, purolator, 987654321, 1.2`}
            className="w-full resize-none rounded-[3px] border border-[#d0d0d0] px-3 py-2 font-mono text-xs outline-none focus:border-black"
          />
          {pasteText.trim() && (
            <p className="mt-2 text-xs text-[#999]">
              {parsePasteEntries().length} entries detected
            </p>
          )}
        </div>
      )}

      {/* Select mode */}
      {mode === "select" && (
        <div className="overflow-hidden rounded-[3px] border border-[#e0e0e0] bg-white shadow-sm">
          {loadingOrders ? (
            <div className="flex h-32 items-center justify-center text-sm text-[#999]">
              Loading orders...
            </div>
          ) : pendingOrders.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center gap-1 text-sm text-[#999]">
              <p>No paid orders found</p>
              <p className="text-xs">
                Orders must be in &quot;paid&quot; status to appear here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#e0e0e0]">
              <div className="bg-[#fafafa] px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#999]">
                {pendingOrders.length} paid orders available —{" "}
                {selectedOrderIds.length} selected
              </div>
              {pendingOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[#fafafa]"
                >
                  <input
                    type="checkbox"
                    checked={selectedOrderIds.includes(order.id)}
                    onChange={() => toggleOrderSelect(order.id)}
                    className="h-4 w-4"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs text-[#666]">
                      {order.id.slice(0, 12)}...
                    </p>
                    <p className="truncate text-xs text-[#999]">
                      {order.customerEmail}
                    </p>
                  </div>
                  {selectedOrderIds.includes(order.id) && (
                    <input
                      type="text"
                      placeholder="Tracking #"
                      value={trackingInputs[order.id] || ""}
                      onChange={(e) =>
                        updateTracking(order.id, e.target.value)
                      }
                      className="w-48 rounded-[3px] border border-[#d0d0d0] px-2 py-1 text-xs outline-none focus:border-black"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Ship All button */}
      <button
        type="button"
        onClick={handleBatchShip}
        disabled={shipping}
        className="rounded-[3px] bg-black px-6 py-2.5 text-xs font-semibold text-[#fff] hover:bg-[#222] disabled:opacity-50"
      >
        {shipping ? "Shipping..." : "Ship All"}
      </button>

      {/* Results */}
      {results && (
        <div
          className={`rounded-[3px] border p-4 ${
            results.error
              ? "border-red-200 bg-red-50"
              : "border-green-200 bg-green-50"
          }`}
        >
          {results.error ? (
            <div>
              <p className="text-sm font-medium text-red-700">
                {results.error}
              </p>
              {results.missingIds && results.missingIds.length > 0 && (
                <p className="mt-1 text-xs text-red-600">
                  Missing Order IDs: {results.missingIds.join(", ")}
                </p>
              )}
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-green-700">
                Successfully created {results.created} shipment
                {results.created !== 1 ? "s" : ""}
              </p>
              {results.data && results.data.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {results.data.map((s) => (
                    <li
                      key={s.id}
                      className="font-mono text-xs text-green-600"
                    >
                      {s.orderId.slice(0, 8)}... →{" "}
                      {CARRIER_LABELS[s.carrier] || s.carrier}
                      {s.trackingNumber ? ` #${s.trackingNumber}` : ""}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════
// Tab 3: Stats
// ═════════════════════════════════════════════════

function StatsTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/admin/shipping/stats");
        const json = await res.json();
        setStats(json.data || null);
      } catch (err) {
        console.error("Failed to load shipping stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-[#999]">
        Loading stats...
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-[#999]">
        Failed to load statistics
      </div>
    );
  }

  const byStatus = stats.byStatus || {};
  const byCarrier = stats.byCarrier || {};

  // Find max values for bar widths
  const maxStatusCount = Math.max(...Object.values(byStatus), 1);
  const maxCarrierCount = Math.max(...Object.values(byCarrier), 1);

  const formatDeliveryTime = (hours) => {
    if (hours == null) return "—";
    if (hours < 24) return `${hours}h`;
    const days = Math.round(hours / 24 * 10) / 10;
    return `${days}d`;
  };

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-[#999]">This Week</p>
          <p className="mt-1 text-2xl font-semibold text-black">
            {stats.shipmentsThisWeek}
          </p>
        </div>
        <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-[#999]">This Month</p>
          <p className="mt-1 text-2xl font-semibold text-black">
            {stats.shipmentsThisMonth}
          </p>
        </div>
        <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-[#999]">Avg Delivery Time</p>
          <p className="mt-1 text-2xl font-semibold text-blue-600">
            {formatDeliveryTime(stats.avgDeliveryHours)}
          </p>
        </div>
        <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-[#999]">Total Delivered</p>
          <p className="mt-1 text-2xl font-semibold text-green-600">
            {stats.totalDelivered}
          </p>
        </div>
      </div>

      {/* By Status */}
      <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#999]">
          By Status
        </h3>
        {Object.keys(byStatus).length === 0 ? (
          <p className="text-xs text-[#999]">No data yet</p>
        ) : (
          <div className="space-y-2">
            {STATUSES.filter((s) => s.value !== "all").map((s) => {
              const count = byStatus[s.value] || 0;
              if (count === 0) return null;
              const pct = (count / maxStatusCount) * 100;
              return (
                <div key={s.value} className="flex items-center gap-3">
                  <span
                    className={`inline-block w-24 rounded-[2px] px-2 py-0.5 text-center text-[10px] font-bold uppercase tracking-wider ${
                      STATUS_COLORS[s.value] || "bg-gray-100"
                    }`}
                  >
                    {s.label}
                  </span>
                  <div className="flex-1">
                    <div
                      className={`h-5 rounded-[2px] ${
                        STATUS_COLORS[s.value]?.split(" ")[0] || "bg-gray-200"
                      }`}
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs font-semibold text-black">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* By Carrier */}
      <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#999]">
          By Carrier
        </h3>
        {Object.keys(byCarrier).length === 0 ? (
          <p className="text-xs text-[#999]">No data yet</p>
        ) : (
          <div className="space-y-2">
            {CARRIERS.filter((c) => c.value !== "all").map((c) => {
              const count = byCarrier[c.value] || 0;
              if (count === 0) return null;
              const pct = (count / maxCarrierCount) * 100;
              return (
                <div key={c.value} className="flex items-center gap-3">
                  <span
                    className={`inline-block w-24 rounded-[2px] px-2 py-0.5 text-center text-[10px] font-bold uppercase tracking-wider ${
                      CARRIER_COLORS[c.value] || "bg-gray-100"
                    }`}
                  >
                    {c.label}
                  </span>
                  <div className="flex-1">
                    <div
                      className={`h-5 rounded-[2px] ${
                        CARRIER_COLORS[c.value]?.split(" ")[0] || "bg-gray-200"
                      }`}
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs font-semibold text-black">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
