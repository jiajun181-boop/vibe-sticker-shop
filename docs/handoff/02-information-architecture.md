# Document 2: Website Information Architecture — lunarprint.ca

## 5. Core Feature Modules

### Module 1: Product Display & Category System
**Priority: MVP (Complete)**

- **200+ products** across 11 categories
- Dynamic category pages (`/shop/[category]`) with search, sort, filter tabs, sub-category chips
- Product pages (`/shop/[category]/[product]`) with configurator, pricing sidebar, delivery estimate
- "From $X.XX" pricing on all category cards
- Family landing pages (stickers, marketing, signs, vehicle, windows, stamps) — group related products with comparison tables and "browse by need" scenarios

**Key files:**
- `app/shop/[category]/page.js` — Dynamic category page
- `app/shop/[category]/[product]/page.js` — Dynamic product page
- `lib/storefront/*.js` — 7 family config files
- `lib/catalogConfig.js` — Navigation structure (7 departments)

### Module 2: Product Configurators (10 types)
**Priority: MVP (Complete)**

Each product type has its own configurator component that guides the user through options:

| Configurator | Products | Key options |
|-------------|----------|-------------|
| **business-cards** | 9 variants | Paper stock, sides, rounded corners, multi-name, lamination |
| **stickers** | 6 products | Cut type, size, material (12 vinyl types), lamination, white ink |
| **signs** | 8 products | Board material, size, single/double sided, accessories (stakes, standoffs) |
| **banners** | 10 products | Material, size, finishing (grommets, hems, pole pockets), accessories |
| **canvas** | 7 products | Wrap type, size, edge treatment, UV lamination |
| **vehicle** | 15 products | Vehicle type, coverage area, material, quote-only for full wraps |
| **surfaces (WWF)** | 20+ products | Application type, material, cut type, size |
| **marketing-print** | 45+ products | Paper, size, sides, lamination, binding, folds |
| **booklets** | 3 binding types | Binding, pages, cover stock, interior paper, coating |
| **stamps** | 8 models | Model size, text, font, ink color, border style |

**Shared configurator components:**
- `ConfigHero` — Product gallery + headline
- `ConfigStep` — Step-by-step option selection
- `OptionCard` / `OptionGrid` — Option selector UI
- `ArtworkUpload` — File upload with DPI/format/size preflight
- `PricingSidebar` — Price display + volume tiers + add-to-cart
- `MobileBottomBar` — Mobile sticky bar with price + CTA
- `DeliveryEstimate` — Production days + shipping + countdown timer
- `VolumePricingMatrix` — Quantity tier table

**Key files:**
- `lib/configurator-router.js` — Routes product slugs to configurator components
- `components/configurator/` — 27 shared components
- `lib/*-order-config.js` — 11 product config files

### Module 3: Real-Time Pricing Engine
**Priority: MVP (Complete)**

- Single API endpoint: `POST /api/pricing/calculate`
- Two pricing paths: cost-plus templates (6 formulas) or reference-table (stickers)
- 165+ material aliases mapping frontend IDs to database materials
- Quantity-based margin tiers per category
- Surcharges: white ink, holographic, rush, lamination, accessories
- NaN/Infinity safety guards
- PricingPreset model for advanced pricing (business cards)
- Detailed quote ledger for transparency

### Module 4: Cart & Checkout
**Priority: MVP (Complete)**

- Zustand cart store with localStorage persistence
- Server-side repricing at checkout (prevents price manipulation)
- Stripe checkout (card, Apple Pay, Google Pay via Stripe Link)
- Interac e-Transfer checkout (Canadian bank transfer)
- Guest checkout (no login required)
- HST tax calculation (Ontario 13%)
- Free shipping over $99
- Coupon/promo code validation
- Abandoned cart recovery (hourly cron job, 3-email sequence)
- Stock reservation with atomic transactions

### Module 5: File Upload & Preflight
**Priority: MVP (Complete)**

