# Document 9: Current Checkpoint & Next Codex Directions

> Last updated: 2026-03-13
> Latest commit: `9f4cb1b`
> For: next Codex / ChatGPT session

## Current checkpoint

### Verified state (2026-03-13)
- **Tests**: `1111/1111` passing (`npx jest --no-coverage --runInBand`)
- **tsc**: clean (`npx tsc --noEmit`)
- **Build**: clean (run `npm run build` to verify route count after `.next/` cleanup)

### Pending DB push
```bash
npx prisma db push
```
Both `costBreakdownJson` (OrderItem) and `reminderSentAt` (Invoice) exist in `prisma/schema.prisma` but may not be applied to the Neon database yet. This project does NOT use `prisma migrate` — it uses `prisma db push`.

## Admin IA — Center Contract Status

| Center | Views | Helpers | Hub | Tests | Status |
|--------|-------|---------|-----|-------|--------|
| **Orders** | 7 views | `getOrderCenterView`, `buildOrderCenterHref` | `/admin/orders` | 23 tests (`admin-centers.test.ts`) | **Complete** |
| **Customers** | 4 workspaces | `getCustomerCenterView`, `buildCustomerCenterHref`, `buildCustomerDetailHref`, `buildCustomerWorkspaceHref` | `/admin/customers` | 17 tests (`customer-center.test.ts`) | **Complete** |
| **Settings** | 7 views | `getSettingsCenterView`, `buildSettingsCenterHref` | Independent pages | 24 tests (`settings-center.test.ts`) | **Complete** |
| **Products** | 5 peer routes | `getProductCenterView`, `buildProductCenterHref`, `getProductCenterDeep` | `/admin/products` | 24 tests (`product-center.test.ts`) | **Complete** |
| **Tools** | 5 views (hub, contour, proof, stamp-studio, unit-converter) | `getToolsCenterView`, `buildToolsCenterHref` | `/admin/tools` | 18 tests (`tools-center.test.ts`) | **Complete** |

All 5 centers now have canonical contracts with views, helpers, and regression tests in `lib/admin-centers.js`.

## Legacy pricing-dashboard — Retired (2026-03-13)

The 12 legacy `/admin/pricing-dashboard/*` page files have been **deleted**. All routes are now 301 redirects in `next.config.ts`.
`LEGACY_REDIRECT_MAP` in `lib/admin/pricing-routes.js` retained for test validation only — not used at runtime.

## Role-specific UI — First Round Complete (2026-03-13)

Content filtering now applied to 4 key admin pages:

| Page | What's filtered | Affected roles |
|------|----------------|----------------|
| `/admin/workstation` | Quick actions filtered by module permissions | All non-admin |
| `/admin` (dashboard) | Revenue stats hidden, tools/actions filtered by role | production, design |
| `/admin/orders` | Amount + Payment columns hidden | production, design |
| `/admin/orders/[id]` | Financial breakdown, cost signals, Stripe metadata, payment dropdown hidden | production, design |

Implementation pattern: `useAdminRole()` hook + `HIDE_FINANCIAL_ROLES` set + `hasPermission()` checks.

Pages NOT needing content filtering (already API-gated):
- `/admin/customers/[email]` — production/design can't access (no `customers` permission)
- `/admin/production/[id]` — finance/cs/sales can't access (no `production` permission)

## Operator regression pass — Complete (2026-03-13)

Audited all 150+ admin API endpoints and pages. **No dead links, broken routes, or workflow blockers found.**

Bugs found and fixed:
- Bulk status/production update silently swallowed API errors → now checks `res.ok` + shows alerts
- Bulk export downloaded broken files on error → now validates response before blob download

## What is real now

### Pricing / quote system
- Canonical pricing contract with 7-tab shell (`/admin/pricing`)
- Floor-price resolver, pricing audit layer, Quick Quote
- Approvals, snapshots, vendor cost, B2B rules, profit alerts, ops/governance
- No legacy dual-entry — single canonical path only

### Transaction consistency
- Shared settlement helper across Stripe/invoice/Interac
- Coupon semantics aligned, cancel releases stock
- Invoice coupon timing: consumed on payment confirmation, not creation
- Invoice dunning: 3-day-before-due reminders + overdue customer notices
- Webhook: `charge.refunded` handler with full/partial refund detection

### Admin IA
- 5 canonical centers (Orders, Customers, Settings, Products, Tools)
- 106+ regression tests across all center contracts
- RBAC permission matrix with 8 roles × 22 modules
- Role-experience navigation (admin/service/ops/product/finance)
- Role-specific content filtering on dashboard, orders list, order detail

### Data remediation system
- 6 remediation actions with dry-run/execute support (`lib/pricing/remediation.ts`)
- Live audit reporting (`/api/admin/pricing/audit`)
- Vendor cost tracking (`lib/pricing/vendor-cost.ts`)
- Actual cost entry with variance tracking (`lib/pricing/actual-cost.ts`)
- Floor-price enforcement with 4-level policy chain (`lib/pricing/floor-price.js`)
- Missing materials seed script ready (`scripts/seed-missing-materials.mjs`)

### Front-end product experience
- ProofPreview in 6/10 configurators (correct — 4 remaining are flat/rigid products, not contour-based)
- Stamp family landing complete (8 models, 3 presets, canvas editor, comparison table)
- WWF family landing complete (9 products, 5 sections, inline configurators)
- in/cm standardization complete (7 configurators use shared CustomDimensions)
- Proof approval UX: success page explains proof step, Free Proof tooltip added

## What still needs work

### 1. Jay action items (not code)
- Run `npx prisma db push` to apply schema to Neon database
- Run `node scripts/seed-missing-materials.mjs` (review costs first — marked TODO)
- Set `CRON_SECRET` env var in Vercel (for invoice dunning cron)
- Provide 28 product photos (currently placeholders)
- Provide category cover images
- Fix Vercel deploy link (Dashboard → Settings → Git → Disconnect → Reconnect)
- Confirm hardware zero-cost items are intentional freemium pricing

### 2. Data remediation (operational)
- Enter vendor cost quotes for outsourced products via admin UI
- Enter actual production costs on shipped orders via Pricing Center → Costs tab
- Review and run remediation actions: `GET /api/admin/pricing/remediation?action=all`

### 3. Remaining code work (P2-P3)
- Reserve/release stock behavior — reserve at checkout, release on expire/cancel
- Paid/cancelled/expired transition consistency audit
- Mobile production view flow optimization
- Content assets: case studies, design template library

### 4. Not started — future roadmap
- Automated proof generation
- Canada Post shipping integration
- Review collection automation
- B2B bulk API v2
- Inventory alerting system
- Customer file library
- Multi-location support
- AI automation (product descriptions, i18n sync, server preflight, AI chat, smart materials, mockups, predictive pricing)

## Important constraints
- Do **not** rewrite pricing formulas casually
- Do **not** create parallel pricing admin entries
- Keep server-side repricing as truth
- Prefer workflow clarity over new features
- Preserve admin visual language unless UX issue requires change
- Stay on Prisma 6 (Prisma 7 has breaking changes)
- Do NOT use edge runtime with Prisma
- Do NOT rebuild center contracts
- ProofPreview is correct at 6/10 — do NOT add to banners/canvas/signs/marketing
