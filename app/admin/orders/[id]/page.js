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

const priorityLabels = ["Normal", "High", "Urgent"];
const priorityColors = [
  "bg-gray-100 text-gray-700 border-gray-300",
  "bg-yellow-100 text-yellow-800 border-yellow-400",
  "bg-red-100 text-red-700 border-red-400",
];

const timelineDotColors = {
  status_updated: "bg-blue-500",
  note_added: "bg-green-500",
  payment_received: "bg-emerald-500",
  refund_issued: "bg-red-500",
  default: "bg-gray-400",
};

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
      <div className="flex h-64 items-center justify-center text-sm text-gray-500">
        Loading...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <p className="text-sm text-gray-500">Order not found</p>
        <Link href="/admin/orders" className="text-sm text-blue-600 hover:text-blue-800">
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
        <div className="flex items-center justify-between">
          <div>
            <div className="mb-1 flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push("/admin/orders")}
                className="text-xs text-gray-500 hover:text-gray-900"
              >
                &larr; Back to Orders
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Print Invoice
              </button>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">
              Order Details
            </h1>
            <p className="mt-0.5 font-mono text-xs text-gray-400">{order.id}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              statusColors[order.status] || "bg-gray-100"
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
                <div className="divide-y divide-gray-100">
                  {order.items.map((item) => (
                    <div key={item.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {item.productName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.productType} &middot; Qty: {item.quantity}
                          </p>
                          {/* Specs */}
                          <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-400">
                            {item.widthIn && item.heightIn && (
                              <span>
                                {item.widthIn}&quot; x {item.heightIn}&quot;
                              </span>
                            )}
                            {item.material && <span>{item.material}</span>}
                            {item.finishing && <span>{item.finishing}</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            {formatCad(item.totalPrice)}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatCad(item.unitPrice)} each
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No items</p>
              )}
            </Section>

            {/* Amount breakdown */}
            <Section title="Amount">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">
                    {formatCad(order.subtotalAmount)}
                  </span>
                </div>
                {order.coupon && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Coupon ({order.coupon.code})
                    </span>
                    <span className="font-medium text-green-700">
                      -{formatCad(order.coupon.discountAmount || 0)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (13% HST)</span>
                  <span className="font-medium text-gray-900">
                    {formatCad(order.taxAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium text-gray-900">
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
                <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-semibold">
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
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
                    onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                  />
                  <label className="flex items-center gap-1 text-xs text-gray-500">
                    <input
                      type="checkbox"
                      checked={isInternalNote}
                      onChange={(e) => setIsInternalNote(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    Internal
                  </label>
                  <button
                    type="button"
                    onClick={handleAddNote}
                    disabled={addingNote || !noteText.trim()}
                    className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-black disabled:bg-gray-400"
                  >
                    {addingNote ? "..." : "Add"}
                  </button>
                </div>

                {order.notes && order.notes.length > 0 ? (
                  <div className="space-y-2">
                    {order.notes.map((note) => (
                      <div
                        key={note.id}
                        className="rounded-lg bg-gray-50 px-3 py-2"
                      >
                        <p className="text-sm text-gray-900">{note.message}</p>
                        <p className="mt-1 text-xs text-gray-400">
                          {note.authorType} &middot;{" "}
                          {new Date(note.createdAt).toLocaleString()}
                          {note.isInternal && (
                            <span className="ml-2 rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-600">
                              Internal
                            </span>
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">No notes yet</p>
                )}
              </div>
            </Section>

            {/* Order Timeline */}
            <Section title="Timeline">
              {timeline.length > 0 ? (
                <div className="relative pl-6 border-l-2 border-gray-200">
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
                          <p className="text-sm font-medium text-gray-900">
                            {event.action.replace(/_/g, " ")}
                          </p>
                          {event.details && (
                            <p className="mt-0.5 text-xs text-gray-500 break-all">
                              {event.details}
                            </p>
                          )}
                          <p className="mt-0.5 text-xs text-gray-400">
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
                <p className="text-xs text-gray-400">No timeline events</p>
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
                  value={status}
                  onChange={setStatus}
                  options={statusOptions}
                />
                <SelectField
                  label="Payment Status"
                  value={paymentStatus}
                  onChange={setPaymentStatus}
                  options={paymentOptions}
                />
                <SelectField
                  label="Production Status"
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
                  className="w-full rounded-lg bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
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
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    onBlur={handleTagsBlur}
                    placeholder="e.g. rush, wholesale, VIP"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
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
                            className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700"
                          >
                            {tag}
                          </span>
                        ))}
                    </div>
                  )}
                </div>

                {/* Priority */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Priority
                  </label>
                  <div className="flex gap-2">
                    {priorityLabels.map((label, idx) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => handlePriorityChange(idx)}
                        className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors ${
                          priority === idx
                            ? priorityColors[idx]
                            : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Archive Toggle */}
                <div>
                  <button
                    type="button"
                    onClick={handleArchiveToggle}
                    className={`w-full rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                      isArchived
                        ? "border-orange-300 bg-orange-50 text-orange-700"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {isArchived ? "Archived - Click to Unarchive" : "Archive Order"}
                  </button>
                </div>

                {/* Estimated Completion */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Estimated Completion
                  </label>
                  <input
                    type="date"
                    value={estimatedCompletion}
                    onChange={handleEstimatedCompletionChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
                  />
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

            {/* Files */}
            {order.files && order.files.length > 0 && (
              <Section title={`Files (${order.files.length})`}>
                <div className="space-y-2">
                  {order.files.map((file) => (
                    <a
                      key={file.id}
                      href={file.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-lg border border-gray-200 px-3 py-2 text-xs text-blue-600 transition-colors hover:bg-gray-50"
                    >
                      {file.fileName || "File"}
                      {file.mimeType && (
                        <span className="ml-2 text-gray-400">{file.mimeType}</span>
                      )}
                    </a>
                  ))}
                </div>
              </Section>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ========== Print Invoice Component ========== */
function PrintInvoice({ order }) {
  return (
    <div className="p-8 text-sm text-gray-900">
      {/* Invoice Header */}
      <div className="flex items-start justify-between border-b border-gray-300 pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Vibe Sticker Shop</h1>
          <p className="text-gray-500 mt-1">Invoice</p>
        </div>
        <div className="text-right">
          <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
          <p className="text-gray-500">
            {new Date(order.createdAt).toLocaleDateString("en-CA")}
          </p>
        </div>
      </div>

      {/* Customer Info */}
      <div className="mb-6">
        <h2 className="text-xs font-semibold uppercase text-gray-500 mb-2">
          Bill To
        </h2>
        <p className="font-medium">{order.customerName || order.customerEmail}</p>
        <p>{order.customerEmail}</p>
        {order.customerPhone && <p>{order.customerPhone}</p>}
      </div>

      {/* Items Table */}
      <table className="w-full mb-6 border-collapse">
        <thead>
          <tr className="border-b border-gray-300 text-left text-xs font-semibold uppercase text-gray-500">
            <th className="pb-2">Item</th>
            <th className="pb-2">Type</th>
            <th className="pb-2 text-center">Qty</th>
            <th className="pb-2 text-right">Unit Price</th>
            <th className="pb-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items?.map((item) => (
            <tr key={item.id} className="border-b border-gray-100">
              <td className="py-2">
                <p className="font-medium">{item.productName}</p>
                <p className="text-xs text-gray-500">
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
        <div className="flex justify-between border-t border-gray-300 pt-2 text-base font-bold">
          <span>Total</span>
          <span>{formatCad(order.totalAmount)} CAD</span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-10 border-t border-gray-200 pt-4 text-center text-xs text-gray-400">
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
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-0.5 text-sm text-gray-900">{value}</p>
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
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
    </div>
  );
}
