# Document 11: Pricing System Checkpoint

> Last updated: 2026-03-12
> For: next Codex / ChatGPT session

## Current checkpoint

This repo is at a **safe pricing-system pause-and-push checkpoint**.

The recent work did not just polish pricing pages. It materially closed the pricing workflow loop across:

- Pricing Center
- Quotes queue
- Exact-target routing
- Mutation refresh semantics
- Shared pricing-home summary
- Quote -> order provenance
- Pricing-risk visibility on live operator surfaces

This pricing line is now strong enough that the next Codex should **not reopen it for minor cleanup** unless a real workflow regression is found.

## Verified state

### Build
- `npm run build` passes clean
- Current build generated `317` app routes successfully

### Targeted tests I personally re-ran
- `lib/quotes/workflow.test.ts`
- `lib/admin/mutation-refresh.test.ts`
- `lib/pricing/home-summary.test.ts`
- `lib/admin/pricing-routes.test.js`
- Result: `109/109` passing

### Additional agent-reported coverage
- Pricing/focus/ops/quote suites were expanded heavily during this sprint
- The current tree includes new focused-mode, refresh, and quote-workflow coverage

## What is now structurally in place

### Canonical pricing routing/focus
- `lib/pricing/focus.ts` is now the single canonical pricing-routing contract
- `lib/admin/pricing-routes.js` delegates to the focus contract instead of hand-building URLs
- Exact-target routing now supports:
  - `tab`
  - `section`
  - `orderId`
  - `itemId`
  - `slug`
  - `approvalId`
  - `alertType`
  - `returnTo`
  - `source`

### Pricing Center home truth
- `/api/admin/pricing/home-summary` is now the shared pricing-home contract
- It exposes:
  - section counts
  - health/degraded state
  - canonical `actionItems`
  - `actionUrl`
  - `focusTarget`
  - `topLabel`
  - `description`
- `DashboardPanel` now consumes this contract directly enough that the old local action reconstruction is no longer the main truth

### Focused pricing APIs
- Focused mode is now available across the main pricing issue APIs:
  - cost completeness
  - profit alerts
  - approvals
  - vendor costs
- Focused responses now carry enough metadata that the UI can distinguish broad mode vs exact-target mode

### Mutation refresh contract
- Pricing mutations now return a shared `refreshHint.invalidates[]` contract aligned to pricing-home section keys
- This reduces stale UI state after:
  - actual cost entry
  - item cost updates
  - approval actions
  - vendor cost updates
  - quote lifecycle mutations

### Quotes as real pricing workspace
- Quotes list/detail now consume backend workflow semantics instead of mostly guessing from raw status
- Backend now provides:
  - per-quote `workflow`
  - `queueSummary`
  - detail `allowedTransitions`
  - detail `convertedOrder`
- Quotes UI now uses:
  - workflow-driven list hints
  - queue summary banner
  - allowed transition-scoped status dropdown
  - converted-order provenance card

### Pricing-risk on live operator surfaces
- Pricing/cost risk is no longer limited to printable tickets
- Live operator surfaces now carry pricing-risk state:
  - production list
  - production detail
  - workstation
  - order detail
- `CostSignalBadge` / pricing-risk affordances are now part of the main operator flow

## What this means operationally

The pricing system is now good enough that an operator can:

1. Open Pricing Center and see truthful current work
2. Click a high-priority action
3. Land on the exact pricing record or issue
4. Fix it
5. Return to the originating page or continue the next task

That was not true before this sprint.

## What still remains

This pricing checkpoint is strong, but it is **not the final state of the whole admin system**.

The next Codex should treat pricing as **stable enough to stop**, not as the next primary excavation target.

Only reopen pricing if one of these happens:

- a real workflow regression is found
- an exact-target route lands on the wrong record
- home-summary and focused-mode APIs drift apart
- quote workflow falls back into local state guessing

## Recommended next move

Shift attention away from pricing and back to a top-level admin object that still needs the same depth of closure.

### Recommended next priority
1. **Tools Center backbone**
   - bring `/admin/tools`, contour, proof, stamp-studio under one canonical center contract
   - reuse the same object-center pattern already established for Orders / Customers / Settings / Products

2. **Production workflow tightening**
   - use the stronger pricing/provenance signals now available
   - reduce page-hopping between production, order detail, and pricing review

3. **Legacy route consolidation**
   - only after confirming compatibility/redirect behavior carefully

## Important constraints to preserve

- Do **not** change pricing formulas/margins without explicit approval
- Keep `focus.ts` as the single pricing-routing truth
- Keep pricing-home action semantics centralized in `home-summary`
- Prefer backend workflow/mutation contracts over new local UI state machines
- Do not spend new work on Unicode/punctuation cleanup unless it directly blocks the main workflow

## Notes for the next Codex

- Treat this as a completed pricing sprint checkpoint, not a half-finished pricing prototype
- The next win is likely outside pricing
- If you resume pricing, resume only from a concrete workflow bug, not from a desire to "polish it more"
