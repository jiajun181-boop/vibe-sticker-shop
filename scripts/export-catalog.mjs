// scripts/export-catalog.mjs
// Exports a full product catalog grouped by category.
// Output: exports/catalog/{catalog.json, catalog.csv, catalog.md}
//
// Data-source detection logic mirrors export-catalog-map.mjs
// (Prisma first, then module scan fallback).

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const OUT_DIR = "exports/catalog";

const SKIP_DIRS = new Set([
  "node_modules", ".git", ".next", "exports", "tmp", "dist", "build", "coverage",
]);
const SCAN_EXTS = new Set([".js", ".mjs", ".cjs", ".ts", ".tsx", ".json"]);

// ── File helpers (copied from export-catalog-map.mjs) ──

function walkFiles(rootDir) {
  const files = [];
  const stack = [rootDir];
  while (stack.length) {
    const dir = stack.pop();
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        stack.push(path.join(dir, entry.name));
      } else if (entry.isFile()) {
        const full = path.join(dir, entry.name);
        if (SCAN_EXTS.has(path.extname(full))) files.push(full);
      }
    }
  }
  return files;
}

function readFileSafe(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > 2 * 1024 * 1024) return null;
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

function scanCandidates(rootDir, files) {
  const candidates = [];
  for (const file of files) {
    const text = readFileSafe(file);
    if (!text) continue;
    const hits = [];
    if (/export\s+const\s+products\b/.test(text)) hits.push("export const products");
    if (/export\s+const\s+PRODUCTS\b/.test(text)) hits.push("export const PRODUCTS");
    if (/productsByCategory|PRODUCTS_BY_CATEGORY/.test(text)) hits.push("productsByCategory");
    if (/export\s+default\s+\[/.test(text)) hits.push("export default array");
    if (/module\.exports\s*=\s*\[/.test(text)) hits.push("module.exports array");
    if (/module\.exports\s*=\s*\{/.test(text)) hits.push("module.exports object");
    if (/const\s+PRODUCTS\s*=\s*\[/.test(text)) hits.push("const PRODUCTS = [");
    if (hits.length) candidates.push({ file, hits, score: hits.length });
  }
  const importCounts = new Map();
  for (const file of files) {
    const text = readFileSafe(file);
    if (!text) continue;
    for (const c of candidates) {
      const rel = path.relative(rootDir, c.file).replace(/\\/g, "/");
      const base = path.basename(c.file);
      if (text.includes(rel) || text.includes(`./${base}`) || text.includes(`../${base}`)) {
        importCounts.set(c.file, (importCounts.get(c.file) || 0) + 1);
      }
    }
  }
  for (const c of candidates) {
    c.imports = importCounts.get(c.file) || 0;
    c.score += c.imports * 5;
  }
  candidates.sort((a, b) => b.score - a.score);
  return candidates;
}

function detectPrismaUsage(files) {
  const hitFiles = [];
  for (const file of files) {
    if (!file.includes(`${path.sep}app${path.sep}`)) continue;
    const text = readFileSafe(file);
    if (!text) continue;
    if (text.includes("prisma.product")) hitFiles.push(file);
  }
  return hitFiles;
}

function normalizeProducts(raw) {
  if (Array.isArray(raw)) {
    return raw.map((p, idx) => ({
      id: p.id ?? p._id ?? "",
      slug: p.slug ?? p.handle ?? p.key ?? "",
      title: p.title ?? p.name ?? p.label ?? "",
      category: p.category ?? p.cat ?? "",
      isActive: typeof p.isActive === "boolean" ? p.isActive : (p.active ?? true),
    }));
  }
  if (raw && typeof raw === "object") {
    const out = [];
    for (const [cat, arr] of Object.entries(raw)) {
      if (!Array.isArray(arr)) continue;
      for (const p of arr) {
        out.push({
          id: p.id ?? p._id ?? "",
          slug: p.slug ?? p.handle ?? p.key ?? "",
          title: p.title ?? p.name ?? p.label ?? "",
          category: p.category ?? cat,
          isActive: typeof p.isActive === "boolean" ? p.isActive : (p.active ?? true),
        });
      }
    }
    return out;
  }
  return [];
}

async function loadFromModule(filePath) {
  const ext = path.extname(filePath);
  let mod = null;
  if (ext === ".json") {
    mod = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } else {
    try { mod = await import(pathToFileURL(filePath).href); } catch { mod = require(filePath); }
  }
  const raw = mod?.default ?? mod?.products ?? mod?.PRODUCTS ?? mod?.productsByCategory ?? mod?.PRODUCTS_BY_CATEGORY;
  if (!raw) return [];
  return normalizeProducts(raw);
}

async function loadFromPrisma() {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    const rows = await prisma.product.findMany({
      select: { id: true, slug: true, name: true, category: true, isActive: true },
    });
    return rows.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.name,
      category: p.category,
      isActive: p.isActive,
    }));
  } finally {
    await prisma.$disconnect();
  }
}

