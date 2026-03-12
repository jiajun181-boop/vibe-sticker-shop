# Pricing System Orchestrator Board

Last updated: 2026-03-12

## Purpose

This board is the control layer for the current pricing-system push.

Use it to:

- keep Claude 1 and Claude 2 on separate lanes
- preserve shared enums/contracts
- track what is already real in code vs still partially true
- define merge order and verification gates

## Current Reality

The codebase is no longer at the "pricing is scattered in the frontend" stage.

Already in motion:

- canonical pricing contract exists
- floor-price resolver exists
- pricing audit layer exists
- `/admin/pricing` is being turned into a real Pricing Center
- settlement unification has started via `lib/settlement.ts`
- schema already contains workflow models:
  - `AdminQuoteSnapshot`
  - `PricingApproval`
  - `B2BPriceRule`
  - `VendorCost`

Still not fully true yet:

- invoice path is not fully aligned with checkout/interac semantics
- `/admin/pricing` is not yet the single finished Pricing Center
- cost visibility is still stronger in parts of the old dashboard/detail flow than in the canonical admin entry
- outsourced/fixed-price products still lack full vendor-cost-backed profit visibility
- actual margin back-calculation exists in schema fields but is not yet an operator-complete workflow
- webhook fulfillment flow is strong but still too heavy to inspect/debug comfortably

## Shared Contract Rules

Do not fork these field families across lanes.

### Pricing source kinds

- `PRESET`
- `FIXED`
- `TEMPLATE`
- `LEGACY`
- `QUOTE_ONLY`
- `MISSING`

### Candidate cost templates

- `EPSON_WIDE_FORMAT`
- `KONICA_C6085_PAPER`
- `ROLL_LABEL`
- `VEHICLE_VINYL`
- `UNKNOWN`

### Completeness statuses

- `COMPLETE`
- `PARTIAL`
- `MISSING`

### Common missing flags

- `missing_price_source`
- `missing_material_cost`
- `missing_board_cost`
- `missing_option_cost_mapping`
- `missing_readable_ledger`
- `missing_floor_price_policy`
- `missing_template_assignment`
- `missing_display_from_price`
- `missing_vendor_cost`
- `missing_actual_cost`

## Lane Ownership

### Claude 1: main operator-facing pricing lane

Owns:

- settlement alignment across checkout/invoice/interac
- canonical Pricing Center at `/admin/pricing`
- dashboard/detail/quick quote UX
- template inheritance, option mapping, explanation quality
- webhook readability refactor without semantic change

Should avoid:

- deep governance/admin workflows unless required to finish pricing-center UX

### Claude 2: governance and pricing-ops lane

Owns:

- audit and completeness support
- quote snapshots
- approvals and pricing-specific permissions
- B2B price rules
- vendor cost workflows for outsourced products
- actual margin and profit alerts
- version/change summary/ops reminders

Should avoid:

- taking over `/admin/pricing` IA shell
- core pricing formula rewrites

### Codex: integration control and regression guardrails

Owns:

- keeping shared contract language stable
- tracking merge risk
- identifying what is still incomplete even when code exists
- maintaining orchestration handoff
- reviewing incoming work for overlap and gaps

## High-Conflict Files

Do not let multiple lanes freely rewrite these at the same time:

- `app/admin/pricing/page.js`
- `app/admin/pricing-dashboard/page.js`
- `app/admin/pricing-dashboard/[slug]/PricingDetailClient.js`
- `app/admin/pricing-dashboard/[slug]/QuoteSimulator.js`
- `app/api/checkout/route.ts`
- `app/api/checkout/invoice/route.ts`
- `app/api/checkout/interac/route.ts`
- `lib/checkout-reprice.ts`
- `lib/webhook-handler.ts`
- `prisma/schema.prisma`

## Low-Conflict Files / Modules

Good places for parallel work:

