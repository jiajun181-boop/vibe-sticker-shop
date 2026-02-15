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
    .slice(0, 4)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

function pickPalette(category: string) {
  const key = category.toLowerCase();
  if (key.includes("sticker") || key.includes("label")) return ["#13375B", "#1D6FA3"];
  if (key.includes("vehicle") || key.includes("fleet")) return ["#3C1E68", "#7746D6"];
  if (key.includes("banner") || key.includes("display")) return ["#7A210A", "#D3552E"];
  if (key.includes("safety")) return ["#7A5A05", "#D9A208"];
  if (key.includes("print") || key.includes("packaging")) return ["#0C5A40", "#26A07A"];
  return ["#1E2A44", "#3B5C94"];
}

function makeSvg({ name, category, slug }: { name: string; category: string; slug: string }) {
  const [c1, c2] = pickPalette(category);
  const productTitle = name || titleizeSlug(slug) || "Custom Product";
  const categoryTitle = category ? titleizeSlug(category) : "La Lunar";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900" role="img" aria-label="${esc(
    productTitle
  )}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}" />
      <stop offset="100%" stop-color="${c2}" />
    </linearGradient>
  </defs>
  <rect width="1200" height="900" fill="url(#bg)" />
  <g opacity="0.18">
    <circle cx="980" cy="120" r="180" fill="#FFFFFF"/>
    <circle cx="230" cy="770" r="220" fill="#FFFFFF"/>
  </g>
  <g opacity="0.2">
    <rect x="90" y="120" width="1020" height="660" rx="40" fill="#FFFFFF"/>
  </g>
  <text x="100" y="180" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="700" fill="#FFFFFF">La Lunar</text>
  <text x="100" y="240" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="600" fill="#DDE8FF">${esc(
    categoryTitle
  )}</text>
  <text x="100" y="360" font-family="Arial, Helvetica, sans-serif" font-size="68" font-weight="800" fill="#FFFFFF">${esc(
    productTitle
  )}</text>
  <text x="100" y="425" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="500" fill="#EAF2FF">Custom printed by La Lunar Printing</text>
  <rect x="100" y="680" width="330" height="72" rx="36" fill="#FFFFFF" fill-opacity="0.92"/>
  <text x="130" y="725" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="800" fill="#0E1A2F">LA LUNAR</text>
</svg>`;
}

async function findAsset(slug: string) {
  const safeSlug = slug.replace(/[^a-zA-Z0-9-_]/g, "");
  if (!safeSlug) return null;

  const root = process.cwd();
  for (const ext of EXTENSIONS) {
    const rel = `/products/${safeSlug}${ext}`;
    const abs = path.join(root, "public", "products", `${safeSlug}${ext}`);
    try {
      await access(abs);
      return rel;
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

