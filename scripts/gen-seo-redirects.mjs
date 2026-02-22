#!/usr/bin/env node
/**
 * Parse url-mapping.csv and generate redirect entries for all planned
 * short URLs (/print/*, /banners/*, /signs/*, /stickers/*, /vehicle-graphics/*,
 * /surface-graphics/*, /canvas/*) that map to existing /shop/* routes.
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const csv = readFileSync(resolve(root, "docs/lalunar-deliverables/url-mapping.csv"), "utf-8");
const lines = csv.split("\n").filter(Boolean);

// Parse CSV (handle quoted fields)
function parseCSVLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === "," && !inQuotes) { fields.push(current.trim()); current = ""; continue; }
    current += ch;
  }
  fields.push(current.trim());
  return fields;
}

const header = parseCSVLine(lines[0]);
const newUrlIdx = header.indexOf("new_url");
const oldCatIdx = header.indexOf("old_category");
const oldParentIdx = header.indexOf("old_parent_slug");

// Map: new_url → /shop/{old_category}/{old_parent_slug}
const redirectMap = new Map();

for (let i = 1; i < lines.length; i++) {
  const fields = parseCSVLine(lines[i]);
  const newUrl = fields[newUrlIdx]?.replace(/\/$/, ""); // strip trailing slash
  const oldCategory = fields[oldCatIdx];
  const oldParent = fields[oldParentIdx];

  if (!newUrl || !oldCategory) continue;

  // The destination is /shop/{oldCategory}/{oldParent} OR just /shop/{oldCategory}
  let destination;
  if (oldParent && oldParent !== oldCategory) {
    destination = `/shop/${oldCategory}/${oldParent}`;
  } else {
    destination = `/shop/${oldCategory}`;
  }

  // Only add if the new_url is NOT already under /shop/ (those are handled)
  if (newUrl.startsWith("/shop/") || newUrl.startsWith("/order/")) continue;

  // Use first occurrence (most specific sub-group)
  if (!redirectMap.has(newUrl)) {
    redirectMap.set(newUrl, destination);
  }
}

// Sort and deduplicate
const entries = [...redirectMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));

console.log(`Found ${entries.length} unique planned URL redirects:\n`);

// Group by category prefix for readability
const groups = {};
for (const [source, dest] of entries) {
  const prefix = source.split("/")[1]; // "print", "banners", etc.
  if (!groups[prefix]) groups[prefix] = [];
  groups[prefix].push({ source, dest });
}

// Generate TS file
let tsContent = `// Planned SEO short-URL redirects — generated from url-mapping.csv\n\nexport const seoShortUrlRedirects = [\n`;

for (const [prefix, items] of Object.entries(groups).sort()) {
  tsContent += `  // ── /${prefix}/* ──\n`;
  for (const { source, dest } of items) {
    tsContent += `  { source: "${source}", destination: "${dest}", permanent: true },\n`;
    console.log(`  ${source} → ${dest}`);
  }
}

tsContent += `] as const;\n`;

const outPath = resolve(root, "lib/redirects/seo-short-urls.ts");
writeFileSync(outPath, tsContent);
console.log(`\nWritten to ${outPath}`);
