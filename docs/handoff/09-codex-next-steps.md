# Document 9: Current Checkpoint & Next Codex Directions

> Last updated: 2026-03-12
> Latest pushed commit: `44bf7a4` (`Merge origin/main and finalize admin pricing stabilization`)
> For: next Codex / ChatGPT session
>
> ## Sprint 2 (2026-03-12) — 13 issues resolved from LunarPrint_网站系统问题总表
>
> ### Code fixes applied (not yet committed):
> 1. **i18n**: Added 175+ missing translation keys to `lib/i18n/en.js`
> 2. **Design help bug**: Fixed invoice/interac checkout storing design help as qty:1 instead of qty:N
> 3. **deliveryMethod**: Added to Stripe metadata + webhook order creation
> 4. **Webhook resilience**: Added maxDuration=60, per-item error handling for production jobs
> 5. **Mobile responsiveness**: Production kanban stacks vertically, filter wrapping, mobile search button
> 6. **System health dashboard**: New `/admin/system-health` with 8 automated checks
> 7. **Admin i18n**: Replaced hardcoded strings in 8 admin pages (analytics, content, factories, logs, production, reviews)
> 8. **Coupon lifecycle**: Auto-refund (decrement usedCount) on order cancel when payment was confirmed
> 9. **Invoice overdue cron**: `/api/cron/invoice-overdue` — daily at 9am, marks overdue + emails Jay
> 10. **Alert system cron**: `/api/cron/alerts` — daily at 9am, checks 7 triggers, sends summary email
> 11. **Print CSS**: Global `@media print` rules hide sidebar/nav, clean layout for work orders/quotes
> 12. **Schema**: Added `costBreakdownJson` field to OrderItem (migration pending)
>
> ### Pending DB migration:
> ```bash
> npx prisma migrate dev --name add-cost-breakdown
> ```
>
> ### Remaining items needing business decisions:
> - B2B contract pricing system design
> - Role-specific view customization (production mobile-first for dad, print-friendly CS for mom)
> - Unit conversion calculator in Quick Quote tool

## Current checkpoint

This repo is no longer at the "pricing logic is scattered and the admin is mostly a shell" stage.

The current pushed state is a strong, usable checkpoint:

- admin pricing/governance tooling is landed
- checkout/invoice/interac semantics are much closer to one truth path
- approvals/B2B/vendor-cost/actual-cost workflows now exist in code
- state-transition guardrails are enforced in more places
- the merge from the remote admin IA work is already completed and pushed

This is a real continuation point, not a speculative branch.

## Verified state

### Build
- `npm run build` passes clean
- Current build generated `316` app routes successfully

### Type safety
- `npx tsc --noEmit` passes clean

### Tests
- `npx jest --no-coverage --runInBand` result: `711/711` passing

## What is actually real now

### Pricing / quote system
- Canonical pricing contract exists
- Floor-price resolver exists
- Pricing audit layer exists
- `/admin/pricing` has become the main pricing center shell
- Quick Quote, approvals, snapshots, vendor cost, B2B rules, profit alerts, and ops/governance surfaces all exist

### Transaction consistency
- Shared settlement helper is in place
- Stripe, invoice, and Interac now share more aligned subtotal/discount/shipping/tax behavior
- Interac now supports coupon semantics
- B2B pricing logic is wired into checkout paths
- Invoice coupon timing was corrected so coupon usage is consumed on payment confirmation, not invoice creation
- Cancel flow now releases reserved stock

### Governance / operations
- Approval routes and apply flow exist
- Quote snapshot persistence exists
- Vendor cost CRUD and pricing-contract integration exist
- Actual-cost/profit-alert workflow exists
- Change log / ops reminder / governance hub pages exist

### State lifecycle
- Payment, production, and invoice transitions now have explicit validity maps
- Admin PATCH routes enforce more legal state transitions instead of accepting arbitrary status moves

### Admin IA / shared centers
- Orders / Customers / Settings / Product framing work from the earlier IA push is already merged
- Remote admin IA work from `origin/main` has already been integrated into the current branch history

## What is improved but not "perfectly closed"

This is not a broken system, but it is also not a "10/10 done forever" system.

The main remaining truth is:

- the system is code-green
- the main backend/business loops are strong
- but a final operator-grade closure still depends on more real-world UX cleanup, data cleanup, and workflow discipline

### Not fully closed yet

1. Admin manual UX still needs more real click-through validation
- Build/tests being green does not prove every deep admin path feels smooth
- Keep validating actual operator flows, not just APIs

2. Legacy compatibility shells still exist
- `/admin/pricing-dashboard/*` still exists for compatibility
- Do not assume all legacy entry points are fully retired yet

3. Data completeness is still uneven
- Some products still have partial cost models
- Vendor cost coverage is not automatically complete just because the workflow exists
- Material/hardware anomalies and historical data debt still need cleanup

4. Actual margin is implemented, but real operational discipline still matters
- The workflow exists, but the business only benefits if actual costs are consistently entered and maintained

5. Webhook/order fulfillment is functional but still heavier than ideal
- It is safer than before, but there is still room to make reconciliation and fulfillment tracing easier to inspect

## Immediate next priorities

Do these in order. Do not sprawl.

### 1. Admin operator regression pass
- Walk the real admin flows manually
- Focus on:
  - `/admin`
  - `/admin/workstation`
  - `/admin/pricing`
  - Quick Quote -> save snapshot
  - approvals / vendor / B2B / ops reminder drilldowns
  - actual-cost entry flow
  - invoice/finance/admin order status edits
  - contour tool usability
- Fix friction and dead ends before adding more capability

### 2. Legacy route retirement / compatibility cleanup
- Audit remaining `/admin/pricing-dashboard/*` usage
- Keep deep-link compatibility where needed
- Prefer server redirects or thin compatibility shells
- Do not leave old and new pricing workflows competing indefinitely

### 3. Data remediation and operational completeness
- Use the remediation/audit layer to reduce actual missing data, not just report it
- Prioritize:
  - missing vendor cost
  - missing actual cost
  - display/floor policy gaps
  - placeholder/zero-cost materials
  - suspicious hardware values

### 4. Stronger transaction/state closure
- Keep tightening:
  - invoice lifecycle automation
  - reserve/release stock behavior
  - coupon state integrity
  - webhook-side reconciliation
  - consistency between paid/cancelled/expired transitions

### 5. Role-specific usability
- The system has more power now, but role-targeted simplicity is not finished
- Continue separating what:
  - owner/admin sees
  - sales sees
  - production sees
  - customer service sees

## Important constraints to preserve

- Do **not** rewrite pricing formulas casually
- Do **not** create a parallel pricing admin entry again
- Keep server-side repricing as truth
- Prefer adding workflow clarity over adding more raw features
- Preserve the current admin visual language unless a UX issue truly requires change

## Recommended next move

If resuming immediately, start with:

1. operator click-through regression on the admin surfaces
2. cleanup of remaining legacy pricing-dashboard dependency
3. remediation of the highest-value missing data paths

That order matters more than adding new modules.

## Notes for the next Codex

- Treat the current repo as strong but not finished
- The system is now real enough that careless new work can create regressions
- Optimize for closure, not breadth
- Prefer "make the existing flows truly reliable" over "invent another panel"
- Build/tests are green; use that as a guardrail, not as a substitute for operator thinking

## Local worktree note

At the time this handoff was updated, there was also a separate local unstaged change in:

- `lib/i18n/en.js`

Do not overwrite or revert that blindly unless you inspect it first.
