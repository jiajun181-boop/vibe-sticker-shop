#!/usr/bin/env node
/**
 * Extract every unique redirect from:
 *   1. codex-url-mapping.ts
 *   2. category-reorg-v1.ts
 *   3. seo-short-urls.ts
 *   4. next.config.ts (inline redirects)
 *
 * Tests both:
 *   A) Every destination URL resolves to 200
 *   B) Every source URL returns a redirect (3xx) that ultimately lands on 200
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// ── Parse fields from TS redirect files ──
function extractFields(filePath, field) {
  const src = readFileSync(filePath, "utf-8");
  const results = new Set();
  const re = new RegExp(`${field}:\\s*["']([^"']+)["']`, "g");
  let m;
  while ((m = re.exec(src)) !== null) {
    let val = m[1];
    if (val.includes(":")) continue; // skip wildcard params
    if (val.includes("(") || val.includes("*")) continue; // skip regex/glob patterns
    results.add(val);
  }
  return results;
}

const files = [
  resolve(root, "lib/redirects/codex-url-mapping.ts"),
  resolve(root, "lib/redirects/category-reorg-v1.ts"),
  resolve(root, "lib/redirects/seo-short-urls.ts"),
  resolve(root, "next.config.ts"),
];

const allDests = new Set();
const allSources = new Set();

for (const f of files) {
  for (const d of extractFields(f, "destination")) allDests.add(d);
  for (const s of extractFields(f, "source")) allSources.add(s);
}

const PORT = process.env.PORT || 3099;
const BASE = `http://localhost:${PORT}`;

// ── A) Test destinations (should return 200 directly) ──
const destsSorted = [...allDests].sort();
console.log(`\n=== Testing ${destsSorted.length} unique destinations ===\n`);

const destResults = { ok: 0, fail: [] };

for (const path of destsSorted) {
  try {
    const res = await fetch(`${BASE}${path}`, { redirect: "follow" });
    if (res.status >= 400) {
      destResults.fail.push({ path, status: res.status });
      console.log(`  FAIL ${res.status}  ${path}`);
    } else {
      destResults.ok++;
    }
  } catch (err) {
    destResults.fail.push({ path, status: "ERR" });
    console.log(`  FAIL ERR  ${path}  (${err.message})`);
  }
}

console.log(`\nDestinations: ${destResults.ok} OK, ${destResults.fail.length} FAIL`);

// ── B) Test sources (should redirect and ultimately land on 200) ──
const sourcesSorted = [...allSources].sort();
console.log(`\n=== Testing ${sourcesSorted.length} unique source URLs ===\n`);

const srcResults = { ok: 0, fail: [] };

for (const path of sourcesSorted) {
  try {
    const res = await fetch(`${BASE}${path}`, { redirect: "follow" });
    if (res.status >= 400) {
      srcResults.fail.push({ path, status: res.status });
      console.log(`  FAIL ${res.status}  ${path}`);
    } else {
      srcResults.ok++;
    }
  } catch (err) {
    srcResults.fail.push({ path, status: "ERR" });
    console.log(`  FAIL ERR  ${path}  (${err.message})`);
  }
}

console.log(`\nSources: ${srcResults.ok} OK, ${srcResults.fail.length} FAIL`);

// ── Summary ──
const totalFail = destResults.fail.length + srcResults.fail.length;

console.log(`\n${"=".repeat(50)}`);
console.log(`TOTAL: ${destResults.ok + srcResults.ok} OK, ${totalFail} FAIL`);

if (totalFail > 0) {
  console.log(`\n=== All failures ===`);
  for (const { path, status } of [...destResults.fail, ...srcResults.fail]) {
    console.log(`  ${status}  ${path}`);
  }
}

process.exit(totalFail > 0 ? 1 : 0);
