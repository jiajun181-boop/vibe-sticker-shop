// config/products.js

// ==========================================
// 1. TEMPLATES (Commercial Grade - GTA Market Ready)
// ==========================================

// --- A. STICKERS: Die-Cut Singles (Premium) ---
// 卖点: "Individually cut", "Hand sorted", "Premium Vinyl"
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
// 卖点: "Budget friendly", "Peel & Stick", "Fast turnaround"
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
    p.category = "stickers"; 
    return p;
  }),
  ...signList.map(item => {
    const p = buildProduct(item);
    p.category = "signs"; 
    return p;
  })
];

const seen = new Set();
PRODUCTS.forEach(p => {
  const key = `${p.category}/${p.product}`;
  if (seen.has(key)) throw new Error(`Duplicate Product ID: ${key}`);
  seen.add(key);
});