import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const OUT_DIR = path.join(process.cwd(), "docs", "lalunar-deliverables");
fs.mkdirSync(OUT_DIR, { recursive: true });

function csvEscape(value) {
  const s = String(value ?? "");
  return `"${s.replaceAll('"', '""')}"`;
}

function parseCsv(file) {
  const raw = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  const lines = raw.trim().split(/\r?\n/);
  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    const cols = [];
    let cur = "";
    let quoted = false;
    for (let j = 0; j < line.length; j += 1) {
      const ch = line[j];
      if (ch === '"') {
        if (quoted && line[j + 1] === '"') {
          cur += '"';
          j += 1;
        } else {
          quoted = !quoted;
        }
      } else if (ch === "," && !quoted) {
        cols.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    cols.push(cur);
    rows.push(cols);
  }
  return rows;
}

function loadCatalogDefaults() {
  let code = fs.readFileSync(path.join(process.cwd(), "lib", "catalogConfig.js"), "utf8");
  code = code.replace(/import\s+\{\s*prisma\s*\}\s+from\s+"@\/lib\/prisma";?/, 'const prisma={setting:{findUnique:async()=>null}};');
  code = code.replace(/export\s+\{[^}]+\};?/g, "");
  code = code.replace(/export\s+const\s+/g, "const ");
  code = code.replace(/export\s+async\s+function\s+/g, "async function ");
  code = code.replace(/export\s+function\s+/g, "function ");
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(`${code}; this.DEFAULTS = DEFAULTS;`, ctx);
  return ctx.DEFAULTS;
}

function loadSubProductConfig() {
  let code = fs.readFileSync(path.join(process.cwd(), "lib", "subProductConfig.js"), "utf8");
  code = code.replace(/export\s+const\s+/g, "const ");
  code = code.replace(/export\s+function\s+/g, "function ");
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(`${code}; this.SUB_PRODUCT_CONFIG = SUB_PRODUCT_CONFIG;`, ctx);
  return ctx.SUB_PRODUCT_CONFIG;
}

const liveRows = parseCsv(path.join(process.cwd(), "docs", "category-under-products-live-order.csv")).map((a) => ({
  category: a[0],
  categoryTitle: a[1],
  subgroup: a[2],
  subgroupTitle: a[3],
  slug: a[4],
  id: a[5],
  sort: Number(a[6] || 0),
}));

const liveByCategory = new Map();
for (const row of liveRows) {
  if (!liveByCategory.has(row.category)) liveByCategory.set(row.category, []);
  liveByCategory.get(row.category).push(row);
}

const catalog = loadCatalogDefaults();
const subConfig = loadSubProductConfig();

function getCatalogSubGroups(categoryKey) {
  return catalog.categoryMeta?.[categoryKey]?.subGroups ?? [];
}

function buildMarketingRows() {
  const rows = [];
  const excludedParents = new Set(["stamps", "shelf-displays"]);
  for (const group of getCatalogSubGroups("marketing-business-print")) {
    if (excludedParents.has(group.slug)) continue;
    const cfg = subConfig[group.slug];
    if (cfg && Array.isArray(cfg.dbSlugs) && cfg.dbSlugs.length > 0) {
      for (const slug of cfg.dbSlugs) {
        rows.push({
          oldCategory: "marketing-business-print",
          parentSlug: group.slug,
          oldSlug: slug,
          sourceType: "subProductExpand",
          selectionReason: `Expanded from catalog subgroup ${group.slug}`,
        });
      }
    } else {
      rows.push({
        oldCategory: "marketing-business-print",
        parentSlug: group.slug,
        oldSlug: group.slug,
        sourceType: "catalogSubGroup",
        selectionReason: `Direct catalog subgroup page ${group.slug}`,
      });
    }
  }
  return rows;
}

function buildStickerRows() {
  const excludedSubgroups = new Set(["vinyl-lettering", "electrical-cable-labels"]);
  return (liveByCategory.get("stickers-labels-decals") || [])
    .filter((r) => !excludedSubgroups.has(r.subgroup))
    .map((r) => ({
      oldCategory: r.category,
      parentSlug: r.subgroup,
      oldSlug: r.slug,
      sourceType: "liveProduct",
      selectionReason: "Live product export row (selected sticker/label SEO set)",
    }));
}

function buildSignsRows() {
  return getCatalogSubGroups("signs-rigid-boards").map((g) => ({
    oldCategory: "signs-rigid-boards",
    parentSlug: g.slug,
    oldSlug: g.slug,
    sourceType: "catalogSubGroup",
    selectionReason: "Current sign family page from catalog config",
  }));
}

function buildBannersRows() {
  const curated = [
    ["vinyl-banners", "vinyl-banners", "Vinyl banner family"],
    ["mesh-banners", "mesh-banners", "Mesh banner family"],
    ["roll-up-banners", "retractable-stands", "Retractable / roll-up banners"],
    ["x-banner-prints", "x-banner-stands", "X-banners"],
    ["tabletop-displays", "tabletop-displays", "Tabletop banner/display family"],
    ["double-sided-banners", "vinyl-banners", "Dedicated double-sided banner page"],
    ["pole-banners", "pole-banners", "Pole banners"],
    ["step-repeat-backdrops", "backdrops-popups", "Backdrop / step & repeat"],
    ["feather-flags", "flags-hardware", "Feather flags"],
    ["teardrop-flags", "flags-hardware", "Teardrop flags"],
    ["outdoor-canopy-tent-10x10", "tents-outdoor", "Custom tent 10x10"],
    ["telescopic-backdrop", "backdrops-popups", "Adjustable telescopic backdrop"],
    ["tension-fabric-display-3x3", "backdrops-popups", "Fabric pop-up display representative"],
    ["table-cloth", "tabletop-displays", "Table cloth"],
  ];
  return curated.map(([oldSlug, parentSlug, note]) => ({
    oldCategory: "banners-displays",
    parentSlug,
    oldSlug,
    sourceType: "curatedCanonical",
    selectionReason: note,
  }));
}

