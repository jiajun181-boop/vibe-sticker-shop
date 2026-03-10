# lunarprint.ca — Complete Project Handoff Document

> **Purpose:** Transfer all knowledge about the Lunar Print website to another AI assistant for continued development.
>
> **Date:** March 10, 2026
>
> **Owner:** Jay, solo founder of La Lunar Printing Inc. (Toronto Scarborough, since 2018)
>
> **Website:** https://www.lunarprint.ca (launched February 17, 2026)

---

## How to use this document

This document is split into 5 standalone files in `docs/handoff/`:

| File | Contents |
|------|----------|
| **01-product-strategy.md** | Project positioning, business goals, brand philosophy, user scenarios, development priorities |
| **02-information-architecture.md** | Core feature modules (10), product category hierarchy, page relationships, SEO structure |
| **03-pricing-system.md** | Pricing philosophy, 6 template formulas, margin tiers, material aliases, option modeling, special rules |
| **04-tech-architecture.md** | Tech stack, directory structure, database schema, API design, 3 core workflows, development status, engineering principles |
| **05-ai-automation.md** | AI integration (current + planned), 20 critical handoff facts, print industry special logic, development principles |

**Read order for a new AI assistant:** CLAUDE.md → 01 → 04 → 03 → 02 → 05

---

## One-sentence summary

**lunarprint.ca is a full-stack web-to-print e-commerce platform that turns a traditional Toronto printing factory into a 24/7 automated online print shop — from instant pricing and customer self-service ordering to production management and B2B wholesale — built to compete with Vistaprint and StickerMule at local scale.**

---

## A. "This website is not a regular print shop website, it is..."

A complete manufacturing operating system disguised as an e-commerce website. Behind the clean product pages and instant pricing, there's a pricing engine with 6 cost formulas and 165+ material aliases, a production management system with contour extraction and proof approval tools, a B2B wholesale portal with partner tiers, an ERP-lite backend with invoicing and expense tracking, and a cart recovery system that automatically emails customers who abandon checkout. It replaces Jay's phone, calculator, email, whiteboard, and filing cabinet — all in one Next.js application.

---

## B. "The key to this project's success is..."

**Execution speed + pricing accuracy + conversion optimization.** Jay is a one-person operation competing against companies with 100+ employees. The system must:

1. **Let customers order without talking to Jay** — automated pricing, self-service configurators, guest checkout
2. **Price correctly** — wrong prices mean lost money or lost customers. The server-side repricing + margin guards are critical safety nets.
3. **Convert visitors to buyers** — per-unit pricing, volume discounts, delivery estimates, trust signals (Google Reviews, SSL badges, refund policy) all work together
4. **Scale Jay's time** — production tools, admin dashboard, email automation, and (soon) AI automation let one person run what normally takes a team of 5

---

## C. 20 critical facts for another AI assistant

1. **Owner is Jay** — solo founder, not a programmer. Explain everything clearly. This is his survival.
2. **Next.js 16 App Router + Turbopack on Vercel.** Custom-built, not Shopify/WordPress.
3. **Prisma 6.19.2 + Neon PostgreSQL (pooler endpoint).** NEVER upgrade Prisma. NEVER use edge runtime. NEVER use `@prisma/adapter-neon`.
4. **200+ products across 11 categories** with 10 different configurator types.
5. **Pricing engine:** 6 template functions (`vinyl_print`, `board_sign`, `banner`, `paper_print`, `canvas`, `vinyl_cut`) + reference table for stickers + PricingPreset model for business cards.
6. **165+ material aliases** in `lib/pricing/template-resolver.js` — every frontend material ID maps to a database material name.
7. **Margin tiers are hardcoded** in `lib/pricing/templates.js` by category × quantity. Not in the database.
8. **Server-side repricing at checkout** — the checkout API recalculates all prices from scratch. Client-side prices are never trusted.
9. **Full i18n** — English + Chinese, 6100+ keys per language. Every UI string uses `t("key")`.
10. **Dual payment:** Stripe (card/Apple Pay) + Interac e-Transfer (Canadian bank transfer).
11. **Custom JWT auth** (HMAC-SHA256, not NextAuth). Session in HTTP-only cookie, 30-day expiry.
12. **Admin dashboard has 50+ pages** with 7 RBAC roles. All admin API routes check permissions.
13. **Three production tools:** Contour (die-cut path extraction), Stamp Studio (stamp design), Proof Workbench (approval workflow).
14. **120+ seed scripts** in `/scripts/` — this is how products and materials are added to the database.
15. **SEO is fully complete** — sitemap, Schema.org, meta tags, canonical URLs, hreflang, 190+ redirects. Don't break it.
16. **Abandoned cart recovery** — hourly cron job sends up to 3 recovery emails per abandoned cart.
17. **Design Studio** exists (Fabric.js v6.9.1) but is not yet the primary design path for customers.
18. **28 products still use placeholder images** — Jay needs to provide real photos.
19. **NEVER change pricing without Jay's explicit permission.** Wrong prices = direct money loss.
20. **Work style: plan → confirm → implement → verify → commit.** Small steps. Don't change many files at once. Don't "improve" things that weren't requested.

---

## Quick reference: key file locations

| What | Where |
|------|-------|
| Developer instructions | `CLAUDE.md` (project root) |
| Database schema | `prisma/schema.prisma` |
| Pricing formulas | `lib/pricing/templates.js` |
| Material aliases | `lib/pricing/template-resolver.js` |
| Pricing API | `app/api/pricing/calculate/route.ts` |
| Checkout (Stripe) | `app/api/checkout/route.ts` |
| Checkout (Interac) | `app/api/checkout/interac/route.ts` |
| Cart store | `lib/store.js` |
| Auth system | `lib/auth.js` + `app/api/auth/` |
| Product configs | `lib/*-order-config.js` (11 files) |
| Configurator routing | `lib/configurator-router.js` |
| Family configs | `lib/storefront/*.js` (7 files) |
| i18n strings | `lib/i18n/en.js` + `lib/i18n/zh.js` |
| Email templates | `lib/email/templates/` (23 files) |
| Admin tools | `app/admin/tools/` (contour, proof, stamp-studio) |
| Contour pipeline | `lib/contour/` (7 files) |
| SEO schemas | `components/JsonLd.js` |
| Navigation config | `lib/catalogConfig.js` |
| Seed scripts | `scripts/seed-*.mjs` |
| Next.js config | `next.config.ts` (redirects, headers, CSP) |
| Vercel cron | `vercel.json` |
