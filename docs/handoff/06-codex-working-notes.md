# Codex Working Notes

## Product Direction

Lunar Print is not a brochure site. It is a Toronto-first web-to-print operating system.

Two goals are always equal:

1. Make ordering easier for customers.
2. Make daily production/admin work easier for operators.

Judge work by real workflow completion, not by feature count or surface polish.

## Current Priorities

Prioritize in this order:

1. Existing workflow usability
2. Conversion clarity and ordering confidence
3. B2B / reorder / repeat workflow foundations
4. Future automation

The most valuable next step is usually the smallest fix that removes a real dead end, stale state, wrong math display, or operator pain point.

## Non-Negotiables

- Do not change pricing formulas without Jay approval.
- Do not propose a broad rewrite.
- Do not widen scope because a nearby refactor looks tempting.
- Do not optimize for "feature count."
- Prefer real completion over fake-complete UI.

## Working Style

- Read the current code before proposing changes.
- Search first; do not guess.
- Prefer small, high-value, workflow-closing changes.
- Keep customer convenience and operator usability balanced.
- When a feature looks done, verify the downstream consumers.
- If a change affects totals, proofs, statuses, or production, trace the full lifecycle.
- After each meaningful batch, run verification instead of assuming.

## Recently Hardened

These lanes were recently pushed forward and should be preserved:

- Non-Stripe checkout order semantics and discount consistency
- Service-fee rows no longer impersonate products in reorder/production paths
- Guest email capture and success-page guest flow
- Track-order monetary breakdown correctness
- Customer proof approval UX and validation
- Admin proof lifecycle transitions and queue semantics
- Customer-facing order/timeline labels

## What To Avoid Breaking

- `subtotalAmount` means pre-discount subtotal
- `discountAmount` is separate and should not be folded into subtotal
- Service fees are charges, not manufacturable or reorderable products
- `revised` proof means superseded history, not an active review item
- Customer-facing labels should stay customer-readable; admin jargon belongs in admin views

## Good Default Process

1. Identify the exact workflow gap.
2. Confirm where the data is written.
3. Confirm every important consumer.
4. Make the smallest safe fix.
5. Run build/tests relevant to that lane.
6. Leave a short note about what was intentionally deferred.