function buildCanvasRows() {
  return getCatalogSubGroups("canvas-prints").map((g) => ({
    oldCategory: "canvas-prints",
    parentSlug: g.slug,
    oldSlug: g.slug,
    sourceType: "catalogSubGroup",
    selectionReason: "Current canvas family page from catalog config",
  }));
}

function buildVehicleRows() {
  return (liveByCategory.get("vehicle-graphics-fleet") || []).map((r) => ({
    oldCategory: r.category,
    parentSlug: r.subgroup,
    oldSlug: r.slug,
    sourceType: "liveProduct",
    selectionReason: "All vehicle/fleet live products included",
  }));
}

function buildWindowsRows() {
  return getCatalogSubGroups("windows-walls-floors").map((g) => ({
    oldCategory: "windows-walls-floors",
    parentSlug: g.slug,
    oldSlug: g.slug,
    sourceType: "catalogSubGroup",
    selectionReason: "Current windows/walls/floors family page from catalog config",
  }));
}

const selectedRowsByCategory = {
  "stickers-labels-decals": buildStickerRows(),
  "marketing-business-print": buildMarketingRows(),
  "signs-rigid-boards": buildSignsRows(),
  "banners-displays": buildBannersRows(),
  "canvas-prints": buildCanvasRows(),
  "vehicle-graphics-fleet": buildVehicleRows(),
  "windows-walls-floors": buildWindowsRows(),
};

const expectedCounts = {
  "stickers-labels-decals": 57,
  "marketing-business-print": 62,
  "signs-rigid-boards": 12,
  "banners-displays": 14,
  "canvas-prints": 7,
  "vehicle-graphics-fleet": 46,
  "windows-walls-floors": 9,
};

for (const [cat, expected] of Object.entries(expectedCounts)) {
  const got = selectedRowsByCategory[cat]?.length ?? 0;
  if (got !== expected) throw new Error(`Count mismatch for ${cat}: expected ${expected}, got ${got}`);
}

const categorySegmentMap = {
  "marketing-business-print": "print",
  "stickers-labels-decals": "stickers",
  "signs-rigid-boards": "signs",
  "banners-displays": "banners",
  "canvas-prints": "canvas",
  "vehicle-graphics-fleet": "vehicle-graphics",
  "windows-walls-floors": "surface-graphics",
};

const categoryLabels = {
  "marketing-business-print": "Marketing & Business Print",
  "stickers-labels-decals": "Stickers, Labels & Decals",
  "signs-rigid-boards": "Signs & Rigid Boards",
  "banners-displays": "Banners & Displays",
  "canvas-prints": "Canvas Prints",
  "vehicle-graphics-fleet": "Vehicle Graphics & Fleet",
  "windows-walls-floors": "Windows, Walls & Floors",
};

const slugAliasByCategory = {
  "signs-rigid-boards": {
    "yard-sign": "yard-signs",
    "real-estate-sign": "real-estate-signs",
    "selfie-frame-board": "event-photo-boards",
    "welcome-sign-board": "event-welcome-signs",
    "tri-fold-presentation-board": "presentation-boards",
    "a-frame-sign-stand": "a-frame-signs",
    "h-stakes": "h-wire-stakes",
    "real-estate-frame": "real-estate-sign-frames",
  },
  "banners-displays": {
    "roll-up-banners": "retractable-banners",
    "x-banner-prints": "x-banners",
    "tabletop-displays": "tabletop-banners",
    "outdoor-canopy-tent-10x10": "custom-tent-10x10",
    "telescopic-backdrop": "adjustable-telescopic-backdrop",
    "tension-fabric-display-3x3": "fabric-pop-up-display",
    "table-cloth": "table-cloths",
  },
  "windows-walls-floors": {
    "one-way-vision": "one-way-vision-film",
    "frosted-window-film": "frosted-privacy-film",
    "static-cling": "static-clings",
    "transparent-color-film": "window-color-films",
    "blockout-vinyl": "blockout-window-vinyl",
    "opaque-window-graphics": "window-decals-opaque",
    "glass-waistline": "glass-waistline-stripes",
  },
};

