# Document 5: AI Automation Integration Roadmap — lunarprint.ca

## 11. AI Integration Philosophy

AI in this system is a **productivity multiplier for a solo founder** — not a gimmick. Jay runs the entire factory alone. Every manual task that AI can automate frees Jay to focus on production and sales.

### Current AI usage

| Feature | AI Provider | Status |
|---------|------------|--------|
| **Chat widget** | Claude/OpenAI/Gemini (all 3 SDKs installed) | Started |
| **Content generation** | Scripts using AI APIs | One-time scripts ran |
| **Claude Code development** | Anthropic Claude | Active (building the entire site) |

### Near-term AI features (next 3 months)

#### 1. Auto-generate product descriptions
**Problem:** 200+ products need unique, SEO-optimized descriptions. Writing them manually takes hours.
**Solution:** Script that takes product name + category + specs → generates 150-word description + meta title + meta description.
**Implementation:** Batch script using Claude API → update Product.description in DB.
**Priority:** High (SEO impact)

#### 2. Auto-translate content
**Problem:** Chinese translation needs to stay in sync with English (6100+ i18n keys).
**Solution:** When new English keys are added, auto-generate Chinese translations.
**Implementation:** Script that diffs en.js vs zh.js → translates missing keys via Claude API → outputs zh.js patch.
**Priority:** Medium (already mostly done manually)

#### 3. Auto-check customer artwork
**Problem:** Customers upload bad files (low DPI, wrong format, missing bleed). Jay has to check each one.
**Solution:** Server-side preflight that checks DPI, dimensions, format, transparency, bleed area.
**Implementation:** Currently client-side only. Move to server-side with image analysis.
**Priority:** High (production efficiency)

#### 4. AI chat for customer support
**Problem:** Customers ask repetitive questions (turnaround time, file requirements, pricing).
**Solution:** Claude-powered chat widget that knows the product catalog, pricing, and policies.
**Implementation:** `components/chat/ChatWidget.js` already exists. Needs knowledge base integration.
**Priority:** Medium (reduces support load)

#### 5. Smart material recommendations
**Problem:** Customers don't know which vinyl is best for their use case (outdoor vs indoor, permanent vs removable).
**Solution:** Based on customer's answers (where will it be used? how long? indoor/outdoor?), recommend the right material.
**Implementation:** Decision tree in configurator → can be enhanced with AI for edge cases.
**Priority:** Low (decision tree handles 90% of cases)

### Long-term AI automation goals (6-12 months)

#### 6. Auto-create products from supplier specs
**Problem:** Adding a new product requires: create seed script → define options → map materials → test pricing → deploy.
**Solution:** Jay describes the product in plain language → AI generates the seed script, options config, and pricing mapping.
**Implementation:** Claude Code integration (already being used for development).
**Priority:** High (biggest time saver for product expansion)

#### 7. Auto-generate product images
**Problem:** 28 products still using placeholder images.
**Solution:** AI generates realistic product mockups (sticker on laptop, sign on lawn, banner on building).
**Implementation:** Use image generation API → upload to UploadThing → link to ProductImage.
**Priority:** Medium (needs good prompts + quality control)

#### 8. Automated proof generation
**Problem:** Every order needs a proof (artwork placed on product template) before production.
**Solution:** Server automatically generates proof by placing customer artwork on product template.
**Implementation:** Canvas API (server-side) → generate proof image → upload → email customer.
**Priority:** High (biggest production bottleneck)

#### 9. Auto-contour extraction
**Problem:** Die-cut stickers need contour paths extracted manually via Contour Tool.
**Solution:** When sticker order is paid, automatically run contour extraction pipeline.
**Implementation:** Background job triggered by order webhook → `lib/contour/generate-contour.js` → save to ProofData.
**Priority:** High (directly reduces manual work)

#### 10. Predictive pricing
**Problem:** Margin tiers are static. Some products/quantities might be overpriced or underpriced.
**Solution:** Analyze order history → identify price points that convert well → suggest margin adjustments.
**Implementation:** Analytics script that correlates price → conversion rate → suggests optimal pricing.
**Priority:** Low (need more order data first)

### AI integration principles

1. **AI assists, human decides.** AI can suggest, generate, and automate — but Jay approves before anything goes live. No auto-publishing to production without review.

2. **Fail-safe.** If AI generates bad content (wrong price, weird description, broken code), the system must catch it. Server-side repricing, minimum price guards, and manual review steps are safety nets.

3. **Cost-aware.** API calls cost money. Batch operations where possible. Cache results. Don't call AI APIs on every page load.

4. **Incremental.** Start with scripts (batch operations), then automation (triggered by events), then real-time (in-app AI).

---

## Technical handoff: 20 key facts for the next AI assistant

### A. "This website is not a regular print shop website, it is..."

A fully automated web-to-print manufacturing platform that replaces the entire sales pipeline — from customer discovery to order processing to production management — for a real printing factory. It's the factory's operating system, not its brochure.

### B. "The key to this project's success is..."

**Speed of iteration.** Jay is a solo founder competing against Vistaprint and StickerMule. The system needs to ship features fast, price competitively, and convert visitors to orders. Every feature should directly increase revenue (more orders, higher order value) or reduce manual work (less quoting, less file checking, less production management).

### C. 20 critical facts for the next AI assistant

