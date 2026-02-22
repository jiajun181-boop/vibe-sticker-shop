# lunarprint.ca SEO Technical Spec (URL Architecture + Technical SEO)

## 0) Scope & Deliverables

This spec defines the canonical URL architecture, landing-page structure, technical SEO rules, redirect strategy, and JSON-LD implementation guidance for **lunarprint.ca**.

Output files:
- `url-mapping.csv` (207-row old slug -> new canonical URL mapping)
- `schema-templates.json` (JSON-LD templates)
- `seo-technical-spec.md` (this document)

Business context:
- **La Lunar Printing**
- **11 Progress Ave #21, Scarborough, ON**
- Service area: **GTA (Greater Toronto Area)**
- Core customers: small businesses, real estate agents, restaurants, event planners

## 1) Canonical URL Structure

### 1.1 Global URL Rules
- Product URLs must stay within max depth `/category/product/`
- Lowercase only
- Hyphen-separated slugs only
- Trailing slash on all canonical URLs
- No dates, IDs, or meaningless query parameters in canonical URLs
- Keep slugs readable and keyword-forward

### 1.2 Canonical Category Segments

| Current category key | New segment | Example |
|---|---|---|
| `marketing-business-print` | `/print/` | `/print/business-cards/` |
| `stickers-labels-decals` | `/stickers/` | `/stickers/die-cut-stickers/` |
| `signs-rigid-boards` | `/signs/` | `/signs/yard-signs/` |
| `banners-displays` | `/banners/` | `/banners/retractable-banners/` |
| `canvas-prints` | `/canvas/` | `/canvas/canvas-prints/` |
| `vehicle-graphics-fleet` | `/vehicle-graphics/` | `/vehicle-graphics/vehicle-wraps/` |
| `windows-walls-floors` | `/surface-graphics/` | `/surface-graphics/one-way-vision-film/` |

### 1.3 Consolidation Rules
- Variants and legacy slugs should 301 to the canonical family/product page where content overlaps.
- Transactional/order pages can remain for checkout UX, but canonicalize to the public SEO page if they duplicate content.
- Avoid one canonical URL per finish/size unless the page has unique, substantial content and search demand.

### 1.4 207-Row Mapping Summary (This Batch)

Counts (must match requested total 207):

| Category | Count | Source used for mapping |
|---|---:|---|
| stickers-labels-decals | 57 | Live export subset (excluding `vinyl-lettering` + `electrical-cable-labels` subgroups for this SEO set) |
| marketing-business-print | 62 | `catalogConfig` subgroups expanded via `subProductConfig` (excluding `stamps` and `shelf-displays`) |
| signs-rigid-boards | 12 | Current catalog sign family pages |
| banners-displays | 14 | Curated 14 canonical banner/display product families |
| canvas-prints | 7 | Current catalog canvas family pages |
| vehicle-graphics-fleet | 46 | All live vehicle/fleet products |
| windows-walls-floors | 9 | Current catalog surface family pages |

Representative mappings (full list is in `url-mapping.csv`):

| old_category | old_slug | new_url | source_type |
|---|---|---|---|
| stickers-labels-decals | clear-singles | /stickers/die-cut-stickers/ | liveProduct |
| stickers-labels-decals | stickers-color-on-clear | /stickers/die-cut-stickers/ | liveProduct |
| stickers-labels-decals | stickers-color-on-white | /stickers/die-cut-stickers/ | liveProduct |
| stickers-labels-decals | stickers-single-diecut | /stickers/die-cut-stickers/ | liveProduct |
| stickers-labels-decals | die-cut-stickers | /stickers/die-cut-stickers/ | liveProduct |
| stickers-labels-decals | die-cut-singles | /stickers/die-cut-stickers/ | liveProduct |
| stickers-labels-decals | foil-stickers | /stickers/die-cut-stickers/ | liveProduct |
| stickers-labels-decals | heavy-duty-vinyl-stickers | /stickers/die-cut-stickers/ | liveProduct |
| stickers-labels-decals | holographic-singles | /stickers/die-cut-stickers/ | liveProduct |
| stickers-labels-decals | holographic-stickers | /stickers/die-cut-stickers/ | liveProduct |
| stickers-labels-decals | stickers-die-cut-custom | /stickers/die-cut-stickers/ | liveProduct |
| stickers-labels-decals | removable-stickers | /stickers/kiss-cut-stickers/ | liveProduct |
| stickers-labels-decals | kiss-cut-sticker-sheets | /stickers/sticker-sheets/ | liveProduct |
| stickers-labels-decals | stickers-multi-on-sheet | /stickers/sticker-sheets/ | liveProduct |
| stickers-labels-decals | sticker-packs | /stickers/sticker-sheets/ | liveProduct |
| stickers-labels-decals | sticker-sheets | /stickers/sticker-sheets/ | liveProduct |
| stickers-labels-decals | stickers-sheet-kisscut | /stickers/sticker-sheets/ | liveProduct |
| stickers-labels-decals | barcode-labels | /stickers/roll-labels/ | liveProduct |
| stickers-labels-decals | labels-clear | /stickers/roll-labels/ | liveProduct |
| stickers-labels-decals | clear-labels | /stickers/roll-labels/ | liveProduct |

