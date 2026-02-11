// config/products.js

// ==========================================
// 1. TEMPLATES (Commercial Grade - GTA Market Ready)
// ==========================================

// --- A. STICKERS: Die-Cut Singles (Premium) ---
// Selling points: "Individually cut", "Hand sorted", "Premium Vinyl"
const TPL_STICKER_SINGLE = {
  pricingModel: "area_tier",
  config: {
    minimumPrice: 50.00, // Higher min for manual labor
    fileFee: 5.00,
    tiers: [
      { upTo: 500, rate: 0.045 },  // Premium rate (~$6.50/sqft)
      { upTo: 1500, rate: 0.035 },
      { upTo: 5000, rate: 0.025 },
      { upTo: 99999, rate: 0.020 }
    ]
  },
  options: {
    addons: [
      { id: "holographic", name: "Holographic Upgrade", price: 0.02, type: "per_area", description: "Rainbow metal effect" },
      { id: "matte_lamination", name: "Matte Finish", price: 0.00, type: "flat", description: "Free upgrade from Gloss" }
    ]
  }
};

// --- B. STICKERS: Sheets (Budget) ---
// Selling points: "Budget friendly", "Peel & Stick", "Fast turnaround"
const TPL_STICKER_SHEET = {
  pricingModel: "unit_flat",
  config: {
    minimumPrice: 30.00, // Lower min for automation
    unitPrice: 15.00,    // Per 12x18 Sheet
    fileFee: 5.00
  },
  options: {
    addons: []
  }
};

// --- C. SIGNS: Coroplast (Commodity) ---
const TPL_SIGN_COROPLAST = {
  pricingModel: "fixed_size_tier",
  config: {
    minimumPrice: 45.00,
    fileFee: 5.00,
    sizes: [
      {
        label: "12x18",
        tiers: [
          { qty: 1, price: 18.00 }, { qty: 10, price: 9.50 }, { qty: 25, price: 7.50 }, { qty: 50, price: 6.25 }, { qty: 100, price: 5.50 }
        ]
      },
      {
        label: "18x24", // The Standard
        tiers: [
          { qty: 1, price: 25.00 }, { qty: 10, price: 12.50 }, { qty: 25, price: 10.50 }, { qty: 50, price: 8.50 }, { qty: 100, price: 7.25 }
        ]
      },
      {
        label: "24x36",
        tiers: [
          { qty: 1, price: 45.00 }, { qty: 10, price: 28.00 }, { qty: 25, price: 22.00 }, { qty: 50, price: 18.00 }
        ]
      }
    ]
  },
  options: {
    addons: [
      { id: "h_stakes", name: "H-Wire Stakes", price: 2.50, type: "per_unit", description: "Galvanized step stakes" },
      { id: "grommets", name: "Grommets (Cnrs)", price: 2.00, type: "per_unit", description: "4 Corner Grommets" }
    ]
  }
};

// --- D. SIGNS: Custom Rigid (Foam/Alu) ---
const TPL_SIGN_CUSTOM = {
  pricingModel: "area_tier",
  config: {
    minimumPrice: 60.00, // Setup is heavy for rigid boards
    fileFee: 10.00,
    tiers: [
      { upTo: 1000, rate: 0.055 }, // ~$8/sqft (Foam)
      { upTo: 5000, rate: 0.045 },
      { upTo: 99999, rate: 0.035 }
    ]
  },
  options: {
    addons: [
      { id: "drilled_holes", name: "Drilled Holes (4)", price: 5.00, type: "per_unit", description: "For wall mounting" }
    ]
  }
};

// --- E. BANNERS: Vinyl 13oz (Competitive) ---
const TPL_BANNER = {
  pricingModel: "area_tier",
  config: {
    minimumPrice: 50.00,
    fileFee: 0.00,
    // Target: $6.50 - $7.00 / sqft for small runs
    tiers: [
      { upTo: 1440, rate: 0.048 }, // <10 sqft (~$6.90/sqft)
      { upTo: 7200, rate: 0.040 }, // <50 sqft (~$5.75/sqft)
      { upTo: 99999, rate: 0.035 } // Bulk
    ]
  },
  options: {
    addons: [
      // Explicitly stating Included creates value
      { id: "hems_grommets", name: "Hems & Grommets", price: 0.00, type: "flat", description: "Included (Every 2-3ft)" },
      { id: "pole_pockets", name: "Pole Pockets", price: 20.00, type: "flat", description: "Top & Bottom pockets (No grommets)" }
    ]
  }
};

// ==========================================
// 2. PRODUCT LISTS

