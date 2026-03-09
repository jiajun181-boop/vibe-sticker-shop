/**
 * Shared time-ago helper for admin pages.
 * Accepts an i18n `t` function so labels are localised.
 *
 * Keys used:
 *   admin.time.justNow, admin.time.minsAgo, admin.time.hrsAgo, admin.time.daysAgo
 */
export function timeAgo(dateStr, t) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return t("admin.time.justNow");
  if (mins < 60) return t("admin.time.minsAgo").replace("{n}", mins);
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t("admin.time.hrsAgo").replace("{n}", hrs);
  return t("admin.time.daysAgo").replace("{n}", Math.floor(hrs / 24));
}
