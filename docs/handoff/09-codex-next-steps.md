# Document 9: Current Checkpoint & Next Codex Directions

> Last updated: 2026-03-11
> For: next Codex / ChatGPT session

## Current checkpoint

This repo is at a **safe pause-and-push checkpoint**.

The recent work completed a deeper admin IA pass:

- Orders Center backbone
- Shipping integrated into Orders semantics
- Customer Center deep-page unification
- Settings Center backbone + RBAC alignment
- Product Center framing + shared center contract

This is no longer just a nav cleanup. The admin backend now has shared center contracts in `lib/admin-centers.js` and shared framing patterns for several object centers.

## Verified state

### Build
- `npm run build` passes clean
- Current build generated `286` app routes successfully

### Tests
- `npx jest --no-coverage` result: `414/416` passing
- The only two failing tests are **pre-existing**:
  - `lib/checkout-origin.test.ts`
  - `lib/order-status-security.test.ts`

### Targeted suites recently added and passing
- `lib/admin-centers.test.ts`
- `lib/admin/customer-center.test.ts`
- `lib/admin/settings-center.test.ts`
- `lib/admin/order-shipping.test.ts`
- `lib/pricing/material-validation.test.ts`

## What is now structurally in place

### Orders Center
- Canonical views in `lib/admin-centers.js`
- Shared order view helpers
- `/admin/orders` behaves like the canonical order hub
- Shipping is now subordinate to Orders at `/admin/orders/shipping`
- Order detail is close to the main operational page

### Customer Center
- Customer detail drives context into:
  - messages
  - support
  - B2B
- Customer-scoped workspace URLs exist
- Deep workspaces now behave as customer workspaces instead of detached tools

### Settings Center
- Canonical settings view model exists
- Settings-related pages are structurally subordinate to Settings
- RBAC/nav/view-model alignment was corrected, including `finance`

### Product Center
- Shared Product Center framing contract exists
- Shared components:
  - `components/admin/ProductCenterHeader.js`
- `image-dashboard` now behaves like a deep media workspace under Product Center

## What still remains

This repo is in a good place to pause, but **not finished**.

The next Codex should continue in this priority order:

1. **Tools Center backbone**
   - Bring `/admin/tools`, contour, proof, stamp-studio into the same canonical center contract style used by Orders / Customers / Settings / Products.
   - Likely needs:
     - view model in `lib/admin-centers.js`
     - shared helper(s)
     - shared header/breadcrumb/view-strip component

2. **Settings/Product deep content consistency**
   - The center contracts are in place, but some pages still keep local/manual framing or old page-specific structures.
   - Good candidates:
     - `app/admin/materials/page.js`
     - `app/admin/users/page.js`
     - settings subpages for visible legacy wording / local patterns

3. **Legacy route consolidation**
   - Old routes still exist as compatibility aliases in several areas:
     - `/admin/shipping`
     - `/admin/messages`
     - `/admin/support`
     - `/admin/b2b`
     - settings/reporting legacy entries
   - Do not delete blindly.
   - First audit whether they should remain aliases, redirect explicitly, or be absorbed further.

4. **Role-specific employee experience**
   - The structural IA is improving, but the employee-facing “task-driven” experience is not fully done yet.
   - If continued, focus on:
     - employee homepage/workstation role-specific surfaces
     - employee-visible nav reduction
     - keeping permissions hidden at nav level, not only blocked after click

## Important constraints to preserve

- Do **not** change pricing formulas/margins without explicit approval.
- Keep center contracts centralized in `lib/admin-centers.js`.
- Prefer route/view helper reuse over hardcoded page URLs.
- Preserve the current admin visual language; do not redesign just because the structure is improving.
- Keep work object-driven:
  - Orders
  - Customers
  - Products
  - Tools
  - Settings

## Recommended next move

If resuming immediately, start with:

### Recommended next wave
- Build **Tools Center** canonical contract
- Then unify `/admin/tools`, `/admin/tools/contour`, `/admin/tools/proof`, `/admin/tools/stamp-studio`
- Reuse the same pattern already established for Product Center

### Why this next
- Orders and Customers are already meaningfully consolidated
- Settings and Products now have backbone/contracts
- Tools is the most obvious remaining top-level object that still needs the same structural treatment

## Notes for the next Codex

- Treat this as a checkpoint, not a finished system.
- The recent work is real and should be preserved.
- The next goal is **deeper structural consistency**, not new feature sprawl.
- Build and full test suite are in a good enough state to continue safely from here.
