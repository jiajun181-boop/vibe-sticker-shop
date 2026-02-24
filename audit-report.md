# Product Data Audit Report

**Generated:** 2026-02-19
**Project:** Vibe Sticker Shop (lunarprint.ca)
**Data Sources Scanned:**
- `lib/catalogConfig.js` — Category & subgroup definitions
- `lib/subProductConfig.js` — Sub-product slug mappings
- `config/products.js` — Master product list (630 lines, 182+ products)
- `lib/i18n/en.js` / `lib/i18n/zh.js` — Product descriptions
- `scripts/seed-*.mjs` — Database seed scripts (25 files)
- `scripts/add-rigid-products.mjs`, `scripts/add-display-products.mjs` — Product creation scripts
- `prisma/seed.mjs` — Base seed data
- `prisma/seed-hardware.mjs` — Hardware/accessories pricing

---

## 1. Complete Product Structure (7 Categories)

### 1.1 Marketing & Business Print (`marketing-business-print`)

| # | SubGroup Slug | Title | DB Product Slugs |
|---|---------------|-------|------------------|
| 1 | `flyers` | Flyers | flyers |
| 2 | `brochures` | Brochures | brochures-bi-fold, brochures-tri-fold, brochures-z-fold |
| 3 | `door-hangers` | Door Hangers | door-hangers-standard, door-hangers-perforated, door-hangers-large |
| 4 | `greeting-invitation-cards` | Greeting & Invitation Cards | greeting-cards, invitation-cards, invitations-flat |
| 5 | `tickets-coupons` | Tickets, Coupons & Loyalty | coupons, tickets, cardstock-prints, loyalty-cards |
| 6 | `menus` | Menus | menus-laminated, menus-takeout, table-mat |
| 7 | `posters` | Posters | posters, posters-glossy, posters-matte, posters-adhesive, posters-backlit |
| 8 | `postcards` | Postcards | postcards |
| 9 | `rack-cards` | Rack Cards | rack-cards |
| 10 | `booklets` | Booklets | booklets, booklets-saddle-stitch, booklets-perfect-bound, booklets-wire-o, catalog-booklets |
| 11 | `bookmarks` | Bookmarks | bookmarks, bookmarks-custom |
| 12 | `calendars` | Calendars | calendars-wall, calendars-wall-desk |
| 13 | `business-cards` | Business Cards | business-cards, business-cards-classic, business-cards-gloss, business-cards-matte, business-cards-soft-touch, business-cards-gold-foil, business-cards-linen, business-cards-pearl, business-cards-thick, magnets-business-card |
| 14 | `stamps` | Stamps | self-inking-stamps, stamps-s827, stamps-s510, stamps-s520, stamps-s542, stamps-r512, stamps-r524, stamps-r532, stamps-r552 |
| 15 | `letterhead` | Letterhead | letterhead, letterhead-standard |
| 16 | `notepads` | Notepads | notepads, notepads-custom |
| 17 | `ncr-forms` | NCR Forms | ncr-forms-duplicate, ncr-forms-triplicate, ncr-invoices |
| 18 | `document-printing` | Document Printing | *(no dbSlugs defined)* |
| 19 | `certificates` | Certificates | *(no dbSlugs defined)* |
| 20 | `shelf-displays` | Shelf Displays | shelf-talkers, shelf-danglers, shelf-wobblers, shelf-displays, wobblers, danglers |
| 21 | `table-tents` | Table Tents | table-tents, table-tent-cards, table-tents-4x6, table-display-cards |

**Also defined in subProductConfig (virtual groups):**
- `tags` — hang-tags, hang-tags-custom, tags-hang-tags, label-sets, retail-tags

---

### 1.2 Stickers & Labels (`stickers-labels-decals`)

