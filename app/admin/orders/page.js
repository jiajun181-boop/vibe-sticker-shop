"use client";

import { useEffect, useState, useCallback, useMemo, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { detectProductFamily } from "@/lib/preflight";
import { getArtworkStatus, scanOrderArtwork as scanArtwork } from "@/lib/artwork-detection";

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
const productionStatuses = ["all", "not_started", "preflight", "in_production", "ready_to_ship", "shipped", "on_hold"];

/** Scan ALL items in an order and return artwork/product-type flags.
 *  Artwork detection is delegated to the shared utility in lib/artwork-detection.js.
 *  This wrapper adds product-family and tool-need flags used only by the list page.
 */
function scanOrderArtwork(items) {
  const art = scanArtwork(items || []);

  const result = {
    hasUploadLater: art.flags.has("UPLOAD_LATER"),
    hasDesignHelp:  art.flags.has("DESIGN"),
    hasMissingArt:  false,
    hasFileNameOnly: art.flags.has("FILE_NAME_ONLY"),
    needsContour: false,
    needsStamp: false,
    allArtworkPresent: art.allArt,
    families: [],
    primaryFamily: "other",
  };
  if (!items || items.length === 0) return result;

  // hasMissingArt = at least one item has status "missing" (no URL, no intent, no fileName).
  // The shared flags set NO_ART for file-name-only and upload-later too, so we check per-item.
  for (const item of items) {
    if (getArtworkStatus(item) === "missing") {
      result.hasMissingArt = true;
      break;
    }
  }

  for (const item of items) {
    const family = detectProductFamily(item);
    result.families.push(family);
    if (family === "sticker" || family === "label") result.needsContour = true;
    if (family === "stamp") result.needsStamp = true;
  }

  result.primaryFamily = result.families[0] || "other";
  return result;
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="flex h-48 items-center justify-center text-sm text-[#999]">Loading...</div>}>
      <OrdersContent />
    </Suspense>
  );
}

const AUTO_REFRESH_MS = 30_000;

function OrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const refreshTimer = useRef(null);

  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "all"
  );
  const [prodFilter, setProdFilter] = useState(
    searchParams.get("production") || "all"
  );
  const page = parseInt(searchParams.get("page") || "1");
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [artworkFilter, setArtworkFilter] = useState("all");
  const [sortMode, setSortMode] = useState("newest");

  const statusLabel = (s) => t(`admin.orders.${s}`, s);
  const productionLabel = (s) => {
    const map = { not_started: t("admin.orders.productionNotStarted"), preflight: t("admin.orders.productionNotStarted"), in_production: t("admin.orders.productionInProgress"), ready_to_ship: t("admin.orders.productionReady"), shipped: t("admin.orders.productionShipped"), completed: t("admin.orders.productionDelivered") };
    return map[s] || (s ? s.replace(/_/g, " ") : "");
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "20");
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (prodFilter !== "all") params.set("production", prodFilter);
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
      setLastRefresh(new Date());
    }
  }, [page, statusFilter, prodFilter, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Auto-refresh every 30s
  useEffect(() => {
    refreshTimer.current = setInterval(() => fetchOrders(), AUTO_REFRESH_MS);
    return () => clearInterval(refreshTimer.current);
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
    if (selectedOrders.length === displayOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(displayOrders.map(o => o.id));
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

  async function handleBulkUpdateProduction(productionStatus) {
    if (!productionStatus || selectedOrders.length === 0) return;
    const confirmed = confirm(`Update ${selectedOrders.length} orders to production: ${productionStatus.replace(/_/g, " ")}?`);
    if (!confirmed) return;

    setBulkUpdating(true);
    try {
      await fetch('/api/admin/orders/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: selectedOrders, updates: { productionStatus } })
      });
      setSelectedOrders([]);
      await fetchOrders();
    } catch (err) {
      console.error('Bulk production update failed:', err);
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

  // ------------------------------------------------------------------
  // Client-side artwork filter + sort applied on top of fetched orders
  // ------------------------------------------------------------------
  const displayOrders = useMemo(() => {
    let filtered = orders;

    // Artwork-status filter
    if (artworkFilter !== "all") {
      filtered = filtered.filter((order) => {
        const scan = scanOrderArtwork(order.items || []);
        switch (artworkFilter) {
          case "missing":
            return scan.hasMissingArt || scan.hasFileNameOnly;
          case "design":
            return scan.hasDesignHelp;
          case "upload_later":
            return scan.hasUploadLater;
          default:
            return true;
        }
      });
    }

    // Sort
    if (sortMode === "oldest") {
      filtered = [...filtered].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
    } else if (sortMode === "priority") {
      // Priority ranking: NO_ART (missing/fileName) > DESIGN > UPLOAD_LATER > complete
      const priorityScore = (order) => {
        const scan = scanOrderArtwork(order.items || []);
        if (scan.hasMissingArt || scan.hasFileNameOnly) return 0; // highest priority
        if (scan.hasDesignHelp) return 1;
        if (scan.hasUploadLater) return 2;
        return 3; // no issues — lowest priority
      };
      filtered = [...filtered].sort((a, b) => {
        const diff = priorityScore(a) - priorityScore(b);
        if (diff !== 0) return diff;
        // Same priority tier — newest first
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    }
    // "newest" is the default API order (createdAt desc) — no re-sort needed

    return filtered;
  }, [orders, artworkFilter, sortMode]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-black">Orders</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchOrders()}
            disabled={loading}
            className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:bg-[#fafafa] disabled:opacity-50"
            title={lastRefresh ? `Last refresh: ${lastRefresh.toLocaleTimeString()}` : ""}
          >
            {loading ? "..." : "Refresh"}
          </button>
          <Link
            href="/admin/orders/create"
            className="rounded-[3px] bg-black px-4 py-2 text-xs font-semibold text-[#fff] hover:bg-[#222]"
          >
            + New Order 新建订单
          </Link>
        </div>
      </div>

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
              className={`rounded-[3px] px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "bg-black text-[#fff]"
                  : "bg-white text-[#666] border border-[#e0e0e0] hover:border-black hover:text-black"
              }`}
            >
              {statusLabel(s)}
            </button>
          ))}
        </div>

        {/* Production filter */}
        <select
          value={prodFilter}
          onChange={(e) => {
            setProdFilter(e.target.value);
            updateParams({ production: e.target.value === "all" ? null : e.target.value, page: "1" });
          }}
          className="rounded-[3px] border border-[#d0d0d0] px-2 py-1.5 text-xs text-[#666]"
        >
          {productionStatuses.map((s) => (
            <option key={s} value={s}>{s === "all" ? "All Production" : s.replace(/_/g, " ")}</option>
          ))}
        </select>

        {/* Artwork status filter (client-side) */}
        <select
          value={artworkFilter}
          onChange={(e) => { setArtworkFilter(e.target.value); setSelectedOrders([]); }}
          className="rounded-[3px] border border-[#d0d0d0] px-2 py-1.5 text-xs text-[#666]"
        >
          <option value="all">All Artwork</option>
          <option value="missing">Missing Art</option>
          <option value="design">Design Help</option>
          <option value="upload_later">Upload Later</option>
        </select>

        {/* Sort mode (client-side) */}
        <select
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value)}
          className="rounded-[3px] border border-[#d0d0d0] px-2 py-1.5 text-xs text-[#666]"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="priority">Priority (issues first)</option>
        </select>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("admin.orders.searchPlaceholder")}
            className="w-full sm:w-64 rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
          />
          <button
            type="submit"
            className="rounded-[3px] bg-black px-4 py-2 text-xs font-semibold text-[#fff] hover:bg-[#222]"
          >
            {t("admin.common.search")}
          </button>
        </form>
      </div>

      {/* Bulk Action Bar */}
      {selectedOrders.length > 0 && (
        <div className="sticky top-0 z-10 rounded-[3px] border border-[#e0e0e0] bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-medium text-black">
              {t("admin.orders.selected", { count: selectedOrders.length }).replace("{count}", selectedOrders.length)}
            </span>
            <div className="flex flex-wrap gap-2">
              <select
                onChange={(e) => { handleBulkUpdateStatus(e.target.value); e.target.value = ""; }}
                disabled={bulkUpdating}
                className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs text-black"
                defaultValue=""
              >
                <option value="" disabled>{t("admin.orders.updateStatus")}</option>
                <option value="pending">{t("admin.orders.markPending")}</option>
                <option value="paid">{t("admin.orders.markPaid")}</option>
                <option value="canceled">{t("admin.orders.markCanceled")}</option>
                <option value="refunded">{t("admin.orders.markRefunded")}</option>
              </select>
              <select
                onChange={(e) => { handleBulkUpdateProduction(e.target.value); e.target.value = ""; }}
                disabled={bulkUpdating}
                className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs text-black"
                defaultValue=""
              >
                <option value="" disabled>Production Status</option>
                <option value="not_started">Not Started</option>
                <option value="preflight">Preflight</option>
                <option value="in_production">In Production</option>
                <option value="ready_to_ship">Ready to Ship</option>
                <option value="on_hold">On Hold</option>
              </select>
              <button
                onClick={handleBulkExport}
                disabled={bulkUpdating}
                className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:border-black"
              >
                {t("admin.common.export")}
              </button>
              <button
                onClick={() => setSelectedOrders([])}
                className="text-xs text-[#999] hover:text-black"
              >
                {t("admin.common.clear")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-[3px] border border-[#e0e0e0] bg-white">
        {loading ? (
          <div className="flex h-48 items-center justify-center text-sm text-[#999]">
            {t("admin.common.loading")}
          </div>
        ) : displayOrders.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-1 text-sm text-[#999]">
            <span>{artworkFilter !== "all" ? "No orders match this artwork filter" : t("admin.orders.noOrders")}</span>
            {artworkFilter !== "all" && (
              <button
                type="button"
                onClick={() => { setArtworkFilter("all"); setSelectedOrders([]); }}
                className="text-xs text-black underline hover:no-underline"
              >
                Clear filter
              </button>
            )}
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
                        checked={selectedOrders.length === displayOrders.length && displayOrders.length > 0}
                        onChange={toggleSelectAll}
                        className="h-4 w-4"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#999]">
                      {t("admin.orders.title", "Order")}
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#999]">
                      {t("admin.orders.customer")}
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#999]">
                      {t("admin.orders.amount")}
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#999]">
                      {t("admin.orders.status")}
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#999]">
                      {t("admin.orders.status", "Payment")}
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#999]">
                      {t("admin.orders.production")}
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#999]">
                      {t("admin.orders.date")}
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e0e0e0]">
                  {displayOrders.map((order) => {
                    const firstItem = order.items?.[0];
                    const scan = scanOrderArtwork(order.items || []);
                    const familyBadge = { sticker: "STK", label: "LBL", stamp: "STP", canvas: "CVS", banner: "BNR", sign: "SGN", booklet: "BKL", ncr: "NCR", "business-card": "BCD", vehicle: "VEH", "standard-print": "PRT", other: "" }[scan.primaryFamily] || "";
                    const isRush = (order.items || []).some(it => {
                      const m = it.meta && typeof it.meta === "object" ? it.meta : {};
                      return m.turnaround === "rush" || m.turnaround === "express";
                    }) || order.priority > 0;
                    const showNoArt = scan.hasUploadLater || scan.hasMissingArt || scan.hasFileNameOnly;
                    const showDesign = scan.hasDesignHelp;
                    const hasArtworkIssue = showNoArt || showDesign;
                    const tags = order.tags || [];
                    const itemCount = order._count?.items || 0;
                    // Tool links: show contour if any item needs contour, stamp if any needs stamp
                    const toolLinks = [];
                    if (scan.needsContour) toolLinks.push({ href: `/admin/tools/contour?orderId=${order.id}`, label: "Contour" });
                    if (scan.needsStamp) toolLinks.push({ href: `/admin/tools/stamp-studio?orderId=${order.id}`, label: "Stamp" });
                    return (
                    <tr key={order.id} className={`hover:bg-[#fafafa]${hasArtworkIssue ? " bg-amber-50/40" : ""}`}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order.id)}
                          onChange={() => toggleSelectOrder(order.id)}
                          className="h-4 w-4"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs text-[#666]">
                            {order.id.slice(0, 8)}
                          </span>
                          {familyBadge && <span className="rounded bg-gray-200 px-1 py-0.5 text-[8px] font-bold text-gray-600">{familyBadge}</span>}
                          {isRush && <span className="rounded bg-red-100 px-1 py-0.5 text-[8px] font-bold text-red-700">RUSH</span>}
                          {showDesign && <span className="rounded bg-indigo-100 px-1 py-0.5 text-[8px] font-bold text-indigo-700">DESIGN</span>}
                          {showNoArt && <span className="rounded bg-amber-100 px-1 py-0.5 text-[8px] font-bold text-amber-700">NO ART</span>}
                        </div>
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
                          {firstItem?.productName && (
                            <p className="text-[10px] text-[#999] truncate max-w-[200px]">
                              {firstItem.productName}{itemCount > 1 ? ` +${itemCount - 1} more` : ""}
                              {itemCount > 0 && <span className="ml-1 text-[#bbb]">({itemCount} {itemCount === 1 ? "item" : "items"})</span>}
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
                          {statusLabel(order.status)}
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
                        <div className="flex flex-wrap gap-1">
                          <span
                            className={`inline-block rounded-[2px] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              productionColors[order.productionStatus] ||
                              "bg-gray-100"
                            }`}
                          >
                            {productionLabel(order.productionStatus)}
                          </span>
                          {tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="rounded-[2px] bg-[#f0f0f0] px-1.5 py-0.5 text-[9px] text-[#666]">{tag}</span>
                          ))}
                          {tags.length > 2 && <span className="text-[9px] text-[#999]">+{tags.length - 2}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#999]">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="text-xs font-medium text-black underline hover:no-underline"
                          >
                            {t("admin.common.view")}
                          </Link>
                          {toolLinks.map((tool) => (
                            <Link
                              key={tool.label}
                              href={tool.href}
                              className="rounded-[2px] border border-[#d0d0d0] px-1.5 py-0.5 text-[9px] font-medium text-[#666] hover:border-black hover:text-black"
                              title={`Open ${tool.label} tool for this order`}
                            >
                              {tool.label}
                            </Link>
                          ))}
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-[#e0e0e0] lg:hidden">
              {displayOrders.map((order) => {
                const firstItem = order.items?.[0];
                const scan = scanOrderArtwork(order.items || []);
                const familyBadge = { sticker: "STK", label: "LBL", stamp: "STP", canvas: "CVS", banner: "BNR", sign: "SGN", booklet: "BKL", ncr: "NCR", "business-card": "BCD", vehicle: "VEH", "standard-print": "PRT", other: "" }[scan.primaryFamily] || "";
                const isRush = (order.items || []).some(it => {
                  const m = it.meta && typeof it.meta === "object" ? it.meta : {};
                  return m.turnaround === "rush" || m.turnaround === "express";
                }) || order.priority > 0;
                const showNoArt = scan.hasUploadLater || scan.hasMissingArt || scan.hasFileNameOnly;
                const showDesign = scan.hasDesignHelp;
                const hasArtworkIssue = showNoArt || showDesign;
                const itemCount = order._count?.items || 0;
                const toolLinks = [];
                if (scan.needsContour) toolLinks.push({ href: `/admin/tools/contour?orderId=${order.id}`, label: "Contour" });
                if (scan.needsStamp) toolLinks.push({ href: `/admin/tools/stamp-studio?orderId=${order.id}`, label: "Stamp" });
                return (
                <div
                  key={order.id}
                  className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[#fafafa]${hasArtworkIssue ? " bg-amber-50/40" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedOrders.includes(order.id)}
                    onChange={() => toggleSelectOrder(order.id)}
                    className="mt-1 h-4 w-4"
                  />
                  <div className="flex-1">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="block"
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-black truncate">
                            {order.customerEmail}
                          </p>
                          <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-xs text-[#999]">
                              {order.id.slice(0, 8)}
                            </span>
                            {familyBadge && <span className="rounded bg-gray-200 px-1 py-0.5 text-[8px] font-bold text-gray-600">{familyBadge}</span>}
                            {isRush && <span className="rounded bg-red-100 px-1 py-0.5 text-[8px] font-bold text-red-700">RUSH</span>}
                            {showDesign && <span className="rounded bg-indigo-100 px-1 py-0.5 text-[8px] font-bold text-indigo-700">DESIGN</span>}
                            {showNoArt && <span className="rounded bg-amber-100 px-1 py-0.5 text-[8px] font-bold text-amber-700">NO ART</span>}
                          </div>
                          {firstItem?.productName && (
                            <p className="mt-0.5 text-[10px] text-[#999] truncate max-w-[200px]">
                              {firstItem.productName}{itemCount > 1 ? ` +${itemCount - 1} more` : ""}
                              {itemCount > 0 && <span className="ml-1 text-[#bbb]">({itemCount})</span>}
                            </p>
                          )}
                        </div>
                        <span className="ml-2 text-sm font-semibold tabular-nums text-black shrink-0">
                          {formatCad(order.totalAmount)}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span
                          className={`rounded-[2px] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            statusColors[order.status] || "bg-gray-100"
                          }`}
                        >
                          {order.status}
                        </span>
                        <span
                          className={`rounded-[2px] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            paymentColors[order.paymentStatus] || "bg-gray-100"
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                        <span
                          className={`rounded-[2px] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            productionColors[order.productionStatus] ||
                            "bg-gray-100"
                          }`}
                        >
                          {productionLabel(order.productionStatus)}
                        </span>
                        <span className="text-xs text-[#999]">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </Link>
                    {toolLinks.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {toolLinks.map((tool) => (
                          <Link
                            key={tool.label}
                            href={tool.href}
                            className="inline-block rounded-[2px] border border-[#d0d0d0] px-2 py-0.5 text-[10px] font-medium text-[#666] hover:border-black hover:text-black"
                          >
                            Open {tool.label} Tool
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-[#999]">
            {t("admin.common.showing")} {(pagination.page - 1) * pagination.limit + 1}-
            {Math.min(pagination.page * pagination.limit, pagination.total)} {t("admin.common.of")}{" "}
            {pagination.total}
          </p>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => updateParams({ page: String(page - 1) })}
              className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:border-black disabled:opacity-40"
            >
              {t("admin.common.previous")}
            </button>
            <button
              type="button"
              disabled={page >= pagination.totalPages}
              onClick={() => updateParams({ page: String(page + 1) })}
              className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:border-black disabled:opacity-40"
            >
              {t("admin.common.next")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
