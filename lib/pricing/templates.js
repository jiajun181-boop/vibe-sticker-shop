// lib/pricing/templates.js
// ═══════════════════════════════════════════════════════════════════
// Six pricing formula templates per the La Lunar Printing blueprint.
// All costs in DOLLARS, converted to cents at the end.
// Material costs read from the Material DB table at call time.
// Profit margins are TIERED by category × quantity.
//
// Template A: vinyl_print   — large-format vinyl printing (stickers, labels, decals, window films)
// Template B: board_sign    — rigid board with vinyl face (coroplast, foam board, PVC)
// Template C: banner        — banner printing (vinyl, mesh, PET)
// Template D: paper_print   — small-format paper printing (cards, flyers, NCR, envelopes)
// Template E: canvas        — canvas prints with stretcher frames
// Template F: vinyl_cut     — cut vinyl lettering (no printing, Graphtec cutter)
// ═══════════════════════════════════════════════════════════════════

// ── Helpers ──────────────────────────────────────────────────────

function roundUp99(dollars) {
  // e.g. $12.34 → $12.99, $0.80 → $0.99
  if (dollars < 1) return 0.99;
  return Math.floor(dollars) + 0.99;
}

function toCents(dollars) {
  return Math.round(dollars * 100);
}

// ── Category × Quantity tiered margin tables ─────────────────────
// Format: array of [maxQty, margin]. Last entry uses Infinity.
// margin = 0.75 means cost ÷ (1 - 0.75) = cost × 4

const MARGIN_TIERS = {
  stickers: [
    [24, 0.80], [99, 0.80], [499, 0.75], [999, 0.68], [4999, 0.62], [Infinity, 0.50],
  ],
  signs: [
    [24, 0.75], [99, 0.60], [499, 0.50], [999, 0.45], [Infinity, 0.40],
  ],
  banners: [
    [24, 0.75], [99, 0.68], [499, 0.60], [999, 0.55], [Infinity, 0.50],
  ],
  print: [
    [24, 0.75], [99, 0.75], [499, 0.70], [999, 0.65], [4999, 0.67], [Infinity, 0.45],
  ],
  canvas: [
    [24, 0.75], [99, 0.70], [Infinity, 0.65],
  ],
  wwf: [
    [24, 0.75], [99, 0.70], [499, 0.65], [999, 0.60], [Infinity, 0.55],
  ],
  vehicle: [
    [24, 0.70], [99, 0.65], [Infinity, 0.60],
  ],
};

// Template → margin category mapping
const TEMPLATE_MARGIN_CATEGORY = {
  vinyl_print: 'stickers',   // stickers/decals default; wwf products override via category
  board_sign: 'signs',
  banner: 'banners',
  paper_print: 'print',
  canvas: 'canvas',
  vinyl_cut: 'vehicle',
};

/**
 * Look up the tiered profit margin for a given category and quantity.
 * @param {string} category - margin category key (stickers, signs, banners, print, canvas, wwf, vehicle)
 * @param {number} qty - order quantity
 * @returns {number} margin (e.g. 0.75)
 */
export function getMargin(category, qty) {
  const tiers = MARGIN_TIERS[category];
  if (!tiers) return 0.55; // fallback
  for (const [maxQty, margin] of tiers) {
    if (qty <= maxQty) return margin;
  }
  return tiers[tiers.length - 1][1];
}

/**
 * Get default margin category for a template name.
 */
export function getMarginCategory(templateName) {
  return TEMPLATE_MARGIN_CATEGORY[templateName] || 'stickers';
}

// ── Minimum prices ───────────────────────────────────────────────
const MIN_PRICE_GENERAL = 15.00;   // $15 CAD — signs, banners, print, vinyl cut
const MIN_PRICE_STICKERS = 25.00;  // $25 CAD — stickers/labels/decals, wwf
const MIN_PRICE_CANVAS = 49.00;    // $49 CAD