## 2) Scenario / Landing Page URL Architecture

These pages are **SEO landing pages** for local-intent and use-case queries (not product configurator pages).

### 2.1 Landing URL Rules
- Namespace: `/printing/`
- One primary intent per page (product + city OR use case + geography)
- Link to 1 primary product page + 2 related pages
- Include local proof (address, service area, turnaround, pickup/delivery)
- Add unique FAQs and use-case examples to avoid thin/duplicate pages

### 2.2 Landing Page URL List (80 total)

| URL | Cluster | Primary Intent | Primary / Related Product Targets |
|---|---|---|---|
| /printing/business-cards-scarborough/ | Business Cards | Local service + core product | /print/business-cards/ |
| /printing/rush-business-cards-toronto/ | Business Cards | Rush turnaround | /print/business-cards/ |
| /printing/real-estate-business-cards-gta/ | Business Cards | Industry use case | /print/business-cards/ |
| /printing/flyers-scarborough/ | Flyers | Local product query | /print/flyers/ |
| /printing/same-day-flyer-printing-toronto/ | Flyers | Same-day / rush | /print/flyers/ |
| /printing/restaurant-flyers-gta/ | Flyers | Restaurant promo use case | /print/flyers/ |
| /printing/postcards-scarborough/ | Postcards | Local product query | /print/postcards/ |
| /printing/direct-mail-postcards-toronto/ | Postcards | Direct mail campaign | /print/postcards/ |
| /printing/realtor-postcards-gta/ | Postcards | Realtor farming use case | /print/postcards/ |
| /printing/brochure-printing-scarborough/ | Brochures | Local brochure search | /print/brochures/ |
| /printing/tri-fold-brochures-toronto/ | Brochures | Format-specific search | /print/brochures/ |
| /printing/company-brochures-gta/ | Brochures | B2B collateral | /print/brochures/ |
| /printing/booklet-printing-scarborough/ | Booklets | Local booklet search | /print/booklets/ |
| /printing/saddle-stitch-booklets-toronto/ | Booklets | Binding-specific search | /print/booklets/ |
| /printing/program-booklets-gta/ | Booklets | Event program use case | /print/booklets/ |
| /printing/menu-printing-scarborough/ | Menus | Local menu printing | /print/menus/ |
| /printing/takeout-menus-toronto/ | Menus | Restaurant takeout menu | /print/menus/ |
| /printing/laminated-menus-gta/ | Menus | Finish-specific search | /print/menus/ |
| /printing/door-hangers-scarborough/ | Door Hangers | Local product query | /print/door-hangers/ |
| /printing/real-estate-door-hangers-toronto/ | Door Hangers | Realtor use case | /print/door-hangers/ |
| /printing/promo-door-hangers-gta/ | Door Hangers | Campaign use case | /print/door-hangers/ |
| /printing/ncr-forms-scarborough/ | NCR Forms | Local business forms | /print/ncr-forms/ |
| /printing/carbonless-invoice-books-toronto/ | NCR Forms | Invoice books | /print/ncr-forms/ |
| /printing/work-order-forms-gta/ | NCR Forms | Service business use case | /print/ncr-forms/ |
| /printing/rack-cards-scarborough/ | Rack Cards | Local rack card printing | /print/rack-cards/ |
| /printing/tourism-rack-cards-toronto/ | Rack Cards | Hospitality/tourism use case | /print/rack-cards/ |
| /printing/clinic-rack-cards-gta/ | Rack Cards | Clinic use case | /print/rack-cards/ |
| /printing/poster-printing-scarborough/ | Posters | Local poster printing | /print/posters/ |
| /printing/13x19-posters-toronto/ | Posters | Size-specific search | /print/posters/ |
| /printing/event-posters-gta/ | Posters | Event promo use case | /print/posters/ |
| /printing/custom-stickers-scarborough/ | Die-Cut Stickers | Local sticker query | /stickers/die-cut-stickers/ |
| /printing/die-cut-stickers-toronto/ | Die-Cut Stickers | Product + city | /stickers/die-cut-stickers/ |
| /printing/kiss-cut-stickers-scarborough/ | Kiss-Cut Stickers | Local product query | /stickers/kiss-cut-stickers/ |
| /printing/sticker-sheets-toronto/ | Sticker Sheets | Product + city | /stickers/sticker-sheets/ |
| /printing/packaging-stickers-gta/ | Sticker Sheets / Labels | Packaging use case | /stickers/sticker-sheets/ | /stickers/roll-labels/ |
| /printing/roll-labels-scarborough/ | Roll Labels | Local roll-label query | /stickers/roll-labels/ |
| /printing/bottle-label-printing-toronto/ | Roll Labels | Bottle label packaging | /stickers/roll-labels/ |
| /printing/jar-labels-gta/ | Roll Labels | Jar label packaging | /stickers/roll-labels/ |
| /printing/vinyl-decals-scarborough/ | Decals | Local decals query | /stickers/die-cut-stickers/ | /surface-graphics/window-decals-opaque/ |
| /printing/yard-signs-scarborough/ | Yard Signs | Local yard signs | /signs/yard-signs/ |
| /printing/coroplast-yard-signs-toronto/ | Yard Signs | Material-specific search | /signs/yard-signs/ |
| /printing/yard-signs-near-me-gta/ | Yard Signs | Near me | /signs/yard-signs/ |
| /printing/real-estate-signs-scarborough/ | Real Estate Signs | Realtor signage | /signs/real-estate-signs/ |
| /printing/open-house-signs-toronto/ | Open House Signs | Open house wayfinding | /signs/open-house-signs/ |
| /printing/election-signs-gta/ | Election Signs | Campaign signage | /signs/election-signs/ |
| /printing/directional-signs-scarborough/ | Directional Signs | Wayfinding signage | /signs/directional-signs/ |
| /printing/foam-board-prints-toronto/ | Foam / Event Boards | Indoor display boards | /signs/event-photo-boards/ | /signs/presentation-boards/ |
| /printing/a-frame-signs-gta/ | A-Frame Signs | Sidewalk signage | /signs/a-frame-signs/ |
| /printing/vinyl-banners-scarborough/ | Vinyl Banners | Local banner query | /banners/vinyl-banners/ |
| /printing/mesh-banners-gta/ | Mesh Banners | Fence/construction banner use case | /banners/mesh-banners/ |
| /printing/retractable-banners-scarborough/ | Retractable Banners | Trade show display | /banners/retractable-banners/ |
| /printing/roll-up-banners-toronto/ | Retractable Banners | Synonym capture | /banners/retractable-banners/ |
| /printing/x-banners-gta/ | X-Banners | Budget event display | /banners/x-banners/ |
| /printing/tabletop-banners-scarborough/ | Tabletop Banners | Counter display | /banners/tabletop-banners/ |
| /printing/step-and-repeat-backdrops-toronto/ | Backdrops | Event backdrop | /banners/step-repeat-backdrops/ |
| /printing/trade-show-displays-gta/ | Trade Show Displays | Cluster page for booth displays | /banners/retractable-banners/ | /banners/fabric-pop-up-display/ | /banners/step-repeat-backdrops/ |
| /printing/feather-flags-scarborough/ | Feather Flags | Outdoor event display | /banners/feather-flags/ |
| /printing/teardrop-flags-toronto/ | Teardrop Flags | Outdoor event display | /banners/teardrop-flags/ |
| /printing/custom-event-tents-gta/ | Custom Tents | Event canopy search | /banners/custom-tent-10x10/ |
| /printing/table-cloths-scarborough/ | Table Cloths | Exhibition table branding | /banners/table-cloths/ |
| /printing/telescopic-backdrops-toronto/ | Telescopic Backdrops | Portable backdrop stand | /banners/adjustable-telescopic-backdrop/ |
| /printing/fabric-pop-up-displays-gta/ | Fabric Pop-Up Displays | Trade show booth display | /banners/fabric-pop-up-display/ |
| /printing/canvas-prints-scarborough/ | Canvas Prints | Local canvas prints | /canvas/canvas-prints/ |
| /printing/gallery-wrap-canvas-toronto/ | Gallery Wrap Canvas | Gallery wrap intent | /canvas/large-format-canvas/ | /canvas/canvas-prints/ |
| /printing/framed-canvas-gta/ | Framed Canvas | Framed wall art intent | /canvas/floating-frame-canvas/ |
| /printing/multi-panel-canvas-toronto/ | Multi-Panel Canvas | Triptych/split panel intent | /canvas/triptych-canvas-split/ | /canvas/canvas-collages/ |
| /printing/window-decals-scarborough/ | Window Decals | Storefront decal query | /surface-graphics/window-decals-opaque/ |
| /printing/one-way-vision-film-toronto/ | One-Way Vision | Perforated film query | /surface-graphics/one-way-vision-film/ |
| /printing/frosted-window-film-gta/ | Frosted Film | Privacy film query | /surface-graphics/frosted-privacy-film/ |
| /printing/wall-decals-scarborough/ | Wall Graphics | Wall decal / mural intent | /surface-graphics/wall-graphics/ |
| /printing/floor-decals-toronto/ | Floor Graphics | Floor decal / wayfinding intent | /surface-graphics/floor-graphics/ |
| /printing/storefront-window-graphics-gta/ | Storefront Graphics | Window graphics cluster | /surface-graphics/window-decals-opaque/ | /surface-graphics/one-way-vision-film/ | /surface-graphics/frosted-privacy-film/ |
| /printing/vehicle-lettering-scarborough/ | Vehicle Lettering | Core local vehicle lettering | /vehicle-graphics/vehicle-decals-lettering/ |
| /printing/van-logo-decals-toronto/ | Van/Truck Logo Decals | Service van branding | /vehicle-graphics/truck-door-logo-decals/ |
| /printing/car-graphics-gta/ | Car Graphics | Car branding | /vehicle-graphics/vehicle-wraps/ | /vehicle-graphics/vehicle-decals-lettering/ |
| /printing/fleet-unit-number-decals-scarborough/ | Fleet Unit Numbers | Fleet ID decals | /vehicle-graphics/fleet-unit-number-weight-decals/ |
| /printing/cvor-number-decals-toronto/ | CVOR/DOT/MC | Compliance number decals | /vehicle-graphics/dot-mc-cvor-number-decals/ |
| /printing/truck-door-lettering-scarborough/ | Truck Door Lettering | Truck door kit search | /vehicle-graphics/truck-door-logo-decals/ |
| /printing/magnetic-vehicle-signs-toronto/ | Magnetic Signs | Temporary vehicle signage | /vehicle-graphics/magnetic-vehicle-signs/ |
| /printing/fleet-branding-gta/ | Fleet Branding | Fleet package cluster | /vehicle-graphics/fleet-branding-kits/ | /vehicle-graphics/vehicle-wraps/ |