- UploadThing integration for artwork files
- Client-side preflight: file type, file size, image dimensions, DPI check
- Results displayed inline (pass/warning/fail per check)
- Design help option ($45/item — professional designer adjusts artwork)
- "Upload later" option (order first, send files by email)

### Module 6: Customer Accounts
**Priority: MVP (Complete)**

- Custom JWT auth (HMAC-SHA256 session tokens)
- Signup/login/logout/password reset/email verification
- Account dashboard: orders, addresses, templates, favorites, support tickets
- B2B accounts with partner tiers and wholesale discounts
- Referral system (LUNAR-XXXXXX codes)
- Order templates for repeat orders (B2B)
- SMS opt-in for order notifications

### Module 7: Admin Dashboard & Order Management
**Priority: MVP (Complete, 50+ pages)**

- Order lifecycle management (pending → paid → production → shipped → completed)
- Production board with job assignments
- Customer management (profiles, notes, stats)
- Product management (CRUD, pricing, images)
- Proof approval workflow (upload → customer review → approve/reject)
- Finance module (invoices, expenses, suppliers, profitability)
- Quality control reporting
- Coupon management
- Shipping label generation
- Activity logs (audit trail)
- RBAC with 7 roles (admin, cs, merch_ops, design, production, sales, finance, qa)

### Module 8: Production Tools
**Priority: Post-MVP (Complete)**

Three internal tools for daily production work:

1. **Contour Tool** — Extract die-cut paths from artwork images
   - Background removal → edge detection → SVG path generation
   - Adjustable bleed offset
   - Quality-gated saves (good/rectangular/low confidence)
   - Export: SVG cut path, preview PNG, mask PNG, source image

2. **Stamp Studio** — Design custom stamp artwork
   - 7 presets (address, approval, date-received, signature, book-name, fun, face)
   - 5 stamp models (2 round, 3 rectangular)
   - Client preview PNG + production PNG exports
   - Concept-selling workflow (no order needed)

3. **Proof Workbench** — Manage proof approval for orders
   - Upload proofs, customer approval/rejection
   - Standalone proofs for walk-in customers
   - Version history tracking
   - Status-aware next-step guidance

### Module 9: Design Studio
**Priority: Post-MVP (Partially Complete)**

- Full canvas editor built on Fabric.js v6.9.1
- Tools: text, shapes, images, templates
- PDF export via pdf-lib
- Product-aware dimensions (canvas sized to actual print area)
- Snap-to-grid, safe zones, bleed guides
- Font library, template presets
- Save/load designs

### Module 10: AI Chat
**Priority: Post-MVP (Started)**

- Customer-facing chat widget (bottom-right)
- Powered by Claude API / OpenAI / Gemini (all three SDKs installed)
- Conversation history stored in Prisma
- Can answer product questions, suggest materials, help with file preparation

### Module 11: SEO & Marketing
**Priority: MVP (Complete)**

- Dynamic sitemap.xml (all products, categories, pages)
- Schema.org: Organization, LocalBusiness, Product, BreadcrumbList, CollectionPage, FAQ
- Canonical URLs + hreflang (en/zh)
- 190+ redirects for old URLs
- Google Analytics 4
- Newsletter signup (exit-intent popup + footer)
- 28-question FAQ (8 categories)
- "How It Works" page (5-step process)
- Industry landing pages (`/ideas/[slug]`)
- Use-case content (gifting, wedding, corporate, real estate)

---

## 6. Product Structure & Information Architecture

### Category hierarchy