| # | SubGroup Slug | Title | DB Product Slugs |
|---|---------------|-------|------------------|
| 1 | `die-cut-stickers` | Die-Cut | die-cut-stickers, stickers-die-cut-custom, holographic-singles, holographic-stickers, foil-stickers, clear-singles, heavy-duty-vinyl-stickers, stickers-color-on-white, stickers-color-on-clear |
| 2 | `kiss-cut-singles` | Kiss-Cut | removable-stickers, kiss-cut-stickers |
| 3 | `sticker-pages` | Sheets & Pages | sticker-sheets, kiss-cut-sticker-sheets, stickers-multi-on-sheet, sticker-packs |
| 4 | `sticker-rolls` | Rolls & Labels | sticker-rolls, roll-labels, stickers-roll-labels, labels-roll-quote, clear-labels, white-bopp-labels, kraft-paper-labels, freezer-labels, barcode-labels, qr-code-labels |
| 5 | `vinyl-lettering` | Vinyl Lettering | vinyl-lettering, transfer-vinyl-lettering |
| 6 | `fire-emergency` | Fire & Emergency | fire-extinguisher-location-stickers, first-aid-location-stickers, emergency-exit-egress-signs-set |
| 7 | `hazard-warning` | Hazard & Warning | hazard-ghs-labels, no-smoking-decals-set, stay-back-warning-decals, safety-notice-decal-pack, parking-lot-stencils, confined-space-warning-signs, slip-trip-hazard-signs, reflective-conspicuity-tape-kit, high-visibility-rear-chevron-kit, reflective-safety-stripes-kit, safety-labels |
| 8 | `ppe-equipment` | PPE & Equipment | ppe-hard-hat-stickers, ppe-required-signs, forklift-safety-decals, crane-lift-capacity-labels |
| 9 | `electrical-chemical` | Electrical & Chemical | lockout-tagout-labels, arc-flash-labels, chemical-storage-labels, high-voltage-warning-signs, whmis-workplace-labels |
| 10 | `asset-equipment-tags` | Asset & Equipment Tags | asset-tags-qr-barcode, asset-tags-tamper-evident, equipment-rating-plates, tool-box-bin-labels |
| 11 | `pipe-valve-labels` | Pipe & Valve Labels | pipe-markers-color-coded, pipe-markers-custom, valve-tags-engraved |
| 12 | `warehouse-labels` | Warehouse Labels | warehouse-zone-labels, rack-labels-warehouse, aisle-markers-hanging, dock-door-numbers, industrial-labels |
| 13 | `electrical-cable-labels` | Electrical & Cable | cable-panel-labels, electrical-panel-labels |

---

### 1.3 Signs & Display Boards (`signs-rigid-boards`)

| # | SubGroup Slug | Title | DB Product Slugs |
|---|---------------|-------|------------------|
| 1 | `yard-lawn-signs` | Yard & Lawn Signs | yard-sign, yard-sign-h-frame, yard-signs-coroplast, yard-sign-panel-only, coroplast-signs, coroplast-yard-signs, lawn-signs-h-stake, double-sided-lawn-signs, directional-arrow-sign, directional-arrow-signs, election-campaign-sign, coroplast-sheet-4mm, coroplast-sheet-6mm, coroplast-sheet-10mm, h-stakes, h-stake-wire |
| 2 | `real-estate-signs` | Real Estate Signs | real-estate-sign, real-estate-agent-sign, real-estate-riders, open-house-sign-kit, real-estate-frame |
| 3 | `a-frames-signs` | A-Frame Signs | a-frame-stand, a-frame-sign-stand, a-frame-sandwich-board, a-frame-insert-prints, a-frame-double-sided, handheld-sign, handheld-signs |
| 4 | `display-tabletop` | Display & Tabletop | a-frame-sandwich-board, a-frame-insert-prints, handheld-sign, handheld-signs, rigid-tabletop-signs, tabletop-signs, standoff-mounted-signs, menu-boards, tags-tickets-rigid, floor-standup-display, dry-erase-rigid-board, tri-fold-presentation-board |
| 5 | `event-photo-boards` | Event & Photo Boards | selfie-frame-board, life-size-cutout, giant-presentation-check, welcome-sign-board, seating-chart-board, event-celebration-board, memorial-tribute-board, photo-collage-board, event-photo-backdrop, handheld-prop-board, face-in-hole-board, photo-board |
| 6 | `business-property` | Business & Property | business-hours-sign, construction-site-signs, safety-signs, wayfinding-signs, parking-property-signs, qr-code-signs, address-house-number-signs, ada-braille-signs |
| 7 | `by-material` | Shop by Material | foam-board, custom-foam-board, foam-board-easel, foam-board-prints, rigid-foam-board-prints, foamboard-sheet-3-16, foamboard-sheet-1-2, acrylic-signs, clear-acrylic-signs, frosted-acrylic-signs, aluminum-signs, aluminum-composite, acm-dibond-signs, pvc-sintra-signs, pvc-sheet-3mm, gatorboard-signs |

**Note:** `display-tabletop` shares 4 products with `a-frames-signs` (a-frame-sandwich-board, a-frame-insert-prints, handheld-sign, handheld-signs).

