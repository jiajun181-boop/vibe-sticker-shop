// lib/sign-page-content.js — Rich page content for sign product pages

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lunarprint.ca";
const SIGN_CATEGORY = "signs-rigid-boards";

/**
 * Content map keyed by sign type id.
 * Phase 1: real-estate-signs only.
 */
export const SIGN_PAGE_CONTENT = {
  "real-estate-signs": {
    seo: {
      title: "Custom Real Estate Signs | Coroplast & Aluminum | La Lunar Printing",
      description:
        "Order custom real estate signs — For Sale, Sold, Open House & more. Durable 4mm Coroplast or .040 Aluminum, double-sided printing, H-stakes & frames available. Fast shipping across Canada.",
      keywords: [
        "real estate signs",
        "for sale signs",
        "open house signs",
        "realtor signs",
        "coroplast signs",
        "real estate sign printing Canada",
        "yard signs for realtors",
        "custom real estate signs",
      ],
    },
    intro: {
      headline: "Custom Real Estate Signs",
      subtitle:
        "Professional-grade signs for realtors and property managers. Printed on durable 4mm Coroplast or .040 Aluminum with full-colour, double-sided printing. Pair with H-stakes, metal frames, or rider clips for a complete listing setup.",
    },
    highlights: [
      { icon: "sign", text: "Double-sided printing" },
      { icon: "shield", text: "Weather-resistant materials" },
      { icon: "clock", text: "Ships in 3\u20135 business days" },
      { icon: "check", text: "H-stakes & frames available" },
    ],
    tabs: {
      specifications: {
        label: "Specifications",
        rows: [
          { label: "Materials", value: "4mm Coroplast (lightweight) or .040 Aluminum (rigid, premium)" },
          { label: "Printing", value: "Full-colour digital (CMYK), single or double-sided" },
          { label: "Standard Sizes", value: '18" \u00d7 24", 24" \u00d7 18" (landscape), 24" \u00d7 36"' },
          { label: "Rider Sizes", value: '6" \u00d7 24" strip, 12" \u00d7 18" panel' },
          { label: "Shape Options", value: "Rectangle, rounded corners, arrow, custom die-cut" },
          { label: "Durability", value: "Coroplast: 1\u20132 years outdoor | Aluminum: 5+ years outdoor" },
          { label: "Finish", value: "UV-coated for fade resistance" },
          { label: "Turnaround", value: "3\u20135 business days (rush available)" },
        ],
      },
      signTypes: {
        label: "Sign Types",
        content: [
          {
            heading: "For Sale Signs",
            text: "The classic listing sign. Available in standard 18\u00d724 or large 24\u00d736 formats. Double-sided for maximum street visibility.",
          },
          {
            heading: "Sold / Conditional Signs",
            text: "Celebrate closings with branded Sold overlays or conditional status signs. Available as full signs or rider strips.",
          },
          {
            heading: "Open House Signs",
            text: "Directional arrow signs and A-frame inserts to guide visitors. Bright colours and bold text for high visibility.",
          },
          {
            heading: "Rider Signs",
            text: 'Small 6"\u00d724" or 12"\u00d718" panels that attach above or below the main sign. Perfect for agent info, phone numbers, or "Just Listed" messaging.',
          },
          {
            heading: "Commercial / Land Signs",
            text: "Larger format signs for commercial properties, vacant land, and development sites. Available in aluminum for long-term outdoor use.",
          },
        ],
      },
      installation: {
        label: "Installation",
        content: [
          {
            heading: "H-Stake Installation",
            text: "Slide the corrugated sign onto the H-stake prongs. Push the stake into the ground at a slight angle for stability. Best for lawns and soft ground.",
          },
          {
            heading: "Metal Frame Setup",
            text: "Insert the sign into the metal frame channel. The frame provides a professional look and keeps the sign rigid. Secure the frame into the ground with the attached legs.",
          },
          {
            heading: "Rider Clip Attachment",
            text: "Attach rider clips to the top or bottom of your main sign frame. Slide the rider panel into the clips. Great for adding agent info or status updates.",
          },
          {
            heading: "Post Mounting",
            text: "For permanent installations, we can add pre-drilled holes for post mounting. Use standard 4\u00d74 wooden posts or metal sign posts.",
          },
        ],
      },
      shipping: {
        label: "Shipping",
        content: [
          {
            heading: "Standard Shipping",
            text: "Free shipping on orders over $75. Standard delivery: 5\u20137 business days across Canada.",
          },
          {
            heading: "Express Shipping",
            text: "2\u20133 business day express available at checkout. Same-day dispatch for orders placed before 2 PM ET.",
          },
          {
            heading: "Rush Production",
            text: "Need signs for a listing this week? Select rush turnaround (1\u20132 business days) during ordering.",
          },
          {
            heading: "Packaging",
            text: "Signs ship flat in reinforced cardboard to prevent bending. Stakes and frames ship separately.",
          },
        ],
      },
    },
    useCases: [
      {
        title: "Residential Listings",
        description: "For Sale, Sold, and Open House signs with your branding and contact info.",
        image: null,
      },
      {
        title: "Commercial Properties",
        description: "Large-format aluminum signs for retail, office, and industrial property listings.",
        image: null,
      },
      {
        title: "Open House Directionals",
        description: "Arrow-shaped directional signs to guide visitors from main roads to the property.",
        image: null,
      },
      {
        title: "Agent Branding",
        description: "Consistent branded signage across all your listings with rider panels for quick updates.",
        image: null,
      },
    ],
    faq: [
      {
        question: "What material should I choose for my real estate sign?",
        answer:
          "For temporary listings (under 2 years), 4mm Coroplast is the most popular and cost-effective choice. It\u2019s lightweight, weather-resistant, and works perfectly with H-stakes. For permanent or long-term signage, .040 Aluminum is more durable and provides a premium, rigid feel that lasts 5+ years outdoors.",
      },
      {
        question: "Can I get double-sided printing?",
        answer:
          "Yes! Double-sided printing is available on both Coroplast and Aluminum signs. This ensures your sign is visible from both directions \u2014 essential for street-facing real estate signs.",
      },
      {
        question: "What sizes are available for real estate signs?",
        answer:
          'Our standard sizes are 18"\u00d724" (most popular), 24"\u00d718" (landscape), and 24"\u00d736" (large). We also offer rider sizes: 6"\u00d724" strips and 12"\u00d718" panels. Custom sizes are available on request.',
      },
      {
        question: "Do you sell H-stakes and sign frames?",
        answer:
          "Yes, we offer H-stakes ($1.50/ea), metal sign frames ($12.00/ea), and rider clips ($1.50/ea) as add-on accessories. You can add them directly in the configurator when ordering your signs.",
      },
      {
        question: "How quickly can I get my signs?",
        answer:
          "Standard production is 3\u20135 business days. Rush production (1\u20132 business days) is available for an additional fee. Shipping adds 2\u20137 business days depending on your location in Canada.",
      },
      {
        question: "Can I order just one sign?",
        answer:
          "Absolutely! Our minimum order is just 1 sign. We also offer volume discounts starting at 5 signs \u2014 perfect for agents with multiple active listings.",
      },
      {
        question: "What file format should I send for my sign design?",
        answer:
          "We accept PDF (preferred), AI, EPS, SVG, PNG, and JPG files. For best results, submit vector artwork or raster images at 300 DPI minimum at actual print size. We include a free digital proof before printing.",
      },
      {
        question: "Do you offer design services for real estate signs?",
        answer:
          "Not currently \u2014 please supply print-ready artwork. However, we provide a free digital proof and will flag any issues before printing. Most realtors work with a graphic designer or use their brokerage\u2019s templates.",
      },
    ],
  },
};