function newProductSlug(row) {
  const catAliases = slugAliasByCategory[row.oldCategory] || {};
  if (catAliases[row.oldSlug]) return catAliases[row.oldSlug];

  if (row.oldCategory === "marketing-business-print") {
    if (
      [
        "business-cards",
        "business-cards-classic",
        "business-cards-gloss",
        "business-cards-matte",
        "business-cards-soft-touch",
        "business-cards-gold-foil",
        "business-cards-linen",
        "business-cards-pearl",
        "business-cards-thick",
      ].includes(row.oldSlug)
    ) {
      return "business-cards";
    }
    if (row.oldSlug === "magnets-business-card") return "business-card-magnets";
    if (row.parentSlug === "brochures") return "brochures";
    if (row.parentSlug === "booklets") return "booklets";
    if (row.parentSlug === "door-hangers") return "door-hangers";
    if (row.parentSlug === "greeting-invitation-cards") return "greeting-invitation-cards";
    if (row.parentSlug === "ncr-forms") return "ncr-forms";
    if (row.parentSlug === "letterhead") return "letterheads";
    if (row.parentSlug === "bookmarks") return "bookmarks";
    if (row.parentSlug === "calendars") return "calendars";
    if (row.parentSlug === "notepads") return "notepads";
    if (row.parentSlug === "envelopes") return "envelopes";
    if (row.parentSlug === "tags") return "hang-tags";
    if (row.parentSlug === "table-tents") return "table-tents";
    if (row.parentSlug === "tickets-coupons") return "tickets-coupons";
    if (row.parentSlug === "shelf-displays") return "shelf-displays";
    if (row.parentSlug === "rack-cards") return "rack-cards";
    if (row.parentSlug === "document-printing") return "document-printing";
    if (row.parentSlug === "menus") return "menus";
    if (row.parentSlug === "posters") return "posters";
    if (row.parentSlug === "postcards") return "postcards";
    if (row.parentSlug === "flyers") return "flyers";
    if (row.parentSlug === "certificates") return "certificates";
  }

  if (row.oldCategory === "stickers-labels-decals") {
    if (row.parentSlug === "die-cut-stickers") return "die-cut-stickers";
    if (row.parentSlug === "kiss-cut-singles") return "kiss-cut-stickers";
    if (row.parentSlug === "sticker-pages") return "sticker-sheets";
    if (row.parentSlug === "sticker-rolls") return "roll-labels";
    if (row.parentSlug === "fire-emergency") return "safety-emergency-labels";
    if (row.parentSlug === "hazard-warning") return "hazard-warning-labels";
    if (row.parentSlug === "ppe-equipment") return "ppe-equipment-labels";
    if (row.parentSlug === "electrical-chemical") return "electrical-chemical-labels";
    if (row.parentSlug === "asset-equipment-tags") return "asset-equipment-labels";
    if (row.parentSlug === "pipe-valve-labels") return "pipe-valve-labels";
    if (row.parentSlug === "warehouse-labels") return "warehouse-labels";
  }

  if (row.oldCategory === "vehicle-graphics-fleet") {
    if (row.parentSlug === "vehicle-wraps") return "vehicle-wraps";
    if (row.parentSlug === "door-panel-graphics") return "truck-door-logo-decals";
    if (row.parentSlug === "vehicle-decals") return "vehicle-decals-lettering";
    if (row.parentSlug === "magnetic-signs") return "magnetic-vehicle-signs";
    if (row.parentSlug === "fleet-packages") return "fleet-branding-kits";
    if (row.parentSlug === "dot-mc-numbers") return "dot-mc-cvor-number-decals";
    if (row.parentSlug === "unit-weight-ids") return "fleet-unit-number-weight-decals";
    if (row.parentSlug === "spec-labels") return "fleet-spec-safety-labels";
    if (row.parentSlug === "inspection-compliance") return "fleet-inspection-compliance-kits";
  }

  return row.oldSlug;
}

function buildNewUrl(row) {
  const categorySegment = categorySegmentMap[row.oldCategory];
  const productSlug = newProductSlug(row);
  return `/${categorySegment}/${productSlug}/`;
}

function currentUrlHints(row) {
  const hints = [];
  hints.push(`/shop/${row.oldCategory}/${row.oldSlug}/`);
  hints.push(`/order/${row.oldSlug}/`);
  if (row.parentSlug && row.parentSlug !== row.oldSlug) hints.push(`/shop/${row.oldCategory}/${row.parentSlug}/`);
  return [...new Set(hints)].join(" | ");
}

const allRows = Object.entries(selectedRowsByCategory)
  .flatMap(([category, rows]) => rows.map((row) => ({ ...row, oldCategory: category })))
  .map((row) => ({
    ...row,
    newCategorySegment: categorySegmentMap[row.oldCategory],
    newProductSlug: newProductSlug(row),
    newUrl: buildNewUrl(row),
    currentUrlHints: currentUrlHints(row),
  }));

if (allRows.length !== 207) throw new Error(`Expected 207 rows total, got ${allRows.length}`);

const headers = [
  "old_category",
  "old_category_label",
  "old_parent_slug",
  "old_slug",
  "source_type",
  "new_category_segment",
  "new_product_slug",
  "new_url",
  "current_url_hints",
  "redirect_type",
  "selection_reason",
];

const csv = [headers.join(",")]
  .concat(
    allRows
      .slice()
      .sort((a, b) => {
        if (a.oldCategory !== b.oldCategory) return a.oldCategory.localeCompare(b.oldCategory);
        return a.oldSlug.localeCompare(b.oldSlug);
      })
      .map((r) =>
        [
          r.oldCategory,
          categoryLabels[r.oldCategory],
          r.parentSlug,
          r.oldSlug,
          r.sourceType,
          r.newCategorySegment,
          r.newProductSlug,
          r.newUrl,
          r.currentUrlHints,
          "301",
          r.selectionReason,
        ]
          .map(csvEscape)
          .join(",")
      )
  )
  .join("\n");

fs.writeFileSync(path.join(OUT_DIR, "url-mapping.csv"), "\uFEFF" + csv, "utf8");

const summary = Object.fromEntries(Object.entries(selectedRowsByCategory).map(([k, v]) => [k, v.length]));