// ── Banner setup fee (flat, added after margin) ──────────────────
const BANNER_SETUP_FEE = [
  [2, 28],    // qty 1-2: $28
  [5, 15],    // qty 3-5: $15
  [Infinity, 10], // qty 6+: $10
];

function getBannerSetupFee(qty) {
  for (const [maxQty, fee] of BANNER_SETUP_FEE) {
    if (qty <= maxQty) return fee;
  }
  return 10;
}

// ── Material-specific price markup ───────────────────────────────
// Applied to margined price before rounding. Covers premium materials
// whose raw cost alone doesn't capture the true retail premium.
const MATERIAL_MARKUP = {
  holographic: 1.6,
};

function getMaterialMarkup(materialName) {
  const lower = (materialName || '').toLowerCase();
  for (const [key, mult] of Object.entries(MATERIAL_MARKUP)) {
    if (lower.includes(key)) return mult;
  }
  return 1.0;
}

// ── Accessory markup ─────────────────────────────────────────────
const ACCESSORY_MARKUP = 2.5;     // accessories sell at cost × 2.5

// ── Frame cost table (Picture Wrap Frames Pro 1.75" series) ──────
// Keys are inches, values are per-bar cost (wholesale ÷ 6)
const FRAME_COST = {
  8: 2.60, 10: 2.66, 11: 2.83, 12: 3.58, 14: 2.29,
  16: 4.25, 18: 4.47, 20: 5.76, 24: 7.03, 30: 8.69,
  36: 10.66, 40: 10.56, 48: 13.32, 60: 19.69,
};

function getFrameCost(inches) {
  // Exact match
  if (FRAME_COST[inches] != null) return FRAME_COST[inches];
  // Interpolate between nearest sizes
  const sizes = Object.keys(FRAME_COST).map(Number).sort((a, b) => a - b);
  if (inches <= sizes[0]) return FRAME_COST[sizes[0]];
  if (inches >= sizes[sizes.length - 1]) return FRAME_COST[sizes[sizes.length - 1]];
  for (let i = 1; i < sizes.length; i++) {
    if (inches <= sizes[i]) {
      const lo = sizes[i - 1], hi = sizes[i];
      const t = (inches - lo) / (hi - lo);
      return FRAME_COST[lo] + t * (FRAME_COST[hi] - FRAME_COST[lo]);
    }
  }
  return FRAME_COST[sizes[sizes.length - 1]];
}

// ── Paper imposition calculator ──────────────────────────────────
function impositionCount(parentW, parentH, pieceW, pieceH) {
  const normal = Math.floor(parentW / pieceW) * Math.floor(parentH / pieceH);
  const rotated = Math.floor(parentW / pieceH) * Math.floor(parentH / pieceW);
  return Math.max(normal, rotated, 1);
}

