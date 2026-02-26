import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// All frontend-referenced slugs gathered from exhaustive code exploration
const frontendSlugs = new Set([
  // StickersCategoryClient specialty cards
  'die-cut-stickers','kiss-cut-singles','sticker-pages','sticker-rolls','vinyl-lettering',
  // BannersCategoryClient
  'vinyl-banners','mesh-banners','pole-banners','double-sided-banners','roll-up-banners',
  'x-banner-frame-print','tabletop-x-banner','deluxe-tabletop-retractable-a3',
  'telescopic-backdrop','popup-display-curved-8ft','table-cloth','feather-flags',
  'teardrop-flags','outdoor-canopy-tent-10x10',
  // WindowsWallsFloorsCategoryClient
  'one-way-vision','frosted-window-film','static-cling','transparent-color-film',
  'blockout-vinyl','opaque-window-graphics','glass-waistline','wall-graphics',
  'floor-graphics','decals',
  // VehicleCategoryClient
  'full-vehicle-wrap-design-print','partial-wrap-spot-graphics',
  'trailer-box-truck-large-graphics','vehicle-roof-wrap',
  'custom-truck-door-lettering-kit','magnetic-truck-door-signs',
  'car-door-magnets-pair','printed-truck-door-decals-full-color',
  'usdot-number-decals','cvor-number-decals','mc-number-decals',
  'tssa-truck-number-lettering-cut-vinyl','gvw-tare-weight-lettering',
  'fleet-unit-number-stickers','vehicle-inspection-maintenance-stickers',
  'fuel-type-labels-diesel-gas','dangerous-goods-placards',
  'tire-pressure-load-labels','reflective-conspicuity-tape-kit',
  // CanvasCategoryClient
  'canvas-standard','canvas-gallery-wrap','canvas-framed','canvas-split-2',
  'canvas-split-3','canvas-split-5','canvas-panoramic',
  // SignsCategoryClient
  'yard-sign','real-estate-sign','election-signs','open-house-signs',
  'a-frame-sign-stand','h-stakes','real-estate-frame',
  'selfie-frame-board','tri-fold-presentation-board',
  'welcome-sign-board','directional-signs','pvc-board-signs',
  // MarketingCategoryClient
  'business-cards','flyers','brochures','postcards','posters','booklets',
  'letterhead','notepads','stamps','calendars','certificates','envelopes',
  'menus','table-tents','shelf-displays','rack-cards','door-hangers',
  'tags','ncr-forms','tickets-coupons','greeting-invitation-cards',
  'bookmarks','loyalty-cards','document-printing',
  // ShopClient HOT_PICK_SLUGS
  'business-cards-classic','window-graphics','vehicle-wraps','yard-signs',
  // RICH_PAGE_SLUG_MAP (stickers)
  'stickers-die-cut-custom','holographic-singles','holographic-stickers',
  'foil-stickers','clear-singles','heavy-duty-vinyl-stickers',
  'stickers-color-on-white','stickers-color-on-clear','reflective-stickers',
  'kiss-cut-stickers','removable-stickers','sticker-sheets',
  'kiss-cut-sticker-sheets','stickers-multi-on-sheet','sticker-packs',
  'roll-labels','stickers-roll-labels','clear-labels','white-bopp-labels',
  'kraft-paper-labels','freezer-labels','barcode-labels','qr-code-labels',
  'labels-roll-quote',
  // sign-page-content rich pages
  'real-estate-signs','yard-lawn-signs','event-photo-boards',
  // wwf-page-content rich pages
  'frosted-window-graphics','static-cling-frosted',
  'window-graphics-transparent-color','window-graphics-blockout',
  'window-graphics-standard','custom-decals','vinyl-decals',
  // subProductConfig dbSlugs
  'business-cards-gloss','business-cards-matte','business-cards-soft-touch',
  'business-cards-gold-foil','business-cards-linen','business-cards-pearl',
  'business-cards-thick','magnets-business-card',
  'ncr-forms-duplicate','ncr-forms-triplicate','ncr-invoices',
  'door-hangers-standard','door-hangers-perforated','door-hangers-large',
  'brochures-bi-fold','brochures-tri-fold','brochures-z-fold',
  'booklets-saddle-stitch','booklets-perfect-bound','booklets-wire-o',
  'catalog-booklets','posters-glossy','posters-matte','posters-adhesive','posters-backlit',
  'menus-laminated','menus-takeout','table-mat',
  'letterhead-standard','envelopes-standard','envelopes-10-business',
  'envelopes-a7-invitation','envelopes-6x9-catalog','envelopes-9x12-catalog',
  'notepads-custom','bookmarks-custom','calendars-wall','calendars-wall-desk',
  'self-inking-stamps','stamps-s827','stamps-s510','stamps-s520','stamps-s542',
  'stamps-r512','stamps-r524','stamps-r532','stamps-r552',
  'greeting-cards','invitation-cards','invitations-flat',
  'wall-mural-graphic','wall-murals','wall-decals','decals-wall',
  'warehouse-floor-graphics','warehouse-floor-safety-graphics','floor-arrows',
  'floor-number-markers','floor-decals','floor-direction-arrows-set',
  'floor-logo-graphic','floor-number-markers-set','decals-floor',
  'window-graphics','window-perforated','window-frosted',
  'window-graphics-double-sided','decals-window','window-decals',
  'transfer-vinyl-lettering',
  'hang-tags','hang-tags-custom','tags-hang-tags','label-sets','retail-tags',
  'vinyl-banner-13oz','blockout-banners',
  'mesh-banner-heavy-duty','pole-banner-single-sided','pole-banner-double-sided',
  'pole-banner-hardware-kit',
  'canvas-prints-standard','gallery-wrap-canvas-prints','framed-canvas-prints',
  'panoramic-canvas-prints','split-panel-canvas-prints',
  'fabric-banner','fabric-banner-double-sided','fabric-banner-hanging',
  'clear-static-cling','frosted-static-cling','static-cling-standard',
  'frosted-matte-window-film','holographic-iridescent-film',
  'color-white-on-clear-vinyl','color-white-color-clear-vinyl',
  'dichroic-window-film','gradient-window-film',
  'one-way-vision-graphics','perforated-window-film','vehicle-window-tint-graphic',
  'frosted-privacy-window-film','frosted-privacy-film',
  'window-cut-vinyl-lettering','window-lettering-business',
  'window-lettering-cut-vinyl','storefront-hours-door-decal-cut-vinyl',
  'retractable-banner-stand-premium','deluxe-rollup-banner','pull-up-banner',
  'roll-up-stand-hardware','banner-stand-rollup','l-base-banner-stand','banner-stand-l-base',
  'x-banner-stand-standard','x-banner-stand-large','x-stand-hardware',
  'banner-stand-x','x-banner-prints',
  'tabletop-banner-a4','tabletop-banner-a3',
  'tabletop-signs','rigid-tabletop-signs','table-easel-display',
  'standoff-hardware-set','velcro-strips','installation-service',
  'branded-table-cover-6ft','branded-table-runner',
  'step-repeat-backdrops','step-and-repeat-stand-kit',
  'media-wall-pop-up','backdrop-board','backdrop-stand-hardware',
  'step-repeat-backdrop-8x8','popup-display-straight-8ft',
  'tension-fabric-display-3x3','tension-fabric-display-8ft',
  'tension-fabric-display-10ft','pillowcase-display-frame',
  'feather-flag-pole-set','feather-flag-medium','feather-flag-large',
  'teardrop-flag-pole-set','teardrop-flag-medium',
  'flag-base-ground-stake','flag-base-water-bag','flag-bases-cross',
  'tent-frame-10x10','tent-walls-set','tent-half-walls','tent-custom-print',
  'vehicle-wrap-print-only-quote','trailer-full-wrap','car-graphics',
  'truck-side-panel-printed-decal','car-hood-decal',
  'tailgate-rear-door-printed-decal',
  'custom-printed-vehicle-logo-decals','custom-cut-vinyl-lettering-any-text',
  'removable-promo-vehicle-decals','long-term-outdoor-vehicle-decals',
  'social-qr-vehicle-decals','bumper-sticker-custom','boat-lettering-registration',
  'magnetic-car-signs','magnetic-rooftop-sign','magnets-flexible',
  'fleet-graphic-package','high-visibility-rear-chevron-kit',
  'reflective-safety-stripes-kit','stay-back-warning-decals',
  'nsc-number-decals','trailer-id-number-decals',
  'equipment-id-decals-cut-vinyl',
  'truck-door-compliance-kit','fleet-vehicle-inspection-book',
  'ifta-cab-card-holder','hours-of-service-log-holder',
  'shelf-talkers','shelf-danglers','shelf-wobblers',
  'table-tents','table-tent-cards','table-tents-4x6','table-display-cards',
  'coupons','tickets','cardstock-prints','loyalty-cards',
  'danglers','wobblers','shelf-displays',
  // sign-order-config aliases
  'yard-signs','foam-board-prints','acrylic-signs','aluminum-signs',
  'pvc-sintra-signs','a-frame-sandwich-board','photo-board',
  'yard-sign-h-frame','yard-sign-panel-only','yard-signs-coroplast',
  'coroplast-yard-signs','lawn-signs-h-stake','double-sided-lawn-signs',
  'election-campaign-sign','election-sign','open-house-sign',
  'foam-board','custom-foam-board','rigid-foam-board-prints',
  'foam-board-easel','gatorboard-signs',
  'clear-acrylic-signs','frosted-acrylic-signs','standoff-mounted-signs',
  'ada-braille-signs','aluminum-composite','acm-dibond-signs',
  'safety-signs','parking-property-signs','construction-site-signs',
  'wayfinding-signs','directional-arrow-sign','directional-arrow-signs',
  'business-hours-sign','address-house-number-signs','qr-code-signs',
  'a-frame-double-sided','a-frame-insert-prints','a-frame-stand',
  'real-estate-agent-sign','real-estate-riders','open-house-sign-kit',
  'event-celebration-board','event-photo-backdrop',
  'welcome-sign-boards','seating-chart-board','memorial-tribute-board',
  'photo-collage-board','face-in-hole-board','handheld-prop-board','handheld-sign',
  'coroplast-signs','coroplast-board-prints','foamboard-sheet',
  'pvc-sintra-prints',
  'giant-checks','graduation-checks','presentation-checks',
  'life-size-cutouts','wedding-seating-charts','seating-chart-boards',
  'parking-signs','business-hours-signs',
  // industrial/safety labels
  'industrial-labels','safety-labels','sticker-rolls',
  'document-printing',
]);

