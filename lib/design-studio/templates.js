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
  {
    id: "vdecal-service", name: "Service Vehicle",
    category: "vehicle-decals", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#1e40af", objects: [
      cText(1819, 300, "PLUMBING\nSERVICES", 90, { bold: true, color: "#ffffff", id: "service", width: 3200, extra: { lineHeight: 1.1 } }),
      cText(1819, 700, "24/7 Emergency Calls", 40, { color: "#93c5fd", id: "sub", width: 3000 }),
      cText(1819, 1200, "(416) 555-0123", 80, { bold: true, color: "#fbbf24", id: "phone", width: 3000 }),
      cText(1819, 1500, "Licensed & Insured • Free Estimates", 28, { color: "rgba(255,255,255,0.7)", id: "note", width: 3000 }),
    ]},
  },
  {
    id: "vdecal-contractor", name: "Contractor",
    category: "vehicle-decals", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#f97316", objects: [
      cText(1819, 300, "CONSTRUCTION CO.", 80, { bold: true, color: "#ffffff", id: "name", width: 3200 }),
      rect(819, 450, 2000, 4, "#ffffff", "line"),
      cText(1819, 600, "Residential & Commercial", 40, { color: "rgba(255,255,255,0.9)", id: "type", width: 3000 }),
      cText(1819, 1100, "(416) 555-0123", 70, { bold: true, color: "#ffffff", id: "phone", width: 3000 }),
      cText(1819, 1500, "www.example.com", 32, { color: "rgba(255,255,255,0.7)", id: "web", width: 2500 }),
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
    category: "letterheads", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#ffffff", objects: [
      rect(100, 100, 6, 150, "#111111", "accent"),
      lText(130, 100, "COMPANY", 36, { bold: true, color: "#111111", id: "company", width: 800 }),
      lText(130, 150, "NAME", 36, { bold: true, color: "#111111", id: "name", width: 800 }),
      lText(1600, 120, "(416) 555-0123\ninfo@example.com", 16, { color: "#888888", id: "contact", width: 900 }),
    ]},
  },

  // ══════════════════════════════════════════════════════════════════
  // NEW TEMPLATES — added to fill category gaps
  // ══════════════════════════════════════════════════════════════════

  // ──────────────────────────────────────────
  // BUSINESS CARDS +2 (Tech Startup, Restaurant)
  // ──────────────────────────────────────────
  {
    id: "bc-tech-startup", name: "Tech Startup",
    category: "business-cards", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#0f172a", objects: [
      rect(0, 0, 1125, 8, "#06b6d4", "accent"),
      lText(97, 180, "First Last", 42, { bold: true, color: "#ffffff", id: "name" }),
      lText(97, 240, "Co-Founder & CTO", 22, { color: "#06b6d4", id: "title" }),
      lText(97, 420, "hello@startup.io", 18, { color: "#94a3b8", id: "email" }),
      lText(97, 460, "startup.io", 18, { color: "#94a3b8", id: "web" }),
      lText(97, 500, "(416) 555-0199", 18, { color: "#94a3b8", id: "phone" }),
    ]},
  },
  {
    id: "bc-restaurant", name: "Restaurant",
    category: "business-cards", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#1c1917", objects: [
      cText(562, 160, "THE KITCHEN", 36, { bold: true, color: "#d4af37", id: "restaurant", width: 900, extra: { charSpacing: 300 } }),
      rect(362, 230, 400, 2, "#d4af37", "line"),
      cText(562, 280, "Chef Name", 30, { font: "Georgia", color: "#ffffff", id: "name", width: 800 }),
      cText(562, 330, "Executive Chef", 18, { font: "Georgia", color: "#a8a29e", id: "title", width: 800 }),
      cText(562, 500, "123 Food St, Toronto | (416) 555-0188", 16, { color: "#78716c", id: "contact", width: 900 }),
      cText(562, 540, "reservations@thekitchen.ca", 16, { color: "#78716c", id: "email", width: 900 }),
    ]},
  },

  // ──────────────────────────────────────────
  // DIE-CUT STICKERS +3 (Thank You, Promo, Warning)
  // ──────────────────────────────────────────
  {
    id: "stk-thankyou", name: "Thank You",
    category: "die-cut-stickers", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#fef3c7", objects: [
      cText(487, 350, "Thank\nYou!", 80, { font: "Georgia", bold: true, color: "#92400e", id: "msg", width: 700, extra: { lineHeight: 1.1 } }),
      cText(487, 650, "for your purchase", 22, { font: "Georgia", color: "#a16207", id: "sub", width: 600 }),
      rect(287, 600, 400, 2, "#d97706", "accent"),
    ]},
  },
  {
    id: "stk-promo-sale", name: "Sale Badge",
    category: "die-cut-stickers", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#dc2626", objects: [
      { type: "Circle", left: 487, top: 487, radius: 400, fill: "transparent", stroke: "#ffffff", strokeWidth: 8, originX: "center", originY: "center", id: "ring" },
      cText(487, 350, "SALE", 64, { bold: true, color: "#ffffff", id: "label", width: 600, extra: { charSpacing: 200 } }),
      cText(487, 450, "50%\nOFF", 80, { bold: true, color: "#ffffff", id: "discount", width: 600, extra: { lineHeight: 1 } }),
    ]},
  },
  {
    id: "stk-warning", name: "Warning Label",
    category: "die-cut-stickers", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#fbbf24", objects: [
      cText(487, 300, "⚠", 100, { color: "#111111", id: "icon", width: 400 }),
      cText(487, 500, "WARNING", 52, { bold: true, color: "#111111", id: "label", width: 700, extra: { charSpacing: 200 } }),
      cText(487, 620, "Handle with care", 24, { color: "#333333", id: "sub", width: 600 }),
    ]},
  },

  // ──────────────────────────────────────────
  // FLYERS +2 (Grand Opening, Discount)
  // ──────────────────────────────────────────
  {
    id: "flyer-opening", name: "Grand Opening",
    category: "flyers", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#ffffff", objects: [
      rect(0, 0, 2625, 800, "#dc2626", "header"),
      cText(1312, 200, "GRAND OPENING", 100, { bold: true, color: "#ffffff", id: "headline", width: 2200, extra: { charSpacing: 80 } }),
      cText(1312, 420, "Come Celebrate With Us!", 44, { color: "rgba(255,255,255,0.9)", id: "sub", width: 2000 }),
      cText(1312, 1100, "Join us for our grand opening event!\nEnjoy special discounts and giveaways.", 36, { color: "#333333", id: "body", width: 2000, extra: { lineHeight: 1.6 } }),
      cText(1312, 1700, "MARCH 15, 2026 • 10 AM – 6 PM", 40, { bold: true, color: "#dc2626", id: "date", width: 2000 }),
      cText(1312, 2800, "123 Main Street, Toronto | (416) 555-0123", 28, { color: "#666666", id: "address", width: 2200 }),
    ]},
  },
  {
    id: "flyer-discount", name: "Discount Flyer",
    category: "flyers", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#faf5ff", objects: [
      cText(1312, 250, "EXCLUSIVE\nOFFER", 120, { bold: true, color: "#7c3aed", id: "headline", width: 2200, extra: { lineHeight: 1.05 } }),
      cText(1312, 650, "30% OFF", 160, { bold: true, color: "#dc2626", id: "discount", width: 2000 }),
      cText(1312, 950, "All products and services\nthis weekend only!", 36, { color: "#6b7280", id: "body", width: 2000, extra: { lineHeight: 1.5 } }),
      rect(812, 1100, 1000, 4, "#7c3aed", "divider"),
      cText(1312, 1250, "Use code: SAVE30", 48, { bold: true, color: "#7c3aed", id: "code", width: 2000 }),
      cText(1312, 2800, "www.example.com | (416) 555-0123", 28, { color: "#999999", id: "contact", width: 2000 }),
    ]},
  },

  // ──────────────────────────────────────────
  // POSTCARDS +2 (Real Estate, Thank You)
  // ──────────────────────────────────────────
  {
    id: "pc-realestate", name: "Real Estate",
    category: "postcards", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#ffffff", objects: [
      rect(0, 0, 1875, 400, "#1e3a5f", "header"),
      cText(937, 150, "JUST LISTED", 64, { bold: true, color: "#ffffff", id: "headline", width: 1600 }),
      cText(937, 280, "123 Beautiful Avenue, Toronto", 24, { color: "rgba(255,255,255,0.8)", id: "address", width: 1400 }),
      cText(937, 600, "$899,000", 72, { bold: true, color: "#1e3a5f", id: "price", width: 1500 }),
      cText(937, 750, "4 Bed | 3 Bath | 2,400 sq ft", 28, { color: "#666666", id: "details", width: 1400 }),
      cText(937, 1050, "Agent Name | (416) 555-0177 | agent@realty.com", 20, { color: "#888888", id: "agent", width: 1600 }),
    ]},
  },
  {
    id: "pc-thankyou", name: "Thank You Card",
    category: "postcards", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#f0fdf4", objects: [
      cText(937, 350, "Thank You!", 72, { font: "Georgia", bold: true, color: "#166534", id: "headline", width: 1600 }),
      rect(637, 480, 600, 3, "#22c55e", "accent"),
      cText(937, 580, "We truly appreciate your\nbusiness and support.", 30, { font: "Georgia", color: "#15803d", id: "body", width: 1400, extra: { lineHeight: 1.5 } }),
      cText(937, 1050, "— The Team at Your Company", 22, { font: "Georgia", color: "#4ade80", id: "sig", width: 1400 }),
    ]},
  },

  // ──────────────────────────────────────────
  // VINYL BANNERS +2 (Celebration, Promo)
  // ──────────────────────────────────────────
  {
    id: "banner-celebration", name: "Celebration",
    category: "vinyl-banners", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#7c3aed", objects: [
      cText(3637, 700, "CONGRATULATIONS!", 160, { bold: true, color: "#ffffff", id: "headline", width: 6500, extra: { charSpacing: 80 } }),
      cText(3637, 1200, "Class of 2026", 100, { color: "#fbbf24", id: "sub", width: 5000 }),
      cText(3637, 2500, "We are so proud of you!", 60, { color: "rgba(255,255,255,0.8)", id: "msg", width: 5000 }),
    ]},
  },
  {
    id: "banner-promo", name: "Promo Banner",
    category: "vinyl-banners", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#ffffff", objects: [
      rect(0, 0, 7275, 600, "#111827", "top"),
      cText(3637, 250, "YOUR BUSINESS NAME", 120, { bold: true, color: "#ffffff", id: "name", width: 6500 }),
      cText(3637, 1200, "SPECIAL PROMOTION", 180, { bold: true, color: "#dc2626", id: "headline", width: 6500 }),
      cText(3637, 1800, "Valid this month only", 60, { color: "#666666", id: "sub", width: 5000 }),
      cText(3637, 2800, "(416) 555-0123 | www.example.com", 50, { color: "#999999", id: "contact", width: 5000 }),
    ]},
  },

  // ──────────────────────────────────────────
  // YARD SIGNS +2 (Political, Open House)
  // ──────────────────────────────────────────
  {
    id: "yard-political", name: "Campaign Sign",
    category: "yard-signs", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#1e3a8a", objects: [
      cText(1819, 500, "CANDIDATE\nNAME", 120, { bold: true, color: "#ffffff", id: "name", width: 3200, extra: { lineHeight: 1.05 } }),
      cText(1819, 1100, "FOR CITY COUNCIL", 60, { bold: true, color: "#fbbf24", id: "office", width: 3000 }),
      rect(819, 1250, 2000, 4, "#fbbf24", "line"),
      cText(1819, 1500, "Vote March 15", 50, { color: "rgba(255,255,255,0.8)", id: "date", width: 3000 }),
      cText(1819, 2200, "www.candidate.ca", 40, { color: "rgba(255,255,255,0.6)", id: "web", width: 3000 }),
    ]},
  },
  {
    id: "yard-openhouse", name: "Open House",
    category: "yard-signs", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#059669", objects: [
      cText(1819, 400, "OPEN\nHOUSE", 130, { bold: true, color: "#ffffff", id: "title", width: 3000, extra: { lineHeight: 1.05 } }),
      cText(1819, 1000, "Sunday 1–4 PM", 60, { color: "#fbbf24", id: "time", width: 3000 }),
      rect(819, 1150, 2000, 4, "#ffffff", "line"),
      cText(1819, 1400, "Agent Name", 60, { bold: true, color: "#ffffff", id: "agent", width: 3000 }),
      cText(1819, 2100, "(416) 555-0133", 60, { bold: true, color: "#fbbf24", id: "phone", width: 3000 }),
    ]},
  },

  // ──────────────────────────────────────────
  // POSTERS +2 (Typography, Event Gig)
  // ──────────────────────────────────────────
  {
    id: "poster-typography", name: "Typography",
    category: "posters", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#fefce8", objects: [
      cText(1387, 500, "THINK\nBIG.", 200, { bold: true, color: "#111111", id: "headline", width: 2400, extra: { lineHeight: 1 } }),
      rect(887, 1100, 1000, 6, "#111111", "accent"),
      cText(1387, 1300, "Inspirational quote or\nmessage goes here.", 48, { font: "Georgia", color: "#555555", id: "body", width: 2200, extra: { lineHeight: 1.4 } }),
      cText(1387, 3200, "— Author Name", 36, { font: "Georgia", color: "#999999", id: "attr", width: 2000 }),
    ]},
  },
  {
    id: "poster-event-neon", name: "Neon Event",
    category: "posters", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#0a0a0a", objects: [
      cText(1387, 600, "FRIDAY\nNIGHT", 160, { bold: true, color: "#f0abfc", id: "title", width: 2400, extra: { lineHeight: 1.05 } }),
      cText(1387, 1200, "LIVE MUSIC & DJ", 60, { bold: true, color: "#06b6d4", id: "sub", width: 2000 }),
      rect(687, 1350, 1400, 3, "#f0abfc", "line"),
      cText(1387, 1500, "March 15, 2026 • 9 PM", 44, { color: "#a78bfa", id: "date", width: 2000 }),
      cText(1387, 1700, "Venue Name, Toronto", 36, { color: "#6b7280", id: "venue", width: 2000 }),
      cText(1387, 3200, "TICKETS: $20 ADV / $25 DOOR", 40, { bold: true, color: "#06b6d4", id: "cta", width: 2200 }),
    ]},
  },

  // ──────────────────────────────────────────
  // ROLL LABELS +3 (Product, Barcode, Ingredient)
  // (2.25×1.25 @300 = 750×450 with bleed)
  // ──────────────────────────────────────────
  {
    id: "rl-product", name: "Product Label",
    category: "roll-labels", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#ffffff", objects: [
      cText(337, 130, "BRAND NAME", 26, { bold: true, color: "#111111", id: "brand", width: 550, extra: { charSpacing: 150 } }),
      rect(137, 175, 400, 2, "#111111", "line"),
      cText(337, 260, "Product Name", 22, { font: "Georgia", color: "#444444", id: "product", width: 550 }),
      cText(337, 400, "Net Wt. 8 oz (227g)", 14, { color: "#888888", id: "weight", width: 450 }),
      cText(337, 540, "Handmade in Toronto", 12, { color: "#aaaaaa", id: "origin", width: 450 }),
    ]},
  },
  {
    id: "rl-barcode", name: "Barcode Label",
    category: "roll-labels", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#ffffff", objects: [
      lText(60, 60, "SKU-001234", 16, { bold: true, color: "#111111", id: "sku", width: 400 }),
      rect(60, 160, 555, 90, "#e5e7eb", "barcode_area"),
      cText(337, 185, "||||||||||||||||||||||||", 40, { bold: true, color: "#111111", id: "bars", width: 500 }),
      cText(337, 360, "0 12345 67890 5", 16, { color: "#333333", id: "number", width: 550, extra: { charSpacing: 100 } }),
      lText(60, 510, "$9.99", 28, { bold: true, color: "#111111", id: "price", width: 300 }),
    ]},
  },
  {
    id: "rl-ingredient", name: "Ingredients",
    category: "roll-labels", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#fefce8", objects: [
      cText(337, 80, "INGREDIENTS", 20, { bold: true, color: "#111111", id: "heading", width: 550, extra: { charSpacing: 150 } }),
      rect(87, 120, 500, 1, "#d4d4d4", "line"),
      cText(337, 250, "Water, Organic Shea Butter,\nCoconut Oil, Beeswax,\nVitamin E, Natural Fragrance", 14, { color: "#444444", id: "list", width: 550, extra: { lineHeight: 1.5 } }),
      cText(337, 510, "Made in Canada", 12, { color: "#888888", id: "origin", width: 450 }),
      cText(337, 570, "Net Wt. 4 oz (113g)", 12, { color: "#888888", id: "weight", width: 450 }),
    ]},
  },

  // ──────────────────────────────────────────
  // STICKER SHEETS +2 (Multi Logo, Variety)
  // (8.5×11 @300 = 2625×3375)
  // ──────────────────────────────────────────
  {
    id: "ss-logo-sheet", name: "Logo Sheet",
    category: "sticker-sheets", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#ffffff", objects: [
      cText(656, 400, "YOUR\nLOGO", 60, { bold: true, color: "#111111", id: "logo1", width: 500, extra: { lineHeight: 1.1 } }),
      cText(1968, 400, "YOUR\nLOGO", 60, { bold: true, color: "#111111", id: "logo2", width: 500, extra: { lineHeight: 1.1 } }),
      cText(656, 1200, "YOUR\nLOGO", 60, { bold: true, color: "#111111", id: "logo3", width: 500, extra: { lineHeight: 1.1 } }),
      cText(1968, 1200, "YOUR\nLOGO", 60, { bold: true, color: "#111111", id: "logo4", width: 500, extra: { lineHeight: 1.1 } }),
      cText(656, 2000, "YOUR\nLOGO", 60, { bold: true, color: "#111111", id: "logo5", width: 500, extra: { lineHeight: 1.1 } }),
      cText(1968, 2000, "YOUR\nLOGO", 60, { bold: true, color: "#111111", id: "logo6", width: 500, extra: { lineHeight: 1.1 } }),
      cText(1312, 3050, "Upload your logo to replace placeholders", 24, { color: "#d1d5db", id: "hint", width: 2200 }),
    ]},
  },
  {
    id: "ss-variety", name: "Variety Pack",
    category: "sticker-sheets", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#f8fafc", objects: [
      { type: "Circle", left: 500, top: 500, radius: 250, fill: "#3b82f6", originX: "center", originY: "center", id: "c1" },
      cText(500, 460, "BRAND", 32, { bold: true, color: "#ffffff", id: "t1", width: 400 }),
      { type: "Circle", left: 1312, top: 500, radius: 250, fill: "#dc2626", originX: "center", originY: "center", id: "c2" },
      cText(1312, 460, "SALE", 32, { bold: true, color: "#ffffff", id: "t2", width: 400 }),
      { type: "Circle", left: 2125, top: 500, radius: 250, fill: "#059669", originX: "center", originY: "center", id: "c3" },
      cText(2125, 460, "ECO", 32, { bold: true, color: "#ffffff", id: "t3", width: 400 }),
      rect(200, 1100, 2225, 600, "#fbbf24", "rect1"),
      cText(1312, 1320, "THANK YOU!", 48, { bold: true, color: "#ffffff", id: "t4", width: 2000 }),
      rect(200, 1900, 2225, 600, "#111827", "rect2"),
      cText(1312, 2120, "FRAGILE — HANDLE WITH CARE", 36, { bold: true, color: "#ffffff", id: "t5", width: 2000 }),
    ]},
  },

  // ──────────────────────────────────────────
  // INDUSTRIAL LABELS +2 (Asset Tag, QC Pass)
  // (3×2 @300 = 975×675)
  // ──────────────────────────────────────────
  {
    id: "il-asset", name: "Asset Tag",
    category: "industrial-labels", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#f1f5f9", objects: [
      rect(0, 0, 1275, 220, "#1e40af", "header"),
      cText(637, 80, "PROPERTY OF COMPANY NAME", 32, { bold: true, color: "#ffffff", id: "company", width: 1100 }),
      lText(100, 340, "Asset #:", 30, { bold: true, color: "#333333", id: "label1", width: 300 }),
      lText(420, 340, "A-00001", 30, { color: "#111111", id: "number", width: 600 }),
      lText(100, 470, "Department:", 30, { bold: true, color: "#333333", id: "label2", width: 300 }),
      lText(420, 470, "Engineering", 30, { color: "#111111", id: "dept", width: 600 }),
      lText(100, 600, "Date:", 30, { bold: true, color: "#333333", id: "label3", width: 300 }),
      lText(420, 600, "2026-01-15", 30, { color: "#111111", id: "date", width: 600 }),
      rect(100, 780, 1075, 120, "#e5e7eb", "barcode_area"),
      cText(637, 810, "||||||||||||||||||||||||||||||||||||", 52, { bold: true, color: "#111111", id: "bars", width: 1000 }),
      cText(637, 1050, "DO NOT REMOVE", 28, { bold: true, color: "#dc2626", id: "warning", width: 700 }),
    ]},
  },
  {
    id: "il-qc", name: "QC Passed",
    category: "industrial-labels", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#f0fdf4", objects: [
      cText(637, 300, "QC", 100, { bold: true, color: "#166534", id: "qc", width: 600, extra: { charSpacing: 300 } }),
      cText(637, 500, "PASSED", 80, { bold: true, color: "#22c55e", id: "status", width: 800, extra: { charSpacing: 200 } }),
      rect(237, 640, 700, 4, "#22c55e", "line"),
      lText(150, 800, "Inspector:", 28, { color: "#666666", id: "label1", width: 350 }),
      lText(500, 800, "_______________", 28, { color: "#999999", id: "inspector", width: 600 }),
      lText(150, 930, "Date:", 28, { color: "#666666", id: "label2", width: 350 }),
      lText(500, 930, "_______________", 28, { color: "#999999", id: "date", width: 600 }),
      lText(150, 1060, "Lot #:", 28, { color: "#666666", id: "label3", width: 350 }),
      lText(500, 1060, "_______________", 28, { color: "#999999", id: "lot", width: 600 }),
    ]},
  },

  // ──────────────────────────────────────────
  // SAFETY LABELS +2 (Warning, Caution)
  // (3×2 @300 = 975×675)
  // ──────────────────────────────────────────
  {
    id: "sl-warning", name: "Warning",
    category: "safety-labels", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#fbbf24", objects: [
      rect(0, 0, 1275, 260, "#111111", "header"),
      cText(637, 100, "⚠  WARNING", 72, { bold: true, color: "#fbbf24", id: "title", width: 1100 }),
      cText(637, 520, "Hazardous Material", 52, { bold: true, color: "#111111", id: "hazard", width: 1000 }),
      cText(637, 780, "Wear protective equipment\nbefore handling this product.", 32, { color: "#333333", id: "body", width: 1000, extra: { lineHeight: 1.5 } }),
      cText(637, 1150, "See Safety Data Sheet\nfor details", 28, { bold: true, color: "#111111", id: "note", width: 900, extra: { lineHeight: 1.4 } }),
    ]},
  },
  {
    id: "sl-caution", name: "Caution",
    category: "safety-labels", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#ffffff", objects: [
      rect(0, 0, 1275, 260, "#f97316", "header"),
      cText(637, 100, "CAUTION", 76, { bold: true, color: "#ffffff", id: "title", width: 1000, extra: { charSpacing: 200 } }),
      cText(637, 480, "Hot Surface", 56, { bold: true, color: "#ea580c", id: "hazard", width: 1000 }),
      cText(637, 730, "Do not touch. Risk of burns.\nAllow to cool before handling.", 32, { color: "#333333", id: "body", width: 1000, extra: { lineHeight: 1.5 } }),
      rect(200, 980, 875, 3, "#f97316", "line"),
      cText(637, 1100, "Contact supervisor if injured", 26, { color: "#888888", id: "note", width: 900 }),
    ]},
  },

  // ──────────────────────────────────────────
  // CANVAS PRINTS +2 (Modern Art, Family Photo)
  // (16×20 @150 = 2438×3038)
  // ──────────────────────────────────────────
  {
    id: "canvas-modern", name: "Modern Art",
    category: "canvas-prints", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#fafaf9", objects: [
      rect(200, 200, 800, 1000, "#2563eb", "block1"),
      rect(1100, 400, 600, 600, "#dc2626", "block2"),
      rect(1800, 200, 400, 800, "#fbbf24", "block3"),
      rect(400, 1400, 1600, 400, "#111111", "block4"),
      cText(1219, 2200, "ABSTRACT\nCOMPOSITION", 80, { bold: true, color: "#333333", id: "title", width: 2000, extra: { lineHeight: 1.1, charSpacing: 100 } }),
      cText(1219, 2600, "Custom canvas artwork", 28, { color: "#999999", id: "sub", width: 1500 }),
    ]},
  },
  {
    id: "canvas-family", name: "Family Photo",
    category: "canvas-prints", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#1c1917", objects: [
      rect(150, 150, 2138, 2238, "#292524", "photo_area"),
      cText(1219, 1200, "YOUR\nPHOTO\nHERE", 100, { bold: true, color: "#57534e", id: "placeholder", width: 1800, extra: { lineHeight: 1.15 } }),
      cText(1219, 2600, "The Smith Family • 2026", 32, { font: "Georgia", color: "#a8a29e", id: "caption", width: 2000 }),
      rect(819, 2700, 800, 2, "#78716c", "accent"),
    ]},
  },

  // ──────────────────────────────────────────
  // RETRACTABLE STANDS +1 (Healthcare)
  // (33×81 @150 = 4988×12188)
  // ──────────────────────────────────────────
  {
    id: "retract-health", name: "Healthcare",
    category: "retractable-stands", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#ffffff", objects: [
      rect(0, 0, 4988, 2500, "#0891b2", "top"),
      cText(2494, 800, "YOUR\nCLINIC", 220, { bold: true, color: "#ffffff", id: "name", width: 4000, extra: { lineHeight: 1.05 } }),
      cText(2494, 1600, "Caring for Your Health", 70, { color: "rgba(255,255,255,0.8)", id: "tagline", width: 3500 }),
      cText(2494, 3500, "Our Services", 80, { bold: true, color: "#0891b2", id: "heading", width: 3500 }),
      cText(2494, 4200, "Family Medicine\n\nPediatrics\n\nWalk-In Clinic\n\nLab Services", 60, { color: "#333333", id: "services", width: 3500, extra: { lineHeight: 1.8 } }),
      cText(2494, 10500, "(416) 555-0145", 70, { bold: true, color: "#0891b2", id: "phone", width: 3500 }),
      cText(2494, 10800, "123 Health St, Toronto | www.clinic.ca", 45, { color: "#999999", id: "contact", width: 3500 }),
    ]},
  },

  // ──────────────────────────────────────────
  // MENUS +1 (Bar Menu)
  // (8.5×11 @300 = 2625×3375)
  // ──────────────────────────────────────────
  {
    id: "menu-bar", name: "Bar Menu",
    category: "menus", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#0c0a09", objects: [
      cText(1312, 200, "COCKTAIL MENU", 56, { bold: true, color: "#ffffff", id: "title", width: 2200, extra: { charSpacing: 300 } }),
      rect(912, 300, 800, 2, "#a16207", "line1"),
      lText(200, 450, "CLASSICS", 30, { bold: true, color: "#d4af37", id: "cat1", width: 1000 }),
      lText(200, 510, "Old Fashioned .................. $16\nManhattan .......................... $16\nMartini ............................... $15\nNegroni .............................. $15", 22, { color: "#d6d3d1", id: "items1", width: 2200 }),
      lText(200, 900, "HOUSE SPECIALS", 30, { bold: true, color: "#d4af37", id: "cat2", width: 1000 }),
      lText(200, 960, "Smoky Paloma ................... $18\nLavender Collins ................ $17\nSpicy Margarita ................. $17", 22, { color: "#d6d3d1", id: "items2", width: 2200 }),
      lText(200, 1300, "BEER & WINE", 30, { bold: true, color: "#d4af37", id: "cat3", width: 1000 }),
      lText(200, 1360, "Draft Beer .......................... $9\nHouse Red / White ............. $12\nProsecco ............................. $14", 22, { color: "#d6d3d1", id: "items3", width: 2200 }),
    ]},
  },

  // ──────────────────────────────────────────
  // LETTERHEADS +2 (Modern, Elegant)
  // (8.5×11 @300 = 2625×3375)
  // ──────────────────────────────────────────
  {
    id: "lh-modern", name: "Modern",
    category: "letterheads", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#ffffff", objects: [
      rect(0, 0, 2625, 8, "#2563eb", "accent_top"),
      lText(100, 80, "COMPANY", 44, { bold: true, color: "#2563eb", id: "company", width: 800 }),
      lText(1600, 80, "(416) 555-0123", 16, { color: "#6b7280", id: "phone", width: 900 }),
      lText(1600, 105, "info@company.com", 16, { color: "#6b7280", id: "email", width: 900 }),
      lText(1600, 130, "www.company.com", 16, { color: "#6b7280", id: "web", width: 900 }),
      rect(100, 180, 2425, 1, "#e5e7eb", "line"),
      rect(0, 3365, 2625, 10, "#2563eb", "accent_bottom"),
    ]},
  },
  {
    id: "lh-elegant", name: "Elegant",
    category: "letterheads", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#ffffff", objects: [
      cText(1312, 100, "COMPANY NAME", 40, { font: "Georgia", bold: true, color: "#1a1a1a", id: "company", width: 2000, extra: { charSpacing: 200 } }),
      cText(1312, 160, "Established 2020", 16, { font: "Georgia", color: "#a8a29e", id: "est", width: 1000 }),
      rect(912, 200, 800, 2, "#d4af37", "accent"),
      cText(1312, 230, "123 Main Street, Toronto ON | (416) 555-0123 | info@company.com", 14, { color: "#9ca3af", id: "contact", width: 2400 }),
      rect(100, 3250, 2425, 1, "#e5e7eb", "footer_line"),
      cText(1312, 3280, "123 Main Street, Toronto, Ontario M1M 1M1 | www.company.com", 12, { color: "#c4c4c4", id: "footer", width: 2400 }),
    ]},
  },

  // ──────────────────────────────────────────
  // BROCHURES +2 (Healthcare, Real Estate)
  // (8.5×11 @300 = 2625×3375)
  // ──────────────────────────────────────────
  {
    id: "brochure-health", name: "Healthcare Brochure",
    category: "brochures", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#ffffff", objects: [
      rect(0, 0, 2625, 900, "#0891b2", "header"),
      cText(1312, 300, "YOUR CLINIC NAME", 72, { bold: true, color: "#ffffff", id: "name", width: 2200 }),
      cText(1312, 500, "Compassionate Care for the Whole Family", 30, { color: "rgba(255,255,255,0.8)", id: "tagline", width: 2000 }),
      lText(200, 1100, "Our Services", 40, { bold: true, color: "#0891b2", id: "heading1", width: 2000 }),
      lText(200, 1200, "• Family Medicine\n• Pediatrics\n• Walk-In Clinic\n• Lab & Diagnostics", 28, { color: "#444444", id: "services", width: 2200, extra: { lineHeight: 1.6 } }),
      lText(200, 1800, "Why Choose Us?", 40, { bold: true, color: "#0891b2", id: "heading2", width: 2000 }),
      lText(200, 1900, "Experienced physicians, modern facilities, and\na commitment to your well-being.", 28, { color: "#444444", id: "why", width: 2200, extra: { lineHeight: 1.6 } }),
      cText(1312, 2800, "(416) 555-0145 | www.clinic.ca", 28, { color: "#888888", id: "contact", width: 2200 }),
    ]},
  },
  {
    id: "brochure-realestate", name: "Real Estate Brochure",
    category: "brochures", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#1e293b", objects: [
      cText(1312, 350, "LUXURY\nLIVING", 100, { bold: true, color: "#ffffff", id: "headline", width: 2200, extra: { lineHeight: 1.05 } }),
      cText(1312, 650, "Premium Condominiums in Toronto", 32, { color: "#94a3b8", id: "sub", width: 2000 }),
      rect(812, 750, 1000, 3, "#d4af37", "accent"),
      lText(200, 1000, "Starting from $599,000", 48, { bold: true, color: "#d4af37", id: "price", width: 2200 }),
      lText(200, 1200, "Features:", 32, { bold: true, color: "#ffffff", id: "heading", width: 2000 }),
      lText(200, 1300, "• Floor-to-ceiling windows\n• Designer finishes\n• Rooftop terrace\n• 24/7 concierge", 28, { color: "#cbd5e1", id: "features", width: 2200, extra: { lineHeight: 1.6 } }),
      cText(1312, 2800, "Book a viewing: (416) 555-0199 | www.luxliving.ca", 26, { color: "#64748b", id: "contact", width: 2200 }),
    ]},
  },

  // ══════════════════════════════════════════════════════════════════
  // ROUND 2 — bring every category to 3+ templates
  // ══════════════════════════════════════════════════════════════════

  // ──────────────────────────────────────────
  // FOAM BOARD SIGNS +2 (18×24 @150, center 1387)
  // ──────────────────────────────────────────
  {
    id: "foam-sign-hours", name: "Business Hours",
    category: "foam-board-signs", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#ffffff", objects: [
      rect(0, 0, 2775, 500, "#1e3a5f", "header"),
      cText(1387, 200, "BUSINESS NAME", 80, { bold: true, color: "#ffffff", id: "name", width: 2400 }),
      cText(1387, 750, "HOURS OF OPERATION", 40, { bold: true, color: "#1e3a5f", id: "heading", width: 2000, extra: { charSpacing: 150 } }),
      rect(887, 830, 1000, 3, "#1e3a5f", "line"),
      cText(1387, 1050, "Monday – Friday  9:00 AM – 6:00 PM\nSaturday  10:00 AM – 4:00 PM\nSunday  Closed", 40, { color: "#333333", id: "hours", width: 2200, extra: { lineHeight: 1.8 } }),
      cText(1387, 3200, "(416) 555-0123 | www.example.com", 30, { color: "#999999", id: "contact", width: 2000 }),
    ]},
  },
  {
    id: "foam-sign-parking", name: "Reserved Parking",
    category: "foam-board-signs", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#1e40af", objects: [
      cText(1387, 300, "P", 300, { bold: true, color: "#ffffff", id: "icon", width: 800 }),
      cText(1387, 900, "RESERVED\nPARKING", 100, { bold: true, color: "#ffffff", id: "title", width: 2400, extra: { lineHeight: 1.1 } }),
      rect(687, 1200, 1400, 4, "#ffffff", "line"),
      cText(1387, 1400, "Authorized Vehicles Only", 40, { color: "rgba(255,255,255,0.8)", id: "sub", width: 2000 }),
      cText(1387, 2800, "Violators Will Be Towed\nat Owner's Expense", 36, { bold: true, color: "#fbbf24", id: "warning", width: 2000, extra: { lineHeight: 1.4 } }),
    ]},
  },

  // ──────────────────────────────────────────
  // COUPONS +2 (3.5×2 @300 = 1125×675, center 562)
  // ──────────────────────────────────────────
  {
    id: "coupon-bogo", name: "Buy One Get One",
    category: "coupons", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#059669", objects: [
      cText(562, 100, "BOGO", 72, { bold: true, color: "#ffffff", id: "headline", width: 900, extra: { charSpacing: 200 } }),
      cText(562, 210, "Buy One, Get One FREE", 24, { bold: true, color: "#fef3c7", id: "sub", width: 900 }),
      rect(262, 270, 600, 2, "rgba(255,255,255,0.4)", "line"),
      cText(562, 340, "Present this coupon at checkout", 18, { color: "rgba(255,255,255,0.8)", id: "desc", width: 800 }),
      cText(562, 560, "Valid until Dec 31, 2026 | One per customer", 13, { color: "rgba(255,255,255,0.5)", id: "terms", width: 900 }),
    ]},
  },
  {
    id: "coupon-gift", name: "Gift Certificate",
    category: "coupons", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#fffbeb", objects: [
      cText(562, 80, "GIFT CERTIFICATE", 22, { bold: true, color: "#92400e", id: "label", width: 900, extra: { charSpacing: 200 } }),
      rect(262, 130, 600, 2, "#d4af37", "line1"),
      cText(562, 250, "$50", 80, { font: "Georgia", bold: true, color: "#111111", id: "amount", width: 600 }),
      cText(562, 400, "To: ________________", 18, { font: "Georgia", color: "#666666", id: "to", width: 700 }),
      cText(562, 450, "From: ______________", 18, { font: "Georgia", color: "#666666", id: "from", width: 700 }),
      rect(262, 530, 600, 2, "#d4af37", "line2"),
      cText(562, 580, "Business Name | www.example.com", 14, { color: "#a16207", id: "business", width: 900 }),
    ]},
  },

  // ──────────────────────────────────────────
  // TAGS +2 (2×3.5 @300 = 675×1125, center 337)
  // ──────────────────────────────────────────
  {
    id: "tag-sale", name: "Sale Tag",
    category: "tags", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#dc2626", objects: [
      cText(337, 250, "SALE", 56, { bold: true, color: "#ffffff", id: "label", width: 500, extra: { charSpacing: 200 } }),
      cText(337, 420, "50%\nOFF", 80, { bold: true, color: "#ffffff", id: "discount", width: 500, extra: { lineHeight: 1 } }),
      rect(137, 600, 300, 2, "rgba(255,255,255,0.5)", "line"),
      cText(337, 700, "Was $49.99", 18, { color: "rgba(255,255,255,0.7)", id: "was", width: 500 }),
      cText(337, 760, "Now $24.99", 22, { bold: true, color: "#ffffff", id: "now", width: 500 }),
    ]},
  },
  {
    id: "tag-gift", name: "Gift Tag",
    category: "tags", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#fdf2f8", objects: [
      cText(337, 200, "For You", 40, { font: "Georgia", bold: true, color: "#831843", id: "title", width: 500 }),
      rect(187, 280, 300, 2, "#ec4899", "accent"),
      cText(337, 400, "To: _________", 20, { font: "Georgia", color: "#9d174d", id: "to", width: 500 }),
      cText(337, 500, "From: _______", 20, { font: "Georgia", color: "#9d174d", id: "from", width: 500 }),
      cText(337, 700, "With love", 18, { font: "Georgia", color: "#f9a8d4", id: "msg", width: 400 }),
    ]},
  },

  // ──────────────────────────────────────────
  // LOYALTY CARDS +2 (3.5×2 @300 = 1125×675, center 562)
  // ──────────────────────────────────────────
  {
    id: "lc-vip", name: "VIP Card",
    category: "loyalty-cards", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#0f172a", objects: [
      cText(562, 120, "VIP", 52, { bold: true, color: "#d4af37", id: "vip", width: 400, extra: { charSpacing: 400 } }),
      cText(562, 210, "MEMBER", 20, { bold: true, color: "#d4af37", id: "label", width: 600, extra: { charSpacing: 300 } }),
      rect(312, 270, 500, 2, "#d4af37", "line"),
      cText(562, 360, "Member Name", 22, { color: "#ffffff", id: "name", width: 800 }),
      cText(562, 420, "#000 000 001", 16, { color: "#94a3b8", id: "number", width: 600 }),
      cText(562, 570, "BUSINESS NAME", 14, { bold: true, color: "#64748b", id: "company", width: 800, extra: { charSpacing: 150 } }),
    ]},
  },
  {
    id: "lc-points", name: "Points Card",
    category: "loyalty-cards", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#7c3aed", objects: [
      lText(80, 60, "REWARDS", 24, { bold: true, color: "#ffffff", id: "label", width: 500, extra: { charSpacing: 200 } }),
      lText(80, 100, "Earn points with every purchase", 14, { color: "rgba(255,255,255,0.7)", id: "sub", width: 600 }),
      cText(562, 320, "☐  ☐  ☐  ☐  ☐\n☐  ☐  ☐  ☐  ★", 36, { color: "#fbbf24", id: "stamps", width: 900, extra: { lineHeight: 1.8 } }),
      cText(562, 580, "Collect 10 stamps → FREE item!", 16, { bold: true, color: "#fbbf24", id: "reward", width: 800 }),
    ]},
  },

  // ──────────────────────────────────────────
  // INVITATION CARDS +2 (5×7 @300 = 1575×2175, center 787)
  // ──────────────────────────────────────────
  {
    id: "inv-modern", name: "Modern Invitation",
    category: "invitation-cards", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#0f172a", objects: [
      cText(787, 400, "YOU'RE\nINVITED", 72, { bold: true, color: "#ffffff", id: "title", width: 1200, extra: { lineHeight: 1.1, charSpacing: 100 } }),
      rect(487, 620, 600, 3, "#f59e0b", "accent"),
      cText(787, 750, "Event Name", 36, { bold: true, color: "#f59e0b", id: "event", width: 1200 }),
      cText(787, 950, "Saturday, March 15, 2026\n7:00 PM", 26, { color: "rgba(255,255,255,0.8)", id: "date", width: 1000, extra: { lineHeight: 1.5 } }),
      cText(787, 1250, "123 Venue Street\nToronto, ON", 22, { color: "rgba(255,255,255,0.5)", id: "venue", width: 1000, extra: { lineHeight: 1.4 } }),
      cText(787, 1800, "RSVP: info@example.com", 20, { color: "#f59e0b", id: "rsvp", width: 1000 }),
    ]},
  },
  {
    id: "inv-party", name: "Party Invitation",
    category: "invitation-cards", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#faf5ff", objects: [
      cText(787, 300, "LET'S\nCELEBRATE!", 64, { bold: true, color: "#7c3aed", id: "title", width: 1200, extra: { lineHeight: 1.1 } }),
      rect(487, 520, 600, 4, "#c084fc", "accent"),
      cText(787, 650, "You're invited to", 22, { font: "Georgia", color: "#a855f7", id: "intro", width: 1000 }),
      cText(787, 750, "Name's Birthday", 36, { font: "Georgia", bold: true, color: "#6b21a8", id: "event", width: 1200 }),
      cText(787, 950, "Saturday, March 15\nat 6:00 PM", 26, { font: "Georgia", color: "#7e22ce", id: "date", width: 1000, extra: { lineHeight: 1.4 } }),
      cText(787, 1250, "123 Party Place, Toronto", 22, { color: "#a78bfa", id: "venue", width: 1000 }),
      cText(787, 1800, "RSVP by March 1 | (416) 555-0123", 18, { color: "#c4b5fd", id: "rsvp", width: 1200 }),
    ]},
  },

  // ──────────────────────────────────────────
  // CERTIFICATES +2 (8.5×11 @300 = 2625×3375, center 1312)
  // ──────────────────────────────────────────
  {
    id: "cert-training", name: "Training",
    category: "certificates", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#ffffff", objects: [
      rect(0, 0, 2625, 200, "#1e40af", "top"),
      rect(0, 3175, 2625, 200, "#1e40af", "bottom"),
      cText(1312, 500, "CERTIFICATE OF COMPLETION", 48, { bold: true, color: "#1e40af", id: "label", width: 2200, extra: { charSpacing: 200 } }),
      rect(812, 600, 1000, 3, "#3b82f6", "line1"),
      cText(1312, 750, "This is to certify that", 26, { font: "Georgia", color: "#666666", id: "intro", width: 1500 }),
      cText(1312, 950, "Participant Name", 60, { font: "Georgia", bold: true, color: "#111111", id: "name", width: 2000 }),
      rect(612, 1060, 1400, 2, "#3b82f6", "line2"),
      cText(1312, 1200, "has successfully completed the training course", 26, { font: "Georgia", color: "#666666", id: "body1", width: 2000 }),
      cText(1312, 1350, "Course Title Here", 36, { font: "Georgia", bold: true, color: "#1e40af", id: "course", width: 2000 }),
      cText(600, 2600, "________________\nDate", 22, { font: "Georgia", color: "#666666", id: "date_line", width: 600 }),
      cText(2000, 2600, "________________\nInstructor", 22, { font: "Georgia", color: "#666666", id: "sig_line", width: 600 }),
    ]},
  },
  {
    id: "cert-award", name: "Award",
    category: "certificates", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#1a1a2e", objects: [
      rect(100, 100, 2425, 3175, "transparent", "border"),
      cText(1312, 400, "★", 120, { color: "#d4af37", id: "star", width: 400 }),
      cText(1312, 650, "AWARD OF\nEXCELLENCE", 56, { bold: true, color: "#d4af37", id: "label", width: 2000, extra: { lineHeight: 1.15, charSpacing: 150 } }),
      rect(812, 860, 1000, 2, "#d4af37", "line"),
      cText(1312, 1000, "Presented to", 26, { font: "Georgia", color: "rgba(255,255,255,0.6)", id: "intro", width: 1500 }),
      cText(1312, 1200, "Recipient Name", 60, { font: "Georgia", bold: true, color: "#ffffff", id: "name", width: 2000 }),
      cText(1312, 1450, "In recognition of outstanding achievement\nand dedication to excellence.", 26, { font: "Georgia", color: "rgba(255,255,255,0.5)", id: "body", width: 1800, extra: { lineHeight: 1.5 } }),
      cText(600, 2600, "________________\nDate", 22, { font: "Georgia", color: "#d4af37", id: "date_line", width: 600 }),
      cText(2000, 2600, "________________\nSignature", 22, { font: "Georgia", color: "#d4af37", id: "sig_line", width: 600 }),
    ]},
  },

  // ──────────────────────────────────────────
  // DOOR HANGERS +2 (4.25×11 @300 = 1350×3375, center 675)
  // ──────────────────────────────────────────
  {
    id: "dh-hotel", name: "Do Not Disturb",
    category: "door-hangers", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#1e293b", objects: [
      cText(675, 600, "DO NOT\nDISTURB", 72, { bold: true, color: "#ffffff", id: "title", width: 1100, extra: { lineHeight: 1.1 } }),
      rect(275, 850, 800, 3, "#f59e0b", "accent"),
      cText(675, 1050, "Shhh...\nGuest resting", 30, { color: "rgba(255,255,255,0.5)", id: "sub", width: 1000, extra: { lineHeight: 1.4 } }),
      cText(675, 2800, "HOTEL NAME", 22, { bold: true, color: "#f59e0b", id: "hotel", width: 1000, extra: { charSpacing: 200 } }),
    ]},
  },
  {
    id: "dh-realestate", name: "Real Estate",
    category: "door-hangers", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#ffffff", objects: [
      rect(0, 0, 1350, 600, "#1e40af", "header"),
      cText(675, 200, "SORRY WE\nMISSED YOU!", 48, { bold: true, color: "#ffffff", id: "title", width: 1100, extra: { lineHeight: 1.1 } }),
      cText(675, 450, "Your Real Estate Agent", 20, { color: "rgba(255,255,255,0.8)", id: "sub", width: 1000 }),
      lText(100, 780, "Agent Name", 32, { bold: true, color: "#1e40af", id: "agent", width: 1100 }),
      lText(100, 850, "Brokerage Name", 20, { color: "#666666", id: "broker", width: 1100 }),
      lText(100, 1050, "I stopped by to let you know about\nrecent activity in your neighbourhood.", 22, { color: "#333333", id: "body", width: 1100, extra: { lineHeight: 1.5 } }),
      cText(675, 2700, "(416) 555-0123", 36, { bold: true, color: "#1e40af", id: "phone", width: 1000 }),
      cText(675, 2850, "agent@realty.com", 20, { color: "#666666", id: "email", width: 1000 }),
    ]},
  },

  // ──────────────────────────────────────────
  // TICKETS +2 (5.5×2 @300 = 1725×675, left ~80)
  // ──────────────────────────────────────────
  {
    id: "ticket-raffle", name: "Raffle Ticket",
    category: "tickets", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#7c3aed", objects: [
      lText(80, 80, "RAFFLE", 48, { bold: true, color: "#ffffff", id: "label", width: 600 }),
      lText(80, 160, "Annual Fundraiser 2026", 20, { color: "rgba(255,255,255,0.7)", id: "event", width: 800 }),
      lText(80, 350, "Name: ___________________", 18, { color: "rgba(255,255,255,0.8)", id: "name", width: 800 }),
      lText(80, 420, "Phone: __________________", 18, { color: "rgba(255,255,255,0.8)", id: "phone", width: 800 }),
      rect(1200, 0, 3, 675, "rgba(255,255,255,0.3)", "divider"),
      cText(1450, 180, "KEEP\nTHIS\nSTUB", 32, { bold: true, color: "#fbbf24", id: "stub", width: 400, extra: { lineHeight: 1.2 } }),
      cText(1450, 480, "#0001", 24, { color: "rgba(255,255,255,0.6)", id: "num", width: 300 }),
    ]},
  },
  {
    id: "ticket-movie", name: "Movie Night",
    category: "tickets", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#0a0a0a", objects: [
      lText(80, 80, "MOVIE NIGHT", 40, { bold: true, color: "#ef4444", id: "title", width: 800 }),
      lText(80, 160, "Film Title Here", 24, { color: "#ffffff", id: "film", width: 800 }),
      lText(80, 350, "Date: March 15, 2026", 18, { color: "#9ca3af", id: "date", width: 600 }),
      lText(80, 400, "Time: 7:30 PM | Screen 1", 18, { color: "#9ca3af", id: "time", width: 600 }),
      rect(1200, 0, 3, 675, "rgba(255,255,255,0.15)", "divider"),
      cText(1450, 200, "ADMIT\nONE", 36, { bold: true, color: "#ef4444", id: "admit", width: 400, extra: { lineHeight: 1.2 } }),
      cText(1450, 450, "Seat A12", 18, { color: "#6b7280", id: "seat", width: 300 }),
    ]},
  },

  // ──────────────────────────────────────────
  // NOTEPADS +2 (5.5×8.5 @300 = 1725×2625)
  // ──────────────────────────────────────────
  {
    id: "notepad-todo", name: "To-Do List",
    category: "notepads", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#ffffff", objects: [
      lText(100, 80, "TO-DO LIST", 36, { bold: true, color: "#111111", id: "title", width: 800 }),
      rect(100, 140, 1525, 2, "#111111", "line"),
      lText(100, 200, "Date: _____________", 18, { color: "#999999", id: "date", width: 800 }),
      lText(100, 320, "☐  ________________________________\n\n☐  ________________________________\n\n☐  ________________________________\n\n☐  ________________________________\n\n☐  ________________________________\n\n☐  ________________________________\n\n☐  ________________________________", 20, { color: "#d1d5db", id: "items", width: 1500, extra: { lineHeight: 1.3 } }),
    ]},
  },
  {
    id: "notepad-meeting", name: "Meeting Notes",
    category: "notepads", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#ffffff", objects: [
      rect(0, 0, 1725, 120, "#1e40af", "header"),
      cText(862, 45, "MEETING NOTES", 28, { bold: true, color: "#ffffff", id: "title", width: 1400, extra: { charSpacing: 200 } }),
      lText(100, 170, "Date: _____________  Subject: _________________________", 16, { color: "#6b7280", id: "meta", width: 1500 }),
      lText(100, 230, "Attendees: ____________________________________________", 16, { color: "#6b7280", id: "attendees", width: 1500 }),
      rect(100, 290, 1525, 1, "#e5e7eb", "line"),
      lText(100, 340, "Action Items:", 20, { bold: true, color: "#1e40af", id: "heading", width: 800 }),
    ]},
  },

  // ──────────────────────────────────────────
  // TABLE TENTS +2 (4×6 @300 = 1275×1875, center 637)
  // ──────────────────────────────────────────
  {
    id: "tt-qr", name: "QR Menu",
    category: "table-tents", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#1a1a1a", objects: [
      cText(637, 250, "SCAN TO\nSEE MENU", 48, { bold: true, color: "#ffffff", id: "title", width: 1000, extra: { lineHeight: 1.1 } }),
      rect(387, 500, 500, 500, "#ffffff", "qr_area"),
      cText(637, 720, "QR Code\nHere", 28, { color: "#999999", id: "qr_placeholder", width: 400 }),
      cText(637, 1300, "Point your camera at the code\nto view our full menu", 20, { color: "rgba(255,255,255,0.6)", id: "instructions", width: 1000, extra: { lineHeight: 1.4 } }),
      cText(637, 1600, "RESTAURANT NAME", 22, { bold: true, color: "#d4af37", id: "name", width: 1000, extra: { charSpacing: 150 } }),
    ]},
  },
  {
    id: "tt-reserved", name: "Reserved",
    category: "table-tents", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#1e293b", objects: [
      cText(637, 500, "RESERVED", 56, { bold: true, color: "#d4af37", id: "title", width: 1000, extra: { charSpacing: 200 } }),
      rect(287, 600, 700, 2, "#d4af37", "line"),
      cText(637, 750, "This table is reserved for", 22, { font: "Georgia", color: "rgba(255,255,255,0.6)", id: "sub", width: 1000 }),
      cText(637, 850, "Guest Name", 32, { font: "Georgia", bold: true, color: "#ffffff", id: "name", width: 1000 }),
      cText(637, 1500, "RESTAURANT NAME", 18, { bold: true, color: "#64748b", id: "restaurant", width: 1000, extra: { charSpacing: 150 } }),
    ]},
  },

  // ──────────────────────────────────────────
  // INSERTS-PACKAGING +2 (4×6 @300 = 1275×1875, center 637)
  // ──────────────────────────────────────────
  {
    id: "insert-care", name: "Care Instructions",
    category: "inserts-packaging", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#ffffff", objects: [
      cText(637, 200, "CARE\nINSTRUCTIONS", 40, { bold: true, color: "#111111", id: "title", width: 1000, extra: { lineHeight: 1.1, charSpacing: 100 } }),
      rect(337, 340, 600, 2, "#111111", "line"),
      lText(100, 450, "• Machine wash cold\n• Tumble dry low\n• Do not bleach\n• Iron on low heat\n• Do not dry clean", 22, { color: "#444444", id: "instructions", width: 1000, extra: { lineHeight: 1.8 } }),
      cText(637, 1300, "Questions? Contact us at\ncare@example.com", 18, { color: "#999999", id: "contact", width: 1000, extra: { lineHeight: 1.4 } }),
      cText(637, 1600, "BRAND NAME", 18, { bold: true, color: "#111111", id: "brand", width: 800, extra: { charSpacing: 200 } }),
    ]},
  },
  {
    id: "insert-discount", name: "Discount Insert",
    category: "inserts-packaging", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#f0fdf4", objects: [
      cText(637, 300, "ENJOY", 28, { bold: true, color: "#166534", id: "intro", width: 800, extra: { charSpacing: 200 } }),
      cText(637, 450, "20% OFF", 72, { bold: true, color: "#059669", id: "discount", width: 1000 }),
      cText(637, 600, "Your Next Order", 28, { color: "#15803d", id: "sub", width: 800 }),
      rect(337, 680, 600, 3, "#22c55e", "line"),
      cText(637, 780, "Use code:", 20, { color: "#666666", id: "label", width: 600 }),
      cText(637, 860, "NEXT20", 40, { bold: true, color: "#111111", id: "code", width: 600, extra: { charSpacing: 200 } }),
      cText(637, 1500, "www.example.com", 18, { color: "#999999", id: "web", width: 800 }),
    ]},
  },

  // ──────────────────────────────────────────
  // ENVELOPES +2 (9.5×4.125 @300 = 2925×1313)
  // ──────────────────────────────────────────
  {
    id: "env-elegant", name: "Elegant",
    category: "envelopes", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#ffffff", objects: [
      lText(100, 80, "Company Name", 28, { font: "Georgia", bold: true, color: "#111111", id: "company", width: 1000 }),
      lText(100, 125, "123 Main Street, Toronto, ON M1M 1M1", 16, { font: "Georgia", color: "#888888", id: "addr", width: 1400 }),
      rect(100, 165, 300, 2, "#d4af37", "accent"),
    ]},
  },
  {
    id: "env-colorful", name: "Color Block",
    category: "envelopes", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#ffffff", objects: [
      rect(0, 0, 2925, 80, "#3b82f6", "stripe"),
      lText(100, 120, "COMPANY NAME", 24, { bold: true, color: "#3b82f6", id: "company", width: 1000, extra: { charSpacing: 100 } }),
      lText(100, 165, "123 Main Street, Toronto, ON M1M 1M1", 16, { color: "#6b7280", id: "addr", width: 1400 }),
      lText(100, 195, "(416) 555-0123 | info@example.com", 14, { color: "#9ca3af", id: "contact", width: 1400 }),
    ]},
  },

  // ──────────────────────────────────────────
  // PRESENTATION FOLDERS +2 (9×12 @300 = 2775×3675, center 1387)
  // ──────────────────────────────────────────
  {
    id: "folder-modern", name: "Modern Folder",
    category: "presentation-folders", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#ffffff", objects: [
      rect(0, 0, 200, 3675, "#2563eb", "sidebar"),
      lText(350, 1100, "COMPANY\nNAME", 100, { bold: true, color: "#111111", id: "company", width: 2000, extra: { lineHeight: 1.05 } }),
      rect(350, 1400, 400, 6, "#2563eb", "accent"),
      lText(350, 1500, "Your tagline or description\ngoes right here.", 30, { color: "#666666", id: "tagline", width: 2000, extra: { lineHeight: 1.5 } }),
      lText(350, 3200, "www.example.com | (416) 555-0123", 22, { color: "#999999", id: "contact", width: 2000 }),
    ]},
  },
  {
    id: "folder-elegant", name: "Elegant Folder",
    category: "presentation-folders", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#1a1a2e", objects: [
      cText(1387, 1200, "COMPANY\nNAME", 110, { font: "Georgia", bold: true, color: "#d4af37", id: "company", width: 2200, extra: { lineHeight: 1.1 } }),
      rect(887, 1550, 1000, 2, "#d4af37", "line"),
      cText(1387, 1700, "Professional Excellence", 32, { font: "Georgia", color: "rgba(255,255,255,0.5)", id: "tagline", width: 2000 }),
      cText(1387, 3300, "www.example.com", 24, { color: "rgba(255,255,255,0.3)", id: "web", width: 1500 }),
    ]},
  },

  // ──────────────────────────────────────────
  // BANNERS +2 (48×24 @150 large = 7275×3675, center 3637)
  // ──────────────────────────────────────────
  {
    id: "banner-welcome", name: "Welcome",
    category: "banners", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#059669", objects: [
      cText(3637, 800, "WELCOME", 220, { bold: true, color: "#ffffff", id: "headline", width: 6500, extra: { charSpacing: 200 } }),
      cText(3637, 1300, "We're glad you're here!", 80, { color: "rgba(255,255,255,0.8)", id: "sub", width: 5000 }),
      rect(2137, 1600, 3000, 4, "rgba(255,255,255,0.4)", "line"),
      cText(3637, 2500, "BUSINESS NAME", 60, { bold: true, color: "#fbbf24", id: "name", width: 5000, extra: { charSpacing: 150 } }),
    ]},
  },
  {
    id: "banner-birthday", name: "Happy Birthday",
    category: "banners", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#7c3aed", objects: [
      cText(3637, 700, "HAPPY BIRTHDAY", 200, { bold: true, color: "#ffffff", id: "headline", width: 6500, extra: { charSpacing: 80 } }),
      cText(3637, 1300, "Name!", 160, { font: "Georgia", bold: true, color: "#fbbf24", id: "name", width: 5000 }),
      cText(3637, 2500, "Wishing you the best day ever!", 60, { color: "rgba(255,255,255,0.7)", id: "msg", width: 5000 }),
    ]},
  },

  // ──────────────────────────────────────────
  // X-BANNER STANDS +2 (24×63 @150 large, center 1819)
  // ──────────────────────────────────────────
  {
    id: "xbanner-realestate", name: "Real Estate",
    category: "x-banner-stands", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#1e3a5f", objects: [
      cText(1819, 800, "FIND YOUR\nDREAM\nHOME", 160, { bold: true, color: "#ffffff", id: "title", width: 3000, extra: { lineHeight: 1.05 } }),
      rect(819, 1700, 2000, 4, "#fbbf24", "accent"),
      cText(1819, 2000, "Agent Name", 80, { bold: true, color: "#fbbf24", id: "agent", width: 3000 }),
      cText(1819, 2300, "Brokerage Name", 50, { color: "rgba(255,255,255,0.7)", id: "broker", width: 3000 }),
      cText(1819, 4000, "Buying • Selling • Investing", 60, { color: "rgba(255,255,255,0.6)", id: "services", width: 3000 }),
      cText(1819, 7500, "(416) 555-0123", 70, { bold: true, color: "#fbbf24", id: "phone", width: 3000 }),
      cText(1819, 7800, "agent@realty.com | www.agent.ca", 40, { color: "rgba(255,255,255,0.5)", id: "contact", width: 3000 }),
    ]},
  },
  {
    id: "xbanner-fitness", name: "Fitness",
    category: "x-banner-stands", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#0a0a0a", objects: [
      cText(1819, 800, "GET\nFIT", 200, { bold: true, color: "#ffffff", id: "title", width: 3000, extra: { lineHeight: 1 } }),
      cText(1819, 1500, "TODAY", 120, { bold: true, color: "#ef4444", id: "sub", width: 3000 }),
      rect(819, 1800, 2000, 4, "#ef4444", "line"),
      cText(1819, 2200, "First Month FREE", 70, { bold: true, color: "#fbbf24", id: "offer", width: 3000 }),
      cText(1819, 4000, "Personal Training\n\nGroup Classes\n\nOpen 24/7", 60, { color: "#ffffff", id: "features", width: 3000, extra: { lineHeight: 1.8 } }),
      cText(1819, 7500, "GYM NAME", 80, { bold: true, color: "#ef4444", id: "name", width: 3000 }),
      cText(1819, 7800, "www.gym.com | (416) 555-0123", 40, { color: "#6b7280", id: "contact", width: 3000 }),
    ]},
  },

  // ──────────────────────────────────────────
  // SIGNS +2 (18×24 @150 sign, center 1387)
  // ──────────────────────────────────────────
  {
    id: "sign-safety", name: "Safety Notice",
    category: "signs", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#fbbf24", objects: [
      rect(0, 0, 2775, 500, "#111111", "header"),
      cText(1387, 200, "⚠  WARNING", 100, { bold: true, color: "#fbbf24", id: "title", width: 2400 }),
      cText(1387, 800, "HARD HAT\nAREA", 120, { bold: true, color: "#111111", id: "message", width: 2400, extra: { lineHeight: 1.05 } }),
      rect(687, 1200, 1400, 4, "#111111", "line"),
      cText(1387, 1400, "All personnel must wear\nprotective equipment\nbeyond this point.", 40, { color: "#333333", id: "body", width: 2200, extra: { lineHeight: 1.5 } }),
    ]},
  },
  {
    id: "sign-welcome", name: "Welcome Sign",
    category: "signs", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#ffffff", objects: [
      cText(1387, 500, "WELCOME TO", 40, { color: "#666666", id: "intro", width: 2000, extra: { charSpacing: 200 } }),
      cText(1387, 800, "BUSINESS\nNAME", 120, { bold: true, color: "#111111", id: "name", width: 2400, extra: { lineHeight: 1.05 } }),
      rect(887, 1150, 1000, 4, "#2563eb", "accent"),
      cText(1387, 1350, "Please check in at the\nfront desk upon arrival.", 36, { color: "#666666", id: "body", width: 2200, extra: { lineHeight: 1.5 } }),
      cText(1387, 2800, "Reception: (416) 555-0123", 30, { color: "#999999", id: "phone", width: 2000 }),
    ]},
  },

  // ──────────────────────────────────────────
  // SHELF DISPLAYS +2 (4×5 @300 = 1275×1575, center 637)
  // ──────────────────────────────────────────
  {
    id: "shelf-new", name: "New Arrival",
    category: "shelf-displays", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#1e40af", objects: [
      cText(637, 200, "NEW", 72, { bold: true, color: "#fbbf24", id: "badge", width: 1000, extra: { charSpacing: 200 } }),
      cText(637, 380, "ARRIVAL", 52, { bold: true, color: "#ffffff", id: "label", width: 1000, extra: { charSpacing: 200 } }),
      rect(337, 480, 600, 3, "#fbbf24", "line"),
      cText(637, 600, "Product\nName", 40, { bold: true, color: "#ffffff", id: "product", width: 1000, extra: { lineHeight: 1.1 } }),
      cText(637, 900, "$19.99", 56, { bold: true, color: "#fbbf24", id: "price", width: 800 }),
      cText(637, 1200, "Try it today!", 24, { color: "rgba(255,255,255,0.7)", id: "cta", width: 800 }),
    ]},
  },
  {
    id: "shelf-best", name: "Best Seller",
    category: "shelf-displays", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#fbbf24", objects: [
      cText(637, 150, "★ BEST SELLER ★", 32, { bold: true, color: "#111111", id: "badge", width: 1100 }),
      rect(187, 220, 900, 3, "#111111", "line"),
      cText(637, 400, "Product\nName", 48, { bold: true, color: "#111111", id: "product", width: 1000, extra: { lineHeight: 1.1 } }),
      cText(637, 750, "$14.99", 64, { bold: true, color: "#dc2626", id: "price", width: 800 }),
      cText(637, 1050, "Customer Favourite!", 24, { bold: true, color: "#333333", id: "cta", width: 800 }),
      cText(637, 1300, "While supplies last", 18, { color: "#666666", id: "note", width: 800 }),
    ]},
  },

  // ──────────────────────────────────────────
  // GREETING CARDS +1 (5×7 @300 = 1575×2175, center 787)
  // ──────────────────────────────────────────
  {
    id: "gc-congrats", name: "Congratulations",
    category: "greeting-cards", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#f0fdf4", objects: [
      cText(787, 500, "Congrats!", 72, { font: "Georgia", bold: true, color: "#059669", id: "title", width: 1200 }),
      rect(487, 630, 600, 3, "#22c55e", "accent"),
      cText(787, 760, "So proud of your\nachievement!", 32, { font: "Georgia", color: "#15803d", id: "msg", width: 1200, extra: { lineHeight: 1.4 } }),
      cText(787, 1600, "You deserve it all.", 24, { font: "Georgia", color: "#86efac", id: "sub", width: 1000 }),
    ]},
  },

  // ──────────────────────────────────────────
  // RACK CARDS +1 (4×9 @300 = 1275×2775, center 637)
  // ──────────────────────────────────────────
  {
    id: "rc-menu", name: "Menu Highlights",
    category: "rack-cards", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#1c1917", objects: [
      cText(637, 200, "OUR MENU", 40, { bold: true, color: "#d4af37", id: "title", width: 1000, extra: { charSpacing: 200 } }),
      rect(337, 280, 600, 2, "#d4af37", "line1"),
      lText(100, 400, "STARTERS", 22, { bold: true, color: "#d4af37", id: "cat1", width: 800 }),
      lText(100, 450, "Soup of the Day ........... $8\nBruschetta ................... $12", 18, { color: "#d6d3d1", id: "items1", width: 1000 }),
      lText(100, 700, "MAINS", 22, { bold: true, color: "#d4af37", id: "cat2", width: 800 }),
      lText(100, 750, "Grilled Salmon ............ $28\nPasta Primavera .......... $22", 18, { color: "#d6d3d1", id: "items2", width: 1000 }),
      lText(100, 1000, "DESSERTS", 22, { bold: true, color: "#d4af37", id: "cat3", width: 800 }),
      lText(100, 1050, "Tiramisu ...................... $12\nCheesecake ................. $11", 18, { color: "#d6d3d1", id: "items3", width: 1000 }),
      cText(637, 2450, "RESTAURANT NAME", 22, { bold: true, color: "#d4af37", id: "name", width: 1000, extra: { charSpacing: 150 } }),
      cText(637, 2530, "(416) 555-0123", 20, { color: "#a8a29e", id: "phone", width: 1000 }),
    ]},
  },

  // ──────────────────────────────────────────
  // BOOKMARKS +1 (2×6 @300 = 675×1875, center 337)
  // ──────────────────────────────────────────
  {
    id: "bm-motivational", name: "Motivational",
    category: "bookmarks", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#0f172a", objects: [
      cText(337, 400, "DREAM\nBIG", 56, { bold: true, color: "#f59e0b", id: "title", width: 500, extra: { lineHeight: 1.1 } }),
      cText(337, 620, "WORK\nHARD", 56, { bold: true, color: "#3b82f6", id: "mid", width: 500, extra: { lineHeight: 1.1 } }),
      cText(337, 840, "STAY\nFOCUSED", 56, { bold: true, color: "#22c55e", id: "bottom", width: 500, extra: { lineHeight: 1.1 } }),
      rect(187, 1050, 300, 2, "#ffffff", "line"),
      cText(337, 1150, "You've got this.", 18, { font: "Georgia", color: "rgba(255,255,255,0.5)", id: "sub", width: 500 }),
    ]},
  },

  // ──────────────────────────────────────────
  // STICKER SHEETS +1 (8.5×11 @300 = 2625×3375)
  // ──────────────────────────────────────────
  {
    id: "ss-address", name: "Address Labels",
    category: "sticker-sheets", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#ffffff", objects: [
      lText(100, 100, "COMPANY NAME", 24, { bold: true, color: "#111111", id: "name1", width: 1100 }),
      lText(100, 140, "123 Main Street, Toronto, ON M1M 1M1", 16, { color: "#666666", id: "addr1", width: 1100 }),
      lText(1400, 100, "COMPANY NAME", 24, { bold: true, color: "#111111", id: "name2", width: 1100 }),
      lText(1400, 140, "123 Main Street, Toronto, ON M1M 1M1", 16, { color: "#666666", id: "addr2", width: 1100 }),
      lText(100, 500, "COMPANY NAME", 24, { bold: true, color: "#111111", id: "name3", width: 1100 }),
      lText(100, 540, "123 Main Street, Toronto, ON M1M 1M1", 16, { color: "#666666", id: "addr3", width: 1100 }),
      lText(1400, 500, "COMPANY NAME", 24, { bold: true, color: "#111111", id: "name4", width: 1100 }),
      lText(1400, 540, "123 Main Street, Toronto, ON M1M 1M1", 16, { color: "#666666", id: "addr4", width: 1100 }),
      cText(1312, 3100, "Customize text — addresses will repeat across the sheet", 20, { color: "#d1d5db", id: "hint", width: 2400 }),
    ]},
  },

  // ──────────────────────────────────────────
  // INDUSTRIAL LABELS +1 (4×6 @300 = 1275×1875, center 637)
  // ──────────────────────────────────────────
  {
    id: "il-inventory", name: "Inventory",
    category: "industrial-labels", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#ffffff", objects: [
      rect(0, 0, 1275, 200, "#f97316", "header"),
      cText(637, 70, "WAREHOUSE INVENTORY", 30, { bold: true, color: "#ffffff", id: "title", width: 1100, extra: { charSpacing: 100 } }),
      lText(100, 320, "Item:", 28, { bold: true, color: "#333333", id: "l1", width: 250 }),
      lText(400, 320, "___________________", 28, { color: "#999999", id: "item", width: 700 }),
      lText(100, 450, "Location:", 28, { bold: true, color: "#333333", id: "l2", width: 250 }),
      lText(400, 450, "___________________", 28, { color: "#999999", id: "loc", width: 700 }),
      lText(100, 580, "Qty:", 28, { bold: true, color: "#333333", id: "l3", width: 250 }),
      lText(400, 580, "___________________", 28, { color: "#999999", id: "qty", width: 700 }),
      lText(100, 710, "Date:", 28, { bold: true, color: "#333333", id: "l4", width: 250 }),
      lText(400, 710, "___________________", 28, { color: "#999999", id: "date", width: 700 }),
      rect(100, 900, 1075, 120, "#e5e7eb", "barcode_area"),
      cText(637, 930, "||||||||||||||||||||||||||||||||||||", 52, { bold: true, color: "#111111", id: "bars", width: 1000 }),
    ]},
  },

  // ──────────────────────────────────────────
  // SAFETY LABELS +1 (4×6 @300 = 1275×1875, center 637)
  // ──────────────────────────────────────────
  {
    id: "sl-danger", name: "Danger",
    category: "safety-labels", editorMode: "single", thumbnailUrl: null,
    canvasJSON: { version: "6.0.0", backgroundColor: "#ffffff", objects: [
      rect(0, 0, 1275, 300, "#dc2626", "header"),
      cText(637, 120, "DANGER", 80, { bold: true, color: "#ffffff", id: "title", width: 1100, extra: { charSpacing: 200 } }),
      cText(637, 520, "HIGH\nVOLTAGE", 72, { bold: true, color: "#dc2626", id: "hazard", width: 1000, extra: { lineHeight: 1.05 } }),
      cText(637, 850, "Keep Out", 40, { bold: true, color: "#111111", id: "action", width: 800 }),
      rect(200, 950, 875, 3, "#dc2626", "line"),
      cText(637, 1100, "Authorized personnel only.\nContact kills.", 28, { color: "#333333", id: "body", width: 1000, extra: { lineHeight: 1.5 } }),
    ]},
  },
];