---

### 1.4 Banners & Displays (`banners-displays`)

> **WARNING:** `catalogConfig.js` defines `subGroups: []` (empty array) for this category. Subgroups only exist in `subProductConfig.js`. The category page uses direct product queries instead of structured segments.

| # | SubGroup Slug | Title | DB Product Slugs |
|---|---------------|-------|------------------|
| 1 | `vinyl-banners` | Vinyl Banners | vinyl-banners, vinyl-banner-13oz, blockout-banners, double-sided-banners |
| 2 | `mesh-banners` | Mesh Banners | mesh-banners, mesh-banner-heavy-duty |
| 3 | `pole-banners` | Pole Banners | pole-banners, pole-banner-single-sided, pole-banner-double-sided, pole-banner-hardware-kit |
| 4 | `fabric-banners` | Fabric Banners | fabric-banner, fabric-banner-double-sided, fabric-banner-hanging |
| 5 | `retractable-stands` | Roll-Up Stands | retractable-banner-stand-premium, deluxe-rollup-banner, pull-up-banner, roll-up-banners, roll-up-stand-hardware, banner-stand-rollup, l-base-banner-stand, banner-stand-l-base |
| 6 | `x-banner-stands` | X-Banner Stands | x-banner-stand-standard, x-banner-stand-large, x-stand-hardware, banner-stand-x, tabletop-x-banner, x-banner-frame-print, x-banner-prints |
| 7 | `tabletop-displays` | Tabletop Displays | tabletop-banner-a4, tabletop-banner-a3, deluxe-tabletop-retractable-a3, tabletop-signs, rigid-tabletop-signs, table-easel-display, standoff-hardware-set, velcro-strips, installation-service |
| 8 | `trade-show-furniture` | Trade Show Furniture | branded-table-cover-6ft, branded-table-runner, table-cloth |
| 9 | `backdrops-popups` | Backdrops & Pop-Ups | telescopic-backdrop, step-repeat-backdrops, step-and-repeat-stand-kit, media-wall-pop-up, backdrop-board, backdrop-stand-hardware, step-repeat-backdrop-8x8, popup-display-curved-8ft, popup-display-straight-8ft, tension-fabric-display-3x3, tension-fabric-display-8ft, tension-fabric-display-10ft, pillowcase-display-frame |
| 10 | `flags-hardware` | Flags & Poles | feather-flags, feather-flag-pole-set, feather-flag-medium, feather-flag-large, teardrop-flags, teardrop-flag-pole-set, teardrop-flag-medium, flag-base-ground-stake, flag-base-water-bag, flag-bases-cross |
| 11 | `tents-outdoor` | Tents & Outdoor | tent-frame-10x10, tent-walls-set, outdoor-canopy-tent-10x10, tent-half-walls, tent-custom-print |

---

### 1.5 Canvas Prints (`canvas-prints`)

| # | SubGroup Slug | Title | DB Product Slugs |
|---|---------------|-------|------------------|
| 1 | `classic-canvas-prints` | Classic Canvas | canvas-standard, canvas-prints-standard |
| 2 | `floating-frame-canvas` | Floating Frame | canvas-gallery-wrap, canvas-framed, gallery-wrap-canvas-prints, framed-canvas-prints |
| 3 | `large-format-canvas` | Large Format | canvas-panoramic, panoramic-canvas-prints |
| 4 | `canvas-collages` | Canvas Collages | canvas-split-2, canvas-split-5, split-panel-canvas-prints |
| 5 | `triptych-canvas-split` | Triptych & Splits | canvas-split-3 |
| 6 | `hex-canvas-prints` | Hexagonal Canvas | **EMPTY** (`dbSlugs: []`) |
| 7 | `rolled-canvas-prints` | Rolled Canvas | **EMPTY** (`dbSlugs: []`) |

> **ISSUE:** `hex-canvas-prints` and `rolled-canvas-prints` have **no products linked** (empty dbSlugs arrays). These subgroup pages will show nothing.

---

### 1.6 Windows, Walls & Floors (`windows-walls-floors`)