### 2.3 Landing Page Content Template (Recommended)
- H1: product + city intent (e.g., "Custom Business Card Printing in Scarborough")
- Local intro: Scarborough shop + GTA delivery/pickup + turnaround promise
- Use-case blocks: real estate / restaurant / event / service business examples
- Specs snapshot: common sizes, materials, finishes, turnaround
- CTA block: Order / Get Quote / Contact
- FAQ block (3-6 questions) specific to the intent
- Internal links: product page, category hub, adjacent landing pages

## 3) Schema.org / JSON-LD

Templates are in `schema-templates.json` for:
- `LocalBusiness` (homepage)
- `Organization`
- `Product` (product pages)
- `BreadcrumbList`
- `FAQPage`

Implementation notes:
- Render JSON-LD server-side in Next.js layouts/pages
- Use canonical URLs in `url` and `@id`
- Keep price/availability in schema consistent with visible page content
- Only apply FAQ schema to visible FAQ content

## 4) Technical SEO Checklist

### 4.1 robots.txt

Goals:
- Allow crawling for public pages
- Block admin/account/cart/checkout/API/private routes
- Publish sitemap index URL

Recommended baseline:

```txt
User-agent: *
Allow: /

Disallow: /admin/
Disallow: /api/
Disallow: /account/
Disallow: /cart/
Disallow: /checkout/
Disallow: /login
Disallow: /signup
Disallow: /reset-password
Disallow: /track-order
Disallow: /invite/

# Optional query-parameter crawl controls (if these URLs are generated)
Disallow: /*?*sort=
Disallow: /*?*filter=
Disallow: /*?*page=
Disallow: /*?*view=

Sitemap: https://lunarprint.ca/sitemap.xml
```

