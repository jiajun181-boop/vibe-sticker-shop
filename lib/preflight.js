/**
 * Basic preflight check utilities.
 * Runs checks on order items to flag potential production issues.
 * Returns an array of issues (empty = all clear).
 */
import { DESIGN_HELP_CENTS } from "@/lib/order-config";

/** Minimum recommended DPI for print products */
const MIN_DPI = 150;

/**
 * Run preflight checks on an order item's metadata.
 * @param {{
 *   meta: Record<string, any>,
 *   widthIn?: number | null,
 *   heightIn?: number | null,
 *   material?: string | null,
 *   productName?: string,
 * }} item
 * @returns {Array<{level: "error"|"warning"|"info", code: string, message: string}>}
 */
export function preflightItem(item) {
  const issues = [];
  const meta = item.meta && typeof item.meta === "object" ? item.meta : {};
  const family = detectProductFamily(item);

  // --- Intake-aware checks ---
  // These fields come from the configurator's intake system and describe
  // the customer's artwork/design intent at checkout time.

  // Artwork intent: customer chose "upload later" — not a blocker, just needs tracking
  const artworkIntent = meta.artworkIntent || null;
  if (artworkIntent === "upload-later") {
    const hasArtwork = !!(meta.fileName || meta.artworkUrl || meta.fileUrl || meta.stampPreviewUrl);
    issues.push({
      level: hasArtwork ? "info" : "warning",
      code: "upload_later",
      message: hasArtwork
        ? "Customer selected 'upload later' but artwork was provided — good to go"
        : "Customer selected 'upload later' — awaiting artwork upload before production",
    });
  }

  // Design help: customer opted into the paid design service
  const designHelp = meta.designHelp === true || meta.designHelp === "true";
  if (designHelp) {
    const fee = Number(meta.designHelpFee || DESIGN_HELP_CENTS);
    issues.push({
      level: "info",
      code: "design_help",
      message: `Customer requested design help ($${(fee / 100).toFixed(2)} fee included) — assign to designer`,
    });
  }

  // Rush production: customer paid the 30% rush surcharge
  const rushProduction = meta.rushProduction === true || meta.rushProduction === "true";
  if (rushProduction) {
    issues.push({
      level: "warning",
      code: "rush_production",
      message: "RUSH PRODUCTION — customer paid rush surcharge, prioritize in production queue",
    });
  }

  // 1. No artwork uploaded (skip if customer explicitly chose "upload later" — already flagged above)
  if (!meta.fileName && !meta.artworkUrl && !meta.fileUrl && !meta.stampPreviewUrl && artworkIntent !== "upload-later") {
    issues.push({
      level: "warning",
      code: "no_artwork",
      message: "No artwork file attached — may need manual follow-up",
    });
  }

  // 2. Proof not confirmed (for contour-based products)
  if (meta.proofConfirmed === false && (meta.contourSvg || meta.bleedMm)) {
    issues.push({
      level: "warning",
      code: "proof_not_confirmed",
      message: "Customer did not confirm the die-cut proof",
    });
  }

  // 3. Transparent material without white ink
  const transparentMaterials = [
    "clear-vinyl", "frosted-vinyl", "holographic-vinyl",
    "clear-static-cling", "frosted-static-cling", "clear-bopp",
  ];
  const effectiveMaterial = item.material || meta.material || "";
  if (effectiveMaterial && transparentMaterials.includes(effectiveMaterial)) {
    if (!meta.whiteInkMode || meta.whiteInkMode === "none") {
      issues.push({
        level: "info",
        code: "transparent_no_white",
        message: "Transparent material selected without white ink — customer may want color-only (intentional)",
      });
    }
  }

  // 4. Resolution check (if image dimensions are known)
  if (meta.imageWidth && meta.imageHeight && item.widthIn && item.heightIn) {
    const dpiW = meta.imageWidth / item.widthIn;
    const dpiH = meta.imageHeight / item.heightIn;
    const dpi = Math.min(dpiW, dpiH);
    if (dpi < MIN_DPI) {
      issues.push({
        level: "warning",
        code: "low_resolution",
        message: `Image resolution ~${Math.round(dpi)} DPI (recommended ≥${MIN_DPI} DPI)`,
      });
    }
  }

  // 5. Missing bleed/contour for sticker products
  const name = (item.productName || "").toLowerCase();
  if ((name.includes("die-cut") || name.includes("kiss-cut")) && !meta.bleedMm && !meta.bleedSvg) {
    issues.push({
      level: "info",
      code: "no_bleed",
      message: "No bleed data — contour may not have been generated",
    });
  }
  // Sticker rolls/sheets: no contour system — production must create die-line manually
  if ((name.includes("sticker roll") || name.includes("sticker sheet")) && !meta.contourSvg && !meta.bleedMm) {
    issues.push({
      level: "info",
      code: "no_contour_system",
      message: "No die-line/contour data — production will need to create cutting path from artwork",
    });
  }

  // 6. Missing dimensions for products that need them
  const needsDimensions = [
    "sticker", "label", "decal", "banner", "sign", "poster",
    "canvas", "magnet", "vinyl", "wrap", "print",
  ];
  const hasDimensions = (item.widthIn && item.heightIn) || (meta.width && meta.height);
  if (!hasDimensions && needsDimensions.some((kw) => name.includes(kw))) {
    issues.push({
      level: "error",
      code: "missing_dimensions",
      message: "Width or height is missing — cannot produce without knowing the size",
    });
  }

  // 7. Stamp order without preview image
  if ((name.includes("stamp") || meta.stampModel) && !meta.stampPreviewUrl) {
    issues.push({
      level: "warning",
      code: "stamp_no_preview",
      message: "Stamp order has no preview image — review before production",
    });
  }

  // 8. Canvas order without crop data
  if (name.includes("canvas") && !meta.cropX && !meta.cropY && !meta.cropData) {
    issues.push({
      level: "info",
      code: "canvas_no_crop",
      message: "Canvas order has no crop data — artwork will be used as-is",
    });
  }

  // 9. Large format needs special handling
  if (
    (item.widthIn && item.widthIn > 24) ||
    (item.heightIn && item.heightIn > 24)
  ) {
    issues.push({
      level: "info",
      code: "large_format",
      message: "Large format order (over 24\") — may need wide-format printer or special shipping",
    });
  }

  // 10. Two-sided print — customer only uploads one file, production needs both
  const isTwoSided =
    meta.sides === "double" || meta.sides === "2" || meta.sides === 2 ||
    meta.doubleSided === true;
  if (isTwoSided) {
    // For double-sided, production needs front + back. Flag if only one file provided.
    // Business cards use flat keys: frontArtworkUrl/backArtworkUrl
    const hasAnyFile = meta.artworkUrl || meta.fileUrl || meta.frontArtworkUrl;
    const hasBackFile = meta.backArtworkUrl || meta.backFileUrl;
    if (hasAnyFile && !hasBackFile) {
      issues.push({
        level: "warning",
        code: "two_sided_single_file",
        message: "Double-sided print — only one file uploaded. Check if customer sent both sides in one PDF, or follow up for back artwork.",
      });
    }
    if (!hasAnyFile) {
      issues.push({
        level: "warning",
        code: "two_sided_missing_art",
        message: "Double-sided print selected but no artwork uploaded",
      });
    }
  }

  // 11. Missing material selection
  const needsMaterial = [
    "sticker", "label", "decal", "vinyl", "banner", "sign", "wrap",
    "magnet", "cling",
  ];
  if (!item.material && !meta.material && !meta.stock && !meta.vinyl && needsMaterial.some((kw) => name.includes(kw))) {
    issues.push({
      level: "warning",
      code: "missing_material",
      message: "No material selected — production cannot start without knowing the material",
    });
  }

  // 12. Booklet missing page count
  if ((name.includes("booklet") || name.includes("catalog")) && !meta.pageCount) {
    issues.push({
      level: "error",
      code: "booklet_no_pages",
      message: "Booklet order missing page count — cannot estimate binding or paper usage",
    });
  }

  // 13. NCR missing part count / form type
  if (name.includes("ncr") || name.includes("carbonless")) {
    if (!meta.formType && !meta.parts) {
      issues.push({
        level: "error",
        code: "ncr_no_parts",
        message: "NCR form missing number of copies/parts — cannot produce",
      });
    }
  }

  // 14. White ink enabled but file not ready (server-persisted URL required)
  const whiteInkEnabled = !!(meta.whiteInkEnabled || (meta.whiteInkMode && meta.whiteInkMode !== "none"));
  if (whiteInkEnabled && !meta.whiteInkUrl) {
    issues.push({
      level: "warning",
      code: "white_ink_no_file",
      message: "White ink is enabled but the white layer file is not ready — hold for processing",
    });
  }

  // 15. Canvas missing edge treatment
  if (name.includes("canvas")) {
    if (!meta.edgeTreatment && !meta.frameColor) {
      issues.push({
        level: "info",
        code: "canvas_no_edge",
        message: "Canvas order has no edge treatment specified — will default to mirror wrap",
      });
    }
  }

  // 16. Banner/sign missing finishing (grommets, hemming, etc.)
  if ((name.includes("banner") || name.includes("flag")) && !meta.finishing && !item.finishing) {
    issues.push({
      level: "info",
      code: "banner_no_finishing",
      message: "Banner/flag has no finishing option (grommets, hemming, pole pockets) — check with customer",
    });
  }

  // 17. Roll label specific: missing shape or wind direction
  if (name.includes("roll label") || name.includes("roll-label")) {
    if (!meta.shape) {
      issues.push({
        level: "warning",
        code: "roll_label_no_shape",
        message: "Roll label missing shape selection",
      });
    }
    if (!meta.wind) {
      issues.push({
        level: "info",
        code: "roll_label_no_wind",
        message: "Roll label missing wind direction — will default to standard",
      });
    }
  }

  // 18. Vehicle wrap/graphics: missing vehicle body or type
  const isVehicle = name.includes("vehicle") || name.includes("wrap") || name.includes("fleet")
    || name.includes("door graphic") || name.includes("door decal") || meta.vehicleType || meta.vehicleBody;
  if (isVehicle) {
    if (!meta.vehicleType && !meta.type) {
      issues.push({
        level: "warning",
        code: "vehicle_no_type",
        message: "Vehicle order missing graphic type (full wrap, partial, door, decal, etc.)",
      });
    }
    // Wraps and door graphics need vehicle body; DOT/compliance/unit-numbers do not
    const typeId = (meta.vehicleType || meta.type || "").toLowerCase();
    const noBodyNeeded = typeId.includes("dot") || typeId.includes("compliance") || typeId.includes("unit");
    const needsVehicle = !noBodyNeeded && (typeId.includes("wrap") || typeId.includes("door") || typeId.includes("fleet") || typeId.includes("graphic"));
    if (needsVehicle && !meta.vehicleBody && !meta.vehicle) {
      issues.push({
        level: "warning",
        code: "vehicle_no_body",
        message: "Vehicle wrap/door graphic missing vehicle body type (car, van, truck, etc.)",
      });
    }
    // DOT/compliance should have text content
    if ((typeId.includes("dot") || typeId.includes("compliance")) && !meta.text) {
      issues.push({
        level: "warning",
        code: "vehicle_dot_no_text",
        message: "DOT/compliance order missing text content (USDOT number, company info)",
      });
    }
  }

  // 19. Missing finishing for standard print (e.g., lamination, folding)
  const isStandardPrint = name.includes("flyer") || name.includes("brochure") ||
    name.includes("postcard") || name.includes("poster") || name.includes("menu") ||
    name.includes("bookmark") || name.includes("rack card") || name.includes("door hanger");
  if (isStandardPrint && !meta.finishing && !item.finishing) {
    // Not an error — many products are "none" finishing. Just info for production.
    issues.push({
      level: "info",
      code: "print_no_finishing",
      message: "No finishing selected (no lamination, no folding) — print and cut only",
    });
  }

  // 20. Business card: multi-name needs multiple files
  if ((name.includes("business card") || meta.cardType) && meta.names && meta.names > 1) {
    // Each name variation needs its own file; check if enough files are provided
    const fileCount = typeof meta.fileName === "object" && meta.fileName
      ? Object.values(meta.fileName).filter(Boolean).length
      : meta.fileName ? 1 : 0;
    if (fileCount < meta.names) {
      issues.push({
        level: "info",
        code: "bc_multiname_files",
        message: `${meta.names} name variations ordered but only ${fileCount} file(s) uploaded — follow up for remaining artwork`,
      });
    }
  }

  // 21. Business card: foil with both sides = premium job, flag for production
  if (meta.foilSides === "both" || meta.foilCoverage === "full") {
    issues.push({
      level: "info",
      code: "bc_foil_premium",
      message: `Foil business card: ${meta.foilCoverage || "standard"} coverage, ${meta.foilSides === "both" ? "both sides" : "front only"} — requires foil press`,
    });
  }

  // 22. Roll label: food-safe label needs compliance check
  if (meta.foodUse === true || meta.foodUse === "yes") {
    issues.push({
      level: "info",
      code: "food_safe_label",
      message: "Food-safe label — verify ink and adhesive are food-contact compliant",
    });
  }

  // 23. Rush turnaround flag
  if (meta.turnaround === "rush" || meta.turnaround === "express" || meta.turnaround === "same-day") {
    issues.push({
      level: "warning",
      code: "rush_order",
      message: `Rush turnaround (${meta.turnaround}) — prioritize in production queue`,
    });
  }

  // 24. Standard print: fold type specified for brochures/menus
  if ((name.includes("brochure") || name.includes("menu")) && meta.fold && meta.fold !== "none") {
    issues.push({
      level: "info",
      code: "fold_type",
      message: `Fold type: ${meta.fold} — production must score/fold after printing`,
    });
  }

  // 25. Standard print: numbering (tickets, tags, order forms)
  if (meta.numbering && !meta.numberStart) {
    issues.push({
      level: "warning",
      code: "numbering_no_start",
      message: "Numbering enabled but starting number not specified — confirm with customer",
    });
  }

  // 26. Sign/display: large dimensions need special handling
  const isSign = family === "sign" || family === "banner";
  if (isSign && ((item.widthIn && item.widthIn > 48) || (item.heightIn && item.heightIn > 48))) {
    issues.push({
      level: "info",
      code: "oversized_sign",
      message: "Large format sign (over 48\") — may require panel joining or special substrate",
    });
  }

  // 27. Vehicle: lamination strongly recommended for exterior graphics
  if (isVehicle) {
    const typeId = (meta.vehicleType || meta.type || "").toLowerCase();
    const isExterior = typeId.includes("wrap") || typeId.includes("door") || typeId.includes("fleet") || typeId.includes("decal");
    if (isExterior && !meta.lamination && !meta.laminate) {
      issues.push({
        level: "warning",
        code: "vehicle_no_lamination",
        message: "Exterior vehicle graphic without lamination — highly recommended for UV/weather protection",
      });
    }
    // Fleet order with multiple vehicles
    if (meta.fleetSize && meta.fleetSize > 1) {
      issues.push({
        level: "info",
        code: "vehicle_fleet",
        message: `Fleet order: ${meta.fleetSize} vehicles — confirm if same design or variations per vehicle`,
      });
    }
    // Installation type
    if (meta.installationType === "customer" || meta.installationType === "self") {
      issues.push({
        level: "info",
        code: "vehicle_self_install",
        message: "Customer will self-install — include application instructions with shipment",
      });
    }
  }

  // 28. Sticker/label: contour applied from tool (production info)
  if ((family === "sticker" || family === "label") && meta.contourSvg && meta.contourAppliedAt) {
    issues.push({
      level: "info",
      code: "contour_applied",
      message: `Contour applied via tool on ${new Date(meta.contourAppliedAt).toLocaleDateString()} — bleed: ${meta.bleedMm || "?"}mm`,
    });
  }

  // 29. Standard print: coating selected (production flow info)
  if (meta.coating && meta.coating !== "none") {
    issues.push({
      level: "info",
      code: "coating_required",
      message: `Coating: ${meta.coating} — requires coating machine after printing`,
    });
  }

  // 30. Sign/display: yard sign without hardware info
  if (family === "sign" && (name.includes("yard") || name.includes("lawn"))) {
    if (!meta.hardware) {
      issues.push({
        level: "info",
        code: "yard_sign_no_hardware",
        message: "Yard sign without hardware selection — confirm if customer needs H-stakes or frames",
      });
    }
  }

  // 31. Sign: aluminum/pvc without thickness
  if (family === "sign" && (name.includes("aluminum") || name.includes("pvc") || name.includes("foam board"))) {
    if (!meta.thickness) {
      issues.push({
        level: "info",
        code: "sign_no_thickness",
        message: "Rigid sign substrate without thickness specified — using default stock",
      });
    }
  }

  // 32. Banner: vinyl banner without finishing (grommets/hem/pole pocket)
  if (family === "banner" && name.includes("banner") && !meta.grommetSpacing && !meta.polePocketPos && !meta.hemming && !meta.finishing && !item.finishing) {
    issues.push({
      level: "warning",
      code: "banner_no_finishing_detail",
      message: "Vinyl banner without grommets, hemming, or pole pockets — must confirm finishing before production",
    });
  }

  // 33. Retractable/display banner: missing tier or order type
  if (family === "sign" && (name.includes("retractable") || name.includes("x-banner") || name.includes("tabletop"))) {
    if (!meta.tier && !meta.orderType) {
      issues.push({
        level: "info",
        code: "display_no_tier",
        message: "Display/retractable banner without tier — check if graphic-only or full stand",
      });
    }
  }

  // 34. Sticker/label: transparent material needs production attention
  if ((family === "sticker" || family === "label") && effectiveMaterial && transparentMaterials.includes(effectiveMaterial)) {
    issues.push({
      level: "info",
      code: "transparent_material_production",
      message: `Transparent material (${effectiveMaterial.replace(/-/g, " ")}) — print on clear; verify artwork has no unintended transparent areas`,
    });
  }

  // 35. Floor graphic: must have anti-slip lamination
  if ((name.includes("floor") || meta.application === "floor") && !meta.floorLamination) {
    issues.push({
      level: "warning",
      code: "floor_no_lamination",
      message: "Floor graphic without anti-slip lamination — required for safety compliance",
    });
  }

  // 36. Window film/graphic: adhesive type matters for installation
  if (family === "sign" && (name.includes("window") || name.includes("perforated"))) {
    if (!meta.adhesive && !meta.adhesiveSide) {
      issues.push({
        level: "info",
        code: "window_no_adhesive_type",
        message: "Window graphic without adhesive type specified — confirm static-cling, front-adhesive, or back-adhesive",
      });
    }
  }

  // 37. A-frame sign: needs frame info
  if (family === "sign" && name.includes("a-frame")) {
    if (!meta.frame) {
      issues.push({
        level: "info",
        code: "aframe_no_frame",
        message: "A-frame sign without frame specification — check if graphic-only or with frame",
      });
    }
  }

  // 38. Vinyl lettering: needs text content
  if (name.includes("vinyl lettering") || name.includes("cut vinyl")) {
    if (!meta.letteringText && !meta.text) {
      issues.push({
        level: "error",
        code: "vinyl_lettering_no_text",
        message: "Vinyl lettering order missing text content — cannot produce without lettering text",
      });
    }
  }

  // 39. Multi-item same family — production batching opportunity
  // (handled at order level, not per-item — skip here)

  // 40. Food-safe + transparent = compliance double-check
  if ((meta.foodUse === true || meta.foodUse === "yes") && effectiveMaterial && transparentMaterials.includes(effectiveMaterial)) {
    issues.push({
      level: "warning",
      code: "food_transparent_compliance",
      message: "Food-safe label on transparent material — verify both adhesive AND ink are food-contact rated",
    });
  }

  return issues;
}

