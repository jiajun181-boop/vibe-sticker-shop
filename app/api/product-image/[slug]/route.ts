import { NextRequest, NextResponse } from "next/server";
import { access } from "node:fs/promises";
import path from "node:path";

const EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".svg"];

function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function titleizeSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .slice(0, 5)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

function pickPalette(category: string, slug: string): [string, string, string] {
  const key = (category + " " + slug).toLowerCase();
  if (key.includes("sticker") || key.includes("label") || key.includes("decal"))
    return ["#0F2B4C", "#1A5276", "#2980B9"];
  if (key.includes("vehicle") || key.includes("fleet") || key.includes("wrap"))
    return ["#2C1654", "#5B2C9C", "#8E44AD"];
  if (key.includes("banner") || key.includes("display"))
    return ["#6B1A0A", "#C0392B", "#E74C3C"];
  if (key.includes("safety") || key.includes("warning") || key.includes("hazard"))
    return ["#7D6608", "#D4AC0D", "#F1C40F"];
  if (key.includes("sign") || key.includes("rigid") || key.includes("aluminum"))
    return ["#1B4332", "#2D6A4F", "#40916C"];
  if (key.includes("window") || key.includes("film") || key.includes("cling"))
    return ["#1A3C5E", "#2471A3", "#5DADE2"];
  if (key.includes("flag") || key.includes("teardrop") || key.includes("feather"))
    return ["#4A1942", "#7B2D8E", "#A569BD"];
  if (key.includes("stand") || key.includes("rollup") || key.includes("retractable"))
    return ["#641E16", "#943126", "#CB4335"];
  if (key.includes("tent") || key.includes("outdoor") || key.includes("canopy"))
    return ["#0E4D2A", "#1E8449", "#27AE60"];
  if (key.includes("stamp"))
    return ["#1B2631", "#2C3E50", "#34495E"];
  if (key.includes("card") || key.includes("business"))
    return ["#1A2744", "#2E4057", "#3D5A80"];
  if (key.includes("poster") || key.includes("print") || key.includes("flyer"))
    return ["#0C5A40", "#1A8A6A", "#26A07A"];
  if (key.includes("envelope") || key.includes("folder") || key.includes("brochure"))
    return ["#4A3728", "#6B4F3A", "#8D6E4C"];
  if (key.includes("pipe") || key.includes("asset") || key.includes("warehouse"))
    return ["#1C2833", "#2E4053", "#566573"];
  if (key.includes("magnet"))
    return ["#4A148C", "#6A1B9A", "#8E24AA"];
  return ["#1E2A44", "#2C3E60", "#3B5C94"];
}

