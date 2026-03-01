// lib/design-studio/templates.js — Fabric.js format design templates
// Each template = canvas.toJSON() format. Dimensions match product-configs.js (with bleed).

// Helper: calculate canvas pixel dimensions (same as getCanvasDimensions)
function px(widthIn, heightIn, dpi, bleedIn = 0.125) {
  return {
    w: Math.round((widthIn + bleedIn * 2) * dpi),
    h: Math.round((heightIn + bleedIn * 2) * dpi),
    b: Math.round(bleedIn * dpi), // bleed px
  };
}

// Helper: centered textbox
function cText(cx, y, text, size, opts = {}) {
  return {
    type: "Textbox",
    left: cx, top: y, width: opts.width || 500,
    text, fontSize: size,
    fontFamily: opts.font || "Helvetica",
    fontWeight: opts.bold ? "bold" : "normal",
    fill: opts.color || "#000000",
    textAlign: "center", originX: "center",
    ...(opts.extra || {}),
    id: opts.id || `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  };
}

function lText(x, y, text, size, opts = {}) {
  return {
    type: "Textbox",
    left: x, top: y, width: opts.width || 500,
    text, fontSize: size,
    fontFamily: opts.font || "Helvetica",
    fontWeight: opts.bold ? "bold" : "normal",
    fill: opts.color || "#000000",
    id: opts.id || `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  };
}

function rect(x, y, w, h, fill, id) {
  return { type: "Rect", left: x, top: y, width: w, height: h, fill, id };
}

// ═══════════════════════════════════════════════════════════════
// TEMPLATE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

