# Document 4: Technical Architecture & Development Roadmap — lunarprint.ca

## 9. Technical Architecture

### Why Next.js self-built (not Shopify/WooCommerce)

1. **Custom pricing engine** — No e-commerce platform supports our formula-based pricing with 6 templates, 165+ material aliases, and category×qty margin tiers. Shopify would require a completely custom app.
2. **Configurator complexity** — 10 different configurator types with unique option trees. Shopify's variant system (max 3 options, 100 variants) is fundamentally inadequate.
3. **Production tools** — Contour extraction, stamp design, proof management are custom manufacturing tools that don't exist in any e-commerce platform.
4. **Full control** — We own the code, the data, the pricing logic. No platform lock-in, no monthly fees scaling with revenue.
5. **Performance** — Next.js 16 with Turbopack: sub-second page loads, streaming SSR, dynamic imports for heavy components.

### Current tech stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| **Framework** | Next.js (App Router) | 16.1.6 | Turbopack for dev, standard build for prod |
| **Runtime** | Node.js (Vercel) | — | NOT edge runtime (Prisma incompatible) |
| **Database** | Neon PostgreSQL | Serverless | Pooler endpoint (NOT direct connection) |
| **ORM** | Prisma | 6.19.2 | DO NOT upgrade to Prisma 7 (breaking changes) |
| **Auth** | Custom JWT | — | HMAC-SHA256 session tokens, bcrypt passwords |
| **Payments** | Stripe | 20.3.1 | + Interac e-Transfer (manual flow) |
| **File Storage** | UploadThing | 7.7.4 | Artwork uploads, design snapshots |
| **Email** | Resend | 6.9.2 | 23 transactional email templates |
| **State** | Zustand | 5.0.11 | Cart, auth, editor stores |
| **Styling** | TailwindCSS | 4.1.7 | Utility-first, minimal custom CSS |
| **Canvas** | Fabric.js | 6.9.1 | Design studio + stamp editor |
| **PDF** | pdf-lib | 1.17.1 | PDF generation/export |
| **AI** | Anthropic + OpenAI + Google | — | Chat, content generation |
| **Hosting** | Vercel | — | Auto-deploy from main branch |

### Critical technical rules

```
DO NOT use `edge` runtime on routes with Prisma
DO NOT create middleware.ts — Next.js 16 uses proxy.ts
DO NOT use @prisma/adapter-neon or driverAdapters
DO NOT upgrade to Prisma 7
DO NOT use .env files in production — use Vercel environment variables
DO commit prisma/schema.prisma — migrations are source of truth
```

### Project directory structure

```
vibe-sticker-shop/
├── app/                           # Next.js 16 App Router
│   ├── layout.js                  # Root layout (Navbar, Footer, Analytics, etc.)
│   ├── page.js                    # Homepage
│   ├── admin/                     # 50+ admin pages
│   │   ├── orders/[id]/           # Order detail
│   │   ├── products/[id]/         # Product editor
│   │   ├── tools/                 # Contour, Proof, Stamp Studio
│   │   ├── production/            # Production board
│   │   └── finance/               # Invoices, expenses
│   ├── api/                       # 168 API route handlers
│   │   ├── auth/                  # 7 auth endpoints
│   │   ├── checkout/              # Stripe + Interac
│   │   ├── pricing/calculate/     # Pricing engine
│   │   ├── admin/                 # 35+ admin endpoints
│   │   └── ...                    # 20 endpoint families
│   ├── shop/                      # Dynamic catalog
│   │   ├── [category]/            # Category pages
│   │   └── [category]/[product]/  # Product configurators
│   ├── order/                     # 99 legacy order pages (redirects)
│   ├── account/                   # Customer dashboard
│   ├── checkout/                  # Payment pages
│   └── ...                        # Static pages (about, faq, etc.)
│
├── components/                    # 155 React components
│   ├── configurator/              # 27 shared configurator components
│   ├── admin/                     # Admin UI components
│   ├── design-studio/             # Fabric.js editor
│   ├── cart/                      # Cart drawer, upsell
│   ├── home/                      # Homepage sections
│   ├── product/                   # Product page components
│   └── ...                        # Layout, modals, chat, etc.
│
├── lib/                           # 130+ utility modules
│   ├── pricing/                   # Pricing engine (15 files)
│   │   ├── templates.js           # 6 cost formulas (661 lines)
│   │   ├── template-resolver.js   # Router + aliases (692 lines)
│   │   ├── sticker-pricing.js     # Reference table pricing
│   │   ├── engine.js              # PricingPreset dispatcher
│   │   └── models/                # 4 pricing models
│   ├── i18n/                      # en.js (6117 lines), zh.js (6146 lines)
│   ├── email/templates/           # 23 email templates
│   ├── contour/                   # Image processing pipeline
│   ├── design-studio/             # Editor utilities
│   ├── storefront/                # 7 family configs + upsell rules
│   ├── *-order-config.js          # 11 product config files
│   └── ...                        # Auth, cart, checkout, SEO, etc.
│
├── prisma/
│   └── schema.prisma              # 50+ models, 20+ enums
│
├── scripts/                       # 120+ seed & utility scripts
│   ├── seed-*.mjs                 # Product/material seeding
│   ├── fix-*.mjs                  # Data corrections
│   └── check-*.mjs               # Health checks
│
├── public/                        # Static assets
│   └── products/                  # Product images (slug.png)
│
├── next.config.ts                 # Redirects, headers, CSP
├── vercel.json                    # Cron job config
├── package.json                   # Dependencies
└── CLAUDE.md                      # Developer instructions
```