```
lunarprint.ca
├── /shop — All categories overview
│
├── /shop/marketing-business-print — 45+ products
│   ├── business-cards-* (9 variants, dedicated /order/ pages)
│   ├── flyers, postcards, brochures, menus
│   ├── door-hangers, rack-cards, bookmarks
│   ├── booklets, calendars, NCR forms
│   ├── inserts-packaging, presentation-folders
│   └── stamps (5 products)
│
├── /shop/stickers-labels-decals — 6 core products (restructured Feb 2026)
│   ├── die-cut-stickers
│   ├── kiss-cut-stickers
│   ├── sticker-sheets
│   ├── kiss-cut-sticker-sheets
│   ├── roll-labels
│   └── vinyl-lettering
│
├── /shop/signs-rigid-boards — 8 products
│   ├── yard-sign, foam-board-sign, pvc-sign
│   ├── aluminum-sign, acrylic-sign, a-frame-sign
│   ├── real-estate-sign, construction-sign
│   └── (accessories: H-stakes, wire-stakes, standoffs)
│
├── /shop/banners-displays — 10 products
│   ├── vinyl-banner, mesh-banner, fabric-banner
│   ├── retractable-banner-stand, x-frame-banner-stand
│   ├── step-and-repeat, flag-banner, pole-banner
│   ├── table-throw, backdrop
│   └── (display-stands subcategory: 6 products)
│
├── /shop/canvas-prints — 7 products
│   ├── standard-canvas, gallery-wrap-canvas, framed-canvas
│   ├── multi-panel-canvas, photo-canvas
│   └── custom-size-canvas, canvas-collage
│
├── /shop/windows-walls-floors — 20+ products
│   ├── Window: transparent, one-way-vision, frosted, static-cling, perforated
│   ├── Wall: removable vinyl, permanent vinyl, fabric wall graphics
│   └── Floor: anti-slip floor graphics, floor decals
│
├── /shop/vehicle-graphics-fleet — 15+ products
│   ├── full-wrap, partial-wrap, door-graphics, vehicle-decal
│   ├── magnetic-car-signs, perforated-window-graphics
│   ├── fleet-compliance: DOT numbers, MC numbers, TSSA decals, CVOR
│   └── safety-warning-decals: reflective, hazard, compliance
│
└── /shop/industry/[tag] — Industry-specific collections
    ├── healthcare, education, real-estate, restaurant
    ├── construction, retail, event, corporate
    └── (cross-category curated collections)
```

### Page relationship diagram

```
Homepage
├── Category page (/shop/[category])
│   ├── Family landing (grouped products with comparison)
│   │   └── Product configurator (/shop/[category]/[product])
│   │       ├── Configure → See price → Upload → Cart → Checkout
│   │       └── "Get a Quote" (for complex/custom orders)
│   └── Direct to product configurator
│
├── Ideas / Use-cases (/ideas/[slug])
│   └── Links to relevant products
│
├── Quote page (/quote)
│   └── Custom quote form → admin review → email response
│
├── FAQ (/faq) — 28 questions, 8 categories
├── How It Works (/how-it-works) — 5-step process
├── About (/about) — Factory capabilities
└── Track Order (/track-order) — Order ID + email lookup
```

### SEO structure principles

1. **Every product has a unique URL** — `/shop/stickers-labels-decals/die-cut-stickers` (not `/configure?product=stickers&type=die-cut`)
2. **Category pages are indexable** — with unique meta titles, descriptions, and FAQ schemas
3. **Family landing pages consolidate link juice** — one strong page for "stickers" linking to 6 sub-products
4. **Industry pages capture long-tail searches** — `/shop/industry/real-estate` targets "real estate signs Toronto"
5. **301 redirects preserve SEO equity** — 190+ redirects from old URLs, category restructuring, product deactivations
6. **Canonical URLs prevent duplication** — especially for products accessible via multiple paths
7. **Bilingual hreflang** — English (default) + Chinese alternate

### Balancing SEO, conversion, and maintainability

- **SEO:** Unique content per category + product, structured data, proper heading hierarchy, keyword-rich URLs
- **Conversion:** Instant pricing visible on category cards, configurators reduce choice paralysis, volume discount badges
- **Maintainability:** Product data in database (Prisma), category structure in `catalogConfig.js`, pricing in template functions — not hardcoded in page components
