// lib/stamp/fonts.js — Curated fonts for stamp editor + preloader
import { loadFont } from "@/lib/design-studio/fonts";

export const STAMP_FONTS = [
  { family: "Inter", category: "sans" },
  { family: "Oswald", category: "sans" },
  { family: "Bebas Neue", category: "sans" },
  { family: "Rubik", category: "sans" },
  { family: "Playfair Display", category: "serif" },
  { family: "EB Garamond", category: "serif" },
  { family: "Special Elite", category: "display" },
  { family: "Satisfy", category: "script" },
  { family: "Caveat", category: "script" },
  { family: "Helvetica", category: "system" },
];

const SYSTEM_FONTS = new Set(["Helvetica"]);

/**
 * Preload all stamp fonts in one batch request.
 * Returns a promise that resolves when fonts are ready.
 */
export async function preloadStampFonts() {
  const toLoad = STAMP_FONTS.filter((f) => !SYSTEM_FONTS.has(f.family));
  if (toLoad.length === 0) return;

  const families = toLoad.map((f) => f.family.replace(/\s+/g, "+")).join("&family=");
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${families}:wght@400;600;700&display=swap`;

  return new Promise((resolve) => {
    link.onload = resolve;
    link.onerror = resolve;
    document.head.appendChild(link);
  });
}

export { loadFont };