- `lib/pricing/audit.ts`
- `lib/pricing/audit-types.ts`
- `lib/pricing/approval.ts`
- `lib/pricing/b2b-rules.ts`
- `lib/pricing/change-log.ts`
- `lib/pricing/profit-tracking.ts`
- `lib/pricing/quote-snapshot.ts`
- `lib/pricing/vendor-cost.ts`
- `app/api/admin/pricing/*`
- new admin components/panels under `app/admin/pricing/`

## What Is Actually Landed Right Now

Observed in the worktree:

- pricing center shell files now exist under `app/admin/pricing/`
- settlement helper exists at `lib/settlement.ts`
- approval, B2B, change summary, profit alert, quote snapshot, and vendor-cost API folders now exist
- pricing dashboard/detail files are still being modified, so compatibility is still in-flight
- schema has already been extended for governance and actual-profit tracking

This means the project has moved past design-only discussion. Integration discipline now matters more than ideation.

## Remaining Work, In Plain Language

These are the important "still not fully true" items.

### 1. Settlement is closer, but not fully closed

Need one semantic model across:

- Stripe checkout
- invoice checkout
- Interac checkout

Specific remaining risk:

- `shippingMethod` vs `deliveryMethod`
- invoice shipping still historically diverged
- B2B/partner discount must not exist only on one path
- order item persistence should not materially differ by path

### 2. System can calculate, but operators still cannot fully read it

Need the canonical Pricing Center to make these visible:

- current sell price
- cost buckets
- total estimated cost
- profit amount
- profit rate
- floor price
- missing data warnings
- why this price came from this path

### 3. Workflow models exist, but need real workflow wiring

These should become actual operator flows, not just schema:

- `AdminQuoteSnapshot`
- `PricingApproval`
- `B2BPriceRule`
- `VendorCost`

### 4. Estimated margin exists; actual margin still needs closure

The schema supports it, but the workflow still needs:

- actual cost entry/update path
- order/item variance rollup
- alerting when margin drops below floor or target

### 5. Webhook is functionally strong but operationally heavy

Need extraction of pure helpers so staff can trace:

- how price metadata was interpreted
- how order items were shaped
- how production jobs were created
- what side effects happened and why

## Merge Order

Prefer this order:

1. shared helpers and pure libs
2. admin APIs
3. pricing-center panels
4. checkout/invoice/interac settlement integration
5. webhook readability refactor
6. route cleanup / redirects / final IA polish

Do not redirect or delete old pricing routes before the new `/admin/pricing` flow has passed verification.

## Verification Gates

Every major batch should pass these checks before being treated as real.

### Gate A: type/build safety

- `npm run build`

### Gate B: pricing contract and audit

- `npx jest lib/pricing/audit.test.ts lib/pricing/pricing-contract.test.ts lib/pricing/floor-price.test.ts --runInBand`

### Gate C: settlement consistency

- `npx jest lib/settlement.test.ts --runInBand`

Goal:

- same cart config produces consistent subtotal/discount/shipping/tax semantics across checkout, invoice, and interac

### Gate D: existing suite sanity

- `npx jest --no-coverage`

Known historical failures may remain if unrelated, but they must be called out explicitly rather than ignored.

## Immediate Review Questions For Each Incoming Report

When either Claude reports progress, check these first:

1. Did they reuse the existing canonical pricing contract, or invent a parallel shape?
2. Did they preserve server-side pricing truth, or move logic into the client?
3. Did they unify semantics, or only make one path prettier?
4. Did they introduce a new pricing entry point instead of consolidating?
5. Did they wire existing schema/models, or create redundant structures?
6. Did they add tests that prove the workflow, not just helper functions?

## Deferred Until After Core Closure

Do not let the project get distracted by these before the current operator workflow is done:

- large visual redesigns
- new product families
- ERP-style exhaustive cost modeling
- broad pricing formula rewrites
- unrelated admin IA cleanup

## Next Integration Target

The next point where work should be reconciled is:

- settlement semantics
- Pricing Center dashboard/detail/calculator
- quote snapshots + approvals + vendor/B2B rules

Once those three clusters are stable, the team can do final route cleanup and enforcement work.
