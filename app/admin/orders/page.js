"use client";

import { useEffect, useState, useCallback, useMemo, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { detectProductFamily } from "@/lib/preflight";
import { getArtworkStatus, scanOrderArtwork as scanArtwork } from "@/lib/artwork-detection";
import { formatCad } from "@/lib/admin/format-cad";
import { statusColor, paymentColor, productionColor } from "@/lib/admin/status-labels";
import { ORDER_CENTER_VIEWS, buildOrderCenterHref, getOrderCenterView } from "@/lib/admin-centers";

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
    hasProvided:    art.flags.has("PROVIDED"),
    hasMissingArt:  false,
    hasFileNameOnly: art.flags.has("FILE_NAME_ONLY"),
    needsContour: false,
    needsStamp: false,
    allArtworkPresent: art.allArt,
    families: [],
    primaryFamily: "other",
  };
  if (!items || items.length === 0) return result;

  // hasMissingArt = at least one producible item has status "missing" (no URL, no intent, no fileName).
  // Service-fee rows are financial line items — exclude from artwork checks.
  for (const item of items) {
    const m = item.meta && typeof item.meta === "object" ? item.meta : {};
    if (m.isServiceFee === "true") continue;
    if (getArtworkStatus(item) === "missing") {
      result.hasMissingArt = true;
      break;
    }
  }

  for (const item of items) {
    const m = item.meta && typeof item.meta === "object" ? item.meta : {};
    if (m.isServiceFee === "true") continue;
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
    <Suspense fallback={<div className="flex h-48 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[#e0e0e0] border-t-black" /></div>}>
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
  const centerView = getOrderCenterView(searchParams.get("view"));

  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [lastRefresh, setLastRefresh] = useState(null);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || centerView.params.status || "all"
  );
  const [prodFilter, setProdFilter] = useState(
    searchParams.get("production") || centerView.params.production || "all"
  );
  const page = parseInt(searchParams.get("page") || "1");
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [artworkFilter, setArtworkFilter] = useState(
    searchParams.get("artwork") || centerView.params.artwork || "all"
  );
  const [sortMode, setSortMode] = useState(
    searchParams.get("sort") || centerView.params.sort || "newest"
  );

  const statusLabel = (s) => t(`admin.orders.${s}`, s);
  const productionLabel = (s) => {
    const map = { not_started: t("admin.orders.productionNotStarted"), preflight: t("admin.orders.productionNotStarted"), in_production: t("admin.orders.productionInProgress"), ready_to_ship: t("admin.orders.productionReady"), shipped: t("admin.orders.productionShipped"), completed: t("admin.orders.productionDelivered"), on_hold: t("admin.orders.productionOnHold") };
    return map[s] || (s ? s.replace(/_/g, " ") : "");
  };

  useEffect(() => {
    setSearch(searchParams.get("search") || "");
    setStatusFilter(searchParams.get("status") || centerView.params.status || "all");
    setProdFilter(searchParams.get("production") || centerView.params.production || "all");
    setArtworkFilter(searchParams.get("artwork") || centerView.params.artwork || "all");
    setSortMode(searchParams.get("sort") || centerView.params.sort || "newest");
    setSelectedOrders([]);
  }, [searchParams, centerView.id, centerView.params.artwork, centerView.params.production, centerView.params.sort, centerView.params.status]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setLoadError("");
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
        setLoadError(t("admin.orders.loadErrorApi").replace("{code}", res.status));
        return;
      }
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Orders API returned invalid JSON:", text.slice(0, 200));
        setLoadError(t("admin.orders.loadErrorJson"));
        return;
      }
      setOrders(data.orders || []);
      setPagination(data.pagination || null);
    } catch (err) {
      console.error("Failed to load orders:", err);
      setLoadError(t("admin.orders.loadErrorNetwork"));
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
    updateParams({ search: search || null, page: "1", view: null });
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
    const confirmed = confirm(t("admin.orders.bulkConfirmStatus").replace("{count}", selectedOrders.length).replace("{status}", status));
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
    const confirmed = confirm(t("admin.orders.bulkConfirmProd").replace("{count}", selectedOrders.length).replace("{status}", productionStatus.replace(/_/g, " ")));
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
      a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
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
          case "provided":
            return scan.hasProvided;
          default:
            return true;
        }
      });
    }

    if (centerView.id === "exceptions") {
      filtered = filtered.filter(
        (order) =>
          order.productionStatus === "on_hold" ||
          order.status === "canceled" ||
          order.status === "refunded"
      );
    }

    // Sort
    if (sortMode === "oldest") {
      filtered = [...filtered].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
    } else if (sortMode === "priority") {
      // Priority ranking: NO_ART (missing/fileName) > DESIGN > UPLOAD_LATER > PROVIDED > complete
      const priorityScore = (order) => {
        const scan = scanOrderArtwork(order.items || []);
        if (scan.hasMissingArt || scan.hasFileNameOnly) return 0; // highest priority
        if (scan.hasDesignHelp) return 1;
        if (scan.hasUploadLater) return 2;
        if (scan.hasProvided) return 3; // provided = low priority, artwork confirmed off-platform
        return 4; // no issues — lowest priority
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
  }, [orders, artworkFilter, sortMode, centerView.id]);

  // Artwork summary counts across all loaded orders (not filtered)
  const artworkSummary = useMemo(() => {
    let missing = 0, design = 0, uploadLater = 0, provided = 0;
    for (const order of orders) {
      const scan = scanOrderArtwork(order.items || []);
      if (scan.hasMissingArt || scan.hasFileNameOnly) missing++;
      if (scan.hasDesignHelp) design++;
      if (scan.hasUploadLater) uploadLater++;
      if (scan.hasProvided) provided++;
    }
    return { missing, design, uploadLater, provided };
  }, [orders]);

  // ── Orders Center view strip ──────────────────────────────────────────────
  const viewCounts = useMemo(() => {
    let pending = 0, inProd = 0, readyShip = 0, shipped = 0, exceptions = 0;
    for (const order of orders) {
      if (order.status === "pending") pending++;
      if (order.productionStatus === "in_production") inProd++;
      if (order.productionStatus === "ready_to_ship") readyShip++;
      if (order.productionStatus === "shipped") shipped++;
      if (order.productionStatus === "on_hold") exceptions++;
    }
    return { pending, missingArt: artworkSummary.missing, inProd, readyShip, shipped, exceptions };
  }, [orders, artworkSummary]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-black">{t("admin.orders.title")}</h1>
          <p className="mt-0.5 text-xs text-[#999]">{t("admin.orders.subtitle")}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {lastRefresh && (
            <span className="text-[10px] text-[#bbb]">
              {t("admin.orders.updated")} {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button
            type="button"
            onClick={() => fetchOrders()}
            disabled={loading}
            className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:bg-[#fafafa] disabled:opacity-50"
          >
            {loading ? "..." : t("admin.orders.refresh")}
          </button>
          <Link
            href="/admin/orders/create"
            className="rounded-[3px] bg-black px-4 py-2 text-xs font-semibold text-[#fff] hover:bg-[#222]"
          >
            {t("admin.orders.newOrder")}
          </Link>
        </div>
      </div>

      {/* Orders Center view strip — primary workflow navigation */}
      <div className="flex flex-wrap gap-1.5">
        {Object.values(ORDER_CENTER_VIEWS).map((view) => {
          const count = {
            pending: viewCounts.pending,
            missing_artwork: viewCounts.missingArt,
            in_production: viewCounts.inProd,
            ready_to_ship: viewCounts.readyShip,
            shipped: viewCounts.shipped,
            exceptions: viewCounts.exceptions,
          }[view.id] || null;

          return (
            <Link
              key={view.id}
              href={buildOrderCenterHref(view.id)}
              className={`rounded-[3px] px-3 py-1.5 text-xs font-medium transition-colors ${
                centerView.id === view.id
                  ? "bg-black text-white"
                  : "bg-white text-[#666] border border-[#e0e0e0] hover:border-black hover:text-black"
              }`}
            >
              {t(view.labelKey)}
              {count > 0 && (
                <span className={`ml-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full text-[9px] font-bold ${
                  centerView.id === view.id ? "bg-white/20 text-white" : (view.badgeColor || "")
                }`}>
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Payment status filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            updateParams({ status: e.target.value === "all" ? null : e.target.value, page: "1", view: null });
          }}
          className="rounded-[3px] border border-[#d0d0d0] px-2 py-1.5 text-xs text-[#666]"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>{s === "all" ? t("admin.orders.allStatuses") : statusLabel(s)}</option>
          ))}
        </select>

        {/* Production filter */}
        <select
          value={prodFilter}
          onChange={(e) => {
            setProdFilter(e.target.value);
            updateParams({ production: e.target.value === "all" ? null : e.target.value, page: "1", view: null });
          }}
          className="rounded-[3px] border border-[#d0d0d0] px-2 py-1.5 text-xs text-[#666]"
        >
          {productionStatuses.map((s) => (
            <option key={s} value={s}>{s === "all" ? t("admin.orders.allProduction") : productionLabel(s)}</option>
          ))}
        </select>

        {/* Artwork status filter (client-side) */}
        <select
          value={artworkFilter}
          onChange={(e) => updateParams({ artwork: e.target.value === "all" ? null : e.target.value, page: "1", view: null })}
          className="rounded-[3px] border border-[#d0d0d0] px-2 py-1.5 text-xs text-[#666]"
        >
          <option value="all">{t("admin.orders.allArtwork")}</option>
          <option value="missing">{t("admin.orders.artMissing")}</option>
          <option value="design">{t("admin.orders.artDesignHelp")}</option>
          <option value="upload_later">{t("admin.orders.artUploadLater")}</option>
          <option value="provided">{t("admin.orders.artProviderFilter")}</option>
        </select>

        {/* Sort mode (client-side) */}
        <select
          value={sortMode}
          onChange={(e) => updateParams({ sort: e.target.value === "newest" ? null : e.target.value, page: "1", view: null })}
          className="rounded-[3px] border border-[#d0d0d0] px-2 py-1.5 text-xs text-[#666]"
        >
          <option value="newest">{t("admin.orders.sortNewest")}</option>
          <option value="oldest">{t("admin.orders.sortOldest")}</option>
          <option value="priority">{t("admin.orders.sortPriority")}</option>
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
                <option value="" disabled>{t("admin.orders.productionStatusLabel")}</option>
                <option value="not_started">{t("admin.orders.prodNotStarted")}</option>
                <option value="preflight">{t("admin.orders.prodPreflight")}</option>
                <option value="in_production">{t("admin.orders.prodInProduction")}</option>
                <option value="ready_to_ship">{t("admin.orders.prodReadyToShip")}</option>
                <option value="on_hold">{t("admin.orders.prodOnHold")}</option>
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
        ) : loadError ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3 text-sm">
            <p className="text-red-600">{loadError}</p>
            <button
              type="button"
              onClick={() => fetchOrders()}
              className="rounded-[3px] bg-black px-4 py-2 text-xs font-medium text-[#fff] hover:bg-[#222]"
            >
              {t("admin.orders.retry")}
            </button>
          </div>
        ) : displayOrders.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-1 text-sm text-[#999]">
            <span>{artworkFilter !== "all" ? t("admin.orders.noArtworkMatch") : t("admin.orders.noOrders")}</span>
            {artworkFilter !== "all" && (
              <button
                type="button"
                onClick={() => { setArtworkFilter("all"); setSelectedOrders([]); }}
                className="text-xs text-black underline hover:no-underline"
              >
                {t("admin.orders.clearFilter")}
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
                      {t("admin.orders.colOrder")}
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
                      {t("admin.orders.colPayment")}
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
                    const showProvided = scan.hasProvided && !showNoArt; // only show if no worse issue
                    const hasArtworkIssue = showNoArt || showDesign;
                    const tags = order.tags || [];
                    const itemCount = order._count?.items || 0;
                    // Tool links: show contour if any item needs contour, stamp if any needs stamp
                    const toolLinks = [];
                    if (scan.needsContour) toolLinks.push({ href: `/admin/tools/contour?orderId=${order.id}`, label: t("admin.orders.toolContour") });
                    if (scan.needsStamp) toolLinks.push({ href: `/admin/tools/stamp-studio?orderId=${order.id}`, label: t("admin.orders.toolStamp") });
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
                          {showProvided && <span className="rounded bg-cyan-100 px-1 py-0.5 text-[8px] font-bold text-cyan-700">PROVIDED</span>}
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
                              {firstItem.productName}{itemCount > 1 ? ` ${t("admin.orders.nMore").replace("{n}", itemCount - 1)}` : ""}
                              {itemCount > 0 && <span className="ml-1 text-[#bbb]">({itemCount} {t("admin.orders.items")})</span>}
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
                            statusColor(order.status)
                          }`}
                        >
                          {statusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-[2px] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            paymentColor(order.paymentStatus)
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          <span
                            className={`inline-block rounded-[2px] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              productionColor(order.productionStatus)
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
                const showProvided = scan.hasProvided && !showNoArt;
                const hasArtworkIssue = showNoArt || showDesign;
                const itemCount = order._count?.items || 0;
                const toolLinks = [];
                if (scan.needsContour) toolLinks.push({ href: `/admin/tools/contour?orderId=${order.id}`, label: t("admin.orders.toolContour") });
                if (scan.needsStamp) toolLinks.push({ href: `/admin/tools/stamp-studio?orderId=${order.id}`, label: t("admin.orders.toolStamp") });
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
                            {showProvided && <span className="rounded bg-cyan-100 px-1 py-0.5 text-[8px] font-bold text-cyan-700">PROVIDED</span>}
                          </div>
                          {firstItem?.productName && (
                            <p className="mt-0.5 text-[10px] text-[#999] truncate max-w-[200px]">
                              {firstItem.productName}{itemCount > 1 ? ` ${t("admin.orders.nMore").replace("{n}", itemCount - 1)}` : ""}
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
                            statusColor(order.status)
                          }`}
                        >
                          {order.status}
                        </span>
                        <span
                          className={`rounded-[2px] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            paymentColor(order.paymentStatus)
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                        <span
                          className={`rounded-[2px] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            productionColor(order.productionStatus)
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
                            {t("admin.orders.openTool").replace("{tool}", tool.label)}
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