/**
 * Detect product family from item data — used by admin to show family-specific info.
 * @param {{ productName?: string, meta?: Record<string, any> }} item
 * @returns {"sticker"|"label"|"stamp"|"canvas"|"banner"|"sign"|"booklet"|"ncr"|"business-card"|"vehicle"|"standard-print"|"other"}
 */
export function detectProductFamily(item) {
  const name = (item.productName || "").toLowerCase();
  const meta = item.meta && typeof item.meta === "object" ? item.meta : {};
  if (meta.stampModel || meta.stampPreviewUrl || name.includes("stamp")) return "stamp";
  if (name.includes("canvas")) return "canvas";
  if (name.includes("die-cut") || name.includes("kiss-cut")) return "sticker";
  if (name.includes("sticker roll") || name.includes("sticker sheet")) return "sticker";
  if (name.includes("roll label") || name.includes("roll-label")) return "label";
  // Vehicle family — must check before generic "decal" / "sign"
  if (meta.vehicleType || meta.vehicleBody || name.includes("vehicle") || name.includes("fleet")
    || name.includes("wrap") || name.includes("dot number") || name.includes("dot-number")
    || name.includes("usdot") || name.includes("cvor") || name.includes("compliance kit")
    || name.includes("magnetic car") || name.includes("magnetic truck")
    || name.includes("door graphic") || name.includes("door decal") || name.includes("truck door")) return "vehicle";
  if (name.includes("label") || name.includes("decal")) return "label";
  if (name.includes("ncr") || name.includes("carbonless")) return "ncr";
  if (name.includes("booklet") || name.includes("catalog")) return "booklet";
  if (name.includes("business card") || meta.cardType) return "business-card";
  if (name.includes("banner") || name.includes("flag") || name.includes("backdrop")) return "banner";
  if (name.includes("sign") || name.includes("foam board") || name.includes("pvc") || name.includes("aluminum") || name.includes("yard")) return "sign";
  if (name.includes("retractable") || name.includes("x-banner") || name.includes("display") || name.includes("tabletop")) return "sign";
  if (name.includes("wall") || name.includes("floor") || name.includes("window") || name.includes("vinyl lettering")) return "sign";
  if (name.includes("a-frame") || name.includes("shelf") || name.includes("magnetic sign")) return "sign";
  if (name.includes("surface")) return "sign";
  return "standard-print";
}