| # | SubGroup Slug | Title | DB Product Slugs |
|---|---------------|-------|------------------|
| 1 | `static-clings` | Static Clings | clear-static-cling, frosted-static-cling, static-cling-frosted, static-cling-standard |
| 2 | `adhesive-films` | Adhesive Films | frosted-matte-window-film, holographic-iridescent-film, color-white-on-clear-vinyl, color-white-color-clear-vinyl, dichroic-window-film, gradient-window-film |
| 3 | `one-way-vision` | One-Way Vision | one-way-vision, window-graphics-perforated, one-way-vision-graphics, perforated-window-film, vehicle-window-tint-graphic |
| 4 | `privacy-films` | Privacy Films | frosted-privacy-window-film, frosted-privacy-film |
| 5 | `window-lettering` | Window Lettering | vinyl-lettering, window-cut-vinyl-lettering, window-lettering-business, window-lettering-cut-vinyl, storefront-hours-door-decal-cut-vinyl |
| 6 | `window-graphics` | Window Graphics | window-graphics, window-perforated, window-frosted, window-graphics-blockout, window-graphics-double-sided, window-graphics-standard, frosted-window-graphics, decals-window, window-decals, window-graphics-transparent-color |
| 7 | `wall-graphics` | Wall Graphics | wall-mural-graphic, wall-murals, wall-graphics, wall-decals, decals-wall |
| 8 | `floor-graphics` | Floor Graphics | floor-graphics, warehouse-floor-graphics, warehouse-floor-safety-graphics, floor-arrows, floor-number-markers, floor-decals, floor-direction-arrows-set, floor-logo-graphic, floor-number-markers-set, decals-floor |

---

### 1.7 Vehicle Graphics & Fleet (`vehicle-graphics-fleet`)

| # | SubGroup Slug | Title | DB Product Slugs |
|---|---------------|-------|------------------|
| 1 | `vehicle-wraps` | Vehicle Wraps | full-vehicle-wrap-design-print, vehicle-wrap-print-only-quote, partial-wrap-spot-graphics, vehicle-roof-wrap, trailer-full-wrap, trailer-box-truck-large-graphics, car-graphics |
| 2 | `door-panel-graphics` | Door & Panel | custom-truck-door-lettering-kit, printed-truck-door-decals-full-color, truck-side-panel-printed-decal, car-hood-decal, tailgate-rear-door-printed-decal |
| 3 | `vehicle-decals` | Decals & Lettering | vinyl-lettering, custom-printed-vehicle-logo-decals, custom-cut-vinyl-lettering-any-text, removable-promo-vehicle-decals, long-term-outdoor-vehicle-decals, social-qr-vehicle-decals, bumper-sticker-custom, boat-lettering-registration |
| 4 | `magnetic-signs` | Magnetic Signs | magnetic-truck-door-signs, magnetic-car-signs, car-door-magnets-pair, magnetic-rooftop-sign, magnets-flexible |
| 5 | `fleet-packages` | Fleet Packages | fleet-graphic-package, high-visibility-rear-chevron-kit, reflective-conspicuity-tape-kit, reflective-safety-stripes-kit, stay-back-warning-decals |
| 6 | `dot-mc-numbers` | DOT & MC Numbers | usdot-number-decals, mc-number-decals, tssa-truck-number-lettering-cut-vinyl, cvor-number-decals, nsc-number-decals, trailer-id-number-decals |
| 7 | `unit-weight-ids` | Unit & Weight IDs | fleet-unit-number-stickers, gvw-tare-weight-lettering, equipment-id-decals-cut-vinyl |
| 8 | `spec-labels` | Spec Labels | fuel-type-labels-diesel-gas, tire-pressure-load-labels, dangerous-goods-placards |
| 9 | `inspection-compliance` | Inspection & Compliance | vehicle-inspection-maintenance-stickers, truck-door-compliance-kit, fleet-vehicle-inspection-book, ifta-cab-card-holder, hours-of-service-log-holder |

---

## 2. "A-Frame" / "One Metal A-Frame" in Non-A-Frame Products

### Search Results

**"One Metal A-Frame"**: **NOT FOUND** anywhere in the entire codebase.

**"A-Frame" references** — All instances found are in legitimate A-Frame products or their configuration:

| File | Context | Is A-Frame Product? |
|------|---------|---------------------|
| `config/products.js:455` | `a-frame-double-sided` — "Double-Sided A-Frame" | YES |
| `config/products.js:490` | `a-frame-stand` — "A-Frame Stand" | YES |
| `config/products.js:505` | `a-frame-sign-stand` — "A-Frame Sidewalk Stand" | YES |
| `config/products.js:569` | `a-frame-insert-prints` — "A-Frame Inserts" | YES |
| `lib/i18n/en.js:1493` | `sp.a-frames-signs.title` — "A-Frames & Signs" | YES (subgroup page) |
| `lib/i18n/en.js:1591` | `sp.a-frame-signs.title` — "A-Frame Signs" | YES (subgroup page) |
| `prisma/seed-hardware.mjs:24` | `a-frame-stand` — "A-Frame Stand (included)" | YES (hardware) |
| `prisma/seed-hardware.mjs:32-34` | A-Frame metal frame / aluminum insert / PVC insert upgrades | YES (hardware) |