/**
 * Comparison data across sign types — shown on every sign rich page.
 */
export const SIGN_COMPARISON_TABLE = {
  columns: [
    { id: "real-estate", label: "Real Estate", slug: "real-estate-signs" },
    { id: "yard-sign", label: "Yard Signs", slug: "yard-lawn-signs" },
    { id: "event-board", label: "Photo Boards", slug: "event-photo-boards" },
    { id: "aluminum-sign", label: "Aluminum", slug: "by-material" },
    { id: "foam-board", label: "Foam Board", slug: "by-material" },
  ],
  rows: [
    {
      label: "Material",
      values: {
        "real-estate": "Coroplast / Aluminum",
        "yard-sign": "4mm\u20136mm Coroplast",
        "event-board": 'Foam Board / Gatorboard',
        "aluminum-sign": ".040\u2013.063 Aluminum / ACM",
        "foam-board": '3/16"\u20131/2" Foam Board',
      },
    },
    {
      label: "Best For",
      values: {
        "real-estate": "Property listings, realtor branding",
        "yard-sign": "Events, elections, promotions",
        "event-board": "Weddings, parties, photo ops",
        "aluminum-sign": "Permanent business & safety signage",
        "foam-board": "Indoor displays, presentations",
      },
    },
    {
      label: "Double-Sided",
      values: {
        "real-estate": "Yes",
        "yard-sign": "Yes",
        "event-board": "No",
        "aluminum-sign": "No",
        "foam-board": "No",
      },
    },
    {
      label: "Durability",
      values: {
        "real-estate": "1\u20135+ years (material dependent)",
        "yard-sign": "1\u20132 years outdoor",
        "event-board": "Indoor / short-term outdoor",
        "aluminum-sign": "5+ years outdoor",
        "foam-board": "Indoor only",
      },
    },
    {
      label: "Accessories",
      values: {
        "real-estate": "H-stakes, frames, riders",
        "yard-sign": "H-stakes, wire stakes",
        "event-board": "Easel backs",
        "aluminum-sign": "Standoffs, drilled holes",
        "foam-board": "Easel backs, standoffs",
      },
    },
    {
      label: "Min Order",
      values: {
        "real-estate": "1 sign",
        "yard-sign": "1 sign",
        "event-board": "1 board",
        "aluminum-sign": "1 sign",
        "foam-board": "1 board",
      },
    },
  ],
};

/**
 * Slug \u2192 rich page mapping for signs.
 * Returns { signTypeId, content } if slug should render as a rich product page,
 * or null if it should use the default configurator.
 */
const RICH_PAGE_SLUG_MAP = {
  "real-estate-signs": "real-estate-signs",
  // Phase 2+:
  // "yard-lawn-signs": "yard-signs",
  // "event-photo-boards": "photo-boards",
};

export function getSignRichPageSlug(slug) {
  const signTypeId = RICH_PAGE_SLUG_MAP[slug];
  if (!signTypeId) return null;
  const content = SIGN_PAGE_CONTENT[signTypeId];
  if (!content) return null;
  return { signTypeId, content };
}
