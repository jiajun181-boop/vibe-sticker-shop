# Pricing System Orchestrator Board

Last updated: 2026-03-13

## Purpose

Control layer for pricing system work. Tracks what is real in code vs still partially true.

## Current Reality (2026-03-13)

### What is real now

- Canonical pricing contract with 7-tab shell at `/admin/pricing`
- Floor-price resolver, pricing audit layer, Quick Quote
- Approvals, snapshots, vendor cost, B2B rules, profit alerts, ops/governance tabs
- Settlement helper across Stripe/invoice/Interac (`lib/settlement.ts`)
- Legacy `/admin/pricing-dashboard/*` fully retired → 301 redirects in `next.config.ts`
- Webhook `charge.refunded` handler with full/partial refund detection
- Coupon increment inside order creation transaction (atomic)
- Invoice dunning: payment reminders (3d before due) + overdue notices to customers
- Unpaid order auto-cancel cron (7d Interac, 14d Invoice)
- Event ID logging on all webhook events

### What is still not fully true

- Outsourced/fixed-price products lack full vendor-cost-backed profit visibility
- Actual margin back-calculation exists in schema but not an operator-complete workflow
- Invoice lifecycle still lacks: partial payment tracking, payment plan support
- Cost entry workflow exists but operational discipline not established
- Zero-cost materials and missing vendor costs need data remediation

## Shared Contract Rules

Do not fork these field families.

### Pricing source kinds
`PRESET` | `FIXED` | `TEMPLATE` | `LEGACY` | `QUOTE_ONLY` | `MISSING`

### Candidate cost templates
`EPSON_WIDE_FORMAT` | `KONICA_C6085_PAPER` | `ROLL_LABEL` | `VEHICLE_VINYL` | `UNKNOWN`

### Completeness statuses
`COMPLETE` | `PARTIAL` | `MISSING`

### Common missing flags
- `missing_price_source`, `missing_material_cost`, `missing_board_cost`
- `missing_option_cost_mapping`, `missing_readable_ledger`
- `missing_floor_price_policy`, `missing_template_assignment`
- `missing_display_from_price`, `missing_vendor_cost`, `missing_actual_cost`

## High-Conflict Files

Do not let multiple lanes freely rewrite these:

- `app/admin/pricing/page.js`
- `app/api/checkout/route.ts`
- `app/api/checkout/invoice/route.ts`
- `app/api/checkout/interac/route.ts`
- `lib/checkout-reprice.ts`
- `lib/webhook-handler.ts`
- `prisma/schema.prisma`

## Low-Conflict Files

Good for parallel work:

- `lib/pricing/audit.ts`, `lib/pricing/audit-types.ts`
- `lib/pricing/approval.ts`, `lib/pricing/b2b-rules.ts`
- `lib/pricing/change-log.ts`, `lib/pricing/profit-tracking.ts`
- `lib/pricing/quote-snapshot.ts`, `lib/pricing/vendor-cost.ts`
- `app/api/admin/pricing/*`
- Admin components under `app/admin/pricing/`

## Remaining Work

### 1. Cost visibility closure
- Actual cost entry → variance rollup → alerting when margin < floor
- Vendor cost for outsourced products needs operational workflow

### 2. Data remediation
- Zero-cost materials in seed data
- Missing vendor costs for outsourced products
- Floor/display policy gaps
- Suspicious hardware values (grommets, pole pockets)

### 3. Settlement edge cases
- `shippingMethod` vs `deliveryMethod` consistency
- B2B/partner discount across all checkout paths

## Verification Gates

### Gate A: type/build safety
```bash
npm run build
```

### Gate B: pricing contract and audit
```bash
npx jest lib/pricing/audit.test.ts lib/pricing/pricing-contract.test.ts lib/pricing/floor-price.test.ts --runInBand
```

### Gate C: settlement consistency
```bash
npx jest lib/settlement.test.ts --runInBand
```

### Gate D: existing suite sanity
```bash
npx jest --no-coverage
```
