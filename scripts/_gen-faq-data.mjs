// scripts/_gen-faq-data.mjs
// Converts docs/lalunar-deliverables/task6b-faq-schema-ready.json
// into a JS module at lib/seo/category-faq-schemas.js

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const raw = JSON.parse(
  readFileSync(join(root, "docs/lalunar-deliverables/task6b-faq-schema-ready.json"), "utf8")
);

const map = {};
for (const entry of raw.categories) {
  // Use only the schema object (already has @context, @type, mainEntity)
  map[entry.category] = entry.schema;
}

const outDir = join(root, "lib/seo");
mkdirSync(outDir, { recursive: true });

const outPath = join(outDir, "category-faq-schemas.js");
const content = `// Auto-generated from docs/lalunar-deliverables/task6b-faq-schema-ready.json
// Category slug → FAQPage JSON-LD schema
export const CATEGORY_FAQ_SCHEMAS = ${JSON.stringify(map, null, 2)};
`;

writeFileSync(outPath, content, "utf8");
console.log(`Written ${Object.keys(map).length} category FAQ schemas to ${outPath}`);