Notes:
- If `/order/*` pages are transactional duplicates, use `noindex,follow` and canonical to product pages.
- Keep support/legal pages indexable if they provide user value.

### 4.2 sitemap.xml Structure

Use a sitemap index and split by page type:
- `/sitemap.xml` (index)
- `/sitemaps/sitemap-products.xml` (canonical product pages from `url-mapping.csv`)
- `/sitemaps/sitemap-landing-pages.xml` (`/printing/*` pages)
- `/sitemaps/sitemap-categories.xml` (7 category hubs)
- `/sitemaps/sitemap-static.xml` (home, contact, about, faq, policies)
- Optional: `/sitemaps/sitemap-images.xml`

### 4.3 Canonical URL Rules

- Canonical must always use final production domain + trailing slash
- Strip tracking params (`utm_*`, `gclid`, `fbclid`) from canonical
- Filter/sort URLs should canonicalize to base page unless intentionally indexable
- Legacy `/shop/*` and `/order/*` product-like pages should canonicalize or 301 to the new product URL

Examples:
- `https://lunarprint.ca/print/business-cards/`
- `https://lunarprint.ca/stickers/die-cut-stickers/`
- `https://lunarprint.ca/banners/retractable-banners/`

### 4.4 Open Graph / Twitter Card Meta Template