const DESIGN_TEMPLATES = [

  // ──────────────────────────────────────────
  // BUSINESS CARDS (3.5×2 @300 = 1125×675)
  // ──────────────────────────────────────────
  {
    id: "bc-modern-dark", name: "Modern Dark",
    category: "business-cards", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#111111", objects: [
      lText(97, 200, "Your Name", 48, { bold: true, color: "#ffffff", id: "name" }),
      lText(97, 260, "Job Title", 24, { color: "#999999", id: "title" }),
      lText(97, 440, "email@company.com", 20, { color: "#cccccc", id: "email" }),
      lText(97, 480, "(416) 555-0123", 20, { color: "#cccccc", id: "phone" }),
      rect(0, 555, 1125, 120, "#e53e3e", "footer"),
    ]},
  },
  {
    id: "bc-classic-white", name: "Classic White",
    category: "business-cards", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#ffffff", objects: [
      cText(562, 220, "Your Name", 42, { font: "Georgia", bold: true, color: "#111111", id: "name" }),
      cText(562, 280, "Job Title | Company", 22, { font: "Georgia", color: "#666666", id: "title" }),
      { type: "Line", x1: -150, y1: 0, x2: 150, y2: 0, left: 562, top: 340, stroke: "#cccccc", strokeWidth: 1, originX: "center", id: "divider" },
      cText(562, 380, "email@company.com | (416) 555-0123", 18, { font: "Georgia", color: "#888888", id: "contact" }),
    ]},
  },
  {
    id: "bc-minimal-left", name: "Minimal Left",
    category: "business-cards", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#fafafa", objects: [
      rect(0, 0, 10, 675, "#2563eb", "accent"),
      lText(87, 220, "Your Name", 38, { bold: true, color: "#111111", id: "name" }),
      lText(87, 272, "Job Title", 20, { color: "#666666", id: "title" }),
      lText(87, 440, "email@company.com", 18, { color: "#444444", id: "email" }),
      lText(87, 475, "(416) 555-0123", 18, { color: "#444444", id: "phone" }),
    ]},
  },
  {
    id: "bc-bold-gradient", name: "Bold Gradient",
    category: "business-cards", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#764ba2", objects: [
      rect(0, 0, 1125, 675, "#764ba2", "bg"),
      cText(562, 240, "YOUR NAME", 44, { bold: true, color: "#ffffff", id: "name", extra: { charSpacing: 200 } }),
      cText(562, 310, "Creative Director", 22, { color: "rgba(255,255,255,0.8)", id: "title" }),
      cText(562, 440, "hello@example.com", 18, { color: "rgba(255,255,255,0.7)", id: "email" }),
    ]},
  },

  // ──────────────────────────────────────────
  // POSTCARDS (6×4 @300 = 1875×1275)
  // ──────────────────────────────────────────
  {
    id: "pc-promo", name: "Promotion",
    category: "postcards", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#ffffff", objects: [
      rect(0, 0, 1875, 500, "#1e40af", "header"),
      cText(937, 180, "SPECIAL OFFER", 72, { bold: true, color: "#ffffff", id: "headline", width: 1600 }),
      cText(937, 300, "Limited Time Only", 36, { color: "rgba(255,255,255,0.8)", id: "sub", width: 1200 }),
      cText(937, 650, "Visit us today and save big on all products.\nUse code SAVE20 at checkout.", 28, { color: "#333333", id: "body", width: 1500 }),
      cText(937, 1050, "www.example.com | (416) 555-0123", 24, { color: "#666666", id: "contact", width: 1400 }),
    ]},
  },
  {
    id: "pc-event", name: "Event Invite",
    category: "postcards", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#fef3c7", objects: [
      cText(937, 200, "You're Invited!", 64, { font: "Georgia", bold: true, color: "#92400e", id: "headline", width: 1600 }),
      rect(737, 310, 400, 4, "#d97706", "accent"),
      cText(937, 400, "Saturday, March 15 at 7 PM", 32, { color: "#78350f", id: "date", width: 1400 }),
      cText(937, 550, "Join us for an evening of celebration.\nFood, drinks, and great company.", 26, { color: "#92400e", id: "body", width: 1400 }),
      cText(937, 1050, "123 Event Venue, Toronto", 22, { color: "#a16207", id: "venue", width: 1400 }),
    ]},
  },

  // ──────────────────────────────────────────
  // FLYERS (8.5×11 @300 = 2625×3375)
  // ──────────────────────────────────────────
  {
    id: "flyer-event", name: "Event Flyer",
    category: "flyers", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#1a1a2e", objects: [
      cText(1312, 300, "EVENT NAME", 120, { bold: true, color: "#ffffff", id: "headline", width: 2200, extra: { charSpacing: 100 } }),
      cText(1312, 500, "Saturday, March 15, 2026 | 7:00 PM", 48, { color: "#e94560", id: "date", width: 2000 }),
      rect(812, 600, 1000, 4, "#e94560", "divider"),
      cText(1312, 660, "Join us for an unforgettable evening of\nmusic, art, and entertainment.", 36, { color: "rgba(255,255,255,0.8)", id: "desc", width: 2000 }),
      cText(1312, 2800, "123 Event Venue, Toronto ON", 36, { color: "rgba(255,255,255,0.6)", id: "venue", width: 2000 }),
      cText(1312, 2900, "www.example.com", 32, { color: "#e94560", id: "web", width: 1600 }),
    ]},
  },
  {
    id: "flyer-sale", name: "Sale Flyer",
    category: "flyers", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#ffffff", objects: [
      rect(0, 0, 2625, 600, "#dc2626", "header"),
      cText(1312, 150, "BIG SALE", 160, { bold: true, color: "#ffffff", id: "headline", width: 2200 }),
      cText(1312, 400, "UP TO 50% OFF EVERYTHING", 48, { bold: true, color: "#ffffff", id: "sub", width: 2000 }),
      cText(1312, 800, "Limited time offer. Visit our store or shop\nonline for incredible deals.", 36, { color: "#333333", id: "body", width: 2000 }),
      cText(1312, 2800, "Store Name | 123 Main St, Toronto", 32, { color: "#666666", id: "addr", width: 2000 }),
    ]},
  },
  {
    id: "flyer-minimal", name: "Minimal Clean",
    category: "flyers", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#f8f9fa", objects: [
      rect(100, 100, 2425, 3175, "#ffffff", "bg"),
      lText(250, 350, "Your Headline Here", 80, { font: "Georgia", bold: true, color: "#1a1a1a", id: "headline", width: 2000 }),
      rect(250, 480, 200, 6, "#2563eb", "accent"),
      lText(250, 550, "Add your description text here. This template works great for\nprofessional services and informational flyers.", 32, { color: "#4b5563", id: "body", width: 2000 }),
      lText(250, 2800, "Contact: info@example.com | (416) 555-0123", 28, { color: "#9ca3af", id: "contact", width: 2000 }),
    ]},
  },
  {
    id: "flyer-bold", name: "Bold Color",
    category: "flyers", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#0f172a", objects: [
      rect(0, 0, 2625, 1200, "#6366f1", "top"),
      cText(1312, 350, "BOLD\nSTATEMENT", 140, { bold: true, color: "#ffffff", id: "headline", width: 2200, extra: { lineHeight: 1.1 } }),
      cText(1312, 1400, "Your compelling message goes here.\nMake it count with bold typography.", 40, { color: "rgba(255,255,255,0.7)", id: "body", width: 2000 }),
      cText(1312, 2900, "www.yoursite.com", 36, { bold: true, color: "#6366f1", id: "web", width: 1600 }),
    ]},
  },

  // ──────────────────────────────────────────
  // POSTERS (18×24 @150 = 2775×3675)
  // ──────────────────────────────────────────
  {
    id: "poster-concert", name: "Concert Poster",
    category: "posters", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#0a0a0a", objects: [
      cText(1387, 400, "ARTIST NAME", 140, { bold: true, color: "#ffffff", id: "artist", width: 2400, extra: { charSpacing: 200 } }),
      cText(1387, 650, "LIVE IN CONCERT", 60, { color: "#ef4444", id: "sub", width: 2000 }),
      rect(887, 780, 1000, 3, "#ef4444", "line"),
      cText(1387, 900, "MARCH 15, 2026", 50, { color: "rgba(255,255,255,0.8)", id: "date", width: 2000 }),
      cText(1387, 1000, "Venue Name, Toronto", 36, { color: "rgba(255,255,255,0.5)", id: "venue", width: 2000 }),
      cText(1387, 3200, "TICKETS ON SALE NOW", 40, { bold: true, color: "#ef4444", id: "cta", width: 2000 }),
    ]},
  },
  {
    id: "poster-minimal", name: "Minimal Poster",
    category: "posters", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#ffffff", objects: [
      lText(150, 300, "Headline\nGoes Here", 120, { bold: true, color: "#111111", id: "headline", width: 2000, extra: { lineHeight: 1.1 } }),
      rect(150, 600, 300, 8, "#000000", "accent"),
      lText(150, 700, "Supporting text that describes\nthe event or message in detail.", 40, { color: "#555555", id: "body", width: 2000 }),
      lText(150, 3200, "www.example.com", 32, { color: "#999999", id: "web", width: 1500 }),
    ]},
  },

  // ──────────────────────────────────────────
  // RACK CARDS (4×9 @300 = 1275×2775)
  // ──────────────────────────────────────────
  {
    id: "rc-service", name: "Service Card",
    category: "rack-cards", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#ffffff", objects: [
      rect(0, 0, 1275, 600, "#1e3a5f", "header"),
      cText(637, 200, "YOUR\nBUSINESS", 64, { bold: true, color: "#ffffff", id: "name", width: 1000, extra: { lineHeight: 1.1 } }),
      cText(637, 420, "Professional Services", 28, { color: "rgba(255,255,255,0.8)", id: "tagline", width: 900 }),
      lText(100, 750, "Our Services", 36, { bold: true, color: "#1e3a5f", id: "heading", width: 1000 }),
      lText(100, 830, "• Service One\n• Service Two\n• Service Three\n• Service Four", 24, { color: "#444444", id: "list", width: 1000 }),
      cText(637, 2450, "Call us today!", 32, { bold: true, color: "#1e3a5f", id: "cta", width: 1000 }),
      cText(637, 2530, "(416) 555-0123", 28, { color: "#333333", id: "phone", width: 1000 }),
      cText(637, 2600, "www.example.com", 22, { color: "#888888", id: "web", width: 1000 }),
    ]},
  },
  {
    id: "rc-promo", name: "Promo Card",
    category: "rack-cards", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#fef2f2", objects: [
      cText(637, 250, "50%\nOFF", 120, { bold: true, color: "#dc2626", id: "discount", width: 1000, extra: { lineHeight: 1 } }),
      cText(637, 550, "YOUR FIRST ORDER", 32, { bold: true, color: "#991b1b", id: "sub", width: 1000 }),
      rect(337, 640, 600, 3, "#dc2626", "line"),
      cText(637, 730, "Use promo code\nFIRST50", 28, { color: "#444444", id: "code", width: 1000 }),
      cText(637, 2500, "www.example.com", 26, { bold: true, color: "#dc2626", id: "web", width: 1000 }),
    ]},
  },

  // ──────────────────────────────────────────
  // DOOR HANGERS (4.25×11 @300 = 1350×3375)
  // ──────────────────────────────────────────
  {
    id: "dh-service", name: "Service Hanger",
    category: "door-hangers", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#ffffff", objects: [
      rect(0, 0, 1350, 700, "#059669", "header"),
      cText(675, 250, "LAWN CARE\nSERVICES", 56, { bold: true, color: "#ffffff", id: "title", width: 1100, extra: { lineHeight: 1.1 } }),
      cText(675, 500, "Professional & Affordable", 26, { color: "rgba(255,255,255,0.8)", id: "sub", width: 1000 }),
      lText(120, 850, "Free Estimates!", 40, { bold: true, color: "#059669", id: "cta", width: 1100 }),
      lText(120, 940, "• Mowing & Trimming\n• Fertilizing\n• Spring/Fall Cleanup\n• Snow Removal", 26, { color: "#333333", id: "list", width: 1100 }),
      cText(675, 2900, "(416) 555-0123", 36, { bold: true, color: "#059669", id: "phone", width: 1100 }),
      cText(675, 3000, "www.example.com", 24, { color: "#666666", id: "web", width: 1000 }),
    ]},
  },

  // ──────────────────────────────────────────
  // BOOKMARKS (2×6 @300 = 675×1875)
  // ──────────────────────────────────────────
  {
    id: "bm-reading", name: "Book Lover",
    category: "bookmarks", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#1e293b", objects: [
      cText(337, 400, "READ\nMORE\nBOOKS", 52, { bold: true, color: "#ffffff", id: "title", width: 500, extra: { lineHeight: 1.15 } }),
      rect(237, 680, 200, 3, "#f59e0b", "accent"),
      cText(337, 750, "One page\nat a time", 24, { font: "Georgia", color: "rgba(255,255,255,0.6)", id: "sub", width: 500 }),
      cText(337, 1600, "lunarprint.ca", 16, { color: "rgba(255,255,255,0.3)", id: "brand", width: 400 }),
    ]},
  },
  {
    id: "bm-floral", name: "Floral",
    category: "bookmarks", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#fdf2f8", objects: [
      cText(337, 500, "Keep\nReading", 48, { font: "Georgia", bold: true, color: "#831843", id: "title", width: 500, extra: { lineHeight: 1.2 } }),
      rect(237, 700, 200, 2, "#ec4899", "accent"),
      cText(337, 780, "This page\nmarked with love", 20, { font: "Georgia", color: "#9d174d", id: "sub", width: 500 }),
    ]},
  },

  // ──────────────────────────────────────────
  // MENUS (8.5×11 @300 = 2625×3375)
  // ──────────────────────────────────────────
  {
    id: "menu-restaurant", name: "Restaurant Menu",
    category: "menus", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#1a1a1a", objects: [
      cText(1312, 200, "RESTAURANT NAME", 60, { bold: true, color: "#d4af37", id: "name", width: 2200, extra: { charSpacing: 200 } }),
      rect(912, 310, 800, 2, "#d4af37", "line1"),
      cText(1312, 400, "MENU", 40, { color: "#d4af37", id: "label", width: 1000, extra: { charSpacing: 400 } }),
      lText(200, 600, "APPETIZERS", 28, { bold: true, color: "#d4af37", id: "cat1", width: 1000 }),
      lText(200, 660, "Bruschetta ........................... $12\nCalamari .............................. $14\nSoup of the Day ................... $10", 22, { color: "#cccccc", id: "items1", width: 2200 }),
      lText(200, 1000, "MAINS", 28, { bold: true, color: "#d4af37", id: "cat2", width: 1000 }),
      lText(200, 1060, "Grilled Salmon ..................... $28\nRib-Eye Steak ...................... $36\nChicken Parmigiana ............. $24", 22, { color: "#cccccc", id: "items2", width: 2200 }),
      lText(200, 1400, "DESSERTS", 28, { bold: true, color: "#d4af37", id: "cat3", width: 1000 }),
      lText(200, 1460, "Tiramisu ............................... $12\nCheesecake .......................... $11", 22, { color: "#cccccc", id: "items3", width: 2200 }),
    ]},
  },
  {
    id: "menu-cafe", name: "Cafe Menu",
    category: "menus", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#faf5f0", objects: [
      cText(1312, 200, "THE DAILY GRIND", 56, { font: "Georgia", bold: true, color: "#44403c", id: "name", width: 2200 }),
      cText(1312, 300, "Coffee & Pastries", 28, { font: "Georgia", color: "#78716c", id: "sub", width: 1500 }),
      rect(1012, 370, 600, 2, "#a8a29e", "line"),
      lText(200, 500, "COFFEE", 30, { bold: true, color: "#44403c", id: "cat1", width: 1000 }),
      lText(200, 560, "Espresso .............. $3.50\nLatte .................... $5.00\nCappuccino .......... $5.00\nPour Over ............ $4.50", 24, { color: "#57534e", id: "items1", width: 2200 }),
      lText(200, 900, "PASTRIES", 30, { bold: true, color: "#44403c", id: "cat2", width: 1000 }),
      lText(200, 960, "Croissant ............. $4.00\nMuffin .................. $3.50\nScone .................. $4.00", 24, { color: "#57534e", id: "items2", width: 2200 }),
    ]},
  },

  // ──────────────────────────────────────────
  // TABLE TENTS (4×6 @300 = 1275×1875)
  // ──────────────────────────────────────────
  {
    id: "tt-special", name: "Daily Special",
    category: "table-tents", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#ffffff", objects: [
      rect(0, 0, 1275, 400, "#dc2626", "header"),
      cText(637, 150, "TODAY'S\nSPECIAL", 56, { bold: true, color: "#ffffff", id: "title", width: 1000, extra: { lineHeight: 1.1 } }),
      cText(637, 600, "Grilled Salmon\nwith seasonal vegetables", 36, { font: "Georgia", color: "#333333", id: "item", width: 1000 }),
      cText(637, 900, "$24.99", 64, { bold: true, color: "#dc2626", id: "price", width: 800 }),
      cText(637, 1500, "Ask your server for details", 20, { color: "#999999", id: "note", width: 1000 }),
    ]},
  },

  // ──────────────────────────────────────────
  // GREETING CARDS (5×7 @300 = 1575×2175)
  // ──────────────────────────────────────────
  {
    id: "gc-birthday", name: "Birthday",
    category: "greeting-cards", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#eff6ff", objects: [
      cText(787, 500, "Happy\nBirthday!", 80, { font: "Georgia", bold: true, color: "#1e40af", id: "title", width: 1200, extra: { lineHeight: 1.15 } }),
      rect(487, 750, 600, 4, "#3b82f6", "accent"),
      cText(787, 850, "Wishing you a wonderful\nday filled with joy!", 32, { font: "Georgia", color: "#3b82f6", id: "msg", width: 1200 }),
    ]},
  },
  {
    id: "gc-thankyou", name: "Thank You",
    category: "greeting-cards", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#fefce8", objects: [
      cText(787, 600, "Thank You", 72, { font: "Georgia", bold: true, color: "#854d0e", id: "title", width: 1200 }),
      rect(537, 720, 500, 3, "#ca8a04", "line"),
      cText(787, 820, "Your kindness means\nthe world to us.", 28, { font: "Georgia", color: "#a16207", id: "msg", width: 1200 }),
    ]},
  },

  // ──────────────────────────────────────────
  // INVITATION CARDS (5×7 @300 = 1575×2175)
  // ──────────────────────────────────────────
  {
    id: "inv-elegant", name: "Elegant Invitation",
    category: "invitation-cards", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#ffffff", objects: [
      rect(60, 60, 1455, 2055, "transparent", "border", ),
      cText(787, 300, "You Are\nCordially Invited", 48, { font: "Georgia", color: "#333333", id: "title", width: 1200, extra: { lineHeight: 1.3 } }),
      rect(537, 500, 500, 2, "#d4af37", "accent"),
      cText(787, 600, "Event Name", 40, { font: "Georgia", bold: true, color: "#111111", id: "event", width: 1200 }),
      cText(787, 800, "Saturday, March 15, 2026\nat 6:00 PM", 26, { font: "Georgia", color: "#666666", id: "date", width: 1200 }),
      cText(787, 1050, "Venue Name\n123 Main Street, Toronto", 24, { font: "Georgia", color: "#888888", id: "venue", width: 1200 }),
      cText(787, 1700, "RSVP by March 1\ninfo@example.com", 22, { color: "#999999", id: "rsvp", width: 1200 }),
    ]},
  },

  // ──────────────────────────────────────────
  // LOYALTY CARDS (3.5×2 @300 = 1125×675)
  // ──────────────────────────────────────────
  {
    id: "lc-punch", name: "Punch Card",
    category: "loyalty-cards", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#1e293b", objects: [
      lText(80, 60, "COFFEE SHOP", 28, { bold: true, color: "#ffffff", id: "name", width: 500 }),
      lText(80, 100, "Loyalty Card", 16, { color: "rgba(255,255,255,0.6)", id: "sub", width: 400 }),
      cText(562, 350, "☐  ☐  ☐  ☐  ☐\n☐  ☐  ☐  ☐  ☐", 40, { color: "#f59e0b", id: "stamps", width: 900, extra: { lineHeight: 1.8 } }),
      cText(562, 600, "10th drink FREE!", 18, { bold: true, color: "#f59e0b", id: "reward", width: 800 }),
    ]},
  },

  // ──────────────────────────────────────────
  // TICKETS (5.5×2 @300 = 1725×675)
  // ──────────────────────────────────────────
  {
    id: "ticket-event", name: "Event Ticket",
    category: "tickets", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#111827", objects: [
      lText(80, 100, "EVENT NAME", 40, { bold: true, color: "#ffffff", id: "event", width: 800 }),
      lText(80, 170, "March 15, 2026 • 7:00 PM", 20, { color: "#9ca3af", id: "date", width: 800 }),
      lText(80, 350, "Venue Name", 22, { color: "#d1d5db", id: "venue", width: 600 }),
      lText(80, 390, "Toronto, ON", 18, { color: "#9ca3af", id: "city", width: 600 }),
      rect(1200, 0, 3, 675, "rgba(255,255,255,0.2)", "divider"),
      cText(1450, 200, "ADMIT\nONE", 36, { bold: true, color: "#f59e0b", id: "admit", width: 400, extra: { lineHeight: 1.2 } }),
      cText(1450, 450, "#0001", 20, { color: "#6b7280", id: "num", width: 300 }),
    ]},
  },

  // ──────────────────────────────────────────
  // TAGS (2×3.5 @300 = 675×1125)
  // ──────────────────────────────────────────
  {
    id: "tag-product", name: "Product Tag",
    category: "tags", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#ffffff", objects: [
      cText(337, 250, "BRAND", 32, { bold: true, color: "#111111", id: "brand", width: 500, extra: { charSpacing: 200 } }),
      rect(187, 310, 300, 2, "#000000", "line"),
      cText(337, 400, "Product Name", 22, { font: "Georgia", color: "#333333", id: "name", width: 500 }),
      cText(337, 500, "$29.99", 40, { bold: true, color: "#111111", id: "price", width: 500 }),
      cText(337, 900, "Made with care", 14, { color: "#999999", id: "note", width: 500 }),
    ]},
  },

  // ──────────────────────────────────────────
  // ENVELOPES (9.5×4.125 @300 = 2925×1313)
  // ──────────────────────────────────────────
  {
    id: "env-business", name: "Business Envelope",
    category: "envelopes", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#ffffff", objects: [
      lText(100, 100, "COMPANY NAME", 32, { bold: true, color: "#111111", id: "company", width: 1000 }),
      lText(100, 150, "123 Business Street\nToronto, ON M1M 1M1", 18, { color: "#666666", id: "addr", width: 800 }),
      rect(100, 240, 400, 2, "#2563eb", "accent"),
    ]},
  },

  // ──────────────────────────────────────────
  // STICKERS (3×3 @300 = 975×975)
  // ──────────────────────────────────────────
  {
    id: "stk-logo", name: "Logo Sticker",
    category: "die-cut-stickers", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#ffffff", objects: [
      cText(487, 350, "YOUR\nLOGO", 72, { bold: true, color: "#111111", id: "logo", width: 700, extra: { lineHeight: 1.1 } }),
      cText(487, 600, "HERE", 36, { color: "#666666", id: "sub", width: 500, extra: { charSpacing: 400 } }),
    ]},
  },
  {
    id: "stk-circle", name: "Circle Badge",
    category: "die-cut-stickers", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#2563eb", objects: [
      { type: "Circle", left: 487, top: 487, radius: 400, fill: "transparent", stroke: "#ffffff", strokeWidth: 6, originX: "center", originY: "center", id: "ring" },
      cText(487, 380, "PREMIUM", 40, { bold: true, color: "#ffffff", id: "top", width: 600, extra: { charSpacing: 200 } }),
      cText(487, 470, "QUALITY", 40, { bold: true, color: "#ffffff", id: "bottom", width: 600, extra: { charSpacing: 200 } }),
    ]},
  },

  // ──────────────────────────────────────────
  // VINYL BANNERS (48×24 @150 = 7275×3675)
  // ──────────────────────────────────────────
  {
    id: "banner-grand", name: "Grand Opening",
    category: "vinyl-banners", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#dc2626", objects: [
      cText(3637, 800, "GRAND OPENING", 200, { bold: true, color: "#ffffff", id: "headline", width: 6500, extra: { charSpacing: 100 } }),
      cText(3637, 1200, "Come celebrate with us!", 80, { color: "rgba(255,255,255,0.9)", id: "sub", width: 5000 }),
      cText(3637, 2500, "MARCH 15, 2026 | 123 MAIN ST, TORONTO", 50, { color: "rgba(255,255,255,0.8)", id: "details", width: 6000 }),
    ]},
  },
  {
    id: "banner-sale", name: "Sale Banner",
    category: "vinyl-banners", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#1e40af", objects: [
      cText(3637, 600, "CLEARANCE", 220, { bold: true, color: "#ffffff", id: "headline", width: 6500, extra: { charSpacing: 100 } }),
      cText(3637, 1100, "UP TO 70% OFF", 120, { bold: true, color: "#fbbf24", id: "discount", width: 5000 }),
      cText(3637, 2500, "While supplies last • All sales final", 50, { color: "rgba(255,255,255,0.7)", id: "note", width: 5000 }),
    ]},
  },
  // Also map to generic "banners" slug
  {
    id: "banner-generic", name: "Custom Banner",
    category: "banners", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#ffffff", objects: [
      cText(3637, 800, "YOUR MESSAGE", 180, { bold: true, color: "#111111", id: "headline", width: 6500 }),
      cText(3637, 1300, "Add your details here", 60, { color: "#666666", id: "sub", width: 5000 }),
      cText(3637, 2500, "(416) 555-0123 | www.example.com", 50, { color: "#999999", id: "contact", width: 5000 }),
    ]},
  },

  // ──────────────────────────────────────────
  // RETRACTABLE STANDS (33×81 @150 = 4988×12188)
  // ──────────────────────────────────────────
  {
    id: "retract-corporate", name: "Corporate",
    category: "retractable-stands", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#0f172a", objects: [
      cText(2494, 1000, "COMPANY\nNAME", 240, { bold: true, color: "#ffffff", id: "name", width: 4000, extra: { lineHeight: 1.1 } }),
      rect(1494, 1800, 2000, 6, "#3b82f6", "accent"),
      cText(2494, 2100, "Your tagline or\nmission statement here", 80, { color: "rgba(255,255,255,0.7)", id: "tagline", width: 3500 }),
      cText(2494, 5000, "KEY FEATURE ONE\n\nKEY FEATURE TWO\n\nKEY FEATURE THREE", 60, { color: "#ffffff", id: "features", width: 3500, extra: { lineHeight: 1.8 } }),
      cText(2494, 10500, "www.example.com", 70, { bold: true, color: "#3b82f6", id: "web", width: 3500 }),
      cText(2494, 10800, "(416) 555-0123 | info@example.com", 50, { color: "rgba(255,255,255,0.5)", id: "contact", width: 3500 }),
    ]},
  },
  {
    id: "retract-tradeshow", name: "Trade Show",
    category: "retractable-stands", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#ffffff", objects: [
      rect(0, 0, 4988, 3000, "#6366f1", "top"),
      cText(2494, 1000, "BRAND\nNAME", 260, { bold: true, color: "#ffffff", id: "brand", width: 4000, extra: { lineHeight: 1.05 } }),
      cText(2494, 2200, "Innovating the Future", 80, { color: "rgba(255,255,255,0.8)", id: "tagline", width: 4000 }),
      cText(2494, 4500, "Product or service\ndescription goes here.\n\nHighlight your key\ndifferentiators.", 60, { color: "#333333", id: "body", width: 3500, extra: { lineHeight: 1.6 } }),
      rect(200, 10000, 4588, 4, "#6366f1", "line"),
      cText(2494, 10300, "VISIT US AT BOOTH #123", 70, { bold: true, color: "#6366f1", id: "booth", width: 4000 }),
      cText(2494, 10600, "www.example.com", 50, { color: "#999999", id: "web", width: 3000 }),
    ]},
  },

  // ──────────────────────────────────────────
  // X-BANNER STANDS (24×63 @150 = 3638×9488)
  // ──────────────────────────────────────────
  {
    id: "xbanner-promo", name: "Promo Stand",
    category: "x-banner-stands", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#111827", objects: [
      cText(1819, 800, "YOUR\nBRAND", 200, { bold: true, color: "#ffffff", id: "brand", width: 3000, extra: { lineHeight: 1.1 } }),
      rect(819, 1500, 2000, 5, "#f59e0b", "accent"),
      cText(1819, 1700, "Premium Quality\nProducts & Services", 70, { color: "rgba(255,255,255,0.7)", id: "desc", width: 3000 }),
      cText(1819, 7500, "www.example.com", 60, { bold: true, color: "#f59e0b", id: "web", width: 3000 }),
      cText(1819, 7800, "(416) 555-0123", 50, { color: "rgba(255,255,255,0.5)", id: "phone", width: 2500 }),
    ]},
  },

  // ──────────────────────────────────────────
  // YARD SIGNS (24×18 @150 = 3638×2738)
  // ──────────────────────────────────────────
  {
    id: "yard-realestate", name: "Real Estate",
    category: "yard-signs", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#1e40af", objects: [
      cText(1819, 400, "FOR SALE", 140, { bold: true, color: "#ffffff", id: "status", width: 3000 }),
      rect(819, 650, 2000, 4, "#ffffff", "line"),
      cText(1819, 800, "Agent Name", 80, { bold: true, color: "#ffffff", id: "agent", width: 3000 }),
      cText(1819, 1000, "Brokerage Name", 50, { color: "rgba(255,255,255,0.8)", id: "broker", width: 3000 }),
      cText(1819, 2100, "(416) 555-0123", 70, { bold: true, color: "#fbbf24", id: "phone", width: 3000 }),
    ]},
  },
  {
    id: "yard-event", name: "Event Sign",
    category: "yard-signs", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#ffffff", objects: [
      rect(0, 0, 3638, 600, "#dc2626", "header"),
      cText(1819, 250, "EVENT NAME", 120, { bold: true, color: "#ffffff", id: "title", width: 3000 }),
      cText(1819, 900, "DATE & TIME", 60, { bold: true, color: "#333333", id: "date", width: 3000 }),
      cText(1819, 1200, "Location Details", 50, { color: "#666666", id: "loc", width: 3000 }),
      cText(1819, 2200, "www.example.com", 50, { bold: true, color: "#dc2626", id: "web", width: 3000 }),
    ]},
  },

  // ──────────────────────────────────────────
  // FOAM BOARD / ALUMINUM / PVC SIGNS (18×24 @150)
  // ──────────────────────────────────────────
  {
    id: "sign-info", name: "Info Sign",
    category: "foam-board-signs", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#ffffff", objects: [
      rect(0, 0, 2775, 600, "#111827", "header"),
      cText(1387, 250, "NOTICE", 100, { bold: true, color: "#ffffff", id: "title", width: 2400 }),
      cText(1387, 900, "Your important message\ngoes here.", 60, { color: "#333333", id: "body", width: 2400 }),
      cText(1387, 3200, "Management", 36, { color: "#999999", id: "from", width: 2000 }),
    ]},
  },
  {
    id: "sign-directional", name: "Directional",
    category: "signs", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#2563eb", objects: [
      cText(1387, 600, "ENTRANCE", 120, { bold: true, color: "#ffffff", id: "title", width: 2400 }),
      cText(1387, 900, "→", 200, { color: "#ffffff", id: "arrow", width: 500 }),
      cText(1387, 2800, "Please follow signs", 36, { color: "rgba(255,255,255,0.7)", id: "note", width: 2000 }),
    ]},
  },

  // ──────────────────────────────────────────
  // CERTIFICATES (8.5×11 @300 = 2625×3375)
  // ──────────────────────────────────────────
  {
    id: "cert-achievement", name: "Achievement",
    category: "certificates", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#fffbeb", objects: [
      rect(80, 80, 2465, 3215, "transparent", "border"),
      cText(1312, 400, "CERTIFICATE", 60, { color: "#92400e", id: "label", width: 2000, extra: { charSpacing: 400 } }),
      cText(1312, 520, "of Achievement", 40, { font: "Georgia", color: "#a16207", id: "sub", width: 1500 }),
      rect(812, 620, 1000, 3, "#d4af37", "line1"),
      cText(1312, 800, "This certifies that", 28, { font: "Georgia", color: "#78350f", id: "intro", width: 1500 }),
      cText(1312, 1000, "Recipient Name", 64, { font: "Georgia", bold: true, color: "#111111", id: "name", width: 2000 }),
      rect(612, 1120, 1400, 2, "#d4af37", "line2"),
      cText(1312, 1250, "has successfully completed the requirements\nfor this recognition.", 26, { font: "Georgia", color: "#78350f", id: "body", width: 1800 }),
      cText(600, 2600, "________________\nDate", 22, { font: "Georgia", color: "#78350f", id: "date_line", width: 600 }),
      cText(2000, 2600, "________________\nSignature", 22, { font: "Georgia", color: "#78350f", id: "sig_line", width: 600 }),
    ]},
  },

  // ──────────────────────────────────────────
  // COUPONS (3.5×2 @300 = 1125×675)
  // ──────────────────────────────────────────
  {
    id: "coupon-discount", name: "Discount Coupon",
    category: "coupons", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#fef2f2", objects: [
      cText(562, 130, "20% OFF", 72, { bold: true, color: "#dc2626", id: "discount", width: 900 }),
      rect(262, 240, 600, 3, "#dc2626", "line"),
      cText(562, 300, "Your next purchase", 24, { color: "#666666", id: "desc", width: 800 }),
      cText(562, 430, "CODE: SAVE20", 28, { bold: true, color: "#111111", id: "code", width: 800 }),
      cText(562, 560, "Valid until Dec 31, 2026 | One per customer", 14, { color: "#999999", id: "terms", width: 900 }),
    ]},
  },

  // ──────────────────────────────────────────
  // PACKAGING INSERTS (4×6 @300 = 1275×1875)
  // ──────────────────────────────────────────
  {
    id: "insert-thankyou", name: "Thank You Insert",
    category: "inserts-packaging", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#ffffff", objects: [
      cText(637, 400, "Thank You\nfor Your Order!", 52, { font: "Georgia", bold: true, color: "#111111", id: "title", width: 1000, extra: { lineHeight: 1.2 } }),
      rect(387, 600, 500, 3, "#d4af37", "accent"),
      cText(637, 700, "We hope you love your purchase.\nLeave us a review!", 24, { color: "#666666", id: "msg", width: 1000 }),
      cText(637, 1100, "15% OFF\nYour Next Order", 36, { bold: true, color: "#059669", id: "offer", width: 900, extra: { lineHeight: 1.2 } }),
      cText(637, 1300, "Use code: THANKS15", 22, { color: "#333333", id: "code", width: 800 }),
      cText(637, 1600, "@yourbrand | www.example.com", 18, { color: "#999999", id: "social", width: 1000 }),
    ]},
  },

  // ──────────────────────────────────────────
  // NOTEPADS (5.5×8.5 @300 = 1725×2625)
  // ──────────────────────────────────────────
  {
    id: "notepad-company", name: "Company Notepad",
    category: "notepads", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#ffffff", objects: [
      lText(100, 80, "COMPANY NAME", 36, { bold: true, color: "#1e40af", id: "company", width: 1000 }),
      lText(100, 130, "123 Main St, Toronto | (416) 555-0123", 16, { color: "#6b7280", id: "info", width: 1400 }),
      rect(100, 170, 1525, 2, "#2563eb", "line"),
    ]},
  },

  // ──────────────────────────────────────────
  // PRESENTATION FOLDERS (9×12 @300 = 2775×3675)
  // ──────────────────────────────────────────
  {
    id: "folder-corporate", name: "Corporate Folder",
    category: "presentation-folders", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#0f172a", objects: [
      cText(1387, 1200, "COMPANY\nNAME", 120, { bold: true, color: "#ffffff", id: "company", width: 2200, extra: { lineHeight: 1.1 } }),
      rect(887, 1600, 1000, 4, "#3b82f6", "accent"),
      cText(1387, 1750, "Professional Solutions\nfor Your Business", 40, { color: "rgba(255,255,255,0.6)", id: "tagline", width: 2000 }),
      cText(1387, 3200, "www.example.com", 30, { color: "rgba(255,255,255,0.4)", id: "web", width: 1500 }),
    ]},
  },

  // ──────────────────────────────────────────
  // CANVAS PRINTS (16×20 @150 = 2438×3038)
  // ──────────────────────────────────────────
  {
    id: "canvas-quote", name: "Inspirational Quote",
    category: "canvas-prints", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#1a1a1a", objects: [
      cText(1219, 1000, "Be the\nchange you\nwish to see", 100, { font: "Georgia", bold: true, color: "#ffffff", id: "quote", width: 2000, extra: { lineHeight: 1.3 } }),
      rect(819, 1700, 800, 4, "#d4af37", "accent"),
      cText(1219, 1850, "— Mahatma Gandhi", 36, { font: "Georgia", color: "rgba(255,255,255,0.5)", id: "attr", width: 1500 }),
    ]},
  },
  {
    id: "canvas-custom", name: "Custom Canvas",
    category: "canvas", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#ffffff", objects: [
      cText(1219, 1200, "YOUR\nPHOTO\nHERE", 120, { bold: true, color: "#e5e7eb", id: "placeholder", width: 2000, extra: { lineHeight: 1.1 } }),
      cText(1219, 2500, "Upload your image to get started", 28, { color: "#d1d5db", id: "hint", width: 2000 }),
    ]},
  },

  // ──────────────────────────────────────────
  // VEHICLE DECALS (24×12 @150 = 3638×1838)
  // ──────────────────────────────────────────
  {
    id: "vdecal-company", name: "Company Decal",
    category: "vehicle-decals", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#ffffff", objects: [
      cText(1819, 400, "COMPANY NAME", 100, { bold: true, color: "#111111", id: "name", width: 3200 }),
      cText(1819, 600, "(416) 555-0123", 60, { bold: true, color: "#dc2626", id: "phone", width: 3000 }),
      cText(1819, 800, "www.example.com", 40, { color: "#666666", id: "web", width: 2500 }),
      cText(1819, 1400, "Licensed & Insured", 28, { color: "#999999", id: "note", width: 2000 }),
    ]},
  },

  // ──────────────────────────────────────────
  // SHELF DISPLAYS (4×5 @300 = 1275×1575)
  // ──────────────────────────────────────────
  {
    id: "shelf-promo", name: "Shelf Promo",
    category: "shelf-displays", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#dc2626", objects: [
      cText(637, 300, "NEW!", 80, { bold: true, color: "#ffffff", id: "badge", width: 1000 }),
      cText(637, 500, "Product\nName", 52, { bold: true, color: "#ffffff", id: "product", width: 1000, extra: { lineHeight: 1.1 } }),
      cText(637, 800, "$9.99", 72, { bold: true, color: "#fef2f2", id: "price", width: 800 }),
      cText(637, 1200, "Try it today!", 28, { color: "rgba(255,255,255,0.8)", id: "cta", width: 800 }),
    ]},
  },

  // ──────────────────────────────────────────
  // BROCHURES (8.5×11 @300 = 2625×3375) — uses same as flyers
  // ──────────────────────────────────────────
  {
    id: "brochure-corporate", name: "Corporate Brochure",
    category: "brochures", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#ffffff", objects: [
      rect(0, 0, 2625, 1000, "#1e3a5f", "header"),
      cText(1312, 350, "COMPANY NAME", 80, { bold: true, color: "#ffffff", id: "company", width: 2200, extra: { charSpacing: 100 } }),
      cText(1312, 550, "Professional Solutions Since 2020", 32, { color: "rgba(255,255,255,0.7)", id: "tagline", width: 2000 }),
      lText(200, 1200, "About Us", 40, { bold: true, color: "#1e3a5f", id: "heading", width: 2000 }),
      lText(200, 1300, "Add your company description here. Tell your customers\nwhat makes you different and why they should choose you.", 28, { color: "#333333", id: "body", width: 2200, extra: { lineHeight: 1.6 } }),
      cText(1312, 2800, "www.example.com | (416) 555-0123", 28, { color: "#888888", id: "contact", width: 2200 }),
    ]},
  },

  // ──────────────────────────────────────────
  // LETTERHEADS (8.5×11 @300 = 2625×3375)
  // ──────────────────────────────────────────
  {
    id: "lh-professional", name: "Professional",
    category: "letterheads", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#ffffff", objects: [
      lText(100, 100, "COMPANY NAME", 40, { bold: true, color: "#1e40af", id: "company", width: 1500 }),
      lText(100, 160, "123 Main Street, Toronto, ON M1M 1M1", 18, { color: "#6b7280", id: "addr", width: 2000 }),
      lText(100, 190, "(416) 555-0123 | info@example.com", 18, { color: "#6b7280", id: "contact", width: 2000 }),
      rect(100, 230, 2425, 3, "#1e40af", "line"),
      rect(100, 3200, 2425, 1, "#e5e7eb", "footer_line"),
      cText(1312, 3240, "www.example.com", 16, { color: "#9ca3af", id: "web", width: 2000 }),
    ]},
  },
  {
    id: "lh-minimal", name: "Minimal",
    category: "letterhead", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#ffffff", objects: [
      rect(100, 100, 6, 150, "#111111", "accent"),
      lText(130, 100, "COMPANY", 36, { bold: true, color: "#111111", id: "company", width: 800 }),
      lText(130, 150, "NAME", 36, { bold: true, color: "#111111", id: "name", width: 800 }),
      lText(1600, 120, "(416) 555-0123\ninfo@example.com", 16, { color: "#888888", id: "contact", width: 900 }),
    ]},
  },
];

export function getDesignTemplate(id) {
  return DESIGN_TEMPLATES.find((t) => t.id === id) || null;
}

export function getDesignTemplatesByCategory(category) {
  return DESIGN_TEMPLATES.filter((t) => t.category === category);
}

export function getAllDesignTemplates() {
  return DESIGN_TEMPLATES;
}
