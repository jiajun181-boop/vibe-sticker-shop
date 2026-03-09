/**
 * Shared human-readable labels for order timeline event actions.
 * Used by admin order detail, customer tracking, and workstation views.
 */
export const TIMELINE_LABELS = {
  order_created: "Order placed",
  status_updated: "Status updated",
  payment_received: "Payment confirmed",
  note_added: "Note added",
  shipped: "Order shipped",
  refund_issued: "Refund issued",
  preflight_approved: "Files approved",
  proof_uploaded: "Proof uploaded",
  proof_approved: "Proof approved",
  proof_rejected: "Proof revision requested",
  production_started: "Production started",
  quality_check: "Quality check",
  order_canceled: "Order canceled",
  tracking_added: "Tracking number added",
  file_uploaded: "File uploaded",
  priority_changed: "Priority changed",
  assigned: "Job assigned",
  bulk_update: "Bulk status update",
  order_duplicated: "Order duplicated",
  production_status_updated: "Production status updated",
  order_updated: "Order updated",
  completed: "Order completed",
  ready_to_ship: "Ready to ship",
  canceled: "Order canceled",
  created: "Order created (manual)",
  full_refund: "Full refund issued",
  partial_refund: "Partial refund issued",
  preflight_rejected: "Files need revision",
  qc_defect_reported: "QC defect reported",
  production_hold: "Production on hold",
  qc_resolved: "QC issue resolved",
};

/**
 * Get a human-readable label for a timeline action string.
 */
export function getActionLabel(action) {
  return TIMELINE_LABELS[action] || action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
