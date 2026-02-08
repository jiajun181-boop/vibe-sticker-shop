// 文件路径: prisma/seed.mjs
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

function getSpecs(name, type) {
  const n = name.toLowerCase();
  const isCutVinyl = n.includes("cut vinyl") || type === "label" || n.includes("lettering");
  if (isCutVinyl) {
    return { acceptedFormats: ["ai", "eps", "pdf", "svg"], minDpi: null, requiresBleed: false, bleedIn: null };
  }
  return { acceptedFormats: ["ai", "pdf", "eps", "tiff", "jpg", "png"], minDpi: 150, requiresBleed: true, bleedIn: 0.125 };
}

const products = [
  // --- FLEET COMPLIANCE (10) ---
  { name: "TSSA Truck Number Lettering (Cut Vinyl)", slug: "tssa-truck-number-lettering-cut-vinyl", category: "fleet-compliance-id", type: "sticker", pricingUnit: "per_piece", basePrice: 3500, description: "Professional vinyl lettering for TSSA registration numbers." },
  { name: "CVOR Number Decals", slug: "cvor-number-decals", category: "fleet-compliance-id", type: "sticker", pricingUnit: "per_piece", basePrice: 2500, description: "High-visibility decals for CVOR identification." },
  { name: "US DOT Number Decals", slug: "usdot-number-decals", category: "fleet-compliance-id", type: "sticker", pricingUnit: "per_piece", basePrice: 2500, description: "Durable lettering designed for US DOT requirements." },
  { name: "Fleet Unit Number Stickers", slug: "fleet-unit-number-stickers", category: "fleet-compliance-id", type: "sticker", pricingUnit: "per_piece", basePrice: 1200, description: "Custom unit number stickers for fleet tracking." },
  { name: "GVW / Tare Weight Lettering", slug: "gvw-tare-weight-lettering", category: "fleet-compliance-id", type: "sticker", pricingUnit: "per_piece", basePrice: 1500, description: "Gross Vehicle Weight and Tare Weight lettering." },
  { name: "Fuel Type Labels (Diesel / Gas)", slug: "fuel-type-labels-diesel-gas", category: "fleet-compliance-id", type: "label", pricingUnit: "per_piece", basePrice: 800, description: "Identification labels for Diesel, Gasoline, or Propane." },
  { name: "Tire Pressure / Load Labels", slug: "tire-pressure-load-labels", category: "fleet-compliance-id", type: "label", pricingUnit: "per_piece", basePrice: 500, description: "Labels for tire pressure and load capacity." },
  { name: "Vehicle Inspection Stickers", slug: "vehicle-inspection-maintenance-stickers", category: "fleet-compliance-id", type: "label", pricingUnit: "per_piece", basePrice: 400, description: "Write-on stickers for tracking service intervals." },
  { name: "Equipment ID Decals", slug: "equipment-id-decals-cut-vinyl", category: "fleet-compliance-id", type: "sticker", pricingUnit: "per_piece", basePrice: 1000, description: "Heavy-duty vinyl numbering for machinery." },
  { name: "Asset Tags (QR / Barcode)", slug: "asset-tags-qr-barcode", category: "fleet-compliance-id", type: "label", pricingUnit: "per_piece", basePrice: 200, description: "Durable asset tags with scannable codes." },

  // --- VEHICLE BRANDING (15) ---
  { name: "Custom Truck Door Lettering Kit", slug: "custom-truck-door-lettering-kit", category: "vehicle-branding-advertising", type: "sticker", pricingUnit: "per_piece", basePrice: 4500, description: "Complete kit: Company Name, City, Phone, Website." },
  { name: "Custom Van Logo Decals", slug: "custom-printed-vehicle-logo-decals", category: "vehicle-branding-advertising", type: "sticker", pricingUnit: "per_sqft", basePrice: 1800, description: "Full-color printed logo decals, contour cut." },
  { name: "Printed Truck Door Decals", slug: "printed-truck-door-decals-full-color", category: "vehicle-branding-advertising", type: "sticker", pricingUnit: "per_sqft", basePrice: 1600, description: "High-impact branding on doors." },
  { name: "Rear Window Perf Graphic", slug: "rear-window-perf-graphic-one-way-vision", category: "vehicle-branding-advertising", type: "sticker", pricingUnit: "per_sqft", basePrice: 1400, description: "See-through from inside, graphics from outside." },
  { name: "Trailer Large Graphics", slug: "trailer-box-truck-large-graphics", category: "vehicle-branding-advertising", type: "sticker", pricingUnit: "per_sqft", basePrice: 1200, description: "Large format decals for trailers." },
  { name: "Magnetic Truck Door Signs", slug: "magnetic-truck-door-signs", category: "vehicle-branding-advertising", type: "sign", pricingUnit: "per_piece", basePrice: 5500, description: "Removable magnetic signs (30 mil)." },
  { name: "Social Media QR Decals", slug: "social-qr-vehicle-decals", category: "vehicle-branding-advertising", type: "sticker", pricingUnit: "per_piece", basePrice: 1500, description: "Scan-ready decals for social media." },
  { name: "Custom Cut Vinyl Lettering", slug: "custom-cut-vinyl-lettering-any-text", category: "vehicle-branding-advertising", type: "sticker", pricingUnit: "per_piece", basePrice: 2000, description: "Versatile vinyl lettering for custom text." },
  { name: "Window Lettering", slug: "window-lettering-cut-vinyl", category: "vehicle-branding-advertising", type: "sticker", pricingUnit: "per_piece", basePrice: 2500, description: "Custom lettering for storefronts or windows." },
  { name: "Removable Promo Decals", slug: "removable-promo-vehicle-decals", category: "vehicle-branding-advertising", type: "sticker", pricingUnit: "per_sqft", basePrice: 1500, description: "Low-tack decals for short-term promos." },
  { name: "Long-Term Outdoor Decals", slug: "long-term-outdoor-vehicle-decals", category: "vehicle-branding-advertising", type: "sticker", pricingUnit: "per_sqft", basePrice: 1800, description: "Premium vinyl with UV lamination." },
  { name: "Partial Wrap Graphics", slug: "partial-wrap-spot-graphics", category: "vehicle-branding-advertising", type: "sticker", pricingUnit: "per_sqft", basePrice: 2000, description: "Graphic accents to wrap sections." },
  { name: "Tailgate Decal", slug: "tailgate-rear-door-printed-decal", category: "vehicle-branding-advertising", type: "sticker", pricingUnit: "per_sqft", basePrice: 1600, description: "High-visibility branding for tailgates." },
  { name: "Truck Side Panel Decal", slug: "truck-side-panel-printed-decal", category: "vehicle-branding-advertising", type: "sticker", pricingUnit: "per_sqft", basePrice: 1600, description: "Printed graphics for side panels." },
  { name: "Vehicle Wrap (Print Only)", slug: "vehicle-wrap-print-only-quote", category: "vehicle-branding-advertising", type: "sticker", pricingUnit: "per_sqft", basePrice: 2200, description: "Full vehicle wrap printing services." },

  // --- SAFETY & WARNING (11) ---
  { name: "Reflective Conspicuity Tape", slug: "reflective-conspicuity-tape-kit", category: "safety-warning-decals", type: "sticker", pricingUnit: "per_piece", basePrice: 4500, description: "High-intensity reflective tape." },
  { name: "Rear Chevron Kit", slug: "high-visibility-rear-chevron-kit", category: "safety-warning-decals", type: "sticker", pricingUnit: "per_piece", basePrice: 12500, description: "Reflective rear markings for utility vehicles." },
  { name: "Reflective Safety Stripes", slug: "reflective-safety-stripes-kit", category: "safety-warning-decals", type: "sticker", pricingUnit: "per_piece", basePrice: 6500, description: "General-purpose reflective striping." },
  { name: "Stay Back Warning", slug: "stay-back-warning-decals", category: "safety-warning-decals", type: "sticker", pricingUnit: "per_piece", basePrice: 1800, description: "Large 'Stay Back 50ft' warning text." },
  { name: "No Smoking Decals", slug: "no-smoking-decals-set", category: "safety-warning-decals", type: "sticker", pricingUnit: "per_piece", basePrice: 1500, description: "Standard No Smoking stickers." },
  { name: "Safety Notice Pack", slug: "safety-notice-decal-pack", category: "safety-warning-decals", type: "sticker", pricingUnit: "per_piece", basePrice: 3500, description: "Assorted safety labels." },
  { name: "Fire Extinguisher Stickers", slug: "fire-extinguisher-location-stickers", category: "safety-warning-decals", type: "sticker", pricingUnit: "per_piece", basePrice: 500, description: "Identification for fire extinguishers." },
  { name: "First Aid Stickers", slug: "first-aid-location-stickers", category: "safety-warning-decals", type: "sticker", pricingUnit: "per_piece", basePrice: 500, description: "Green/white cross stickers." },
  { name: "Hard Hat Stickers", slug: "ppe-hard-hat-stickers", category: "safety-warning-decals", type: "sticker", pricingUnit: "per_piece", basePrice: 200, description: "Small durable stickers for PPE." },
  { name: "Hazard GHS Labels", slug: "hazard-ghs-labels", category: "safety-warning-decals", type: "label", pricingUnit: "per_piece", basePrice: 400, description: "GHS-style hazard labels." },
  { name: "Emergency Exit Signs", slug: "emergency-exit-egress-signs-set", category: "safety-warning-decals", type: "sign", pricingUnit: "per_piece", basePrice: 2500, description: "Egress signage set." },

  // --- FACILITY & ASSETS (9) ---
  { name: "Warehouse Floor Graphics", slug: "warehouse-floor-safety-graphics", category: "facility-asset-labels", type: "sticker", pricingUnit: "per_sqft", basePrice: 1800, description: "Anti-slip floor decals." },
  { name: "Floor Arrows", slug: "floor-direction-arrows-set", category: "facility-asset-labels", type: "sticker", pricingUnit: "per_piece", basePrice: 2500, description: "Directional floor arrows." },
  { name: "Floor Number Markers", slug: "floor-number-markers-set", category: "facility-asset-labels", type: "sticker", pricingUnit: "per_piece", basePrice: 2000, description: "Numbered floor decals." },
  { name: "Warehouse Zone Labels", slug: "warehouse-zone-labels", category: "facility-asset-labels", type: "label", pricingUnit: "per_piece", basePrice: 300, description: "Large labels for racking zones." },
  { name: "Bin Labels", slug: "tool-box-bin-labels", category: "facility-asset-labels", type: "label", pricingUnit: "per_piece", basePrice: 150, description: "Labels for tools and parts bins." },
  { name: "Panel Labels", slug: "cable-panel-labels", category: "facility-asset-labels", type: "label", pricingUnit: "per_piece", basePrice: 150, description: "Labels for panels and cabling." },
  { name: "Storefront Hours Decal", slug: "storefront-hours-door-decal-cut-vinyl", category: "facility-asset-labels", type: "sticker", pricingUnit: "per_piece", basePrice: 3500, description: "Decal for storefront hours." },
  { name: "Frosted Privacy Film", slug: "frosted-privacy-window-film", category: "facility-asset-labels", type: "sticker", pricingUnit: "per_sqft", basePrice: 2000, description: "Etched-glass effect vinyl." },
  { name: "Asset Tags", slug: "asset-tags-tamper-evident", category: "facility-asset-labels", type: "label", pricingUnit: "per_piece", basePrice: 300, description: "Security labels." },
];

function placeholderUrl(name) {
  const text = encodeURIComponent(name.slice(0, 24));
  return `https://placehold.co/600x400/png?text=${text}`;
}

async function main() {
  console.log("🌱 Seeding 45 products...");
  await prisma.product.deleteMany();
  for (const p of products) {
    const specs = getSpecs(p.name, p.type);
    await prisma.product.create({
      data: {
        ...p,
        isActive: true,
        acceptedFormats: specs.acceptedFormats,
        minDpi: specs.minDpi,
        requiresBleed: specs.requiresBleed,
        bleedIn: specs.bleedIn,
        images: { create: [{ url: placeholderUrl(p.name), alt: p.name }] }
      }
    });
  }
  console.log(`✅ Seeded ${products.length} products.`);
}
main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });