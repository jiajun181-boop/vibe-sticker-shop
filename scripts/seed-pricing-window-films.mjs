#!/usr/bin/env node
/**
 * COST_PLUS pricing preset v4 — with qty efficiency + lower cutting rates
 * Run:  node scripts/seed-pricing-window-films.mjs
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const COST_PLUS_CONFIG = {
  materials: {
    "white-vinyl":          { costPerSqft: 0.32, label: "Regular White Vinyl" },
    "blockout-vinyl":       { costPerSqft: 0.19, label: "Blockout Vinyl (Perm)" },
    "blockout-vinyl-rem":   { costPerSqft: 0.23, label: "Blockout Vinyl (Rem)" },
    "perforated-vinyl":     { costPerSqft: 0.42, label: "Perforated Vinyl" },
    "removable-white":      { costPerSqft: 0.30, label: "Removable White Vinyl" },
    "reflective-vinyl":     { costPerSqft: 0.40, label: "Reflective Vinyl" },
    "clear-vinyl":          { costPerSqft: 0.43, label: "Clear Vinyl" },
    "transparent-film":     { costPerSqft: 0.57, label: "Translucent Film" },
    "translucent-vinyl":    { costPerSqft: 0.57, label: "Translucent Vinyl" },
    "frosted-film":         { costPerSqft: 0.69, label: "Frosted Vinyl (Etch)" },
    "clear-film":           { costPerSqft: 0.91, label: "Clear Film" },
    "static-cling-clear":   { costPerSqft: 0.42, label: "Clear Static Cling" },
    "static-cling-frosted": { costPerSqft: 0.41, label: "Frosted Static Cling" },
    // ── Wall materials ──
    "wall-repositionable":  { costPerSqft: 0.30, label: "Repositionable Wall Vinyl" },
    "wall-permanent":       { costPerSqft: 0.28, label: "Permanent Wall Vinyl" },
    "wall-fabric":          { costPerSqft: 0.85, label: "Fabric Wallpaper" },
    // ── Floor materials ──
    "floor-vinyl-nonslip":  { costPerSqft: 0.55, label: "Vinyl + Non-Slip Laminate" },
    "floor-removable":      { costPerSqft: 0.48, label: "Removable Floor Vinyl" },
  },
  inkCosts: {
    "cmyk":        { inkPerSqft: 0.234, sqmPerHour: 20, label: "CMYK" },
    "cmyk-w":      { inkPerSqft: 0.468, sqmPerHour: 10, label: "CMYK + White (2 pass)" },
    "cmyk-w-cmyk": { inkPerSqft: 0.702, sqmPerHour: 5,  label: "CMYK + White + CMYK (3 pass)" },
    "none":        { inkPerSqft: 0,     sqmPerHour: 0,  label: "No Print" },
  },
  machineLabor: { hourlyRate: 60 },
  cutting: {
    rectangularPerFt: 0.15,   // CNC Esko — rectangular is cheap
    contourPerSqft: 1.20,     // contour takes more time
    contourMinimum: 8,
  },
  waste: {
    tiers: [
      { maxSqft: 2,    factor: 15 },
      { maxSqft: 6,    factor: 12 },
      { maxSqft: 16,   factor: 8 },
      { maxSqft: 50,   factor: 5 },
      { maxSqft: 9999, factor: 4 },
    ],
  },
  // Quantity efficiency: bulk runs = less labor+cutting per piece
  // (material & ink stay linear — real per-piece cost)
  qtyEfficiency: {
    tiers: [
      { maxQty: 2,    factor: 1.0 },   // 1-2: full labor/cutting
      { maxQty: 10,   factor: 0.80 },  // 3-10: -20%
      { maxQty: 25,   factor: 0.65 },  // 11-25: -35%
      { maxQty: 50,   factor: 0.50 },  // 26-50: -50%
      { maxQty: 100,  factor: 0.40 },  // 51-100: -60%
      { maxQty: 9999, factor: 0.35 },  // 100+: -65%
    ],
  },
  markup: {
    floor: 1.5,
    retailTiers: [
      { maxSqft: 2,    factor: 3.5 },
      { maxSqft: 4,    factor: 3.0 },
      { maxSqft: 8,    factor: 2.5 },
      { maxSqft: 16,   factor: 2.3 },
      { maxSqft: 32,   factor: 2.1 },
      { maxSqft: 50,   factor: 1.9 },
      { maxSqft: 9999, factor: 1.8 },
    ],
    b2bTiers: [
      { maxSqft: 2,    factor: 2.5 },
      { maxSqft: 4,    factor: 2.2 },
      { maxSqft: 8,    factor: 1.9 },
      { maxSqft: 16,   factor: 1.7 },
      { maxSqft: 32,   factor: 1.6 },
      { maxSqft: 50,   factor: 1.5 },
      { maxSqft: 9999, factor: 1.5 },
    ],
    retail: 2.5,
    b2b: 1.8,
  },
  fileFee: 10,
  minimumPrice: 25,
};

const PRODUCTS = [
  {
    slug: "window-graphics-transparent-color",
    defaults: {
      material: "transparent-film", printMode: "cmyk", cutType: "rectangular",
      minDimensionIn: 12, maxWidthIn: 53, maxHeightIn: 600,
      materialOptions: [
        { id: "transparent-film", printMode: "cmyk" },
        { id: "clear-film", printMode: "cmyk" },
      ],
    },
  },
  {
    slug: "dichroic-window-film",
    defaults: {
      material: "clear-film", printMode: "none", cutType: "rectangular",
      minDimensionIn: 12, maxWidthIn: 53, maxHeightIn: 600,
      materialOptions: [
        { id: "clear-film", printMode: "none" },
      ],
    },
  },
  {
    slug: "gradient-window-film",
    defaults: {
      material: "transparent-film", printMode: "cmyk", cutType: "rectangular",
      minDimensionIn: 12, maxWidthIn: 53, maxHeightIn: 600,
      materialOptions: [
        { id: "transparent-film", printMode: "cmyk" },
        { id: "frosted-film", printMode: "cmyk" },
      ],
    },
  },
  {
    slug: "one-way-vision",
    defaults: {
      material: "perforated-vinyl", printMode: "cmyk-w", cutType: "rectangular",
      minDimensionIn: 12, maxWidthIn: 53, maxHeightIn: 600,
      materialOptions: [
        { id: "perforated-vinyl", printMode: "cmyk-w" },
      ],
    },
  },
  {
    slug: "window-graphics-blockout",
    defaults: {
      material: "blockout-vinyl", printMode: "cmyk", cutType: "rectangular",
      minDimensionIn: 12, maxWidthIn: 53, maxHeightIn: 600,
      materialOptions: [
        { id: "blockout-vinyl", printMode: "cmyk" },
        { id: "blockout-vinyl-rem", printMode: "cmyk" },
      ],
    },
  },
  {
    slug: "frosted-window-graphics",
    defaults: {
      material: "frosted-film", printMode: "cmyk-w", cutType: "rectangular",
      minDimensionIn: 12, maxWidthIn: 53, maxHeightIn: 600,
      materialOptions: [
        { id: "frosted-film", printMode: "cmyk-w" },
      ],
    },
  },
  {
    slug: "static-cling-frosted",
    defaults: {
      material: "static-cling-frosted", printMode: "cmyk", cutType: "rectangular",
      minDimensionIn: 6, maxWidthIn: 47, maxHeightIn: 96,
      materialOptions: [
        { id: "static-cling-frosted", printMode: "cmyk" },
      ],
    },
  },
  {
    slug: "window-graphics-standard",
    defaults: {
      material: "white-vinyl", printMode: "cmyk", cutType: "rectangular",
      minDimensionIn: 6, maxWidthIn: 53, maxHeightIn: 600,
      materialOptions: [
        { id: "white-vinyl", printMode: "cmyk" },
        { id: "removable-white", printMode: "cmyk" },
      ],
    },
  },
  {
    slug: "window-graphics-double-sided",
    defaults: {
      material: "clear-vinyl", printMode: "cmyk-w-cmyk", cutType: "rectangular",
      minDimensionIn: 12, maxWidthIn: 53, maxHeightIn: 600,
      materialOptions: [
        { id: "clear-vinyl", printMode: "cmyk-w-cmyk" },
      ],
    },
  },
  {
    slug: "static-cling-standard",
    defaults: {
      material: "static-cling-clear", printMode: "cmyk", cutType: "rectangular",
      minDimensionIn: 6, maxWidthIn: 47, maxHeightIn: 96,
      materialOptions: [
        { id: "static-cling-clear", printMode: "cmyk" },
      ],
    },
  },

  // ── Wall Graphics ──
  {
    slug: "wall-graphics",
    defaults: {
      material: "wall-repositionable", printMode: "cmyk", cutType: "rectangular",
      minDimensionIn: 6, maxWidthIn: 53, maxHeightIn: 600,
      materialOptions: [
        { id: "wall-repositionable", printMode: "cmyk" },
        { id: "wall-permanent", printMode: "cmyk" },
        { id: "wall-fabric", printMode: "cmyk" },
      ],
    },
  },

  // ── Floor Graphics ──
  {
    slug: "floor-graphics",
    defaults: {
      material: "floor-vinyl-nonslip", printMode: "cmyk", cutType: "rectangular",
      minDimensionIn: 6, maxWidthIn: 53, maxHeightIn: 120,
      materialOptions: [
        { id: "floor-vinyl-nonslip", printMode: "cmyk" },
        { id: "floor-removable", printMode: "cmyk" },
      ],
    },
  },
];

// ── Engine mirror ──
function interp(tiers, value, floor = 0, key = "maxSqft") {
  if (!tiers?.length) return 2.5;
  if (value <= tiers[0][key]) return Math.max(tiers[0].factor, floor);
  for (let i = 1; i < tiers.length; i++) {
    if (value <= tiers[i][key]) {
      const p = tiers[i-1], c = tiers[i];
      const t = (value - p[key]) / (c[key] - p[key]);
      return Math.max(p.factor + t * (c.factor - p.factor), floor);
    }
  }
  return Math.max(tiers[tiers.length-1].factor, floor);
}
function roundTo99(d) { return Math.floor(d) + 0.99; }

function calc(mat, mode, w, h, qty, cut = "rectangular", b2b = false) {
  const sqft = (w*h)/144, sqm = sqft/10.7639, perim = 2*(w+h)/12;
  const m = COST_PLUS_CONFIG.materials[mat];
  const ink = COST_PLUS_CONFIG.inkCosts[mode];
  if (!m) return { price: 0, unit: 0, rawCost: 0, markup: 0, waste: 0, qtyEff: 1, sqft };
  const hr = COST_PLUS_CONFIG.machineLabor.hourlyRate;

  const matCost = m.costPerSqft * sqft * qty;
  const inkCost = (ink?.inkPerSqft||0) * sqft * qty;
  const laborBase = ink?.sqmPerHour > 0 ? (sqm*qty/ink.sqmPerHour)*hr : 0;
  const cutBase = cut === "contour"
    ? Math.max(COST_PLUS_CONFIG.cutting.contourPerSqft * sqft * qty, COST_PLUS_CONFIG.cutting.contourMinimum)
    : COST_PLUS_CONFIG.cutting.rectangularPerFt * perim * qty;

  const qtyEff = interp(COST_PLUS_CONFIG.qtyEfficiency.tiers, qty, 0.3, "maxQty");
  const labor = laborBase * qtyEff;
  const cutting = cutBase * qtyEff;

  const sub = matCost + inkCost + labor + cutting;
  const wastePct = interp(COST_PLUS_CONFIG.waste.tiers, sqft);
  const raw = sub * (1 + wastePct/100);
  const markup = interp(b2b ? COST_PLUS_CONFIG.markup.b2bTiers : COST_PLUS_CONFIG.markup.retailTiers, sqft, 1.5);
  const price = Math.max(roundTo99(raw * markup + 10), 25);

  return { price, unit: price/qty, rawCost: raw, markup, waste: wastePct, qtyEff, sqft, matCost, inkCost, labor, cutting };
}

async function main() {
  console.log("Seeding COST_PLUS preset v4 (qty efficiency + lower cutting)...\n");

  const preset = await prisma.pricingPreset.upsert({
    where: { key: "window_film_costplus" },
    create: { key: "window_film_costplus", name: "Window Film — Cost Plus", model: "COST_PLUS", config: COST_PLUS_CONFIG },
    update: { name: "Window Film — Cost Plus", model: "COST_PLUS", config: COST_PLUS_CONFIG },
  });
  console.log(`  Preset: ${preset.key} (id: ${preset.id})\n`);

  for (const p of PRODUCTS) {
    const product = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (!product) { console.log(`  SKIP  ${p.slug}`); continue; }
    const existing = product.optionsConfig && typeof product.optionsConfig === "object" ? product.optionsConfig : {};
    await prisma.product.update({
      where: { slug: p.slug },
      data: { pricingPresetId: preset.id, optionsConfig: { ...existing, costPlusDefaults: p.defaults } },
    });
    const { price } = calc(p.defaults.material, p.defaults.printMode, 24, 36, 1);
    console.log(`  OK  ${p.slug.padEnd(42)} $${price.toFixed(2)}`);
  }

  // ── Benchmark vs factory: 白胶 36×72 ──
  console.log("\n\n===== FACTORY BENCHMARK: White Vinyl CMYK 36×72 =====\n");
  console.log("Qty".padStart(5), "Factory".padStart(10), "MyCost".padStart(10), "Retail".padStart(10), "R/张".padStart(8), "B2B".padStart(10), "B/张".padStart(8), "qtyEff".padStart(7));
  console.log("-".repeat(72));

  const benchmarks = [
    { qty: 2, factory: 46.35 },
    { qty: 10, factory: null },
    { qty: 25, factory: null },
    { qty: 50, factory: null },
    { qty: 100, factory: 1710 },
  ];
  for (const { qty, factory } of benchmarks) {
    const r = calc("white-vinyl", "cmyk", 36, 72, qty);
    const b = calc("white-vinyl", "cmyk", 36, 72, qty, "rectangular", true);
    console.log(
      String(qty).padStart(5),
      factory ? `$${factory.toFixed(0)}`.padStart(10) : "-".padStart(10),
      `$${r.rawCost.toFixed(0)}`.padStart(10),
      `$${r.price.toFixed(0)}`.padStart(10),
      `$${r.unit.toFixed(0)}`.padStart(8),
      `$${b.price.toFixed(0)}`.padStart(10),
      `$${b.unit.toFixed(0)}`.padStart(8),
      `${r.qtyEff.toFixed(2)}`.padStart(7),
    );
  }

  // ── Full example table ──
  console.log("\n\n===== REAL SCENARIOS =====\n");

  const scenarios = [
    ["餐厅玻璃门 白胶", "white-vinyl", "cmyk", 36, 72, 2],
    ["店铺橱窗 单面透视", "perforated-vinyl", "cmyk-w", 48, 72, 4],
    ["办公室磨砂隐私贴", "frosted-film", "cmyk-w", 60, 96, 6],
    ["彩白彩双面广告", "clear-vinyl", "cmyk-w-cmyk", 36, 48, 2],
    ["营业时间小贴", "white-vinyl", "cmyk", 12, 18, 1],
    ["商场大面积遮光", "blockout-vinyl", "cmyk", 60, 120, 10],
    ["车行静电贴批量", "static-cling-clear", "cmyk", 24, 36, 25],
    ["透明彩色异形裁切", "transparent-film", "cmyk", 24, 36, 2],
  ];

  for (const [name, mat, mode, w, h, qty] of scenarios) {
    const cut = name.includes("异形") ? "contour" : "rectangular";
    const r = calc(mat, mode, w, h, qty, cut);
    const b = calc(mat, mode, w, h, qty, cut, true);
    console.log(`${name}  ${w}"×${h}" ×${qty}  →  Retail $${r.price.toFixed(2)} ($${r.unit.toFixed(2)}/张)  B2B $${b.price.toFixed(2)} ($${b.unit.toFixed(2)}/张)  成本$${r.rawCost.toFixed(2)}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