// --- Stamps: Self-Inking (size-based, with text editor preview) ---
// Pricing is intended to be configured per size via options.sizes[].unitCents.
// Until unitCents is filled in, the storefront will show "Quote" and /api/quote will return 422 for this SKU.
const PROD_SELF_INKING_STAMPS = {
  category: "marketing-prints",
  product: "self-inking-stamps",
  name: "Self-Inking Stamps (S/R Series)",
  description: "Fast, clean, and consistent self-inking stamps. Choose a model/size, enter your text (multi-line supported), and optionally upload a logo. Replacement pads available by model.",
  status: "draft",
  pricingUnit: "per_piece",
  config: { minimumPrice: 0 },
  options: {
    editor: {
      type: "text",
      mode: "box",
      defaultText: "YOUR COMPANY\nPHONE",
      defaultColor: "#111111",
      fonts: ["Helvetica", "Arial", "sans-serif"],
      sizes: [
        {
          label: "S-827",
          shape: "rect",
          widthIn: 1.1875,
          heightIn: 2.0,
          mm: { w: 30, h: 50 },
          type: "Rectangular Self-Inking Stamp (Printer Line)",
          replacementPad: "S-827-7",
          unitCents: 3999,
        },
        {
          label: "S-510",
          shape: "rect",
          widthIn: 0.5,
          heightIn: 0.5,
          mm: { w: 12, h: 12 },
          type: "Square Self-Inking Stamp (Printer Line)",
          details: "Black top, clear bottom",
          replacementPad: "S-510-7",
          unitCents: 1999,
        },
        {
          label: "S-520",
          shape: "rect",
          widthIn: 0.75,
          heightIn: 0.75,
          mm: { w: 20, h: 20 },
          type: "Square Self-Inking Stamp",
          details: "Black top, clear bottom",
          replacementPad: "S-520-7",
          unitCents: 2499,
        },
        {
          label: "S-542",
          shape: "rect",
          widthIn: 1.625,
          heightIn: 1.625,
          mm: { w: 42, h: 42 },
          type: "Square Self-Inking Stamp",
          details: "Black top",
          replacementPad: "S-542-7",
          unitCents: 4499,
        },
        {
          label: "R-512",
          shape: "round",
          diameterIn: 0.5,
          mm: { d: 12 },
          type: "Round Self-Inking Stamp",
          details: "Black top",
          replacementPad: "R-512-7",
          unitCents: 1999,
        },
        {
          label: "R-524",
          shape: "round",
          diameterIn: 1.0,
          mm: { d: 24 },
          type: "Round Self-Inking Stamp",
          details: "Black top, clear bottom",
          replacementPad: "R-524-7",
          unitCents: 2799,
        },
        {
          label: "R-532",
          shape: "round",
          diameterIn: 1.25,
          mm: { d: 32 },
          type: "Round Self-Inking Stamp",
          details: "Black top",
          replacementPad: "R-532-7",
          unitCents: 3499,
        },
        {
          label: "R-552",
          shape: "round",
          diameterIn: 2.0,
          mm: { d: 52 },
          type: "Round Self-Inking Stamp",
          details: "Black top",
          replacementPad: "R-552-7",
          unitCents: 5999,
        },
      ],
    },
    // Mirror sizes at top-level so /api/quote fallback can find them even if editor wrapper changes.
    sizes: [
      { label: "S-827", unitCents: 3999 },
      { label: "S-510", unitCents: 1999 },
      { label: "S-520", unitCents: 2499 },
      { label: "S-542", unitCents: 4499 },
      { label: "R-512", unitCents: 1999 },
      { label: "R-524", unitCents: 2799 },
      { label: "R-532", unitCents: 3499 },
      { label: "R-552", unitCents: 5999 },
    ],
  },
};
// ==========================================

const stickerList = [
  { 
    id: "die-cut-singles", 
    name: "Die-Cut Stickers (Singles)", 
    template: TPL_STICKER_SINGLE,
    override: { description: "Individually cut, waterproof vinyl. Hand-sorted." }
  },
  { 
    id: "sticker-sheets", 
    name: "Sticker Sheets (12x18)", 
    template: TPL_STICKER_SHEET, // Uses Unit Flat model
    override: { description: "Multiple kiss-cut stickers on a single sheet. Budget friendly." }
  },
  { 
    id: "holographic-singles", 
    name: "Holographic Singles", 
    template: TPL_STICKER_SINGLE,
    override: { 
      description: "Rainbow metallic effect. Individually cut.",
      config: { minimumPrice: 65.00 }, // Higher min
      options: { addons: [] } // Holo usually doesn't need extras
    }
  },
  { 
    id: "clear-singles", 
    name: "Clear Stickers (Singles)", 
    template: TPL_STICKER_SINGLE,
    override: { 
      description: "Transparent PET with white ink.",
      // Slightly higher rate for Clear material
      config: { tiers: [{ upTo: 500, rate: 0.055 }, { upTo: 99999, rate: 0.035 }] }
    }
  }

];

const signList = [
  { 
    id: "coroplast-yard-signs", 
    name: "Coroplast Yard Signs", 
    template: TPL_SIGN_COROPLAST 
  },
  { 
    id: "foam-board", 
    name: "Foam Board (Custom Size)", 
    template: TPL_SIGN_CUSTOM,
    override: { description: "3/16\" Foamcore. Indoor use only. Lightweight." }
  },
  { 
    id: "aluminum-composite", 
    name: "Aluminum Composite (Dibond)", 
    template: TPL_SIGN_CUSTOM,
    override: { 
      description: "3mm ACM (Dibond). Heavy duty outdoor/indoor.",
      // Much higher rate for Aluminum
      config: { 
        minimumPrice: 80.00,
        tiers: [{ upTo: 99999, rate: 0.085 }] // ~$12/sqft
      }
    }
  },
  { 
    id: "vinyl-banner-13oz", 
    name: "13oz Vinyl Banner", 
    template: TPL_BANNER,
    override: { description: "Matte finish. Outdoor durable. Includes Hems & Grommets." }
  },
  { 
    id: "mesh-banner", 
    name: "Mesh Banner (Wind Proof)", 
    template: TPL_BANNER,
    override: { 
      description: "Perforated vinyl for high wind areas.",
      // Mesh is slightly more expensive
      config: { tiers: [{ upTo: 99999, rate: 0.055 }] } 
    }
  }
];

// ==========================================
// 3. HELPERS (Deep Clone & Merge)
// ==========================================