### Cross-Subgroup Overlap (Potential Confusion)

The `display-tabletop` subgroup (under `signs-rigid-boards`) includes these A-Frame products:
- `a-frame-sandwich-board`
- `a-frame-insert-prints`

These same products also appear in the `a-frames-signs` subgroup. This is **intentional** (shared products across two browsing paths) but could cause confusion if users see A-Frame products on a page titled "Display & Tabletop".

**Conclusion: No non-A-Frame product mentions "A-Frame" in its description. No "One Metal A-Frame" text exists anywhere.**

---

## 3. Products with $0 / $0.00 Pricing

### 3.1 Draft Products with `minimumPrice: 0` in `config/products.js`

**Total: 182 products** — All marked as `status: "draft"`. These products have no real pricing configured and would show as "Quote" or error on the storefront.

<details>
<summary>Click to expand full list by category</summary>

#### Stickers & Labels (19 products)
| Slug | Name |
|------|------|
| kiss-cut-sticker-sheets | Kiss-Cut Sticker Sheets |
| die-cut-stickers | Die-Cut Stickers |
| clear-labels | Clear Labels |
| white-bopp-labels | White BOPP Labels |
| holographic-stickers | Holographic Stickers |
| foil-stickers | Foil Stickers |
| kraft-paper-labels | Kraft Paper Labels |
| freezer-labels | Freezer Labels |
| removable-stickers | Removable Stickers |
| heavy-duty-vinyl-stickers | Heavy Duty Outdoor Vinyl Stickers |
| floor-decals | Floor Decals |
| wall-decals | Wall Decals |
| window-decals | Window Decals |
| perforated-window-film | Perforated Window Film |
| transfer-vinyl-lettering | Transfer Vinyl Lettering |
| barcode-labels | Barcode Labels |
| qr-code-labels | QR Code Labels |
| roll-labels | Roll Labels |
| sticker-packs | Sticker Packs |

#### Rigid Signs (22 products)
| Slug | Name |
|------|------|
| coroplast-signs | Coroplast Signs |
| lawn-signs-h-stake | Lawn Signs + H-Stake |
| double-sided-lawn-signs | Double-Sided Lawn Signs |
| directional-arrow-signs | Directional Arrow Signs |
| foam-board-prints | Foam Board Prints |
| foam-board-easel | Foam Board + Easel Back |
| gatorboard-signs | Gatorboard Signs |
| pvc-sintra-signs | PVC Sintra Signs |
| acrylic-signs | Acrylic Signs |
| clear-acrylic-signs | Clear Acrylic Signs |
| frosted-acrylic-signs | Frosted Acrylic Signs |
| acm-dibond-signs | ACM / Dibond Signs |
| aluminum-signs | Aluminum Signs |
| magnetic-car-signs | Magnetic Car Signs |
| handheld-signs | Handheld Signs |
| parking-property-signs | Parking & Property Signs |
| safety-signs | Safety Signs |
| construction-site-signs | Construction Site Signs |
| wayfinding-signs | Wayfinding Signs |
| menu-boards | Menu Boards |
| tabletop-signs | Tabletop Signs |
| standoff-mounted-signs | Standoff Mounted Signs |

#### Banners & Displays (21 products)
| Slug | Name |
|------|------|
| vinyl-banners | Vinyl Banners |
| mesh-banners | Mesh Banners |
| double-sided-banners | Double-Sided Banners |
| blockout-banners | Blockout Banners |
| pole-banners | Pole Banners |
| feather-flags | Feather Flags |
| teardrop-flags | Teardrop Flags |
| x-banner-prints | X-Banner Prints |
| roll-up-banners | Roll-Up Banners |
| step-repeat-backdrops | Step & Repeat Backdrops |
| pole-banner-single-sided | Single-Sided Pole Banner |
| pole-banner-double-sided | Double-Sided Pole Banner |
| pole-banner-hardware-kit | Pole Banner Hardware Kit |
| mesh-banner-heavy-duty | Heavy-Duty Mesh Banner |
| fabric-banner | Fabric Banner |
| fabric-banner-double-sided | Double-Sided Fabric Banner |
| fabric-banner-hanging | Hanging Fabric Banner |
| a-frame-double-sided | Double-Sided A-Frame |
| tent-half-walls | Tent Half Walls |
| tent-custom-print | Custom Printed Tent Top |
| tension-fabric-display-8ft | Tension Fabric Display 8ft |
| tension-fabric-display-10ft | Tension Fabric Display 10ft |

