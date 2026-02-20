// Batch-updates all /order/*/page.js files to fetch product images.
// Run: node scripts/fix-order-page-images.mjs
import fs from "fs";
import path from "path";

const ORDER_DIR = path.resolve("app/order");

// Skip these — already fixed or special
const SKIP = new Set(["coupons", "letterhead", "marketing-print"]);

// Slug overrides — folder name → array of DB slugs to search
const SLUG_OVERRIDES = {
  "a-frame-signs": ["a-frame-signs", "a-frame-sign", "a-frames-signs"],
  "acrylic-signs": ["acrylic-signs", "acrylic-sign"],
  "aluminum-signs": ["aluminum-signs", "aluminum-sign"],
  backdrops: ["backdrops", "backdrop"],
  booklets: ["booklets", "booklet", "booklets-saddle-stitch"],
  bookmarks: ["bookmarks", "bookmarks-standard"],
  brochures: ["brochures", "brochures-standard"],
  "business-cards": ["business-cards", "business-cards-standard"],
  calendars: ["calendars", "calendars-wall", "calendars-desk"],
  "canvas-prints": ["canvas-prints", "classic-canvas-prints"],
  certificates: ["certificates", "certificates-award"],
  decals: ["decals", "vehicle-decals"],
  "door-hangers": ["door-hangers", "door-hangers-standard"],
  envelopes: ["envelopes", "envelopes-standard"],
  "fabric-banners": ["fabric-banners", "fabric-banner"],
  flags: ["flags", "feather-flags", "teardrop-flags"],
  flyers: ["flyers", "flyers-standard"],
  "foam-board-signs": ["foam-board-signs", "foam-board-sign"],
  "greeting-cards": ["greeting-cards", "greeting-cards-standard"],
  "industrial-labels": ["industrial-labels", "safety-labels-industrial"],
  "inserts-packaging": ["inserts-packaging", "inserts-standard"],
  "invitation-cards": ["invitation-cards", "invitation-cards-standard"],
  "loyalty-cards": ["loyalty-cards", "loyalty-cards-standard"],
  "magnetic-signs": ["magnetic-signs", "magnetic-car-signs"],
  menus: ["menus", "menus-standard"],
  "mesh-banners": ["mesh-banners", "mesh-banner"],
  ncr: ["ncr", "ncr-invoices", "ncr-invoice-books"],
  notepads: ["notepads", "notepads-standard"],
  "order-forms": ["order-forms", "order-forms-standard"],
  postcards: ["postcards", "postcards-standard"],
  posters: ["posters", "posters-standard"],
  "presentation-folders": ["presentation-folders", "presentation-folders-standard"],
  "pvc-signs": ["pvc-signs", "pvc-sign"],
  "rack-cards": ["rack-cards", "rack-cards-standard"],
  "retail-tags": ["retail-tags", "retail-tags-standard"],
  "retractable-stands": ["retractable-stands", "retractable-banner-stand"],
  "safety-labels": ["safety-labels", "safety-label"],
  "shelf-displays": ["shelf-displays", "shelf-talkers"],
  stamps: ["stamps", "stamps-self-inking"],
  stickers: ["stickers", "die-cut-singles", "die-cut-stickers"],
  "table-tents": ["table-tents", "table-tents-standard"],
  "tabletop-displays": ["tabletop-displays", "tabletop-displays-standard"],
  tags: ["tags", "tags-hang", "tags-product"],
  tickets: ["tickets", "tickets-event"],
  "vehicle-decals": ["vehicle-decals", "vehicle-decal"],
  "vehicle-wraps": ["vehicle-wraps", "vehicle-wrap"],
  "vinyl-banners": ["vinyl-banners", "vinyl-banner"],
  "vinyl-lettering": ["vinyl-lettering"],
  "waivers-releases": ["waivers-releases", "waivers-standard"],
  "wall-floor-graphics": ["wall-floor-graphics", "wall-graphics", "floor-graphics"],
  "window-films": ["window-films", "window-film", "adhesive-films"],
  "x-banner-stands": ["x-banner-stands", "x-banner-stand"],
  "yard-signs": ["yard-signs", "yard-sign", "yard-lawn-signs"],
};

let updated = 0;
let skipped = 0;

for (const folder of fs.readdirSync(ORDER_DIR)) {
  if (SKIP.has(folder)) { skipped++; continue; }
  const pagePath = path.join(ORDER_DIR, folder, "page.js");
  if (!fs.existsSync(pagePath)) continue;

  const src = fs.readFileSync(pagePath, "utf-8");

  // Already has getOrderPageImages — skip
  if (src.includes("getOrderPageImages")) { skipped++; continue; }

  // Extract the client component import
  const importMatch = src.match(/import\s+(\w+)\s+from\s+["']([^"']+)["']/g);
  if (!importMatch) { console.log(`⚠ Skip ${folder}: no import found`); continue; }

  // Find the non-Suspense/non-react import
  const clientImport = importMatch.find(
    (m) => !m.includes("react") && !m.includes("getOrderPageImages")
  );
  if (!clientImport) { console.log(`⚠ Skip ${folder}: no client import`); continue; }

  const clientNameMatch = clientImport.match(/import\s+(\w+)\s+from\s+["']([^"']+)["']/);
  const componentName = clientNameMatch[1];
  const importPath = clientNameMatch[2];

  // Extract metadata
  const metaMatch = src.match(/export function generateMetadata\(\)\s*\{[\s\S]*?\n\}/);
  const metaBlock = metaMatch ? metaMatch[0] : null;
  if (!metaBlock) { console.log(`⚠ Skip ${folder}: no metadata`); continue; }

  // Extract function name
  const fnMatch = src.match(/export default (?:async )?function (\w+)/);
  const fnName = fnMatch ? fnMatch[1] : "OrderPage";

  // Figure out how the client component is invoked
  const jsxMatch = src.match(new RegExp(`<${componentName}([^/]*?)\\s*/?>`));
  const propsStr = jsxMatch ? jsxMatch[1].trim() : "";

  // Parse existing props
  const defaultTypeMatch = propsStr.match(/defaultType="([^"]+)"/);
  const hasHideTypeSelector = propsStr.includes("hideTypeSelector");

  // Build slug array
  const slugs = SLUG_OVERRIDES[folder] || [folder];
  const slugArrayStr = JSON.stringify(slugs);

  // Determine if it's a MarketingPrintOrderClient
  const isMarketing = componentName === "MarketingPrintOrderClient";

  // Build props string for the component
  let newProps = "productImages={productImages}";
  if (isMarketing && defaultTypeMatch) {
    newProps = `defaultType="${defaultTypeMatch[1]}" hideTypeSelector productImages={productImages}`;
  } else if (propsStr) {
    // Keep existing props and add productImages
    newProps = `${propsStr} productImages={productImages}`;
  }

  const newSrc = `import { Suspense } from "react";
import { getOrderPageImages } from "@/lib/order-page-images";
import ${componentName} from "${importPath}";

${metaBlock}

export default async function ${fnName}() {
  const productImages = await getOrderPageImages(${slugArrayStr});

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <${componentName} ${newProps} />
    </Suspense>
  );
}
`;

  fs.writeFileSync(pagePath, newSrc, "utf-8");
  updated++;
  console.log(`✓ ${folder} → ${componentName} (slugs: ${slugs.join(", ")})`);
}

console.log(`\nDone: ${updated} updated, ${skipped} skipped`);
