// lib/design-studio/fonts.js — Google Fonts library for Design Studio

export const FONT_LIST = [
  // Sans-serif
  { family: "Inter", category: "sans-serif" },
  { family: "Roboto", category: "sans-serif" },
  { family: "Open Sans", category: "sans-serif" },
  { family: "Montserrat", category: "sans-serif" },
  { family: "Poppins", category: "sans-serif" },
  { family: "Lato", category: "sans-serif" },
  { family: "Nunito", category: "sans-serif" },
  { family: "Raleway", category: "sans-serif" },
  { family: "Oswald", category: "sans-serif" },
  { family: "Work Sans", category: "sans-serif" },
  { family: "Rubik", category: "sans-serif" },
  { family: "DM Sans", category: "sans-serif" },
  { family: "Manrope", category: "sans-serif" },
  { family: "Space Grotesk", category: "sans-serif" },
  { family: "Bebas Neue", category: "sans-serif" },

  // Serif
  { family: "Playfair Display", category: "serif" },
  { family: "Merriweather", category: "serif" },
  { family: "Lora", category: "serif" },
  { family: "PT Serif", category: "serif" },
  { family: "Libre Baskerville", category: "serif" },
  { family: "Cormorant Garamond", category: "serif" },
  { family: "Crimson Text", category: "serif" },
  { family: "EB Garamond", category: "serif" },
  { family: "DM Serif Display", category: "serif" },

  // Display / Decorative
  { family: "Abril Fatface", category: "display" },
  { family: "Righteous", category: "display" },
  { family: "Passion One", category: "display" },
  { family: "Fredoka One", category: "display" },
  { family: "Bungee", category: "display" },
  { family: "Black Ops One", category: "display" },

  // Handwriting / Script
  { family: "Dancing Script", category: "handwriting" },
  { family: "Pacifico", category: "handwriting" },
  { family: "Great Vibes", category: "handwriting" },
  { family: "Caveat", category: "handwriting" },
  { family: "Sacramento", category: "handwriting" },
  { family: "Satisfy", category: "handwriting" },

  // Monospace
  { family: "Roboto Mono", category: "monospace" },
  { family: "JetBrains Mono", category: "monospace" },
  { family: "Space Mono", category: "monospace" },
  { family: "Fira Code", category: "monospace" },

  // System fallbacks (always available)
  { family: "Helvetica", category: "system" },
  { family: "Arial", category: "system" },
  { family: "Georgia", category: "system" },
  { family: "Times New Roman", category: "system" },
  { family: "Verdana", category: "system" },
  { family: "Impact", category: "system" },
];

const loadedFonts = new Set(["Helvetica", "Arial", "Georgia", "Times New Roman", "Verdana", "Impact"]);
let linkElement = null;

/**
 * Load a Google Font on demand.
 * Injects a <link> tag for the font if not already loaded.
 */
export function loadFont(family) {
  if (loadedFonts.has(family)) return Promise.resolve();
  // System fonts don't need loading
  const font = FONT_LIST.find((f) => f.family === family);
  if (font?.category === "system") {
    loadedFonts.add(family);
    return Promise.resolve();
  }

  loadedFonts.add(family);

  return new Promise((resolve) => {
    const encoded = family.replace(/\s+/g, "+");
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encoded}:wght@400;600;700&display=swap`;
    link.onload = resolve;
    link.onerror = resolve; // Resolve even on error so it doesn't block
    document.head.appendChild(link);
  });
}

/**
 * Preload all fonts (call on editor mount for instant font preview).
 */
export function preloadAllFonts() {
  const googleFonts = FONT_LIST
    .filter((f) => f.category !== "system")
    .map((f) => f.family.replace(/\s+/g, "+"))
    .join("&family=");

  if (!googleFonts) return;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${googleFonts}&display=swap`;
  document.head.appendChild(link);
  linkElement = link;

  // Mark all as loaded
  FONT_LIST.forEach((f) => loadedFonts.add(f.family));
}

/**
 * Check if a font is loaded.
 */
export function isFontLoaded(family) {
  return loadedFonts.has(family);
}