async function main() {
  const dbProducts = await prisma.product.findMany({
    select: { name: true, slug: true, category: true, isActive: true },
    orderBy: [{ category: 'asc' }, { name: 'asc' }]
  });

  const orphans = dbProducts.filter(p => !frontendSlugs.has(p.slug));
  const matched = dbProducts.filter(p => frontendSlugs.has(p.slug));

  // Recommendation logic
  function recommend(p) {
    const s = p.slug;
    if (p.category === 'stickers-labels-decals') {
      if (/safety|hazard|warning|ppe|fire-ext|first-aid|no-smoking|confined|high-voltage|slip-trip|lockout|arc-flash|forklift|emergency|whmis|crane/.test(s)) {
        return 'Move to safety-warning-decals subcategory';
      }
      if (/asset|warehouse-zone|rack-label|bin-label|cable-panel|dock-door|aisle-marker|zone-label|pipe-marker|valve-tag|parking-lot|electrical-panel|equipment-rating|chemical-storage|stencil/.test(s)) {
        return 'Move to facility-asset-labels subcategory';
      }
      return 'Add to stickers sub-product group or deactivate';
    }
    return 'Review: keep in ' + p.category + ' or deactivate';
  }

  console.log('## ORPHAN PRODUCTS (' + orphans.length + ' total)');
  console.log('');
  console.log('| # | Name | Slug | Category | Recommendation |');
  console.log('|---|------|------|----------|----------------|');

  orphans.forEach((p, i) => {
    console.log(`| ${i+1} | ${p.name} | \`${p.slug}\` | ${p.category} | ${recommend(p)} |`);
  });

  console.log('');
  console.log(`**SUMMARY:** ${matched.length} matched on frontend, ${orphans.length} orphans, ${dbProducts.length} total DB products`);

  // Group by category
  const byCategory = {};
  orphans.forEach(p => {
    if (!byCategory[p.category]) byCategory[p.category] = [];
    byCategory[p.category].push(p);
  });
  console.log('');
  console.log('### Orphans by Category');
  Object.entries(byCategory).sort().forEach(([cat, prods]) => {
    console.log(`\n**${cat}** (${prods.length}):`);
    prods.forEach(p => console.log(`  - \`${p.slug}\` — ${p.name}`));
  });

  await prisma.$disconnect();
}

main();