const landingPages = [
  ["Business Cards", "/printing/business-cards-scarborough/", "Local service + core product", "/print/business-cards/"],
  ["Business Cards", "/printing/rush-business-cards-toronto/", "Rush turnaround", "/print/business-cards/"],
  ["Business Cards", "/printing/real-estate-business-cards-gta/", "Industry use case", "/print/business-cards/"],
  ["Flyers", "/printing/flyers-scarborough/", "Local product query", "/print/flyers/"],
  ["Flyers", "/printing/same-day-flyer-printing-toronto/", "Same-day / rush", "/print/flyers/"],
  ["Flyers", "/printing/restaurant-flyers-gta/", "Restaurant promo use case", "/print/flyers/"],
  ["Postcards", "/printing/postcards-scarborough/", "Local product query", "/print/postcards/"],
  ["Postcards", "/printing/direct-mail-postcards-toronto/", "Direct mail campaign", "/print/postcards/"],
  ["Postcards", "/printing/realtor-postcards-gta/", "Realtor farming use case", "/print/postcards/"],
  ["Brochures", "/printing/brochure-printing-scarborough/", "Local brochure search", "/print/brochures/"],
  ["Brochures", "/printing/tri-fold-brochures-toronto/", "Format-specific search", "/print/brochures/"],
  ["Brochures", "/printing/company-brochures-gta/", "B2B collateral", "/print/brochures/"],
  ["Booklets", "/printing/booklet-printing-scarborough/", "Local booklet search", "/print/booklets/"],
  ["Booklets", "/printing/saddle-stitch-booklets-toronto/", "Binding-specific search", "/print/booklets/"],
  ["Booklets", "/printing/program-booklets-gta/", "Event program use case", "/print/booklets/"],
  ["Menus", "/printing/menu-printing-scarborough/", "Local menu printing", "/print/menus/"],
  ["Menus", "/printing/takeout-menus-toronto/", "Restaurant takeout menu", "/print/menus/"],
  ["Menus", "/printing/laminated-menus-gta/", "Finish-specific search", "/print/menus/"],
  ["Door Hangers", "/printing/door-hangers-scarborough/", "Local product query", "/print/door-hangers/"],
  ["Door Hangers", "/printing/real-estate-door-hangers-toronto/", "Realtor use case", "/print/door-hangers/"],
  ["Door Hangers", "/printing/promo-door-hangers-gta/", "Campaign use case", "/print/door-hangers/"],
  ["NCR Forms", "/printing/ncr-forms-scarborough/", "Local business forms", "/print/ncr-forms/"],
  ["NCR Forms", "/printing/carbonless-invoice-books-toronto/", "Invoice books", "/print/ncr-forms/"],
  ["NCR Forms", "/printing/work-order-forms-gta/", "Service business use case", "/print/ncr-forms/"],
  ["Rack Cards", "/printing/rack-cards-scarborough/", "Local rack card printing", "/print/rack-cards/"],
  ["Rack Cards", "/printing/tourism-rack-cards-toronto/", "Hospitality/tourism use case", "/print/rack-cards/"],
  ["Rack Cards", "/printing/clinic-rack-cards-gta/", "Clinic use case", "/print/rack-cards/"],
  ["Posters", "/printing/poster-printing-scarborough/", "Local poster printing", "/print/posters/"],
  ["Posters", "/printing/13x19-posters-toronto/", "Size-specific search", "/print/posters/"],
  ["Posters", "/printing/event-posters-gta/", "Event promo use case", "/print/posters/"],

  ["Die-Cut Stickers", "/printing/custom-stickers-scarborough/", "Local sticker query", "/stickers/die-cut-stickers/"],
  ["Die-Cut Stickers", "/printing/die-cut-stickers-toronto/", "Product + city", "/stickers/die-cut-stickers/"],
  ["Kiss-Cut Stickers", "/printing/kiss-cut-stickers-scarborough/", "Local product query", "/stickers/kiss-cut-stickers/"],
  ["Sticker Sheets", "/printing/sticker-sheets-toronto/", "Product + city", "/stickers/sticker-sheets/"],
  ["Sticker Sheets / Labels", "/printing/packaging-stickers-gta/", "Packaging use case", "/stickers/sticker-sheets/ | /stickers/roll-labels/"],
  ["Roll Labels", "/printing/roll-labels-scarborough/", "Local roll-label query", "/stickers/roll-labels/"],
  ["Roll Labels", "/printing/bottle-label-printing-toronto/", "Bottle label packaging", "/stickers/roll-labels/"],
  ["Roll Labels", "/printing/jar-labels-gta/", "Jar label packaging", "/stickers/roll-labels/"],
  ["Decals", "/printing/vinyl-decals-scarborough/", "Local decals query", "/stickers/die-cut-stickers/ | /surface-graphics/window-decals-opaque/"],

  ["Yard Signs", "/printing/yard-signs-scarborough/", "Local yard signs", "/signs/yard-signs/"],
  ["Yard Signs", "/printing/coroplast-yard-signs-toronto/", "Material-specific search", "/signs/yard-signs/"],
  ["Yard Signs", "/printing/yard-signs-near-me-gta/", "Near me", "/signs/yard-signs/"],
  ["Real Estate Signs", "/printing/real-estate-signs-scarborough/", "Realtor signage", "/signs/real-estate-signs/"],
  ["Open House Signs", "/printing/open-house-signs-toronto/", "Open house wayfinding", "/signs/open-house-signs/"],
  ["Election Signs", "/printing/election-signs-gta/", "Campaign signage", "/signs/election-signs/"],
  ["Directional Signs", "/printing/directional-signs-scarborough/", "Wayfinding signage", "/signs/directional-signs/"],
  ["Foam / Event Boards", "/printing/foam-board-prints-toronto/", "Indoor display boards", "/signs/event-photo-boards/ | /signs/presentation-boards/"],
  ["A-Frame Signs", "/printing/a-frame-signs-gta/", "Sidewalk signage", "/signs/a-frame-signs/"],

  ["Vinyl Banners", "/printing/vinyl-banners-scarborough/", "Local banner query", "/banners/vinyl-banners/"],
  ["Mesh Banners", "/printing/mesh-banners-gta/", "Fence/construction banner use case", "/banners/mesh-banners/"],
  ["Retractable Banners", "/printing/retractable-banners-scarborough/", "Trade show display", "/banners/retractable-banners/"],
  ["Retractable Banners", "/printing/roll-up-banners-toronto/", "Synonym capture", "/banners/retractable-banners/"],
  ["X-Banners", "/printing/x-banners-gta/", "Budget event display", "/banners/x-banners/"],
  ["Tabletop Banners", "/printing/tabletop-banners-scarborough/", "Counter display", "/banners/tabletop-banners/"],
  ["Backdrops", "/printing/step-and-repeat-backdrops-toronto/", "Event backdrop", "/banners/step-repeat-backdrops/"],
  ["Trade Show Displays", "/printing/trade-show-displays-gta/", "Cluster page for booth displays", "/banners/retractable-banners/ | /banners/fabric-pop-up-display/ | /banners/step-repeat-backdrops/"],
  ["Feather Flags", "/printing/feather-flags-scarborough/", "Outdoor event display", "/banners/feather-flags/"],
  ["Teardrop Flags", "/printing/teardrop-flags-toronto/", "Outdoor event display", "/banners/teardrop-flags/"],
  ["Custom Tents", "/printing/custom-event-tents-gta/", "Event canopy search", "/banners/custom-tent-10x10/"],
  ["Table Cloths", "/printing/table-cloths-scarborough/", "Exhibition table branding", "/banners/table-cloths/"],
  ["Telescopic Backdrops", "/printing/telescopic-backdrops-toronto/", "Portable backdrop stand", "/banners/adjustable-telescopic-backdrop/"],
  ["Fabric Pop-Up Displays", "/printing/fabric-pop-up-displays-gta/", "Trade show booth display", "/banners/fabric-pop-up-display/"],

  ["Canvas Prints", "/printing/canvas-prints-scarborough/", "Local canvas prints", "/canvas/canvas-prints/"],
  ["Gallery Wrap Canvas", "/printing/gallery-wrap-canvas-toronto/", "Gallery wrap intent", "/canvas/large-format-canvas/ | /canvas/canvas-prints/"],
  ["Framed Canvas", "/printing/framed-canvas-gta/", "Framed wall art intent", "/canvas/floating-frame-canvas/"],
  ["Multi-Panel Canvas", "/printing/multi-panel-canvas-toronto/", "Triptych/split panel intent", "/canvas/triptych-canvas-split/ | /canvas/canvas-collages/"],

  ["Window Decals", "/printing/window-decals-scarborough/", "Storefront decal query", "/surface-graphics/window-decals-opaque/"],
  ["One-Way Vision", "/printing/one-way-vision-film-toronto/", "Perforated film query", "/surface-graphics/one-way-vision-film/"],
  ["Frosted Film", "/printing/frosted-window-film-gta/", "Privacy film query", "/surface-graphics/frosted-privacy-film/"],
  ["Wall Graphics", "/printing/wall-decals-scarborough/", "Wall decal / mural intent", "/surface-graphics/wall-graphics/"],
  ["Floor Graphics", "/printing/floor-decals-toronto/", "Floor decal / wayfinding intent", "/surface-graphics/floor-graphics/"],
  ["Storefront Graphics", "/printing/storefront-window-graphics-gta/", "Window graphics cluster", "/surface-graphics/window-decals-opaque/ | /surface-graphics/one-way-vision-film/ | /surface-graphics/frosted-privacy-film/"],

  ["Vehicle Lettering", "/printing/vehicle-lettering-scarborough/", "Core local vehicle lettering", "/vehicle-graphics/vehicle-decals-lettering/"],
  ["Van/Truck Logo Decals", "/printing/van-logo-decals-toronto/", "Service van branding", "/vehicle-graphics/truck-door-logo-decals/"],
  ["Car Graphics", "/printing/car-graphics-gta/", "Car branding", "/vehicle-graphics/vehicle-wraps/ | /vehicle-graphics/vehicle-decals-lettering/"],
  ["Fleet Unit Numbers", "/printing/fleet-unit-number-decals-scarborough/", "Fleet ID decals", "/vehicle-graphics/fleet-unit-number-weight-decals/"],
  ["CVOR/DOT/MC", "/printing/cvor-number-decals-toronto/", "Compliance number decals", "/vehicle-graphics/dot-mc-cvor-number-decals/"],
  ["Truck Door Lettering", "/printing/truck-door-lettering-scarborough/", "Truck door kit search", "/vehicle-graphics/truck-door-logo-decals/"],
  ["Magnetic Signs", "/printing/magnetic-vehicle-signs-toronto/", "Temporary vehicle signage", "/vehicle-graphics/magnetic-vehicle-signs/"],
  ["Fleet Branding", "/printing/fleet-branding-gta/", "Fleet package cluster", "/vehicle-graphics/fleet-branding-kits/ | /vehicle-graphics/vehicle-wraps/"],
];

if (landingPages.length < 50 || landingPages.length > 80) {
  throw new Error(`Landing page count out of range: ${landingPages.length}`);
}

const mappingExamples = allRows
  .filter((r) =>
    [
      "marketing-business-print",
      "stickers-labels-decals",
      "signs-rigid-boards",
      "banners-displays",
      "vehicle-graphics-fleet",
      "windows-walls-floors",
      "canvas-prints",
    ].includes(r.oldCategory)
  )
  .slice(0, 20)
  .map((r) => `| ${r.oldCategory} | ${r.oldSlug} | ${r.newUrl} | ${r.sourceType} |`)
  .join("\n");

const landingTable = landingPages
  .map(([cluster, url, intent, targets]) => `| ${url} | ${cluster} | ${intent} | ${targets} |`)
  .join("\n");

const seoTechnicalSpec = `# lunarprint.ca SEO Technical Spec (URL Architecture + Technical SEO)

## 0) Scope & Deliverables

This spec defines the canonical URL architecture, landing-page structure, technical SEO rules, redirect strategy, and JSON-LD implementation guidance for **lunarprint.ca**.

Output files:
- \`url-mapping.csv\` (207-row old slug -> new canonical URL mapping)
- \`schema-templates.json\` (JSON-LD templates)
- \`seo-technical-spec.md\` (this document)

Business context:
- **La Lunar Printing**
- **11 Progress Ave #21, Scarborough, ON**
- Service area: **GTA (Greater Toronto Area)**
- Core customers: small businesses, real estate agents, restaurants, event planners

## 1) Canonical URL Structure

### 1.1 Global URL Rules
- Product URLs must stay within max depth \`/category/product/\`
- Lowercase only
- Hyphen-separated slugs only
- Trailing slash on all canonical URLs
- No dates, IDs, or meaningless query parameters in canonical URLs
- Keep slugs readable and keyword-forward

### 1.2 Canonical Category Segments

| Current category key | New segment | Example |
|---|---|---|
| \`marketing-business-print\` | \`/print/\` | \`/print/business-cards/\` |
| \`stickers-labels-decals\` | \`/stickers/\` | \`/stickers/die-cut-stickers/\` |
| \`signs-rigid-boards\` | \`/signs/\` | \`/signs/yard-signs/\` |
| \`banners-displays\` | \`/banners/\` | \`/banners/retractable-banners/\` |
| \`canvas-prints\` | \`/canvas/\` | \`/canvas/canvas-prints/\` |
| \`vehicle-graphics-fleet\` | \`/vehicle-graphics/\` | \`/vehicle-graphics/vehicle-wraps/\` |
| \`windows-walls-floors\` | \`/surface-graphics/\` | \`/surface-graphics/one-way-vision-film/\` |

### 1.3 Consolidation Rules
- Variants and legacy slugs should 301 to the canonical family/product page where content overlaps.
- Transactional/order pages can remain for checkout UX, but canonicalize to the public SEO page if they duplicate content.
- Avoid one canonical URL per finish/size unless the page has unique, substantial content and search demand.

### 1.4 207-Row Mapping Summary (This Batch)

Counts (must match requested total 207):

| Category | Count | Source used for mapping |
|---|---:|---|
| stickers-labels-decals | ${summary["stickers-labels-decals"]} | Live export subset (excluding \`vinyl-lettering\` + \`electrical-cable-labels\` subgroups for this SEO set) |
| marketing-business-print | ${summary["marketing-business-print"]} | \`catalogConfig\` subgroups expanded via \`subProductConfig\` (excluding \`stamps\` and \`shelf-displays\`) |
| signs-rigid-boards | ${summary["signs-rigid-boards"]} | Current catalog sign family pages |
| banners-displays | ${summary["banners-displays"]} | Curated 14 canonical banner/display product families |
| canvas-prints | ${summary["canvas-prints"]} | Current catalog canvas family pages |
| vehicle-graphics-fleet | ${summary["vehicle-graphics-fleet"]} | All live vehicle/fleet products |
| windows-walls-floors | ${summary["windows-walls-floors"]} | Current catalog surface family pages |

Representative mappings (full list is in \`url-mapping.csv\`):

| old_category | old_slug | new_url | source_type |
|---|---|---|---|
${mappingExamples}

## 2) Scenario / Landing Page URL Architecture

These pages are **SEO landing pages** for local-intent and use-case queries (not product configurator pages).

### 2.1 Landing URL Rules
- Namespace: \`/printing/\`
- One primary intent per page (product + city OR use case + geography)
- Link to 1 primary product page + 2 related pages
- Include local proof (address, service area, turnaround, pickup/delivery)
- Add unique FAQs and use-case examples to avoid thin/duplicate pages

### 2.2 Landing Page URL List (${landingPages.length} total)

| URL | Cluster | Primary Intent | Primary / Related Product Targets |
|---|---|---|---|
${landingTable}

### 2.3 Landing Page Content Template (Recommended)
- H1: product + city intent (e.g., "Custom Business Card Printing in Scarborough")
- Local intro: Scarborough shop + GTA delivery/pickup + turnaround promise
- Use-case blocks: real estate / restaurant / event / service business examples
- Specs snapshot: common sizes, materials, finishes, turnaround
- CTA block: Order / Get Quote / Contact
- FAQ block (3-6 questions) specific to the intent
- Internal links: product page, category hub, adjacent landing pages

## 3) Schema.org / JSON-LD

Templates are in \`schema-templates.json\` for:
- \`LocalBusiness\` (homepage)
- \`Organization\`
- \`Product\` (product pages)
- \`BreadcrumbList\`
- \`FAQPage\`

Implementation notes:
- Render JSON-LD server-side in Next.js layouts/pages
- Use canonical URLs in \`url\` and \`@id\`
- Keep price/availability in schema consistent with visible page content
- Only apply FAQ schema to visible FAQ content

## 4) Technical SEO Checklist

### 4.1 robots.txt

Goals:
- Allow crawling for public pages
- Block admin/account/cart/checkout/API/private routes
- Publish sitemap index URL

Recommended baseline:

\`\`\`txt
User-agent: *
Allow: /

Disallow: /admin/
Disallow: /api/
Disallow: /account/
Disallow: /cart/
Disallow: /checkout/
Disallow: /login
Disallow: /signup
Disallow: /reset-password
Disallow: /track-order
Disallow: /invite/

# Optional query-parameter crawl controls (if these URLs are generated)
Disallow: /*?*sort=
Disallow: /*?*filter=
Disallow: /*?*page=
Disallow: /*?*view=

Sitemap: https://lunarprint.ca/sitemap.xml
\`\`\`

Notes:
- If \`/order/*\` pages are transactional duplicates, use \`noindex,follow\` and canonical to product pages.
- Keep support/legal pages indexable if they provide user value.

### 4.2 sitemap.xml Structure

Use a sitemap index and split by page type:
- \`/sitemap.xml\` (index)
- \`/sitemaps/sitemap-products.xml\` (canonical product pages from \`url-mapping.csv\`)
- \`/sitemaps/sitemap-landing-pages.xml\` (\`/printing/*\` pages)
- \`/sitemaps/sitemap-categories.xml\` (7 category hubs)
- \`/sitemaps/sitemap-static.xml\` (home, contact, about, faq, policies)
- Optional: \`/sitemaps/sitemap-images.xml\`

### 4.3 Canonical URL Rules

- Canonical must always use final production domain + trailing slash
- Strip tracking params (\`utm_*\`, \`gclid\`, \`fbclid\`) from canonical
- Filter/sort URLs should canonicalize to base page unless intentionally indexable
- Legacy \`/shop/*\` and \`/order/*\` product-like pages should canonicalize or 301 to the new product URL

Examples:
- \`https://lunarprint.ca/print/business-cards/\`
- \`https://lunarprint.ca/stickers/die-cut-stickers/\`
- \`https://lunarprint.ca/banners/retractable-banners/\`

### 4.4 Open Graph / Twitter Card Meta Template

\`\`\`html
<title>{{seo_title}}</title>
<meta name=\"description\" content=\"{{meta_description}}\" />
<link rel=\"canonical\" href=\"{{canonical_url}}\" />

<meta property=\"og:type\" content=\"website\" />
<meta property=\"og:site_name\" content=\"La Lunar Printing\" />
<meta property=\"og:title\" content=\"{{og_title}}\" />
<meta property=\"og:description\" content=\"{{og_description}}\" />
<meta property=\"og:url\" content=\"{{canonical_url}}\" />
<meta property=\"og:image\" content=\"{{og_image_url}}\" />
<meta property=\"og:image:alt\" content=\"{{og_image_alt}}\" />
<meta property=\"og:locale\" content=\"en_CA\" />

<meta name=\"twitter:card\" content=\"summary_large_image\" />
<meta name=\"twitter:title\" content=\"{{og_title}}\" />
<meta name=\"twitter:description\" content=\"{{og_description}}\" />
<meta name=\"twitter:image\" content=\"{{og_image_url}}\" />
\`\`\`

Guidance:
- Use consistent 1200x630 OG images
- Prefer real product imagery over logo-only graphics
- Unique OG title/description for landing pages vs product pages

### 4.5 301 Redirect Plan

- \`url-mapping.csv\` is the source of truth for exact slug -> canonical URL redirects (207 rows in this batch)
- Implement a lookup-based redirect layer before generic pattern redirects
- Collapse redirect chains (old -> final only, no multi-hop)

Recommended redirect layers:
1. Exact slug map (CSV-driven)
2. Category alias rewrites (e.g., \`/shop/stickers-labels-decals/*\` -> \`/stickers/*\`)
3. Legacy \`/order/*\` routes (redirect or canonical based on transactional necessity)

### 4.6 Internal Linking Strategy

Category pages:
- Link to all canonical product pages (or top 12 + "view all")
- Link to 3-6 high-intent landing pages in the same category
- Add "popular combinations" modules (e.g., business cards + flyers + postcards)

Product pages:
- Breadcrumb -> category hub
- 3 sibling alternatives (same category)
- 2 complementary products (cross-sell)
- 2-3 scenario pages (local/use-case landing pages)
- Link to quote/contact for custom jobs

Landing pages:
- Link to 1 primary product page + 2 related products
- Link back to category hub
- Include Scarborough/GTA trust signals and local CTAs

Anchor text:
- Use natural descriptive anchors (not only exact-match repeated anchors)
- Rotate between product name, use case, and city-modified anchors

### 4.7 Image Alt Text Rules

Primary product image alt pattern:
- \`[Product name] printed by La Lunar Printing in Scarborough, Ontario\`

Gallery/context image examples:
- \`Retractable banner stand at a Toronto trade show booth\`
- \`Coroplast yard signs installed with H-wire stakes on a lawn\`

Rules:
- Unique alt text per image on page
- Do not keyword-stuff city names into every image
- Decorative imagery should use empty alt (\`alt=\"\"\`)

### 4.8 Page Speed + Next.js Rendering Strategy

Prefer SSG/ISR for:
- Category hubs
- Product pages
- SEO landing pages
- FAQ / About / Contact (if mostly static)

Use SSR/dynamic for:
- Cart, checkout, account, admin
- Personalized pages
- Dynamic order-tracking states

Performance checklist:
- Use \`generateStaticParams\` for canonical product and landing pages
- Use ISR (\`revalidate\`) for product/landing pages
- Render metadata server-side
- Use \`next/image\` with width/height and modern formats (WebP/AVIF)
- Prioritize LCP images on product pages
- Lazy-load galleries/reviews/comparison tables/chat widgets
- Minimize client JS on SEO pages (prefer server components)
- Prevent CLS from images/fonts

## 5) Google Business Profile (GBP) Optimization

### 5.1 Category Recommendations

Primary category (recommended):
- **Print shop** (confirm exact label in current GBP category picker)

Secondary categories (choose only those available + relevant):
- Commercial printer
- Sign shop
- Banner store
- Digital printing service (or closest available equivalent)
- Vehicle wrapping service (if installation/wrap service is offered)
- Sticker/decal related category (if available in picker)

Note:
- GBP category names can change. Final choices should be verified in GBP UI before publishing.

### 5.2 Service Area Recommendations (GTA)

Base location/pickup:
- **11 Progress Ave #21, Scarborough, ON**

Recommended service areas:
- Scarborough
- Toronto
- North York
- Etobicoke
- East York
- Markham
- Richmond Hill
- Vaughan
- Mississauga
- Brampton
- Pickering
- Ajax
- Whitby
- Oshawa (only if regularly serviced)

### 5.3 GBP Product / Service Listings

Start with the highest-converting services:
- Business Cards
- Flyers
- Postcards
- Brochures
- Die-Cut Stickers
- Roll Labels
- Yard Signs (Coroplast)
- Vinyl Banners
- Retractable Banners
- Feather / Teardrop Flags
- Window Graphics / Frosted Film
- Vehicle Lettering / Fleet Decals

For each listing:
- Add a short benefit-led description
- Add "From" pricing only when stable
- Link to canonical product URL (UTM-tagged)
- Mention local pickup + GTA turnaround

### 5.4 GBP Posting Strategy

Cadence:
- 1-2 posts per week, consistently

Post themes (rotate):
- Product spotlights (stickers, yard signs, banners, window film)
- Local seasonal campaigns (open houses, restaurant promos, events)
- Rush-turnaround examples
- Before/after installs (window film, vehicle lettering)
- FAQ mini-posts (file setup, pickup, turnaround)

Measurement:
- Use UTM links for GBP posts and products/services
- Track calls, direction requests, website clicks, and landing-page conversions

## 6) Implementation Assumptions for This 207-Row Batch

This deliverable intentionally matches the requested **207** rows using a reproducible ruleset from current repo sources:
- \`lib/catalogConfig.js\`
- \`lib/subProductConfig.js\`
- \`docs/category-under-products-live-order.csv\`

Selection assumptions used:
- **Marketing (62):** catalog subgroups expanded via \`subProductConfig\`, excluding \`stamps\` and \`shelf-displays\`
- **Stickers (57):** live sticker export minus \`vinyl-lettering\` and \`electrical-cable-labels\` subgroups for this SEO set
- **Signs (12), Canvas (7), Windows (9):** current catalog family pages
- **Banners (14):** curated canonical banner/display families aligned with target SEO taxonomy
- **Vehicle (46):** all live vehicle/fleet products

If you want a separate **full legacy redirect matrix** for every DB SKU (beyond this 207-page SEO set), generate an additional CSV and keep this file as the canonical product URL plan.
`;

