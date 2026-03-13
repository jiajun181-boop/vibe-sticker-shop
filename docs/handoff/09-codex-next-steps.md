# Document 9: Current Checkpoint & Next Codex Directions

> Last updated: 2026-03-13
> Latest pushed commit: `a3ad460`
> For: next Codex / ChatGPT session

## Current checkpoint

### Verified state (2026-03-13)
- **Tests**: `1111/1111` passing (`npx jest --no-coverage --runInBand`)
- **tsc**: `.next/` cleaned; stale `debug-env` validator reference resolved
- **Build**: clean (run `npm run build` to verify route count after `.next/` cleanup)

### Pending DB migration
```bash
npx prisma migrate dev --name add-cost-breakdown
```
`costBreakdownJson` field exists in `prisma/schema.prisma` (OrderItem model) but migration has not been run.

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

The 12 legacy `/admin/pricing-dashboard/*` page files have been **deleted**. All routes are now 301 redirects in `next.config.ts`:

| Legacy path | Canonical destination |
|-------------|----------------------|
| `/admin/pricing-dashboard` | `/admin/pricing?tab=products` |
| `/admin/pricing-dashboard/governance` | `/admin/pricing?tab=governance` |
| `/admin/pricing-dashboard/approvals` | `/admin/pricing?tab=governance&section=approvals` |
| `/admin/pricing-dashboard/b2b-rules` | `/admin/pricing?tab=governance&section=b2b` |
| `/admin/pricing-dashboard/change-log` | `/admin/pricing?tab=governance&section=changelog` |
| `/admin/pricing-dashboard/log` | `/admin/pricing?tab=governance&section=changelog` |
| `/admin/pricing-dashboard/ops` | `/admin/pricing?tab=ops&section=reminders` |
| `/admin/pricing-dashboard/profit-alerts` | `/admin/pricing?tab=ops&section=alerts` |
| `/admin/pricing-dashboard/remediation` | `/admin/pricing?tab=ops&section=reminders` |
| `/admin/pricing-dashboard/snapshots` | `/admin/pricing?tab=governance&section=snapshots` |
| `/admin/pricing-dashboard/vendor-costs` | `/admin/pricing?tab=governance&section=vendor` |
| `/admin/pricing-dashboard/:slug` | `/admin/pricing?tab=quote&slug=:slug` |

`PAGE_ACCESS_RULES` and `ADMIN_NAV_ITEMS.pricingRules.matches` cleaned — no more dual-path matching.
`LEGACY_REDIRECT_MAP` in `lib/admin/pricing-routes.js` retained for reference but no longer used at runtime.

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

### Admin IA
- 5 canonical centers (Orders, Customers, Settings, Products, Tools)
- 106+ regression tests across all center contracts
- RBAC permission matrix with 8 roles × 22 modules
- Role-experience navigation (admin/service/ops/product/finance)

## What still needs work

### 1. Admin operator regression pass
- Manual click-through of: `/admin`, `/admin/workstation`, `/admin/pricing` tabs, Quick Quote → snapshot, approvals/vendor/B2B drilldowns, actual-cost entry, invoice/finance/order status edits, contour tool
- Build/tests green ≠ smooth UX

### 2. Data remediation
- Missing vendor cost, missing actual cost, display/floor policy gaps
- Placeholder/zero-cost materials, suspicious hardware values
- Code entry points exist but operational discipline not established

### 3. Transaction/state closure
- Invoice lifecycle automation
- Reserve/release stock behavior
- Coupon state integrity
- Webhook-side reconciliation
- Paid/cancelled/expired transition consistency

### 4. Role-specific usability
- UI separation for owner/sales/production/CS views not finished
- RBAC matrix exists, but page content doesn't adapt per role yet

### 5. Production workflow tightening
- Reduce back-and-forth between production board, order detail, and pricing review
- Mobile production view exists but flow optimization needed

### 6. Front-end product experience
- ProofPreview only in 3/10 configurators (die-cut, kiss-cut, foam-board)
- Proof approval UX needs clearer customer explanation
- File quality guidance for retail customers
- Stamp product line largely complete (8 models, canvas editor, family landing)
- WWF family landing complete

### 7. Content / assets (needs Jay)
- 28 products with placeholder images
- Category page cover images
- Case studies / recent projects page
- Design Studio template library

### 8. Technical debt
- `costBreakdownJson` migration pending
- `LEGACY_REDIRECT_MAP` in pricing-routes.js can be removed once no code references it
- Webhook handler still heavier than ideal for debugging

## Not started — future roadmap
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
