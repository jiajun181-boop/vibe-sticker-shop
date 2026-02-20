// lib/sticker-page-content.js — Rich page content for sticker product pages

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lunarprint.ca";
const STICKER_CATEGORY = "stickers-labels-decals";

/**
 * Content map keyed by cutting type id.
 * Phase 1: die-cut only. Phase 2 will add kiss-cut, sheets, roll-labels, vinyl-lettering.
 */
export const STICKER_PAGE_CONTENT = {
  "die-cut": {
    seo: {
      title: "Custom Die-Cut Stickers | Waterproof Vinyl | La Lunar Printing",
      description:
        "Order custom die-cut stickers cut precisely to your design shape. Waterproof vinyl, UV-resistant, indoor/outdoor. Free proofs, fast shipping across Canada.",
      keywords: [
        "die-cut stickers",
        "custom stickers",
        "vinyl stickers",
        "waterproof stickers",
        "custom shape stickers",
        "sticker printing Canada",
        "Toronto sticker printing",
      ],
    },
    intro: {
      headline: "Custom Die-Cut Stickers",
      subtitle:
        "Precision-cut to the exact shape of your design — no extra border, no wasted space. Made with premium waterproof vinyl that lasts outdoors for 5+ years.",
    },
    highlights: [
      { icon: "scissors", text: "Cut to your exact shape" },
      { icon: "droplets", text: "Waterproof & UV-resistant" },
      { icon: "clock", text: "Ships in 3–5 business days" },
      { icon: "shield", text: "Free digital proof included" },
    ],
    tabs: {
      specifications: {
        label: "Specifications",
        rows: [
          { label: "Material", value: "Premium cast vinyl (3.4 mil)" },
          { label: "Adhesive", value: "Permanent, repositionable during first application" },
          { label: "Finish Options", value: "Gloss, Matte, Holographic, Clear, Reflective" },
          { label: "Durability", value: "5+ years outdoor, UV & water resistant" },
          { label: "Min Size", value: '0.5" × 0.5"' },
          { label: "Max Size", value: '53" × 53"' },
          { label: "Print Method", value: "Full-colour digital (CMYK), up to 1440 dpi" },
          { label: "White Ink", value: "Available for clear & holographic materials" },
          { label: "Bleed", value: "1/16\" (1.5 mm) recommended" },
          { label: "Turnaround", value: "3–5 business days (rush available)" },
        ],
      },
      howToUse: {
        label: "How to Use",
        content: [
          {
            heading: "Surface Preparation",
            text: "Clean the surface with isopropyl alcohol or soap and water. Ensure it's completely dry and free from dust, oil, or wax.",
          },
          {
            heading: "Peel & Apply",
            text: "Peel the backing paper at a 45° angle. Position the sticker and press firmly from the centre outward to eliminate air bubbles.",
          },
          {
            heading: "Smooth & Seal",
            text: "Use a credit card or squeegee to smooth the sticker. For curved surfaces, use a heat gun on low to help the vinyl conform.",
          },
          {
            heading: "Curing Time",
            text: "Allow 24–48 hours before exposing to water or extreme temperatures for maximum adhesion.",
          },
        ],
      },
      fileGuidelines: {
        label: "File Guidelines",
        content: [
          {
            heading: "Accepted Formats",
            text: "PDF (preferred), AI, EPS, SVG, PNG (300 dpi min), JPG (300 dpi min).",
          },
          {
            heading: "Colour Mode",
            text: "CMYK for best colour accuracy. RGB files will be auto-converted.",
          },
          {
            heading: "Resolution",
            text: "Minimum 300 DPI at actual print size. Vector files preferred for crisp edges.",
          },
          {
            heading: "Cut Line",
            text: "We auto-generate a die-cut contour from your artwork. You can also supply a custom cut path on a separate layer.",
          },
          {
            heading: "Bleed & Safe Zone",
            text: 'Extend artwork 1/16" (1.5 mm) beyond the cut line. Keep important elements 1/8" from the edge.',
          },
        ],
      },
      shipping: {
        label: "Shipping",
        content: [
          {
            heading: "Standard Shipping",
            text: "Free shipping on orders over $75. Standard delivery: 5–7 business days across Canada.",
          },
          {
            heading: "Express Shipping",
            text: "2–3 business day express available at checkout. Same-day dispatch for orders placed before 2 PM ET.",
          },
          {
            heading: "Rush Production",
            text: "Need it faster? Select rush turnaround (1–2 business days) during ordering for an additional fee.",
          },
          {
            heading: "Packaging",
            text: "Stickers ship flat in rigid mailers to prevent bending. Large orders ship in boxes.",
          },
        ],
      },
    },
    useCases: [
      {
        title: "Brand & Logo Stickers",
        description: "Add your brand to packaging, laptops, water bottles, and more.",
        image: null,
      },
      {
        title: "Product Labels",
        description: "Custom labels for cosmetics, candles, food packaging, and retail products.",
        image: null,
      },
      {
        title: "Event & Promo Giveaways",
        description: "Trade shows, festivals, and launch events — stickers are the perfect swag.",
        image: null,
      },
      {
        title: "Laptop & Car Decals",
        description: "Weather-proof vinyl that sticks to any smooth surface, indoors or out.",
        image: null,
      },
    ],
    faq: [
      {
        question: "What is a die-cut sticker?",
        answer:
          "A die-cut sticker is cut precisely around the shape of your design with no extra background material. Unlike square or rectangle stickers, die-cuts follow the contour of your artwork for a clean, professional look.",
      },
      {
        question: "Are your die-cut stickers waterproof?",
        answer:
          "Yes! Our standard vinyl material is fully waterproof, UV-resistant, and rated for 5+ years of outdoor use. Perfect for water bottles, cars, laptops, and outdoor signage.",
      },
      {
        question: "What's the minimum order quantity?",
        answer:
          "Our minimum order is just 25 stickers. We offer volume discounts starting at 100 pieces — the more you order, the lower the per-unit cost.",
      },
      {
        question: "How fast can I get my stickers?",
        answer:
          "Standard production is 3–5 business days. Rush production (1–2 business days) is available for an additional fee. Shipping typically adds 2–5 business days depending on your location in Canada.",
      },
      {
        question: "Do I need to provide a cut line?",
        answer:
          "No — we automatically generate a precise die-cut contour from your artwork. You'll see a preview before we print. If you prefer a custom cut path, you can include it as a separate layer in your file.",
      },
      {
        question: "Can I order custom sizes?",
        answer:
          'Absolutely. Enter any dimensions from 0.5" × 0.5" up to 53" × 53". We also offer popular preset sizes for quick ordering.',
      },
      {
        question: "What file formats do you accept?",
        answer:
          "We accept PDF (preferred), AI, EPS, SVG, PNG, and JPG files. For best results, submit vector artwork or raster images at 300 DPI minimum.",
      },
      {
        question: "Do you ship across Canada?",
        answer:
          "Yes, we ship to all provinces and territories. Free shipping on orders over $75. Express 2–3 day shipping is also available.",
      },
    ],
  },
};

