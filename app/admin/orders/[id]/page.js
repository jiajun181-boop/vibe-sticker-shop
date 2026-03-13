"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { timeAgo as sharedTimeAgo } from "@/lib/admin/time-ago";
import { buildContourSvg } from "@/lib/contour/svg-path";
import { preflightOrder, detectProductFamily, buildSpecsSummary } from "@/lib/preflight";
import { hasArtworkUrl, getArtworkStatus, itemNeedsArtwork } from "@/lib/artwork-detection";
import { assessItem, assessOrder, assessOrderPackage, READINESS, READINESS_COLORS, READINESS_LABEL_KEYS } from "@/lib/admin/production-readiness";
import { getActionLabel } from "@/lib/timeline-labels";
import { formatCad } from "@/lib/admin/format-cad";
import { RUSH_MULTIPLIER, DESIGN_HELP_CENTS } from "@/lib/order-config";
import { statusColor, paymentColor, productionColor } from "@/lib/admin/status-labels";
import { buildOrderCenterHref } from "@/lib/admin-centers";
import OrderReadinessSummary from "@/components/admin/OrderReadinessSummary";
import ItemProductionPanel from "@/components/admin/ItemProductionPanel";
import { getOrderFulfillment, getShipmentStatusColor, getTrackingUrl } from "@/lib/admin/order-shipping";
import CostSignalBadge from "@/components/admin/CostSignalBadge";

const statusOptions = ["draft", "pending", "paid", "canceled", "refunded"];
const paymentOptions = ["unpaid", "paid", "failed", "refunded", "partially_refunded"];
const productionOptions = [
  "not_started",
  "preflight",
  "in_production",
  "ready_to_ship",
  "shipped",
  "completed",
  "on_hold",
  "canceled",
];

const priorityLabelKeys = ["admin.orderDetail.priorityNormal", "admin.orderDetail.priorityHigh", "admin.orderDetail.priorityUrgent"];
const priorityColors = [
  "bg-[#f5f5f5] text-black border-[#d0d0d0]",
  "bg-yellow-100 text-yellow-800 border-yellow-400",
  "bg-red-100 text-red-700 border-red-400",
];

const timelineDotColors = {
  status_updated: "bg-blue-500",
  note_added: "bg-green-500",
  payment_received: "bg-emerald-500",
  refund_issued: "bg-red-500",
  default: "bg-[#999]",
};

function parseSizeRows(item) {
  const meta = item?.meta && typeof item.meta === "object" ? item.meta : null;
  const specs = item?.specsJson && typeof item.specsJson === "object" ? item.specsJson : null;
  const raw = specs?.sizeRows ?? meta?.sizeRows;
  let rows = raw;
  if (typeof raw === "string") {
    try {
      rows = JSON.parse(raw);
    } catch {
      rows = [];
    }
  }
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => {
      const width = Number(row?.width ?? row?.widthIn);
      const height = Number(row?.height ?? row?.heightIn);
      const quantity = Number(row?.quantity);
      if (!Number.isFinite(width) || !Number.isFinite(height) || !Number.isFinite(quantity)) return null;
      if (width <= 0 || height <= 0 || quantity <= 0) return null;
      return { width, height, quantity };
    })
    .filter(Boolean);
}