```html
<title>{{seo_title}}</title>
<meta name="description" content="{{meta_description}}" />
<link rel="canonical" href="{{canonical_url}}" />

<meta property="og:type" content="website" />
<meta property="og:site_name" content="La Lunar Printing" />
<meta property="og:title" content="{{og_title}}" />
<meta property="og:description" content="{{og_description}}" />
<meta property="og:url" content="{{canonical_url}}" />
<meta property="og:image" content="{{og_image_url}}" />
<meta property="og:image:alt" content="{{og_image_alt}}" />
<meta property="og:locale" content="en_CA" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{{og_title}}" />
<meta name="twitter:description" content="{{og_description}}" />
<meta name="twitter:image" content="{{og_image_url}}" />
```

Guidance:
- Use consistent 1200x630 OG images
- Prefer real product imagery over logo-only graphics
- Unique OG title/description for landing pages vs product pages

### 4.5 301 Redirect Plan

- `url-mapping.csv` is the source of truth for exact slug -> canonical URL redirects (207 rows in this batch)
- Implement a lookup-based redirect layer before generic pattern redirects
- Collapse redirect chains (old -> final only, no multi-hop)

Recommended redirect layers:
1. Exact slug map (CSV-driven)
2. Category alias rewrites (e.g., `/shop/stickers-labels-decals/*` -> `/stickers/*`)
3. Legacy `/order/*` routes (redirect or canonical based on transactional necessity)

### 4.6 Internal Linking Strategy

Category pages:
- Link to all canonical product pages (or top 12 + "view all")
- Link to 3-6 high-intent landing pages in the same category
- Add "popular combinations" modules (e.g., business cards + flyers + postcards)

Product pages:
- Breadcrumb -> category hub
- 3 sibling alternatives (same category)
- 2 complementary products (cross-sell)
- 2-3 scenario pages (local/use-case landing pages)
- Link to quote/contact for custom jobs

Landing pages:
- Link to 1 primary product page + 2 related products
- Link back to category hub
- Include Scarborough/GTA trust signals and local CTAs