#### Marketing Prints (34 products)
| Slug | Name |
|------|------|
| business-cards | Business Cards |
| flyers | Flyers |
| postcards | Postcards |
| brochures | Brochures |
| booklets | Booklets |
| rack-cards | Rack Cards |
| door-hangers | Door Hangers |
| presentation-folders | Presentation Folders |
| posters | Posters |
| mp-business-cards | Business Cards (duplicate) |
| mp-flyers | Flyers (duplicate) |
| mp-brochures | Brochures (duplicate) |
| catalog-booklets | Catalog / Booklets |
| product-inserts | Product Inserts |
| order-forms-single | Order Form |
| release-forms | Release / Waiver Form |
| mp-certificates | Certificates |
| mp-coupons | Coupons |
| mp-menus | Menus |
| mp-postcards | Postcards (duplicate) |
| bookmarks | Bookmarks |
| mp-door-hangers | Door Hangers (duplicate) |
| table-display-cards | Table Display Cards |
| tags-hang-tags | Tags / Hang Tags |
| mp-tickets | Tickets |
| calendars | Calendars |
| box-sleeves | Box Sleeves |
| mp-presentation-folders | Presentation Folders (duplicate) |
| invitation-cards | Invitation Cards |
| greeting-cards | Greeting Cards |
| envelopes | Envelopes |
| ncr-invoices | NCR Invoice |
| mp-letterhead | Letterhead |
| mp-notepads | Notepads |

#### Display Stands (28 products)
| Slug | Name |
|------|------|
| a-frame-stand | A-Frame Stand |
| x-stand-hardware | X-Stand Hardware |
| roll-up-stand-hardware | Roll-Up Stand Hardware |
| backdrop-stand-hardware | Backdrop Stand Hardware |
| step-and-repeat-stand-kit | Step & Repeat Stand Kit |
| tent-frame-10x10 | 10x10 Canopy Tent Frame |
| tent-walls-set | Canopy Tent Side Walls Set |
| feather-flag-pole-set | Feather Flag Pole Set |
| teardrop-flag-pole-set | Teardrop Flag Pole Set |
| flag-bases-cross | Flag Cross Base |
| flag-base-ground-stake | Flag Ground Stake |
| flag-base-water-bag | Flag Water Bag |
| banner-stand-x | X-Stand (Hardware) |
| banner-stand-rollup | Roll-Up Stand (Hardware) |
| banner-stand-l-base | L-Base Banner Stand (Hardware) |
| a-frame-sign-stand | A-Frame Sidewalk Stand |
| h-stakes | H-Stakes |
| grommets-service | Grommets (Service) |
| banner-hems | Banner Hems (Service) |
| pole-pockets | Pole Pockets (Service) |
| drilled-holes-service | Drilled Holes (Service) |
| standoff-hardware-set | Standoff Hardware Set |
| double-sided-tape | Double-Sided Tape (Add-on) |
| velcro-strips | Velcro Strips (Add-on) |
| installation-service | Installation Service |

#### Packaging (6 products)
| Slug | Name |
|------|------|
| thank-you-cards | Thank You Cards |
| packaging-inserts | Packaging Inserts |
| hang-tags | Hang Tags |
| label-sets | Product Label Sets |
| sticker-seals | Sticker Seals |
| packing-slips | Packing Slips |

#### Window Graphics / Large Format (5 products)
| Slug | Name |
|------|------|
| frosted-privacy-film | Frosted Privacy Film |
| full-window-graphics | Full Window Graphics |
| one-way-vision-graphics | One-Way Vision Graphics |
| wall-murals | Wall Murals |
| floor-graphics | Floor Graphics |

#### Retail & Promo (8 products)
| Slug | Name |
|------|------|
| wobblers | Wobbler |
| danglers | Dangler |
| shelf-talkers | Shelf Talkers |
| rp-menus | Menus |
| rp-coupons | Coupons |
| rp-tickets | Tickets |
| table-tent-cards | Table Tent Cards |
| rp-hang-tags | Hang Tags |