/**
 * Comparison data across sticker types — shown on every sticker rich page.
 */
export const STICKER_COMPARISON_TABLE = {
  columns: [
    { id: "die-cut", label: "Die-Cut", slug: "die-cut-stickers" },
    { id: "kiss-cut", label: "Kiss-Cut", slug: "kiss-cut-stickers" },
    { id: "sheets", label: "Sticker Sheets", slug: "sticker-sheets" },
    { id: "roll-labels", label: "Roll Labels", slug: "roll-labels" },
    { id: "vinyl-lettering", label: "Vinyl Lettering", slug: "vinyl-lettering" },
  ],
  rows: [
    {
      label: "Cut Style",
      values: {
        "die-cut": "Cut to exact shape",
        "kiss-cut": "Cut through top layer only",
        sheets: "Multiple stickers per sheet",
        "roll-labels": "Continuous roll, peelable",
        "vinyl-lettering": "Individual letters/shapes",
      },
    },
    {
      label: "Best For",
      values: {
        "die-cut": "Brand stickers, decals, giveaways",
        "kiss-cut": "Easy peel & hand out",
        sheets: "Multi-design packs, planners",
        "roll-labels": "Product labels, packaging",
        "vinyl-lettering": "Signage, vehicles, storefronts",
      },
    },
    {
      label: "Materials",
      values: {
        "die-cut": "Vinyl, Matte, Clear, Holographic",
        "kiss-cut": "Vinyl, Matte, Clear",
        sheets: "Vinyl, Matte, Glossy Paper",
        "roll-labels": "BOPP, Kraft, Silver",
        "vinyl-lettering": "Outdoor, Indoor, Reflective",
      },
    },
    {
      label: "Waterproof",
      values: {
        "die-cut": "Yes",
        "kiss-cut": "Yes (vinyl)",
        sheets: "Depends on material",
        "roll-labels": "Yes (BOPP)",
        "vinyl-lettering": "Yes",
      },
    },
    {
      label: "Min Order",
      values: {
        "die-cut": "25 pcs",
        "kiss-cut": "25 pcs",
        sheets: "10 sheets",
        "roll-labels": "500 labels",
        "vinyl-lettering": "1 pc",
      },
    },
    {
      label: "Max Size",
      values: {
        "die-cut": '53" × 53"',
        "kiss-cut": '53" × 53"',
        sheets: '12" × 18"',
        "roll-labels": '12" × 18"',
        "vinyl-lettering": '53" × 53"',
      },
    },
  ],
};

/**
 * Slug → rich page mapping.
 * Returns { cuttingTypeId, content } if slug should render as a rich product page,
 * or null if it should use the default configurator.
 */
const RICH_PAGE_SLUG_MAP = {
  "die-cut-stickers": "die-cut",
  // Phase 2:
  // "kiss-cut-stickers": "kiss-cut",
  // "sticker-sheets": "sheets",
  // "roll-labels": "roll-labels",
  // "vinyl-lettering": "vinyl-lettering",
};

export function getStickerRichPageSlug(slug) {
  const cuttingTypeId = RICH_PAGE_SLUG_MAP[slug];
  if (!cuttingTypeId) return null;
  const content = STICKER_PAGE_CONTENT[cuttingTypeId];
  if (!content) return null;
  return { cuttingTypeId, content };
}