// Product-specific SVG illustrations (white, designed for right side of card)
function pickIllustration(category: string, slug: string): string {
  const key = (category + " " + slug).toLowerCase();

  // Stickers / Labels / Decals
  if (key.includes("sticker") || key.includes("label") || key.includes("decal")) {
    return `<g transform="translate(750, 200)" opacity="0.25">
      <!-- Main circular sticker -->
      <circle cx="180" cy="180" r="160" fill="white" stroke="white" stroke-width="3"/>
      <circle cx="180" cy="180" r="130" fill="none" stroke="white" stroke-width="2" stroke-dasharray="8 6" opacity="0.6"/>
      <!-- Peeling corner -->
      <path d="M310 280 Q340 240 320 200 L340 180 Q360 220 340 300 Z" fill="white" opacity="0.5"/>
      <!-- Star accent sticker -->
      <g transform="translate(50, 320)">
        <polygon points="40,0 50,28 80,30 56,50 64,80 40,62 16,80 24,50 0,30 30,28" fill="white" opacity="0.6"/>
      </g>
      <!-- Small round sticker -->
      <circle cx="340" cy="100" r="45" fill="white" opacity="0.4"/>
      <circle cx="340" cy="100" r="30" fill="none" stroke="white" stroke-width="1.5" opacity="0.3"/>
    </g>`;
  }

  // Banners
  if (key.includes("banner") && !key.includes("stand") && !key.includes("x-banner")) {
    return `<g transform="translate(700, 160)" opacity="0.25">
      <!-- Banner rectangle -->
      <rect x="20" y="60" width="360" height="240" rx="4" fill="white"/>
      <!-- Grommets -->
      <circle cx="50" cy="60" r="10" fill="none" stroke="white" stroke-width="3"/>
      <circle cx="350" cy="60" r="10" fill="none" stroke="white" stroke-width="3"/>
      <circle cx="50" cy="300" r="10" fill="none" stroke="white" stroke-width="3"/>
      <circle cx="350" cy="300" r="10" fill="none" stroke="white" stroke-width="3"/>
      <!-- Text lines on banner -->
      <rect x="80" y="130" width="240" height="16" rx="3" fill="white" opacity="0.3"/>
      <rect x="110" y="160" width="180" height="12" rx="3" fill="white" opacity="0.2"/>
      <rect x="130" y="190" width="140" height="30" rx="6" fill="white" opacity="0.4"/>
      <!-- Hanging rope -->
      <path d="M50 60 Q50 20 100 10 L300 10 Q350 20 350 60" fill="none" stroke="white" stroke-width="3" opacity="0.5"/>
    </g>`;
  }

  // Business Cards
  if (key.includes("card") || key.includes("business")) {
    return `<g transform="translate(720, 200)" opacity="0.25">
      <!-- Card stack (back) -->
      <rect x="40" y="40" width="320" height="190" rx="10" fill="white" opacity="0.3" transform="rotate(6, 200, 135)"/>
      <rect x="30" y="30" width="320" height="190" rx="10" fill="white" opacity="0.5" transform="rotate(3, 190, 125)"/>
      <!-- Main card -->
      <rect x="20" y="20" width="320" height="190" rx="10" fill="white"/>
      <!-- Card content lines -->
      <rect x="50" y="55" width="100" height="14" rx="3" fill="white" opacity="0.3"/>
      <rect x="50" y="80" width="160" height="10" rx="2" fill="white" opacity="0.2"/>
      <rect x="50" y="100" width="120" height="8" rx="2" fill="white" opacity="0.15"/>
      <!-- Logo placeholder -->
      <circle cx="280" cy="75" r="30" fill="white" opacity="0.2"/>
      <!-- Bottom line -->
      <rect x="50" y="170" width="200" height="8" rx="2" fill="white" opacity="0.15"/>
    </g>`;
  }

  // Vehicle / Wraps
  if (key.includes("vehicle") || key.includes("wrap") || key.includes("truck") || key.includes("car")) {
    return `<g transform="translate(680, 220)" opacity="0.25">
      <!-- Van/truck body -->
      <path d="M40 200 L40 80 Q40 40 80 40 L300 40 L300 80 L380 80 Q420 80 420 120 L420 200 Z" fill="white"/>
      <!-- Windshield -->
      <path d="M300 45 L300 80 L370 80 Q380 80 380 90 L355 45 Z" fill="white" opacity="0.3"/>
      <!-- Wheels -->
      <circle cx="120" cy="200" r="35" fill="white"/>
      <circle cx="120" cy="200" r="18" fill="white" opacity="0.3"/>
      <circle cx="360" cy="200" r="35" fill="white"/>
      <circle cx="360" cy="200" r="18" fill="white" opacity="0.3"/>
      <!-- Graphics on van side -->
      <rect x="70" y="80" width="200" height="60" rx="6" fill="white" opacity="0.3"/>
      <rect x="90" y="95" width="100" height="10" rx="2" fill="white" opacity="0.2"/>
      <rect x="90" y="115" width="60" height="8" rx="2" fill="white" opacity="0.15"/>
    </g>`;
  }

  // Signs / Rigid
  if (key.includes("sign") || key.includes("rigid") || key.includes("aluminum") || key.includes("coroplast")) {
    return `<g transform="translate(760, 150)" opacity="0.25">
      <!-- Sign board -->
      <rect x="30" y="30" width="280" height="200" rx="6" fill="white"/>
      <!-- Sign content -->
      <rect x="60" y="70" width="160" height="18" rx="3" fill="white" opacity="0.3"/>
      <rect x="80" y="105" width="120" height="12" rx="2" fill="white" opacity="0.2"/>
      <rect x="100" y="140" width="80" height="30" rx="6" fill="white" opacity="0.4"/>
      <!-- Post -->
      <rect x="155" y="230" width="30" height="250" rx="4" fill="white" opacity="0.7"/>
      <!-- Ground -->
      <ellipse cx="170" cy="480" rx="80" ry="12" fill="white" opacity="0.2"/>
    </g>`;
  }

  // Flags (feather / teardrop)
  if (key.includes("flag") || key.includes("feather") || key.includes("teardrop")) {
    return `<g transform="translate(800, 80)" opacity="0.25">
      <!-- Feather flag shape -->
      <path d="M30 50 Q30 0 60 0 Q150 10 180 100 Q200 200 160 350 Q140 420 130 500 L30 500 Z" fill="white"/>
      <!-- Flag design lines -->
      <path d="M60 80 Q100 70 140 100" fill="none" stroke="white" stroke-width="3" opacity="0.3"/>
      <path d="M50 160 Q100 150 150 180" fill="none" stroke="white" stroke-width="2" opacity="0.2"/>
      <!-- Pole -->
      <rect x="25" y="0" width="10" height="560" rx="5" fill="white" opacity="0.7"/>
      <!-- Base -->
      <path d="M0 540 Q30 520 60 540 Q30 560 0 540 Z" fill="white" opacity="0.4"/>
      <rect x="20" y="540" width="20" height="30" rx="3" fill="white" opacity="0.5"/>
    </g>`;
  }

  // Stands / Roll-up / Retractable / X-banner
  if (key.includes("stand") || key.includes("rollup") || key.includes("retractable") || key.includes("x-banner")) {
    return `<g transform="translate(770, 100)" opacity="0.25">
      <!-- Banner panel -->
      <rect x="50" y="20" width="200" height="380" rx="4" fill="white"/>
      <!-- Banner content -->
      <rect x="80" y="60" width="100" height="14" rx="3" fill="white" opacity="0.3"/>
      <rect x="90" y="90" width="80" height="10" rx="2" fill="white" opacity="0.2"/>
      <circle cx="150" cy="180" r="50" fill="white" opacity="0.15"/>
      <rect x="100" y="280" width="100" height="30" rx="6" fill="white" opacity="0.3"/>
      <!-- Base -->
      <path d="M80 400 L220 400 L250 430 Q150 440 50 430 Z" fill="white" opacity="0.6"/>
      <!-- Support pole -->
      <rect x="145" y="400" width="10" height="50" fill="white" opacity="0.5"/>
    </g>`;
  }

  // Posters / Prints / Flyers
  if (key.includes("poster") || key.includes("print") || key.includes("flyer") || key.includes("menu")) {
    return `<g transform="translate(740, 170)" opacity="0.25">
      <!-- Paper sheet -->
      <rect x="30" y="30" width="280" height="360" rx="4" fill="white"/>
      <!-- Curled corner -->
      <path d="M310 30 L310 80 Q310 90 300 90 L260 90 Z" fill="white" opacity="0.5"/>
      <!-- Content lines -->
      <rect x="60" y="70" width="180" height="20" rx="3" fill="white" opacity="0.3"/>
      <rect x="60" y="110" width="220" height="10" rx="2" fill="white" opacity="0.15"/>
      <rect x="60" y="135" width="200" height="10" rx="2" fill="white" opacity="0.15"/>
      <rect x="60" y="160" width="180" height="10" rx="2" fill="white" opacity="0.15"/>
      <!-- Image placeholder -->
      <rect x="60" y="200" width="220" height="120" rx="6" fill="white" opacity="0.2"/>
      <!-- Bottom text -->
      <rect x="60" y="345" width="140" height="12" rx="2" fill="white" opacity="0.15"/>
    </g>`;
  }

  // Window / Film / Cling
  if (key.includes("window") || key.includes("film") || key.includes("cling") || key.includes("glass")) {
    return `<g transform="translate(720, 130)" opacity="0.25">
      <!-- Storefront window frame -->
      <rect x="20" y="20" width="340" height="400" rx="4" fill="none" stroke="white" stroke-width="6"/>
      <!-- Window divider -->
      <line x1="190" y1="20" x2="190" y2="420" stroke="white" stroke-width="4"/>
      <line x1="20" y1="220" x2="360" y2="220" stroke="white" stroke-width="4"/>
      <!-- Graphics on glass -->
      <circle cx="105" cy="120" r="50" fill="white" opacity="0.3"/>
      <rect x="240" y="80" width="80" height="80" rx="10" fill="white" opacity="0.3"/>
      <!-- Text on window -->
      <rect x="50" y="270" width="100" height="14" rx="3" fill="white" opacity="0.3"/>
      <rect x="230" y="280" width="80" height="10" rx="2" fill="white" opacity="0.2"/>
      <!-- Door handle -->
      <rect x="320" y="350" width="8" height="40" rx="4" fill="white" opacity="0.5"/>
    </g>`;
  }

  // Tent / Outdoor / Canopy
  if (key.includes("tent") || key.includes("outdoor") || key.includes("canopy")) {
    return `<g transform="translate(720, 140)" opacity="0.25">
      <!-- Tent canopy -->
      <path d="M50 180 L200 20 L350 180 Z" fill="white"/>
      <!-- Tent peak detail -->
      <path d="M180 40 L200 20 L220 40" fill="none" stroke="white" stroke-width="3" opacity="0.4"/>
      <!-- Legs -->
      <rect x="65" y="180" width="10" height="280" fill="white" opacity="0.6"/>
      <rect x="325" y="180" width="10" height="280" fill="white" opacity="0.6"/>
      <!-- Valance -->
      <path d="M50 180 Q120 210 200 180 Q280 210 350 180 L350 210 Q280 240 200 210 Q120 240 50 210 Z" fill="white" opacity="0.4"/>
      <!-- Ground shadow -->
      <ellipse cx="200" cy="460" rx="160" ry="15" fill="white" opacity="0.15"/>
    </g>`;
  }

  // Stamps
  if (key.includes("stamp")) {
    return `<g transform="translate(760, 180)" opacity="0.25">
      <!-- Stamp body -->
      <rect x="40" y="20" width="220" height="120" rx="10" fill="white"/>
      <!-- Handle -->
      <path d="M100 20 Q100 0 150 0 Q200 0 200 20" fill="white" opacity="0.5"/>
      <!-- Stamp pad base -->
      <rect x="20" y="200" width="260" height="60" rx="8" fill="white" opacity="0.7"/>
      <!-- Ink surface -->
      <rect x="40" y="210" width="220" height="40" rx="4" fill="white" opacity="0.3"/>
      <!-- Stamp impression -->
      <rect x="80" y="300" width="140" height="40" rx="4" fill="none" stroke="white" stroke-width="2" stroke-dasharray="4 3" opacity="0.4"/>
      <rect x="95" y="310" width="110" height="10" rx="2" fill="white" opacity="0.2"/>
      <rect x="105" y="325" width="90" height="8" rx="2" fill="white" opacity="0.15"/>
    </g>`;
  }

  // Envelope
  if (key.includes("envelope")) {
    return `<g transform="translate(720, 220)" opacity="0.25">
      <!-- Envelope body -->
      <rect x="20" y="30" width="360" height="220" rx="8" fill="white"/>
      <!-- Flap -->
      <path d="M20 30 L200 150 L380 30" fill="none" stroke="white" stroke-width="3" opacity="0.4"/>
      <!-- Address lines -->
      <rect x="180" y="120" width="150" height="10" rx="2" fill="white" opacity="0.2"/>
      <rect x="180" y="145" width="130" height="10" rx="2" fill="white" opacity="0.2"/>
      <rect x="180" y="170" width="110" height="10" rx="2" fill="white" opacity="0.2"/>
      <!-- Stamp -->
      <rect x="310" y="60" width="40" height="50" rx="2" fill="white" opacity="0.3"/>
    </g>`;
  }

  // Brochure / Booklet / Folder
  if (key.includes("brochure") || key.includes("booklet") || key.includes("folder") || key.includes("presentation")) {
    return `<g transform="translate(740, 170)" opacity="0.25">
      <!-- Open folder/brochure -->
      <path d="M30 40 L30 380 Q30 400 50 400 L280 400 Q300 400 300 380 L300 40 Q300 20 280 20 L50 20 Q30 20 30 40 Z" fill="white"/>
      <!-- Fold line -->
      <line x1="165" y1="30" x2="165" y2="390" stroke="white" stroke-width="2" stroke-dasharray="6 4" opacity="0.3"/>
      <!-- Content on left -->
      <rect x="50" y="60" width="90" height="12" rx="2" fill="white" opacity="0.25"/>
      <rect x="50" y="85" width="80" height="8" rx="2" fill="white" opacity="0.15"/>
      <rect x="50" y="120" width="90" height="80" rx="4" fill="white" opacity="0.15"/>
      <!-- Content on right -->
      <rect x="185" y="60" width="90" height="12" rx="2" fill="white" opacity="0.25"/>
      <rect x="185" y="85" width="80" height="8" rx="2" fill="white" opacity="0.15"/>
      <rect x="185" y="120" width="90" height="80" rx="4" fill="white" opacity="0.15"/>
    </g>`;
  }

  // Safety / Warning / Hazard
  if (key.includes("safety") || key.includes("warning") || key.includes("hazard") || key.includes("ppe")) {
    return `<g transform="translate(760, 150)" opacity="0.25">
      <!-- Warning triangle -->
      <path d="M160 30 L300 280 L20 280 Z" fill="none" stroke="white" stroke-width="6" stroke-linejoin="round"/>
      <!-- Exclamation mark -->
      <rect x="148" y="100" width="24" height="100" rx="4" fill="white"/>
      <circle cx="160" cy="240" r="14" fill="white"/>
      <!-- Additional safety sign -->
      <circle cx="280" cy="380" r="55" fill="none" stroke="white" stroke-width="4"/>
      <rect x="255" y="375" width="50" height="10" rx="2" fill="white" opacity="0.5"/>
    </g>`;
  }

  // Pipe / Asset / Warehouse / Industrial
  if (key.includes("pipe") || key.includes("asset") || key.includes("warehouse") || key.includes("cable") || key.includes("rack")) {
    return `<g transform="translate(740, 180)" opacity="0.25">
      <!-- Pipe -->
      <rect x="0" y="120" width="400" height="50" rx="25" fill="white" opacity="0.5"/>
      <!-- Label on pipe -->
      <rect x="100" y="105" width="180" height="80" rx="6" fill="white"/>
      <rect x="120" y="125" width="100" height="12" rx="2" fill="white" opacity="0.3"/>
      <rect x="130" y="145" width="80" height="8" rx="2" fill="white" opacity="0.2"/>
      <!-- Arrow -->
      <path d="M300 145 L340 145 L330 135 M340 145 L330 155" fill="none" stroke="white" stroke-width="3" opacity="0.4"/>
      <!-- QR code placeholder -->
      <rect x="140" y="300" width="80" height="80" rx="4" fill="white" opacity="0.4"/>
      <g transform="translate(150, 310)" opacity="0.3">
        <rect x="0" y="0" width="15" height="15" fill="white"/>
        <rect x="20" y="0" width="15" height="15" fill="white"/>
        <rect x="45" y="0" width="15" height="15" fill="white"/>
        <rect x="0" y="20" width="15" height="15" fill="white"/>
        <rect x="45" y="20" width="15" height="15" fill="white"/>
        <rect x="0" y="45" width="15" height="15" fill="white"/>
        <rect x="20" y="45" width="15" height="15" fill="white"/>
        <rect x="45" y="45" width="15" height="15" fill="white"/>
      </g>
    </g>`;
  }

  // Magnetic signs
  if (key.includes("magnet")) {
    return `<g transform="translate(740, 200)" opacity="0.25">
      <!-- Magnetic sign rectangle -->
      <rect x="30" y="30" width="300" height="180" rx="10" fill="white"/>
      <!-- Magnet symbol -->
      <path d="M120 250 Q120 290 160 290 Q200 290 200 250" fill="none" stroke="white" stroke-width="8" stroke-linecap="round"/>
      <rect x="108" y="230" width="24" height="30" rx="4" fill="white" opacity="0.6"/>
      <rect x="188" y="230" width="24" height="30" rx="4" fill="white" opacity="0.6"/>
      <!-- Text lines on sign -->
      <rect x="70" y="70" width="160" height="16" rx="3" fill="white" opacity="0.3"/>
      <rect x="90" y="105" width="120" height="10" rx="2" fill="white" opacity="0.2"/>
      <rect x="100" y="140" width="100" height="30" rx="6" fill="white" opacity="0.3"/>
    </g>`;
  }

  // Postcards
  if (key.includes("postcard")) {
    return `<g transform="translate(720, 200)" opacity="0.25">
      <!-- Postcard -->
      <rect x="20" y="20" width="340" height="220" rx="6" fill="white"/>
      <!-- Divider line -->
      <line x1="200" y1="40" x2="200" y2="220" stroke="white" stroke-width="2" opacity="0.3"/>
      <!-- Image area (left) -->
      <rect x="35" y="35" width="150" height="190" rx="4" fill="white" opacity="0.2"/>
      <!-- Address lines (right) -->
      <rect x="220" y="60" width="120" height="8" rx="2" fill="white" opacity="0.2"/>
      <rect x="220" y="80" width="100" height="8" rx="2" fill="white" opacity="0.2"/>
      <rect x="220" y="100" width="110" height="8" rx="2" fill="white" opacity="0.2"/>
      <!-- Stamp -->
      <rect x="300" y="160" width="40" height="50" rx="2" fill="white" opacity="0.3"/>
    </g>`;
  }

  // Default: generic product box
  return `<g transform="translate(770, 200)" opacity="0.2">
    <!-- Product box -->
    <path d="M40 120 L180 40 L320 120 L180 200 Z" fill="white"/>
    <path d="M40 120 L40 280 L180 360 L180 200 Z" fill="white" opacity="0.7"/>
    <path d="M320 120 L320 280 L180 360 L180 200 Z" fill="white" opacity="0.5"/>
    <!-- Box highlight -->
    <path d="M180 200 L180 360" stroke="white" stroke-width="2" opacity="0.3"/>
  </g>`;
}