### Database schema (key models)

| Model | Fields | Purpose |
|-------|--------|---------|
| **User** | 55 fields | Customer accounts (B2C/B2B), auth, referrals |
| **AdminUser** | 7 roles | Staff accounts with RBAC |
| **Product** | 24 fields | Product catalog with pricing/options config |
| **PricingPreset** | 4 models | Reusable pricing rule sets |
| **Material** | 17 fields | Physical materials (vinyl, paper, board, canvas) |
| **Order** | 20+ fields | Order lifecycle (pending→paid→production→shipped) |
| **OrderItem** | 15 fields | Line items with specs, pricing, materials |
| **OrderFile** | — | Artwork uploads with preflight status |
| **OrderProof** | — | Proof versions (pending/approved/rejected) |
| **ProofData** | — | Server-side contour extraction data |
| **ProductionJob** | — | Manufacturing work orders |
| **AdminToolJob** | — | Tool processing records (contour/stamp/proof) |
| **Coupon** | — | Discount codes |
| **AbandonedCart** | — | Cart recovery tracking |
| **Review** | — | Product reviews (pending approval) |
| **SupportTicket** | — | Help desk |
| **Invoice** | — | Customer invoices |
| **Expense** | — | Business expenses |
| **Supplier** | — | Vendor management |
| **Asset** | — | File management (SHA256 dedup) |
| **PriceChangeLog** | — | Pricing audit trail |
| **ActivityLog** | — | Admin action audit |

### API architecture

- **168 total route handlers** across 20 endpoint families
- REST pattern (GET/POST/PATCH/DELETE)
- Rate limiting per-IP (in-memory sliding window)
- Server-side repricing at checkout (anti-tamper)
- Atomic inventory transactions (stock reservation)
- RBAC on all admin endpoints

### Security measures

- HMAC-SHA256 session tokens with timing-safe comparison
- bcrypt (12 rounds) password hashing
- HTTP-only, Secure, SameSite cookies
- Rate limiting on all sensitive endpoints
- CSP headers (script/style/img/connect whitelist)
- HSTS preload (2-year max-age)
- No user enumeration on auth endpoints
- Server-side repricing prevents price manipulation

---

## 10. Core Workflows

### Workflow 1: Product from idea to live

```
1. Jay decides to add a new product (e.g., "Holographic stickers")
   ↓
2. Create seed script: scripts/seed-holographic-stickers.mjs
   - Defines: slug, name, category, description, optionsConfig, pricingConfig
   ↓
3. Run seed: `node scripts/seed-holographic-stickers.mjs`
   - Creates Product in DB with all metadata
   ↓
4. Verify pricing: `POST /api/pricing/calculate` with test params
   - Check material alias exists in template-resolver.js
   - Check margin category is mapped
   ↓
5. Upload product image: admin dashboard → product → image
   - Saves to /public/products/{slug}.png or UploadThing
   ↓
6. Test on staging: browse category → click product → configure → verify price → test checkout
   ↓
7. Push to production: git push → Vercel auto-deploy
   ↓
8. Live! Customer can find, configure, price, and order the product.
```

**Future automation:** AI generates product description, SEO meta, and initial pricing from a simple input like "holographic vinyl sticker, 2×2, die-cut".

### Workflow 2: Customer from visit to order

```
1. Customer finds us (Google Ads / organic / referral)
   ↓
2. Lands on category page → sees products with "From $X.XX"
   ↓
3. Clicks product → enters configurator
   ↓
4. Selects options: size, material, quantity, finishing
   - Price updates in real-time (PricingSidebar)
   - Volume discount badges show savings
   - Delivery estimate shows production + shipping time
   ↓
5. Uploads artwork (or selects "upload later" / "design help")
   - Preflight checks: file type, size, DPI
   ↓
6. Adds to cart → CartDrawer opens
   - CartUpsell suggests related products
   ↓
7. Proceeds to checkout
   - Guest checkout (no login required) or account login
   - Chooses: Stripe (card/Apple Pay) or Interac e-Transfer
   ↓
8. Stripe flow:
   - Server reprices all items (anti-tamper)
   - Stock reserved atomically
   - Stripe Checkout session created
   - Customer pays on Stripe page
   - Webhook confirms payment → Order status: paid
   ↓
   Interac flow:
   - Draft order created
   - Email with payment instructions sent
   - Customer sends e-Transfer manually
   - Admin marks payment received → Order status: paid
   ↓
9. Order confirmation email sent
   ↓
10. Customer can track order at /track-order or /account/orders
```

