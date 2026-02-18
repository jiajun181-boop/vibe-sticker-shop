#!/usr/bin/env node
/**
 * Canvas Prints — COST_PLUS pricing preset + product seeding
 * Run:  node scripts/seed-canvas-prints.mjs
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const CANVAS_COST_PLUS_CONFIG = {
  materials: {
    "cotton-canvas": { costPerSqft: 1.20, label: "Cotton Canvas" },
    "poly-canvas":   { costPerSqft: 0.90, label: "Poly-Cotton Blend" },
  },
  inkCosts: {
    "cmyk-pigment": { inkPerSqft: 0.45, sqmPerHour: 15, label: "Pigment Ink (Epson SC9100)" },
  },
  machineLabor: { hourlyRate: 60 },
  cutting: {
    rectangularPerFt: 2.80,   // stretcher bar cost per linear ft (gallery 1.5")
    contourPerSqft: 0,
    contourMinimum: 0,
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
  qtyEfficiency: {
    tiers: [
      { maxQty: 2,    factor: 1.0 },
      { maxQty: 5,    factor: 0.85 },
      { maxQty: 10,   factor: 0.70 },
      { maxQty: 25,   factor: 0.55 },
      { maxQty: 9999, factor: 0.45 },
    ],
  },
  markup: {
    floor: 1.5,
    retailTiers: [
      { maxSqft: 1,    factor: 3.5 },
      { maxSqft: 2,    factor: 3.2 },
      { maxSqft: 4,    factor: 3.0 },
      { maxSqft: 8,    factor: 2.5 },
      { maxSqft: 16,   factor: 2.3 },
      { maxSqft: 32,   factor: 2.0 },
      { maxSqft: 9999, factor: 1.8 },
    ],
    b2bTiers: [
      { maxSqft: 2,    factor: 2.5 },
      { maxSqft: 4,    factor: 2.2 },
      { maxSqft: 8,    factor: 1.9 },
      { maxSqft: 16,   factor: 1.7 },
      { maxSqft: 32,   factor: 1.6 },
      { maxSqft: 9999, factor: 1.5 },
    ],
    retail: 2.5,
    b2b: 1.8,
  },
  fileFee: 0,
  minimumPrice: 29.99,
};

const PRODUCTS = [
  {
    slug: "canvas-standard",
    name: "Standard Canvas Print",
    description: "Classic 0.75\" depth stretcher bars with mirror, white, or solid color edge wrapping. Perfect for home and office decor.",
    defaults: {
      material: "cotton-canvas",
      printMode: "cmyk-pigment",
      cutType: "rectangular",
      barCostPerFt: 2.00,
      minDimensionIn: 6,
      maxWidthIn: 60,
      maxHeightIn: 120,
      panelCount: 1,
      materialOptions: [
        { id: "cotton-canvas", printMode: "cmyk-pigment" },
        { id: "poly-canvas", printMode: "cmyk-pigment" },
      ],
    },
  },
  {
    slug: "canvas-gallery-wrap",
    name: "Gallery Wrap Canvas",
    description: "Premium 1.5\" depth gallery wrap with image extending to the edges. Museum-quality presentation for fine art and photography.",
    defaults: {
      material: "cotton-canvas",
      printMode: "cmyk-pigment",
      cutType: "rectangular",
      barCostPerFt: 2.80,
      minDimensionIn: 8,
      maxWidthIn: 60,
      maxHeightIn: 120,
      panelCount: 1,
      materialOptions: [
        { id: "cotton-canvas", printMode: "cmyk-pigment" },
        { id: "poly-canvas", printMode: "cmyk-pigment" },
      ],
    },
  },
  {
    slug: "canvas-framed",
    name: "Framed Canvas Print",
    description: "Gallery wrap canvas with a premium float frame. Available in black, white, oak, and walnut finishes.",
    defaults: {
      material: "cotton-canvas",
      printMode: "cmyk-pigment",
      cutType: "rectangular",
      barCostPerFt: 2.80,
      minDimensionIn: 8,
      maxWidthIn: 48,
      maxHeightIn: 60,
      panelCount: 1,
      materialOptions: [
        { id: "cotton-canvas", printMode: "cmyk-pigment" },
        { id: "poly-canvas", printMode: "cmyk-pigment" },
      ],
    },
  },
  {
    slug: "canvas-panoramic",
    name: "Panoramic Canvas Print",
    description: "Wide-format gallery wrap canvas for panoramic photos and landscapes. Sizes from 12\"x36\" to 20\"x60\".",
    defaults: {
      material: "cotton-canvas",
      printMode: "cmyk-pigment",
      cutType: "rectangular",
      barCostPerFt: 2.80,
      minDimensionIn: 8,
      maxWidthIn: 24,
      maxHeightIn: 120,
      panelCount: 1,
      materialOptions: [
        { id: "cotton-canvas", printMode: "cmyk-pigment" },
        { id: "poly-canvas", printMode: "cmyk-pigment" },
      ],
    },
  },
  {
    slug: "canvas-split-2",
    name: "2-Panel Canvas Set (Diptych)",
    description: "Your image split across 2 gallery wrap panels with a 2\" gap. Creates a stunning modern wall display.",
    defaults: {
      material: "cotton-canvas",
      printMode: "cmyk-pigment",
      cutType: "rectangular",
      barCostPerFt: 2.80,
      minDimensionIn: 16,
      maxWidthIn: 60,
      maxHeightIn: 120,
      panelCount: 2,
      materialOptions: [
        { id: "cotton-canvas", printMode: "cmyk-pigment" },
        { id: "poly-canvas", printMode: "cmyk-pigment" },
      ],
    },
  },
  {
    slug: "canvas-split-3",
    name: "3-Panel Canvas Set (Triptych)",
    description: "Your image split across 3 gallery wrap panels. The classic triptych layout for dramatic wall art.",
    defaults: {
      material: "cotton-canvas",
      printMode: "cmyk-pigment",
      cutType: "rectangular",
      barCostPerFt: 2.80,
      minDimensionIn: 20,
      maxWidthIn: 60,
      maxHeightIn: 120,
      panelCount: 3,
      materialOptions: [
        { id: "cotton-canvas", printMode: "cmyk-pigment" },
        { id: "poly-canvas", printMode: "cmyk-pigment" },
      ],
    },
  },
  {
    slug: "canvas-split-5",
    name: "5-Panel Canvas Set",
    description: "Your image split across 5 gallery wrap panels for maximum impact. Perfect for large living room and office feature walls.",
    defaults: {
      material: "cotton-canvas",
      printMode: "cmyk-pigment",
      cutType: "rectangular",
      barCostPerFt: 2.80,
      minDimensionIn: 24,
      maxWidthIn: 60,
      maxHeightIn: 120,
      panelCount: 5,
      materialOptions: [
        { id: "cotton-canvas", printMode: "cmyk-pigment" },
        { id: "poly-canvas", printMode: "cmyk-pigment" },
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

function calc(mat, mode, w, h, qty, barCostPerFt = 2.80, panelCount = 1) {
  const cfg = CANVAS_COST_PLUS_CONFIG;
  const sqft = (w*h)/144, sqm = sqft/10.7639, perim = 2*(w+h)/12;
  const m = cfg.materials[mat];
  const ink = cfg.inkCosts[mode];
  if (!m) return { price: 0 };
  const hr = cfg.machineLabor.hourlyRate;

  // For split panels, calculate real perimeter
  let effectivePerim = perim;
  if (panelCount > 1) {
    const panelW = w / panelCount;
    const singlePerim = 2 * (panelW + h) / 12;
    effectivePerim = singlePerim * panelCount;
  }

  const matCost = m.costPerSqft * sqft * qty;
  const inkCost = (ink?.inkPerSqft||0) * sqft * qty;
  const laborBase = ink?.sqmPerHour > 0 ? (sqm*qty/ink.sqmPerHour)*hr : 0;
  const cutBase = barCostPerFt * effectivePerim * qty;

  const qtyEff = interp(cfg.qtyEfficiency.tiers, qty, 0.3, "maxQty");
  const labor = laborBase * qtyEff;
  const cutting = cutBase * qtyEff;

  const sub = matCost + inkCost + labor + cutting;
  const wastePct = interp(cfg.waste.tiers, sqft);
  const raw = sub * (1 + wastePct/100);
  const markup = interp(cfg.markup.retailTiers, sqft, 1.5);
  const price = Math.max(roundTo99(raw * markup + cfg.fileFee), cfg.minimumPrice);

  return { price, unit: price/qty, rawCost: raw, markup, sqft };
}

async function main() {
  console.log("Seeding Canvas Prints COST_PLUS preset...\n");

  // Use a separate preset for canvas (different cutting rates = bar costs)
  const preset = await prisma.pricingPreset.upsert({
    where: { key: "canvas_prints_costplus" },
    create: { key: "canvas_prints_costplus", name: "Canvas Prints — Cost Plus", model: "COST_PLUS", config: CANVAS_COST_PLUS_CONFIG },
    update: { name: "Canvas Prints — Cost Plus", model: "COST_PLUS", config: CANVAS_COST_PLUS_CONFIG },
  });
  console.log(`  Preset: ${preset.key} (id: ${preset.id})\n`);

  for (const p of PRODUCTS) {
    let product = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (!product) {
      // Create the product if it doesn't exist
      product = await prisma.product.create({
        data: {
          slug: p.slug,
          name: p.name,
          description: p.description,
          category: "canvas-prints",
          type: "other",
          isActive: true,
          basePrice: 2999,
          pricingUnit: "per_sqft",
          pricingPresetId: preset.id,
          optionsConfig: { costPlusDefaults: p.defaults },
        },
      });
      console.log(`  NEW ${p.slug.padEnd(30)} (id: ${product.id})`);
    } else {
      const existing = product.optionsConfig && typeof product.optionsConfig === "object" ? product.optionsConfig : {};
      await prisma.product.update({
        where: { slug: p.slug },
        data: {
          category: "canvas-prints",
          type: "other",
          pricingPresetId: preset.id,
          optionsConfig: { ...existing, costPlusDefaults: p.defaults },
        },
      });
    }

    const { price } = calc(
      p.defaults.material,
      p.defaults.printMode,
      p.slug.includes("panoramic") ? 16 : 16,
      p.slug.includes("panoramic") ? 48 : 20,
      1,
      p.defaults.barCostPerFt,
      p.defaults.panelCount,
    );
    console.log(`  OK  ${p.slug.padEnd(30)} $${price.toFixed(2)}`);
  }

  // ── Ensure catalog.config in DB includes canvas-prints ──
  const catalogRow = await prisma.setting.findUnique({ where: { key: "catalog.config" } });
  if (catalogRow) {
    const val = catalogRow.value;
    let changed = false;
    if (!val.homepageCategories?.includes("canvas-prints")) {
      const idx = val.homepageCategories?.indexOf("windows-walls-floors") ?? -1;
      if (idx >= 0) val.homepageCategories.splice(idx, 0, "canvas-prints");
      else val.homepageCategories?.push("canvas-prints");
      changed = true;
    }
    if (!val.departments?.find(d => d.key === "canvas-prints")) {
      const idx = val.departments?.findIndex(d => d.key === "windows-walls-floors") ?? -1;
      const dept = { key: "canvas-prints", categories: ["canvas-prints"] };
      if (idx >= 0) val.departments.splice(idx, 0, dept);
      else val.departments?.push(dept);
      changed = true;
    }
    if (!val.categoryMeta?.["canvas-prints"]) {
      if (!val.categoryMeta) val.categoryMeta = {};
      val.categoryMeta["canvas-prints"] = {
        title: "Canvas Prints", icon: "\uD83D\uDDBC\uFE0F",
        subGroups: PRODUCTS.map(p => ({ slug: p.slug, title: p.name, href: `/shop/canvas-prints/${p.slug}` })),
      };
      changed = true;
    }
    if (!val.departmentMeta?.["canvas-prints"]) {
      if (!val.departmentMeta) val.departmentMeta = {};
      val.departmentMeta["canvas-prints"] = { title: "Canvas Prints" };
      changed = true;
    }
    if (changed) {
      await prisma.setting.update({ where: { key: "catalog.config" }, data: { value: val } });
      console.log("\n  Updated catalog.config in DB to include canvas-prints");
    }
  }

  // ── Example pricing table ──
  console.log("\n\n===== CANVAS PRICING EXAMPLES =====\n");
  console.log("Product".padEnd(24), "Size".padEnd(14), "Qty".padStart(4), "Retail".padStart(10), "Unit".padStart(10));
  console.log("-".repeat(66));

  const scenarios = [
    ["Standard",      "cotton-canvas", 16, 20, 1, 2.00, 1],
    ["Gallery Wrap",  "cotton-canvas", 16, 20, 1, 2.80, 1],
    ["Gallery Wrap",  "cotton-canvas", 24, 36, 1, 2.80, 1],
    ["Gallery Wrap",  "cotton-canvas", 36, 48, 1, 2.80, 1],
    ["Framed",        "cotton-canvas", 16, 20, 1, 2.80, 1],
    ["Panoramic",     "cotton-canvas", 16, 48, 1, 2.80, 1],
    ["Split-2",       "cotton-canvas", 24, 36, 1, 2.80, 2],
    ["Split-3",       "cotton-canvas", 36, 72, 1, 2.80, 3],
    ["Split-5",       "cotton-canvas", 40, 100, 1, 2.80, 5],
    ["Gallery Wrap",  "poly-canvas",   24, 36, 1, 2.80, 1],
    ["Gallery Wrap",  "cotton-canvas", 16, 20, 5, 2.80, 1],
  ];

  for (const [name, mat, w, h, qty, bar, panels] of scenarios) {
    const r = calc(mat, "cmyk-pigment", w, h, qty, bar, panels);
    console.log(
      name.padEnd(24),
      `${w}"×${h}"`.padEnd(14),
      String(qty).padStart(4),
      `$${r.price.toFixed(2)}`.padStart(10),
      `$${r.unit.toFixed(2)}`.padStart(10),
    );
  }
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
