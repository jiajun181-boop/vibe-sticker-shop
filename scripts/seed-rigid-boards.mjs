#!/usr/bin/env node
/**
 * Seed / fix Signs & Rigid Boards products.
 *
 * 1. Migrate existing products from old "rigid-signs" category → "signs-rigid-boards"
 * 2. Upsert the rigid_sheets_default pricing preset
 * 3. Create new products to fill all 6 subgroups
 *
 * Safe to re-run — skips existing slugs, upserts preset.
 * Run: node scripts/seed-rigid-boards.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PRINT_FORMATS = ["ai", "pdf", "eps", "tiff", "jpg", "png"];
const CATEGORY = "signs-rigid-boards";

// ─── Pricing Preset ───────────────────────────────────────

const PRESET = {
  key: "rigid_sheets_default",
  name: "Rigid Sheets — Default",
  model: "AREA_TIERED",
  config: {
    tiers: [
      { upToSqft: 4, rate: 8.0 },
      { upToSqft: 12, rate: 6.5 },
      { upToSqft: 32, rate: 5.0 },
      { upToSqft: 100, rate: 4.0 },
      { upToSqft: 9999, rate: 3.5 },
    ],
    fileFee: 10.0,
    minimumPrice: 50.0,
    materials: [
      { id: "foamboard_3_16", name: 'Foamboard 3/16"', multiplier: 1.0 },
      { id: "foamboard_1_2", name: 'Foamboard 1/2"', multiplier: 1.4 },
      { id: "coroplast_4mm", name: "Coroplast 4mm", multiplier: 0.8 },
      { id: "coroplast_6mm", name: "Coroplast 6mm", multiplier: 1.0 },
      { id: "coroplast_10mm", name: "Coroplast 10mm", multiplier: 1.3 },
      { id: "pvc_3mm", name: "PVC (Sintra) 3mm", multiplier: 1.5 },
      { id: "aluminum_composite", name: "Aluminum Composite (ACM)", multiplier: 2.0 },
      { id: "gatorboard_3_16", name: 'Gator Board 3/16"', multiplier: 1.6 },
      { id: "acrylic_3mm", name: "Acrylic 3mm", multiplier: 2.5 },
      { id: "acrylic_6mm", name: "Acrylic 6mm", multiplier: 3.2 },
    ],
    finishings: [
      { id: "lamination_gloss", name: "Gloss Lamination", type: "per_sqft", price: 1.5 },
      { id: "lamination_matte", name: "Matte Lamination", type: "per_sqft", price: 1.5 },
      { id: "contour_cut", name: "Contour Cut", type: "flat", price: 25.0 },
      { id: "drilled_holes", name: "Drilled Holes (4)", type: "flat", price: 5.0 },
      { id: "grommets_4", name: "Corner Grommets", type: "per_unit", price: 0.75 },
      { id: "standoffs", name: "Standoff Hardware (4 pcs)", type: "flat", price: 35.0 },
      { id: "easel_back", name: "Easel Back", type: "flat", price: 8.0 },
    ],
  },
};

// ─── Shared fields ────────────────────────────────────────

const SHARED = {
  category: CATEGORY,
  type: "sign",
  acceptedFormats: PRINT_FORMATS,
  minDpi: 150,
  requiresBleed: true,
  bleedIn: 0.125,
};

const BOARD_DIMS = {
  minWidthIn: 6,
  minHeightIn: 6,
  maxWidthIn: 48,
  maxHeightIn: 96,
};

// ─── New products to add (organized by subgroup) ──────────

const NEW_PRODUCTS = [
  // ── yard-signs ──
  {
    name: "Coroplast Signs",
    slug: "coroplast-signs",
    pricingUnit: "per_piece",
    basePrice: 1600,
    sortOrder: 5,
    description:
      "Custom coroplast signs — lightweight, durable corrugated plastic. Single or double-sided print for indoor/outdoor use.",
    minWidthIn: 12, minHeightIn: 12, maxWidthIn: 48, maxHeightIn: 96,
    optionsConfig: {
      materials: [
        { value: "coroplast_4mm", label: "Coroplast 4mm" },
        { value: "coroplast_6mm", label: "Coroplast 6mm" },
        { value: "coroplast_10mm", label: "Coroplast 10mm" },
      ],
      sizes: [
        {
          label: "12×18",
          widthIn: 12, heightIn: 18,
          tiers: [
            { qty: 1, unitCents: 1600 },
            { qty: 10, unitCents: 850 },
            { qty: 25, unitCents: 680 },
            { qty: 50, unitCents: 575 },
            { qty: 100, unitCents: 500 },
          ],
        },
        {
          label: "18×24",
          widthIn: 18, heightIn: 24,
          tiers: [
            { qty: 1, unitCents: 2200 },
            { qty: 10, unitCents: 1150 },
            { qty: 25, unitCents: 950 },
            { qty: 50, unitCents: 800 },
            { qty: 100, unitCents: 680 },
          ],
        },
        {
          label: "24×36",
          widthIn: 24, heightIn: 36,
          tiers: [
            { qty: 1, unitCents: 4000 },
            { qty: 10, unitCents: 2500 },
            { qty: 25, unitCents: 2000 },
            { qty: 50, unitCents: 1650 },
          ],
        },
        {
          label: "48×96 (Full Sheet)",
          widthIn: 48, heightIn: 96,
          tiers: [
            { qty: 1, unitCents: 12000 },
            { qty: 5, unitCents: 9500 },
            { qty: 10, unitCents: 8000 },
          ],
        },
      ],
    },
  },
  {
    name: "Lawn Signs with H-Stake",
    slug: "lawn-signs-h-stake",
    pricingUnit: "per_piece",
    basePrice: 2000,
    sortOrder: 6,
    description:
      "Coroplast lawn signs with wire H-stake included. Plant-and-go for real estate, events, graduations, and garage sales.",
    minWidthIn: 12, minHeightIn: 12, maxWidthIn: 36, maxHeightIn: 48,
    optionsConfig: {
      materials: [
        { value: "coroplast_4mm", label: "Coroplast 4mm" },
        { value: "coroplast_6mm", label: "Coroplast 6mm" },
      ],
      sizes: [
        {
          label: "12×18 + H-Stake",
          widthIn: 12, heightIn: 18,
          tiers: [
            { qty: 1, unitCents: 2000 },
            { qty: 10, unitCents: 1100 },
            { qty: 25, unitCents: 900 },
            { qty: 50, unitCents: 780 },
            { qty: 100, unitCents: 700 },
          ],
        },
        {
          label: "18×24 + H-Stake",
          widthIn: 18, heightIn: 24,
          tiers: [
            { qty: 1, unitCents: 2800 },
            { qty: 10, unitCents: 1400 },
            { qty: 25, unitCents: 1200 },
            { qty: 50, unitCents: 1000 },
            { qty: 100, unitCents: 900 },
          ],
        },
        {
          label: "24×36 + H-Stake",
          widthIn: 24, heightIn: 36,
          tiers: [
            { qty: 1, unitCents: 4800 },
            { qty: 10, unitCents: 2900 },
            { qty: 25, unitCents: 2400 },
            { qty: 50, unitCents: 2000 },
          ],
        },
      ],
    },
  },
  {
    name: "Double-Sided Lawn Signs",
    slug: "double-sided-lawn-signs",
    pricingUnit: "per_piece",
    basePrice: 2800,
    sortOrder: 7,
    description:
      "Two-sided coroplast lawn signs — visible from both directions. Includes H-stake. Great for corner lots and busy streets.",
    minWidthIn: 12, minHeightIn: 12, maxWidthIn: 36, maxHeightIn: 48,
    optionsConfig: {
      materials: [
        { value: "coroplast_4mm", label: "Coroplast 4mm" },
        { value: "coroplast_6mm", label: "Coroplast 6mm" },
      ],
      sizes: [
        {
          label: "12×18 Double-Sided",
          widthIn: 12, heightIn: 18,
          tiers: [
            { qty: 1, unitCents: 2800 },
            { qty: 10, unitCents: 1500 },
            { qty: 25, unitCents: 1250 },
            { qty: 50, unitCents: 1050 },
            { qty: 100, unitCents: 950 },
          ],
        },
        {
          label: "18×24 Double-Sided",
          widthIn: 18, heightIn: 24,
          tiers: [
            { qty: 1, unitCents: 3800 },
            { qty: 10, unitCents: 2000 },
            { qty: 25, unitCents: 1700 },
            { qty: 50, unitCents: 1400 },
            { qty: 100, unitCents: 1250 },
          ],
        },
      ],
    },
  },

  // ── real-estate-signs ──
  {
    name: "Real Estate Agent Sign",
    slug: "real-estate-agent-sign",
    pricingUnit: "per_piece",
    basePrice: 4500,
    sortOrder: 12,
    description:
      "Premium agent-branded real estate signs with rider clips. Heavy-duty coroplast or aluminum composite for year-round outdoor use.",
    minWidthIn: 18, minHeightIn: 24, maxWidthIn: 36, maxHeightIn: 48,
    optionsConfig: {
      materials: [
        { value: "coroplast_6mm", label: "Coroplast 6mm" },
        { value: "coroplast_10mm", label: "Coroplast 10mm" },
        { value: "aluminum_composite", label: "Aluminum Composite (ACM)" },
      ],
      sizes: [
        {
          label: "18×24",
          widthIn: 18, heightIn: 24,
          tiers: [
            { qty: 1, unitCents: 4500 },
            { qty: 10, unitCents: 2800 },
            { qty: 25, unitCents: 2200 },
          ],
        },
        {
          label: "24×36",
          widthIn: 24, heightIn: 36,
          tiers: [
            { qty: 1, unitCents: 7000 },
            { qty: 10, unitCents: 4500 },
            { qty: 25, unitCents: 3600 },
          ],
        },
      ],
    },
  },

  // ── foam-board-signs ──
  {
    name: "Foam Board Prints",
    slug: "foam-board-prints",
    pricingUnit: "per_sqft",
    basePrice: 4000,
    sortOrder: 20,
    description:
      "Full-colour prints mounted on rigid foam board. Lightweight and easy to hang — ideal for presentations, trade shows, and retail displays.",
    ...BOARD_DIMS,
    optionsConfig: {
      materials: [
        { value: "foamboard_3_16", label: 'Foamboard 3/16"' },
        { value: "foamboard_1_2", label: 'Foamboard 1/2"' },
      ],
    },
  },
  {
    name: "Foam Board with Easel",
    slug: "foam-board-easel",
    pricingUnit: "per_sqft",
    basePrice: 5000,
    sortOrder: 21,
    description:
      "Self-standing foam board sign with attached easel back. Perfect for countertops, reception desks, welcome signs, and event tables.",
    ...BOARD_DIMS,
    optionsConfig: {
      materials: [
        { value: "foamboard_1_2", label: 'Foamboard 1/2"' },
        { value: "foamboard_3_16", label: 'Foamboard 3/16"' },
      ],
    },
  },

  // ── a-frame-signs ──
  {
    name: "A-Frame Insert Prints",
    slug: "a-frame-insert-prints",
    pricingUnit: "per_piece",
    basePrice: 3500,
    sortOrder: 31,
    description:
      "Replacement coroplast insert panels for A-frame sandwich boards. Double-sided. Swap your message seasonally without buying a new frame.",
    minWidthIn: 18, minHeightIn: 24, maxWidthIn: 24, maxHeightIn: 36,
    optionsConfig: {
      materials: [
        { value: "coroplast_4mm", label: "Coroplast 4mm" },
        { value: "coroplast_6mm", label: "Coroplast 6mm" },
      ],
      sizes: [
        {
          label: "18×24 Insert (pair)",
          widthIn: 18, heightIn: 24,
          tiers: [
            { qty: 1, unitCents: 3500 },
            { qty: 5, unitCents: 2800 },
            { qty: 10, unitCents: 2400 },
          ],
        },
        {
          label: "24×36 Insert (pair)",
          widthIn: 24, heightIn: 36,
          tiers: [
            { qty: 1, unitCents: 5500 },
            { qty: 5, unitCents: 4500 },
            { qty: 10, unitCents: 3800 },
          ],
        },
      ],
    },
  },

  // ── display-signs ──
  {
    name: "Acrylic Signs",
    slug: "acrylic-signs",
    pricingUnit: "per_sqft",
    basePrice: 8000,
    sortOrder: 40,
    description:
      "Custom printed acrylic signs — modern, sleek look for offices, lobbies, and retail. Available in clear or frosted acrylic with UV-printed graphics.",
    minWidthIn: 4, minHeightIn: 4, maxWidthIn: 48, maxHeightIn: 48,
    optionsConfig: {
      materials: [
        { value: "acrylic_3mm", label: "Acrylic 3mm (Clear)" },
        { value: "acrylic_6mm", label: "Acrylic 6mm (Clear)" },
      ],
    },
  },
  {
    name: "Aluminum Signs",
    slug: "aluminum-signs",
    pricingUnit: "per_sqft",
    basePrice: 6500,
    sortOrder: 41,
    description:
      "Durable aluminum composite (ACM/Dibond) signs for outdoor and high-traffic areas. Rust-proof, lightweight, and professional.",
    ...BOARD_DIMS,
    optionsConfig: {
      materials: [
        { value: "aluminum_composite", label: "Aluminum Composite (ACM)" },
      ],
    },
  },
  {
    name: "PVC / Sintra Signs",
    slug: "pvc-sintra-signs",
    pricingUnit: "per_sqft",
    basePrice: 5000,
    sortOrder: 42,
    description:
      "Rigid PVC (Sintra) signs — smooth white surface, easy to drill and mount. Ideal for indoor directories, room signs, and lightweight outdoor signage.",
    ...BOARD_DIMS,
    optionsConfig: {
      materials: [
        { value: "pvc_3mm", label: "PVC (Sintra) 3mm" },
      ],
    },
  },
  {
    name: "Gator Board Signs",
    slug: "gatorboard-signs",
    pricingUnit: "per_sqft",
    basePrice: 5500,
    sortOrder: 43,
    description:
      "Gator board signs — wood-fibre composite that won't warp. Stronger than foam board, lighter than wood. Great for long-term indoor displays.",
    ...BOARD_DIMS,
    optionsConfig: {
      materials: [
        { value: "gatorboard_3_16", label: 'Gator Board 3/16"' },
      ],
    },
  },
  {
    name: "Standoff Mounted Signs",
    slug: "standoff-mounted-signs",
    pricingUnit: "per_sqft",
    basePrice: 9500,
    sortOrder: 44,
    description:
      "Wall-mounted signs with stainless steel standoff hardware — floating look that elevates any lobby, office, or storefront. Acrylic or ACM panel included.",
    minWidthIn: 8, minHeightIn: 8, maxWidthIn: 48, maxHeightIn: 48,
    optionsConfig: {
      materials: [
        { value: "acrylic_6mm", label: "Acrylic 6mm" },
        { value: "aluminum_composite", label: "Aluminum Composite (ACM)" },
      ],
    },
  },
  {
    name: "Menu Boards",
    slug: "menu-boards",
    pricingUnit: "per_piece",
    basePrice: 4500,
    sortOrder: 45,
    description:
      "Rigid menu boards for restaurants, cafes, and food trucks. Full-colour print on foam board, PVC, or acrylic. Easy to swap and update.",
    minWidthIn: 8, minHeightIn: 10, maxWidthIn: 36, maxHeightIn: 48,
    optionsConfig: {
      materials: [
        { value: "foamboard_3_16", label: 'Foamboard 3/16"' },
        { value: "pvc_3mm", label: "PVC (Sintra) 3mm" },
        { value: "acrylic_3mm", label: "Acrylic 3mm" },
      ],
      sizes: [
        {
          label: '8.5×11"',
          widthIn: 8.5, heightIn: 11,
          tiers: [
            { qty: 1, unitCents: 4500 },
            { qty: 5, unitCents: 3500 },
            { qty: 10, unitCents: 3000 },
          ],
        },
        {
          label: '11×17"',
          widthIn: 11, heightIn: 17,
          tiers: [
            { qty: 1, unitCents: 6500 },
            { qty: 5, unitCents: 5000 },
            { qty: 10, unitCents: 4200 },
          ],
        },
        {
          label: '18×24"',
          widthIn: 18, heightIn: 24,
          tiers: [
            { qty: 1, unitCents: 9500 },
            { qty: 5, unitCents: 7500 },
            { qty: 10, unitCents: 6500 },
          ],
        },
        {
          label: '24×36"',
          widthIn: 24, heightIn: 36,
          tiers: [
            { qty: 1, unitCents: 15000 },
            { qty: 5, unitCents: 12000 },
            { qty: 10, unitCents: 10000 },
          ],
        },
      ],
    },
  },
  {
    name: "Construction Site Signs",
    slug: "construction-site-signs",
    pricingUnit: "per_piece",
    basePrice: 5500,
    sortOrder: 46,
    description:
      "Heavy-duty construction site signs on aluminum composite or thick coroplast. Builder branding, project info, safety notices, and permits.",
    minWidthIn: 18, minHeightIn: 24, maxWidthIn: 48, maxHeightIn: 96,
    optionsConfig: {
      materials: [
        { value: "coroplast_10mm", label: "Coroplast 10mm" },
        { value: "aluminum_composite", label: "Aluminum Composite (ACM)" },
      ],
      sizes: [
        {
          label: "24×36",
          widthIn: 24, heightIn: 36,
          tiers: [
            { qty: 1, unitCents: 5500 },
            { qty: 5, unitCents: 4500 },
            { qty: 10, unitCents: 3800 },
          ],
        },
        {
          label: "36×48",
          widthIn: 36, heightIn: 48,
          tiers: [
            { qty: 1, unitCents: 9500 },
            { qty: 5, unitCents: 7800 },
            { qty: 10, unitCents: 6500 },
          ],
        },
        {
          label: "48×96",
          widthIn: 48, heightIn: 96,
          tiers: [
            { qty: 1, unitCents: 18000 },
            { qty: 5, unitCents: 15000 },
          ],
        },
      ],
    },
  },
  {
    name: "Safety Signs",
    slug: "safety-signs",
    pricingUnit: "per_piece",
    basePrice: 3500,
    sortOrder: 47,
    description:
      "Rigid safety signs for workplaces, warehouses, and job sites. Printed on aluminum or PVC for long-lasting indoor/outdoor durability.",
    minWidthIn: 7, minHeightIn: 10, maxWidthIn: 24, maxHeightIn: 36,
    optionsConfig: {
      materials: [
        { value: "aluminum_composite", label: "Aluminum Composite" },
        { value: "pvc_3mm", label: "PVC (Sintra) 3mm" },
      ],
      sizes: [
        {
          label: '7×10"',
          widthIn: 7, heightIn: 10,
          tiers: [
            { qty: 1, unitCents: 3500 },
            { qty: 10, unitCents: 2200 },
            { qty: 25, unitCents: 1800 },
          ],
        },
        {
          label: '10×14"',
          widthIn: 10, heightIn: 14,
          tiers: [
            { qty: 1, unitCents: 4500 },
            { qty: 10, unitCents: 3000 },
            { qty: 25, unitCents: 2500 },
          ],
        },
        {
          label: '14×20"',
          widthIn: 14, heightIn: 20,
          tiers: [
            { qty: 1, unitCents: 6500 },
            { qty: 10, unitCents: 4500 },
            { qty: 25, unitCents: 3600 },
          ],
        },
      ],
    },
  },
  {
    name: "Wayfinding Signs",
    slug: "wayfinding-signs",
    pricingUnit: "per_piece",
    basePrice: 5000,
    sortOrder: 48,
    description:
      "Directional wayfinding signs for offices, campuses, hospitals, and public spaces. Clear, professional signage on durable rigid substrates.",
    minWidthIn: 8, minHeightIn: 8, maxWidthIn: 36, maxHeightIn: 48,
    optionsConfig: {
      materials: [
        { value: "aluminum_composite", label: "Aluminum Composite" },
        { value: "acrylic_3mm", label: "Acrylic 3mm" },
        { value: "pvc_3mm", label: "PVC (Sintra) 3mm" },
      ],
      sizes: [
        {
          label: '8×10"',
          widthIn: 8, heightIn: 10,
          tiers: [
            { qty: 1, unitCents: 5000 },
            { qty: 10, unitCents: 3500 },
            { qty: 25, unitCents: 2800 },
          ],
        },
        {
          label: '12×18"',
          widthIn: 12, heightIn: 18,
          tiers: [
            { qty: 1, unitCents: 7000 },
            { qty: 10, unitCents: 5000 },
            { qty: 25, unitCents: 4000 },
          ],
        },
        {
          label: '18×24"',
          widthIn: 18, heightIn: 24,
          tiers: [
            { qty: 1, unitCents: 9500 },
            { qty: 10, unitCents: 7000 },
            { qty: 25, unitCents: 5500 },
          ],
        },
      ],
    },
  },
  {
    name: "Parking & Property Signs",
    slug: "parking-property-signs",
    pricingUnit: "per_piece",
    basePrice: 4000,
    sortOrder: 49,
    description:
      "Parking lot, private property, and no-trespassing signs. Printed on weather-proof aluminum composite for permanent outdoor installation.",
    minWidthIn: 12, minHeightIn: 12, maxWidthIn: 36, maxHeightIn: 48,
    optionsConfig: {
      materials: [
        { value: "aluminum_composite", label: "Aluminum Composite (ACM)" },
      ],
      sizes: [
        {
          label: '12×18"',
          widthIn: 12, heightIn: 18,
          tiers: [
            { qty: 1, unitCents: 4000 },
            { qty: 10, unitCents: 2800 },
            { qty: 25, unitCents: 2200 },
          ],
        },
        {
          label: '18×24"',
          widthIn: 18, heightIn: 24,
          tiers: [
            { qty: 1, unitCents: 5500 },
            { qty: 10, unitCents: 4000 },
            { qty: 25, unitCents: 3200 },
          ],
        },
        {
          label: '24×36"',
          widthIn: 24, heightIn: 36,
          tiers: [
            { qty: 1, unitCents: 8500 },
            { qty: 10, unitCents: 6500 },
            { qty: 25, unitCents: 5000 },
          ],
        },
      ],
    },
  },
];

// ─── Placeholder images ─────────────────────────────────────

const placeholders = {
  "coroplast-signs": "https://placehold.co/400x400/00b894/ffffff/png?text=Coroplast+Signs",
  "lawn-signs-h-stake": "https://placehold.co/400x400/fdcb6e/333333/png?text=Lawn+Sign+H-Stake",
  "double-sided-lawn-signs": "https://placehold.co/400x400/e17055/ffffff/png?text=Double-Sided",
  "real-estate-agent-sign": "https://placehold.co/400x400/d63031/ffffff/png?text=Agent+Sign",
  "foam-board-prints": "https://placehold.co/400x400/0984e3/ffffff/png?text=Foam+Board+Print",
  "foam-board-easel": "https://placehold.co/400x400/a29bfe/333333/png?text=Foam+Easel",
  "a-frame-insert-prints": "https://placehold.co/400x400/2d3436/ffffff/png?text=A-Frame+Inserts",
  "acrylic-signs": "https://placehold.co/400x400/74b9ff/333333/png?text=Acrylic+Signs",
  "aluminum-signs": "https://placehold.co/400x400/636e72/ffffff/png?text=Aluminum+Signs",
  "pvc-sintra-signs": "https://placehold.co/400x400/dfe6e9/333333/png?text=PVC+Signs",
  "gatorboard-signs": "https://placehold.co/400x400/ffeaa7/333333/png?text=Gator+Board",
  "standoff-mounted-signs": "https://placehold.co/400x400/6c5ce7/ffffff/png?text=Standoff+Sign",
  "menu-boards": "https://placehold.co/400x400/fd79a8/ffffff/png?text=Menu+Board",
  "construction-site-signs": "https://placehold.co/400x400/f39c12/ffffff/png?text=Construction",
  "safety-signs": "https://placehold.co/400x400/e74c3c/ffffff/png?text=Safety+Signs",
  "wayfinding-signs": "https://placehold.co/400x400/00cec9/333333/png?text=Wayfinding",
  "parking-property-signs": "https://placehold.co/400x400/2c3e50/ffffff/png?text=Parking+Sign",
};

// ─── Main ─────────────────────────────────────────────────

async function main() {
  console.log("── Signs & Rigid Boards: seed + migrate ──\n");

  // ─── Step 1: Migrate "rigid-signs" → "signs-rigid-boards" ──
  console.log("Step 1: Migrate category rigid-signs → signs-rigid-boards");
  const migrated = await prisma.product.updateMany({
    where: { category: "rigid-signs" },
    data: { category: CATEGORY },
  });
  console.log(`  Migrated ${migrated.count} products\n`);

  // ─── Step 2: Upsert pricing preset ──
  console.log("Step 2: Upsert pricing preset");
  const preset = await prisma.pricingPreset.upsert({
    where: { key: PRESET.key },
    create: {
      key: PRESET.key,
      name: PRESET.name,
      model: PRESET.model,
      config: PRESET.config,
    },
    update: {
      name: PRESET.name,
      model: PRESET.model,
      config: PRESET.config,
    },
  });
  console.log(`  Preset: ${PRESET.key} → id ${preset.id}\n`);

  // ─── Step 3: Link existing products that lack a pricing preset ──
  console.log("Step 3: Link existing products to preset");
  const existing = await prisma.product.findMany({
    where: { category: CATEGORY, pricingPresetId: null },
    select: { id: true, slug: true },
  });
  for (const p of existing) {
    await prisma.product.update({
      where: { id: p.id },
      data: { pricingPresetId: preset.id },
    });
    console.log(`  Linked: ${p.slug}`);
  }
  if (existing.length === 0) console.log("  (all already linked)");
  console.log();

  // ─── Step 4: Create new products ──
  console.log("Step 4: Create new products");
  let created = 0;
  let skipped = 0;

  for (const p of NEW_PRODUCTS) {
    const exists = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (exists) {
      // Ensure it's in the right category
      if (exists.category !== CATEGORY) {
        await prisma.product.update({
          where: { slug: p.slug },
          data: { category: CATEGORY },
        });
        console.log(`  Re-categorized: ${p.slug} → ${CATEGORY}`);
      } else {
        console.log(`  Skip: ${p.slug} (exists)`);
      }
      skipped++;
      continue;
    }

    const imgUrl = placeholders[p.slug] || `https://placehold.co/400x400/png?text=${encodeURIComponent(p.name.slice(0, 20))}`;
    const { sortOrder, ...fields } = p;

    await prisma.product.create({
      data: {
        ...SHARED,
        ...fields,
        sortOrder,
        isActive: true,
        pricingPresetId: preset.id,
        images: {
          create: [{ url: imgUrl, alt: p.name, sortOrder: 0 }],
        },
      },
    });
    console.log(`  Created: ${p.name}`);
    created++;
  }

  // ─── Summary ──
  console.log(`\n── Summary ──`);
  console.log(`  Migrated: ${migrated.count}`);
  console.log(`  Preset: ${PRESET.key}`);
  console.log(`  Created: ${created}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Linked: ${existing.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