#### Additional Draft Stubs (Bilingual names, ~20 products)
| Slug | Name |
|------|------|
| stickers-single-diecut | Die-Cut Stickers (duplicate) |
| stickers-sheet-kisscut | Sticker Sheets (duplicate) |
| stickers-multi-on-sheet | Multi on Sheet |
| labels-clear | Clear Labels (duplicate) |
| labels-white-bopp | White BOPP Labels (duplicate) |
| labels-roll-quote | Roll Labels (duplicate) |
| vinyl-lettering | Vinyl Lettering |
| magnets-flexible | Magnets |
| stickers-color-on-white | Color on White Stickers |
| stickers-color-on-clear | Color on Clear Stickers |
| rigid-foam-board-prints | Foam Board / KT Board |
| backdrop-board | Backdrop Board |
| yard-sign-h-frame | Yard Sign + H-Frame |
| yard-sign-panel-only | Yard Sign Panel |
| real-estate-agent-sign | Real Estate Agent Sign |
| a-frame-insert-prints | A-Frame Inserts |
| rigid-tabletop-signs | Tabletop Signs |
| tags-tickets-rigid | Rigid Tags / Tickets |
| calendars-wall-desk | Calendars |
| pull-up-banner | Pull Up Banner |
| x-banner-frame-print | X-Banner Frame + Print |
| pillowcase-display-frame | Pillowcase Display |
| telescopic-backdrop | Telescopic Backdrop |
| media-wall-pop-up | Media Wall Pop-Up Frame |
| feather-flag | Feather Flag |
| teardrop-flag | Teardrop Flag |
| table-cloth | Table Cloth |
| canvas-prints | Canvas Prints |

</details>

### 3.2 Hardware Items with $0 Price

From `prisma/seed-hardware.mjs`:
| Slug | Name | Price |
|------|------|-------|
| `a-frame-stand` | A-Frame Stand (included) | $0.00 (intentional — bundled with A-Frame sign) |

### 3.3 Self-Inking Stamps `minimumPrice: 0` (but has size-based pricing)

The `self-inking-stamps` product in `config/products.js` has `minimumPrice: 0` but defines per-size pricing (unitCents: $19.99 – $59.99). This is **not a real issue** — the minimum price is just a floor, and actual pricing comes from size selection.

---

## 4. Products Missing Image Paths

### 4.1 Placeholder Images (placehold.co URLs)

Products seeded with `placehold.co` placeholder URLs instead of real product photography:

**From `scripts/add-rigid-products.mjs`** (16 products):
| Slug | Placeholder URL |
|------|----------------|
| photo-board | `placehold.co/400x400/6c5ce7/.../Photo+Board` |
| handheld-sign | `placehold.co/400x400/00b894/.../Handheld+Sign` |
| custom-foam-board | `placehold.co/400x400/0984e3/.../Foam+Board` |
| yard-sign | `placehold.co/400x400/fdcb6e/.../Yard+Sign` |
| yard-sign-h-frame | `placehold.co/400x400/e17055/.../Yard+Sign+H-Frame` |
| real-estate-sign | `placehold.co/400x400/d63031/.../Real+Estate` |
| table-easel-display | `placehold.co/400x400/a29bfe/.../Table+Easel` |
| a-frame-sandwich-board | `placehold.co/400x400/2d3436/.../A-Frame` |
| election-campaign-sign | `placehold.co/400x400/0052cc/.../Election+Sign` |
| directional-arrow-sign | `placehold.co/400x400/ff7675/.../Arrow+Sign` |
| foamboard-sheet-3-16 | `placehold.co/400x400/dfe6e9/.../Foam+3/16` |
| foamboard-sheet-1-2 | `placehold.co/400x400/b2bec3/.../Foam+1/2` |
| coroplast-sheet-4mm | `placehold.co/400x400/ffeaa7/.../Coroplast+4mm` |
| coroplast-sheet-6mm | `placehold.co/400x400/fab1a0/.../Coroplast+6mm` |
| coroplast-sheet-10mm | `placehold.co/400x400/e17055/.../Coroplast+10mm` |
| pvc-sheet-3mm | `placehold.co/400x400/636e72/.../PVC+3mm` |

