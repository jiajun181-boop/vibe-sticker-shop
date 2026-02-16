import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

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

function uniq(values) {
  return [...new Set(values)];
}

async function main() {
  const rows = parseCsv(fs.readFileSync(csvPath, "utf8"));
  const activeRows = rows.filter((r) => r.old_category && r.old_sub_slug && r.new_parent_slug && r.new_sub_slug);

  let matched = 0;
  let touched = 0;

  for (const row of activeRows) {
    const sourceTag = `subseries:${row.old_sub_slug}`;
    const targetPlacementTag = `placement:${row.new_parent_slug}:${row.new_sub_slug}`;

    const products = await prisma.product.findMany({
      where: {
        category: row.old_category,
        tags: { has: sourceTag },
      },
      select: {
        id: true,
        tags: true,
      },
    });

    if (!products.length) continue;
    matched += products.length;

    for (const p of products) {
      const nextTags = uniq([...(Array.isArray(p.tags) ? p.tags : []), targetPlacementTag]);
      const changed = nextTags.length !== (Array.isArray(p.tags) ? p.tags.length : 0);
      if (!changed) continue;
      touched += 1;
      if (APPLY) {
        await prisma.product.update({
          where: { id: p.id },
          data: { tags: nextTags },
        });
      }
    }
  }

  console.log(`Rows scanned: ${activeRows.length}`);
  console.log(`Matched products: ${matched}`);
  console.log(`Products needing tag update: ${touched}`);
  if (!APPLY) {
    console.log("Dry run only. Re-run with --apply to write placement tags.");
  } else {
    console.log("Placement tags applied.");
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
