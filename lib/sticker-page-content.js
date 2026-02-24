// lib/sticker-page-content.js — Rich page content for sticker product pages

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.lunarprint.ca";
const STICKER_CATEGORY = "stickers-labels-decals";

/**
 * Content map keyed by cutting type id.
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

  "kiss-cut": {
    seo: {
      title: "Custom Kiss-Cut Stickers | Easy Peel & Apply | La Lunar Printing",
      description:
        "Order custom kiss-cut stickers on backing paper for easy peeling. Waterproof vinyl, any shape, any size. Free proofs, fast shipping across Canada.",
      keywords: [
        "kiss-cut stickers",
        "custom stickers",
        "peel and stick",
        "vinyl stickers",
        "sticker printing Canada",
        "Toronto sticker printing",
      ],
    },
    intro: {
      headline: "Custom Kiss-Cut Stickers",
      subtitle:
        "Cut through the vinyl but not the backing — making them effortless to peel and hand out. Perfect for events, retail packaging, and brand giveaways.",
    },
    highlights: [
      { icon: "layers", text: "Easy peel from backing paper" },
      { icon: "droplets", text: "Waterproof & UV-resistant vinyl" },
      { icon: "clock", text: "Ships in 3–5 business days" },
      { icon: "shield", text: "Free digital proof included" },
    ],
    tabs: {
      specifications: {
        label: "Specifications",
        rows: [
          { label: "Material", value: "Premium cast vinyl (3.4 mil)" },
          { label: "Adhesive", value: "Permanent, repositionable during first application" },
          { label: "Finish Options", value: "Gloss, Matte, Clear" },
          { label: "Durability", value: "5+ years outdoor, UV & water resistant" },
          { label: "Min Size", value: '0.5" × 0.5"' },
          { label: "Max Size", value: '53" × 53"' },
          { label: "Print Method", value: "Full-colour digital (CMYK), up to 1440 dpi" },
          { label: "Backing", value: "White silicone-coated release liner" },
          { label: "Bleed", value: '1/16" (1.5 mm) recommended' },
          { label: "Turnaround", value: "3–5 business days (rush available)" },
        ],
      },
      howToUse: {
        label: "How to Use",
        content: [
          {
            heading: "Peel from Backing",
            text: "Bend the backing paper slightly to lift the sticker edge, then peel smoothly. The kiss-cut outline makes removal effortless.",
          },
          {
            heading: "Position & Apply",
            text: "Place the sticker on a clean, dry surface. Press firmly from the centre outward to eliminate air bubbles.",
          },
          {
            heading: "Smooth & Seal",
            text: "Use a credit card or squeegee for a perfectly smooth finish. For curved surfaces, use low heat to help the vinyl conform.",
          },
          {
            heading: "Curing Time",
            text: "Allow 24–48 hours before exposure to water or extreme temperatures for best adhesion.",
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
            text: "We auto-generate a kiss-cut contour around your artwork with a small margin. Custom cut paths can be supplied on a separate layer.",
          },
          {
            heading: "Bleed & Safe Zone",
            text: 'Extend artwork 1/16" (1.5 mm) beyond the cut line. Keep text and important elements 1/8" from the edge.',
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
        title: "Event Giveaways",
        description: "Hand out at trade shows, festivals, and meetups — easy to peel and stick anywhere.",
        image: null,
      },
      {
        title: "Packaging Inserts",
        description: "Include branded stickers in e-commerce orders for a personal touch.",
        image: null,
      },
      {
        title: "Retail & Merch",
        description: "Sell individually or in bundles at your store or pop-up shop.",
        image: null,
      },
      {
        title: "Brand Promotion",
        description: "Stick on laptops, water bottles, notebooks — free advertising wherever they go.",
        image: null,
      },
    ],
    faq: [
      {
        question: "What is a kiss-cut sticker?",
        answer:
          "A kiss-cut sticker is cut through the vinyl layer but not through the backing paper. This leaves each sticker on a square or rectangular piece of backing, making them very easy to peel and apply.",
      },
      {
        question: "Kiss-cut vs die-cut — what's the difference?",
        answer:
          "Die-cut stickers are cut all the way through both the vinyl and backing, following your design's shape. Kiss-cut stickers cut only the top vinyl layer, leaving the backing intact for easy handling and dispensing.",
      },
      {
        question: "Are kiss-cut stickers waterproof?",
        answer:
          "Yes! Our vinyl kiss-cut stickers are fully waterproof, UV-resistant, and rated for 5+ years of outdoor use.",
      },
      {
        question: "What's the minimum order quantity?",
        answer:
          "Our minimum order is 25 stickers. Volume discounts start at 100 pieces.",
      },
      {
        question: "Can I order custom sizes?",
        answer:
          'Yes — enter any dimensions from 0.5" × 0.5" up to 53" × 53" using the Custom size option in the configurator.',
      },
      {
        question: "How fast can I get my stickers?",
        answer:
          "Standard production is 3–5 business days. Rush production (1–2 business days) is available for an additional fee.",
      },
    ],
  },

  "sheets": {
    seo: {
      title: "Custom Sticker Sheets | Multi-Design Sheets | La Lunar Printing",
      description:
        "Order custom sticker sheets with multiple designs on one sheet. Perfect for planners, retail packs, and brand kits. Free proofs, fast shipping across Canada.",
      keywords: [
        "sticker sheets",
        "custom sticker sheets",
        "planner stickers",
        "sticker packs",
        "multi-design stickers",
        "sticker printing Canada",
      ],
    },
    intro: {
      headline: "Custom Sticker Sheets",
      subtitle:
        "Multiple sticker designs arranged on a single sheet — perfect for variety packs, planners, retail bundles, and brand kits. Kiss-cut for easy peeling.",
    },
    highlights: [
      { icon: "grid", text: "Multiple designs per sheet" },
      { icon: "layers", text: "Kiss-cut for easy peeling" },
      { icon: "clock", text: "Ships in 3–5 business days" },
      { icon: "shield", text: "Free digital proof included" },
    ],
    tabs: {
      specifications: {
        label: "Specifications",
        rows: [
          { label: "Material", value: "White vinyl, Matte vinyl, or Glossy paper" },
          { label: "Adhesive", value: "Permanent" },
          { label: "Finish Options", value: "Gloss, Matte, Glossy Paper" },
          { label: "Sheet Sizes", value: '4" × 6", 5" × 7", 8.5" × 11" (custom available)' },
          { label: "Min Size", value: '2" × 2"' },
          { label: "Max Size", value: '12" × 18"' },
          { label: "Print Method", value: "Full-colour digital (CMYK), up to 1440 dpi" },
          { label: "Cut Style", value: "Kiss-cut individual stickers on sheet" },
          { label: "Bleed", value: '1/16" (1.5 mm) recommended' },
          { label: "Turnaround", value: "3–5 business days (rush available)" },
        ],
      },
      howToUse: {
        label: "How to Use",
        content: [
          {
            heading: "Design Your Layout",
            text: "Upload your sheet design with multiple stickers arranged as you like, or send individual designs and we'll arrange them on the sheet for you.",
          },
          {
            heading: "Peel Individual Stickers",
            text: "Each sticker is kiss-cut on the sheet. Simply peel off whichever sticker you want to use.",
          },
          {
            heading: "Apply to Surface",
            text: "Press firmly on a clean, dry surface from the centre outward. Works on laptops, water bottles, notebooks, and more.",
          },
          {
            heading: "Storage",
            text: "Store sheets flat in a cool, dry place. The backing paper protects unused stickers until ready to use.",
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
            heading: "Full Sheet or Individual",
            text: "You can supply a complete sheet layout, or send individual sticker designs and we'll arrange them on the sheet.",
          },
          {
            heading: "Resolution",
            text: "Minimum 300 DPI at actual print size. Vector files preferred for crisp edges.",
          },
          {
            heading: "Cut Lines",
            text: "Include cut paths on a separate layer, or let us auto-generate kiss-cut contours for each sticker on the sheet.",
          },
          {
            heading: "Bleed & Safe Zone",
            text: 'Extend artwork 1/16" beyond cut lines. Keep 1/8" margin between stickers on the sheet.',
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
            text: "2–3 business day express available at checkout.",
          },
          {
            heading: "Rush Production",
            text: "Select rush turnaround (1–2 business days) during ordering for an additional fee.",
          },
          {
            heading: "Packaging",
            text: "Sheets ship flat in rigid mailers. Large orders ship in boxes with protective dividers.",
          },
        ],
      },
    },
    useCases: [
      {
        title: "Planner & Journal Stickers",
        description: "Decorative stickers for planners, bullet journals, and scrapbooks.",
        image: null,
      },
      {
        title: "Brand Sticker Packs",
        description: "Bundle multiple brand designs on one sheet for giveaways and retail.",
        image: null,
      },
      {
        title: "Kids & Education",
        description: "Reward stickers, classroom incentives, and activity sheets.",
        image: null,
      },
      {
        title: "Retail Product Bundles",
        description: "Curated sticker sets for merch shops, Etsy stores, and pop-up events.",
        image: null,
      },
    ],
    faq: [
      {
        question: "What is a sticker sheet?",
        answer:
          "A sticker sheet contains multiple sticker designs arranged on a single backing sheet. Each sticker is kiss-cut so you can peel them off individually.",
      },
      {
        question: "Can I put different designs on one sheet?",
        answer:
          "Yes! You can include as many different designs as you want on a single sheet. Upload a complete layout or send individual designs and we'll arrange them.",
      },
      {
        question: "What sheet sizes are available?",
        answer:
          'Standard sizes are 4" × 6", 5" × 7", and 8.5" × 11". Custom sheet sizes are available up to 12" × 18".',
      },
      {
        question: "What's the minimum order?",
        answer:
          "Minimum order is 10 sheets. Volume discounts start at 50 sheets.",
      },
      {
        question: "Can I order custom sheet sizes?",
        answer:
          'Yes — use the Custom size option to enter any dimensions up to 12" × 18".',
      },
      {
        question: "Are sticker sheets waterproof?",
        answer:
          "Vinyl and matte options are waterproof and UV-resistant. Glossy paper is best for indoor use only.",
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
  // Die-cut
  "die-cut-stickers": "die-cut",
  "stickers-die-cut-custom": "die-cut",
  "holographic-singles": "die-cut",
  "holographic-stickers": "die-cut",
  "foil-stickers": "die-cut",
  "clear-singles": "die-cut",
  "heavy-duty-vinyl-stickers": "die-cut",
  "stickers-color-on-white": "die-cut",
  "stickers-color-on-clear": "die-cut",
  "reflective-stickers": "die-cut",
  // Kiss-cut
  "kiss-cut-stickers": "kiss-cut",
  "removable-stickers": "kiss-cut",
  // Sheets (sticker pages)
  "sticker-sheets": "sheets",
  "kiss-cut-sticker-sheets": "sheets",
  "stickers-multi-on-sheet": "sheets",
  "sticker-packs": "sheets",
};

export function getStickerRichPageSlug(slug) {
  const cuttingTypeId = RICH_PAGE_SLUG_MAP[slug];
  if (!cuttingTypeId) return null;
  const content = STICKER_PAGE_CONTENT[cuttingTypeId];
  if (!content) return null;
  return { cuttingTypeId, content };
}
