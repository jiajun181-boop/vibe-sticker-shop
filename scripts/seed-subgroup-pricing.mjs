/**
 * seed-subgroup-pricing.mjs
 * Creates sub-group-level pricing presets based on Canadian market research
 * and assigns products to their appropriate sub-group preset.
 *
 * Usage:
 *   node scripts/seed-subgroup-pricing.mjs          # dry-run
 *   node scripts/seed-subgroup-pricing.mjs --apply   # write to DB
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

// ─── Helper: convert total-price table to unitPrice tiers ────────────
function toTiers(pairs) {
  return pairs.map(([qty, total]) => ({
    minQty: qty,
    unitPrice: Math.round((total / qty) * 10000) / 10000, // 4 decimal places
  }));
}

// ─── Helper: area-tiered rates ───────────────────────────────────────
function toAreaTiers(pairs) {
  return pairs.map(([upTo, rate]) => ({ upToSqft: upTo, rate }));
}

// ─── Sub-group Presets ───────────────────────────────────────────────
const SUBGROUP_PRESETS = [
  // ════════════════════════════════════════════════════════════════════
  // 1. Marketing & Business Print
  // ════════════════════════════════════════════════════════════════════
  {
    key: "sg_business_cards",
    name: "Business Cards (14pt Double-Sided)",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[100, 30], [250, 40], [500, 48], [1000, 60], [2500, 82]]),
      minimumPrice: 30,
      fileFee: 0,
    },
  },
  {
    key: "sg_flyers",
    name: "Flyers (8.5x11 Gloss)",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[100, 52], [250, 70], [500, 88], [1000, 112], [2500, 160]]),
      minimumPrice: 52,
      fileFee: 0,
    },
  },
  {
    key: "sg_postcards",
    name: "Postcards (4x6 Double-Sided)",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[100, 36], [250, 48], [500, 62], [1000, 82]]),
      minimumPrice: 36,
      fileFee: 0,
    },
  },
  {
    key: "sg_rack_cards",
    name: "Rack Cards (4x9)",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[250, 52], [500, 70], [1000, 90]]),
      minimumPrice: 52,
      fileFee: 0,
    },
  },
  {
    key: "sg_brochures",
    name: "Brochures (Tri-Fold)",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[100, 72], [250, 95], [500, 122], [1000, 160]]),
      minimumPrice: 72,
      fileFee: 0,
    },
  },
  {
    key: "sg_booklets",
    name: "Booklets (Saddle Stitch 8-Page)",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[25, 130], [50, 175], [100, 235], [250, 350]]),
      minimumPrice: 130,
      fileFee: 10,
      finishings: [
        { id: "saddle_stitch", name: "Saddle Stitch", type: "per_unit", price: 0.15 },
        { id: "perfect_binding", name: "Perfect Binding", type: "per_unit", price: 0.50 },
        { id: "wire_o", name: "Wire-O Binding", type: "per_unit", price: 0.35 },
        { id: "lam_cover", name: "Laminated Cover", type: "per_unit", price: 0.20 },
      ],
    },
  },
  {
    key: "sg_door_hangers",
    name: "Door Hangers",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[250, 58], [500, 75], [1000, 98]]),
      minimumPrice: 58,
      fileFee: 0,
    },
  },
  {
    key: "sg_posters",
    name: "Posters (18x24)",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[1, 22], [5, 75], [10, 118], [25, 190]]),
      minimumPrice: 22,
      fileFee: 0,
    },
  },
  {
    key: "sg_ncr_forms",
    name: "NCR Forms (2-Part)",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[50, 112], [100, 150], [250, 230], [500, 335]]),
      minimumPrice: 112,
      fileFee: 5,
    },
  },
  {
    key: "sg_envelopes",
    name: "Envelopes (#10)",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[100, 72], [250, 100], [500, 130]]),
      minimumPrice: 72,
      fileFee: 5,
    },
  },
  {
    key: "sg_letterhead",
    name: "Letterhead",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[100, 60], [250, 82], [500, 108]]),
      minimumPrice: 60,
      fileFee: 5,
    },
  },
  {
    key: "sg_notepads",
    name: "Notepads (50 Sheets)",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[10, 112], [25, 190], [50, 300]]),
      minimumPrice: 112,
      fileFee: 5,
    },
  },
  {
    key: "sg_stamps",
    name: "Self-Inking Stamps",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[1, 38], [5, 150], [10, 280]]),
      minimumPrice: 38,
      fileFee: 0,
      finishings: [
        { id: "logo_upload", name: "Logo Upload", type: "per_unit", price: 5.00 },
        { id: "rush_2day", name: "Rush 2-Day", type: "per_unit", price: 8.00 },
        { id: "extra_ink", name: "Extra Ink Pad", type: "per_unit", price: 6.00 },
      ],
    },
  },
  {
    key: "sg_greeting_cards",
    name: "Greeting & Invitation Cards",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[50, 55], [100, 80], [250, 130]]),
      minimumPrice: 55,
      fileFee: 0,
    },
  },
  {
    key: "sg_bookmarks",
    name: "Bookmarks",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[100, 35], [250, 55], [500, 80]]),
      minimumPrice: 35,
      fileFee: 0,
    },
  },
  {
    key: "sg_certificates",
    name: "Certificates",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[25, 40], [50, 60], [100, 95]]),
      minimumPrice: 40,
      fileFee: 0,
    },
  },
  {
    key: "sg_loyalty_cards",
    name: "Loyalty Cards",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[250, 45], [500, 65], [1000, 90]]),
      minimumPrice: 45,
      fileFee: 0,
    },
  },
  {
    key: "sg_table_tents",
    name: "Table Tents",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[25, 45], [50, 65], [100, 95]]),
      minimumPrice: 45,
      fileFee: 0,
    },
  },
  {
    key: "sg_tickets_coupons",
    name: "Tickets & Coupons",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[250, 50], [500, 70], [1000, 95]]),
      minimumPrice: 50,
      fileFee: 0,
    },
  },
  {
    key: "sg_shelf_displays",
    name: "Shelf Displays",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[25, 60], [50, 90], [100, 140]]),
      minimumPrice: 60,
      fileFee: 5,
    },
  },
  {
    key: "sg_retail_tags",
    name: "Retail Tags & Labels",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[100, 35], [250, 55], [500, 80], [1000, 110]]),
      minimumPrice: 35,
      fileFee: 0,
    },
  },
  {
    key: "sg_packaging_inserts",
    name: "Packaging Inserts & Seals",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[100, 30], [250, 45], [500, 65], [1000, 90]]),
      minimumPrice: 30,
      fileFee: 0,
    },
  },
  {
    key: "sg_presentation_folders",
    name: "Presentation Folders",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[50, 175], [100, 260], [250, 390]]),
      minimumPrice: 175,
      fileFee: 10,
    },
  },
  {
    key: "sg_calendars",
    name: "Calendars",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[10, 85], [25, 150], [50, 250]]),
      minimumPrice: 85,
      fileFee: 5,
    },
  },
  {
    key: "sg_menus",
    name: "Menus",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[25, 40], [50, 60], [100, 90], [250, 150]]),
      minimumPrice: 40,
      fileFee: 0,
    },
  },

  // ════════════════════════════════════════════════════════════════════
  // 2. Stickers, Labels & Decals
  // ════════════════════════════════════════════════════════════════════
  {
    key: "sg_die_cut_stickers",
    name: "Die-Cut Stickers (3\" Vinyl)",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[50, 65], [100, 82], [250, 112], [500, 148], [1000, 195]]),
      minimumPrice: 65,
      fileFee: 0,
      finishings: [
        { id: "laminate", name: "Laminate", type: "per_unit", price: 0.05 },
        { id: "holographic", name: "Holographic", type: "per_unit", price: 0.12 },
      ],
    },
  },
  {
    key: "sg_kiss_cut_singles",
    name: "Kiss-Cut Singles",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[50, 60], [100, 75], [250, 102], [500, 135], [1000, 175]]),
      minimumPrice: 60,
      fileFee: 0,
      finishings: [
        { id: "laminate", name: "Laminate", type: "per_unit", price: 0.05 },
      ],
    },
  },
  {
    key: "sg_sticker_pages",
    name: "Sticker Pages (8.5x11)",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[10, 68], [25, 100], [50, 145], [100, 210]]),
      minimumPrice: 68,
      fileFee: 0,
    },
  },
  {
    key: "sg_sticker_rolls",
    name: "Sticker Rolls (2\" Round)",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[250, 85], [500, 118], [1000, 160]]),
      minimumPrice: 85,
      fileFee: 0,
    },
  },
  {
    key: "sg_vinyl_lettering",
    name: "Vinyl Lettering",
    model: "AREA_TIERED",
    config: {
      tiers: toAreaTiers([[4, 15], [12, 13], [32, 11], [72, 10], [9999, 10]]),
      minimumPrice: 25,
      fileFee: 0,
    },
  },
  {
    key: "sg_safety_fire_emergency",
    name: "Safety: Fire & Emergency",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[5, 24], [10, 38], [25, 62], [50, 98], [100, 148]]),
      minimumPrice: 24,
      fileFee: 0,
      finishings: [
        { id: "reflective", name: "Reflective", type: "per_unit", price: 3.00 },
        { id: "laminate_outdoor", name: "Outdoor Laminate", type: "per_unit", price: 1.50 },
      ],
    },
  },
  {
    key: "sg_safety_hazard_warning",
    name: "Safety: Hazard & Warning",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[5, 24], [10, 38], [25, 62], [50, 98], [100, 148]]),
      minimumPrice: 24,
      fileFee: 0,
      finishings: [
        { id: "reflective", name: "Reflective", type: "per_unit", price: 3.00 },
        { id: "laminate_outdoor", name: "Outdoor Laminate", type: "per_unit", price: 1.50 },
      ],
    },
  },
  {
    key: "sg_safety_ppe_equipment",
    name: "Safety: PPE & Equipment",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[5, 22], [10, 35], [25, 58], [50, 90], [100, 135]]),
      minimumPrice: 22,
      fileFee: 0,
      finishings: [
        { id: "reflective", name: "Reflective", type: "per_unit", price: 3.00 },
        { id: "laminate_outdoor", name: "Outdoor Laminate", type: "per_unit", price: 1.50 },
      ],
    },
  },
  {
    key: "sg_safety_electrical_chemical",
    name: "Safety: Electrical & Chemical",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[5, 24], [10, 38], [25, 62], [50, 98], [100, 148]]),
      minimumPrice: 24,
      fileFee: 0,
      finishings: [
        { id: "reflective", name: "Reflective", type: "per_unit", price: 3.00 },
        { id: "laminate_outdoor", name: "Outdoor Laminate", type: "per_unit", price: 1.50 },
      ],
    },
  },
  {
    key: "sg_asset_equipment_tags",
    name: "Asset & Equipment Tags",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[10, 35], [25, 60], [50, 95], [100, 145]]),
      minimumPrice: 35,
      fileFee: 0,
    },
  },
  {
    key: "sg_pipe_valve_labels",
    name: "Pipe & Valve Labels",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[10, 30], [25, 52], [50, 82], [100, 125]]),
      minimumPrice: 30,
      fileFee: 0,
    },
  },
  {
    key: "sg_warehouse_labels",
    name: "Warehouse Labels",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[25, 45], [50, 70], [100, 105], [250, 165]]),
      minimumPrice: 45,
      fileFee: 0,
    },
  },
  {
    key: "sg_electrical_cable_labels",
    name: "Electrical & Cable Labels",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[25, 40], [50, 62], [100, 95], [250, 148]]),
      minimumPrice: 40,
      fileFee: 0,
    },
  },

  // ════════════════════════════════════════════════════════════════════
  // 3. Signs & Rigid Boards
  // ════════════════════════════════════════════════════════════════════
  {
    key: "sg_yard_signs",
    name: "Yard Signs (18x24 Coroplast)",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[1, 25], [5, 85], [10, 135], [25, 245], [50, 395]]),
      minimumPrice: 25,
      fileFee: 0,
      finishings: [
        { id: "double_sided", name: "Double Sided", type: "per_unit", price: 8.00 },
        { id: "h_stake", name: "H-Stake", type: "per_unit", price: 3.50 },
      ],
    },
  },
  {
    key: "sg_real_estate_signs",
    name: "Real Estate Signs (24x32)",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[1, 32], [5, 105], [10, 175]]),
      minimumPrice: 32,
      fileFee: 0,
      finishings: [
        { id: "double_sided", name: "Double Sided", type: "per_unit", price: 8.00 },
        { id: "grommets", name: "Grommets (4)", type: "per_unit", price: 2.00 },
      ],
    },
  },
  {
    key: "sg_foam_board_signs",
    name: "Foam Board Signs (24x36)",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[1, 38], [5, 130], [10, 222]]),
      minimumPrice: 38,
      fileFee: 0,
    },
  },
  {
    key: "sg_a_frame_signs",
    name: "A-Frame Signs (with Inserts)",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[1, 148], [3, 390], [5, 600]]),
      minimumPrice: 148,
      fileFee: 0,
    },
  },
  {
    key: "sg_election_signs",
    name: "Election & Campaign Signs (Coroplast)",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[25, 225], [50, 375], [100, 600], [250, 1200]]),
      minimumPrice: 225,
      fileFee: 0,
      finishings: [
        { id: "double_sided", name: "Double Sided", type: "per_unit", price: 3.00 },
        { id: "h_stake", name: "H-Stake", type: "per_unit", price: 3.50 },
      ],
    },
  },
  {
    key: "sg_display_signs",
    name: "Display Signs (PVC/Acrylic)",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[1, 45], [5, 165], [10, 280]]),
      minimumPrice: 45,
      fileFee: 0,
    },
  },

  // ════════════════════════════════════════════════════════════════════
  // 4. Banners & Displays
  // ════════════════════════════════════════════════════════════════════
  {
    key: "sg_vinyl_banners",
    name: "Vinyl Banners (13oz)",
    model: "AREA_TIERED",
    config: {
      tiers: toAreaTiers([[6, 3.60], [18, 3.20], [32, 2.90], [72, 2.60], [9999, 2.50]]),
      minimumPrice: 35,
      fileFee: 5,
      finishings: [
        { id: "hems_grommets", name: "Hems & Grommets", type: "flat", price: 0 },
        { id: "double_sided", name: "Double Sided", type: "per_sqft", price: 1.50 },
        { id: "wind_slits", name: "Wind Slits", type: "flat", price: 0.50 },
      ],
    },
  },
  {
    key: "sg_mesh_banners",
    name: "Mesh Banners",
    model: "AREA_TIERED",
    config: {
      tiers: toAreaTiers([[6, 4.50], [18, 4.00], [32, 3.60], [72, 3.30], [9999, 3.20]]),
      minimumPrice: 40,
      fileFee: 5,
    },
  },
  {
    key: "sg_pole_banners",
    name: "Pole Banners (24x48)",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[2, 85], [4, 150], [10, 320]]),
      minimumPrice: 85,
      fileFee: 5,
    },
  },
  {
    key: "sg_fabric_banners",
    name: "Fabric Banners (Dye-Sub)",
    model: "AREA_TIERED",
    config: {
      tiers: toAreaTiers([[6, 5.50], [18, 4.80], [32, 4.30], [72, 4.00], [9999, 4.00]]),
      minimumPrice: 45,
      fileFee: 5,
    },
  },
  {
    key: "sg_retractable_stands",
    name: "Retractable Roll-Up Stands (33x81)",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[1, 120], [3, 330], [5, 500]]),
      minimumPrice: 120,
      fileFee: 0,
    },
  },
  {
    key: "sg_x_banner_stands",
    name: "X-Banner Stands (24x63)",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[1, 62], [3, 168], [5, 260]]),
      minimumPrice: 62,
      fileFee: 0,
    },
  },
  {
    key: "sg_tabletop_displays",
    name: "Tabletop Displays",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[1, 98], [3, 270]]),
      minimumPrice: 98,
      fileFee: 0,
    },
  },
  {
    key: "sg_backdrops_popups",
    name: "Backdrops & Pop-Ups (8ft)",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[1, 350], [2, 650]]),
      minimumPrice: 350,
      fileFee: 0,
    },
  },
  {
    key: "sg_flags_hardware",
    name: "Flags & Poles (Feather Flag)",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[1, 95], [3, 255], [5, 395]]),
      minimumPrice: 95,
      fileFee: 0,
    },
  },
  {
    key: "sg_tents_outdoor",
    name: "Tents & Outdoor (10x10)",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[1, 450], [2, 850]]),
      minimumPrice: 450,
      fileFee: 0,
    },
  },

  // ════════════════════════════════════════════════════════════════════
  // 5. Windows, Walls & Floors
  // ════════════════════════════════════════════════════════════════════
  {
    key: "sg_static_clings",
    name: "Static Clings",
    model: "AREA_TIERED",
    config: {
      tiers: toAreaTiers([[4, 13], [12, 11], [32, 9], [72, 7.50], [9999, 6]]),
      minimumPrice: 30,
      fileFee: 5,
    },
  },
  {
    key: "sg_adhesive_films",
    name: "Adhesive Films",
    model: "AREA_TIERED",
    config: {
      tiers: toAreaTiers([[4, 11], [12, 9], [32, 7.50], [72, 6], [9999, 5]]),
      minimumPrice: 25,
      fileFee: 5,
    },
  },
  {
    key: "sg_one_way_vision",
    name: "One-Way Vision",
    model: "AREA_TIERED",
    config: {
      tiers: toAreaTiers([[4, 17], [12, 14], [32, 11.50], [72, 9.50], [9999, 8]]),
      minimumPrice: 35,
      fileFee: 5,
    },
  },
  {
    key: "sg_privacy_films",
    name: "Privacy Films",
    model: "AREA_TIERED",
    config: {
      tiers: toAreaTiers([[4, 12], [12, 10], [32, 8], [72, 6.50], [9999, 5.50]]),
      minimumPrice: 25,
      fileFee: 5,
    },
  },
  {
    key: "sg_window_lettering",
    name: "Window Lettering",
    model: "AREA_TIERED",
    config: {
      tiers: toAreaTiers([[4, 15], [12, 13], [32, 11], [72, 10], [9999, 10]]),
      minimumPrice: 30,
      fileFee: 0,
    },
  },
  {
    key: "sg_canvas_prints",
    name: "Canvas Prints",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[1, 68], [3, 180], [5, 280]]),
      minimumPrice: 68,
      fileFee: 0,
    },
  },
  {
    key: "sg_wall_graphics",
    name: "Wall Graphics",
    model: "AREA_TIERED",
    config: {
      tiers: toAreaTiers([[4, 13], [12, 10.50], [32, 8.50], [72, 7], [9999, 5.50]]),
      minimumPrice: 30,
      fileFee: 5,
    },
  },
  {
    key: "sg_floor_graphics",
    name: "Floor Graphics (Laminated)",
    model: "AREA_TIERED",
    config: {
      tiers: toAreaTiers([[4, 20], [12, 16.50], [32, 13], [72, 10.50], [9999, 8.50]]),
      minimumPrice: 40,
      fileFee: 5,
      finishings: [
        { id: "laminate_floor", name: "Floor-Grade Laminate", type: "per_sqft", price: 3.00 },
      ],
    },
  },
  {
    key: "sg_window_graphics",
    name: "Architectural Window Graphics",
    model: "AREA_TIERED",
    config: {
      tiers: toAreaTiers([[4, 15], [12, 12], [32, 10], [72, 8], [9999, 6.50]]),
      minimumPrice: 30,
      fileFee: 5,
    },
  },

  // ════════════════════════════════════════════════════════════════════
  // 6. Vehicle Graphics & Fleet
  // ════════════════════════════════════════════════════════════════════
  {
    key: "sg_vehicle_wraps",
    name: "Vehicle Wraps (Full, Print Only)",
    model: "AREA_TIERED",
    config: {
      tiers: toAreaTiers([[32, 15], [72, 12], [200, 10], [9999, 8.50]]),
      minimumPrice: 150,
      fileFee: 10,
      finishings: [
        { id: "laminate_vehicle", name: "Vehicle-Grade Laminate", type: "per_sqft", price: 2.50 },
        { id: "contour_cut", name: "Contour Cut", type: "flat", price: 25 },
      ],
    },
  },
  {
    key: "sg_door_panel_graphics",
    name: "Door & Panel Graphics",
    model: "AREA_TIERED",
    config: {
      tiers: toAreaTiers([[4, 18], [12, 14], [32, 11], [9999, 9]]),
      minimumPrice: 50,
      fileFee: 10,
      finishings: [
        { id: "laminate_vehicle", name: "Vehicle-Grade Laminate", type: "per_sqft", price: 2.50 },
      ],
    },
  },
  {
    key: "sg_vehicle_decals",
    name: "Vehicle Decals & Lettering",
    model: "AREA_TIERED",
    config: {
      tiers: toAreaTiers([[4, 16], [12, 13], [32, 10], [9999, 8]]),
      minimumPrice: 40,
      fileFee: 5,
      finishings: [
        { id: "laminate_3yr", name: "3-Year Outdoor Laminate", type: "per_unit", price: 5.00 },
        { id: "reflective", name: "Reflective", type: "per_unit", price: 8.00 },
      ],
    },
  },
  {
    key: "sg_magnetic_signs",
    name: "Magnetic Signs (12x24 Pair)",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[1, 65], [3, 170], [5, 260]]),
      minimumPrice: 65,
      fileFee: 5,
    },
  },
  {
    key: "sg_fleet_packages",
    name: "Fleet Packages (Per Vehicle)",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[1, 275], [3, 720], [5, 1100], [10, 2000]]),
      minimumPrice: 275,
      fileFee: 10,
    },
  },
  {
    key: "sg_dot_mc_numbers",
    name: "DOT & MC Numbers (Per Set)",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[1, 42], [3, 110], [5, 165], [10, 280]]),
      minimumPrice: 42,
      fileFee: 0,
    },
  },
  {
    key: "sg_unit_weight_ids",
    name: "Unit & Weight IDs",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[1, 35], [3, 90], [5, 135], [10, 230]]),
      minimumPrice: 35,
      fileFee: 0,
    },
  },
  {
    key: "sg_spec_labels",
    name: "Spec Labels",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[5, 28], [10, 45], [25, 85], [50, 140]]),
      minimumPrice: 28,
      fileFee: 0,
    },
  },
  {
    key: "sg_inspection_compliance",
    name: "Inspection & Compliance",
    model: "QTY_TIERED",
    config: {
      tiers: toTiers([[1, 45], [5, 180], [10, 320]]),
      minimumPrice: 45,
      fileFee: 0,
    },
  },
];

// ─── Sub-group slug → preset key mapping ─────────────────────────────
// Maps catalog subGroup slugs to preset keys
const SUBGROUP_TO_PRESET = {
  // Marketing & Business Print
  "business-cards": "sg_business_cards",
  "flyers": "sg_flyers",
  "postcards": "sg_postcards",
  "rack-cards": "sg_rack_cards",
  "brochures": "sg_brochures",
  "booklets": "sg_booklets",
  "door-hangers": "sg_door_hangers",
  "posters": "sg_posters",
  "ncr-forms": "sg_ncr_forms",
  "order-forms": "sg_ncr_forms",         // same pricing as NCR
  "waivers-releases": "sg_ncr_forms",    // same pricing as NCR
  "envelopes": "sg_envelopes",
  "letterhead": "sg_letterhead",
  "notepads": "sg_notepads",
  "stamps": "sg_stamps",
  "greeting-cards": "sg_greeting_cards",
  "invitation-cards": "sg_greeting_cards",
  "bookmarks": "sg_bookmarks",
  "certificates": "sg_certificates",
  "loyalty-cards": "sg_loyalty_cards",
  "table-tents": "sg_table_tents",
  "tickets-coupons": "sg_tickets_coupons",
  "shelf-displays": "sg_shelf_displays",
  "retail-tags": "sg_retail_tags",
  "tags": "sg_retail_tags",
  "inserts-packaging": "sg_packaging_inserts",
  "presentation-folders": "sg_presentation_folders",
  "calendars": "sg_calendars",
  "menus": "sg_menus",

  // Stickers, Labels & Decals
  "die-cut-stickers": "sg_die_cut_stickers",
  "kiss-cut-singles": "sg_kiss_cut_singles",
  "sticker-pages": "sg_sticker_pages",
  "sticker-rolls": "sg_sticker_rolls",
  "vinyl-lettering": "sg_vinyl_lettering",
  "fire-emergency": "sg_safety_fire_emergency",
  "hazard-warning": "sg_safety_hazard_warning",
  "ppe-equipment": "sg_safety_ppe_equipment",
  "electrical-chemical": "sg_safety_electrical_chemical",
  "asset-equipment-tags": "sg_asset_equipment_tags",
  "pipe-valve-labels": "sg_pipe_valve_labels",
  "warehouse-labels": "sg_warehouse_labels",
  "electrical-cable-labels": "sg_electrical_cable_labels",

  // Signs & Rigid Boards
  "yard-signs": "sg_yard_signs",
  "real-estate-signs": "sg_real_estate_signs",
  "foam-board-signs": "sg_foam_board_signs",
  "a-frame-signs": "sg_a_frame_signs",
  "election-signs": "sg_election_signs",
  "display-signs": "sg_display_signs",

  // Banners & Displays
  "vinyl-banners": "sg_vinyl_banners",
  "mesh-banners": "sg_mesh_banners",
  "pole-banners": "sg_pole_banners",
  "fabric-banners": "sg_fabric_banners",
  "retractable-stands": "sg_retractable_stands",
  "x-banner-stands": "sg_x_banner_stands",
  "tabletop-displays": "sg_tabletop_displays",
  "backdrops-popups": "sg_backdrops_popups",
  "flags-hardware": "sg_flags_hardware",
  "tents-outdoor": "sg_tents_outdoor",

  // Windows, Walls & Floors
  "static-clings": "sg_static_clings",
  "adhesive-films": "sg_adhesive_films",
  "one-way-vision": "sg_one_way_vision",
  "privacy-films": "sg_privacy_films",
  "window-lettering": "sg_window_lettering",
  "canvas-prints": "sg_canvas_prints",
  "wall-graphics": "sg_wall_graphics",
  "floor-graphics": "sg_floor_graphics",
  "window-graphics": "sg_window_graphics",

  // Vehicle Graphics & Fleet
  "vehicle-wraps": "sg_vehicle_wraps",
  "door-panel-graphics": "sg_door_panel_graphics",
  "vehicle-decals": "sg_vehicle_decals",
  "vehicle-graphics": "sg_vehicle_decals",  // alias
  "magnetic-signs": "sg_magnetic_signs",
  "fleet-packages": "sg_fleet_packages",
  "dot-mc-numbers": "sg_dot_mc_numbers",
  "unit-weight-ids": "sg_unit_weight_ids",
  "spec-labels": "sg_spec_labels",
  "inspection-compliance": "sg_inspection_compliance",
};

// ─── Product slug → subGroup slug mapping ────────────────────────────
// For products whose slug doesn't directly match a subGroup, map them explicitly.
// The script will also try to infer sub-group from the product's tags array.
const PRODUCT_SLUG_OVERRIDES = {
  // Stamps
  "stamps-r512": "stamps",
  "stamps-r524": "stamps",
  "stamps-r532": "stamps",
  "stamps-r552": "stamps",
  "stamps-s510": "stamps",
  "stamps-s542": "stamps",
  "stamps-s827": "stamps",
  // Booklets
  "booklets-perfect-bound": "booklets",
  "booklets-saddle-stitch": "booklets",
  "booklets-wire-o": "booklets",
  // Brochures
  "brochures-bi-fold": "brochures",
  "brochures-tri-fold": "brochures",
  "brochures-z-fold": "brochures",
  // Calendars
  "calendars-wall": "calendars",
  "calendars-wall-desk": "calendars",
  // Presentation folders
  "presentation-folders-die-cut": "presentation-folders",
  "presentation-folders-legal": "presentation-folders",
  "presentation-folders-reinforced": "presentation-folders",
  "presentation-folders-standard": "presentation-folders",
  // NCR / forms
  "ncr-invoice-books": "ncr-forms",
  "ncr-invoices": "ncr-forms",
  "ncr-forms-duplicate": "ncr-forms",
  "ncr-forms-triplicate": "ncr-forms",
  "order-form-pads": "order-forms",
  "order-forms-single": "order-forms",
  "release-forms": "waivers-releases",
  "release-waiver-forms": "waivers-releases",
  // Stationery
  "letterhead-standard": "letterhead",
  "envelopes-10-business": "envelopes",
  "envelopes-6x9-catalog": "envelopes",
  "envelopes-9x12-catalog": "envelopes",
  "envelopes-a7-invitation": "envelopes",
  "notepads-custom": "notepads",
  "bf-notepads": "notepads",
  "bf-letterhead": "letterhead",
  "bf-certificates": "certificates",
  "packing-slips": "inserts-packaging",
  // Packaging
  "hang-tags": "retail-tags",
  "hang-tags-custom": "retail-tags",
  "tags-hang-tags": "retail-tags",
  "label-sets": "retail-tags",
  "packaging-inserts": "inserts-packaging",
  "sticker-seals": "inserts-packaging",
  "thank-you-cards": "greeting-cards",
  "box-sleeves": "inserts-packaging",
  "product-inserts": "inserts-packaging",
  // Signs
  "yard-signs-coroplast": "yard-signs",
  // Business cards
  "magnets-business-card": "business-cards",
  // Vehicle
  "custom-printed-vehicle-logo-decals": "vehicle-decals",
  "long-term-outdoor-vehicle-decals": "vehicle-decals",
  "partial-wrap-spot-graphics": "vehicle-wraps",
  "printed-truck-door-decals-full-color": "door-panel-graphics",
  "removable-promo-vehicle-decals": "vehicle-decals",
  "tailgate-rear-door-printed-decal": "door-panel-graphics",
  "trailer-box-truck-large-graphics": "vehicle-wraps",
  "truck-side-panel-printed-decal": "door-panel-graphics",
  "vehicle-wrap-print-only-quote": "vehicle-wraps",
  // Display hardware (map to nearest sub-group)
  "a-frame-sign-stand": "a-frame-signs",
  "a-frame-stand": "a-frame-signs",
  "banner-stand-rollup": "retractable-stands",
  "banner-stand-l-base": "retractable-stands",
  "banner-stand-x": "x-banner-stands",
  "deluxe-rollup-banner": "retractable-stands",
  "deluxe-tabletop-retractable-a3": "tabletop-displays",
  "feather-flag-large": "flags-hardware",
  "feather-flag-medium": "flags-hardware",
  "feather-flag-pole-set": "flags-hardware",
  "flag-base-ground-stake": "flags-hardware",
  "flag-base-water-bag": "flags-hardware",
  "flag-bases-cross": "flags-hardware",
  "l-base-banner-stand": "retractable-stands",
  "outdoor-canopy-tent-10x10": "tents-outdoor",
  "popup-display-curved-8ft": "backdrops-popups",
  "popup-display-straight-8ft": "backdrops-popups",
  "roll-up-stand-hardware": "retractable-stands",
  "step-and-repeat-stand-kit": "backdrops-popups",
  "step-repeat-backdrop-8x8": "backdrops-popups",
  "tabletop-banner-a3": "tabletop-displays",
  "tabletop-x-banner": "tabletop-displays",
  "teardrop-flag-medium": "flags-hardware",
  "teardrop-flag-pole-set": "flags-hardware",
  "tension-fabric-display-3x3": "backdrops-popups",
  "tent-frame-10x10": "tents-outdoor",
  "tent-walls-set": "tents-outdoor",
  "x-banner-stand-large": "x-banner-stands",
  "x-stand-hardware": "x-banner-stands",
  "real-estate-frame": "real-estate-signs",
  "branded-table-cover-6ft": "tabletop-displays",
  "branded-table-runner": "tabletop-displays",
};

// ─── Resolve product → preset key ────────────────────────────────────
function resolvePresetKey(product) {
  const slug = product.slug;

  // 1. Check explicit slug overrides
  const overrideSg = PRODUCT_SLUG_OVERRIDES[slug];
  if (overrideSg) {
    const presetKey = SUBGROUP_TO_PRESET[overrideSg];
    if (presetKey) return presetKey;
  }

  // 2. Check if product slug directly matches a subGroup slug
  if (SUBGROUP_TO_PRESET[slug]) {
    return SUBGROUP_TO_PRESET[slug];
  }

  // 3. Check product tags for matching subGroup slugs
  if (product.tags?.length) {
    for (const tag of product.tags) {
      if (SUBGROUP_TO_PRESET[tag]) {
        return SUBGROUP_TO_PRESET[tag];
      }
    }
  }

  return null; // no match — keep current preset
}

// ─── Main ────────────────────────────────────────────────────────────
async function main() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      slug: true,
      category: true,
      pricingUnit: true,
      basePrice: true,
      tags: true,
      pricingPreset: { select: { key: true } },
    },
    orderBy: [{ category: "asc" }, { slug: "asc" }],
  });

  // Build assignment plan
  const plan = [];
  const unmatched = [];
  for (const p of products) {
    const newKey = resolvePresetKey(p);
    if (newKey) {
      if (newKey !== p.pricingPreset?.key) {
        plan.push({ id: p.id, slug: p.slug, from: p.pricingPreset?.key || "(none)", to: newKey });
      }
    } else {
      unmatched.push(p.slug);
    }
  }

  // Count by target preset
  const byKey = {};
  for (const row of plan) byKey[row.to] = (byKey[row.to] || 0) + 1;

  console.log(`\n[sg-pricing] total active products: ${products.length}`);
  console.log(`[sg-pricing] products to reassign: ${plan.length}`);
  console.log(`[sg-pricing] unmatched (keeping current): ${unmatched.length}`);
  console.log("[sg-pricing] by preset:", JSON.stringify(byKey, null, 2));

  if (unmatched.length > 0) {
    console.log("\n[sg-pricing] unmatched slugs:");
    for (const s of unmatched) console.log(`  - ${s}`);
  }

  if (!APPLY) {
    console.log("\n[sg-pricing] dry-run preview:");
    for (const row of plan) {
      console.log(`  ${row.slug}: ${row.from} -> ${row.to}`);
    }
    console.log(`\n[sg-pricing] ${SUBGROUP_PRESETS.length} presets defined`);
    console.log("[sg-pricing] pass --apply to write changes.");
    return;
  }

  // 1. Upsert all sub-group presets
  console.log("\n[sg-pricing] upserting presets...");
  const presetIdByKey = new Map();
  for (const preset of SUBGROUP_PRESETS) {
    const row = await prisma.pricingPreset.upsert({
      where: { key: preset.key },
      create: { key: preset.key, name: preset.name, model: preset.model, config: preset.config, isActive: true },
      update: { name: preset.name, model: preset.model, config: preset.config, isActive: true },
    });
    presetIdByKey.set(preset.key, row.id);
    console.log(`  upserted ${preset.key} -> ${row.id}`);
  }

  // 2. Assign products
  console.log("\n[sg-pricing] assigning products...");
  let updated = 0;
  for (const row of plan) {
    const presetId = presetIdByKey.get(row.to);
    if (!presetId) {
      console.warn(`  SKIP ${row.slug}: no preset ID for ${row.to}`);
      continue;
    }
    await prisma.product.update({
      where: { id: row.id },
      data: { pricingPresetId: presetId },
    });
    console.log(`  ${row.slug}: ${row.from} -> ${row.to}`);
    updated++;
  }

  console.log(`\n[sg-pricing] done! updated ${updated} products across ${presetIdByKey.size} presets.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
