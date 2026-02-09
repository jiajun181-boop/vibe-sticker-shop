"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
    cents / 100
  );

const JOB_STATUSES = [
  "queued",
  "assigned",
  "printing",
  "quality_check",
  "finished",
  "shipped",
  "on_hold",
];

const PRIORITIES = ["normal", "rush", "urgent"];

const statusColors = {
  queued: "bg-gray-100 text-gray-700",
  assigned: "bg-blue-100 text-blue-700",
  printing: "bg-yellow-100 text-yellow-700",
  quality_check: "bg-purple-100 text-purple-700",
  finished: "bg-green-100 text-green-700",
  shipped: "bg-emerald-100 text-emerald-700",
  on_hold: "bg-red-100 text-red-700",
};

const priorityColors = {
  normal: "bg-gray-100 text-gray-600",
  rush: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

const eventDotColors = {
  status_change: "bg-blue-500",
  factory_assigned: "bg-indigo-500",
  note: "bg-green-500",
  priority_change: "bg-orange-500",
  default: "bg-gray-400",
};

function timeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-CA");
}

function formatDate(dateString) {
  if (!dateString) return null;
  return new Date(dateString).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ProductionJobDetailPage() {
  const { id } = useParams();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [factories, setFactories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Editable fields
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [factoryId, setFactoryId] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [notes, setNotes] = useState("");

  // Add note form
  const [noteOperator, setNoteOperator] = useState("");
  const [notePayload, setNotePayload] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  const fetchJob = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/production/${id}`);
      if (!res.ok) {
        setJob(null);
        return;
      }
      const data = await res.json();
      setJob(data);
      setStatus(data.status);
      setPriority(data.priority);
      setFactoryId(data.factoryId || "");
      setAssignedTo(data.assignedTo || "");
      setDueAt(data.dueAt ? data.dueAt.slice(0, 10) : "");
      setNotes(data.notes || "");
    } catch {
      console.error("Failed to fetch job");
      setJob(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchFactories = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/factories");
      const data = await res.json();
      setFactories(data.factories || data || []);
    } catch {
      console.error("Failed to load factories");
    }
  }, []);

  useEffect(() => {
    fetchJob();
    fetchFactories();
  }, [fetchJob, fetchFactories]);

  async function handleSaveChanges() {
    setSaving(true);
    setMessage("");
    try {
      const body = {};
      if (status !== job.status) body.status = status;
      if (priority !== job.priority) body.priority = priority;
      if ((factoryId || null) !== (job.factoryId || null))
        body.factoryId = factoryId || null;
      if ((assignedTo || "") !== (job.assignedTo || ""))
        body.assignedTo = assignedTo || null;
      if ((dueAt || "") !== (job.dueAt ? job.dueAt.slice(0, 10) : ""))
        body.dueAt = dueAt ? new Date(dueAt).toISOString() : null;
      if ((notes || "") !== (job.notes || "")) body.notes = notes || null;

      if (Object.keys(body).length === 0) {
        setMessage("No changes to save");
        setTimeout(() => setMessage(""), 3000);
        setSaving(false);
        return;
      }

      const res = await fetch(`/api/admin/production/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setMessage("Changes saved");
        await fetchJob();
      } else {
        const data = await res.json();
        setMessage(data.error || "Failed to save");
      }
    } catch {
      setMessage("Network error");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 3000);
    }
  }

  async function handleQuickStatus(newStatus) {
    try {
      const res = await fetch(`/api/admin/production/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await fetchJob();
      }
    } catch {
      console.error("Failed to update status");
    }
  }

  async function handleAddNote() {
    if (!notePayload.trim()) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/admin/production/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "note",
          operatorName: noteOperator.trim() || null,
          payload: { message: notePayload.trim() },
        }),
      });
      if (res.ok) {
        setNoteOperator("");
        setNotePayload("");
        await fetchJob();
      }
    } catch {
      console.error("Failed to add note");
    } finally {
      setAddingNote(false);
    }
  }

  // Derived data
  const orderItem = job?.orderItem;
  const order = orderItem?.order;
  const events = job?.events || [];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-500">
        Loading...
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <p className="text-sm text-gray-500">Production job not found</p>
        <Link
          href="/admin/production"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Back to Production Queue
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/admin/production"
        className="inline-block text-xs text-gray-500 hover:text-gray-900"
      >
        &larr; Back to Production Queue
      </Link>

      {/* Header row */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900">
              Job {job.id}
            </h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                statusColors[job.status] || "bg-gray-100"
              }`}
            >
              {statusLabel(job.status)}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                priorityColors[job.priority] || "bg-gray-100"
              }`}
            >
              {job.priority}
            </span>
          </div>
          {order && (
            <Link
              href={`/admin/orders/${order.id}`}
              className="mt-1 inline-block text-sm text-blue-600 hover:text-blue-800"
            >
              Order #{order.id}
            </Link>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content - left 2 cols */}
        <div className="space-y-6 lg:col-span-2">
          {/* Job Info Card */}
          <Section title="Job Info">
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoField
                label="Product"
                value={
                  orderItem?.productName ||
                  orderItem?.product?.name ||
                  "Unknown"
                }
              />
              <InfoField
                label="Quantity"
                value={orderItem?.quantity ?? "\u2014"}
              />
              <InfoField
                label="Customer Email"
                value={order?.customerEmail || "\u2014"}
              />
              <InfoField
                label="Customer Name"
                value={order?.customerName || "\u2014"}
              />
              {orderItem?.material && (
                <InfoField label="Material" value={orderItem.material} />
              )}
              {orderItem?.finishing && (
                <InfoField label="Finishing" value={orderItem.finishing} />
              )}
              {orderItem?.widthIn && orderItem?.heightIn && (
                <InfoField
                  label="Dimensions"
                  value={`${orderItem.widthIn}" x ${orderItem.heightIn}"`}
                />
              )}
              {orderItem?.unitPrice != null && (
                <InfoField
                  label="Unit Price"
                  value={formatCad(orderItem.unitPrice)}
                />
              )}
              {orderItem?.totalPrice != null && (
                <InfoField
                  label="Total Price"
                  value={formatCad(orderItem.totalPrice)}
                />
              )}
            </div>
            {(orderItem?.fileUrl || orderItem?.fileName) && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <p className="mb-1 text-xs font-medium text-gray-500">File</p>
                {orderItem.fileUrl ? (
                  <a
                    href={orderItem.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded-lg border border-gray-200 px-3 py-2 text-xs text-blue-600 transition-colors hover:bg-gray-50"
                  >
                    {orderItem.fileName || "Download File"}
                  </a>
                ) : (
                  <p className="text-sm text-gray-600">
                    {orderItem.fileName}
                  </p>
                )}
              </div>
            )}
          </Section>

          {/* Status & Assignment Card */}
          <Section title="Status &amp; Assignment">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Status */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
                >
                  {JOB_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {statusLabel(s)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Factory */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Factory
                </label>
                <select
                  value={factoryId}
                  onChange={(e) => setFactoryId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
                >
                  <option value="">Unassigned</option>
                  {factories.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assigned To */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Assigned To
                </label>
                <input
                  type="text"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  placeholder="Operator name..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
                />
              </div>

              {/* Due Date */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="mt-4">
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Internal notes about this job..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
              />
            </div>

            {/* Save button */}
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveChanges}
                disabled={saving}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              {message && (
                <span
                  className={`text-xs font-medium ${
                    message.includes("error") || message.includes("Failed")
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {message}
                </span>
              )}
            </div>
          </Section>

          {/* Event Timeline */}
          <Section title="Event Timeline">
            {/* Add Note form */}
            <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="mb-3 text-xs font-semibold text-gray-700">
                Add Note
              </h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={noteOperator}
                  onChange={(e) => setNoteOperator(e.target.value)}
                  placeholder="Operator name (optional)"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-900"
                />
                <textarea
                  value={notePayload}
                  onChange={(e) => setNotePayload(e.target.value)}
                  rows={2}
                  placeholder="Write a note..."
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-900"
                />
                <button
                  type="button"
                  onClick={handleAddNote}
                  disabled={addingNote || !notePayload.trim()}
                  className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-black disabled:bg-gray-400"
                >
                  {addingNote ? "Adding..." : "Add Note"}
                </button>
              </div>
            </div>

            {/* Timeline */}
            {events.length > 0 ? (
              <div className="relative border-l-2 border-gray-200 pl-6">
                {events.map((event, idx) => {
                  const dotColor =
                    eventDotColors[event.type] || eventDotColors.default;
                  const payload =
                    typeof event.payload === "string"
                      ? JSON.parse(event.payload)
                      : event.payload;

                  return (
                    <div key={event.id || idx} className="relative pb-5 last:pb-0">
                      {/* Dot */}
                      <div
                        className={`absolute -left-[25px] top-1 h-3 w-3 rounded-full border-2 border-white ${dotColor}`}
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {statusLabel(event.type)}
                        </p>

                        {/* Status change: from -> to */}
                        {event.type === "status_change" && payload && (
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            {payload.from && (
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                  statusColors[payload.from] || "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {statusLabel(payload.from)}
                              </span>
                            )}
                            <span className="text-xs text-gray-400">
                              &rarr;
                            </span>
                            {payload.to && (
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                  statusColors[payload.to] || "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {statusLabel(payload.to)}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Factory assigned */}
                        {event.type === "factory_assigned" && payload && (
                          <p className="mt-0.5 text-xs text-gray-500">
                            Factory: {payload.factoryName || payload.factoryId || "\u2014"}
                          </p>
                        )}

                        {/* Priority change */}
                        {event.type === "priority_change" && payload && (
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            {payload.from && (
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                  priorityColors[payload.from] || "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {payload.from}
                              </span>
                            )}
                            <span className="text-xs text-gray-400">
                              &rarr;
                            </span>
                            {payload.to && (
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                  priorityColors[payload.to] || "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {payload.to}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Note */}
                        {event.type === "note" && payload && (
                          <p className="mt-0.5 text-xs text-gray-600 break-words">
                            {payload.message || JSON.stringify(payload)}
                          </p>
                        )}

                        {/* Generic payload for other types */}
                        {event.type !== "status_change" &&
                          event.type !== "factory_assigned" &&
                          event.type !== "priority_change" &&
                          event.type !== "note" &&
                          payload && (
                            <p className="mt-0.5 text-xs text-gray-500 break-all">
                              {typeof payload === "object"
                                ? JSON.stringify(payload)
                                : String(payload)}
                            </p>
                          )}

                        {/* Meta: operator + time */}
                        <p className="mt-1 text-xs text-gray-400">
                          {event.operatorName && (
                            <span className="mr-2 font-medium text-gray-500">
                              {event.operatorName}
                            </span>
                          )}
                          {timeAgo(event.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-400">No events yet</p>
            )}
          </Section>
        </div>

        {/* Sidebar - right 1 col */}
        <div className="space-y-6">
          {/* Dates Card */}
          <Section title="Dates">
            <div className="space-y-3 text-xs">
              <div>
                <p className="text-gray-500">Created</p>
                <p className="mt-0.5 text-sm text-gray-900">
                  {formatDate(job.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Started</p>
                <p className="mt-0.5 text-sm text-gray-900">
                  {job.startedAt ? formatDate(job.startedAt) : "Not started"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Completed</p>
                <p className="mt-0.5 text-sm text-gray-900">
                  {job.completedAt
                    ? formatDate(job.completedAt)
                    : "In progress"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Due</p>
                <p className="mt-0.5 text-sm text-gray-900">
                  {job.dueAt ? formatDate(job.dueAt) : "No due date"}
                </p>
              </div>
            </div>
          </Section>

          {/* Quick Actions Card */}
          <Section title="Quick Actions">
            <div className="space-y-2">
              {(job.status === "queued" || job.status === "assigned") && (
                <button
                  type="button"
                  onClick={() => handleQuickStatus("printing")}
                  className="w-full rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs font-semibold text-yellow-700 transition-colors hover:bg-yellow-100"
                >
                  Mark as Printing
                </button>
              )}

              {job.status === "printing" && (
                <button
                  type="button"
                  onClick={() => handleQuickStatus("quality_check")}
                  className="w-full rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-700 transition-colors hover:bg-purple-100"
                >
                  Mark as Quality Check
                </button>
              )}

              {job.status === "quality_check" && (
                <button
                  type="button"
                  onClick={() => handleQuickStatus("finished")}
                  className="w-full rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 transition-colors hover:bg-green-100"
                >
                  Mark as Finished
                </button>
              )}

              <button
                type="button"
                onClick={() => handleQuickStatus("on_hold")}
                className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
              >
                Put on Hold
              </button>
            </div>
          </Section>

          {/* Factory Info (if assigned) */}
          {job.factory && (
            <Section title="Factory">
              <div className="space-y-2 text-xs">
                <InfoField label="Name" value={job.factory.name} />
                {job.factory.location && (
                  <InfoField label="Location" value={job.factory.location} />
                )}
                {Array.isArray(job.factory.capabilities) &&
                  job.factory.capabilities.length > 0 && (
                    <div>
                      <p className="text-gray-500">Capabilities</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {job.factory.capabilities.map((cap) => (
                          <span
                            key={cap}
                            className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                          >
                            {cap}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

/* ========== Reusable Components ========== */
function Section({ title, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
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
