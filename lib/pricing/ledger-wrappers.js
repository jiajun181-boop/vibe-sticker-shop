// lib/pricing/ledger-wrappers.js
// ═══════════════════════════════════════════════════════════════════
// Wraps existing template functions to produce Quote Ledger alongside
// the unchanged price output. Does NOT modify templates.js.
//
// Phase 1: sticker_ref + vinyl_print + board_sign
// Phase 2: banner + paper_print + canvas + vinyl_cut
// ═══════════════════════════════════════════════════════════════════

import { createLedgerBuilder } from "./ledger-builder.js";

/**
 * Wrap the sticker reference-table pricing result with a Quote Ledger.
 * Called AFTER calculateStickerRefPrice() — reconstructs the ledger
 * from the result's breakdown and meta.
 *
 * @param {object} result — return value from calculateStickerRefPrice()
 * @param {object} input — the original pricing input
 * @param {object} opts — { materialLabel, printModeLabel, laminationLabel }
 * @returns {object} quoteLedger
 */
export function buildStickerRefLedger(result, input, opts = {}) {
  const qty = Number(input.quantity);
  const ledger = createLedgerBuilder({
    slug: input.slug || "sticker",
    quantity: qty,
    widthIn: input.widthIn,
    heightIn: input.heightIn,
    material: result.meta?.material || input.material,
  });

  const area = (input.widthIn || 2) * (input.heightIn || 2);
  ledger.setDerived("areaSqIn", area);
  ledger.setDerived("areaSqFt", area / 144);

  // Base: reference table lookup
  const refCents = result.breakdown?.referenceTotal || 0;
  ledger.addBase(
    "BASE",
    "基础报价",
    `参考表 ${input.widthIn || 2}x${input.heightIn || 2}" ${result.meta?.material || ""} x${qty}`,
    refCents,
    "sticker-pricing"
  );

  // Setup fee
  const setupCents = result.breakdown?.setupFee || 0;
  if (setupCents > 0) {
    ledger.addSurcharge(
      "SETUP",
      "开机费",
      `固定 $${(setupCents / 100).toFixed(2)}`,
      setupCents,
      "template-resolver"
    );
  }

  // Reconcile to match exact output (reference table may include multipliers internally)
  ledger.reconcile(result.totalCents, "sticker-pricing");

  return ledger.build(qty);
}

/**
 * Wrap the vinyl_print template result with a Quote Ledger.
 * For non-sticker vinyl products (WWF, large format, etc.)
 *
 * @param {object} result — return value from T.vinylPrint()
 * @param {object} input — original pricing input
 * @returns {object} quoteLedger
 */
export function buildVinylPrintLedger(result, input) {
  const qty = Number(input.quantity);
  const bd = result.breakdown;
  const meta = result.meta;

  const ledger = createLedgerBuilder({
    slug: input.slug || "vinyl",
    quantity: qty,
    widthIn: input.widthIn,
    heightIn: input.heightIn,
    material: meta?.materialName || input.material,
  });

  ledger.setDerived("areaSqFt", meta?.printAreaSqft);
  ledger.setDerived("areaSqIn", (meta?.printAreaSqft || 0) * 144);

  // Cost components
  ledger.addBase(
    "MATERIAL",
    "材料费",
    `${(meta?.printAreaSqft || 0).toFixed(2)} sqft x $${meta?.matCostSqft || 0}/sqft`,
    bd.material,
    "templates.vinylPrint"
  );

  ledger.addBase(
    "INK",
    "印刷费",
    `${(meta?.printAreaSqft || 0).toFixed(2)} sqft x 墨水`,
    bd.ink,
    "templates.vinylPrint"
  );

  ledger.addBase(
    "CUTTING",
    "裁切费",
    `${qty} 件裁切`,
    bd.cutting,
    "templates.vinylPrint"
  );

  if (bd.waste > 0) {
    ledger.addBase(
      "WASTE",
      "排废费",
      `模切排废`,
      bd.waste,
      "templates.vinylPrint"
    );
  }

  if (bd.lamination > 0) {
    ledger.addBase(
      "LAM_COST",
      "覆膜费",
      `${meta?.laminationName || "覆膜"}`,
      bd.lamination,
      "templates.vinylPrint"
    );
  }

  // Margin
  const margin = bd.profitMargin;
  if (margin > 0 && margin < 1) {
    const marginMult = 1 / (1 - margin);
    ledger.addMultiplier(
      "MARGIN",
      `利润 (${(margin * 100).toFixed(0)}%)`,
      marginMult,
      "templates.vinylPrint"
    );
  }

  // Material markup (holographic etc.)
  if (meta?.materialMarkup && meta.materialMarkup !== 1.0) {
    ledger.addMultiplier(
      "MAT_MARKUP",
      "特殊材料加价",
      meta.materialMarkup,
      "templates.vinylPrint"
    );
  }

  // Shape surcharge
  if (meta?.shapeSurcharge && meta.shapeSurcharge > 0) {
    ledger.addMultiplier(
      "SHAPE_PCT",
      "异形加价",
      1 + meta.shapeSurcharge,
      "sticker-order-config"
    );
  }

  // Turnaround rush
  if (meta?.turnaroundMultiplier && meta.turnaroundMultiplier > 1) {
    ledger.addMultiplier(
      "RUSH_MULT",
      "加急费",
      meta.turnaroundMultiplier,
      "sticker-order-config"
    );
  }

  // Print mode
  if (meta?.printMode && meta.printMode !== "color_only") {
    // The multiplier is already applied in the template
    // We detect it from the final price difference
  }

  // Reconcile to match exact template output
  ledger.reconcile(result.totalCents, "templates.vinylPrint");

  return ledger.build(qty);
}