1. **Owner is Jay** — solo founder of La Lunar Printing, Toronto Scarborough. NOT a programmer. Explain everything in detail.
2. **This is a survival mission** — the factory's future depends on online orders working.
3. **Next.js 16 + Turbopack on Vercel.** Don't suggest switching frameworks.
4. **Prisma 6.19.2 + Neon PostgreSQL.** DO NOT upgrade to Prisma 7. DO NOT use edge runtime with Prisma. DO NOT use `@prisma/adapter-neon`.
5. **200+ products, 11 categories, 10 configurator types.** Each configurator is different.
6. **Pricing engine has 6 template functions** in `lib/pricing/templates.js`. Stickers use a separate reference-table system.
7. **165+ material aliases** in `template-resolver.js`. Every new material needs an alias mapping.
8. **Margins are hardcoded by category × quantity** in `templates.js`. Not in the database.
9. **Server-side repricing at checkout** prevents price manipulation. NEVER trust client-side prices.
10. **i18n: English + Chinese.** 6100+ keys in each language. Every user-facing string uses `t("key")`.
11. **Stripe + Interac** dual payment. Interac creates a draft order and sends email instructions.
12. **Admin has 7 RBAC roles.** All admin API routes check permissions.
13. **Production tools:** Contour (die-cut paths), Stamp Studio (stamp design), Proof Workbench (approval flow).
14. **120+ seed scripts** in `/scripts/`. Running them is how products/materials are added to the database.
15. **SEO is complete** — sitemap, schemas, meta, redirects, hreflang. Don't break it.
16. **Cart is Zustand + localStorage.** Server sync is debounced 30s for logged-in users.
17. **Custom JWT auth** (HMAC-SHA256). NOT NextAuth. Session in HTTP-only cookie, 30-day expiry.
18. **Abandoned cart recovery** runs hourly via Vercel cron (`/api/cron/abandoned-carts`). Needs `CRON_SECRET` env var.
19. **NEVER touch pricing without confirming with Jay.** Wrong prices = money lost. Always verify.
20. **The working style is: plan → confirm → implement → verify → commit.** Don't make large changes without Jay's approval. Don't "optimize" things that weren't asked for. Small steps.

---

## Technical Handoff Details

### 1. Key files to read first
- `CLAUDE.md` — Developer instructions (read this FIRST)
- `prisma/schema.prisma` — Database schema
- `lib/pricing/templates.js` — Pricing formulas
- `lib/pricing/template-resolver.js` — Material aliases + category routing
- `lib/configurator-router.js` — Product → configurator mapping
- `app/api/checkout/route.ts` — Checkout flow (570 lines)
- `lib/store.js` — Cart state management
- `next.config.ts` — Redirects, headers, security

### 2. Current biggest technical challenges
- **Image management** — 28 products still need real photos
- **Design studio maturity** — Fabric.js editor works but needs more templates
- **Shipping integration** — Currently manual; needs Canada Post API
- **Production automation** — Manual job creation; needs auto-queue from orders

### 3. Current biggest business logic challenges
- **Pricing competitive intelligence** — Are we priced right vs StickerMule, Vistaprint?
- **Proof approval UX** — Customers need to understand what a "proof" is
- **B2B onboarding** — Partner portal exists but needs smoother activation flow
- **File quality** — Most artwork from retail customers is low-quality; need better guidance

### 4. Print industry special logic (can't treat like regular e-commerce)
- **Bleed area** — Print extends 0.125-0.25" beyond trim line. Customers don't understand this.
- **Imposition** — Multiple pieces printed on one large sheet, then cut. Pricing depends on how many pieces fit per sheet.
- **Nesting** — Rectangular pieces nested on standard sheet sizes (48×96 for boards, 12×18 for paper). Waste = unused sheet area.
- **Ink coverage** — Cost varies with how much ink the design uses (not implemented — using flat ink rate).
- **Lamination is per-sheet** — Even if you only print 1 small item on a sheet, you laminate the whole sheet.
- **Die-cut requires a cut path** — The Contour Tool generates this. Regular e-commerce doesn't have this concept.
- **Proofs are mandatory** — You can't undo a print run. Customer must approve before production.
- **Materials degrade** — Vinyl has outdoor durability ratings (1 year, 3 years, 7 years). This affects pricing and recommendations.
- **Color matching** — CMYK print doesn't match RGB screen. Managing customer expectations is critical.
- **Rush production** — Factory can prioritize, but at higher cost (30% surcharge). Not "next-day shipping" — it's "next-day printing."

### 5. Development principles for the next AI

1. **Plan before coding.** List what you'll change, why, and which files. Wait for Jay's confirmation.
2. **Don't act on your own.** Don't merge products, don't add options, don't "optimize" unrequested things.
3. **Each product gets its own page.** No shared "pick your product type" configurators.
4. **Explain your reasoning.** Jay is learning. He needs to understand the architecture.
5. **Small steps.** Change one file, verify, move on. Don't change 20 files at once.
6. **NEVER touch pricing without permission.** Pricing changes = money lost if wrong.
7. **Cost awareness.** Minimize unnecessary API calls, DB queries, Vercel function invocations.
8. **Flag related issues.** If you find a bug that might exist elsewhere, mention it proactively.
9. **Test the build.** Run `npx next build` after changes. If it fails, fix before committing.
10. **Follow the git workflow.** Commit with clear messages. Don't push without Jay's approval. Use `git add -p` when files have mixed changes from different feature tracks.
