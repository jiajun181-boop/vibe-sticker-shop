/**
 * Shared artwork detection utilities.
 *
 * Every place that needs to decide "does this order-item have a real
 * artwork file?" should import from here so the logic stays in sync.
 *
 * Fields checked (in order):
 *   meta.artworkUrl        — string or { front, back } object
 *   meta.fileUrl           — string
 *   item.fileUrl           — string (DB column)
 *   meta.frontArtworkUrl   — string (business-card front)
 *   meta.backArtworkUrl    — string (business-card back)
 *   meta.stampPreviewUrl   — string (stamp studio preview)
 */

import { isServiceFeeItem } from "@/lib/order-item-utils";

// ---------------------------------------------------------------------------
// Internal: safely parse meta from an item
// ---------------------------------------------------------------------------
function parseMeta(item: Record<string, unknown>) {
  if (!item) return {} as Record<string, unknown>;
  if (item.meta && typeof item.meta === "object") return item.meta as Record<string, unknown>;
  return {} as Record<string, unknown>;
}

function isNonEmptyString(v: unknown): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

// ---------------------------------------------------------------------------
// hasArtworkUrl(item)  — does the item have at least one real artwork URL?
// ---------------------------------------------------------------------------
export function hasArtworkUrl(item: Record<string, unknown>): boolean {
  if (!item) return false;
  const meta = parseMeta(item);

  return !!(
    // String artworkUrl
    (isNonEmptyString(meta.artworkUrl)) ||
    // Object artworkUrl { front, back }
    (meta.artworkUrl && typeof meta.artworkUrl === "object" && ((meta.artworkUrl as Record<string, unknown>).front || (meta.artworkUrl as Record<string, unknown>).back)) ||
    // meta.fileUrl
    (isNonEmptyString(meta.fileUrl)) ||
    // item.fileUrl (DB column)
    (isNonEmptyString(item.fileUrl)) ||
    // Business-card flat keys
    (isNonEmptyString(meta.frontArtworkUrl)) ||
    (isNonEmptyString(meta.backArtworkUrl)) ||
    // Stamp preview
    (isNonEmptyString(meta.stampPreviewUrl))
  );
}

// ---------------------------------------------------------------------------
// getArtworkStatus(item) — returns a single status string
//   "uploaded"       — at least one real URL exists
//   "provided"       — admin confirmed artwork exists off-platform (not uploaded to system yet)
//   "file-name-only" — meta.fileName present but no real URL
//   "upload-later"   — customer chose "upload later", no URL yet
//   "design-help"    — design help requested
//   "missing"        — none of the above
// ---------------------------------------------------------------------------
export function getArtworkStatus(item: Record<string, unknown>): string {
  if (!item) return "missing";
  const meta = parseMeta(item);
  const hasUrl = hasArtworkUrl(item);

  if (hasUrl) return "uploaded";

  // Artwork provided off-platform (admin manual order intent)
  if (meta.artworkIntent === "provided") {
    return "provided";
  }

  // Design help (can be boolean true, string "true", or artworkIntent)
  if (meta.designHelp === true || meta.designHelp === "true" || meta.artworkIntent === "design-help") {
    return "design-help";
  }

  // Upload later with no file yet
  if (meta.artworkIntent === "upload-later") {
    return "upload-later";
  }

  // Has a file name but the URL is missing (failed upload, etc.)
  if (meta.fileName) {
    return "file-name-only";
  }

  return "missing";
}

// ---------------------------------------------------------------------------
// scanOrderArtwork(items)
//   Scans ALL items in an order and returns a summary object:
//   {
//     hasArt   — boolean, at least one item has a real URL
//     allArt   — boolean, every item has a real URL
//     worst    — the single worst status across all items (for badge display)
//     flags    — Set<string> of flags: "NO_ART", "DESIGN", "UPLOAD_LATER",
//                "FILE_NAME_ONLY"
//   }
// ---------------------------------------------------------------------------
const STATUS_SEVERITY: Record<string, number> = {
  "missing":        5,
  "file-name-only": 4,
  "upload-later":   3,
  "design-help":    2,
  "provided":       1,
  "uploaded":       0,
};

export function scanOrderArtwork(items: Record<string, unknown>[]) {
  const flags = new Set<string>();
  let hasArt = false;
  let allArt = true;
  let worstSeverity = 0;
  let worst = "uploaded";

  if (!items || items.length === 0) {
    return { hasArt: false, allArt: false, worst: "missing", flags: new Set(["NO_ART"]) };
  }

  for (const item of items) {
    const status = getArtworkStatus(item);

    if (status === "uploaded") {
      hasArt = true;
    } else {
      allArt = false;
    }

    // Track flags
    switch (status) {
      case "missing":
        flags.add("NO_ART");
        break;
      case "file-name-only":
        flags.add("FILE_NAME_ONLY");
        flags.add("NO_ART"); // still counts as no-art for badge purposes
        break;
      case "upload-later":
        flags.add("UPLOAD_LATER");
        flags.add("NO_ART");
        break;
      case "design-help":
        flags.add("DESIGN");
        break;
      case "provided":
        flags.add("PROVIDED");
        break;
      // "uploaded" — no flag needed
    }

    // Track worst status
    const sev = STATUS_SEVERITY[status] || 0;
    if (sev > worstSeverity) {
      worstSeverity = sev;
      worst = status;
    }
  }

  return { hasArt, allArt, worst, flags };
}

// ---------------------------------------------------------------------------
// Customer-facing detection helpers
// Used by upload APIs, track-order, account files, admin missing-artwork,
// and reminder route — single source of truth.
// ---------------------------------------------------------------------------

interface ItemLike {
  fileUrl?: string | null;
  fileName?: string | null;
  meta?: Record<string, unknown> | null;
}

/**
 * Returns true when the item already has artwork attached (item-level).
 * Mirrors hasArtworkUrl but accepts typed ItemLike for API routes.
 */
export function itemHasArtwork(item: ItemLike): boolean {
  return hasArtworkUrl(item as Record<string, unknown>);
}

/**
 * Returns true when the item is a design-help request
 * (customer expects team to create artwork — no upload needed).
 *
 * Checks both boolean and string forms of designHelp to match
 * getArtworkStatus() semantics (admin create sets designHelp: "true").
 */
export function itemIsDesignHelp(item: ItemLike): boolean {
  const meta =
    item.meta && typeof item.meta === "object"
      ? (item.meta as Record<string, unknown>)
      : {};
  return meta.artworkIntent === "design-help" || meta.designHelp === true || meta.designHelp === "true";
}

/**
 * Returns true when the admin confirmed artwork exists off-platform
 * (manual order with artworkIntent "provided" — no upload needed from customer).
 */
export function itemIsArtworkProvided(item: ItemLike): boolean {
  const meta =
    item.meta && typeof item.meta === "object"
      ? (item.meta as Record<string, unknown>)
      : {};
  return meta.artworkIntent === "provided";
}

/**
 * Returns true when the item still needs artwork from the customer.
 * Excludes:
 *   - service-fee rows (financial line items, not producible)
 *   - items with artwork uploaded
 *   - design-help items (team creates artwork)
 *   - items where admin confirmed artwork is provided off-platform
 */
export function itemNeedsArtwork(item: ItemLike): boolean {
  if (isServiceFeeItem(item as { meta?: unknown })) return false;
  return !itemHasArtwork(item) && !itemIsDesignHelp(item) && !itemIsArtworkProvided(item);
}