const AUTO_REFRESH_MS = 30_000;

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const timeAgo = (d) => sharedTimeAgo(d, t);
  const refreshTimer = useRef(null);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(true);
  const [addingNote, setAddingNote] = useState(false);
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);
  const [timeline, setTimeline] = useState([]);
  const [actionFeedback, setActionFeedback] = useState(null); // { text, isError }
  const [sendingReminder, setSendingReminder] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [manualRefreshing, setManualRefreshing] = useState(false);

  // Editable status fields
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [productionStatus, setProductionStatus] = useState("");

  // Tags, priority, archive, estimated completion
  const [tagsInput, setTagsInput] = useState("");
  const [priority, setPriority] = useState(0);
  const [isArchived, setIsArchived] = useState(false);
  const [estimatedCompletion, setEstimatedCompletion] = useState("");

  const fetchTimeline = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/orders/${id}/timeline`);
      if (res.ok) {
        const data = await res.json();
        setTimeline(data);
      }
    } catch {
      console.error("Failed to fetch timeline");
    }
  }, [id]);

  const fetchOrder = useCallback(async () => {
    setLoadError("");
    try {
      const r = await fetch(`/api/admin/orders/${id}`);
      if (!r.ok) {
        if (r.status === 404) {
          setOrder(null);
        } else {
          setLoadError(`Failed to load order (${r.status})`);
        }
        return;
      }
      const data = await r.json();
      if (data.error) {
        setOrder(null);
      } else {
        setOrder(data);
        setStatus(data.status);
        setPaymentStatus(data.paymentStatus);
        setProductionStatus(data.productionStatus);
        setTagsInput(
          Array.isArray(data.tags) ? data.tags.join(", ") : data.tags || ""
        );
        setPriority(data.priority || 0);
        setIsArchived(data.isArchived || false);
        setEstimatedCompletion(
          data.estimatedCompletion
            ? data.estimatedCompletion.slice(0, 10)
            : ""
        );
        if (data.timeline) {
          setTimeline(data.timeline);
        }
        setLastRefreshed(new Date());
      }
    } catch {
      setLoadError("Network error — could not reach server");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
    fetchTimeline();
  }, [fetchOrder, fetchTimeline]);

  // Auto-refresh every 30s
  useEffect(() => {
    refreshTimer.current = setInterval(() => {
      fetchOrder();
      fetchTimeline();
    }, AUTO_REFRESH_MS);
    return () => clearInterval(refreshTimer.current);
  }, [fetchOrder, fetchTimeline]);

  function showMsg(text, isError = false) {
    setMessage(text);
    setMessageIsError(isError);
    setTimeout(() => setMessage(""), isError ? 5000 : 3000);
  }

  async function handleStatusUpdate() {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, paymentStatus, productionStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrder(data);
        showMsg(t("admin.orderDetail.statusUpdated"));
        fetchTimeline();
      } else {
        showMsg(data.error || t("admin.orderDetail.updateFailed"), true);
      }
    } catch {
      showMsg(t("admin.orderDetail.updateFailed"), true);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddNote() {
    if (!noteText.trim()) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: noteText, isInternal: isInternalNote }),
      });
      if (res.ok) {
        const note = await res.json();
        setOrder((prev) => ({
          ...prev,
          notes: [note, ...(prev.notes || [])],
        }));
        setNoteText("");
      } else {
        showMsg("Failed to add note", true);
      }
    } catch {
      showMsg("Failed to add note", true);
    } finally {
      setAddingNote(false);
    }
  }

  async function handlePatchField(fieldData) {
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fieldData),
      });
      const data = await res.json();
      if (res.ok) {
        setOrder(data);
        fetchTimeline();
      } else {
        showMsg(data.error || "Failed to update field", true);
      }
    } catch {
      showMsg("Failed to update field", true);
    }
  }

  function handleTagsBlur() {
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    handlePatchField({ tags });
  }

  function handlePriorityChange(newPriority) {
    setPriority(newPriority);
    handlePatchField({ priority: newPriority });
  }

  function handleArchiveToggle() {
    const newVal = !isArchived;
    setIsArchived(newVal);
    handlePatchField({ isArchived: newVal });
  }

  function handleEstimatedCompletionChange(e) {
    const val = e.target.value;
    setEstimatedCompletion(val);
    if (val) {
      handlePatchField({ estimatedCompletion: new Date(val).toISOString() });
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-[#999]">
        {t("admin.common.loading")}
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-sm text-red-600">{loadError}</p>
        <button
          type="button"
          onClick={() => { setLoading(true); fetchOrder(); fetchTimeline(); }}
          className="rounded-[3px] bg-black px-4 py-2 text-xs font-medium text-[#fff] hover:bg-[#222]"
        >
          Retry
        </button>
        <Link href="/admin/orders" className="text-xs text-[#999] hover:text-black">
          {t("admin.orderDetail.backToOrders")}
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <p className="text-sm text-[#999]">{t("admin.orderDetail.notFound")}</p>
        <Link href="/admin/orders" className="text-sm text-black underline hover:no-underline">
          {t("admin.orderDetail.backToOrders")}
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Printable Invoice (hidden on screen, visible in print) */}
      <div className="hidden print:block">
        <PrintInvoice order={order} />
      </div>

      {/* Main content (visible on screen, hidden in print) */}
      <div className="space-y-6 print:hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="no-print mb-1 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => router.push("/admin/orders")}
                className="text-xs text-[#999] hover:text-black"
              >
                &larr; {t("admin.orderDetail.backToOrders")}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-[3px] border border-[#d0d0d0] px-3 py-1 text-xs font-medium text-black hover:bg-[#fafafa]"
              >
                {t("admin.orderDetail.printInvoice")}
              </button>
              <button
                type="button"
                onClick={() => window.open(`/api/admin/orders/${order.id}/packing-slip`, "_blank")}
                className="rounded-[3px] border border-[#d0d0d0] px-3 py-1 text-xs font-medium text-black hover:bg-[#fafafa]"
              >
                {t("admin.orderDetail.printPackingSlip")}
              </button>
            </div>
            <h1 className="text-xl font-semibold text-black">
              {t("admin.orderDetail.title")}
            </h1>
            <div className="mt-0.5 flex items-center gap-2">
              <p className="font-mono text-xs text-[#999]">{order.id}</p>
              <button
                type="button"
                disabled={manualRefreshing}
                onClick={async () => {
                  setManualRefreshing(true);
                  await Promise.all([fetchOrder(), fetchTimeline()]);
                  setManualRefreshing(false);
                }}
                className="text-[10px] font-medium text-[#999] hover:text-black disabled:opacity-50"
              >
                {manualRefreshing ? "Refreshing..." : "Refresh"}
              </button>
              {lastRefreshed && (
                <span className="text-[10px] text-[#bbb]">
                  Updated {lastRefreshed.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
          <span
            className={`rounded-[2px] px-3 py-1 text-xs font-semibold ${
              statusColor(order.status)
            }`}
          >
            {order.status}
          </span>
          {order.costSignal && <CostSignalBadge signal={order.costSignal} size="md" />}
          <Link
            href={`/admin/pricing?tab=costs&orderId=${order.id}&returnTo=${encodeURIComponent(`/admin/orders/${order.id}`)}`}
            className="rounded-[2px] border border-[#d0d0d0] px-2 py-0.5 text-xs font-medium text-[#666] hover:border-black hover:text-black"
          >
            {t("admin.orders.reviewCosts")}
          </Link>
          {order.sourceQuote && (
            <Link
              href="/admin/quotes"
              className="rounded-[2px] border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
              title={`Converted from quote ${order.sourceQuote.reference}`}
            >
              Quote {order.sourceQuote.reference}
            </Link>
          )}
        </div>

        {/* Action feedback banner */}
        {actionFeedback && (
          <div className={`rounded-[3px] px-4 py-2.5 text-xs font-medium ${actionFeedback.isError ? "border border-red-200 bg-red-50 text-red-700" : "border border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
            {actionFeedback.text}
          </div>
        )}

        {/* Contextual action tray — quick artwork + production shortcuts */}
        <ContextualActionTray
          order={order}
          orderId={id}
          sendingReminder={sendingReminder}
          copiedLink={copiedLink}
          onSendReminder={async () => {
            setSendingReminder(true);
            setActionFeedback(null);
            try {
              const res = await fetch(`/api/admin/orders/${id}/remind-artwork`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
              });
              const d = await res.json();
              if (res.ok) {
                setActionFeedback({ text: "Artwork reminder sent to customer", isError: false });
                fetchOrder();
                fetchTimeline();
              } else {
                setActionFeedback({ text: d.error || "Failed to send reminder", isError: true });
              }
            } catch {
              setActionFeedback({ text: "Failed to send reminder", isError: true });
            } finally {
              setSendingReminder(false);
              setTimeout(() => setActionFeedback(null), 5000);
            }
          }}
          onCopyLink={() => {
            const uploadUrl = `https://lunarprint.ca/track-order?order=${id}`;
            navigator.clipboard.writeText(uploadUrl).then(() => {
              setCopiedLink(true);
              setTimeout(() => setCopiedLink(false), 2000);
            });
          }}
        />

        {/* Unified readiness summary — single source of truth from assessOrder() */}
        <OrderReadinessSummary order={order} />

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column - main info */}
          <div className="space-y-6 lg:col-span-2">
            {/* Customer info */}
            <Section title={t("admin.orderDetail.customer")}>
              <div className="grid gap-3 sm:grid-cols-3">
                <InfoField label={t("admin.orderDetail.email")} value={order.customerEmail} />
                <InfoField label={t("admin.orderDetail.name")} value={order.customerName || "\u2014"} />
                <InfoField label={t("admin.orderDetail.phone")} value={order.customerPhone || "\u2014"} />
              </div>
              {order.shippingAddress && (
                <div className="mt-3 rounded-[3px] border border-[#e0e0e0] px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#999] mb-1">Shipping Address</p>
                  <p className="text-xs text-black leading-relaxed">
                    {order.shippingAddress.name && <>{order.shippingAddress.name}<br /></>}
                    {order.shippingAddress.company && <>{order.shippingAddress.company}<br /></>}
                    {order.shippingAddress.line1}
                    {order.shippingAddress.line2 && <>, {order.shippingAddress.line2}</>}
                    <br />
                    {order.shippingAddress.city}{order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ""} {order.shippingAddress.postalCode}
                    <br />
                    {order.shippingAddress.country}
                  </p>
                </div>
              )}
            </Section>

            {/* Shipment / Fulfillment summary — order-first view of shipping state */}

            {/* Customer Summary — plain-language overview for CS reps */}
            <CustomerSummarySection order={order} />

            {/* Order items */}
            <Section title={`${t("admin.orderDetail.items")} (${order.items?.length || 0})`}>
              {order.items && order.items.length > 0 ? (
                <div className="divide-y divide-[#e0e0e0]">
                  {order.items.map((item) => (
                    <div key={item.id} id={`item-${item.id}`} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <ItemProductionPanel item={item} orderId={order.id} />
                          {parseSizeRows(item).length > 0 && (
                            <div className="mt-1 space-y-0.5 text-[11px] text-[#999]">
                              {parseSizeRows(item).map((row, idx) => (
                                <p key={`${item.id}-size-${idx}`}>
                                  #{idx + 1}: {row.width}&quot; x {row.height}&quot; x {row.quantity}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold text-black">
                            {formatCad(item.totalPrice)}
                          </p>
                          <p className="text-xs text-[#999]">
                            {formatCad(item.unitPrice)} {t("admin.orderDetail.each")}
                          </p>
                          {item.productionJob && (
                            <Link href={`/admin/production/${item.productionJob.id}`} className="mt-1.5 flex flex-col items-end gap-0.5 hover:opacity-80">
                              <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                                item.productionJob.status === "shipped" || item.productionJob.status === "finished" ? "bg-green-100 text-green-700" :
                                item.productionJob.status === "printing" || item.productionJob.status === "quality_check" ? "bg-indigo-100 text-indigo-700" :
                                item.productionJob.status === "assigned" ? "bg-blue-100 text-blue-700" :
                                item.productionJob.status === "on_hold" ? "bg-red-100 text-red-700" :
                                "bg-gray-100 text-gray-600"
                              }`}>
                                {item.productionJob.status.replace(/_/g, " ")}
                              </span>
                              {item.productionJob.priority === "urgent" && (
                                <span className="rounded bg-red-50 px-1.5 py-0.5 text-[9px] font-bold text-red-700">URGENT</span>
                              )}
                              {item.productionJob.dueAt && (
                                <span className={`text-[9px] ${new Date(item.productionJob.dueAt) < new Date() ? "font-bold text-red-600" : "text-[#999]"}`}>
                                  Due: {new Date(item.productionJob.dueAt).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                                </span>
                              )}
                              {item.productionJob.assignedTo && (
                                <span className="text-[9px] text-[#999]">{item.productionJob.assignedTo}</span>
                              )}
                            </Link>
                          )}
                          {item.costSignal && <CostSignalBadge signal={item.costSignal} size="sm" />}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#999]">{t("admin.orderDetail.noItems")}</p>
              )}
            </Section>

            {/* Amount breakdown */}
            <Section title={t("admin.orderDetail.amount")}>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#666]">{t("admin.orderDetail.subtotal")}</span>
                  <span className="font-medium text-black">
                    {formatCad(order.subtotalAmount)}
                  </span>
                </div>
                {/* Rush surcharge breakdown — informational, already baked into subtotal */}
                {(() => {
                  const rushItems = (order.items || []).filter(i => {
                    const m = i.meta && typeof i.meta === "object" ? i.meta : {};
                    return m.rushProduction === true || m.rushProduction === "true";
                  });
                  if (rushItems.length === 0) return null;
                  const rushSurcharge = rushItems.reduce((sum, i) => {
                    const base = Math.round(i.unitPrice / RUSH_MULTIPLIER);
                    return sum + (i.unitPrice - base) * i.quantity;
                  }, 0);
                  return (
                    <div className="flex justify-between text-amber-700">
                      <span className="flex items-center gap-1">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
                        {t("admin.orderDetail.rushSurcharge")} ({rushItems.length} {rushItems.length === 1 ? "item" : "items"})
                      </span>
                      <span className="font-medium">incl. ~{formatCad(rushSurcharge)}</span>
                    </div>
                  );
                })()}
                {/* Design help fee — informational, already baked into subtotal */}
                {(() => {
                  const dhItems = (order.items || []).filter(i => {
                    const m = i.meta && typeof i.meta === "object" ? i.meta : {};
                    return m.designHelp === true || m.designHelp === "true" || m.feeType === "design-help";
                  });
                  if (dhItems.length === 0) return null;
                  // Check if design help is a separate OrderItem (Stripe/Interac pattern)
                  const dhServiceItem = dhItems.find(i => {
                    const m = i.meta && typeof i.meta === "object" ? i.meta : {};
                    return m.isServiceFee === "true" && m.feeType === "design-help";
                  });
                  const dhTotal = dhServiceItem
                    ? dhServiceItem.totalPrice
                    : dhItems.length * DESIGN_HELP_CENTS;
                  return (
                    <div className="flex justify-between text-indigo-700">
                      <span className="flex items-center gap-1">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-500" />
                        {t("admin.orderDetail.designHelpFee")} ({dhItems.length})
                      </span>
                      <span className="font-medium">incl. {formatCad(dhTotal)}</span>
                    </div>
                  );
                })()}
                {order.discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[#666]">
                      {order.coupon ? `${t("admin.orderDetail.coupon")} (${order.coupon.code})` : t("admin.orderDetail.discount")}
                    </span>
                    <span className="font-medium text-green-700">
                      -{formatCad(order.discountAmount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#666]">{t("admin.orderDetail.tax")}</span>
                  <span className="font-medium text-black">
                    {formatCad(order.taxAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666]">{t("admin.orderDetail.shipping")}</span>
                  <span className="font-medium text-black">
                    {order.shippingAmount === 0
                      ? t("admin.orderDetail.free")
                      : formatCad(order.shippingAmount)}
                  </span>
                </div>
                {order.refundAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-red-600">{t("admin.orderDetail.refund")}</span>
                    <span className="font-medium text-red-600">
                      -{formatCad(order.refundAmount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t border-[#e0e0e0] pt-2 text-base font-semibold">
                  <span>{t("admin.orderDetail.total")}</span>
                  <span>{formatCad(order.totalAmount)} CAD</span>
                </div>
              </div>
            </Section>

            {/* Notes */}
            <Section title={t("admin.orderDetail.notes")}>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder={t("admin.orderDetail.addNotePlaceholder")}
                    className="flex-1 rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                    onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                  />
                  <label className="flex items-center gap-1 text-xs text-[#999]">
                    <input
                      type="checkbox"
                      checked={isInternalNote}
                      onChange={(e) => setIsInternalNote(e.target.checked)}
                      className="rounded border-[#d0d0d0]"
                    />
                    {t("admin.orderDetail.internal")}
                  </label>
                  <button
                    type="button"
                    onClick={handleAddNote}
                    disabled={addingNote || !noteText.trim()}
                    className="rounded-[3px] bg-black px-4 py-2 text-xs font-semibold text-[#fff] hover:bg-[#222] disabled:bg-[#999]"
                  >
                    {addingNote ? "..." : t("admin.orderDetail.add")}
                  </button>
                </div>

                {order.notes && order.notes.length > 0 ? (
                  <div className="space-y-2">
                    {order.notes.map((note) => (
                      <div
                        key={note.id}
                        className="rounded-[3px] bg-[#fafafa] px-3 py-2"
                      >
                        <p className="text-sm text-black">{note.message}</p>
                        <p className="mt-1 text-xs text-[#999]">
                          {note.authorType} &middot;{" "}
                          {new Date(note.createdAt).toLocaleString()}
                          {note.isInternal && (
                            <span className="ml-2 rounded bg-[#e0e0e0] px-1.5 py-0.5 text-xs text-[#666]">
                              {t("admin.orderDetail.internal")}
                            </span>
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#999]">{t("admin.orderDetail.noNotes")}</p>
                )}
              </div>
            </Section>

            {/* Order Timeline */}
            <Section title={t("admin.orderDetail.timeline")}>
              {timeline.length > 0 ? (
                <div className="relative pl-6 border-l-2 border-[#e0e0e0]">
                  {timeline.map((event, idx) => {
                    const dotColor =
                      timelineDotColors[event.action] ||
                      timelineDotColors.default;
                    return (
                      <div key={event.id || idx} className="relative pb-4 last:pb-0">
                        {/* Dot */}
                        <div
                          className={`absolute -left-[25px] top-1 h-3 w-3 rounded-full border-2 border-white ${dotColor}`}
                        />
                        <div>
                          <p className="text-sm font-medium text-black">
                            {getActionLabel(event.action)}
                          </p>
                          {event.details && (
                            <p className="mt-0.5 text-xs text-[#999] break-all">
                              {event.details}
                            </p>
                          )}
                          <p className="mt-0.5 text-xs text-[#999]">
                            {event.actor && (
                              <span className="mr-2 font-medium">{event.actor}</span>
                            )}
                            {new Date(event.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-[#999]">{t("admin.orderDetail.noTimeline")}</p>
              )}
            </Section>
          </div>

          {/* Right column - status & meta */}
          <div className="space-y-6">
            {/* Status update */}
            <Section title={t("admin.orderDetail.updateStatus")}>
              <div className="space-y-3">
                <SelectField
                  label={t("admin.orderDetail.orderStatus")}
                  hint={t("admin.orderDetail.orderStatusHint")}
                  value={status}
                  onChange={setStatus}
                  options={statusOptions}
                />
                <SelectField
                  label={t("admin.orderDetail.paymentStatus")}
                  hint={t("admin.orderDetail.paymentStatusHint")}
                  value={paymentStatus}
                  onChange={setPaymentStatus}
                  options={paymentOptions}
                />
                <SelectField
                  label={t("admin.orderDetail.productionStatus")}
                  hint={t("admin.orderDetail.productionStatusHint")}
                  value={productionStatus}
                  onChange={setProductionStatus}
                  options={productionOptions}
                />

                {message && (
                  <p className={`text-xs font-medium ${messageIsError ? "text-red-600" : "text-green-600"}`}>{message}</p>
                )}

                <button
                  type="button"
                  onClick={handleStatusUpdate}
                  disabled={saving}
                  className="w-full rounded-[3px] bg-black py-2.5 text-xs font-semibold text-[#fff] hover:bg-[#222] disabled:bg-[#999]"
                >
                  {saving ? t("admin.common.saving") : t("admin.orderDetail.updateStatus")}
                </button>
              </div>
            </Section>

            <ShipmentSummarySection order={order} />

            {/* Tags, Priority, Archive */}
            <Section title={t("admin.orderDetail.tagsPriority")}>
              <div className="space-y-4">
                {/* Tags */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#666]">
                    {t("admin.orderDetail.tags")}
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    onBlur={handleTagsBlur}
                    placeholder={t("admin.orderDetail.tagsPlaceholder")}
                    className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                  />
                  {tagsInput && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {tagsInput
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean)
                        .map((tag, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center rounded-[2px] bg-[#f5f5f5] px-2.5 py-0.5 text-xs font-medium text-black"
                          >
                            {tag}
                          </span>
                        ))}
                    </div>
                  )}
                </div>

                {/* Priority */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#666]">
                    {t("admin.orderDetail.priority")}
                  </label>
                  <div className="flex gap-2">
                    {priorityLabelKeys.map((key, idx) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handlePriorityChange(idx)}
                        className={`flex-1 rounded-[3px] border px-2 py-1.5 text-xs font-semibold transition-colors ${
                          priority === idx
                            ? priorityColors[idx]
                            : "border-[#e0e0e0] bg-white text-[#999] hover:bg-[#fafafa]"
                        }`}
                      >
                        {t(key)}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1 text-[10px] text-[#999]">{t("admin.orderDetail.priorityHint")}</p>
                </div>

                {/* Archive Toggle */}
                <div>
                  <button
                    type="button"
                    onClick={handleArchiveToggle}
                    className={`w-full rounded-[3px] border px-3 py-2 text-xs font-semibold transition-colors ${
                      isArchived
                        ? "border-orange-300 bg-orange-50 text-orange-700"
                        : "border-[#e0e0e0] bg-white text-[#666] hover:bg-[#fafafa]"
                    }`}
                  >
                    {isArchived ? t("admin.orderDetail.archivedUnarchive") : t("admin.orderDetail.archiveOrder")}
                  </button>
                </div>

                {/* Estimated Completion */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#666]">
                    {t("admin.orderDetail.estimatedCompletion")}
                  </label>
                  <input
                    type="date"
                    value={estimatedCompletion}
                    onChange={handleEstimatedCompletionChange}
                    className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                  />
                  <p className="mt-1 text-[10px] text-[#999]">{t("admin.orderDetail.estimatedCompletionHint")}</p>
                </div>
              </div>
            </Section>

            {/* Metadata */}
            <Section title={t("admin.orderDetail.details")}>
              <div className="space-y-2 text-xs">
                <InfoField label={t("admin.orderDetail.currency")} value={order.currency?.toUpperCase()} />
                <InfoField
                  label={t("admin.orderDetail.stripeSession")}
                  value={order.stripeSessionId ? order.stripeSessionId.slice(0, 20) + "..." : "\u2014"}
                />
                <InfoField
                  label={t("admin.orderDetail.paymentIntent")}
                  value={
                    order.stripePaymentIntentId
                      ? order.stripePaymentIntentId.slice(0, 20) + "..."
                      : "\u2014"
                  }
                />
                <InfoField
                  label={t("admin.orderDetail.paidAt")}
                  value={
                    order.paidAt
                      ? new Date(order.paidAt).toLocaleString()
                      : "\u2014"
                  }
                />
                <InfoField
                  label={t("admin.orderDetail.created")}
                  value={new Date(order.createdAt).toLocaleString()}
                />
                <InfoField
                  label={t("admin.orderDetail.updated")}
                  value={new Date(order.updatedAt).toLocaleString()}
                />
              </div>
            </Section>

            {/* Files with Preflight Review */}
            {order.files && order.files.length > 0 && (
              <Section title={`${t("admin.orderDetail.files")} (${order.files.length})`} dataSection="files">
                <div className="space-y-2">
                  {order.files.map((file) => {
                    const sizeBytes = file.sizeBytes ? Number(file.sizeBytes) : 0;
                    const sizeStr = sizeBytes > 0
                      ? sizeBytes < 1024 * 1024
                        ? `${(sizeBytes / 1024).toFixed(0)} KB`
                        : `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
                      : null;
                    const dimStr = file.widthPx && file.heightPx ? `${file.widthPx}×${file.heightPx}px` : null;
                    const dpiOk = file.dpi ? file.dpi >= 150 : null;
                    return (
                      <div key={file.id} className="rounded-[3px] border border-[#e0e0e0] px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <a
                            href={file.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-w-0 truncate text-xs text-black underline hover:no-underline"
                          >
                            {file.fileName || "File"}
                          </a>
                          <span className={`shrink-0 rounded-[2px] px-2 py-0.5 text-[10px] font-semibold ${
                            file.preflightStatus === "approved" ? "bg-green-100 text-green-700" :
                            file.preflightStatus === "rejected" ? "bg-red-100 text-red-700" :
                            "bg-[#f5f5f5] text-[#666]"
                          }`}>
                            {file.preflightStatus || "pending"}
                          </span>
                        </div>
                        {/* File metadata row */}
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-[#999]">
                          {file.mimeType && <span>{file.mimeType}</span>}
                          {sizeStr && <span>{sizeStr}</span>}
                          {dimStr && <span>{dimStr}</span>}
                          {file.dpi != null && (
                            <span className={dpiOk ? "text-green-600" : "text-amber-600"}>
                              {file.dpi} DPI
                            </span>
                          )}
                          {file.colorMode && file.colorMode !== "unknown" && (
                            <span className={file.colorMode === "cmyk" ? "text-green-600" : "text-amber-600"}>
                              {file.colorMode.toUpperCase()}
                            </span>
                          )}
                          {file.hasBleed === true && <span className="text-green-600">Bleed ✓</span>}
                          {file.hasBleed === false && <span className="text-amber-600">No bleed</span>}
                        </div>
                        {file.preflightStatus === "pending" && (
                          <PreflightActions orderId={id} fileId={file.id} fileName={file.fileName} onUpdate={() => {
                            fetch(`/api/admin/orders/${id}`).then(r => r.json()).then(data => {
                              if (!data.error) { setOrder(data); fetchTimeline(); }
                            });
                          }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* Proof Management */}
            <div data-section="proofs">
              <ProofSection orderId={id} />
            </div>

            {/* Contour / Proof Data (from customer configurator) */}
            {order.proofData && order.proofData.length > 0 && (
              <ContourDataSection proofData={order.proofData} toolJobs={order.toolJobs} />
            )}

            {/* Stamp Production Data (from order item meta) */}
            <StampProductionSection order={order} />

            {/* Production Readiness — at-a-glance indicator */}
            <ProductionReadinessSection order={order} />

            {/* Package Completeness — per-item file checklist */}
            <PackageCompletenessSection order={order} />

            {/* Production Files — all layers for one-click download */}
            <ProductionFilesSection order={order} />

            {/* Preflight Checks */}
            <PreflightSection order={order} />

            {/* Actions: Ship & Refund */}
            <div data-section="actions">
              <OrderActions
                order={order}
                onUpdate={() => {
                  fetch(`/api/admin/orders/${id}`).then(r => r.json()).then(data => {
                    if (!data.error) {
                      setOrder(data);
                      setStatus(data.status);
                      setPaymentStatus(data.paymentStatus);
                      setProductionStatus(data.productionStatus);
                      fetchTimeline();
                    }
                  });
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ========== Print Invoice Component ========== */
function PrintInvoice({ order }) {
  const { t } = useTranslation();
  return (
    <div className="p-8 text-sm text-black">
      {/* Invoice Header */}
      <div className="flex items-start justify-between border-b border-[#d0d0d0] pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">La Lunar Printing Inc.</h1>
          <p className="text-[#999] mt-1">{t("admin.orderDetail.invoice")}</p>
        </div>
        <div className="text-right">
          <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
          <p className="text-[#999]">
            {new Date(order.createdAt).toLocaleDateString("en-CA")}
          </p>
        </div>
      </div>

      {/* Customer Info */}
      <div className="mb-6">
        <h2 className="text-xs font-semibold uppercase text-[#999] mb-2">
          {t("admin.orderDetail.billTo")}
        </h2>
        <p className="font-medium">{order.customerName || order.customerEmail}</p>
        <p>{order.customerEmail}</p>
        {order.customerPhone && <p>{order.customerPhone}</p>}
      </div>

      {/* Items Table */}
      <table className="w-full mb-6 border-collapse">
        <thead>
          <tr className="border-b border-[#d0d0d0] text-left text-xs font-semibold uppercase text-[#999]">
            <th className="pb-2">{t("admin.orderDetail.item")}</th>
            <th className="pb-2">{t("admin.orderDetail.type")}</th>
            <th className="pb-2 text-center">{t("admin.orderDetail.qty")}</th>
            <th className="pb-2 text-right">{t("admin.orderDetail.unitPrice")}</th>
            <th className="pb-2 text-right">{t("admin.orderDetail.total")}</th>
          </tr>
        </thead>
        <tbody>
          {order.items?.map((item) => (
            <tr key={item.id} className="border-b border-[#e0e0e0]">
              <td className="py-2">
                <p className="font-medium">{item.productName}</p>
                <p className="text-xs text-[#999]">
                  {[
                    item.widthIn && item.heightIn
                      ? `${item.widthIn}" x ${item.heightIn}"`
                      : null,
                    item.material,
                    item.finishing,
                  ]
                    .filter(Boolean)
                    .join(" / ")}
                </p>
                {parseSizeRows(item).length > 0 && (
                  <div className="mt-1 text-[10px] text-[#999]">
                    {parseSizeRows(item).map((row, idx) => (
                      <p key={`${item.id}-print-size-${idx}`}>
                        #{idx + 1}: {row.width}&quot; x {row.height}&quot; x {row.quantity}
                      </p>
                    ))}
                  </div>
                )}
              </td>
              <td className="py-2 text-xs">{item.productType}</td>
              <td className="py-2 text-center">{item.quantity}</td>
              <td className="py-2 text-right">{formatCad(item.unitPrice)}</td>
              <td className="py-2 text-right font-medium">
                {formatCad(item.totalPrice)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Amounts */}
      <div className="ml-auto w-64 space-y-1 text-sm">
        <div className="flex justify-between">
          <span>{t("admin.orderDetail.subtotal")}</span>
          <span>{formatCad(order.subtotalAmount)}</span>
        </div>
        {order.discountAmount > 0 && (
          <div className="flex justify-between text-green-700">
            <span>{order.coupon ? `${t("admin.orderDetail.coupon")} (${order.coupon.code})` : t("admin.orderDetail.discount")}</span>
            <span>-{formatCad(order.discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>{t("admin.orderDetail.tax")}</span>
          <span>{formatCad(order.taxAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span>{t("admin.orderDetail.shipping")}</span>
          <span>
            {order.shippingAmount === 0 ? t("admin.orderDetail.free") : formatCad(order.shippingAmount)}
          </span>
        </div>
        {order.refundAmount > 0 && (
          <div className="flex justify-between text-red-600">
            <span>{t("admin.orderDetail.refund")}</span>
            <span>-{formatCad(order.refundAmount)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-[#d0d0d0] pt-2 text-base font-bold">
          <span>{t("admin.orderDetail.total")}</span>
          <span>{formatCad(order.totalAmount)} CAD</span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-10 border-t border-[#e0e0e0] pt-4 text-center text-xs text-[#999]">
        <p>{t("admin.orderDetail.thankYou")}</p>
        <p className="mt-1">La Lunar Printing Inc.</p>
      </div>
    </div>
  );
}

/* ========== Reusable Components ========== */
function Section({ title, children, dataSection }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5" {...(dataSection ? { "data-section": dataSection } : {})}>
      <h2 className="mb-3 text-sm font-semibold text-gray-900">{title}</h2>
      {children}
    </div>
  );
}

function InfoField({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-600">{label}</p>
      <p className="mt-0.5 text-sm text-gray-900">{value}</p>
    </div>
  );
}

function SelectField({ label, value, onChange, options, hint }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt.replace(/_/g, " ")}
          </option>
        ))}
      </select>
      {hint && <p className="mt-1 text-[10px] text-[#999]">{hint}</p>}
    </div>
  );
}

/* ========== Contextual Action Tray ========== */
function ContextualActionTray({ order, orderId, sendingReminder, copiedLink, onSendReminder, onCopyLink }) {
  // Determine order state for contextual actions
  const itemsNeedingArt = (order.items || []).filter((item) => itemNeedsArtwork(item));
  const pendingPreflightFiles = (order.files || []).filter((f) => f.preflightStatus === "pending");
  const hasPendingPreflight = pendingPreflightFiles.length > 0;
  const hasProofData = order.proofData && order.proofData.length > 0;

  // Production-stage awareness
  const ps = order.productionStatus;
  const isPreProduction = ["not_started", "preflight"].includes(ps);
  const isInProduction = ps === "in_production";
  const isReadyToShip = ps === "ready_to_ship";
  const isTerminal = ["shipped", "completed", "canceled"].includes(ps);

  // Nothing to promote on terminal orders
  if (isTerminal) return null;

  // Check if there's at least one thing to show
  const hasAnything = itemsNeedingArt.length > 0 || hasPendingPreflight || isPreProduction || isInProduction || isReadyToShip;
  if (!hasAnything) return null;

  const uploadUrl = `https://lunarprint.ca/track-order?order=${orderId}`;

  return (
    <div className="rounded-[3px] border border-[#e0e0e0] bg-[#fafafa] px-4 py-3 space-y-2">
      {/* Artwork actions */}
      {itemsNeedingArt.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-amber-700 font-medium">
            {itemsNeedingArt.length} item{itemsNeedingArt.length > 1 ? "s" : ""} missing artwork
          </span>
          <button
            type="button"
            disabled={sendingReminder}
            onClick={onSendReminder}
            className="rounded-[3px] bg-black px-3 py-1.5 text-xs font-medium text-[#fff] hover:bg-[#222] disabled:opacity-50"
          >
            {sendingReminder ? "Sending..." : "Send Reminder"}
          </button>
          <button
            type="button"
            onClick={onCopyLink}
            className="text-[10px] font-medium text-[#999] hover:text-black"
          >
            {copiedLink ? "Copied!" : "Copy upload link"}
          </button>
          <a
            href={uploadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-medium text-[#999] hover:text-black"
          >
            Open upload page
          </a>
        </div>
      )}

      {/* Operational next-step shortcuts */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Pending file review */}
        {hasPendingPreflight && (
          <a
            href="#files-section"
            onClick={(e) => {
              e.preventDefault();
              document.querySelector("[data-section='files']")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="rounded-[2px] bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 hover:bg-amber-200"
          >
            {pendingPreflightFiles.length} file{pendingPreflightFiles.length > 1 ? "s" : ""} awaiting review
          </a>
        )}

        {/* Pre-production: promote proof upload */}
        {isPreProduction && (
          <a
            href="#proof-section"
            onClick={(e) => {
              e.preventDefault();
              document.querySelector("[data-section='proofs']")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="rounded-[2px] bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 hover:bg-blue-100"
          >
            {hasProofData ? "View proofs" : "Upload proof"}
          </a>
        )}

        {/* In production or ready to ship: promote packing slip / manifest */}
        {(isInProduction || isReadyToShip) && (
          <>
            <a
              href={`/api/admin/orders/${orderId}/manifest`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-[2px] bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 hover:bg-indigo-100"
            >
              Manifest
            </a>
            <a
              href={`/api/admin/orders/${orderId}/packing-slip`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-[2px] bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 hover:bg-indigo-100"
            >
              Packing slip
            </a>
          </>
        )}

        {/* Ready to ship: promote shipping action */}
        {isReadyToShip && (
          <a
            href="#actions-section"
            onClick={(e) => {
              e.preventDefault();
              document.querySelector("[data-section='actions']")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="rounded-[2px] bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100"
          >
            Ship order
          </a>
        )}
      </div>
    </div>
  );
}

/* ========== Preflight Review Actions ========== */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function PreflightActions({ orderId, fileId, fileName, onUpdate }) {
  const { t } = useTranslation();
  const [acting, setActing] = useState(false);
  const [notes, setNotes] = useState("");

  async function handleReview(status) {
    setActing(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/preflight`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId, status, notes: notes || undefined }),
      });
      if (res.ok) onUpdate();
    } catch {
      console.error("Preflight review failed");
    } finally {
      setActing(false);
    }
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <input
        type="text"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={t("admin.orderDetail.reviewNotesPlaceholder")}
        className="flex-1 rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-gray-400"
      />
      <button
        type="button"
        onClick={() => handleReview("approved")}
        disabled={acting}
        className="rounded bg-green-600 px-2.5 py-1 text-[10px] font-semibold text-[#fff] hover:bg-green-700 disabled:opacity-50"
      >
        {t("admin.orderDetail.approve")}
      </button>
      <button
        type="button"
        onClick={() => handleReview("rejected")}
        disabled={acting}
        className="rounded bg-red-600 px-2.5 py-1 text-[10px] font-semibold text-[#fff] hover:bg-red-700 disabled:opacity-50"
      >
        {t("admin.orderDetail.reject")}
      </button>
    </div>
  );
}

/* ========== Proof Management ========== */
const proofStatusColors = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  revised: "bg-blue-100 text-blue-700",
};

function ProofSection({ orderId }) {
  const { t } = useTranslation();
  const [proofs, setProofs] = useState([]);
  const [loadingProofs, setLoadingProofs] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [notes, setNotes] = useState("");

  const fetchProofs = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/proofs`);
      if (res.ok) {
        const data = await res.json();
        setProofs(data);
      }
    } catch {
      console.error("Failed to fetch proofs");
    } finally {
      setLoadingProofs(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchProofs();
  }, [fetchProofs]);

  async function handleUploadProof() {
    if (!imageUrl.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/proofs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: imageUrl.trim(),
          fileName: fileName.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      if (res.ok) {
        setImageUrl("");
        setFileName("");
        setNotes("");
        fetchProofs();
      }
    } catch {
      console.error("Failed to upload proof");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Section title={`${t("admin.orderDetail.proofs")} (${proofs.length})`}>
      <div className="space-y-3">
        {/* Upload form */}
        <div className="space-y-2 rounded-[3px] border border-[#e0e0e0] bg-[#fafafa] p-3">
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder={t("admin.orderDetail.imageUrl")}
            className="w-full rounded-[3px] border border-[#d0d0d0] px-2.5 py-1.5 text-xs outline-none focus:border-black"
          />
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder={t("admin.orderDetail.fileNameOptional")}
            className="w-full rounded-[3px] border border-[#d0d0d0] px-2.5 py-1.5 text-xs outline-none focus:border-black"
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("admin.orderDetail.notesOptional")}
            rows={2}
            className="w-full rounded-[3px] border border-[#d0d0d0] px-2.5 py-1.5 text-xs outline-none focus:border-black resize-none"
          />
          <button
            type="button"
            onClick={handleUploadProof}
            disabled={submitting || !imageUrl.trim()}
            className="w-full rounded-[3px] bg-black py-2 text-xs font-semibold text-[#fff] hover:bg-[#222] disabled:bg-[#999]"
          >
            {submitting ? t("admin.orderDetail.uploading") : t("admin.orderDetail.uploadProof")}
          </button>
        </div>

        {/* Proof list */}
        {loadingProofs ? (
          <p className="text-xs text-[#999]">{t("admin.orderDetail.loadingProofs")}</p>
        ) : proofs.length === 0 ? (
          <p className="text-xs text-[#999]">{t("admin.orderDetail.noProofs")}</p>
        ) : (
          <div className="space-y-2">
            {proofs.map((proof) => (
              <div
                key={proof.id}
                className="rounded-[3px] border border-[#e0e0e0] p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-[2px] bg-[#f5f5f5] px-2 py-0.5 text-[10px] font-semibold text-[#666]">
                      v{proof.version}
                    </span>
                    <span
                      className={`rounded-[2px] px-2 py-0.5 text-[10px] font-semibold ${
                        proofStatusColors[proof.status] || "bg-[#f5f5f5] text-[#666]"
                      }`}
                    >
                      {proof.status}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#999]">
                    {new Date(proof.createdAt).toLocaleString()}
                  </span>
                </div>
                {proof.imageUrl && (
                  <a
                    href={proof.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 block"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- admin page, dynamic external URLs */}
                    <img
                      src={proof.imageUrl}
                      alt={proof.fileName || `Proof v${proof.version}`}
                      className="h-24 w-full rounded-[3px] border border-[#e0e0e0] object-cover"
                    />
                  </a>
                )}
                {proof.notes && (
                  <p className="mt-2 text-xs text-[#666]">
                    <span className="font-medium text-black">{t("admin.orderDetail.notes")}:</span> {proof.notes}
                  </p>
                )}
                {proof.customerComment && (
                  <p className="mt-1 text-xs text-[#666]">
                    <span className="font-medium text-black">{t("admin.orderDetail.customer")}:</span>{" "}
                    {proof.customerComment}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}

/* ========== Contour Data Section ========== */
function ContourDataSection({ proofData, toolJobs }) {
  const contourJobs = (toolJobs || []).filter((j) => j.toolType === "contour");

  if ((!proofData || proofData.length === 0) && contourJobs.length === 0) return null;

  function downloadContourSvg(pd) {
    if (!pd.contourSvg) return;
    // Load the processed (or original) image to get real dimensions
    const imgUrl = pd.processedImageUrl || pd.originalFileUrl;
    if (!imgUrl) {
      // Fallback: download raw contourSvg path as-is with a generic viewBox
      downloadRawSvgPath(pd.contourSvg, pd.bleedSvg, `contour-${pd.id.slice(0, 8)}.svg`);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const svg = buildContourSvg({
        cutPath: pd.contourSvg,
        bleedPath: pd.bleedSvg || "",
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
      triggerDownload(svg, `contour-${pd.id.slice(0, 8)}.svg`);
    };
    img.onerror = () => {
      // Image failed to load — fall back to raw path
      downloadRawSvgPath(pd.contourSvg, pd.bleedSvg, `contour-${pd.id.slice(0, 8)}.svg`);
    };
    img.src = imgUrl;
  }

  function downloadRawSvgPath(cutPath, bleedPath, filename) {
    let paths = `<path d="${cutPath}" fill="none" stroke="#ff0000" stroke-width="1.5"/>`;
    if (bleedPath) {
      paths = `<path d="${bleedPath}" fill="none" stroke="#ff000040" stroke-width="1" stroke-dasharray="4 2"/>\n  ${paths}`;
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg">\n  ${paths}\n</svg>`;
    triggerDownload(svg, filename);
  }

  function triggerDownload(svgContent, filename) {
    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Section title={`Contour / Proof Data (${(proofData || []).length})`}>
      <div className="space-y-3">
        {(proofData || []).map((pd) => (
          <div key={pd.id} className="rounded-[3px] border border-[#e0e0e0] p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-black">{pd.productSlug}</span>
              <span className="text-[10px] text-[#999]">{new Date(pd.createdAt).toLocaleString()}</span>
            </div>

            {/* Images row */}
            <div className="flex gap-2">
              {pd.originalFileUrl && (
                <a href={pd.originalFileUrl} target="_blank" rel="noopener noreferrer" className="block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pd.originalFileUrl} alt="Original" className="h-20 w-20 rounded border border-[#e0e0e0] object-cover" />
                  <span className="block text-[9px] text-[#999] mt-0.5">Original</span>
                </a>
              )}
              {pd.processedImageUrl && (
                <a href={pd.processedImageUrl} target="_blank" rel="noopener noreferrer" className="block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pd.processedImageUrl} alt="Processed" className="h-20 w-20 rounded border border-[#e0e0e0] object-cover bg-[#f0f0f0]" />
                  <span className="block text-[9px] text-[#999] mt-0.5">Processed</span>
                </a>
              )}
            </div>

            {/* Metadata chips */}
            <div className="flex flex-wrap gap-1.5 text-[10px]">
              {pd.bleedMm != null && (
                <span className="rounded bg-[#f5f5f5] px-2 py-0.5 text-[#666]">Bleed: {pd.bleedMm}mm</span>
              )}
              <span className={`rounded px-2 py-0.5 ${pd.bgRemoved ? "bg-blue-50 text-blue-700" : "bg-[#f5f5f5] text-[#666]"}`}>
                BG Removed: {pd.bgRemoved ? "Yes" : "No"}
              </span>
              <span className={`rounded px-2 py-0.5 ${pd.customerConfirmed ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
                {pd.customerConfirmed ? "Customer Confirmed" : "Not Confirmed"}
              </span>
            </div>

            {/* Download contour SVG — uses real image dimensions + buildContourSvg */}
            {pd.contourSvg && (
              <button
                type="button"
                onClick={() => downloadContourSvg(pd)}
                className="rounded-[3px] border border-[#d0d0d0] px-3 py-1 text-[10px] font-semibold text-black hover:bg-[#fafafa]"
              >
                Download Contour SVG
              </button>
            )}
          </div>
        ))}

        {/* Contour Tool Jobs */}
        {contourJobs.length > 0 && (
          <div className="border-t border-[#e0e0e0] pt-2 mt-2">
            <p className="text-[10px] font-semibold uppercase text-[#999] mb-1">Contour Jobs ({contourJobs.length})</p>
            {contourJobs.map((job) => (
              <div key={job.id} className="rounded-[3px] border border-[#f0f0f0] p-2 mb-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#666]">{job.id.slice(0, 8)}</span>
                  <span className={`rounded-[2px] px-2 py-0.5 text-[10px] font-semibold ${
                    job.status === "completed" ? "bg-green-100 text-green-700" :
                    job.status === "failed" ? "bg-red-100 text-red-700" :
                    "bg-[#f5f5f5] text-[#666]"
                  }`}>{job.status}</span>
                  <span className="text-[10px] text-[#999]">{new Date(job.createdAt).toLocaleString()}</span>
                </div>
                {job.operatorName && (
                  <p className="text-[10px] text-[#666]">Operator: <span className="font-medium text-black">{job.operatorName}</span></p>
                )}
                {job.notes && (
                  <p className="text-[10px] text-[#666]">{job.notes}</p>
                )}
                {job.outputFileUrl && (
                  <a href={job.outputFileUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-black underline hover:no-underline">
                    Download output file
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}

/* ========== Stamp Production Section ========== */
function StampProductionSection({ order }) {
  // Find stamp items — broad matching: name contains "stamp", or stamp-specific metadata present
  const stampItems = (order.items || []).filter((item) => {
    if (item.productName && item.productName.toLowerCase().includes("stamp")) return true;
    const meta = item.meta && typeof item.meta === "object" ? item.meta : {};
    const specs = item.specsJson && typeof item.specsJson === "object" ? item.specsJson : {};
    const merged = { ...specs, ...meta };
    return merged.stampModel || merged.stampText || merged.editorText ||
      merged.stampPreviewUrl || merged.stampLogoUrl;
  });

  // Find stamp-related tool jobs (stamp-studio or any toolType containing "stamp")
  const stampJobs = (order.toolJobs || []).filter((j) =>
    j.toolType === "stamp-studio" || (j.toolType && j.toolType.toLowerCase().includes("stamp"))
  );

  if (stampItems.length === 0 && stampJobs.length === 0) return null;

  return (
    <Section title={`Stamp Production (${stampItems.length} item${stampItems.length !== 1 ? "s" : ""})`}>
      <div className="space-y-3">
        {stampItems.map((item) => {
          const meta = {
            ...(item.specsJson && typeof item.specsJson === "object" ? item.specsJson : {}),
            ...(item.meta && typeof item.meta === "object" ? item.meta : {}),
          };
          return (
            <div key={item.id} className="rounded-[3px] border border-[#e0e0e0] p-3 space-y-2">
              <p className="text-xs font-semibold text-black">{item.productName}</p>

              {/* Preview image */}
              {meta.stampPreviewUrl && (
                <a href={meta.stampPreviewUrl} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={meta.stampPreviewUrl}
                    alt="Stamp preview"
                    className="h-28 w-28 rounded border border-[#e0e0e0] object-contain bg-white"
                  />
                </a>
              )}

              {/* Stamp text */}
              {(meta.stampText || meta.editorText) && (
                <div className="rounded bg-[#fafafa] px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase text-[#999] mb-1">Stamp Text</p>
                  <pre className="text-xs text-black whitespace-pre-wrap font-mono">{meta.stampText || meta.editorText}</pre>
                </div>
              )}

              {/* Metadata grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                {meta.stampModel && <MetaRow label="Model" value={meta.stampModelLabel || meta.stampModel} />}
                {meta.shape && <MetaRow label="Shape" value={meta.shape} />}
                {meta.stampFont && <MetaRow label="Font" value={meta.stampFont} />}
                {meta.stampColor && <MetaRow label="Ink Color" value={meta.stampColor} />}
                {meta.stampBorder && meta.stampBorder !== "none" && <MetaRow label="Border" value={meta.stampBorder} />}
                {meta.stampTemplate && <MetaRow label="Template" value={meta.stampTemplate} />}
                {meta.stampCurveAmount != null && <MetaRow label="Curve" value={`${meta.stampCurveAmount}%`} />}
                {meta.stampHalftoneEnabled && <MetaRow label="Halftone" value={meta.stampHalftoneIntensity || "enabled"} />}
                {meta.stampPreset && <MetaRow label="Preset" value={meta.stampPreset} />}
              </div>

              {/* Logo link */}
              {meta.stampLogoUrl && (
                <a href={meta.stampLogoUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-black underline hover:no-underline">
                  View uploaded logo
                </a>
              )}

              {/* Open Stamp Studio */}
              <Link
                href="/admin/tools/stamp-studio"
                className="inline-block rounded-[3px] border border-[#d0d0d0] px-3 py-1 text-[10px] font-semibold text-black hover:bg-[#fafafa]"
              >
                Open Stamp Studio
              </Link>
            </div>
          );
        })}

        {/* Tool Jobs */}
        {stampJobs.length > 0 && (
          <div className="border-t border-[#e0e0e0] pt-2 mt-2">
            <p className="text-[10px] font-semibold uppercase text-[#999] mb-1">Stamp Studio Jobs ({stampJobs.length})</p>
            {stampJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between py-1">
                <span className="text-[10px] text-[#666]">{job.id.slice(0, 8)}</span>
                <span className={`rounded-[2px] px-2 py-0.5 text-[10px] font-semibold ${
                  job.status === "completed" ? "bg-green-100 text-green-700" :
                  job.status === "failed" ? "bg-red-100 text-red-700" :
                  "bg-[#f5f5f5] text-[#666]"
                }`}>{job.status}</span>
                <span className="text-[10px] text-[#999]">{new Date(job.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}

/* ========== Customer Summary Section ========== */
const FAMILY_LABELS = {
  "sticker": "Sticker", "label": "Label", "stamp": "Stamp", "canvas": "Canvas",
  "banner": "Banner / Flag", "sign": "Sign / Display", "booklet": "Booklet",
  "ncr": "NCR Form", "business-card": "Business Card", "vehicle": "Vehicle Graphics",
  "standard-print": "Print", "other": "Custom",
};

/* ========== Shipment / Fulfillment Summary ========== */
function ShipmentSummarySection({ order }) {
  const { t } = useTranslation();
  const shipments = order.shipments || [];
  const fulfillment = getOrderFulfillment(shipments);
  const latestShipment = order.latestShipment || shipments[0] || fulfillment.latestShipment;
  const ps = order.productionStatus;
  const isReadyToShip = ps === "ready_to_ship";
  const isShipped = ["shipped", "completed"].includes(ps);
  const carrierLabels = {
    canada_post: t("admin.orderDetail.carrierCanadaPost"),
    purolator: t("admin.orderDetail.carrierPurolator"),
    ups: t("admin.orderDetail.carrierUps"),
    fedex: t("admin.orderDetail.carrierFedex"),
    pickup: t("admin.orderDetail.carrierPickup"),
    other: t("admin.orderDetail.carrierOther"),
  };
  const shipmentStatusLabels = {
    pending: t("admin.orderDetail.shipmentPending"),
    label_created: t("admin.orderDetail.shipmentLabelCreated"),
    picked_up: t("admin.orderDetail.shipmentPickedUp"),
    in_transit: t("admin.orderDetail.shipmentInTransit"),
    delivered: t("admin.orderDetail.shipmentDelivered"),
    returned: t("admin.orderDetail.shipmentReturned"),
    exception: t("admin.orderDetail.shipmentException"),
    unfulfilled: t("admin.orderDetail.noShipmentRecord"),
  };
  const shippingWorkspaceHref = `/admin/orders/shipping?search=${order.id}`;
  const primaryTrackingUrl = latestShipment?.trackingNumber
    ? getTrackingUrl(latestShipment.carrier, latestShipment.trackingNumber)
    : null;

  // Only show when there are shipments, or the order is ready/shipped
  if (shipments.length === 0 && !isReadyToShip && !isShipped) return null;

  return (
    <Section title={`${t("admin.orderDetail.fulfillment")}${order.shipmentSummary?.count ? ` (${order.shipmentSummary.count})` : ""}`}>
      <div className="space-y-3">
        {/* Fulfillment state badge */}
        <div className="flex items-center gap-2">
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${fulfillment.color}`}>
            {shipmentStatusLabels[fulfillment.state] || fulfillment.label}
          </span>
          {shipments.length > 0 && (
            <span className="text-[10px] text-[#999]">
              {t("admin.orderDetail.shipmentRecords").replace("{count}", String(shipments.length))}
            </span>
          )}
        </div>

        {/* Shipment rows */}
        {shipments.map((shipment) => (
          <div key={shipment.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[3px] border border-[#e8e8e8] bg-[#fafafa] px-3 py-2">
            <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold ${getShipmentStatusColor(shipment.status)}`}>
              {shipmentStatusLabels[shipment.status] || shipment.status}
            </span>
            <span className="text-[11px] font-medium text-[#444]">
              {carrierLabels[shipment.carrier] || shipment.carrier || "\u2014"}
            </span>
            {shipment.trackingNumber && (
              <>
                {getTrackingUrl(shipment.carrier, shipment.trackingNumber) ? (
                  <a
                    href={getTrackingUrl(shipment.carrier, shipment.trackingNumber)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-medium text-[#4f46e5] hover:underline"
                  >
                    {shipment.trackingNumber}
                  </a>
                ) : (
                  <span className="text-[11px] text-[#666]">{shipment.trackingNumber}</span>
                )}
              </>
            )}
            {shipment.shippedAt && (
              <span className="text-[10px] text-[#999]">
                {new Date(shipment.shippedAt).toLocaleDateString("en-CA")}
              </span>
            )}
          </div>
        ))}

        {/* No shipments yet — prompt action */}
        {shipments.length === 0 && (isReadyToShip || isShipped) && (
          <p className={`text-[11px] ${isShipped ? "text-amber-700" : "text-emerald-700"}`}>
            {isShipped
              ? t("admin.orderDetail.shipmentMissingAfterShip")
              : t("admin.orderDetail.shipmentReadyHint")}{" "}
            <a
              href="#actions-section"
              onClick={(e) => {
                e.preventDefault();
                document.querySelector("[data-section='actions']")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="font-medium text-[#4f46e5] hover:underline"
            >
              {t("admin.orderDetail.markAsShipped")}
            </a>
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Link
            href={shippingWorkspaceHref}
            className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:bg-[#fafafa]"
          >
            {t("admin.orderDetail.openShippingWorkspace")}
          </Link>
          {primaryTrackingUrl && (
            <a
              href={primaryTrackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-[3px] border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
            >
              {t("admin.orderDetail.openTracking")}
            </a>
          )}
          {isReadyToShip && (
            <Link
              href={buildOrderCenterHref("ready_to_ship")}
              className="rounded-[3px] border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
            >
              {t("admin.orderDetail.readyToShipQueue")}
            </Link>
          )}
        </div>

      </div>
    </Section>
  );
}

function CustomerSummarySection({ order }) {
  const items = order.items || [];
  if (items.length === 0) return null;

  return (
    <Section title="Order Summary (Plain Language)">
      <div className="space-y-3">
        {items.map((item) => {
          const meta = {
            ...(item.specsJson && typeof item.specsJson === "object" ? item.specsJson : {}),
            ...(item.meta && typeof item.meta === "object" ? item.meta : {}),
          };
          const family = detectProductFamily(item);
          const specs = buildSpecsSummary(item);

          // Handle business card front/back artwork (flattened keys or legacy object format)
          const rawArtUrl = meta.artworkUrl || meta.fileUrl || meta.stampPreviewUrl || item.fileUrl || null;
          const hasFrontBack = (meta.frontArtworkUrl || meta.backArtworkUrl)
            || (rawArtUrl && typeof rawArtUrl === "object" && (rawArtUrl.front || rawArtUrl.back));
          const frontUrl = meta.frontArtworkUrl || (rawArtUrl && typeof rawArtUrl === "object" ? rawArtUrl.front : null);
          const backUrl = meta.backArtworkUrl || (rawArtUrl && typeof rawArtUrl === "object" ? rawArtUrl.back : null);
          const artworkUrl = hasFrontBack ? null : rawArtUrl;
          const hasFileNameOnly = !!(meta.fileName && !artworkUrl && !hasFrontBack);

          return (
            <div key={item.id} className="rounded-[3px] bg-[#fafafa] px-3 py-2.5">
              {/* Header: product name + family badge + copy */}
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-black">
                  {item.quantity}× {item.productName}
                </p>
                <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[9px] font-medium text-gray-600">
                  {FAMILY_LABELS[family] || family}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const text = `${item.quantity}× ${item.productName}\n${specs.filter(s => s.label !== "Qty").map(s => `${s.label}: ${s.value}`).join("\n")}`;
                    navigator.clipboard.writeText(text).catch(() => {});
                  }}
                  className="ml-auto rounded px-1.5 py-0.5 text-[9px] font-medium text-[#999] hover:bg-gray-200 hover:text-black"
                  title="Copy specs to clipboard"
                >
                  Copy
                </button>
              </div>

              {/* Specs grid — from buildSpecsSummary */}
              {specs.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-[#666]">
                  {specs.filter(s => s.label !== "Qty").map((s, i) => (
                    <span key={i}><span className="text-[#999]">{s.label}:</span> <span className="font-medium text-black">{s.value}</span></span>
                  ))}
                </div>
              )}

              {/* File status row */}
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-[#666]">
                <span>
                  Artwork: {hasFrontBack
                    ? <>
                        {frontUrl && <a href={frontUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-green-700 underline hover:text-green-900 mr-1">Front</a>}
                        {backUrl && <a href={backUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-green-700 underline hover:text-green-900">Back</a>}
                        {!frontUrl && !backUrl && <span className="font-semibold text-red-600">Not uploaded</span>}
                      </>
                    : artworkUrl
                    ? <a href={artworkUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-green-700 underline hover:text-green-900">View file</a>
                    : hasFileNameOnly
                      ? <span className="font-semibold text-amber-600">{typeof meta.fileName === "object" ? "Files pending" : meta.fileName} — URL missing</span>
                      : <span className="font-semibold text-red-600">Not uploaded</span>}
                </span>
                {/* Design help / artwork intent */}
                {(meta.designHelp === true || meta.designHelp === "true" || meta.artworkIntent === "design-help") && (
                  <span>Design Help: <span className="font-semibold text-indigo-700">$45 — prepare artwork</span></span>
                )}
                {meta.artworkIntent === "upload-later" && !meta.designHelp && meta.artworkIntent !== "design-help" && (
                  <span>Artwork Intent: <span className="font-semibold text-amber-600">Will upload later</span></span>
                )}
                {/* Show proof status only for families that use proofs */}
                {(family === "sticker" || family === "label" || meta.proofConfirmed !== undefined) && (
                  <span>
                    Proof: {meta.proofConfirmed === true || meta.customerConfirmed === true
                      ? <span className="font-semibold text-green-700">Confirmed</span>
                      : <span className="font-semibold text-yellow-700">Not confirmed</span>}
                  </span>
                )}
                {/* White ink — only for families that support it */}
                {(family === "sticker" || family === "label") && (
                  <span>
                    White Ink: {meta.whiteInkEnabled || (meta.whiteInkMode && meta.whiteInkMode !== "none")
                      ? <span className="font-semibold text-black">
                          {meta.whiteInkMode === "auto" ? "Automatic" : meta.whiteInkMode === "follow" ? "Match Design" : meta.whiteInkMode === "custom" ? "Custom Upload" : "Yes"}
                          {meta.whiteInkUrl ? "" : " ⚠ file pending"}
                        </span>
                      : <span className="text-[#999]">No</span>}
                  </span>
                )}
                {/* Double-sided indicator for print family */}
                {(meta.sides === "double" || meta.sides === "2" || meta.doubleSided) && !hasFrontBack && (
                  <span>
                    Back File: {meta.backArtworkUrl
                      ? <span className="font-semibold text-green-700">Uploaded</span>
                      : <span className="font-semibold text-amber-600">Not separate — check PDF</span>}
                  </span>
                )}
                {/* Finishing status */}
                {(item.finishing || meta.finishing) && (item.finishing || meta.finishing) !== "none" && (
                  <span>Finishing: <span className="font-semibold text-black">{item.finishing || meta.finishing}</span></span>
                )}
                {/* Coating */}
                {meta.coating && meta.coating !== "none" && (
                  <span>Coating: <span className="font-semibold text-black">{meta.coating}</span></span>
                )}
                {/* Lamination */}
                {meta.lamination && (
                  <span>Lamination: <span className="font-semibold text-black">{meta.lamination}</span></span>
                )}
                {/* Turnaround */}
                {meta.turnaround && meta.turnaround !== "standard" && (
                  <span>Turnaround: <span className={`font-semibold ${meta.turnaround === "rush" || meta.turnaround === "express" || meta.turnaround === "same-day" ? "text-red-600" : "text-black"}`}>{meta.turnaround}</span></span>
                )}
                {/* Fold for brochures etc. */}
                {meta.fold && meta.fold !== "none" && (
                  <span>Fold: <span className="font-semibold text-black">{meta.fold}</span></span>
                )}
                {/* Numbering */}
                {meta.numbering && (
                  <span>Numbering: <span className="font-semibold text-black">{meta.numberStart ? `#${meta.numberStart}–${meta.numberEnd || "..."}` : "Yes (start # TBD)"}</span></span>
                )}
                {/* Vehicle specifics */}
                {meta.vehicleBody && (
                  <span>Vehicle: <span className="font-semibold text-black">{meta.vehicleBody}</span></span>
                )}
                {meta.vehicleType && (
                  <span>Type: <span className="font-semibold text-black">{meta.vehicleType}</span></span>
                )}
                {/* Contour status — quality-aware */}
                {(meta.contourAppliedAt || meta.contourToolJobAt) && (() => {
                  const appliedDate = meta.contourAppliedAt || meta.contourToolJobAt;
                  const conf = meta.contourConfidence;
                  const needsReview = conf === "low" || conf === "rectangular" ||
                    meta.contourShapeType === "rectangular" || meta.contourShapeType === "near-rectangular";
                  return (
                    <span>Contour: <span className={`font-semibold ${needsReview ? "text-amber-600" : "text-green-700"}`}>
                      {needsReview ? "Needs Review" : "Ready"} {new Date(appliedDate).toLocaleDateString()}
                    </span></span>
                  );
                })()}
              </div>

              {/* Size rows if present */}
              {parseSizeRows(item).length > 0 && (
                <div className="mt-1 text-[10px] text-[#999]">
                  {parseSizeRows(item).map((row, idx) => (
                    <span key={idx} className="mr-2">
                      Size #{idx + 1}: {row.width}&quot; × {row.height}&quot; × {row.quantity} pcs
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Total paid */}
        <div className="flex items-center justify-between border-t border-[#e0e0e0] pt-2">
          <span className="text-xs font-medium text-[#666]">Total Paid</span>
          <span className="text-sm font-semibold text-black">{formatCad(order.totalAmount)} CAD</span>
        </div>
      </div>
    </Section>
  );
}

/* ========== Production Readiness Section ========== */
function ProductionReadinessSection({ order }) {
  const { t } = useTranslation();
  const items = order.items || [];
  if (items.length === 0) return null;

  const assessment = assessOrder(order);
  const colors = READINESS_COLORS[assessment.level] || READINESS_COLORS.ready;
  const overallLabel = t(READINESS_LABEL_KEYS[assessment.level] || "admin.readiness.ready");

  return (
    <Section title={t("admin.production.readinessTitle")}>
      <div className="space-y-3">
        {/* Overall indicator */}
        <div className={`flex items-center gap-2 rounded-[3px] px-3 py-2 ${colors.bg} ${colors.text}`}>
          <span className={`inline-block h-2.5 w-2.5 rounded-full ${colors.dot}`} />
          <span className="text-xs font-semibold">{overallLabel}</span>
          {(assessment.blockerCount > 0 || assessment.warningCount > 0) && (
            <span className="text-[10px] opacity-80 ml-1">
              ({assessment.blockerCount > 0 ? `${assessment.blockerCount} blocked` : ""}{assessment.blockerCount > 0 && assessment.warningCount > 0 ? ", " : ""}{assessment.warningCount > 0 ? `${assessment.warningCount} warning${assessment.warningCount > 1 ? "s" : ""}` : ""} / {assessment.readyCount} ready)
            </span>
          )}
        </div>

        {/* Per-item readiness — delegates to ItemProductionPanel */}
        {items.map((item) => (
          <div key={item.id} className="rounded-[3px] border border-[#e0e0e0] px-3 py-2">
            <ItemProductionPanel item={item} orderId={order.id} />
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ========== Production Files Section ========== */
/* ========== Package Completeness Section ========== */
function PackageCompletenessSection({ order }) {
  const { t } = useTranslation();
  const pkg = assessOrderPackage(order);
  if (pkg.items.length === 0) return null;

  const statusColors = {
    complete: { bg: "bg-green-50", border: "border-green-300", text: "text-green-800", dot: "bg-green-500" },
    partial: { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-800", dot: "bg-amber-400" },
    blocked: { bg: "bg-red-50", border: "border-red-300", text: "text-red-800", dot: "bg-red-500" },
  };

  const statusLabelKeys = {
    complete: "admin.package.complete",
    partial: "admin.package.partial",
    blocked: "admin.package.blocked",
  };

  const colors = statusColor(pkg.status);

  return (
    <Section title={t("admin.package.title")}>
      {/* Overall status */}
      <div className={`flex items-center gap-2 rounded-[3px] px-3 py-2 ${colors.bg} ${colors.border} border`}>
        <span className={`inline-block h-2.5 w-2.5 rounded-full ${colors.dot}`} />
        <span className={`text-xs font-semibold ${colors.text}`}>{t(statusLabelKeys[pkg.status])}</span>
        <span className="text-[10px] text-[#666] ml-auto">
          {pkg.complete} {t("admin.package.complete")} / {pkg.partial} {t("admin.package.partial")} / {pkg.blocked} {t("admin.package.blocked")}
        </span>
      </div>

      {/* Per-item file checklist */}
      <div className="mt-3 space-y-2">
        {pkg.items.map((item) => {
          const itemColors = statusColor(item.status);
          return (
            <div key={item.itemId} className="rounded-[3px] border border-[#e0e0e0] px-3 py-2">
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-block h-2 w-2 rounded-full ${itemColors.dot}`} />
                <span className="text-[10px] font-semibold text-black">{item.itemName}</span>
                <span className="rounded bg-gray-100 px-1 py-0.5 text-[8px] font-medium text-gray-500">
                  {FAMILY_LABELS[item.family] || item.family}
                </span>
                <span className={`ml-auto text-[9px] font-medium ${itemColors.text}`}>
                  {item.missingCount === 0 ? t("admin.package.allPresent") : t("admin.package.missing").replace("{count}", item.missingCount)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                {item.files.map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className={`inline-block h-1.5 w-1.5 rounded-full ${f.present ? "bg-green-500" : "bg-red-400"}`} />
                    <span className={f.present ? "text-[#666]" : "font-medium text-red-600"}>{f.label}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function ProductionFilesSection({ order }) {
  const items = order.items || [];
  const proofData = order.proofData || [];

  // Collect all downloadable production files
  const files = [];

  for (const item of items) {
    const meta = { ...(item.specsJson || {}), ...(item.meta || {}) };
    const label = item.productName || "Item";
    const family = detectProductFamily(item);
    const isTwoSided = meta.sides === "double" || meta.sides === "2" || meta.sides === 2 || meta.doubleSided === true;

    // Color artwork — with double-sided note if applicable
    if (item.fileUrl) {
      const artLabel = isTwoSided
        ? `${label} — Artwork (double-sided — check for front+back pages)`
        : `${label} — Color Artwork`;
      files.push({ label: artLabel, url: item.fileUrl, type: "color" });
    }

    // Fallback: artworkUrl in meta if not in item.fileUrl
    // Business cards: check both flat keys (frontArtworkUrl/backArtworkUrl) and legacy objects
    if (!item.fileUrl) {
      if (meta.frontArtworkUrl || meta.backArtworkUrl) {
        if (meta.frontArtworkUrl) files.push({ label: `${label} — Front Artwork`, url: meta.frontArtworkUrl, type: "color" });
        if (meta.backArtworkUrl) files.push({ label: `${label} — Back Artwork`, url: meta.backArtworkUrl, type: "color" });
      } else if (meta.artworkUrl) {
        if (typeof meta.artworkUrl === "object" && meta.artworkUrl !== null) {
          if (meta.artworkUrl.front) files.push({ label: `${label} — Front Artwork`, url: meta.artworkUrl.front, type: "color" });
          if (meta.artworkUrl.back) files.push({ label: `${label} — Back Artwork`, url: meta.artworkUrl.back, type: "color" });
        } else {
          files.push({ label: `${label} — Artwork`, url: meta.artworkUrl, type: "color" });
        }
      }
    }

    // Processed image (bg removed)
    if (meta.processedImageUrl) {
      files.push({ label: `${label} — Processed (BG Removed)`, url: meta.processedImageUrl, type: "processed" });
    }

    // White ink layer (server-persisted file if available)
    if (meta.whiteInkEnabled) {
      const modeLabel = meta.whiteInkMode === "auto" ? "Automatic" : meta.whiteInkMode === "follow" ? "Match Design" : "Custom Upload";
      files.push({
        label: `${label} — White Ink Layer (${modeLabel})`,
        url: meta.whiteInkUrl || null,
        type: "white-ink",
      });
    }

    // Stamp preview
    if (meta.stampPreviewUrl) {
      files.push({ label: `${label} — Stamp Preview`, url: meta.stampPreviewUrl, type: "preview" });
    }

    // Stamp logo
    if (meta.stampLogoUrl) {
      files.push({ label: `${label} — Stamp Logo`, url: meta.stampLogoUrl, type: "logo" });
    }

    // Contour SVG from contour tool (applied to item meta)
    if (meta.contourSvg) {
      files.push({ label: `${label} — Contour SVG (Die-Cut Path)`, url: meta.contourSvg, type: "contour" });
    }
    if (meta.contourSvgKey && !meta.contourSvg) {
      files.push({ label: `${label} — Contour SVG Key: ${meta.contourSvgKey}`, url: null, type: "info" });
    }

    // Canvas: crop data note (not a downloadable file, but production needs to know)
    if (family === "canvas" && (meta.cropData || meta.cropX)) {
      files.push({
        label: `${label} — Crop Data (saved in order)`,
        url: null,
        type: "info",
      });
    }

    // Template data for letterhead etc.
    if (meta.templateData) {
      files.push({
        label: `${label} — Template Builder Data (saved in order)`,
        url: null,
        type: "info",
      });
    }

    // Vehicle: if there's a quote/reference image
    if (meta.quoteImageUrl) {
      files.push({ label: `${label} — Quote Reference Image`, url: meta.quoteImageUrl, type: "original" });
    }
  }

  // Proof data files
  for (const pd of proofData) {
    if (pd.originalFileUrl) {
      files.push({ label: `Proof ${pd.productSlug} — Original`, url: pd.originalFileUrl, type: "original" });
    }
    if (pd.processedImageUrl) {
      files.push({ label: `Proof ${pd.productSlug} — Processed`, url: pd.processedImageUrl, type: "processed" });
    }
  }

  // Order-level files
  for (const f of (order.files || [])) {
    files.push({ label: f.fileName || "File", url: f.fileUrl, type: "file" });
  }

  if (files.length === 0) return null;

  const downloadableFiles = files.filter((f) => f.url);

  return (
    <Section title={`Production Files (${downloadableFiles.length})`}>
      <div className="space-y-1.5">
        {files.map((f, i) => (
          <div key={i} className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              <span className={`inline-block h-2 w-2 rounded-full ${
                f.type === "color" ? "bg-blue-400" :
                f.type === "processed" ? "bg-purple-400" :
                f.type === "white-ink" ? "bg-yellow-400" :
                f.type === "preview" ? "bg-green-400" :
                f.type === "logo" ? "bg-pink-400" :
                f.type === "original" ? "bg-indigo-400" :
                f.type === "contour" ? "bg-red-400" :
                "bg-gray-300"
              }`} />
              <span className="text-[10px] text-black">{f.label}</span>
            </div>
            {f.url ? (
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="rounded-[3px] border border-[#d0d0d0] px-2 py-0.5 text-[10px] font-semibold text-black hover:bg-[#fafafa]"
              >
                Download
              </a>
            ) : (
              <span className="text-[10px] text-[#999]">Info only</span>
            )}
          </div>
        ))}
      </div>

      {/* One-click download all */}
      {downloadableFiles.length > 1 && (
        <button
          type="button"
          onClick={() => {
            // Download all files in sequence (browser manages multiple downloads)
            for (const f of downloadableFiles) {
              const a = document.createElement("a");
              a.href = f.url;
              a.target = "_blank";
              a.rel = "noopener noreferrer";
              a.download = "";
              a.click();
            }
          }}
          className="mt-3 w-full rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-[10px] font-semibold text-black hover:bg-[#fafafa]"
        >
          Open All Files ({downloadableFiles.length})
        </button>
      )}
    </Section>
  );
}

/* ========== Preflight Section ========== */
function PreflightSection({ order }) {
  const items = order.items || [];
  if (items.length === 0) return null;

  const results = preflightOrder(items);
  if (results.length === 0) {
    return (
      <Section title="Preflight">
        <p className="text-[10px] text-green-700 bg-green-50 rounded px-2 py-1">All items passed preflight checks</p>
      </Section>
    );
  }

  const levelColors = {
    error: "bg-red-100 text-red-700",
    warning: "bg-yellow-50 text-yellow-700",
    info: "bg-blue-50 text-blue-700",
  };

  const allIssues = results.flatMap((r) => r.issues);
  const errorCount = allIssues.filter((i) => i.level === "error").length;
  const warningCount = allIssues.filter((i) => i.level === "warning").length;
  const infoCount = allIssues.filter((i) => i.level === "info").length;
  const severitySummary = [
    errorCount > 0 && `${errorCount} blocker${errorCount !== 1 ? "s" : ""}`,
    warningCount > 0 && `${warningCount} warning${warningCount !== 1 ? "s" : ""}`,
    infoCount > 0 && `${infoCount} info`,
  ].filter(Boolean).join(", ");

  return (
    <Section title={`Preflight (${severitySummary})`}>
      <div className="space-y-2">
        {results.map((r, i) => (
          <div key={i} className="space-y-1">
            <p className="text-[10px] font-semibold text-black">{r.productName}</p>
            {r.issues.map((issue, j) => (
              <div key={j} className={`rounded px-2 py-1 text-[10px] ${levelColors[issue.level] || "bg-[#f5f5f5] text-[#666]"}`}>
                <span className="font-semibold uppercase">{issue.level}</span>: {issue.message}
              </div>
            ))}
          </div>
        ))}
      </div>
    </Section>
  );
}

function MetaRow({ label, value }) {
  return (
    <>
      <span className="text-[#999]">{label}</span>
      <span className="text-black font-medium">{value}</span>
    </>
  );
}

/* ========== Order Actions (Ship / Refund) ========== */
function OrderActions({ order, onUpdate }) {
  const { t } = useTranslation();
  const [shipOpen, setShipOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [acting, setActing] = useState(false);
  const [actionMsg, setActionMsg] = useState("");

  // Ship state
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("canada_post");
  const [estimatedDelivery, setEstimatedDelivery] = useState("");

  // Refund state
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");

  const canShip = ["paid"].includes(order.paymentStatus) &&
    ["in_production", "ready_to_ship", "preflight"].includes(order.productionStatus);
  const canRefund = ["paid", "partially_refunded"].includes(order.paymentStatus) &&
    order.stripePaymentIntentId;
  const maxRefund = (order.totalAmount - (order.refundAmount || 0)) / 100;

  async function handleShip() {
    setActing(true);
    setActionMsg("");
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/ship`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingNumber,
          carrier,
          estimatedDelivery: estimatedDelivery || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMsg(t("admin.orderDetail.shippedSuccess"));
        setShipOpen(false);
        onUpdate();
      } else {
        setActionMsg(data.error || t("admin.orderDetail.shipFailed"));
      }
    } catch {
      setActionMsg(t("admin.orderDetail.shipFailed"));
    } finally {
      setActing(false);
    }
  }

  async function handleRefund() {
    setActing(true);
    setActionMsg("");
    const amountCents = Math.round(parseFloat(refundAmount) * 100);
    if (!amountCents || amountCents <= 0) {
      setActionMsg(t("admin.orderDetail.enterValidAmount"));
      setActing(false);
      return;
    }
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountCents,
          reason: refundReason || t("admin.orderDetail.refundByAdmin"),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMsg(t("admin.orderDetail.refundIssued"));
        setRefundOpen(false);
        onUpdate();
      } else {
        setActionMsg(data.error || t("admin.orderDetail.refundFailed"));
      }
    } catch {
      setActionMsg(t("admin.orderDetail.refundFailed"));
    } finally {
      setActing(false);
    }
  }

  return (
    <Section title={t("admin.orderDetail.actions")}>
      <div className="space-y-3">
        {actionMsg && (
          <p className={`text-xs font-medium ${actionMsg.includes("fail") ? "text-red-600" : "text-green-600"}`}>
            {actionMsg}
          </p>
        )}

        {/* Ship button */}
        {canShip && !shipOpen && (
          <button
            type="button"
            onClick={() => setShipOpen(true)}
            className="w-full rounded-lg bg-purple-600 py-2.5 text-xs font-semibold text-[#fff] hover:bg-purple-700"
          >
            {t("admin.orderDetail.markAsShipped")}
          </button>
        )}
        {shipOpen && (
          <div className="space-y-2 rounded-lg border border-purple-200 bg-purple-50 p-3">
            <p className="text-xs font-semibold text-purple-900">{t("admin.orderDetail.shipOrder")}</p>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder={t("admin.orderDetail.trackingNumber")}
              className="w-full rounded border border-gray-300 px-2.5 py-1.5 text-xs outline-none"
            />
            <select
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              className="w-full rounded border border-gray-300 px-2.5 py-1.5 text-xs outline-none"
            >
              <option value="canada_post">{t("admin.orderDetail.carrierCanadaPost")}</option>
              <option value="ups">{t("admin.orderDetail.carrierUps")}</option>
              <option value="purolator">{t("admin.orderDetail.carrierPurolator")}</option>
              <option value="fedex">{t("admin.orderDetail.carrierFedex")}</option>
              <option value="pickup">{t("admin.orderDetail.carrierPickup")}</option>
              <option value="other">{t("admin.orderDetail.carrierOther")}</option>
            </select>
            <input
              type="date"
              value={estimatedDelivery}
              onChange={(e) => setEstimatedDelivery(e.target.value)}
              className="w-full rounded border border-gray-300 px-2.5 py-1.5 text-xs outline-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleShip}
                disabled={acting || !trackingNumber}
                className="flex-1 rounded bg-purple-600 py-1.5 text-xs font-semibold text-[#fff] hover:bg-purple-700 disabled:bg-gray-400"
              >
                {acting ? "..." : t("admin.orderDetail.confirmShip")}
              </button>
              <button
                type="button"
                onClick={() => setShipOpen(false)}
                className="rounded border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
              >
                {t("admin.common.cancel")}
              </button>
            </div>
          </div>
        )}

        {/* Refund button */}
        {canRefund && !refundOpen && (
          <button
            type="button"
            onClick={() => { setRefundOpen(true); setRefundAmount(maxRefund.toFixed(2)); }}
            className="w-full rounded-lg border border-red-300 py-2.5 text-xs font-semibold text-red-700 hover:bg-red-50"
          >
            {t("admin.orderDetail.issueRefund")}
          </button>
        )}
        {refundOpen && (
          <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-xs font-semibold text-red-900">{t("admin.orderDetail.issueRefund")}</p>
            <p className="text-[10px] text-red-600">{t("admin.orderDetail.maxRefund")}: ${maxRefund.toFixed(2)} CAD</p>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-600">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={maxRefund}
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                className="flex-1 rounded border border-gray-300 px-2.5 py-1.5 text-xs outline-none"
              />
            </div>
            <input
              type="text"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder={t("admin.orderDetail.reasonOptional")}
              className="w-full rounded border border-gray-300 px-2.5 py-1.5 text-xs outline-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleRefund}
                disabled={acting}
                className="flex-1 rounded bg-red-600 py-1.5 text-xs font-semibold text-[#fff] hover:bg-red-700 disabled:bg-gray-400"
              >
                {acting ? "..." : t("admin.orderDetail.confirmRefund")}
              </button>
              <button
                type="button"
                onClick={() => setRefundOpen(false)}
                className="rounded border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
              >
                {t("admin.common.cancel")}
              </button>
            </div>
          </div>
        )}

        {!canShip && !canRefund && (
          <p className="text-xs text-gray-600 text-center py-2">{t("admin.orderDetail.noActions")}</p>
        )}

        {/* Duplicate order */}
        <button
          type="button"
          onClick={async () => {
            if (!confirm("Create a new draft order with the same items?")) return;
            setActing(true);
            setActionMsg("");
            try {
              const res = await fetch(`/api/admin/orders/${order.id}/duplicate`, { method: "POST" });
              const data = await res.json();
              if (res.ok) {
                setActionMsg(`Draft created: #${data.id.slice(0, 8)}`);
                window.open(`/admin/orders/${data.id}`, "_blank");
              } else {
                setActionMsg(data.error || "Failed to duplicate");
              }
            } catch {
              setActionMsg("Failed to duplicate order");
            } finally {
              setActing(false);
            }
          }}
          disabled={acting}
          className="w-full rounded-lg border border-gray-300 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Duplicate as Draft
        </button>

        {/* Production Manifest download */}
        <button
          type="button"
          onClick={() => {
            window.open(`/api/admin/orders/${order.id}/manifest?format=text`, "_blank");
          }}
          className="w-full rounded-lg border border-gray-300 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          Download Production Manifest
        </button>

        {/* Packing Slip */}
        <button
          type="button"
          onClick={() => {
            window.open(`/api/admin/orders/${order.id}/packing-slip`, "_blank");
          }}
          className="w-full rounded-lg border border-gray-300 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          Print Packing Slip
        </button>
      </div>
    </Section>
  );
}

/* Dead code removed: NextActionBanner, getBlockingIssues, UnifiedReadinessBanner, ProductionIssuesCard
   All replaced by OrderReadinessSummary + ItemProductionPanel using assessOrder()/assessItem() as single source of truth. */