function makeSvg({ name, category, slug }: { name: string; category: string; slug: string }) {
  const [c1, c2, c3] = pickPalette(category, slug);
  const productTitle = name || titleizeSlug(slug) || "Custom Product";
  const categoryTitle = category ? titleizeSlug(category) : "";
  const illustration = pickIllustration(category, slug);

  // Word-wrap long product titles
  const maxCharsPerLine = 22;
  const words = productTitle.split(" ");
  const lines: string[] = [];
  let currentLine = "";
  for (const word of words) {
    if (currentLine && (currentLine + " " + word).length > maxCharsPerLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = currentLine ? currentLine + " " + word : word;
    }
  }
  if (currentLine) lines.push(currentLine);

  const titleFontSize = lines.length > 2 ? 48 : lines.length > 1 ? 56 : 64;
  const titleY = lines.length > 2 ? 340 : lines.length > 1 ? 360 : 400;
  const titleLines = lines
    .map(
      (line, i) =>
        `<text x="100" y="${titleY + i * (titleFontSize + 10)}" font-family="'Segoe UI', Arial, Helvetica, sans-serif" font-size="${titleFontSize}" font-weight="800" fill="#FFFFFF" letter-spacing="-0.5">${esc(line)}</text>`
    )
    .join("\n  ");

  const taglineY = titleY + lines.length * (titleFontSize + 10) + 15;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900" role="img" aria-label="${esc(productTitle)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}" />
      <stop offset="50%" stop-color="${c2}" />
      <stop offset="100%" stop-color="${c3}" />
    </linearGradient>
    <linearGradient id="shine" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="white" stop-opacity="0.08" />
      <stop offset="100%" stop-color="white" stop-opacity="0" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="900" fill="url(#bg)" />
  <rect width="1200" height="450" fill="url(#shine)" />

  <!-- Decorative circles -->
  <circle cx="1050" cy="80" r="200" fill="white" opacity="0.04"/>
  <circle cx="150" cy="820" r="250" fill="white" opacity="0.04"/>

  <!-- Product illustration (right side) -->
  ${illustration}

  <!-- Category badge (top) -->
  ${categoryTitle ? `<g>
    <rect x="90" y="80" width="${Math.min(categoryTitle.length * 14 + 40, 300)}" height="40" rx="20" fill="white" fill-opacity="0.15"/>
    <text x="110" y="107" font-family="'Segoe UI', Arial, Helvetica, sans-serif" font-size="16" font-weight="600" fill="white" letter-spacing="1.5" opacity="0.8">${esc(categoryTitle.toUpperCase())}</text>
  </g>` : ""}

  <!-- Product name -->
  ${titleLines}

  <!-- Tagline -->
  <text x="100" y="${taglineY}" font-family="'Segoe UI', Arial, Helvetica, sans-serif" font-size="22" font-weight="400" fill="white" opacity="0.5">Custom printed by La Lunar</text>

  <!-- Bottom branding bar -->
  <g transform="translate(0, 810)">
    <rect x="0" y="0" width="1200" height="90" fill="black" fill-opacity="0.2"/>
    <text x="100" y="55" font-family="'Segoe UI', Arial, Helvetica, sans-serif" font-size="28" font-weight="800" fill="white" letter-spacing="3" opacity="0.6">LA LUNAR</text>
    <text x="1100" y="55" text-anchor="end" font-family="'Segoe UI', Arial, Helvetica, sans-serif" font-size="16" font-weight="400" fill="white" opacity="0.35">lunarprint.ca</text>
  </g>
</svg>`;
}

async function findAsset(slug: string) {
  const safeSlug = slug.replace(/[^a-zA-Z0-9-_]/g, "");
  if (!safeSlug) return null;

  const root = process.cwd();
  for (const ext of EXTENSIONS) {
    const abs = path.join(root, "public", "products", `${safeSlug}${ext}`);
    try {
      await access(abs);
      return `/products/${safeSlug}${ext}`;
    } catch {
      // continue
    }
  }
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const asset = await findAsset(slug);
  if (asset) {
    return NextResponse.redirect(new URL(asset, request.url), {
      status: 307,
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  const name = (request.nextUrl.searchParams.get("name") || "").slice(0, 120);
  const category = (request.nextUrl.searchParams.get("category") || "").slice(0, 120);
  const svg = makeSvg({ name, category, slug });

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