/**
 * Wrap the board_sign template result with a Quote Ledger.
 *
 * @param {object} result — return value from T.boardSign()
 * @param {object} input — original pricing input
 * @returns {object} quoteLedger
 */
export function buildBoardSignLedger(result, input) {
  const qty = Number(input.quantity);
  const bd = result.breakdown;
  const meta = result.meta;

  const ledger = createLedgerBuilder({
    slug: input.slug || "sign",
    quantity: qty,
    widthIn: input.widthIn,
    heightIn: input.heightIn,
    material: meta?.boardName || input.material,
  });

  ledger.setDerived("areaSqFt", meta?.areaSqft);
  ledger.setDerived("piecesPerSheet", meta?.piecesPerSheet);

  // Cost components
  ledger.addBase(
    "BOARD",
    "板材费",
    `${meta?.boardName || "板材"} (${meta?.piecesPerSheet || 1}片/板) x${qty}`,
    bd.board,
    "templates.boardSign"
  );

  ledger.addBase(
    "VINYL",
    "贴面费",
    `${meta?.sides || 1} 面 x ${(meta?.areaSqft || 0).toFixed(2)} sqft`,
    bd.vinyl,
    "templates.boardSign"
  );

  ledger.addBase(
    "INK",
    "印刷费",
    `${(meta?.areaSqft || 0).toFixed(2)} sqft x ${meta?.sides || 1} 面`,
    bd.ink,
    "templates.boardSign"
  );

  ledger.addBase(
    "LABOR",
    "加工费",
    `裁切 + 贴合 x${qty}`,
    bd.labor,
    "templates.boardSign"
  );

  // Margin
  const margin = bd.profitMargin;
  if (margin > 0 && margin < 1) {
    const marginMult = 1 / (1 - margin);
    ledger.addMultiplier(
      "MARGIN",
      `利润 (${(margin * 100).toFixed(0)}%)`,
      marginMult,
      "templates.boardSign"
    );
  }

  // Reconcile to match exact template output
  ledger.reconcile(result.totalCents, "templates.boardSign");

  return ledger.build(qty);
}

/**
 * Wrap the banner template result with a Quote Ledger.
 */
export function buildBannerLedger(result, input) {
  const qty = Number(input.quantity);
  const bd = result.breakdown;
  const meta = result.meta;

  const ledger = createLedgerBuilder({
    slug: input.slug || "banner",
    quantity: qty,
    widthIn: input.widthIn,
    heightIn: input.heightIn,
    material: meta?.materialName || input.material,
  });

  ledger.setDerived("areaSqFt", meta?.areaSqft);

  ledger.addBase("MATERIAL", "材料费",
    `${(meta?.areaSqft || 0).toFixed(2)} sqft x ${meta?.materialName || "材料"}`,
    bd.material, "templates.banner");

  ledger.addBase("INK", "印刷费",
    `${(meta?.areaSqft || 0).toFixed(2)} sqft x 墨水`,
    bd.ink, "templates.banner");

  if (bd.finishing > 0) {
    ledger.addBase("FINISHING", "加工费",
      (meta?.finishingDetails || []).map(d => d.name).join(", ") || "加工",
      bd.finishing, "templates.banner");
  }

  // Margin
  const margin = bd.profitMargin;
  if (margin > 0 && margin < 1) {
    ledger.addMultiplier("MARGIN", `利润 (${(margin * 100).toFixed(0)}%)`,
      1 / (1 - margin), "templates.banner");
  }

  // Setup fee (flat, post-margin)
  if (bd.setupFee > 0) {
    ledger.addSurcharge("SETUP", "开机费",
      `固定 $${(bd.setupFee / 100).toFixed(2)}`,
      bd.setupFee, "templates.banner");
  }

  // Accessories
  if (bd.accessoryPrice > 0) {
    ledger.addSurcharge("ACCESSORY", "配件费",
      (meta?.accessoryDetails || []).map(d => d.name).join(", ") || "配件",
      bd.accessoryPrice, "templates.banner");
  }

  ledger.reconcile(result.totalCents, "templates.banner");
  return ledger.build(qty);
}