// ═══════════════════════════════════════════════════════════════
// VARIANT SLUG → BASE CATEGORY MAPPING
// ═══════════════════════════════════════════════════════════════
const CATEGORY_ALIASES = {
  // Business card variants → business-cards
  "business-cards-classic": "business-cards",
  "business-cards-gloss": "business-cards",
  "business-cards-matte": "business-cards",
  "business-cards-thick": "business-cards",
  "business-cards-linen": "business-cards",
  "business-cards-pearl": "business-cards",
  "business-cards-soft-touch": "business-cards",
  "business-cards-gold-foil": "business-cards",
  "magnets-business-card": "business-cards",
  // Sticker variants → die-cut-stickers
  "kiss-cut-stickers": "die-cut-stickers",
  "sticker-sheets": "sticker-sheets",
  "sticker-rolls": "roll-labels",
  "roll-labels": "roll-labels",
  "decals": "die-cut-stickers",
  "industrial-labels": "industrial-labels",
  "safety-labels": "safety-labels",
  // Banner variants → vinyl-banners
  "mesh-banners": "vinyl-banners",
  "fabric-banners": "vinyl-banners",
  "flags": "vinyl-banners",
  "backdrops": "vinyl-banners",
  // Sign variants → yard-signs / foam-board-signs
  "a-frame-signs": "yard-signs",
  "aluminum-signs": "foam-board-signs",
  "pvc-signs": "foam-board-signs",
  "magnetic-signs": "foam-board-signs",
  // Vehicle variants
  "vehicle-wraps": "vehicle-decals",
  "vehicle": "vehicle-decals",
  "vinyl-lettering": "vehicle-decals",
  // Surface graphics
  "window-films": "vinyl-banners",
  "wall-floor-graphics": "vinyl-banners",
  // Document variants → flyers (same 8.5×11)
  "waivers-releases": "flyers",
  "order-forms": "flyers",
  // Misc
  "retail-tags": "tags",
  "stamps": "coupons",
  "tabletop-displays": "posters",
  "calendars": "flyers",
  "letterhead": "letterheads",
  "canvas": "canvas-prints",
};

export function getTemplateCategory(slug) {
  return CATEGORY_ALIASES[slug] || slug || "business-cards";
}

export function getDesignTemplate(id) {
  return DESIGN_TEMPLATES.find((t) => t.id === id) || null;
}

export function getDesignTemplatesByCategory(category) {
  return DESIGN_TEMPLATES.filter((t) => t.category === category);
}

export function getAllDesignTemplates() {
  return DESIGN_TEMPLATES;
}