// ── Output formatters ──

function toCSV(rows) {
  const esc = (v) => {
    const s = (v ?? "").toString();
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = ["category", "slug", "title", "isActive", "id"];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push([esc(r.category), esc(r.slug), esc(r.title), esc(r.isActive), esc(r.id)].join(","));
  }
  return lines.join("\n");
}

function groupBy(arr, keyFn) {
  const m = new Map();
  for (const x of arr) {
    const k = keyFn(x);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(x);
  }
  return m;
}

function formatMd(rows) {
  const totalRows = rows.length;
  const activeCount = rows.filter((r) => r.isActive).length;
  const byCategory = groupBy(rows, (r) => r.category || "(none)");
  const catEntries = [...byCategory.entries()].sort((a, b) => b[1].length - a[1].length);

  const lines = [];

  // Summary
  lines.push("# Product Catalog");
  lines.push("");
  lines.push("## Summary");
  lines.push(`- Total products: ${totalRows}`);
  lines.push(`- Active: ${activeCount}`);
  lines.push(`- Inactive: ${totalRows - activeCount}`);
  lines.push(`- Categories: ${byCategory.size}`);
  lines.push("");

  // Table of contents
  lines.push("## Categories");
  for (const [cat, items] of catEntries) {
    lines.push(`- ${cat} (${items.length})`);
  }
  lines.push("");

  // Per-category sections
  for (const [cat, items] of catEntries) {
    items.sort((a, b) => a.slug.localeCompare(b.slug));
    lines.push(`## ${cat} (${items.length})`);
    lines.push("");
    lines.push("| slug | title | isActive | id |");
    lines.push("|------|-------|----------|----|");
    for (const r of items) {
      lines.push(`| ${r.slug} | ${r.title} | ${r.isActive} | ${r.id} |`);
    }
    lines.push("");
  }

  // Duplicate slug check
  const bySlug = groupBy(rows.filter((r) => r.slug), (r) => r.slug);
  const dupes = [...bySlug.entries()].filter(([, v]) => v.length > 1);
  lines.push("## Duplicate Slugs");
  if (dupes.length === 0) {
    lines.push("- None");
  } else {
    for (const [slug, items] of dupes) {
      const cats = [...new Set(items.map((i) => i.category || "(none)"))].join(", ");
      lines.push(`- **${slug}** (x${items.length}) — categories: ${cats}`);
    }
  }
  lines.push("");

  // Missing fields check
  const missingSlug = rows.filter((r) => !r.slug).length;
  const missingTitle = rows.filter((r) => !r.title).length;
  const missingCategory = rows.filter((r) => !r.category).length;
  lines.push("## Missing Fields");
  if (missingSlug === 0 && missingTitle === 0 && missingCategory === 0) {
    lines.push("- None");
  } else {
    if (missingSlug) lines.push(`- Missing slug: ${missingSlug}`);
    if (missingTitle) lines.push(`- Missing title: ${missingTitle}`);
    if (missingCategory) lines.push(`- Missing category: ${missingCategory}`);
  }
  lines.push("");

  return lines.join("\n");
}

// ── Main ──

async function main() {
  const rootDir = process.cwd();
  const files = walkFiles(rootDir);
  const prismaHits = detectPrismaUsage(files);
  const candidates = scanCandidates(rootDir, files);

  let products = [];
  let source = "unknown";

  // Try Prisma first
  if (prismaHits.length > 0) {
    try {
      products = await loadFromPrisma();
      source = "prisma";
    } catch (err) {
      console.warn(`Prisma load failed: ${err?.message || err}`);
    }
  }

  // Fallback to module scan
  if (products.length === 0 && candidates.length > 0) {
    products = await loadFromModule(candidates[0].file);
    source = `module (${path.relative(rootDir, candidates[0].file)})`;
  }

  if (!products.length) {
    console.error("No product data source found.");
    process.exit(1);
  }

  // Sort by category, then slug
  products.sort((a, b) => a.category.localeCompare(b.category) || a.slug.localeCompare(b.slug));

  const outDir = path.join(rootDir, OUT_DIR);
  fs.mkdirSync(outDir, { recursive: true });

  // JSON
  fs.writeFileSync(
    path.join(outDir, "catalog.json"),
    JSON.stringify({ source, rows: products }, null, 2),
    "utf8"
  );

  // CSV
  fs.writeFileSync(path.join(outDir, "catalog.csv"), toCSV(products), "utf8");

  // MD
  const md = formatMd(products);
  fs.writeFileSync(path.join(outDir, "catalog.md"), md, "utf8");

  console.log(`Export complete (source: ${source})`);
  console.log(`Output: ${path.relative(rootDir, outDir)}/`);
  console.log(`  catalog.json  (${products.length} rows)`);
  console.log(`  catalog.csv`);
  console.log(`  catalog.md`);
}

main().catch((err) => {
  console.error("Export failed:", err?.message || err);
  process.exit(1);
});