function cloneJSON(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function deepMerge(target, source) {
  if (!source || typeof source !== 'object') return source;
  const output = (target && typeof target === 'object' && !Array.isArray(target)) ? { ...target } : {};
  
  Object.keys(source).forEach(key => {
    const sVal = source[key];
    const tVal = target ? target[key] : undefined;
    
    if (Array.isArray(sVal)) {
      output[key] = [...sVal]; 
    } else if (sVal && typeof sVal === 'object') {
      output[key] = deepMerge(tVal, sVal);
    } else {
      output[key] = sVal;
    }
  });
  return output;
}

function buildProduct(def) {
  let base;
  if (def.template) {
    base = cloneJSON(def.template);
  } else {
    throw new Error(`Product ${def.id} missing template`);
  }

  base.category = def.id.includes('sticker') || def.id.includes('label') || def.template === TPL_STICKER_SINGLE || def.template === TPL_STICKER_SHEET ? "stickers" : "signs";
  // Force category override if specific list logic is needed, 
  // but for simplicity, let's just map based on which list it came from in step 4.
  
  base.product = def.id;
  base.name = def.name;
  
  if (def.override) {
    base = deepMerge(base, def.override);
  }
  return base;
}

// ==========================================
// 4. FINAL EXPORT
// ==========================================

export const PRODUCTS = [
  ...stickerList.map(item => {
    const p = buildProduct(item);
    p.category = "stickers-labels";
    return p;
  }),
  ...signList.map(item => {
    const p = buildProduct(item);
    p.category = "rigid-signs";
    return p;
  }),

  // =========================
  // BULK PRODUCTS (DRAFT) - appended
  // =========================

  // ===== STICKERS & LABELS (stickers-labels) =====
  { category:"stickers-labels", product:"kiss-cut-sticker-sheets", name:"Kiss-Cut Sticker Sheets", description:"Easy-peel sheets for merch packs and giveaways.", status:"draft", config:{ minimumPrice:0 } },
  { category:"stickers-labels", product:"die-cut-stickers", name:"Die-Cut Stickers", description:"Precision cut to your artwork shape for premium branding.", status:"draft", config:{ minimumPrice:0 } },
  { category:"stickers-labels", product:"clear-labels", name:"Clear Labels", description:"Transparent labels for bottles, jars, and clean packaging.", status:"draft", config:{ minimumPrice:0 } },
  { category:"stickers-labels", product:"white-bopp-labels", name:"White BOPP Labels", description:"Waterproof white label film for product packaging.", status:"draft", config:{ minimumPrice:0 } },
  { category:"stickers-labels", product:"holographic-stickers", name:"Holographic Stickers", description:"Eye-catching rainbow holographic finish.", status:"draft", config:{ minimumPrice:0 } },
  { category:"stickers-labels", product:"foil-stickers", name:"Foil Stickers", description:"Metallic foil stamping for luxury branding.", status:"draft", config:{ minimumPrice:0 } },
  { category:"stickers-labels", product:"kraft-paper-labels", name:"Kraft Paper Labels", description:"Natural kraft look for artisan packaging.", status:"draft", config:{ minimumPrice:0 } },
  { category:"stickers-labels", product:"freezer-labels", name:"Freezer Labels", description:"Cold-resistant labels for frozen and refrigerated goods.", status:"draft", config:{ minimumPrice:0 } },
  { category:"stickers-labels", product:"removable-stickers", name:"Removable Stickers", description:"Peel clean—great for temporary promos and events.", status:"draft", config:{ minimumPrice:0 } },
  { category:"stickers-labels", product:"heavy-duty-vinyl-stickers", name:"Heavy Duty Outdoor Vinyl Stickers", description:"UV and water resistant for outdoor use.", status:"draft", config:{ minimumPrice:0 } },
  { category:"stickers-labels", product:"floor-decals", name:"Floor Decals", description:"Slip-rated floor graphics for wayfinding and promos.", status:"draft", config:{ minimumPrice:0 } },
  { category:"stickers-labels", product:"wall-decals", name:"Wall Decals", description:"Wall graphics for offices, studios, and retail interiors.", status:"draft", config:{ minimumPrice:0 } },
  { category:"stickers-labels", product:"window-decals", name:"Window Decals", description:"Storefront window stickers for branding and promos.", status:"draft", config:{ minimumPrice:0 } },
  { category:"stickers-labels", product:"perforated-window-film", name:"Perforated Window Film", description:"One-way vision film—graphics outside, visibility inside.", status:"draft", config:{ minimumPrice:0 } },
  { category:"stickers-labels", product:"transfer-vinyl-lettering", name:"Transfer Vinyl Lettering", description:"Perfect for vehicles, windows, and wall lettering.", status:"draft", config:{ minimumPrice:0 } },
  { category:"stickers-labels", product:"barcode-labels", name:"Barcode Labels", description:"Scan-ready labels for inventory and logistics.", status:"draft", config:{ minimumPrice:0 } },
  { category:"stickers-labels", product:"qr-code-labels", name:"QR Code Labels", description:"QR labels for menus, payments, links, and reviews.", status:"draft", config:{ minimumPrice:0 } },
  { category:"stickers-labels", product:"roll-labels", name:"Roll Labels", description:"Roll labels for high-volume packaging and fulfillment.", status:"draft", config:{ minimumPrice:0 } },
  { category:"stickers-labels", product:"sticker-packs", name:"Sticker Packs", description:"Curated sticker sets packed and ready to sell.", status:"draft", config:{ minimumPrice:0 } },

  // ===== SIGNS & BOARDS (rigid-signs) =====
  { category:"rigid-signs", product:"coroplast-signs", name:"Coroplast Signs", description:"Durable outdoor coroplast signs for promos and notices.", status:"draft", config:{ minimumPrice:0 } },
  { category:"rigid-signs", product:"lawn-signs-h-stake", name:"Lawn Signs + H-Stake", description:"Outdoor lawn signs with metal H-stake included.", status:"draft", config:{ minimumPrice:0 } },
  { category:"rigid-signs", product:"double-sided-lawn-signs", name:"Double-Sided Lawn Signs", description:"Two-sided lawn signs for maximum visibility.", status:"draft", config:{ minimumPrice:0 } },
  { category:"rigid-signs", product:"directional-arrow-signs", name:"Directional Arrow Signs", description:"Arrow signs to guide traffic and visitors.", status:"draft", config:{ minimumPrice:0 } },
  { category:"rigid-signs", product:"foam-board-prints", name:"Foam Board Prints", description:"Crisp indoor display boards for presentations and retail.", status:"draft", config:{ minimumPrice:0 } },
  { category:"rigid-signs", product:"foam-board-easel", name:"Foam Board + Easel Back", description:"Foam board with easel backing—ready to display.", status:"draft", config:{ minimumPrice:0 } },
  { category:"rigid-signs", product:"gatorboard-signs", name:"Gatorboard Signs", description:"Premium rigid board—stronger than foam board.", status:"draft", config:{ minimumPrice:0 } },
  { category:"rigid-signs", product:"pvc-sintra-signs", name:"PVC Sintra Signs", description:"Durable PVC board signage for indoor/outdoor use.", status:"draft", config:{ minimumPrice:0 } },
  { category:"rigid-signs", product:"acrylic-signs", name:"Acrylic Signs", description:"Premium acrylic signage for offices and lobbies.", status:"draft", config:{ minimumPrice:0 } },
  { category:"rigid-signs", product:"clear-acrylic-signs", name:"Clear Acrylic Signs", description:"Modern clear acrylic signs with sharp print.", status:"draft", config:{ minimumPrice:0 } },
  { category:"rigid-signs", product:"frosted-acrylic-signs", name:"Frosted Acrylic Signs", description:"Frosted acrylic signs for privacy and branding.", status:"draft", config:{ minimumPrice:0 } },
  { category:"rigid-signs", product:"acm-dibond-signs", name:"ACM / Dibond Signs", description:"Outdoor-ready aluminum composite signs.", status:"draft", config:{ minimumPrice:0 } },
  { category:"rigid-signs", product:"aluminum-signs", name:"Aluminum Signs", description:"Metal signs for long-term outdoor durability.", status:"draft", config:{ minimumPrice:0 } },
  { category:"rigid-signs", product:"magnetic-car-signs", name:"Magnetic Car Signs", description:"Removable car magnets for services and branding.", status:"draft", config:{ minimumPrice:0 } },
  { category:"rigid-signs", product:"handheld-signs", name:"Handheld Signs", description:"Lightweight handheld signs for events and queues.", status:"draft", config:{ minimumPrice:0 } },
  { category:"rigid-signs", product:"parking-property-signs", name:"Parking & Property Signs", description:"Property and parking signage with mounting options.", status:"draft", config:{ minimumPrice:0 } },
  { category:"rigid-signs", product:"safety-signs", name:"Safety Signs", description:"Warning, hazard, PPE and compliance signage.", status:"draft", config:{ minimumPrice:0 } },
  { category:"rigid-signs", product:"construction-site-signs", name:"Construction Site Signs", description:"Jobsite signage for permits, safety, and directions.", status:"draft", config:{ minimumPrice:0 } },
  { category:"rigid-signs", product:"wayfinding-signs", name:"Wayfinding Signs", description:"Directional signage systems for buildings and venues.", status:"draft", config:{ minimumPrice:0 } },
  { category:"rigid-signs", product:"menu-boards", name:"Menu Boards", description:"Restaurant menu boards and wall-mounted price boards.", status:"draft", config:{ minimumPrice:0 } },
  { category:"rigid-signs", product:"tabletop-signs", name:"Tabletop Signs", description:"Counter and tabletop signs for QR menus and promos.", status:"draft", config:{ minimumPrice:0 } },
  { category:"rigid-signs", product:"standoff-mounted-signs", name:"Standoff Mounted Signs", description:"Premium standoff-mounted signs for offices and lobbies.", status:"draft", config:{ minimumPrice:0 } },

  // ===== BANNERS & DISPLAYS (banners-displays) =====
  { category:"banners-displays", product:"vinyl-banners", name:"Vinyl Banners", description:"Heavy-duty vinyl banners for outdoor promotions.", status:"draft", config:{ minimumPrice:0 } },
  { category:"banners-displays", product:"mesh-banners", name:"Mesh Banners", description:"Wind-resistant mesh banners for fences and scaffolds.", status:"draft", config:{ minimumPrice:0 } },
  { category:"banners-displays", product:"double-sided-banners", name:"Double-Sided Banners", description:"High-impact double-sided banners for storefronts.", status:"draft", config:{ minimumPrice:0 } },
  { category:"banners-displays", product:"blockout-banners", name:"Blockout Banners", description:"No show-through banners for bright double-sided look.", status:"draft", config:{ minimumPrice:0 } },
  { category:"banners-displays", product:"pole-banners", name:"Pole Banners", description:"Street pole banners for districts and events.", status:"draft", config:{ minimumPrice:0 } },
  { category:"banners-displays", product:"feather-flags", name:"Feather Flags", description:"Tall feather flags for storefront visibility.", status:"draft", config:{ minimumPrice:0 } },
  { category:"banners-displays", product:"teardrop-flags", name:"Teardrop Flags", description:"Teardrop flags with stable shape and strong impact.", status:"draft", config:{ minimumPrice:0 } },
  { category:"banners-displays", product:"x-banner-prints", name:"X-Banner Prints", description:"X-stand banner prints (print only).", status:"draft", config:{ minimumPrice:0 } },
  { category:"banners-displays", product:"roll-up-banners", name:"Roll-Up Banners", description:"Retractable roll-up banners for events and trade shows.", status:"draft", config:{ minimumPrice:0 } },
  { category:"banners-displays", product:"step-repeat-backdrops", name:"Step & Repeat Backdrops", description:"Brand wall backdrops for media photos and events.", status:"draft", config:{ minimumPrice:0 } },

  // ===== MARKETING PRINTS =====
  { category:"marketing-prints", product:"business-cards", name:"Business Cards", description:"Premium cards with optional finishes and coatings.", status:"draft", config:{ minimumPrice:0 } },
  { category:"marketing-prints", product:"flyers", name:"Flyers", description:"High-quality flyers for promotions and menus.", status:"draft", config:{ minimumPrice:0 } },
  { category:"marketing-prints", product:"postcards", name:"Postcards", description:"Direct mail postcards and handouts.", status:"draft", config:{ minimumPrice:0 } },
  { category:"marketing-prints", product:"brochures", name:"Brochures", description:"Tri-fold and bi-fold brochures for marketing.", status:"draft", config:{ minimumPrice:0 } },
  { category:"marketing-prints", product:"booklets", name:"Booklets", description:"Saddle-stitched booklets for catalogs and programs.", status:"draft", config:{ minimumPrice:0 } },
  { category:"marketing-prints", product:"rack-cards", name:"Rack Cards", description:"Perfect for brochure racks and counters.", status:"draft", config:{ minimumPrice:0 } },
  { category:"marketing-prints", product:"door-hangers", name:"Door Hangers", description:"Door hangers for local marketing and offers.", status:"draft", config:{ minimumPrice:0 } },
  { category:"marketing-prints", product:"presentation-folders", name:"Presentation Folders", description:"Folders for proposals and brand kits.", status:"draft", config:{ minimumPrice:0 } },
  { category:"marketing-prints", product:"posters", name:"Posters", description:"Posters for storefronts, events, and announcements.", status:"draft", config:{ minimumPrice:0 } },

  // ===== PACKAGING =====
  { category:"packaging", product:"thank-you-cards", name:"Thank You Cards", description:"Insert cards for orders and customer retention.", status:"draft", config:{ minimumPrice:0 } },
  { category:"packaging", product:"packaging-inserts", name:"Packaging Inserts", description:"Custom inserts for boxes, mailers, and shipments.", status:"draft", config:{ minimumPrice:0 } },
  { category:"packaging", product:"hang-tags", name:"Hang Tags", description:"Retail hang tags for apparel and products.", status:"draft", config:{ minimumPrice:0 } },
  { category:"packaging", product:"label-sets", name:"Product Label Sets", description:"Label kits for product lines and variants.", status:"draft", config:{ minimumPrice:0 } },
  { category:"packaging", product:"sticker-seals", name:"Sticker Seals", description:"Round seals for packaging and branding.", status:"draft", config:{ minimumPrice:0 } },
  { category:"packaging", product:"packing-slips", name:"Packing Slips", description:"Branded packing slips and inserts.", status:"draft", config:{ minimumPrice:0 } },

  // ===== WINDOW GRAPHICS =====
  { category:"large-format-graphics", product:"frosted-privacy-film", name:"Frosted Privacy Film", description:"Frosted window film for privacy and branding.", status:"draft", config:{ minimumPrice:0 } },
  { category:"large-format-graphics", product:"full-window-graphics", name:"Full Window Graphics", description:"Full coverage storefront window graphics.", status:"draft", config:{ minimumPrice:0 } },
  { category:"large-format-graphics", product:"one-way-vision-graphics", name:"One-Way Vision Graphics", description:"Perforated graphics with visibility from inside.", status:"draft", config:{ minimumPrice:0 } },
  { category:"large-format-graphics", product:"wall-murals", name:"Wall Murals", description:"Large wall graphics for offices and retail interiors.", status:"draft", config:{ minimumPrice:0 } },
  { category:"large-format-graphics", product:"floor-graphics", name:"Floor Graphics", description:"Durable floor graphics for wayfinding and promos.", status:"draft", config:{ minimumPrice:0 } },

  // ===== DISPLAYS (hardware/kits) =====
  { category:"display-stands", product:"a-frame-stand", name:"A-Frame Stand", description:"Sidewalk A-frame sign hardware (frame only).", status:"draft", config:{ minimumPrice:0 } },
  { category:"display-stands", product:"x-stand-hardware", name:"X-Stand Hardware", description:"X-banner stand hardware (frame only).", status:"draft", config:{ minimumPrice:0 } },
  { category:"display-stands", product:"roll-up-stand-hardware", name:"Roll-Up Stand Hardware", description:"Retractable banner stand hardware (cassette only).", status:"draft", config:{ minimumPrice:0 } },
  { category:"display-stands", product:"backdrop-stand-hardware", name:"Backdrop Stand Hardware", description:"Adjustable backdrop stand hardware (frame only).", status:"draft", config:{ minimumPrice:0 } },
  { category:"display-stands", product:"step-and-repeat-stand-kit", name:"Step & Repeat Stand Kit", description:"Complete stand kit for step & repeat backdrops (hardware only).", status:"draft", config:{ minimumPrice:0 } },
  { category:"display-stands", product:"tent-frame-10x10", name:"10x10 Canopy Tent Frame", description:"Pop-up canopy frame (hardware only).", status:"draft", config:{ minimumPrice:0 } },
  { category:"display-stands", product:"tent-walls-set", name:"Canopy Tent Side Walls Set", description:"Side walls add-on set for canopy tents.", status:"draft", config:{ minimumPrice:0 } },
  { category:"display-stands", product:"feather-flag-pole-set", name:"Feather Flag Pole Set", description:"Pole set for feather flags (hardware only).", status:"draft", config:{ minimumPrice:0 } },
  { category:"display-stands", product:"teardrop-flag-pole-set", name:"Teardrop Flag Pole Set", description:"Pole set for teardrop flags (hardware only).", status:"draft", config:{ minimumPrice:0 } },
  { category:"display-stands", product:"flag-bases-cross", name:"Flag Cross Base", description:"Cross base for feather/teardrop flags.", status:"draft", config:{ minimumPrice:0 } },
  { category:"display-stands", product:"flag-base-ground-stake", name:"Flag Ground Stake", description:"Ground stake base for outdoor flag installs.", status:"draft", config:{ minimumPrice:0 } },
  { category:"display-stands", product:"flag-base-water-bag", name:"Flag Water Bag", description:"Water weight bag for cross base stability.", status:"draft", config:{ minimumPrice:0 } },
  { category:"display-stands", product:"banner-stand-x", name:"X-Stand (Hardware)", description:"X-banner stand hardware (frame only).", status:"draft", config:{ minimumPrice:0 } },
  { category:"display-stands", product:"banner-stand-rollup", name:"Roll-Up Stand (Hardware)", description:"Retractable roll-up stand hardware (cassette only).", status:"draft", config:{ minimumPrice:0 } },
  { category:"display-stands", product:"banner-stand-l-base", name:"L-Base Banner Stand (Hardware)", description:"L-base banner stand hardware (frame only).", status:"draft", config:{ minimumPrice:0 } },
  { category:"display-stands", product:"a-frame-sign-stand", name:"A-Frame Sidewalk Stand", description:"Sidewalk A-frame sign stand hardware (frame only).", status:"draft", config:{ minimumPrice:0 } },

  // ===== HARDWARE & FINISHING (accessories/services) =====
  { category:"display-stands", product:"h-stakes", name:"H-Stakes", description:"Metal H-stakes for coroplast lawn signs.", status:"draft", config:{ minimumPrice:0 } },
  { category:"display-stands", product:"grommets-service", name:"Grommets (Service)", description:"Add metal grommets to banners and signage.", status:"draft", config:{ minimumPrice:0 } },
  { category:"display-stands", product:"banner-hems", name:"Banner Hems (Service)", description:"Reinforced hems for vinyl and mesh banners.", status:"draft", config:{ minimumPrice:0 } },
  { category:"display-stands", product:"pole-pockets", name:"Pole Pockets (Service)", description:"Pole pockets for hanging and street pole banners.", status:"draft", config:{ minimumPrice:0 } },
  { category:"display-stands", product:"drilled-holes-service", name:"Drilled Holes (Service)", description:"Drill holes for rigid signs (mount-ready).", status:"draft", config:{ minimumPrice:0 } },
  { category:"display-stands", product:"standoff-hardware-set", name:"Standoff Hardware Set", description:"Standoff hardware sets for mounting acrylic/metal signs.", status:"draft", config:{ minimumPrice:0 } },
  { category:"display-stands", product:"double-sided-tape", name:"Double-Sided Tape (Add-on)", description:"High-tack double-sided tape for mounting lightweight signage.", status:"draft", config:{ minimumPrice:0 } },
  { category:"display-stands", product:"velcro-strips", name:"Velcro Strips (Add-on)", description:"Velcro mounting strips for removable displays.", status:"draft", config:{ minimumPrice:0 } },
  { category:"display-stands", product:"installation-service", name:"Installation Service", description:"On-site installation for window graphics and signage (quote required).", status:"draft", config:{ minimumPrice:0 } },

  // =========================
  // marketing-prints (draft stubs)
  // =========================
  { category:"marketing-prints", product:"mp-business-cards", name:"Business Cards 名片", description:"Premium business cards with optional lamination and finishes.", status:"draft", config:{ minimumPrice:0 } },
  { category:"marketing-prints", product:"mp-flyers", name:"Flyers 传单", description:"Flyers for promotions, menus, and events. Multiple paper options.", status:"draft", config:{ minimumPrice:0 } },
  { category:"marketing-prints", product:"mp-brochures", name:"Brochures 折页", description:"Tri-fold / bi-fold brochures with crisp color and clean folds.", status:"draft", config:{ minimumPrice:0 } },
  { category:"marketing-prints", product:"catalog-booklets", name:"Catalog / Booklets 产品目录", description:"Saddle-stitched booklets for catalogs, menus, and programs.", status:"draft", config:{ minimumPrice:0 } },
  { category:"marketing-prints", product:"product-inserts", name:"Product Inserts 产品插页", description:"Packaging inserts to boost brand and repeat purchase.", status:"draft", config:{ minimumPrice:0 } },
  { category:"marketing-prints", product:"order-forms-single", name:"Order Form 订单表（单张）", description:"Simple order forms for in-store or delivery orders.", status:"draft", config:{ minimumPrice:0 } },
  { category:"marketing-prints", product:"release-forms", name:"Release / Waiver Form 免责声明", description:"Release forms, waiver forms, consent forms.", status:"draft", config:{ minimumPrice:0 } },
  { category:"marketing-prints", product:"mp-certificates", name:"Certificates 证书", description:"Certificates for training, awards, authenticity, completion.", status:"draft", config:{ minimumPrice:0 } },
  { category:"marketing-prints", product:"mp-coupons", name:"Coupons 优惠券", description:"Coupons for promos, discounts, and direct-mail campaigns.", status:"draft", config:{ minimumPrice:0 } },
  { category:"marketing-prints", product:"mp-menus", name:"Menus 菜单", description:"Restaurant menus (single, folded, booklet).", status:"draft", config:{ minimumPrice:0 } },
  { category:"marketing-prints", product:"mp-postcards", name:"Postcards 明信片", description:"Postcards for direct mail and handouts.", status:"draft", config:{ minimumPrice:0 } },
  { category:"marketing-prints", product:"bookmarks", name:"Bookmarks 书签", description:"Bookmarks for schools, bookstores, and events.", status:"draft", config:{ minimumPrice:0 } },
  { category:"marketing-prints", product:"mp-door-hangers", name:"Door Hangers 门挂牌", description:"Door hangers for local marketing and service promos.", status:"draft", config:{ minimumPrice:0 } },
  { category:"marketing-prints", product:"table-display-cards", name:"Table Display Cards 桌面牌", description:"Table tents and countertop display cards.", status:"draft", config:{ minimumPrice:0 } },
  { category:"marketing-prints", product:"tags-hang-tags", name:"Tags / Hang Tags 挂牌", description:"Product tags for apparel and retail items.", status:"draft", config:{ minimumPrice:0 } },
  { category:"marketing-prints", product:"mp-tickets", name:"Tickets 门票", description:"Event tickets with optional numbering and perforation.", status:"draft", config:{ minimumPrice:0 } },
  { category:"marketing-prints", product:"calendars", name:"Calendars 台历 / 挂历", description:"Desk calendars and wall calendars.", status:"draft", config:{ minimumPrice:0 } },
  { category:"marketing-prints", product:"box-sleeves", name:"Box Sleeves 包装盒套", description:"Printed sleeves for product packaging and gift boxes.", status:"draft", config:{ minimumPrice:0 } },
  { category:"marketing-prints", product:"mp-presentation-folders", name:"Presentation Folders 展示文件夹", description:"Folders for proposals, sales kits, and brand presentations.", status:"draft", config:{ minimumPrice:0 } },
  { category:"marketing-prints", product:"invitation-cards", name:"Invitation Cards 请柬", description:"Invitations for weddings, events, and grand openings.", status:"draft", config:{ minimumPrice:0 } },
  { category:"marketing-prints", product:"greeting-cards", name:"Greeting Cards 贺卡", description:"Greeting cards with optional envelopes.", status:"draft", config:{ minimumPrice:0 } },
  { category:"marketing-prints", product:"envelopes", name:"Envelopes 信封", description:"Custom printed envelopes for business and events.", status:"draft", config:{ minimumPrice:0 } },
  { category:"marketing-prints", product:"ncr-invoices", name:"NCR Invoice 收据本", description:"2-part / 3-part NCR invoice books with numbering.", status:"draft", config:{ minimumPrice:0 } },
  { category:"marketing-prints", product:"mp-letterhead", name:"Letterhead 信纸", description:"Business letterhead for professional documents.", status:"draft", config:{ minimumPrice:0 } },
  { category:"marketing-prints", product:"mp-notepads", name:"Notepads 记事本", description:"Branded notepads for office and retail use.", status:"draft", config:{ minimumPrice:0 } },

  // =========================
  // stickers-labels (draft stubs)
  // =========================
  { category:"stickers-labels", product:"stickers-single-diecut", name:"Die-Cut Stickers 单张", description:"Custom shape cut singles for branding and merch.", status:"draft", config:{ minimumPrice:0 } },
  { category:"stickers-labels", product:"stickers-sheet-kisscut", name:"Sticker Sheets 大张（Kiss-Cut）", description:"Kiss-cut sheets for easy peel and pack inserts.", status:"draft", config:{ minimumPrice:0 } },
  { category:"stickers-labels", product:"stickers-multi-on-sheet", name:"Multi on Sheet 异型多图拼版", description:"Multiple designs on one sheet for efficient production.", status:"draft", config:{ minimumPrice:0 } },
  { category:"stickers-labels", product:"labels-clear", name:"Clear Labels 透明标签", description:"Transparent labels for bottles, jars, and packaging.", status:"draft", config:{ minimumPrice:0 } },
  { category:"stickers-labels", product:"labels-white-bopp", name:"White BOPP Labels 白BOPP标签", description:"Waterproof white film labels for product packaging.", status:"draft", config:{ minimumPrice:0 } },
  { category:"stickers-labels", product:"labels-roll-quote", name:"Roll Labels 卷装标签（报价）", description:"High-volume roll labels. Quote required for setup.", status:"draft", config:{ minimumPrice:0 } },
  { category:"stickers-labels", product:"vinyl-lettering", name:"Vinyl Lettering 刻字贴", description:"Transfer vinyl lettering for windows, walls, vehicles.", status:"draft", config:{ minimumPrice:0 } },
  { category:"stickers-labels", product:"magnets-flexible", name:"Magnets 磁吸", description:"Flexible magnets for vehicles, fridges, promo giveaways.", status:"draft", config:{ minimumPrice:0 } },
  { category:"stickers-labels", product:"stickers-color-on-white", name:"Color on White Stickers 彩白贴", description:"Full color on white vinyl for bold, opaque labels.", status:"draft", config:{ minimumPrice:0 } },
  { category:"stickers-labels", product:"stickers-color-on-clear", name:"Color on Clear Stickers 彩透明贴", description:"Full color on transparent film for clean, floating look.", status:"draft", config:{ minimumPrice:0 } },

  // =========================
  // rigid-signs (draft stubs)
  // =========================
  { category:"rigid-signs", product:"rigid-foam-board-prints", name:"Foam Board / KT Board 泡沫板/KT板", description:"Lightweight rigid boards for indoor displays and presentations.", status:"draft", config:{ minimumPrice:0 } },
  { category:"rigid-signs", product:"backdrop-board", name:"Backdrop Board 背景板", description:"Large rigid backdrop boards for events and photo ops.", status:"draft", config:{ minimumPrice:0 } },
  { category:"rigid-signs", product:"yard-sign-h-frame", name:"Yard Sign + H-Frame 草地牌（含H架）", description:"Outdoor lawn signs with H-frame stake included.", status:"draft", config:{ minimumPrice:0 } },
  { category:"rigid-signs", product:"yard-sign-panel-only", name:"Yard Sign Panel 草地牌（仅板）", description:"Coroplast yard sign panels for outdoor use.", status:"draft", config:{ minimumPrice:0 } },
  { category:"rigid-signs", product:"real-estate-agent-sign", name:"Real Estate Agent Sign 房产经纪牌", description:"Realtor signs for listings, open house, directional needs.", status:"draft", config:{ minimumPrice:0 } },
  { category:"rigid-signs", product:"a-frame-insert-prints", name:"A-Frame Inserts A型展架画面", description:"Printed inserts for A-frame sidewalk stands.", status:"draft", config:{ minimumPrice:0 } },
  { category:"rigid-signs", product:"rigid-tabletop-signs", name:"Tabletop Signs 桌面牌", description:"Countertop signs for QR menus, pricing, promos.", status:"draft", config:{ minimumPrice:0 } },
  { category:"rigid-signs", product:"tags-tickets-rigid", name:"Rigid Tags / Tickets 硬卡挂牌/门票", description:"Rigid tags and tickets for retail and events.", status:"draft", config:{ minimumPrice:0 } },
  { category:"rigid-signs", product:"calendars-wall-desk", name:"Calendars 挂历/台历", description:"Wall calendars and desk calendars.", status:"draft", config:{ minimumPrice:0 } },

  // =========================
  // banners-displays (draft stubs)
  // =========================
  { category:"banners-displays", product:"pull-up-banner", name:"Pull Up Banner 易拉宝", description:"Retractable roll-up banners for events and storefronts.", status:"draft", config:{ minimumPrice:0 } },
  { category:"banners-displays", product:"x-banner-frame-print", name:"X-Banner Frame + Print X展架（含画面）", description:"X-stand kit with print for quick event setup.", status:"draft", config:{ minimumPrice:0 } },
  { category:"banners-displays", product:"pillowcase-display-frame", name:"Pillowcase Display 拉链布展架", description:"Stretch fabric display with zipper pillowcase cover.", status:"draft", config:{ minimumPrice:0 } },
  { category:"banners-displays", product:"telescopic-backdrop", name:"Telescopic Backdrop 伸缩背景架", description:"Adjustable backdrop stand for step & repeat banners.", status:"draft", config:{ minimumPrice:0 } },
  { category:"banners-displays", product:"media-wall-pop-up", name:"Media Wall Pop-Up Frame 背景墙展架", description:"Pop-up media wall frame for trade shows and events.", status:"draft", config:{ minimumPrice:0 } },
  { category:"banners-displays", product:"feather-flag", name:"Feather Flag 羽毛旗", description:"Feather flags for storefront visibility.", status:"draft", config:{ minimumPrice:0 } },
  { category:"banners-displays", product:"teardrop-flag", name:"Teardrop Flag 水滴旗", description:"Teardrop flags for stable shape and outdoor branding.", status:"draft", config:{ minimumPrice:0 } },
  { category:"banners-displays", product:"table-cloth", name:"Table Cloth 桌布", description:"Printed tablecloths for events and trade shows.", status:"draft", config:{ minimumPrice:0 } },
  { category:"banners-displays", product:"canvas-prints", name:"Canvas Prints 油画布", description:"Gallery-style canvas prints for decor and retail.", status:"draft", config:{ minimumPrice:0 } },

  // =========================
  // business-forms (draft stubs)
  // =========================
  { category:"business-forms", product:"ncr-invoice-books", name:"NCR Invoice Books 收据本", description:"2-part / 3-part NCR invoice books with numbering.", status:"draft", config:{ minimumPrice:0 } },
  { category:"business-forms", product:"order-form-pads", name:"Order Form Pads 订单表（本）", description:"Order forms in pads for shops and service businesses.", status:"draft", config:{ minimumPrice:0 } },
  { category:"business-forms", product:"release-waiver-forms", name:"Release / Waiver Forms 免责声明", description:"Waivers, releases, and consent forms.", status:"draft", config:{ minimumPrice:0 } },
  { category:"business-forms", product:"bf-certificates", name:"Certificates 证书", description:"Certificates for awards, authenticity, and completion.", status:"draft", config:{ minimumPrice:0 } },
  { category:"business-forms", product:"bf-letterhead", name:"Letterhead 信纸", description:"Professional letterhead for business documents.", status:"draft", config:{ minimumPrice:0 } },
  { category:"business-forms", product:"bf-notepads", name:"Notepads 记事本", description:"Branded notepads for office and retail use.", status:"draft", config:{ minimumPrice:0 } },

  // =========================
  // retail-promo (draft stubs)
  // =========================
  { category:"retail-promo", product:"wobblers", name:"Wobbler 摆动展示牌", description:"Shelf wobblers for retail promotions and price highlights.", status:"draft", config:{ minimumPrice:0 } },
  { category:"retail-promo", product:"danglers", name:"Dangler 吊牌/摆动吊牌", description:"Hanging danglers for aisle visibility and promos.", status:"draft", config:{ minimumPrice:0 } },
  { category:"retail-promo", product:"shelf-talkers", name:"Shelf Talkers 货架挂牌", description:"Shelf talkers and shelf strips for product callouts.", status:"draft", config:{ minimumPrice:0 } },
  { category:"retail-promo", product:"rp-menus", name:"Menus 菜单", description:"Restaurant menus for counters and tables.", status:"draft", config:{ minimumPrice:0 } },
  { category:"retail-promo", product:"rp-coupons", name:"Coupons 优惠券", description:"Promo coupons for retail and direct marketing.", status:"draft", config:{ minimumPrice:0 } },
  { category:"retail-promo", product:"rp-tickets", name:"Tickets 门票", description:"Event tickets with optional numbering/perforation.", status:"draft", config:{ minimumPrice:0 } },
  { category:"retail-promo", product:"table-tent-cards", name:"Table Tent Cards 桌面牌", description:"Table tents for QR menus, promos, and pricing.", status:"draft", config:{ minimumPrice:0 } },
  { category:"retail-promo", product:"rp-hang-tags", name:"Hang Tags 挂牌", description:"Hang tags for apparel, gifts, and retail items.", status:"draft", config:{ minimumPrice:0 } },

  // =========================
  // large-format-graphics (draft stubs)
  // =========================
  { category:"large-format-graphics", product:"window-graphics", name:"Window Graphics 窗贴", description:"Storefront window graphics for branding and promos.", status:"draft", config:{ minimumPrice:0 } },
  { category:"large-format-graphics", product:"window-frosted", name:"Frosted Film 磨砂膜", description:"Frosted privacy film with optional cut lettering.", status:"draft", config:{ minimumPrice:0 } },
  { category:"large-format-graphics", product:"window-perforated", name:"Perforated Window Film 单透窗贴", description:"One-way vision window film for storefront campaigns.", status:"draft", config:{ minimumPrice:0 } },
  { category:"large-format-graphics", product:"lf-floor-graphics", name:"Floor Graphics 地面贴", description:"Durable floor decals for wayfinding and promos.", status:"draft", config:{ minimumPrice:0 } },
  { category:"large-format-graphics", product:"wall-graphics", name:"Wall Graphics 墙贴", description:"Wall decals and murals for offices and retail interiors.", status:"draft", config:{ minimumPrice:0 } },
  { category:"large-format-graphics", product:"car-graphics", name:"Car Graphics 车贴", description:"Vehicle graphics for branding, fleets, and wraps (quote for full wrap).", status:"draft", config:{ minimumPrice:0 } },

  // ===== STAMPS (marketing-prints) =====
  PROD_SELF_INKING_STAMPS,
];

const seen = new Set();
PRODUCTS.forEach(p => {
  const key = `${p.category}/${p.product}`;
  if (seen.has(key)) throw new Error(`Duplicate Product ID: ${key}`);
  seen.add(key);
});

