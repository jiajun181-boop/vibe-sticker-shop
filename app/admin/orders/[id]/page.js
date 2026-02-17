"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
    cents / 100
  );

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

const statusColors = {
  draft: "bg-[#f5f5f5] text-black",
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
  not_started: "bg-[#f5f5f5] text-[#666]",
  preflight: "bg-blue-100 text-blue-700",
  in_production: "bg-indigo-100 text-indigo-700",
  ready_to_ship: "bg-cyan-100 text-cyan-700",
  shipped: "bg-purple-100 text-purple-700",
  completed: "bg-green-100 text-green-700",
  on_hold: "bg-yellow-100 text-yellow-800",
  canceled: "bg-red-100 text-red-700",
};

const priorityLabels = ["Normal", "High", "Urgent"];
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

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(true);
  const [addingNote, setAddingNote] = useState(false);
  const [message, setMessage] = useState("");
  const [timeline, setTimeline] = useState([]);

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

  useEffect(() => {
    fetch(`/api/admin/orders/${id}`)
      .then((r) => r.json())
      .then((data) => {
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
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    fetchTimeline();
  }, [id, fetchTimeline]);

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
        setMessage("Status updated");
        fetchTimeline();
        setTimeout(() => setMessage(""), 3000);
      }
    } catch {
      setMessage("Update failed");
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
      }
    } catch {
      console.error("Failed to add note");
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
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
        fetchTimeline();
      }
    } catch {
      console.error("Failed to update field");
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
        Loading...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <p className="text-sm text-[#999]">Order not found</p>
        <Link href="/admin/orders" className="text-sm text-black underline hover:no-underline">
          Back to Orders
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
            <div className="mb-1 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => router.push("/admin/orders")}
                className="text-xs text-[#999] hover:text-black"
              >
                &larr; Back to Orders
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-[3px] border border-[#d0d0d0] px-3 py-1 text-xs font-medium text-black hover:bg-[#fafafa]"
              >
                Print Invoice
              </button>
            </div>
            <h1 className="text-xl font-semibold text-black">
              Order Details
            </h1>
            <p className="mt-0.5 font-mono text-xs text-[#999]">{order.id}</p>
          </div>
          <span
            className={`rounded-[2px] px-3 py-1 text-xs font-semibold ${
              statusColors[order.status] || "bg-[#f5f5f5]"
            }`}
          >
            {order.status}
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column - main info */}
          <div className="space-y-6 lg:col-span-2">
            {/* Customer info */}
            <Section title="Customer">
              <div className="grid gap-3 sm:grid-cols-3">
                <InfoField label="Email" value={order.customerEmail} />
                <InfoField label="Name" value={order.customerName || "\u2014"} />
                <InfoField label="Phone" value={order.customerPhone || "\u2014"} />
              </div>
            </Section>

            {/* Order items */}
            <Section title={`Items (${order.items?.length || 0})`}>
              {order.items && order.items.length > 0 ? (
                <div className="divide-y divide-[#e0e0e0]">
                  {order.items.map((item) => (
                    <div key={item.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-black">
                            {item.productName}
                          </p>
                          <p className="text-xs text-[#999]">
                            {item.productType} &middot; Qty: {item.quantity}
                          </p>
                          {/* Specs */}
                          <div className="mt-1 flex flex-wrap gap-2 text-xs text-[#999]">
                            {item.widthIn && item.heightIn && (
                              <span>
                                {item.widthIn}&quot; x {item.heightIn}&quot;
                              </span>
                            )}
                            {item.material && <span>{item.material}</span>}
                            {item.finishing && <span>{item.finishing}</span>}
                          </div>
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
                        <div className="text-right">
                          <p className="text-sm font-semibold text-black">
                            {formatCad(item.totalPrice)}
                          </p>
                          <p className="text-xs text-[#999]">
                            {formatCad(item.unitPrice)} each
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#999]">No items</p>
              )}
            </Section>

            {/* Amount breakdown */}
            <Section title="Amount">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#666]">Subtotal</span>
                  <span className="font-medium text-black">
                    {formatCad(order.subtotalAmount)}
                  </span>
                </div>
                {order.coupon && (
                  <div className="flex justify-between">
                    <span className="text-[#666]">
                      Coupon ({order.coupon.code})
                    </span>
                    <span className="font-medium text-green-700">
                      -{formatCad(order.coupon.discountAmount || 0)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#666]">Tax (13% HST)</span>
                  <span className="font-medium text-black">
                    {formatCad(order.taxAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666]">Shipping</span>
                  <span className="font-medium text-black">
                    {order.shippingAmount === 0
                      ? "FREE"
                      : formatCad(order.shippingAmount)}
                  </span>
                </div>
                {order.refundAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-red-600">Refund</span>
                    <span className="font-medium text-red-600">
                      -{formatCad(order.refundAmount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t border-[#e0e0e0] pt-2 text-base font-semibold">
                  <span>Total</span>
                  <span>{formatCad(order.totalAmount)} CAD</span>
                </div>
              </div>
            </Section>

            {/* Notes */}
            <Section title="Notes">
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add a note..."
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
                    Internal
                  </label>
                  <button
                    type="button"
                    onClick={handleAddNote}
                    disabled={addingNote || !noteText.trim()}
                    className="rounded-[3px] bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-[#222] disabled:bg-[#999]"
                  >
                    {addingNote ? "..." : "Add"}
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
                              Internal
                            </span>
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#999]">No notes yet</p>
                )}
              </div>
            </Section>

            {/* Order Timeline */}
            <Section title="Timeline">
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
                            {event.action.replace(/_/g, " ")}
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
                <p className="text-xs text-[#999]">No timeline events</p>
              )}
            </Section>
          </div>

          {/* Right column - status & meta */}
          <div className="space-y-6">
            {/* Status update */}
            <Section title="Update Status">
              <div className="space-y-3">
                <SelectField
                  label="Order Status"
                  hint="Order lifecycle: draft \u2192 pending \u2192 paid \u2192 canceled / refunded"
                  value={status}
                  onChange={setStatus}
                  options={statusOptions}
                />
                <SelectField
                  label="Payment Status"
                  hint="Payment state only \u2014 changes automatically when Stripe confirms"
                  value={paymentStatus}
                  onChange={setPaymentStatus}
                  options={paymentOptions}
                />
                <SelectField
                  label="Production Status"
                  hint="Fulfillment progress: preflight \u2192 in production \u2192 ready to ship \u2192 shipped"
                  value={productionStatus}
                  onChange={setProductionStatus}
                  options={productionOptions}
                />

                {message && (
                  <p className="text-xs font-medium text-green-600">{message}</p>
                )}

                <button
                  type="button"
                  onClick={handleStatusUpdate}
                  disabled={saving}
                  className="w-full rounded-[3px] bg-black py-2.5 text-xs font-semibold text-white hover:bg-[#222] disabled:bg-[#999]"
                >
                  {saving ? "Saving..." : "Update Status"}
                </button>
              </div>
            </Section>

            {/* Tags, Priority, Archive */}
            <Section title="Tags & Priority">
              <div className="space-y-4">
                {/* Tags */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#666]">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    onBlur={handleTagsBlur}
                    placeholder="e.g. rush, wholesale, VIP"
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
                    Priority
                  </label>
                  <div className="flex gap-2">
                    {priorityLabels.map((label, idx) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => handlePriorityChange(idx)}
                        className={`flex-1 rounded-[3px] border px-2 py-1.5 text-xs font-semibold transition-colors ${
                          priority === idx
                            ? priorityColors[idx]
                            : "border-[#e0e0e0] bg-white text-[#999] hover:bg-[#fafafa]"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1 text-[10px] text-[#999]">Normal = standard queue &middot; High = prioritize today &middot; Urgent = drop everything</p>
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
                    {isArchived ? "Archived - Click to Unarchive" : "Archive Order"}
                  </button>
                </div>

                {/* Estimated Completion */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#666]">
                    Estimated Completion
                  </label>
                  <input
                    type="date"
                    value={estimatedCompletion}
                    onChange={handleEstimatedCompletionChange}
                    className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                  />
                  <p className="mt-1 text-[10px] text-[#999]">When the customer should expect their order ready</p>
                </div>
              </div>
            </Section>

            {/* Metadata */}
            <Section title="Details">
              <div className="space-y-2 text-xs">
                <InfoField label="Currency" value={order.currency?.toUpperCase()} />
                <InfoField
                  label="Stripe Session"
                  value={order.stripeSessionId ? order.stripeSessionId.slice(0, 20) + "..." : "\u2014"}
                />
                <InfoField
                  label="Payment Intent"
                  value={
                    order.stripePaymentIntentId
                      ? order.stripePaymentIntentId.slice(0, 20) + "..."
                      : "\u2014"
                  }
                />
                <InfoField
                  label="Paid At"
                  value={
                    order.paidAt
                      ? new Date(order.paidAt).toLocaleString()
                      : "\u2014"
                  }
                />
                <InfoField
                  label="Created"
                  value={new Date(order.createdAt).toLocaleString()}
                />
                <InfoField
                  label="Updated"
                  value={new Date(order.updatedAt).toLocaleString()}
                />
              </div>
            </Section>

            {/* Files with Preflight Review */}
            {order.files && order.files.length > 0 && (
              <Section title={`Files (${order.files.length})`}>
                <div className="space-y-2">
                  {order.files.map((file) => (
                    <div key={file.id} className="rounded-[3px] border border-[#e0e0e0] px-3 py-2">
                      <div className="flex items-center justify-between">
                        <a
                          href={file.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-black underline hover:no-underline"
                        >
                          {file.fileName || "File"}
                          {file.mimeType && (
                            <span className="ml-2 text-[#999]">{file.mimeType}</span>
                          )}
                        </a>
                        <span className={`rounded-[2px] px-2 py-0.5 text-[10px] font-semibold ${
                          file.preflightStatus === "approved" ? "bg-green-100 text-green-700" :
                          file.preflightStatus === "rejected" ? "bg-red-100 text-red-700" :
                          "bg-[#f5f5f5] text-[#666]"
                        }`}>
                          {file.preflightStatus || "pending"}
                        </span>
                      </div>
                      {file.preflightStatus === "pending" && (
                        <PreflightActions orderId={id} fileId={file.id} fileName={file.fileName} onUpdate={() => {
                          // Refresh order
                          fetch(`/api/admin/orders/${id}`).then(r => r.json()).then(data => {
                            if (!data.error) { setOrder(data); fetchTimeline(); }
                          });
                        }} />
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Proof Management */}
            <ProofSection orderId={id} />

            {/* Actions: Ship & Refund */}
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
    </>
  );
}

/* ========== Print Invoice Component ========== */
function PrintInvoice({ order }) {
  return (
    <div className="p-8 text-sm text-black">
      {/* Invoice Header */}
      <div className="flex items-start justify-between border-b border-[#d0d0d0] pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Vibe Sticker Shop</h1>
          <p className="text-[#999] mt-1">Invoice</p>
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
          Bill To
        </h2>
        <p className="font-medium">{order.customerName || order.customerEmail}</p>
        <p>{order.customerEmail}</p>
        {order.customerPhone && <p>{order.customerPhone}</p>}
      </div>

      {/* Items Table */}
      <table className="w-full mb-6 border-collapse">
        <thead>
          <tr className="border-b border-[#d0d0d0] text-left text-xs font-semibold uppercase text-[#999]">
            <th className="pb-2">Item</th>
            <th className="pb-2">Type</th>
            <th className="pb-2 text-center">Qty</th>
            <th className="pb-2 text-right">Unit Price</th>
            <th className="pb-2 text-right">Total</th>
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
          <span>Subtotal</span>
          <span>{formatCad(order.subtotalAmount)}</span>
        </div>
        {order.coupon && (
          <div className="flex justify-between text-green-700">
            <span>Coupon ({order.coupon.code})</span>
            <span>-{formatCad(order.coupon.discountAmount || 0)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Tax (13% HST)</span>
          <span>{formatCad(order.taxAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>
            {order.shippingAmount === 0 ? "FREE" : formatCad(order.shippingAmount)}
          </span>
        </div>
        {order.refundAmount > 0 && (
          <div className="flex justify-between text-red-600">
            <span>Refund</span>
            <span>-{formatCad(order.refundAmount)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-[#d0d0d0] pt-2 text-base font-bold">
          <span>Total</span>
          <span>{formatCad(order.totalAmount)} CAD</span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-10 border-t border-[#e0e0e0] pt-4 text-center text-xs text-[#999]">
        <p>Thank you for your order!</p>
        <p className="mt-1">Vibe Sticker Shop</p>
      </div>
    </div>
  );
}

/* ========== Reusable Components ========== */
function Section({ title, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
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

/* ========== Preflight Review Actions ========== */
function PreflightActions({ orderId, fileId, fileName, onUpdate }) {
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
        placeholder="Review notes..."
        className="flex-1 rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-gray-400"
      />
      <button
        type="button"
        onClick={() => handleReview("approved")}
        disabled={acting}
        className="rounded bg-green-600 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-green-700 disabled:opacity-50"
      >
        Approve
      </button>
      <button
        type="button"
        onClick={() => handleReview("rejected")}
        disabled={acting}
        className="rounded bg-red-600 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-red-700 disabled:opacity-50"
      >
        Reject
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
    <Section title={`Proofs (${proofs.length})`}>
      <div className="space-y-3">
        {/* Upload form */}
        <div className="space-y-2 rounded-[3px] border border-[#e0e0e0] bg-[#fafafa] p-3">
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Image URL"
            className="w-full rounded-[3px] border border-[#d0d0d0] px-2.5 py-1.5 text-xs outline-none focus:border-black"
          />
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="File name (optional)"
            className="w-full rounded-[3px] border border-[#d0d0d0] px-2.5 py-1.5 text-xs outline-none focus:border-black"
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            rows={2}
            className="w-full rounded-[3px] border border-[#d0d0d0] px-2.5 py-1.5 text-xs outline-none focus:border-black resize-none"
          />
          <button
            type="button"
            onClick={handleUploadProof}
            disabled={submitting || !imageUrl.trim()}
            className="w-full rounded-[3px] bg-black py-2 text-xs font-semibold text-white hover:bg-[#222] disabled:bg-[#999]"
          >
            {submitting ? "Uploading..." : "Upload Proof"}
          </button>
        </div>

        {/* Proof list */}
        {loadingProofs ? (
          <p className="text-xs text-[#999]">Loading proofs...</p>
        ) : proofs.length === 0 ? (
          <p className="text-xs text-[#999]">No proofs yet</p>
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
                    <img
                      src={proof.imageUrl}
                      alt={proof.fileName || `Proof v${proof.version}`}
                      className="h-24 w-full rounded-[3px] border border-[#e0e0e0] object-cover"
                    />
                  </a>
                )}
                {proof.notes && (
                  <p className="mt-2 text-xs text-[#666]">
                    <span className="font-medium text-black">Notes:</span> {proof.notes}
                  </p>
                )}
                {proof.customerComment && (
                  <p className="mt-1 text-xs text-[#666]">
                    <span className="font-medium text-black">Customer:</span>{" "}
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

/* ========== Order Actions (Ship / Refund) ========== */
function OrderActions({ order, onUpdate }) {
  const [shipOpen, setShipOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [acting, setActing] = useState(false);
  const [actionMsg, setActionMsg] = useState("");

  // Ship state
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("Canada Post");
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
        setActionMsg("Shipped successfully!");
        setShipOpen(false);
        onUpdate();
      } else {
        setActionMsg(data.error || "Ship failed");
      }
    } catch {
      setActionMsg("Ship failed");
    } finally {
      setActing(false);
    }
  }

  async function handleRefund() {
    setActing(true);
    setActionMsg("");
    const amountCents = Math.round(parseFloat(refundAmount) * 100);
    if (!amountCents || amountCents <= 0) {
      setActionMsg("Enter a valid amount");
      setActing(false);
      return;
    }
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountCents,
          reason: refundReason || "Refund issued by admin",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMsg("Refund issued!");
        setRefundOpen(false);
        onUpdate();
      } else {
        setActionMsg(data.error || "Refund failed");
      }
    } catch {
      setActionMsg("Refund failed");
    } finally {
      setActing(false);
    }
  }

  return (
    <Section title="Actions">
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
            className="w-full rounded-lg bg-purple-600 py-2.5 text-xs font-semibold text-white hover:bg-purple-700"
          >
            Mark as Shipped
          </button>
        )}
        {shipOpen && (
          <div className="space-y-2 rounded-lg border border-purple-200 bg-purple-50 p-3">
            <p className="text-xs font-semibold text-purple-900">Ship Order</p>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Tracking number"
              className="w-full rounded border border-gray-300 px-2.5 py-1.5 text-xs outline-none"
            />
            <select
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              className="w-full rounded border border-gray-300 px-2.5 py-1.5 text-xs outline-none"
            >
              <option>Canada Post</option>
              <option>UPS</option>
              <option>Purolator</option>
              <option>FedEx</option>
              <option>Other</option>
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
                className="flex-1 rounded bg-purple-600 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 disabled:bg-gray-400"
              >
                {acting ? "..." : "Confirm Ship"}
              </button>
              <button
                type="button"
                onClick={() => setShipOpen(false)}
                className="rounded border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
              >
                Cancel
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
            Issue Refund
          </button>
        )}
        {refundOpen && (
          <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-xs font-semibold text-red-900">Issue Refund</p>
            <p className="text-[10px] text-red-600">Max: ${maxRefund.toFixed(2)} CAD</p>
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
              placeholder="Reason (optional)"
              className="w-full rounded border border-gray-300 px-2.5 py-1.5 text-xs outline-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleRefund}
                disabled={acting}
                className="flex-1 rounded bg-red-600 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:bg-gray-400"
              >
                {acting ? "..." : "Confirm Refund"}
              </button>
              <button
                type="button"
                onClick={() => setRefundOpen(false)}
                className="rounded border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {!canShip && !canRefund && (
          <p className="text-xs text-gray-600 text-center py-2">No actions available for this order status</p>
        )}
      </div>
    </Section>
  );
}