// Board nesting: how many pieces from a 48×96 sheet
function boardPiecesPerSheet(widthIn, heightIn) {
  const normal = Math.floor(48 / widthIn) * Math.floor(96 / heightIn);
  const rotated = Math.floor(48 / heightIn) * Math.floor(96 / widthIn);
  return Math.max(normal, rotated, 1);
}

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE A: vinyl_print
// ═══════════════════════════════════════════════════════════════════
export function vinylPrint({ widthIn, heightIn, quantity, material, inkRate, lamination, options, marginCategory }) {
  const w = Number(widthIn);
  const h = Number(heightIn);
  const qty = Number(quantity);
  const matCostSqft = Number(material.costPerSqft);
  const ink = Number(inkRate || 0.035);
  const cat = marginCategory || 'stickers';

  // Print area: stickers add bleed, large format does not
  const isSticker = options?.isSticker ?? false;
  const bleed = isSticker ? 0.25 : 0;
  const printAreaSqft = isSticker
    ? ((w + bleed) * (h + bleed) * qty) / 144
    : (w * h * qty) / 144;

  // Material cost
  const materialCost = printAreaSqft * matCostSqft;

  // Ink cost
  const inkCost = printAreaSqft * ink;

  // Cutting cost: (qty ÷ 100) × 0.75 min × $0.50/min
  const cuttingCost = (qty / 100) * 0.75 * 0.50;

  // Waste/排废 cost (die-cut only): rows × 0.5min × $0.50/min
  const isDieCut = options?.cutType === 'die_cut';
  const rows = isDieCut ? Math.ceil(qty / Math.max(Math.floor(54 / (w + bleed)), 1)) : 0;
  const wasteCost = isDieCut ? rows * 0.5 * 0.50 : 0;

  // Lamination cost (optional)
  const lamCostSqft = lamination?.costPerSqft ? Number(lamination.costPerSqft) : 0;
  const laminationCost = lamCostSqft > 0 ? printAreaSqft * lamCostSqft : 0;

  const totalCost = materialCost + inkCost + cuttingCost + wasteCost + laminationCost;
  const margin = getMargin(cat, qty);
  const rawPrice = totalCost / (1 - margin);
  const materialMarkup = getMaterialMarkup(material.name);
  const price = rawPrice * materialMarkup;
  const minPrice = (cat === 'stickers' || cat === 'wwf') ? MIN_PRICE_STICKERS : MIN_PRICE_GENERAL;
  const finalPrice = Math.max(roundUp99(price), minPrice);

  return {
    totalCents: toCents(finalPrice),
    unitCents: toCents(finalPrice / qty),
    currency: 'CAD',
    template: 'vinyl_print',
    priceLevel: 'retail',
    breakdown: {
      material: toCents(materialCost),
      ink: toCents(inkCost),
      cutting: toCents(cuttingCost),
      waste: toCents(wasteCost),
      lamination: toCents(laminationCost),
      subtotalCost: toCents(totalCost),
      profitMargin: margin,
      finalPrice: toCents(finalPrice),
    },
    meta: {
      printAreaSqft: Math.round(printAreaSqft * 1000) / 1000,
      materialName: material.name,
      matCostSqft,
      materialMarkup: materialMarkup !== 1.0 ? materialMarkup : undefined,
      laminationName: lamination?.name || null,
      marginCategory: cat,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE B: board_sign
// ═══════════════════════════════════════════════════════════════════
export function boardSign({ widthIn, heightIn, quantity, boardMaterial, vinylMaterial, inkRate, options, marginCategory }) {
  const w = Number(widthIn);
  const h = Number(heightIn);
  const qty = Number(quantity);
  const sides = options?.doubleSided ? 2 : 1;
  const ink = Number(inkRate || 0.035);
  const cat = marginCategory || 'signs';

  // Board cost: sheetCost ÷ piecesPerSheet
  const sheetCost = Number(boardMaterial.rollCost); // rollCost = per sheet for boards
  const piecesPerSheet = boardPiecesPerSheet(w, h);
  const boardCostPerPiece = sheetCost / piecesPerSheet;
  const totalBoardCost = boardCostPerPiece * qty;

  // Vinyl face cost
  const areaSqft = (w * h) / 144;
  const vinylCostSqft = Number(vinylMaterial?.costPerSqft || 0.32);
  const vinylCost = areaSqft * vinylCostSqft * sides * qty;

  // Ink cost
  const inkCost = areaSqft * ink * sides * qty;

  // Labor: $0.50/piece (cutting board) + face application (area-tiered)
  const cutLabor = 0.50 * qty;
  let faceLabor;
  if (areaSqft <= 2) faceLabor = 0.50;
  else if (areaSqft <= 6) faceLabor = 0.75;
  else faceLabor = 1.00;
  const applicationLabor = faceLabor * sides * qty;
  const laborCost = cutLabor + applicationLabor;

  const totalCost = totalBoardCost + vinylCost + inkCost + laborCost;
  const margin = getMargin(cat, qty);
  const price = totalCost / (1 - margin);
  const finalPrice = Math.max(roundUp99(price), MIN_PRICE_GENERAL);

  return {
    totalCents: toCents(finalPrice),
    unitCents: toCents(finalPrice / qty),
    currency: 'CAD',
    template: 'board_sign',
    priceLevel: 'retail',
    breakdown: {
      board: toCents(totalBoardCost),
      vinyl: toCents(vinylCost),
      ink: toCents(inkCost),
      labor: toCents(laborCost),
      subtotalCost: toCents(totalCost),
      profitMargin: margin,
      finalPrice: toCents(finalPrice),
    },
    meta: {
      areaSqft: Math.round(areaSqft * 1000) / 1000,
      piecesPerSheet,
      boardCostPerPiece: Math.round(boardCostPerPiece * 100) / 100,
      boardName: boardMaterial.name,
      sides,
      marginCategory: cat,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE C: banner
// ═══════════════════════════════════════════════════════════════════
export function banner({ widthIn, heightIn, quantity, material, inkRate, finishing, accessories, marginCategory }) {
  const w = Number(widthIn);
  const h = Number(heightIn);
  const qty = Number(quantity);
  const areaSqft = (w * h) / 144;
  const ink = Number(inkRate || 0.035);
  const cat = marginCategory || 'banners';

  // Material cost
  const materialCost = areaSqft * Number(material.costPerSqft) * qty;

  // Ink cost
  const inkCost = areaSqft * ink * qty;

  // Finishing costs
  let finishingCost = 0;
  const finishingDetails = [];
  if (finishing) {
    // Grommets: every 2ft, included (free)
    if (finishing.grommets) {
      const perimeterFt = 2 * (w + h) / 12;
      const grommetsCount = Math.ceil(perimeterFt / 2) * qty;
      finishingDetails.push({ name: 'Grommets', count: grommetsCount, cost: 0 });
    }
    // Hems: included (free)
    if (finishing.hems) {
      finishingDetails.push({ name: 'Heat-Welded Hems', cost: 0 });
    }
    // Pole pockets: $0.50/each
    if (finishing.polePockets) {
      const ppCost = 0.50 * qty;
      finishingCost += ppCost;
      finishingDetails.push({ name: 'Pole Pockets', cost: ppCost });
    }
    // Wind slits: $0.25/each
    if (finishing.windSlits) {
      const wsCost = 0.25 * qty;
      finishingCost += wsCost;
      finishingDetails.push({ name: 'Wind Slits', cost: wsCost });
    }
  }

  // Accessories cost (stands, etc.) — MARKUP at cost × 2.5
  let accessoryCostRaw = 0;
  let accessoryPrice = 0;
  const accessoryDetails = [];
  if (Array.isArray(accessories)) {
    for (const acc of accessories) {
      const cost = (Number(acc.priceCents) / 100) * Number(acc.quantity || 1);
      accessoryCostRaw += cost;
      const marked = cost * ACCESSORY_MARKUP;
      accessoryPrice += marked;
      accessoryDetails.push({ name: acc.name, cost, sellingPrice: marked });
    }
  }

  // Setup fee (flat, not margined)
  const setupFee = getBannerSetupFee(qty);

  const totalCost = materialCost + inkCost + finishingCost;
  const margin = getMargin(cat, qty);
  const printPrice = totalCost / (1 - margin);
  // Final = margined print price + flat setup fee + marked-up accessories
  const price = printPrice + setupFee + accessoryPrice;
  const finalPrice = Math.max(roundUp99(price), MIN_PRICE_GENERAL);

  return {
    totalCents: toCents(finalPrice),
    unitCents: toCents(finalPrice / qty),
    currency: 'CAD',
    template: 'banner',
    priceLevel: 'retail',
    breakdown: {
      material: toCents(materialCost),
      ink: toCents(inkCost),
      finishing: toCents(finishingCost),
      setupFee: toCents(setupFee),
      accessoryCost: toCents(accessoryCostRaw),
      accessoryPrice: toCents(accessoryPrice),
      subtotalCost: toCents(totalCost),
      profitMargin: margin,
      finalPrice: toCents(finalPrice),
    },
    meta: {
      areaSqft: Math.round(areaSqft * 1000) / 1000,
      materialName: material.name,
      finishingDetails,
      accessoryDetails,
      accessoryMarkup: ACCESSORY_MARKUP,
      setupFee,
      marginCategory: cat,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE D: paper_print
// ═══════════════════════════════════════════════════════════════════
export function paperPrint({ widthIn, heightIn, quantity, paper, inkCostPerClick, options, lamination, marginCategory }) {
  const w = Number(widthIn);
  const h = Number(heightIn);
  const qty = Number(quantity);
  const inkClick = Number(inkCostPerClick || 0.05); // color click default
  const cat = marginCategory || 'print';

  // Parent sheet (paper comes on 12×18 or 11×17 sheets)
  const parentW = paper.family === 'NCR' ? 11 : 12;
  const parentH = paper.family === 'NCR' ? 17 : 18;

  // Imposition: how many pieces per parent sheet
  const bleedW = w + 0.125; // 1/8" bleed per side
  const bleedH = h + 0.125;
  const piecesPerSheet = impositionCount(parentW, parentH, bleedW, bleedH);
  const sheetsNeeded = Math.ceil(qty / piecesPerSheet);

  // Paper cost
  const sheetCost = Number(paper.costPerSqft); // costPerSqft stores per-sheet for paper
  const paperCost = sheetsNeeded * sheetCost;

  // Ink cost: per piece (not per sheet) — each piece is a click
  const passes = options?.doubleSided ? 2 : 1;
  const inkCost = qty * inkClick * passes;

  // Lamination (optional)
  const lamCost = lamination?.costPerSqft
    ? (Number(lamination.costPerSqft) * (parentW * parentH / 144) * sheetsNeeded * passes)
    : 0;

  // Finishing costs
  let finishingCost = 0;
  if (options?.scoring) {
    finishingCost += qty * 0.01;
  }
  if (options?.binding === 'saddle_stitch') {
    finishingCost += qty * 0.15;
  } else if (options?.binding === 'perfect_bind') {
    finishingCost += qty * 0.50;
  } else if (options?.binding === 'coil') {
    finishingCost += qty * 0.75;
  }
  if (options?.roundedCorners) {
    finishingCost += qty * 0.02 * 4; // 4 corners
  }
  if (options?.holePunch) {
    finishingCost += qty * 0.01;
  }
  if (options?.folds) {
    finishingCost += qty * 0.01 * Number(options.folds);
  }

  const totalCost = paperCost + inkCost + lamCost + finishingCost;
  const margin = getMargin(cat, qty);
  const price = totalCost / (1 - margin);
  const finalPrice = Math.max(roundUp99(price), MIN_PRICE_GENERAL);

  return {
    totalCents: toCents(finalPrice),
    unitCents: toCents(finalPrice / qty),
    currency: 'CAD',
    template: 'paper_print',
    priceLevel: 'retail',
    breakdown: {
      paper: toCents(paperCost),
      ink: toCents(inkCost),
      lamination: toCents(lamCost),
      finishing: toCents(finishingCost),
      subtotalCost: toCents(totalCost),
      profitMargin: margin,
      finalPrice: toCents(finalPrice),
    },
    meta: {
      piecesPerSheet,
      sheetsNeeded,
      parentSheet: `${parentW}×${parentH}`,
      paperName: paper.name,
      passes,
      marginCategory: cat,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE E: canvas
// ═══════════════════════════════════════════════════════════════════
export function canvas({ widthIn, heightIn, quantity, canvasMaterial, inkRate, options, marginCategory }) {
  const w = Number(widthIn);
  const h = Number(heightIn);
  const qty = Number(quantity);
  const areaSqft = (w * h) / 144;
  const ink = Number(inkRate || 0.035);
  const cat = marginCategory || 'canvas';

  // Canvas material cost
  const canvasCostSqft = Number(canvasMaterial?.costPerSqft || 0.56);
  const canvasCost = areaSqft * canvasCostSqft * qty;

  // Ink cost
  const inkCost = areaSqft * ink * qty;

  // Frame cost (gallery wrap / framed only)
  let frameCost = 0;
  const needsFrame = options?.frameType !== 'none' && options?.frameType !== 'rolled';
  if (needsFrame) {
    const wBarCost = getFrameCost(w);
    const hBarCost = getFrameCost(h);
    frameCost = (2 * wBarCost + 2 * hBarCost) * qty;
  }

  // Lamination (optional, for canvas UV protection)
  let lamCost = 0;
  if (options?.lamination?.costPerSqft) {
    lamCost = areaSqft * Number(options.lamination.costPerSqft) * qty;
  }

  const totalCost = canvasCost + inkCost + frameCost + lamCost;
  const margin = getMargin(cat, qty);
  const price = totalCost / (1 - margin);
  const finalPrice = Math.max(roundUp99(price), MIN_PRICE_CANVAS);

  return {
    totalCents: toCents(finalPrice),
    unitCents: toCents(finalPrice / qty),
    currency: 'CAD',
    template: 'canvas',
    priceLevel: 'retail',
    breakdown: {
      canvas: toCents(canvasCost),
      ink: toCents(inkCost),
      frame: toCents(frameCost),
      lamination: toCents(lamCost),
      subtotalCost: toCents(totalCost),
      profitMargin: margin,
      finalPrice: toCents(finalPrice),
    },
    meta: {
      areaSqft: Math.round(areaSqft * 1000) / 1000,
      framePerBar: needsFrame ? { w: getFrameCost(w), h: getFrameCost(h) } : null,
      marginCategory: cat,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE F: vinyl_cut  (no printing — cut vinyl lettering)
// ═══════════════════════════════════════════════════════════════════
export function vinylCut({ widthIn, heightIn, quantity, material, marginCategory }) {
  const w = Number(widthIn);
  const h = Number(heightIn);
  const qty = Number(quantity);
  const areaSqft = (w * h) / 144;
  const cat = marginCategory || 'vehicle';

  // Material cost (vinyl only, no ink)
  const materialCost = areaSqft * Number(material.costPerSqft) * qty;

  // Cutting cost: Graphtec cutter time
  const perimeterFt = (2 * (w + h)) / 12;
  const cuttingCost = perimeterFt * 0.15 * qty;

  // Weeding labor: $0.50/sqft
  const weedingCost = areaSqft * 0.50 * qty;

  // Transfer tape
  const transferCost = areaSqft * 0.05 * qty;

  const totalCost = materialCost + cuttingCost + weedingCost + transferCost;
  const margin = getMargin(cat, qty);
  const price = totalCost / (1 - margin);
  const finalPrice = Math.max(roundUp99(price), MIN_PRICE_GENERAL);

  return {
    totalCents: toCents(finalPrice),
    unitCents: toCents(finalPrice / qty),
    currency: 'CAD',
    template: 'vinyl_cut',
    priceLevel: 'retail',
    breakdown: {
      material: toCents(materialCost),
      cutting: toCents(cuttingCost),
      weeding: toCents(weedingCost),
      transfer: toCents(transferCost),
      subtotalCost: toCents(totalCost),
      profitMargin: margin,
      finalPrice: toCents(finalPrice),
    },
    meta: {
      areaSqft: Math.round(areaSqft * 1000) / 1000,
      materialName: material.name,
      marginCategory: cat,
    },
  };
}