fs.writeFileSync(path.join(OUT_DIR, "seo-technical-spec.md"), "\uFEFF" + seoTechnicalSpec, "utf8");

const schemaTemplates = {
  version: "1.0",
  notes: [
    "Templates use {{variable_name}} placeholders.",
    "Render JSON-LD server-side in Next.js and keep values aligned with visible page content.",
    "Use canonical URLs with trailing slash.",
  ],
  templates: {
    localBusiness_home: {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "@id": "https://lunarprint.ca/#localbusiness",
      name: "La Lunar Printing",
      url: "https://lunarprint.ca/",
      image: "{{logo_or_storefront_image_url}}",
      telephone: "{{company_phone}}",
      email: "{{company_email}}",
      address: {
        "@type": "PostalAddress",
        streetAddress: "11 Progress Ave #21",
        addressLocality: "Scarborough",
        addressRegion: "ON",
        postalCode: "{{postal_code}}",
        addressCountry: "CA",
      },
      areaServed: [
        { "@type": "AdministrativeArea", name: "Greater Toronto Area" },
        { "@type": "City", name: "Scarborough" },
        { "@type": "City", name: "Toronto" },
      ],
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          opens: "{{weekday_open}}",
          closes: "{{weekday_close}}",
        },
      ],
      priceRange: "$$",
      sameAs: ["{{facebook_url}}", "{{instagram_url}}", "{{linkedin_url}}"],
      description: "{{homepage_business_description}}",
    },
    organization: {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": "https://lunarprint.ca/#organization",
      name: "La Lunar Printing",
      url: "https://lunarprint.ca/",
      logo: {
        "@type": "ImageObject",
        url: "{{logo_url}}",
      },
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "customer service",
          telephone: "{{company_phone}}",
          email: "{{company_email}}",
          areaServed: "CA",
          availableLanguage: ["en", "zh"],
        },
      ],
      sameAs: ["{{facebook_url}}", "{{instagram_url}}", "{{linkedin_url}}"],
    },
    product_page: {
      "@context": "https://schema.org",
      "@type": "Product",
      "@id": "{{canonical_url}}#product",
      name: "{{product_name}}",
      description: "{{product_description_plaintext}}",
      sku: "{{product_sku_or_slug}}",
      image: ["{{primary_image_url}}", "{{gallery_image_url_2}}"],
      brand: { "@type": "Brand", name: "La Lunar Printing" },
      category: "{{category_name}}",
      offers: {
        "@type": "Offer",
        url: "{{canonical_url}}",
        priceCurrency: "CAD",
        price: "{{starting_price}}",
        availability: "https://schema.org/{{availability_value}}",
        itemCondition: "https://schema.org/NewCondition",
        seller: { "@type": "Organization", name: "La Lunar Printing" },
      },
      additionalProperty: [
        { "@type": "PropertyValue", name: "Turnaround", value: "{{turnaround_label}}" },
        { "@type": "PropertyValue", name: "Production Location", value: "Scarborough, Ontario" },
      ],
    },
    breadcrumb_list: {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://lunarprint.ca/" },
        { "@type": "ListItem", position: 2, name: "{{category_name}}", item: "{{category_url}}" },
        { "@type": "ListItem", position: 3, name: "{{page_name}}", item: "{{canonical_url}}" },
      ],
    },
    faq_page: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "{{faq_question_1}}",
          acceptedAnswer: { "@type": "Answer", text: "{{faq_answer_1_html_or_text}}" },
        },
        {
          "@type": "Question",
          name: "{{faq_question_2}}",
          acceptedAnswer: { "@type": "Answer", text: "{{faq_answer_2_html_or_text}}" },
        },
      ],
    },
  },
};

fs.writeFileSync(path.join(OUT_DIR, "schema-templates.json"), JSON.stringify(schemaTemplates, null, 2), "utf8");

console.log(JSON.stringify({ totalMappings: allRows.length, byCategory: summary, landingPages: landingPages.length }, null, 2));