/**
 * Wrap the paper_print template result with a Quote Ledger.
 */
export function buildPaperPrintLedger(result, input) {
  const qty = Number(input.quantity);
  const bd = result.breakdown;
  const meta = result.meta;

  const ledger = createLedgerBuilder({
    slug: input.slug || "paper",
    quantity: qty,
    widthIn: input.widthIn,
    heightIn: input.heightIn,
    material: meta?.paperName || input.material,
  });

  ledger.setDerived("piecesPerSheet", meta?.piecesPerSheet);
  ledger.setDerived("sheetsNeeded", meta?.sheetsNeeded);

  ledger.addBase("PAPER", "纸张费",
    `${meta?.paperName || "纸"} x${meta?.sheetsNeeded || 0}张 (${meta?.piecesPerSheet || 0}件/张)`,
    bd.paper, "templates.paperPrint");

  ledger.addBase("INK", "印刷费",
    `${qty}件 x ${meta?.passes || 1}面`,
    bd.ink, "templates.paperPrint");

  if (bd.lamination > 0) {
    ledger.addBase("LAM_COST", "覆膜费", "覆膜", bd.lamination, "templates.paperPrint");
  }

  if (bd.finishing > 0) {
    ledger.addBase("FINISHING", "后加工费", "装订/压痕/圆角/打孔/折页",
      bd.finishing, "templates.paperPrint");
  }

  const margin = bd.profitMargin;
  if (margin > 0 && margin < 1) {
    ledger.addMultiplier("MARGIN", `利润 (${(margin * 100).toFixed(0)}%)`,
      1 / (1 - margin), "templates.paperPrint");
  }

  ledger.reconcile(result.totalCents, "templates.paperPrint");
  return ledger.build(qty);
}

/**
 * Wrap the canvas template result with a Quote Ledger.
 */
export function buildCanvasLedger(result, input) {
  const qty = Number(input.quantity);
  const bd = result.breakdown;
  const meta = result.meta;

  const ledger = createLedgerBuilder({
    slug: input.slug || "canvas",
    quantity: qty,
    widthIn: input.widthIn,
    heightIn: input.heightIn,
    material: "canvas",
  });

  ledger.setDerived("areaSqFt", meta?.areaSqft);

  ledger.addBase("CANVAS", "画布费",
    `${(meta?.areaSqft || 0).toFixed(2)} sqft`,
    bd.canvas, "templates.canvas");

  ledger.addBase("INK", "印刷费",
    `${(meta?.areaSqft || 0).toFixed(2)} sqft x 墨水`,
    bd.ink, "templates.canvas");

  if (bd.frame > 0) {
    ledger.addBase("FRAME", "画框费", "内框条",
      bd.frame, "templates.canvas");
  }

  if (bd.lamination > 0) {
    ledger.addBase("LAM_COST", "覆膜费", "UV 保护", bd.lamination, "templates.canvas");
  }

  const margin = bd.profitMargin;
  if (margin > 0 && margin < 1) {
    ledger.addMultiplier("MARGIN", `利润 (${(margin * 100).toFixed(0)}%)`,
      1 / (1 - margin), "templates.canvas");
  }

  ledger.reconcile(result.totalCents, "templates.canvas");
  return ledger.build(qty);
}

/**
 * Wrap the vinyl_cut template result with a Quote Ledger.
 */
export function buildVinylCutLedger(result, input) {
  const qty = Number(input.quantity);
  const bd = result.breakdown;
  const meta = result.meta;

  const ledger = createLedgerBuilder({
    slug: input.slug || "vinyl-cut",
    quantity: qty,
    widthIn: input.widthIn,
    heightIn: input.heightIn,
    material: meta?.materialName || input.material,
  });

  ledger.setDerived("areaSqFt", meta?.areaSqft);

  ledger.addBase("MATERIAL", "材料费",
    `${(meta?.areaSqft || 0).toFixed(2)} sqft x ${meta?.materialName || "材料"}`,
    bd.material, "templates.vinylCut");

  ledger.addBase("CUTTING", "刻字裁切费",
    `${qty}件 Graphtec 刻字`,
    bd.cutting, "templates.vinylCut");

  ledger.addBase("WEEDING", "排废费",
    `$0.50/sqft x ${(meta?.areaSqft || 0).toFixed(2)} sqft`,
    bd.weeding, "templates.vinylCut");

  ledger.addBase("TRANSFER", "转写胶带",
    `$0.05/sqft x ${(meta?.areaSqft || 0).toFixed(2)} sqft`,
    bd.transfer, "templates.vinylCut");

  const margin = bd.profitMargin;
  if (margin > 0 && margin < 1) {
    ledger.addMultiplier("MARGIN", `利润 (${(margin * 100).toFixed(0)}%)`,
      1 / (1 - margin), "templates.vinylCut");
  }

  ledger.reconcile(result.totalCents, "templates.vinylCut");
  return ledger.build(qty);
}
