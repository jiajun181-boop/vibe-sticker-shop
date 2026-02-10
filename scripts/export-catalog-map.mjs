import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const DEFAULT_OUT_DIR = "exports";
const DEFAULT_FORMAT = "all";

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "exports",
  "tmp",
  "dist",
  "build",
  "coverage",
]);

const SCAN_EXTS = new Set([".js", ".mjs", ".cjs", ".ts", ".tsx", ".json"]);

function parseArgs(argv) {
  const out = { outDir: DEFAULT_OUT_DIR, onlyActive: false, format: DEFAULT_FORMAT };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--onlyActive") out.onlyActive = true;
    if (arg === "--outDir") out.outDir = argv[i + 1] || DEFAULT_OUT_DIR;
    if (arg.startsWith("--outDir=")) out.outDir = arg.split("=")[1] || DEFAULT_OUT_DIR;
    if (arg === "--format") out.format = argv[i + 1] || DEFAULT_FORMAT;
    if (arg.startsWith("--format=")) out.format = arg.split("=")[1] || DEFAULT_FORMAT;
  }
  return out;
}

function isScanFile(filePath) {
  return SCAN_EXTS.has(path.extname(filePath));
}

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
        if (isScanFile(full)) files.push(full);
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
    if (hits.length) {
      candidates.push({ file, hits, score: hits.length });
    }
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

function extractCategoryMetaKeys(filePath) {
  const text = readFileSafe(filePath);
  if (!text) return [];
  const start = text.indexOf("const CATEGORY_META");
  if (start === -1) return [];
  const open = text.indexOf("{", start);
  const close = text.indexOf("};", open);
  if (open === -1 || close === -1) return [];
  const block = text.slice(open, close);
  const keys = [];
  const re = /"([^"]+)"\s*:\s*\{|([A-Za-z0-9_-]+)\s*:\s*\{/g;
  let m;
  while ((m = re.exec(block))) {
    const key = m[1] || m[2];
    if (key) keys.push(key);
  }
  return keys;
}

function extractCategoryLabelsKeys(filePath) {
  const text = readFileSafe(filePath);
  if (!text) return [];
  const start = text.indexOf("const CATEGORY_LABELS");
  if (start === -1) return [];
  const open = text.indexOf("{", start);
  const close = text.indexOf("};", open);
  if (open === -1 || close === -1) return [];
  const block = text.slice(open, close);
  const keys = [];
  const re = /"([^"]+)"\s*:\s*"|([A-Za-z0-9_-]+)\s*:\s*"/g;
  let m;
  while ((m = re.exec(block))) {
    const key = m[1] || m[2];
    if (key) keys.push(key);
  }
  return keys;
}

function loadMergeMap(rootDir) {
  const files = ["prisma/merge-categories-v2.mjs", "prisma/merge-categories.mjs"];
  const map = new Map();
  for (const rel of files) {
    const file = path.join(rootDir, rel);
    const text = readFileSafe(file);
    if (!text) continue;
    const re = /from:\s*["']([^"']+)["']\s*,\s*to:\s*["']([^"']+)["']/g;
    let m;
    while ((m = re.exec(text))) {
      const from = m[1];
      const to = m[2];
      if (!map.has(to)) map.set(to, []);
      map.get(to).push(from);
    }
  }
  return map;
}

function normalizeProducts(raw) {
  if (Array.isArray(raw)) {
    return raw.map((p, idx) => ({
      id: p.id ?? p._id ?? "",
      slug: p.slug ?? p.handle ?? p.key ?? "",
      title: p.title ?? p.name ?? p.label ?? "",
      category: p.category ?? p.cat ?? "",
      isActive: typeof p.isActive === "boolean" ? p.isActive : (p.active ?? true),
      sourceKey: p.sourceKey ?? p.key ?? `row_${idx}`,
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
          sourceKey: p.sourceKey ?? p.key ?? "",
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
    const text = fs.readFileSync(filePath, "utf8");
    mod = JSON.parse(text);
  } else {
    try {
      mod = await import(pathToFileURL(filePath).href);
    } catch {
      mod = require(filePath);
    }
  }
  const raw =
    mod?.default ??
    mod?.products ??
    mod?.PRODUCTS ??
    mod?.productsByCategory ??
    mod?.PRODUCTS_BY_CATEGORY;
  if (!raw) return { list: [], exportName: "unknown" };
  const exportName =
    (mod?.default && "default") ||
    (mod?.products && "products") ||
    (mod?.PRODUCTS && "PRODUCTS") ||
    (mod?.productsByCategory && "productsByCategory") ||
    (mod?.PRODUCTS_BY_CATEGORY && "PRODUCTS_BY_CATEGORY") ||
    "unknown";
  return { list: normalizeProducts(raw), exportName };
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
      sourceKey: p.slug,
    }));
  } finally {
    await prisma.$disconnect();
  }
}

function toCSV(rows) {
  const esc = (v) => {
    const s = (v ?? "").toString();
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const header = ["category", "slug", "title", "isActive", "id", "sourceKey", "currentCategory", "resolvedBy", "redirectFrom"];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push([
      esc(r.category),
      esc(r.slug),
      esc(r.title),
      esc(r.isActive),
      esc(r.id),
      esc(r.sourceKey),
      esc(r.currentCategory),
      esc(r.resolvedBy),
      esc(r.redirectFrom),
    ].join(","));
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

function resolveProduct(products, category, slug) {
  const exact = products.find((p) => p.isActive && p.category === category && p.slug === slug);
  if (exact) return { product: exact, resolvedBy: "exact(category,slug)" };
  const fallback = products.filter((p) => p.isActive && p.slug === slug);
  if (fallback.length > 0) return { product: fallback[0], resolvedBy: "slugFallback" };
  return { product: null, resolvedBy: "notFound" };
}

function formatMdSummary(summary) {
  const lines = [];
  lines.push("# Catalog Category Map");
  lines.push("");
  lines.push(`Source: ${summary.source}`);
  if (summary.sourceDetail) lines.push(`Source detail: ${summary.sourceDetail}`);
  lines.push("");
  lines.push("## Summary");
  lines.push(`- Total rows: ${summary.totals.rows}`);
  lines.push(`- Active: ${summary.totals.active}`);
  lines.push(`- Categories: ${summary.totals.categories}`);
  lines.push(`- Duplicate slug groups: ${summary.totals.duplicateSlugGroups}`);
  lines.push(`- Missing category: ${summary.totals.missingCategory}`);
  lines.push(`- Invalid category: ${summary.totals.invalidCategory}`);
  lines.push(`- Slug fallback redirects: ${summary.totals.slugFallback}`);
  lines.push("");
  lines.push("## Category Counts");
  for (const [cat, count] of summary.categoryCounts) {
    lines.push(`- ${cat}: ${count}`);
  }
  lines.push("");
  lines.push("## Duplicate Slugs");
  if (summary.duplicateSlugs.length === 0) {
    lines.push("- None");
  } else {
    for (const g of summary.duplicateSlugs) {
      const cats = [...new Set(g.items.map((i) => i.category || "(none)"))].join(", ");
      lines.push(`- ${g.slug} (x${g.count}) categories: ${cats}`);
    }
  }
  lines.push("");
  lines.push("## Missing or Invalid Categories");
  if (summary.missingCategory.length === 0 && summary.invalidCategory.length === 0) {
    lines.push("- None");
  } else {
    if (summary.missingCategory.length) {
      lines.push(`- Missing category: ${summary.missingCategory.length}`);
    }
    if (summary.invalidCategory.length) {
      lines.push(`- Invalid category: ${summary.invalidCategory.length}`);
    }
  }
  lines.push("");
  lines.push("## Redirect Stats");
  if (summary.redirectEdges.length === 0) {
    lines.push("- None");
  } else {
    for (const edge of summary.redirectEdges) {
      lines.push(`- ${edge.from} -> ${edge.to}: ${edge.count}`);
    }
  }
  lines.push("");
  lines.push("## Redirect Validation");
  if (!summary.redirectValidation || summary.redirectValidation.length === 0) {
    lines.push("- No merge edges to validate");
  } else {
    lines.push("| From | To | Products | Exact | Fallback | NotFound | Status |");
    lines.push("|------|-----|----------|-------|----------|----------|--------|");
    for (const v of summary.redirectValidation) {
      const status = v.notFoundHits > 0 ? "⚠️ WARN" : "✅ OK";
      lines.push(`| ${v.from} | ${v.to} | ${v.total} | ${v.exactCount} | ${v.fallbackHits} | ${v.notFoundHits} | ${status} |`);
    }
    const totalFallback = summary.redirectValidation.reduce((s, v) => s + v.fallbackHits, 0);
    const totalNotFound = summary.redirectValidation.reduce((s, v) => s + v.notFoundHits, 0);
    lines.push("");
    lines.push(`Total slug-fallback redirects: ${totalFallback}`);
    if (totalNotFound > 0) {
      lines.push(`⚠️ ${totalNotFound} products could NOT be resolved via old category URLs`);
    }
  }
  lines.push("");
  return lines.join("\n");
}

function buildMermaid(edges) {
  const lines = ["graph LR"];
  if (edges.length === 0) {
    lines.push('  none["no redirects"]');
    return lines.join("\n");
  }
  for (const e of edges) {
    const from = e.from.replace(/[^a-zA-Z0-9_-]/g, "_");
    const to = e.to.replace(/[^a-zA-Z0-9_-]/g, "_");
    lines.push(`  ${from} -->|${e.count}| ${to}`);
  }
  return lines.join("\n");
}

async function main() {
  const rootDir = process.cwd();
  const args = parseArgs(process.argv.slice(2));
  const files = walkFiles(rootDir);

  const prismaHits = detectPrismaUsage(files);
  const candidates = scanCandidates(rootDir, files);
  const mergeMap = loadMergeMap(rootDir);

  let products = [];
  let source = "unknown";
  let sourceDetail = "";
  let exportName = "";

  if (prismaHits.length > 0) {
    try {
      products = await loadFromPrisma();
      source = "prisma";
      sourceDetail = `Detected prisma.product usage in ${path.relative(rootDir, prismaHits[0])}`;
    } catch (err) {
      source = "prisma_failed";
      sourceDetail = err?.message || String(err);
    }
  }

  if (products.length === 0) {
    if (candidates.length === 0) {
      console.error("No product data source found.");
      console.error("Tried scanning JS/TS/JSON files for product exports.");
      process.exit(1);
    }
    const pick = candidates[0];
    const loaded = await loadFromModule(pick.file);
    products = loaded.list;
    exportName = loaded.exportName;
    source = "module";
    sourceDetail = `${path.relative(rootDir, pick.file)} (export: ${exportName})`;
  }

  if (!products.length) {
    console.error("Found a candidate source but no products were loaded.");
    console.error("Top candidates:");
    for (const c of candidates.slice(0, 5)) {
      console.error(`- ${path.relative(rootDir, c.file)} (hits: ${c.hits.join(", ")}, imports: ${c.imports})`);
    }
    process.exit(1);
  }

  const canonicalFromPage = extractCategoryMetaKeys(path.join(rootDir, "app/page.js"));
  const canonicalFromShop = extractCategoryLabelsKeys(path.join(rootDir, "app/shop/ShopClient.js"));
  const canonical = canonicalFromPage.length ? canonicalFromPage : canonicalFromShop;

  const rows = products.map((p) => ({
    id: p.id ?? "",
    slug: p.slug ?? "",
    title: p.title ?? "",
    isActive: !!p.isActive,
    category: p.category ?? "",
    currentCategory: p.category ?? "",
    resolvedBy: "notFound",
    redirectFrom: "",
    sourceKey: p.sourceKey ?? "",
  }));

  const bySlug = groupBy(rows.filter((r) => r.slug), (r) => r.slug);
  const duplicateSlugs = [];
  for (const [slug, items] of bySlug.entries()) {
    if (items.length > 1) duplicateSlugs.push({ slug, count: items.length, items });
  }
  duplicateSlugs.sort((a, b) => b.count - a.count);

  // ── Row-level self-resolution ──
  for (const r of rows) {
    const oldList = mergeMap.get(r.category) || [];
    r.redirectFrom = oldList.length ? oldList.join(",") : "";
    const selfResolved = resolveProduct(rows, r.category, r.slug);
    r.resolvedBy = selfResolved.resolvedBy;
  }

  // ── Edge-based redirect simulation ──
  // For each merge edge (from→to), simulate resolving every active product
  // in the "to" category as if the request came via the old "from" category.
  const redirectEdges = [];
  const redirectValidation = [];
  let slugFallbackCount = 0;

  for (const [to, fromList] of mergeMap.entries()) {
    const productsInTo = rows.filter((r) => r.isActive && r.category === to);
    for (const from of fromList) {
      let exactCount = 0;
      let fallbackHits = 0;
      let notFoundHits = 0;
      for (const p of productsInTo) {
        const resolved = resolveProduct(rows, from, p.slug);
        if (resolved.resolvedBy === "exact(category,slug)") exactCount++;
        else if (resolved.resolvedBy === "slugFallback") fallbackHits++;
        else notFoundHits++;
      }
      slugFallbackCount += fallbackHits;
      redirectEdges.push({ from, to, count: fallbackHits });
      redirectValidation.push({
        from,
        to,
        total: productsInTo.length,
        exactCount,
        fallbackHits,
        notFoundHits,
        warn: notFoundHits > 0,
      });
    }
  }

  const outRows = args.onlyActive ? rows.filter((r) => r.isActive) : rows;
  const outDir = path.join(rootDir, args.outDir);
  fs.mkdirSync(outDir, { recursive: true });

  const categoryCounts = new Map();
  for (const r of outRows) {
    const key = r.category || "(none)";
    categoryCounts.set(key, (categoryCounts.get(key) || 0) + 1);
  }

  const invalidCategory = canonical.length
    ? outRows.filter((r) => r.category && !canonical.includes(r.category))
    : [];
  const missingCategory = outRows.filter((r) => !r.category);

  const summary = {
    source,
    sourceDetail,
    totals: {
      rows: outRows.length,
      active: outRows.filter((r) => r.isActive).length,
      categories: categoryCounts.size,
      duplicateSlugGroups: duplicateSlugs.length,
      missingCategory: missingCategory.length,
      invalidCategory: invalidCategory.length,
      slugFallback: slugFallbackCount,
    },
    categoryCounts: [...categoryCounts.entries()].sort((a, b) => b[1] - a[1]),
    duplicateSlugs: duplicateSlugs.slice(0, 50),
    invalidCategory,
    missingCategory,
    redirectEdges: [...redirectEdges].sort((a, b) => b.count - a.count),
    redirectValidation,
  };

  const formats = args.format === "all" ? ["json", "csv", "md", "mmd"] : [args.format];
  if (formats.includes("json")) {
    const jsonPath = path.join(outDir, "catalog-category-map.json");
    fs.writeFileSync(jsonPath, JSON.stringify({ source, sourceDetail, rows: outRows }, null, 2), "utf8");
  }
  if (formats.includes("csv")) {
    const csvPath = path.join(outDir, "catalog-category-map.csv");
    fs.writeFileSync(csvPath, toCSV(outRows), "utf8");
  }
  if (formats.includes("md")) {
    const mdPath = path.join(outDir, "catalog-category-map.md");
    fs.writeFileSync(mdPath, formatMdSummary(summary), "utf8");
  }
  if (formats.includes("mmd")) {
    const mmdPath = path.join(outDir, "catalog-redirect-graph.mmd");
    fs.writeFileSync(mmdPath, buildMermaid(summary.redirectEdges), "utf8");
  }

  console.log("Export complete");
  console.log(`Source: ${summary.source}`);
  if (summary.sourceDetail) console.log(`Source detail: ${summary.sourceDetail}`);
  console.log(`Out dir: ${path.relative(rootDir, outDir)}`);
  console.log("");
  console.log("Summary:");
  console.log(`- Total rows: ${summary.totals.rows}`);
  console.log(`- Active: ${summary.totals.active}`);
  console.log(`- Categories: ${summary.totals.categories}`);
  console.log(`- Duplicate slug groups: ${summary.totals.duplicateSlugGroups}`);
  console.log(`- Missing category: ${summary.totals.missingCategory}`);
  console.log(`- Invalid category: ${summary.totals.invalidCategory}`);
  console.log(`- Slug fallback redirects: ${summary.totals.slugFallback}`);
  console.log("");
  console.log("Category counts:");
  for (const [cat, count] of summary.categoryCounts) {
    console.log(`- ${cat}: ${count}`);
  }
  if (summary.redirectEdges.length) {
    console.log("");
    console.log("Top redirect edges:");
    for (const edge of summary.redirectEdges.slice(0, 10)) {
      console.log(`- ${edge.from} -> ${edge.to}: ${edge.count}`);
    }
  }
}

main().catch((err) => {
  console.error("Export failed.");
  console.error(err?.message || err);
  console.error("");
  console.error("How to fix:");
  console.error("- Ensure DATABASE_URL is set for Prisma, or");
  console.error("- Add a products export (default/products/PRODUCTS/productsByCategory) in a JS/TS/JSON module.");
  process.exit(1);
});
