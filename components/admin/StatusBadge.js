import { statusLabel, statusColor } from "@/lib/admin/status-labels";

/**
 * Shared StatusBadge for all admin pages.
 * Displays a pill-shaped badge with i18n label and consistent color.
 */
export default function StatusBadge({ status, t }) {
  const colors = statusColor(status);
  const label = statusLabel(status, t);
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${colors}`}>
      {label}
    </span>
  );
}
