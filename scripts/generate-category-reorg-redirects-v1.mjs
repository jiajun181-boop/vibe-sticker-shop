import fs from "node:fs";
import path from "node:path";

const csvPath = path.resolve(process.cwd(), "docs", "category-reorg-mapping-v1.csv");
if (!fs.existsSync(csvPath)) {
  console.error(`Missing CSV: ${csvPath}`);
  process.exit(1);
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const cells = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        cells.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
    cells.push(current);
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = cells[idx] ?? "";
    });
    return row;
  });
}

const rows = parseCsv(fs.readFileSync(csvPath, "utf8"));

const redirects = [];
const seen = new Set();

for (const r of rows) {
  if (!r.redirect_from || !r.canonical_url) continue;
  if (r.redirect_from === r.canonical_url) continue;
  const key = `${r.redirect_from}=>${r.canonical_url}`;
  if (seen.has(key)) continue;
  seen.add(key);
  redirects.push({
    source: r.redirect_from,
    destination: r.canonical_url,
    permanent: true,
  });
}

const outJson = path.resolve(process.cwd(), "docs", "category-reorg-redirects-v1.json");
fs.writeFileSync(outJson, JSON.stringify(redirects, null, 2), "utf8");

const snippet = [
  "// Paste into next.config.ts redirects()",
  "const categoryReorgRedirectsV1 = [",
  ...redirects.map((r) => `  { source: "${r.source}", destination: "${r.destination}", permanent: true },`),
  "];",
  "",
].join("\n");

const outSnippet = path.resolve(process.cwd(), "docs", "category-reorg-redirects-v1.snippet.ts");
fs.writeFileSync(outSnippet, snippet, "utf8");

console.log(`Wrote ${redirects.length} redirects to:`);
console.log(`- ${outJson}`);
console.log(`- ${outSnippet}`);