Anchor text:
- Use natural descriptive anchors (not only exact-match repeated anchors)
- Rotate between product name, use case, and city-modified anchors

### 4.7 Image Alt Text Rules

Primary product image alt pattern:
- `[Product name] printed by La Lunar Printing in Scarborough, Ontario`

Gallery/context image examples:
- `Retractable banner stand at a Toronto trade show booth`
- `Coroplast yard signs installed with H-wire stakes on a lawn`

Rules:
- Unique alt text per image on page
- Do not keyword-stuff city names into every image
- Decorative imagery should use empty alt (`alt=""`)

### 4.8 Page Speed + Next.js Rendering Strategy

Prefer SSG/ISR for:
- Category hubs
- Product pages
- SEO landing pages
- FAQ / About / Contact (if mostly static)

Use SSR/dynamic for:
- Cart, checkout, account, admin
- Personalized pages
- Dynamic order-tracking states

Performance checklist:
- Use `generateStaticParams` for canonical product and landing pages
- Use ISR (`revalidate`) for product/landing pages
- Render metadata server-side
- Use `next/image` with width/height and modern formats (WebP/AVIF)
- Prioritize LCP images on product pages
- Lazy-load galleries/reviews/comparison tables/chat widgets
- Minimize client JS on SEO pages (prefer server components)
- Prevent CLS from images/fonts

## 5) Google Business Profile (GBP) Optimization

### 5.1 Category Recommendations

Primary category (recommended):
- **Print shop** (confirm exact label in current GBP category picker)

Secondary categories (choose only those available + relevant):
- Commercial printer
- Sign shop
- Banner store
- Digital printing service (or closest available equivalent)
- Vehicle wrapping service (if installation/wrap service is offered)
- Sticker/decal related category (if available in picker)

Note:
- GBP category names can change. Final choices should be verified in GBP UI before publishing.

### 5.2 Service Area Recommendations (GTA)

Base location/pickup:
- **11 Progress Ave #21, Scarborough, ON**

Recommended service areas:
- Scarborough
- Toronto
- North York
- Etobicoke
- East York
- Markham
- Richmond Hill
- Vaughan
- Mississauga
- Brampton
- Pickering
- Ajax
- Whitby
- Oshawa (only if regularly serviced)

### 5.3 GBP Product / Service Listings

Start with the highest-converting services:
- Business Cards
- Flyers
- Postcards
- Brochures
- Die-Cut Stickers
- Roll Labels
- Yard Signs (Coroplast)
- Vinyl Banners
- Retractable Banners
- Feather / Teardrop Flags
- Window Graphics / Frosted Film
- Vehicle Lettering / Fleet Decals

For each listing:
- Add a short benefit-led description
- Add "From" pricing only when stable
- Link to canonical product URL (UTM-tagged)
- Mention local pickup + GTA turnaround

### 5.4 GBP Posting Strategy

Cadence:
- 1-2 posts per week, consistently

Post themes (rotate):
- Product spotlights (stickers, yard signs, banners, window film)
- Local seasonal campaigns (open houses, restaurant promos, events)
- Rush-turnaround examples
- Before/after installs (window film, vehicle lettering)
- FAQ mini-posts (file setup, pickup, turnaround)

Measurement:
- Use UTM links for GBP posts and products/services
- Track calls, direction requests, website clicks, and landing-page conversions

## 6) Implementation Assumptions for This 207-Row Batch

This deliverable intentionally matches the requested **207** rows using a reproducible ruleset from current repo sources:
- `lib/catalogConfig.js`
- `lib/subProductConfig.js`
- `docs/category-under-products-live-order.csv`

Selection assumptions used:
- **Marketing (62):** catalog subgroups expanded via `subProductConfig`, excluding `stamps` and `shelf-displays`
- **Stickers (57):** live sticker export minus `vinyl-lettering` and `electrical-cable-labels` subgroups for this SEO set
- **Signs (12), Canvas (7), Windows (9):** current catalog family pages
- **Banners (14):** curated canonical banner/display families aligned with target SEO taxonomy
- **Vehicle (46):** all live vehicle/fleet products

If you want a separate **full legacy redirect matrix** for every DB SKU (beyond this 207-page SEO set), generate an additional CSV and keep this file as the canonical product URL plan.