**From `scripts/add-display-products.mjs`** (14 products):
| Slug | Placeholder URL |
|------|----------------|
| retractable-banner-stand-premium | `placehold.co/400x600/.../Retractable+Stand` |
| x-banner-stand-standard | `placehold.co/400x600/.../X-Banner+24x63` |
| x-banner-stand-large | `placehold.co/400x600/.../X-Banner+31x71` |
| tabletop-banner-a4 | `placehold.co/400x300/.../Tabletop+A4` |
| tabletop-banner-a3 | `placehold.co/400x300/.../Tabletop+A3` |
| deluxe-tabletop-retractable-a3 | `placehold.co/400x300/.../Deluxe+A3` |
| h-stake-wire | `placehold.co/400x400/.../H-Stake` |
| a-frame-stand | `placehold.co/400x400/.../A-Frame` |
| real-estate-frame | `placehold.co/400x400/.../RE+Frame` |
| l-base-banner-stand | `placehold.co/400x600/.../L-Base` |
| tabletop-x-banner | `placehold.co/400x300/.../Tabletop+X` |
| deluxe-rollup-banner | `placehold.co/400x600/.../Deluxe+Rollup` |
| telescopic-backdrop | `placehold.co/400x400/.../Backdrop+10x10` |

**From `prisma/seed.mjs`** — ALL products seeded via this file use `placeholderUrl()`:
```js
function placeholderUrl(name) {
  return `https://placehold.co/600x400/png?text=${encodeURIComponent(name)}`;
}
```

### 4.2 Subgroups with NO Products (Empty dbSlugs)

These subgroup landing pages will show **zero products**:

| Category | SubGroup | dbSlugs |
|----------|----------|---------|
| `canvas-prints` | `hex-canvas-prints` | `[]` (empty) |
| `canvas-prints` | `rolled-canvas-prints` | `[]` (empty) |

### 4.3 CatalogConfig SubGroups Without SubProductConfig Entry

These subgroups are listed in `catalogConfig.js` but have **no matching entry** in `subProductConfig.js`:

| Category | SubGroup Slug | Notes |
|----------|---------------|-------|
| `marketing-business-print` | `flyers` | No sub-products defined, single product |
| `marketing-business-print` | `postcards` | No sub-products defined, single product |
| `marketing-business-print` | `rack-cards` | No sub-products defined, single product |
| `marketing-business-print` | `document-printing` | No sub-products defined |
| `marketing-business-print` | `certificates` | No sub-products defined |

---

## 5. Summary of Issues Found

| # | Severity | Issue | Count |
|---|----------|-------|-------|
| 1 | **HIGH** | Products with `minimumPrice: 0` (no pricing configured) | 182 |
| 2 | **HIGH** | Products using placeholder images (placehold.co) | 30+ |
| 3 | **MEDIUM** | All products from `prisma/seed.mjs` use generic placeholder images | All base seeds |
| 4 | **MEDIUM** | Subgroups with empty product arrays (`hex-canvas-prints`, `rolled-canvas-prints`) | 2 |
| 5 | **MEDIUM** | `banners-displays` category has `subGroups: []` in catalogConfig — navigation gap | 1 |
| 6 | **LOW** | CatalogConfig subgroups without SubProductConfig entries (5 single-product groups) | 5 |
| 7 | **LOW** | `display-tabletop` contains A-Frame products (cross-group overlap) | 4 shared products |
| 8 | **NONE** | "One Metal A-Frame" text — **not found anywhere** | 0 |
| 9 | **NONE** | Non-A-Frame products mentioning "A-Frame" — **none found** | 0 |

---

## 6. Total Product Count Summary

| Category (config/products.js) | Count |
|-------------------------------|-------|
| stickers-labels | 29 |
| rigid-signs | 31 |
| banners-displays | 22 |
| marketing-prints | 34 |
| display-stands | 28 |
| packaging | 6 |
| large-format-graphics | 11 |
| retail-promo | 8 |
| **Subtotal (config/products.js)** | **~182 draft + 9 templated** |

| Category (subProductConfig.js unique DB slugs) | Unique Slugs |
|-------------------------------------------------|-------------|
| marketing-business-print | ~68 |
| stickers-labels-decals | ~56 |
| signs-rigid-boards | ~74 |
| banners-displays | ~72 |
| canvas-prints | ~12 |
| windows-walls-floors | ~51 |
| vehicle-graphics-fleet | ~55 |
| **Total unique DB slugs across all subgroups** | **~388** |

> Note: Many slugs are duplicated across categories (e.g., `vinyl-lettering` appears in stickers, windows, and vehicle categories). Some draft products in `config/products.js` use old category names that have since been consolidated.