### Workflow 3: Order from file upload to delivery

```
1. Order placed (paid via Stripe or confirmed Interac)
   ↓
2. Admin reviews order in /admin/orders/[id]
   - Checks artwork files (preflight status)
   - If issues: contacts customer, requests revised files
   ↓
3. Production prep:
   - Stickers → Run Contour Tool (extract die-cut path, generate SVG)
   - Stamps → Run Stamp Studio (generate artwork PNG)
   - Other → Direct to production
   ↓
4. Proof generation (if needed):
   - Admin creates proof in Proof Workbench
   - Customer receives email → reviews proof → approves or requests changes
   - If rejected: admin revises → new proof version → customer re-reviews
   ↓
5. Production:
   - ProductionJob created with priority + due date
   - Job assigned to machine/operator
   - Status: queued → printing → cutting → finishing → QC
   ↓
6. Quality check:
   - QCReport created (if issues found)
   - If passed: ready to ship
   ↓
7. Shipping:
   - Shipment record created
   - Customer notified (email: "Your order has shipped")
   - Tracking number provided
   ↓
8. Delivery:
   - Order status: completed
   - Review request email sent (after delivery)
```

**Future automation targets:**
- Auto-preflight on upload (reject bad files immediately)
- Auto-contour extraction for die-cut stickers (no manual tool run)
- Auto-proof generation (place artwork on template, send to customer)
- Auto-production job creation (order paid → job queued automatically)
- Auto-shipping label generation (integrate with Canada Post API)

---

## Development Status (March 2026)

### Completed (production-ready)

- Full product catalog (200+ products, 11 categories)
- All 10 configurator types
- Pricing engine (6 templates + reference table + presets)
- Stripe + Interac checkout
- Customer accounts + B2B portal
- Admin dashboard (50+ pages, RBAC)
- Production tools (contour, stamp studio, proof workbench)
- i18n (English + Chinese, 1200+ keys)
- SEO (sitemap, schemas, meta, redirects)
- Email system (23 templates)
- Cart with upsell, abandoned cart recovery
- File upload with preflight
- Mobile responsive (all pages)

### In progress

- Windows/Walls/Floors family landing page (windows-family.js newly created)
- Production board improvements (workstation summary API)
- Order detail page enhancements (production readiness scoring)

### Planned (not started)

- Automated proof generation
- Canada Post shipping integration
- Review collection automation
- Design studio template library
- B2B bulk API v2
- Inventory alerting system
- Customer file library (reuse previous artwork)
- Multi-location support

---

## 13. Design & Engineering Principles

### System complexity management

1. **One product = one database row.** Variants are handled by `optionsConfig` JSON, not separate product records. This prevents product sprawl.

2. **Pricing formulas in code, not database.** The 6 template functions are in `templates.js`. Changing pricing logic = changing code and deploying. This is intentional — pricing formulas are too complex and interdependent for a GUI editor.

3. **Material costs in database.** The `Material` model stores `costPerSqft`. When material prices change, update the DB — no code deploy needed.

4. **Margin tiers are hardcoded.** Category×quantity margin tables are in `templates.js`. This is a conscious trade-off: margins rarely change, and having them in code makes them auditable in git.

### Data structure extensibility

1. **JSON config fields** (`optionsConfig`, `pricingConfig`, `meta`) allow adding new options without schema migrations.

2. **Material alias system** — new materials can be added to the DB and mapped via `MATERIAL_ALIASES` in template-resolver.js without changing the pricing formulas.

3. **PricingPreset model** — for products that don't fit the template system, create a preset with custom tier tables. No code changes needed.

4. **Product type enum** — can be extended for new product categories.

### Price logic maintainability

1. **Single entry point** — all pricing goes through `/api/pricing/calculate` → `template-resolver.js`. No direct pricing calculations in components.

2. **Server-side repricing at checkout** — even if frontend prices are wrong, checkout recalculates everything.

3. **PriceChangeLog** — every pricing change is audited.

4. **NaN/Infinity guards** — `roundUp99()` and `toCents()` prevent invalid prices from reaching customers.

5. **Minimum prices enforced** — $15-$49 minimums per category prevent zero-price bugs.

### Avoiding over-engineering

1. **No microservices.** One Next.js app handles everything. The complexity is in business logic, not infrastructure.

2. **No GraphQL.** REST endpoints with clear naming. The API is internal (frontend-to-backend), not a public API.

3. **No Redis.** Rate limiting is in-memory. Cart is in localStorage + Zustand. Session tokens are stateless (HMAC).

4. **No Kubernetes.** Vercel handles scaling, CDN, and deployment.

5. **Scripts over migrations for data changes.** Seed scripts are idempotent (upsert). Running them is safer than raw SQL migrations for business data.