/**
 * Build a plain-language specs summary for admin / CS from order item data.
 * Returns an array of { label, value } lines.
 * @param {{ productName?: string, quantity?: number, widthIn?: number, heightIn?: number, material?: string, finishing?: string, meta?: Record<string, any>, specsJson?: Record<string, any> }} item
 * @returns {Array<{ label: string, value: string }>}
 */
export function buildSpecsSummary(item) {
  const meta = {
    ...(item.specsJson && typeof item.specsJson === "object" ? item.specsJson : {}),
    ...(item.meta && typeof item.meta === "object" ? item.meta : {}),
  };
  const lines = [];
  const family = detectProductFamily(item);
  const fmt = (s) => s ? s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "";

  // Quantity
  lines.push({ label: "Qty", value: String(item.quantity || 1) });

  // Dimensions
  const w = item.widthIn || meta.width;
  const h = item.heightIn || meta.height;
  if (w && h) {
    lines.push({ label: "Size", value: meta.sizeLabel || `${w}" × ${h}"` });
  } else if (meta.sizeLabel) {
    lines.push({ label: "Size", value: meta.sizeLabel });
  }

  // Material / Paper / Stock
  const mat = item.material || meta.material || meta.stock || meta.labelType || meta.interiorPaper;
  if (mat) lines.push({ label: family === "standard-print" || family === "business-card" || family === "booklet" ? "Paper" : "Material", value: fmt(mat) });

  // Sides
  const sides = meta.sides;
  if (sides) {
    const label = sides === "double" || sides === "2" || sides === 2 ? "Double-Sided" : "Single-Sided";
    lines.push({ label: "Sides", value: label });
  }

  // Finishing
  const fin = item.finishing || meta.finishing;
  if (fin && fin !== "none") lines.push({ label: "Finishing", value: fmt(fin) });

  // Family-specific fields
  if (family === "sticker" || family === "label") {
    if (meta.finish || meta.finishName) lines.push({ label: "Finish", value: fmt(meta.finishName || meta.finish) });
    if (meta.shape) lines.push({ label: "Shape", value: fmt(meta.shape) });
    if (meta.backing) lines.push({ label: "Backing", value: fmt(meta.backingName || meta.backing) });
    if (meta.stickerSize) lines.push({ label: "Sticker Size", value: meta.stickerSize });
    if (meta.sheetSize) lines.push({ label: "Sheet Size", value: fmt(meta.sheetSize) });
    if (meta.cutStyle) lines.push({ label: "Cut Style", value: fmt(meta.cutStyle) });
    if (meta.application) lines.push({ label: "Application", value: fmt(meta.application) });
    if (meta.vinyl) lines.push({ label: "Vinyl", value: fmt(meta.vinyl) });
    if (meta.adhesiveSide) lines.push({ label: "Adhesive", value: fmt(meta.adhesiveSide) });
    if (meta.durability) lines.push({ label: "Durability", value: fmt(meta.durability) });
    if (meta.floorLamination) lines.push({ label: "Floor Lamination", value: "Anti-slip" });
    const whiteInk = meta.whiteInkEnabled || (meta.whiteInkMode && meta.whiteInkMode !== "none");
    if (whiteInk) {
      const mode = meta.whiteInkMode === "auto" ? "Automatic" : meta.whiteInkMode === "follow" ? "Match Design" : meta.whiteInkMode === "custom" ? "Custom Upload" : "Yes";
      const status = meta.whiteInkUrl ? " (ready)" : " (pending)";
      lines.push({ label: "White Ink", value: mode + status });
    }
    if (meta.proofConfirmed) lines.push({ label: "Proof", value: "Confirmed" });
    if (meta.contourSvg || meta.contourAppliedAt) lines.push({ label: "Contour", value: meta.contourAppliedAt ? `Applied ${new Date(meta.contourAppliedAt).toLocaleDateString()}` : "Generated" });
    if (meta.bleedMm) lines.push({ label: "Bleed", value: `${meta.bleedMm}mm` });
    if (meta.processedImageUrl) lines.push({ label: "BG Removed", value: "Yes" });
  }

  if (family === "stamp") {
    if (meta.stampModel) lines.push({ label: "Model", value: meta.stampModel });
    if (meta.shape) lines.push({ label: "Shape", value: fmt(meta.shape) });
    if (meta.stampText || meta.editorText) {
      const txt = (meta.stampText || meta.editorText || "").substring(0, 40);
      lines.push({ label: "Text", value: txt + (txt.length >= 40 ? "…" : "") });
    }
    if (meta.stampFont || meta.editorFont) lines.push({ label: "Font", value: meta.stampFont || meta.editorFont });
  }

  if (family === "canvas") {
    if (meta.canvasType) lines.push({ label: "Type", value: fmt(meta.canvasType) });
    if (meta.panels && meta.panels > 1) lines.push({ label: "Panels", value: String(meta.panels) });
    if (meta.barDepth) lines.push({ label: "Bar Depth", value: `${meta.barDepth}"` });
    if (meta.gapInches) lines.push({ label: "Panel Gap", value: `${meta.gapInches}"` });
    if (meta.edgeTreatment) lines.push({ label: "Edge", value: fmt(meta.edgeTreatment) });
    if (meta.frameColor) lines.push({ label: "Frame", value: fmt(meta.frameColor) });
    if (meta.printMode) lines.push({ label: "Print", value: fmt(meta.printMode) });
    lines.push({ label: "Crop", value: meta.cropData || meta.cropX ? "Set" : "Not set" });
  }

  if (family === "booklet") {
    if (meta.binding) lines.push({ label: "Binding", value: fmt(meta.binding) });
    if (meta.pageCount) lines.push({ label: "Pages", value: String(meta.pageCount) });
    if (meta.interiorPaper) lines.push({ label: "Interior Paper", value: fmt(meta.interiorPaper) });
    if (meta.coverPaper) lines.push({ label: "Cover Paper", value: fmt(meta.coverPaper) });
    if (meta.coverCoating && meta.coverCoating !== "none") lines.push({ label: "Cover Coating", value: fmt(meta.coverCoating) });
  }

  if (family === "ncr") {
    if (meta.formType) lines.push({ label: "Form Type", value: fmt(meta.formType) });
    if (meta.parts) lines.push({ label: "Parts", value: `${meta.parts}-part` });
    if (meta.printColor) lines.push({ label: "Print", value: fmt(meta.printColor) });
    if (meta.binding) lines.push({ label: "Binding", value: fmt(meta.binding) });
    if (meta.numbering) lines.push({ label: "Numbering", value: meta.numberStart ? `#${meta.numberStart}–${meta.numberEnd}` : "Yes" });
  }

  if (family === "business-card") {
    if (meta.cardType) lines.push({ label: "Card Type", value: fmt(meta.cardType) });
    if (meta.layer) lines.push({ label: "Thickness", value: fmt(meta.layer) });
    if (meta.foilCoverage) lines.push({ label: "Foil", value: `${fmt(meta.foilCoverage)}${meta.foilSides === "both" ? " (both sides)" : ""}` });
    if (meta.rounded) lines.push({ label: "Corners", value: "Rounded" });
    if (meta.names && meta.names > 1) lines.push({ label: "Names", value: `${meta.names} variations (${meta.totalCards || meta.names * (meta.printQuantity || 1)} total)` });
  }

  if (family === "vehicle") {
    if (meta.vehicleType) lines.push({ label: "Type", value: fmt(meta.vehicleType || meta.type) });
    if (meta.vehicleBody || meta.vehicle) lines.push({ label: "Vehicle", value: fmt(meta.vehicleBody || meta.vehicle) });
    if (meta.vehicleYear) lines.push({ label: "Year", value: String(meta.vehicleYear) });
    if (meta.vehicleMake) lines.push({ label: "Make", value: fmt(meta.vehicleMake) });
    if (meta.vehicleModel) lines.push({ label: "Model", value: fmt(meta.vehicleModel) });
    if (meta.coverage) lines.push({ label: "Coverage", value: fmt(meta.coverage) });
    if (meta.fleetSize && meta.fleetSize > 1) lines.push({ label: "Fleet Size", value: `${meta.fleetSize} vehicles` });
    if (meta.lamination) lines.push({ label: "Lamination", value: fmt(meta.lamination) });
    if (meta.vinyl || meta.material) lines.push({ label: "Vinyl", value: fmt(meta.vinyl || meta.material) });
    if (meta.color) lines.push({ label: "Color", value: fmt(meta.color) });
    if (meta.text) {
      const txt = meta.text.length > 40 ? meta.text.substring(0, 40) + "…" : meta.text;
      lines.push({ label: "Text", value: txt });
    }
    if (meta.dotNumber || meta.usdotNumber) lines.push({ label: "DOT #", value: meta.dotNumber || meta.usdotNumber });
    if (meta.mcNumber) lines.push({ label: "MC #", value: meta.mcNumber });
    if (meta.cvorNumber) lines.push({ label: "CVOR #", value: meta.cvorNumber });
    if (meta.companyName && !meta.text) lines.push({ label: "Company", value: meta.companyName });
    if (meta.installationType) lines.push({ label: "Installation", value: fmt(meta.installationType) });
    if (meta.turnaround) lines.push({ label: "Turnaround", value: fmt(meta.turnaround) });
  }

  // Standard print family: flyers, brochures, postcards, menus, posters, notepads, etc.
  if (family === "standard-print") {
    if (meta.coating && meta.coating !== "none") lines.push({ label: "Coating", value: fmt(meta.coating) });
    if (meta.fold && meta.fold !== "none") lines.push({ label: "Fold", value: fmt(meta.fold) });
    if (meta.printing) lines.push({ label: "Printing", value: fmt(meta.printing) });
    if (meta.holePunch) lines.push({ label: "Hole Punch", value: fmt(meta.holePunch) });
    if (meta.scoring) lines.push({ label: "Scoring", value: "Yes" });
    if (meta.numbering) lines.push({ label: "Numbering", value: meta.numberStart ? `#${meta.numberStart}–${meta.numberEnd || "..."}` : "Yes" });
    if (meta.perforation) lines.push({ label: "Perforation", value: "Yes" });
    if (meta.binding && meta.binding !== "none") lines.push({ label: "Binding", value: fmt(meta.binding) });
    if (meta.turnaround && meta.turnaround !== "standard") lines.push({ label: "Turnaround", value: fmt(meta.turnaround) });
    if (meta.pageCount) lines.push({ label: "Pages", value: String(meta.pageCount) });
    if (meta.tabCount) lines.push({ label: "Tabs", value: String(meta.tabCount) });
    if (meta.padCount) lines.push({ label: "Pads", value: String(meta.padCount) });
  }

  if (family === "banner" || family === "sign") {
    if (meta.bannerType) lines.push({ label: "Type", value: fmt(meta.bannerType) });
    if (meta.signType) lines.push({ label: "Type", value: fmt(meta.signType) });
    // Wall/floor/window type field
    if (!meta.bannerType && !meta.signType && meta.type) lines.push({ label: "Type", value: fmt(meta.type) });
    if (meta.grommetSpacing) lines.push({ label: "Grommets", value: fmt(meta.grommetSpacing) });
    if (meta.polePocketPos) lines.push({ label: "Pole Pocket", value: `${fmt(meta.polePocketPos)} ${meta.polePocketSize || ""}`.trim() });
    if (meta.thickness) lines.push({ label: "Thickness", value: fmt(meta.thickness) });
    if (meta.mounting) lines.push({ label: "Mounting", value: fmt(meta.mounting) });
    if (meta.corners) lines.push({ label: "Corners", value: fmt(meta.corners) });
    if (meta.holes) lines.push({ label: "Holes", value: fmt(meta.holes) });
    if (meta.reflective) lines.push({ label: "Reflective", value: "Yes" });
    if (meta.hardware) lines.push({ label: "Hardware", value: fmt(meta.hardware) });
    if (meta.frame) lines.push({ label: "Frame", value: fmt(meta.frame) });
    if (meta.lamination) lines.push({ label: "Lamination", value: fmt(meta.lamination) });
    if (meta.orderType) lines.push({ label: "Order Type", value: fmt(meta.orderType) });
    if (meta.tier) lines.push({ label: "Tier", value: fmt(meta.tier) });
    if (meta.application) lines.push({ label: "Application", value: fmt(meta.application) });
    if (meta.purchaseType) lines.push({ label: "Purchase", value: fmt(meta.purchaseType) });
    if (meta.turnaround) lines.push({ label: "Turnaround", value: fmt(meta.turnaround) });
    // Vinyl lettering specific
    if (meta.letteringText) {
      const txt = meta.letteringText.substring(0, 40);
      lines.push({ label: "Text", value: txt + (txt.length >= 40 ? "…" : "") });
    }
    if (meta.font) lines.push({ label: "Font", value: meta.font });
    if (meta.letterHeight) lines.push({ label: "Letter Height", value: `${meta.letterHeight}"` });
    if (meta.color && !meta.foilCoverage) lines.push({ label: "Color", value: fmt(meta.color) });
    // Window film specific
    if (meta.adhesive) lines.push({ label: "Adhesive", value: fmt(meta.adhesive) });
  }

  // Decal specific
  if (family === "label" && meta.application) {
    lines.push({ label: "Application", value: fmt(meta.application) });
    if (meta.vinyl) lines.push({ label: "Vinyl", value: fmt(meta.vinyl) });
    if (meta.adhesiveSide) lines.push({ label: "Adhesive Side", value: fmt(meta.adhesiveSide) });
    if (meta.durability) lines.push({ label: "Durability", value: fmt(meta.durability) });
  }

  // Safety/industrial label specific
  if (family === "label" && meta.category) {
    lines.push({ label: "Category", value: fmt(meta.category) });
  }
  if (family === "label" && meta.adhesive && !meta.adhesiveSide) {
    lines.push({ label: "Adhesive", value: fmt(meta.adhesive) });
  }
  if (family === "label" && meta.type && !meta.application) {
    lines.push({ label: "Type", value: fmt(meta.type) });
  }

  // Roll labels specific
  if (family === "label" && (meta.wind || meta.labelsPerRoll || meta.perforation !== undefined)) {
    if (meta.ink) lines.push({ label: "Ink", value: fmt(meta.ink) });
    if (meta.wind) lines.push({ label: "Wind", value: fmt(meta.wind) });
    if (meta.labelsPerRoll) lines.push({ label: "Per Roll", value: String(meta.labelsPerRoll) });
    if (meta.perforation) lines.push({ label: "Perforation", value: "Yes" });
    if (meta.foodUse) lines.push({ label: "Food Safe", value: "Yes" });
    if (meta.turnaround && meta.turnaround !== "standard") lines.push({ label: "Turnaround", value: fmt(meta.turnaround) });
  }

  // Sticker rolls/sheets — shape & wind if present
  if (family === "sticker" && meta.wind) {
    lines.push({ label: "Wind", value: fmt(meta.wind) });
  }
  if (family === "sticker" && meta.cutStyle) {
    lines.push({ label: "Cut Style", value: fmt(meta.cutStyle) });
  }
  if (family === "sticker" && meta.backing) {
    lines.push({ label: "Backing", value: fmt(meta.backing) });
  }

  return lines;
}

/**
 * Run preflight on all items in an order.
 * @param {Array} items — order items with meta, widthIn, heightIn, material, productName
 * @returns {Array<{itemIndex: number, productName: string, issues: Array}>}
 */
export function preflightOrder(items) {
  const results = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const issues = preflightItem(item);
    if (issues.length > 0) {
      results.push({
        itemIndex: i,
        productName: item.productName || `Item ${i + 1}`,
        issues,
      });
    }
  }
  return results;
}
