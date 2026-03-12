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

// ---------------------------------------------------------------------------
// Internal: safely parse meta from an item
// ---------------------------------------------------------------------------
function parseMeta(item) {
  if (!item) return {};
  if (item.meta && typeof item.meta === "object") return item.meta;
  return {};
}

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

// ---------------------------------------------------------------------------
// hasArtworkUrl(item)  — does the item have at least one real artwork URL?
// ---------------------------------------------------------------------------
export function hasArtworkUrl(item) {
  if (!item) return false;
  const meta = parseMeta(item);

  return !!(
    // String artworkUrl
    (isNonEmptyString(meta.artworkUrl)) ||
    // Object artworkUrl { front, back }
    (meta.artworkUrl && typeof meta.artworkUrl === "object" && (meta.artworkUrl.front || meta.artworkUrl.back)) ||
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
export function getArtworkStatus(item) {
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
const STATUS_SEVERITY = {
  "missing":        5,
  "file-name-only": 4,
  "upload-later":   3,
  "design-help":    2,
  "provided":       1,
  "uploaded":       0,
};

export function scanOrderArtwork(items) {
  const flags = new Set();
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
