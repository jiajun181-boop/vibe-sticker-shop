"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { timeAgo as sharedTimeAgo } from "@/lib/admin/time-ago";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { formatCad } from "@/lib/admin/format-cad";
import { statusColor, priorityColor } from "@/lib/admin/status-labels";

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

const eventDotColors = {
  status_change: "bg-blue-500",
  factory_assigned: "bg-indigo-500",
  note: "bg-green-500",
  priority_change: "bg-orange-500",
  quality_check: "bg-purple-500",
  defect_found: "bg-red-500",
  rework: "bg-orange-500",
  qc_passed: "bg-green-500",
  file_received: "bg-cyan-500",
  default: "bg-gray-400",
};

const READINESS_COLORS = {
  done:         { bg: "bg-green-50",  text: "text-green-800",  border: "border-green-300", dot: "bg-green-500" },
  ready:        { bg: "bg-green-50",  text: "text-green-800",  border: "border-green-300", dot: "bg-green-500" },
  "in-progress":{ bg: "bg-blue-50",   text: "text-blue-800",   border: "border-blue-300",  dot: "bg-blue-500" },
  "needs-info": { bg: "bg-amber-50",  text: "text-amber-800",  border: "border-amber-300", dot: "bg-amber-400" },
  blocked:      { bg: "bg-red-50",    text: "text-red-800",    border: "border-red-300",   dot: "bg-red-500" },
};


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
  const { t } = useTranslation();
  const timeAgo = (d) => sharedTimeAgo(d, t);

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

  // Readiness
  const [readiness, setReadiness] = useState(null);
  const [readinessLoading, setReadinessLoading] = useState(false);

  // QC flow
  const [defectType, setDefectType] = useState("");
  const [defectDesc, setDefectDesc] = useState("");
  const [submittingQc, setSubmittingQc] = useState(false);

  // Layout (sticker/label only)
  const [layoutData, setLayoutData] = useState(null);

  // Split job
  const [showSplit, setShowSplit] = useState(false);
  const [splitKeep, setSplitKeep] = useState("");
  const [splitting, setSplitting] = useState(false);

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

  const fetchReadiness = useCallback(async () => {
    setReadinessLoading(true);
    try {
      const res = await fetch(`/api/admin/production/${id}/readiness`);
      if (res.ok) {
        setReadiness(await res.json());
      }
    } catch {
      console.error("Failed to fetch readiness");
    } finally {
      setReadinessLoading(false);
    }
  }, [id]);

  const fetchLayout = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/production/${id}/layout`);
      if (res.ok) {
        setLayoutData(await res.json());
      }
    } catch {
      // Layout not available (missing dimensions) — ignore
    }
  }, [id]);

  useEffect(() => {
    fetchJob();
    fetchFactories();
    fetchReadiness();
  }, [fetchJob, fetchFactories, fetchReadiness]);

  // Fetch layout only for sticker/label families (after job loads)
  useEffect(() => {
    if (job && (job.family === "sticker" || job.family === "label") && job.widthIn && job.heightIn) {
      fetchLayout();
    }
  }, [job?.family, job?.widthIn, job?.heightIn, fetchLayout]);

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
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/production/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setMessage(`Status changed to ${statusLabel(newStatus)}`);
        await fetchJob();
      } else {
        const data = await res.json().catch(() => ({}));
        setMessage(data.error || `Failed to change status to ${newStatus}`);
      }
    } catch {
      setMessage("Network error — status change failed");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 4000);
    }
  }

  async function handleAddNote() {
    if (!notePayload.trim()) return;
    setAddingNote(true);
    setMessage("");
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
      } else {
        setMessage("Failed to add note");
        setTimeout(() => setMessage(""), 4000);
      }
    } catch {
      setMessage("Network error — note not saved");
      setTimeout(() => setMessage(""), 4000);
    } finally {
      setAddingNote(false);
    }
  }

  // QC: Pass
  async function handleQcPass() {
    setSubmittingQc(true);
    setMessage("");
    try {
      // Log QC passed event
      await fetch(`/api/admin/production/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "quality_check",
          operatorName: assignedTo || null,
          payload: { result: "passed", message: "Quality check passed" },
        }),
      });
      // Advance to finished
      const res = await fetch(`/api/admin/production/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "finished" }),
      });
      if (res.ok) {
        setMessage("QC passed — job marked finished");
        await fetchJob();
      } else {
        const data = await res.json().catch(() => ({}));
        setMessage(data.error || "Failed to advance to finished");
      }
    } catch {
      setMessage("Network error — QC pass failed");
    } finally {
      setSubmittingQc(false);
      setTimeout(() => setMessage(""), 4000);
    }
  }

  // QC: Fail (defect found → rework) — requires confirmation
  async function handleQcFail() {
    if (!defectType && !defectDesc.trim()) return;
    const confirmed = confirm(
      `Send job back to PRINTING for rework?\n\nDefect: ${defectType || "other"}\n${defectDesc.trim() || "(no description)"}\n\nThis will reset the job status.`
    );
    if (!confirmed) return;
    setSubmittingQc(true);
    setMessage("");
    try {
      await fetch(`/api/admin/production/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "defect_found",
          operatorName: assignedTo || null,
          payload: {
            defectType: defectType || "other",
            description: defectDesc.trim() || "Defect found during QC",
          },
        }),
      });
      // Send back to printing for rework
      const res = await fetch(`/api/admin/production/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "printing" }),
      });
      if (res.ok) {
        setDefectType("");
        setDefectDesc("");
        setMessage("Job sent back for rework");
        await fetchJob();
      } else {
        const data = await res.json().catch(() => ({}));
        setMessage(data.error || "Failed to send back for rework");
      }
    } catch {
      setMessage("Network error — rework action failed");
    } finally {
      setSubmittingQc(false);
      setTimeout(() => setMessage(""), 5000);
    }
  }

  // Split job handler
  async function handleSplitJob() {
    const keepQty = parseInt(splitKeep, 10);
    if (!keepQty || keepQty < 1 || keepQty >= (job.quantity || 0)) return;
    setSplitting(true);
    try {
      const res = await fetch(`/api/admin/production/${id}/split`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keepQuantity: keepQty }),
      });
      if (res.ok) {
        const data = await res.json();
        setShowSplit(false);
        setSplitKeep("");
        setMessage(`Split: kept ${keepQty}, new job ${data.newJob.id.slice(0, 8)} with ${data.newJob.quantity}`);
        await fetchJob();
      } else {
        const err = await res.json();
        setMessage(err.error || "Split failed");
      }
    } catch {
      setMessage("Network error during split");
    } finally {
      setSplitting(false);
      setTimeout(() => setMessage(""), 5000);
    }
  }

  // Derived data
  const orderItem = job?.orderItem;
  const order = orderItem?.order;
  const events = job?.events || [];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-600">
        Loading...
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <p className="text-sm text-gray-600">Production job not found</p>
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
        className="inline-block text-xs text-gray-600 hover:text-gray-900"
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
                statusColor(job.status)
              }`}
            >
              {statusLabel(job.status)}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                priorityColor(job.priority)
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
                value={job.productName || orderItem?.productName || "Unknown"}
              />
              <InfoField
                label="Quantity"
                value={job.quantity || orderItem?.quantity || "\u2014"}
              />
              <InfoField
                label="Customer Email"
                value={order?.customerEmail || "\u2014"}
              />
              <InfoField
                label="Customer Name"
                value={order?.customerName || "\u2014"}
              />
              {job.family && (
                <InfoField label="Family" value={job.family} />
              )}
              {(job.materialLabel || job.material || orderItem?.material) && (
                <InfoField
                  label="Material"
                  value={job.materialLabel || job.material || orderItem?.material}
                />
              )}
              {(job.finishingLabel || job.finishing || orderItem?.finishing) && (
                <InfoField
                  label="Finishing"
                  value={job.finishingLabel || job.finishing || orderItem?.finishing}
                />
              )}
              {(job.widthIn || orderItem?.widthIn) && (job.heightIn || orderItem?.heightIn) && (
                <InfoField
                  label="Dimensions"
                  value={`${job.widthIn || orderItem?.widthIn}" x ${job.heightIn || orderItem?.heightIn}"`}
                />
              )}
              {job.isTwoSided && (
                <InfoField label="Sides" value="Double-sided" />
              )}
              {job.isRush && (
                <InfoField label="Rush" value="Yes — 24h turnaround" />
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

            {/* Artwork section — inline preview + download */}
            {(job.artworkUrl || orderItem?.fileUrl || orderItem?.fileName) && (() => {
              const artUrl = job.artworkUrl || orderItem?.fileUrl;
              const isImage = artUrl && /\.(png|jpe?g|gif|webp|svg|bmp)(\?|$)/i.test(artUrl);
              return (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <p className="mb-2 text-xs font-medium text-gray-600">Artwork File</p>
                  {isImage && (
                    <a href={artUrl} target="_blank" rel="noopener noreferrer" className="block mb-2">
                      <img
                        src={artUrl}
                        alt="Artwork preview"
                        className="max-h-48 max-w-full rounded-lg border border-gray-200 bg-[repeating-conic-gradient(#f3f4f6_0%_25%,#fff_0%_50%)_0_0/16px_16px] object-contain"
                      />
                    </a>
                  )}
                  {artUrl ? (
                    <a
                      href={artUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block rounded-lg border border-gray-200 px-3 py-2 text-xs text-blue-600 transition-colors hover:bg-gray-50"
                    >
                      {orderItem?.fileName || "Download Artwork"}
                    </a>
                  ) : (
                    <p className="text-sm text-gray-600">{orderItem?.fileName}</p>
                  )}
                </div>
              );
            })()}
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
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-[#fff] hover:bg-blue-700 disabled:bg-gray-400"
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

          {/* QC Flow — only shows when job is at quality_check */}
          {job.status === "quality_check" && (
            <Section title="Quality Check">
              <div className="space-y-4">
                <p className="text-xs text-gray-600">
                  Inspect the printed item and either pass or reject with defect details.
                </p>

                {/* Pass button */}
                <button
                  type="button"
                  onClick={handleQcPass}
                  disabled={submittingQc}
                  className="w-full rounded-lg border-2 border-green-500 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700 transition-colors hover:bg-green-100 disabled:opacity-50"
                >
                  {submittingQc ? "Processing..." : "QC Passed — Mark as Finished"}
                </button>

                {/* Defect form */}
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <h4 className="mb-2 text-xs font-semibold text-red-700">Report Defect</h4>
                  <div className="space-y-2">
                    <select
                      value={defectType}
                      onChange={(e) => setDefectType(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-500"
                    >
                      <option value="">Select defect type...</option>
                      <option value="color_mismatch">Color mismatch</option>
                      <option value="alignment_off">Alignment off</option>
                      <option value="cut_error">Cut error / misregistration</option>
                      <option value="print_defect">Print defect (streaks, banding)</option>
                      <option value="material_damage">Material damage</option>
                      <option value="wrong_material">Wrong material</option>
                      <option value="wrong_size">Wrong size</option>
                      <option value="artwork_issue">Artwork issue</option>
                      <option value="other">Other</option>
                    </select>
                    <textarea
                      value={defectDesc}
                      onChange={(e) => setDefectDesc(e.target.value)}
                      rows={2}
                      placeholder="Describe the defect..."
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-500"
                    />
                    <button
                      type="button"
                      onClick={handleQcFail}
                      disabled={submittingQc || (!defectType && !defectDesc.trim())}
                      className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-[#fff] hover:bg-red-700 disabled:bg-gray-400"
                    >
                      {submittingQc ? "Processing..." : "Reject — Send Back to Printing"}
                    </button>
                  </div>
                </div>
              </div>
            </Section>
          )}

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
                  className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-[#fff] hover:bg-black disabled:bg-gray-400"
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
                                  statusColor(payload.from)
                                }`}
                              >
                                {statusLabel(payload.from)}
                              </span>
                            )}
                            <span className="text-xs text-gray-600">
                              &rarr;
                            </span>
                            {payload.to && (
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                  statusColor(payload.to)
                                }`}
                              >
                                {statusLabel(payload.to)}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Factory assigned */}
                        {event.type === "factory_assigned" && payload && (
                          <p className="mt-0.5 text-xs text-gray-600">
                            Factory: {payload.factoryName || payload.factoryId || "\u2014"}
                          </p>
                        )}

                        {/* Priority change */}
                        {event.type === "priority_change" && payload && (
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            {payload.from && (
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                  priorityColor(payload.from)
                                }`}
                              >
                                {payload.from}
                              </span>
                            )}
                            <span className="text-xs text-gray-600">
                              &rarr;
                            </span>
                            {payload.to && (
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                  priorityColor(payload.to)
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

                        {/* QC events */}
                        {event.type === "quality_check" && payload && (
                          <div className="mt-1">
                            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                              payload.result === "passed"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}>
                              QC {payload.result || "checked"}
                            </span>
                            {payload.message && (
                              <p className="mt-0.5 text-xs text-gray-600">{payload.message}</p>
                            )}
                          </div>
                        )}

                        {/* Defect found */}
                        {event.type === "defect_found" && payload && (
                          <div className="mt-1 rounded border border-red-200 bg-red-50 px-2 py-1.5">
                            <p className="text-xs font-medium text-red-700">
                              Defect: {(payload.defectType || "unknown").replace(/_/g, " ")}
                            </p>
                            {payload.description && (
                              <p className="mt-0.5 text-xs text-red-600">{payload.description}</p>
                            )}
                          </div>
                        )}

                        {/* Rework */}
                        {event.type === "rework" && payload && (
                          <p className="mt-0.5 text-xs text-orange-600">
                            Rework: {payload.reason || payload.message || JSON.stringify(payload)}
                          </p>
                        )}

                        {/* Generic payload for other types */}
                        {event.type !== "status_change" &&
                          event.type !== "factory_assigned" &&
                          event.type !== "priority_change" &&
                          event.type !== "note" &&
                          event.type !== "quality_check" &&
                          event.type !== "defect_found" &&
                          event.type !== "rework" &&
                          payload && (
                            <p className="mt-0.5 text-xs text-gray-600 break-all">
                              {typeof payload === "object"
                                ? JSON.stringify(payload)
                                : String(payload)}
                            </p>
                          )}

                        {/* Meta: operator + time */}
                        <p className="mt-1 text-xs text-gray-600">
                          {event.operatorName && (
                            <span className="mr-2 font-medium text-gray-600">
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
              <p className="text-xs text-gray-600">No events yet</p>
            )}
          </Section>
        </div>

        {/* Sidebar - right 1 col */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <Section title="Quick Actions">
            <div className="space-y-2">
              {/* Claim Job */}
              {!job.assignedTo && (
                <button
                  type="button"
                  onClick={async () => {
                    setSaving(true);
                    try {
                      const res = await fetch(`/api/admin/production/${id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ assignedTo: "operator" }),
                      });
                      if (res.ok) { await fetchJob(); setMessage("Job claimed"); setTimeout(() => setMessage(""), 3000); }
                    } catch {} finally { setSaving(false); }
                  }}
                  disabled={saving}
                  className="w-full rounded-[3px] bg-blue-600 px-4 py-2.5 text-xs font-semibold text-[#fff] hover:bg-blue-700 disabled:opacity-50"
                >
                  Claim Job
                </button>
              )}
              {/* Quick advance */}
              {(() => {
                const NEXT = { queued: "assigned", assigned: "printing", printing: "quality_check", quality_check: "finished", finished: "shipped", on_hold: "queued" };
                const next = NEXT[job.status];
                if (!next) return null;
                return (
                  <button
                    type="button"
                    onClick={() => { handleSaveChanges(); setStatus(next); }}
                    disabled={saving}
                    className="w-full rounded-[3px] bg-black px-4 py-2.5 text-xs font-semibold text-[#fff] hover:bg-[#222] disabled:opacity-50"
                  >
                    Advance to {statusLabel(next)}
                  </button>
                );
              })()}
            </div>
          </Section>

          {/* Dates & Cycle Time Card */}
          <Section title="Dates">
            <div className="space-y-3 text-xs">
              <div>
                <p className="text-gray-600">Created</p>
                <p className="mt-0.5 text-sm text-gray-900">
                  {formatDate(job.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Started</p>
                <p className="mt-0.5 text-sm text-gray-900">
                  {job.startedAt ? formatDate(job.startedAt) : "Not started"}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Completed</p>
                <p className="mt-0.5 text-sm text-gray-900">
                  {job.completedAt
                    ? formatDate(job.completedAt)
                    : "In progress"}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Due</p>
                <p className="mt-0.5 text-sm text-gray-900">
                  {job.dueAt ? formatDate(job.dueAt) : "No due date"}
                </p>
                {job.dueAt && !job.completedAt && (() => {
                  const due = new Date(job.dueAt);
                  const now = new Date();
                  const overdue = due < now;
                  const daysLeft = Math.ceil((due - now) / 86400000);
                  return overdue ? (
                    <p className="mt-0.5 text-xs font-semibold text-red-600">Overdue by {Math.abs(daysLeft)} day{Math.abs(daysLeft) !== 1 ? "s" : ""}</p>
                  ) : daysLeft <= 1 ? (
                    <p className="mt-0.5 text-xs font-semibold text-amber-600">Due today</p>
                  ) : null;
                })()}
              </div>
              {/* Cycle time */}
              {job.startedAt && (
                <div className="border-t border-gray-100 pt-2">
                  <p className="text-gray-600">Cycle Time</p>
                  <p className="mt-0.5 text-sm font-semibold text-gray-900">
                    {(() => {
                      const end = job.completedAt ? new Date(job.completedAt) : new Date();
                      const elapsed = end - new Date(job.startedAt);
                      const h = Math.floor(elapsed / 3600000);
                      const m = Math.floor((elapsed % 3600000) / 60000);
                      if (h >= 24) {
                        const d = Math.floor(h / 24);
                        return `${d}d ${h % 24}h`;
                      }
                      return h > 0 ? `${h}h ${m}m` : `${m}m`;
                    })()}
                    {!job.completedAt && <span className="text-xs font-normal text-gray-500"> (running)</span>}
                  </p>
                </div>
              )}
            </div>
          </Section>

          {/* Production Readiness Card */}
          {readiness && (
            <Section title="Readiness">
              {readinessLoading ? (
                <p className="text-xs text-gray-600">Checking...</p>
              ) : (
                <div className="space-y-3">
                  {/* Level badge */}
                  <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${
                    READINESS_COLORS[readiness.readiness?.level]?.bg || "bg-gray-50"
                  } ${READINESS_COLORS[readiness.readiness?.level]?.text || "text-gray-700"} ${
                    READINESS_COLORS[readiness.readiness?.level]?.border || "border-gray-200"
                  } border`}>
                    <span className={`h-2 w-2 rounded-full ${
                      READINESS_COLORS[readiness.readiness?.level]?.dot || "bg-gray-400"
                    }`} />
                    {(readiness.readiness?.level || "unknown").replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                  </div>

                  {/* Reasons */}
                  {readiness.readiness?.reasons?.length > 0 && (
                    <div className="space-y-1.5">
                      {readiness.readiness.reasons.map((r, i) => (
                        <div key={i} className={`flex items-start gap-1.5 text-xs ${
                          r.severity === "blocker" ? "text-red-700" : r.severity === "warning" ? "text-amber-700" : "text-gray-600"
                        }`}>
                          <span className="mt-0.5 shrink-0">{r.severity === "blocker" ? "●" : r.severity === "warning" ? "▲" : "○"}</span>
                          <span>{r.message}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Executable action */}
                  {readiness.executableAction && (
                    <div className="border-t border-gray-100 pt-2">
                      <p className="text-xs font-medium text-gray-700">Next Action</p>
                      <p className="mt-0.5 text-xs text-gray-600">{readiness.executableAction.action}</p>
                      {readiness.executableAction.toolLink && (
                        <Link
                          href={readiness.executableAction.toolLink}
                          className="mt-1 inline-block rounded border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                        >
                          Open Tool
                        </Link>
                      )}
                    </div>
                  )}

                  {/* Package files */}
                  {readiness.package && (
                    <div className="border-t border-gray-100 pt-2">
                      <p className="text-xs font-medium text-gray-700">
                        Files ({readiness.package.totalCount - readiness.package.missingCount}/{readiness.package.totalCount})
                      </p>
                      <div className="mt-1 space-y-1">
                        {readiness.package.files?.map((f, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs">
                            <span className={f.present ? "text-green-600" : "text-red-500"}>{f.present ? "✓" : "✗"}</span>
                            <span className={f.present ? "text-gray-600" : "text-red-600"}>{f.label}</span>
                            {f.present && f.url && (
                              <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">↗</a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Section>
          )}

          {/* Step-and-Repeat Layout (sticker/label only) */}
          {layoutData && layoutData.selectedLayout && (
            <Section title="Sheet Layout">
              <div className="space-y-3 text-xs">
                {layoutData.recommendation && (
                  <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2">
                    <p className="font-semibold text-blue-800">
                      Recommended: {layoutData.recommendation.sheetLabel}
                    </p>
                    <p className="text-blue-600">
                      {layoutData.recommendation.sheetsNeeded} sheet{layoutData.recommendation.sheetsNeeded !== 1 ? "s" : ""} needed · {layoutData.recommendation.totalWastePercent}% waste
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-gray-600">Item Size</p>
                    <p className="font-medium">{layoutData.itemWidthIn}" × {layoutData.itemHeightIn}"</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Quantity</p>
                    <p className="font-medium">{layoutData.quantity}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Per Sheet</p>
                    <p className="font-medium">{layoutData.selectedLayout.count}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Layout</p>
                    <p className="font-medium">
                      {layoutData.selectedLayout.cols}×{layoutData.selectedLayout.rows}
                      {layoutData.selectedLayout.rotated ? " (rotated)" : ""}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Utilization</p>
                    <p className="font-medium">{layoutData.selectedLayout.utilization}%</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Sheets Needed</p>
                    <p className="font-medium">{layoutData.selectedLayout.sheetsNeeded}</p>
                  </div>
                </div>

                {/* Visual grid preview */}
                {layoutData.selectedLayout.cols > 0 && layoutData.selectedLayout.rows > 0 && (
                  <div className="border-t border-gray-100 pt-2">
                    <p className="mb-1.5 text-gray-600">Preview</p>
                    <div
                      className="border border-gray-300 bg-white p-1 rounded"
                      style={{
                        aspectRatio: `${layoutData.selectedLayout.sheet?.widthIn || 13} / ${layoutData.selectedLayout.sheet?.heightIn || 19}`,
                        maxHeight: "120px",
                      }}
                    >
                      <div
                        className="grid gap-px h-full"
                        style={{
                          gridTemplateColumns: `repeat(${layoutData.selectedLayout.cols}, 1fr)`,
                          gridTemplateRows: `repeat(${layoutData.selectedLayout.rows}, 1fr)`,
                        }}
                      >
                        {Array.from({ length: Math.min(layoutData.selectedLayout.count, 100) }).map((_, i) => (
                          <div key={i} className="bg-blue-200 rounded-sm" />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Requirements */}
                {layoutData.requirements && (
                  <div className="border-t border-gray-100 pt-2 space-y-1">
                    {layoutData.requirements.needsContour && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-blue-600">◆</span>
                        <span>Contour cut ({layoutData.requirements.cutType})</span>
                      </div>
                    )}
                    {layoutData.requirements.needsWhiteInk && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-purple-600">◆</span>
                        <span>White ink layer needed</span>
                      </div>
                    )}
                    {layoutData.requirements.isLargeFormat && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-orange-600">◆</span>
                        <span>Large format (&gt;24&quot;)</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Quick Actions Card */}
          <Section title="Quick Actions">
            <div className="space-y-2">
              {/* Production documents */}
              {order && (
                <div className="flex gap-2 pb-2 mb-2 border-b border-gray-100">
                  <button
                    type="button"
                    onClick={() => window.open(`/api/admin/orders/${order.id}/manifest?format=text`, "_blank")}
                    className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100"
                  >
                    Manifest
                  </button>
                  <button
                    type="button"
                    onClick={() => window.open(`/api/admin/orders/${order.id}/packing-slip`, "_blank")}
                    className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100"
                  >
                    Packing Slip
                  </button>
                </div>
              )}
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

              {/* Split Job */}
              {job.quantity > 1 && !["finished", "shipped"].includes(job.status) && (
                <div className="border-t border-gray-100 pt-2 mt-2">
                  {!showSplit ? (
                    <button
                      type="button"
                      onClick={() => { setShowSplit(true); setSplitKeep(String(Math.floor(job.quantity / 2))); }}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100"
                    >
                      Split Job
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-600">
                        Split {job.quantity} into two jobs:
                      </p>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-600">Keep:</label>
                        <input
                          type="number"
                          min="1"
                          max={(job.quantity || 2) - 1}
                          value={splitKeep}
                          onChange={(e) => setSplitKeep(e.target.value)}
                          className="w-20 rounded border border-gray-300 px-2 py-1 text-xs outline-none focus:border-gray-900"
                        />
                        <span className="text-xs text-gray-600">
                          + {(job.quantity || 0) - (parseInt(splitKeep, 10) || 0)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleSplitJob}
                          disabled={splitting || !splitKeep || parseInt(splitKeep, 10) < 1 || parseInt(splitKeep, 10) >= job.quantity}
                          className="flex-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-[#fff] hover:bg-blue-700 disabled:bg-gray-400"
                        >
                          {splitting ? "Splitting..." : "Confirm Split"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowSplit(false)}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
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
                      <p className="text-gray-600">Capabilities</p>
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
      <p className="text-xs text-gray-600">{label}</p>
      <p className="mt-0.5 text-sm text-gray-900">{value}</p>
    </div>
  );
}
