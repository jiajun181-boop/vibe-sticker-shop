// lib/stamp/fonts.js — Curated stamp-friendly fonts + preloader
import { loadFont } from "@/lib/design-studio/fonts";

/** Fonts optimized for stamps: legible at small sizes, bold, high contrast. */
export const STAMP_FONTS = [
  // Sans-serif — clean, modern
  { family: "Inter", category: "sans-serif" },
  { family: "Oswald", category: "sans-serif" },
  { family: "Bebas Neue", category: "sans-serif" },
  { family: "Rubik", category: "sans-serif" },
  // Serif — traditional, formal
  { family: "Playfair Display", category: "serif" },
  { family: "EB Garamond", category: "serif" },
  // Display — typewriter
  { family: "Special Elite", category: "display" },
  // Handwriting / Script
  { family: "Satisfy", category: "handwriting" },
  { family: "Caveat", category: "handwriting" },
  // System fallback (always available)
  { family: "Helvetica", category: "system" },
];

/**
 * Preload all stamp fonts in parallel.
 * Returns a Promise that resolves when all are loaded.
 */
export function preloadStampFonts() {
  // Special Elite is not in the shared FONT_LIST — load it directly
  const specialEliteLoaded = new Set();
  const promises = STAMP_FONTS.filter((f) => f.category !== "system").map((f) => {
    // loadFont already handles deduplication
    return loadFont(f.family).catch(() => {
      // If loadFont fails because font is not in FONT_LIST (e.g. Special Elite),
      // load it directly via <link>
      if (specialEliteLoaded.has(f.family)) return;
      specialEliteLoaded.add(f.family);
      return new Promise((resolve) => {
        const encoded = f.family.replace(/\s+/g, "+");
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?family=${encoded}:wght@400;600;700&display=swap`;
        link.onload = resolve;
        link.onerror = resolve;
        document.head.appendChild(link);
      });
    });
  });
  return Promise.all(promises);
}
