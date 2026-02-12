#!/usr/bin/env node
/**
 * Generate professional SVG product images with unified style per category.
 * Usage: node scripts/generate-product-images.mjs
 *
 * Creates SVG files in public/products/<slug>.svg and optionally updates
 * the database ProductImage URLs via Prisma.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "public", "products");

// ── Category themes ──────────────────────────────────────────────────
const CATEGORY_THEMES = {
  "stickers-labels": {
    gradient: ["#F97316", "#FB923C", "#FDBA74"],
    accent: "#FFF7ED",
    icon: "sticker",
    label: "Stickers & Labels",
  },
  "rigid-signs": {
    gradient: ["#0EA5E9", "#38BDF8", "#7DD3FC"],
    accent: "#F0F9FF",
    icon: "sign",
    label: "Rigid Signs",
  },
  "banners-displays": {
    gradient: ["#DC2626", "#EF4444", "#FCA5A5"],
    accent: "#FEF2F2",
    icon: "banner",
    label: "Banners & Displays",
  },
  "marketing-prints": {
    gradient: ["#EC4899", "#F472B6", "#F9A8D4"],
    accent: "#FDF2F8",
    icon: "print",
    label: "Marketing Prints",
  },
  packaging: {
    gradient: ["#10B981", "#34D399", "#6EE7B7"],
    accent: "#ECFDF5",
    icon: "box",
    label: "Packaging",
  },
  "display-stands": {
    gradient: ["#6366F1", "#818CF8", "#A5B4FC"],
    accent: "#EEF2FF",
    icon: "stand",
    label: "Display Stands",
  },
  "large-format-graphics": {
    gradient: ["#14B8A6", "#2DD4BF", "#5EEAD4"],
    accent: "#F0FDFA",
    icon: "graphic",
    label: "Large Format",
  },
  "business-forms": {
    gradient: ["#7C3AED", "#8B5CF6", "#A78BFA"],
    accent: "#F5F3FF",
    icon: "form",
    label: "Business Forms",
  },
  "retail-promo": {
    gradient: ["#D946EF", "#E879F9", "#F0ABFC"],
    accent: "#FDF4FF",
    icon: "promo",
    label: "Retail Promo",
  },
  "vehicle-branding-advertising": {
    gradient: ["#F59E0B", "#FBBF24", "#FDE68A"],
    accent: "#FFFBEB",
    icon: "vehicle",
    label: "Vehicle Branding",
  },
  "facility-asset-labels": {
    gradient: ["#8B5CF6", "#A78BFA", "#C4B5FD"],
    accent: "#F5F3FF",
    icon: "facility",
    label: "Facility Labels",
  },
  "fleet-compliance-id": {
    gradient: ["#0D9488", "#14B8A6", "#5EEAD4"],
    accent: "#F0FDFA",
    icon: "fleet",
    label: "Fleet & Compliance",
  },
  "safety-warning-decals": {
    gradient: ["#EAB308", "#FACC15", "#FDE047"],
    accent: "#FEFCE8",
    icon: "safety",
    label: "Safety Decals",
  },
};

const DEFAULT_THEME = {
  gradient: ["#6B7280", "#9CA3AF", "#D1D5DB"],
  accent: "#F9FAFB",
  icon: "default",
  label: "Products",
};

// ── Icon paths (simple, recognizable shapes) ─────────────────────────
function getCategoryIcon(icon) {
  const icons = {
    sticker: `<circle cx="30" cy="30" r="22" fill="none" stroke="white" stroke-width="2" opacity="0.9"/>
      <path d="M30 14 L30 30 L44 30" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
      <circle cx="30" cy="30" r="4" fill="white" opacity="0.9"/>`,

    sign: `<rect x="12" y="16" width="36" height="24" rx="3" fill="none" stroke="white" stroke-width="2" opacity="0.9"/>
      <line x1="30" y1="40" x2="30" y2="52" stroke="white" stroke-width="2" opacity="0.7"/>
      <line x1="22" y1="52" x2="38" y2="52" stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.7"/>`,

    banner: `<rect x="14" y="10" width="32" height="38" rx="2" fill="none" stroke="white" stroke-width="2" opacity="0.9"/>
      <path d="M14 48 L30 42 L46 48" fill="none" stroke="white" stroke-width="2" opacity="0.7"/>
      <line x1="20" y1="18" x2="40" y2="18" stroke="white" stroke-width="1.5" opacity="0.6"/>
      <line x1="20" y1="24" x2="36" y2="24" stroke="white" stroke-width="1.5" opacity="0.6"/>`,

    print: `<rect x="12" y="12" width="36" height="36" rx="3" fill="none" stroke="white" stroke-width="2" opacity="0.9"/>
      <line x1="12" y1="22" x2="48" y2="22" stroke="white" stroke-width="1.5" opacity="0.5"/>
      <line x1="18" y1="30" x2="42" y2="30" stroke="white" stroke-width="1.5" opacity="0.6"/>
      <line x1="18" y1="36" x2="38" y2="36" stroke="white" stroke-width="1.5" opacity="0.6"/>`,

    box: `<path d="M30 10 L48 20 L48 42 L30 52 L12 42 L12 20 Z" fill="none" stroke="white" stroke-width="2" opacity="0.9"/>
      <line x1="30" y1="30" x2="30" y2="52" stroke="white" stroke-width="1.5" opacity="0.6"/>
      <line x1="12" y1="20" x2="30" y2="30" stroke="white" stroke-width="1.5" opacity="0.6"/>
      <line x1="48" y1="20" x2="30" y2="30" stroke="white" stroke-width="1.5" opacity="0.6"/>`,

    stand: `<line x1="30" y1="8" x2="30" y2="52" stroke="white" stroke-width="2" opacity="0.9"/>
      <rect x="18" y="8" width="24" height="30" rx="2" fill="none" stroke="white" stroke-width="2" opacity="0.8"/>
      <line x1="20" y1="52" x2="40" y2="52" stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.7"/>`,

    graphic: `<rect x="10" y="14" width="40" height="32" rx="3" fill="none" stroke="white" stroke-width="2" opacity="0.9"/>
      <circle cx="22" cy="26" r="5" fill="none" stroke="white" stroke-width="1.5" opacity="0.7"/>
      <path d="M10 38 L20 30 L30 36 L38 28 L50 38" fill="none" stroke="white" stroke-width="1.5" opacity="0.6"/>`,

    form: `<rect x="14" y="8" width="32" height="44" rx="3" fill="none" stroke="white" stroke-width="2" opacity="0.9"/>
      <line x1="20" y1="18" x2="40" y2="18" stroke="white" stroke-width="1.5" opacity="0.6"/>
      <line x1="20" y1="26" x2="40" y2="26" stroke="white" stroke-width="1.5" opacity="0.6"/>
      <line x1="20" y1="34" x2="36" y2="34" stroke="white" stroke-width="1.5" opacity="0.6"/>
      <rect x="20" y="40" width="8" height="6" rx="1" fill="none" stroke="white" stroke-width="1.5" opacity="0.6"/>`,

    promo: `<polygon points="30,8 35,22 50,22 38,32 42,46 30,38 18,46 22,32 10,22 25,22" fill="none" stroke="white" stroke-width="2" opacity="0.9"/>`,

    vehicle: `<path d="M10 34 L14 24 L22 24 L26 18 L42 18 L48 24 L50 34 L50 38 L10 38 Z" fill="none" stroke="white" stroke-width="2" opacity="0.9"/>
      <circle cx="20" cy="38" r="5" fill="none" stroke="white" stroke-width="2" opacity="0.8"/>
      <circle cx="40" cy="38" r="5" fill="none" stroke="white" stroke-width="2" opacity="0.8"/>`,

    facility: `<rect x="14" y="14" width="32" height="34" rx="3" fill="none" stroke="white" stroke-width="2" opacity="0.9"/>
      <rect x="20" y="20" width="8" height="8" rx="1" fill="none" stroke="white" stroke-width="1.5" opacity="0.6"/>
      <rect x="32" y="20" width="8" height="8" rx="1" fill="none" stroke="white" stroke-width="1.5" opacity="0.6"/>
      <rect x="26" y="34" width="8" height="14" rx="1" fill="none" stroke="white" stroke-width="1.5" opacity="0.6"/>`,

    fleet: `<rect x="10" y="16" width="40" height="24" rx="4" fill="none" stroke="white" stroke-width="2" opacity="0.9"/>
      <line x1="16" y1="24" x2="44" y2="24" stroke="white" stroke-width="1.5" opacity="0.6"/>
      <text x="30" y="35" text-anchor="middle" fill="white" font-size="10" font-family="Arial" font-weight="bold" opacity="0.8">ID</text>`,

    safety: `<polygon points="30,10 50,46 10,46" fill="none" stroke="white" stroke-width="2.5" opacity="0.9"/>
      <line x1="30" y1="22" x2="30" y2="34" stroke="white" stroke-width="2.5" stroke-linecap="round" opacity="0.9"/>
      <circle cx="30" cy="40" r="2" fill="white" opacity="0.9"/>`,

    default: `<circle cx="30" cy="30" r="20" fill="none" stroke="white" stroke-width="2" opacity="0.8"/>
      <circle cx="30" cy="30" r="8" fill="white" opacity="0.3"/>`,
  };
  return icons[icon] || icons.default;
}

// ── Background patterns (subtle, per-category) ──────────────────────
function getBackgroundPattern(icon, color) {
  const lightColor = color + "20"; // 12% opacity via hex alpha
  const patterns = {
    sticker: Array.from({ length: 12 }, (_, i) => {
      const x = 80 + (i % 4) * 140 + (Math.floor(i / 4) * 40);
      const y = 60 + Math.floor(i / 4) * 120;
      const r = 20 + (i % 3) * 8;
      return `<circle cx="${x}" cy="${y}" r="${r}" fill="white" opacity="0.04"/>`;
    }).join("\n"),

    sign: Array.from({ length: 8 }, (_, i) => {
      const x = 60 + (i % 4) * 130;
      const y = 40 + Math.floor(i / 4) * 160;
      return `<rect x="${x}" y="${y}" width="${50 + (i % 2) * 20}" height="${30 + (i % 3) * 10}" rx="4" fill="white" opacity="0.04"/>`;
    }).join("\n"),

    banner: Array.from({ length: 6 }, (_, i) => {
      const y = i * 80 - 40;
      return `<line x1="0" y1="${y}" x2="600" y2="${y + 200}" stroke="white" stroke-width="1" opacity="0.05"/>`;
    }).join("\n"),

    print: `<pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <rect width="40" height="40" fill="none" stroke="white" stroke-width="0.5" opacity="0.06"/>
    </pattern><rect width="600" height="400" fill="url(#grid)"/>`,

    box: Array.from({ length: 6 }, (_, i) => {
      const cx = 100 + (i % 3) * 200;
      const cy = 80 + Math.floor(i / 3) * 200;
      return `<polygon points="${cx},${cy - 30} ${cx + 26},${cy - 15} ${cx + 26},${cy + 15} ${cx},${cy + 30} ${cx - 26},${cy + 15} ${cx - 26},${cy - 15}" fill="none" stroke="white" stroke-width="0.8" opacity="0.05"/>`;
    }).join("\n"),

    stand: Array.from({ length: 10 }, (_, i) => {
      const x = 40 + i * 56;
      return `<line x1="${x}" y1="0" x2="${x}" y2="400" stroke="white" stroke-width="0.8" opacity="0.04"/>`;
    }).join("\n"),

    graphic: `<path d="M0 350 Q150 280 300 320 T600 300" fill="none" stroke="white" stroke-width="1.5" opacity="0.06"/>
      <path d="M0 380 Q150 310 300 350 T600 330" fill="none" stroke="white" stroke-width="1" opacity="0.04"/>`,

    form: Array.from({ length: 8 }, (_, i) => {
      const y = 30 + i * 50;
      return `<line x1="60" y1="${y}" x2="540" y2="${y}" stroke="white" stroke-width="0.8" opacity="0.05"/>`;
    }).join("\n"),

    promo: Array.from({ length: 5 }, (_, i) => {
      const cx = 80 + i * 120;
      const cy = 60 + (i % 2) * 240;
      const size = 15;
      const pts = Array.from({ length: 5 }, (_, j) => {
        const angle = (j * 72 - 90) * Math.PI / 180;
        return `${cx + Math.cos(angle) * size},${cy + Math.sin(angle) * size}`;
      }).join(" ");
      return `<polygon points="${pts}" fill="white" opacity="0.04"/>`;
    }).join("\n"),

    vehicle: `<path d="M-20 300 Q100 260 200 280 T400 270 T600 290 T800 300" fill="none" stroke="white" stroke-width="1" opacity="0.05"/>
      <line x1="0" y1="340" x2="600" y2="340" stroke="white" stroke-width="40" opacity="0.03"/>`,

    facility: Array.from({ length: 6 }, (_, i) => {
      const x = 80 + (i % 3) * 180;
      const y = 60 + Math.floor(i / 3) * 200;
      return `<rect x="${x}" y="${y}" width="60" height="80" rx="3" fill="none" stroke="white" stroke-width="0.8" opacity="0.04"/>
        <rect x="${x + 8}" y="${y + 10}" width="16" height="12" rx="1" fill="white" opacity="0.03"/>
        <rect x="${x + 32}" y="${y + 10}" width="16" height="12" rx="1" fill="white" opacity="0.03"/>`;
    }).join("\n"),

    fleet: `<rect x="60" y="140" width="480" height="120" rx="8" fill="none" stroke="white" stroke-width="1" opacity="0.04"/>
      <line x1="60" y1="180" x2="540" y2="180" stroke="white" stroke-width="0.8" opacity="0.04"/>`,

    safety: Array.from({ length: 4 }, (_, i) => {
      const cx = 100 + i * 140;
      const cy = i % 2 === 0 ? 80 : 300;
      return `<polygon points="${cx},${cy - 20} ${cx + 17},${cy + 10} ${cx - 17},${cy + 10}" fill="none" stroke="white" stroke-width="0.8" opacity="0.04"/>`;
    }).join("\n"),

    default: `<circle cx="300" cy="200" r="120" fill="none" stroke="white" stroke-width="1" opacity="0.04"/>
      <circle cx="300" cy="200" r="80" fill="none" stroke="white" stroke-width="0.8" opacity="0.03"/>`,
  };
  return patterns[icon] || patterns.default;
}

// ── Text wrapping helper ─────────────────────────────────────────────
function wrapText(text, maxCharsPerLine = 22) {
  // Remove Chinese characters from line calc — they're wider
  const words = text.split(/\s+/);
  const lines = [];
  let current = "";

  for (const word of words) {
    if ((current + " " + word).trim().length > maxCharsPerLine && current) {
      lines.push(current.trim());
      current = word;
    } else {
      current = current ? current + " " + word : word;
    }
  }
  if (current.trim()) lines.push(current.trim());
  return lines.length > 3 ? lines.slice(0, 3) : lines;
}

// ── Escape XML special characters ────────────────────────────────────
function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ── Generate SVG ─────────────────────────────────────────────────────
function generateSVG(productName, category) {
  const theme = CATEGORY_THEMES[category] || DEFAULT_THEME;
  const [c1, c2, c3] = theme.gradient;
  const iconSVG = getCategoryIcon(theme.icon);
  const pattern = getBackgroundPattern(theme.icon, c1);
  const lines = wrapText(productName);
  const lineHeight = 32;
  const totalTextHeight = lines.length * lineHeight;
  const startY = 220 - totalTextHeight / 2 + 20; // Center vertically in lower area

  const textLines = lines
    .map((line, i) => {
      const y = startY + i * lineHeight;
      return `<text x="300" y="${y}" text-anchor="middle" fill="white" font-size="26" font-weight="700" font-family="'Segoe UI', system-ui, -apple-system, sans-serif" letter-spacing="0.5">${escapeXml(line)}</text>`;
    })
    .join("\n    ");

  // Category label
  const categoryLabel = escapeXml(theme.label);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="50%" stop-color="${c2}"/>
      <stop offset="100%" stop-color="${c3}"/>
    </linearGradient>
    <linearGradient id="overlay" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="black" stop-opacity="0"/>
      <stop offset="100%" stop-color="black" stop-opacity="0.3"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-opacity="0.15"/>
    </filter>
  </defs>

  <!-- Background gradient -->
  <rect width="600" height="400" fill="url(#bg)" rx="0"/>

  <!-- Pattern overlay -->
  <g>${pattern}</g>

  <!-- Dark gradient overlay for text readability -->
  <rect width="600" height="400" fill="url(#overlay)"/>

  <!-- Category icon (top-left) -->
  <g transform="translate(28, 24)" filter="url(#shadow)">
    ${iconSVG}
  </g>

  <!-- Category badge (top-right) -->
  <g transform="translate(600, 0)">
    <rect x="-170" y="18" width="150" height="30" rx="15" fill="white" opacity="0.2"/>
    <text x="-95" y="38" text-anchor="middle" fill="white" font-size="12" font-weight="600" font-family="'Segoe UI', system-ui, sans-serif" letter-spacing="0.8" opacity="0.95">${categoryLabel}</text>
  </g>

  <!-- Product name -->
  <g filter="url(#shadow)">
    ${textLines}
  </g>

  <!-- Bottom accent line -->
  <rect x="240" y="${startY + totalTextHeight + 12}" width="120" height="3" rx="1.5" fill="white" opacity="0.5"/>

  <!-- Branding watermark -->
  <text x="300" y="380" text-anchor="middle" fill="white" font-size="11" font-weight="400" font-family="'Segoe UI', system-ui, sans-serif" letter-spacing="1.5" opacity="0.35">VIBE STICKER SHOP</text>
</svg>`;
}

// ── Get all products from database (via Prisma) ─────────────────────
async function getProductsFromDB() {
  try {
    // Dynamic import to handle ESM
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true, category: true },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    });
    await prisma.$disconnect();
    return products;
  } catch (e) {
    console.error("Could not connect to database, using config fallback:", e.message);
    return null;
  }
}

// ── Fallback: get products from config file ─────────────────────────
async function getProductsFromConfig() {
  try {
    const config = await import("../config/products.js");
    const products = config.default || config.products || [];
    return products.map((p) => ({
      id: p.id || p.slug,
      name: p.name,
      slug: p.slug,
      category: p.category,
    }));
  } catch (e) {
    console.error("Could not load config/products.js:", e.message);
    return [];
  }
}

// ── Main ─────────────────────────────────────────────────────────────
async function main() {
  console.log("Generating product images...\n");

  // Ensure output directory exists
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  // Try database first, fallback to config
  let products = await getProductsFromDB();
  if (!products || products.length === 0) {
    console.log("Falling back to config/products.js...");
    products = await getProductsFromConfig();
  }

  if (products.length === 0) {
    console.error("No products found!");
    process.exit(1);
  }

  console.log(`Found ${products.length} products across categories:\n`);

  // Group by category for reporting
  const byCategory = {};
  for (const p of products) {
    if (!byCategory[p.category]) byCategory[p.category] = [];
    byCategory[p.category].push(p);
  }

  for (const [cat, prods] of Object.entries(byCategory)) {
    const theme = CATEGORY_THEMES[cat] || DEFAULT_THEME;
    console.log(`  ${theme.label || cat}: ${prods.length} products`);
  }
  console.log();

  // Generate SVGs
  let generated = 0;
  for (const product of products) {
    const svg = generateSVG(product.name, product.category);
    const filename = `${product.slug}.svg`;
    const filepath = path.join(OUT_DIR, filename);
    fs.writeFileSync(filepath, svg, "utf-8");
    generated++;
  }

  console.log(`Generated ${generated} SVG images in ${OUT_DIR}`);
  console.log("\nNext step: node scripts/update-product-image-urls.mjs");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
