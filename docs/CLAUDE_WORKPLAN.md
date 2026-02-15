# Claude Parallel Work Plan (Product Page + Pricing)

## Goal
Improve product-page conversion and pricing trust without breaking checkout safety. Work in parallel across UX, pricing data, and QA.

## Track A - Product Page UX (High Priority)
1. Reduce decision friction in right rail
- Add compact "What changed" badges when option changes affect price.
- Keep quote and CTA visually fixed while advanced options scroll.
- Acceptance: user can configure + add to cart within 30 seconds on mobile.

2. Improve option controls for scanability
- Convert long checkbox lists into grouped cards with short helper text.
- Add "Most popular" default choices per product family.
- Acceptance: at least 1 default selection path per family, no empty states.

3. Strengthen trust modules near CTA
- Add delivery promise, print quality guarantee, and support SLA row.
- Add explicit "Upload now or after checkout" copy near CTA.
- Acceptance: trust/info blocks appear above fold on desktop and before sticky CTA on mobile.

## Track B - Pricing Integrity + Consistency (Critical)
1. Prevent list-page vs product-page price mismatch
- Replace static `basePrice` ranges with quote-aware "From" logic by default size/qty.
- Acceptance: category card price and product default quote differ by <= 5% unless flagged.

2. Add pricing preset schema validation in admin APIs
- Validate model-specific required fields (tiers/sizes/materials/finishings).
- Reject invalid configs with clear field-level errors.
- Acceptance: malformed preset cannot be saved.

3. Add checkout repricing tests
- Single-size, multi-size, flat addon, per-unit addon, names > 1.
- Acceptance: checkout always uses server repriced amount, not client amount.

## Track C - Market Benchmark Pipeline (High Priority)
1. Build benchmark dataset for top 40 SKUs
- Normalize to same spec: size, qty, turnaround, finishing.
- Track competitor min/median/max and our price.
- Acceptance: each SKU has at least 2 competitor references or marked "custom quote".

2. Define target pricing bands by category
- Commodity products: market median -5% to +3%.
- Premium products: market median +0% to +12% with value justification.
- Acceptance: every SKU has target band + rationale.

3. Alerting for outliers
- Flag SKUs >15% above median without premium justification.
- Acceptance: weekly report generated for pricing review.

## Track D - QA + Instrumentation (Medium)
1. Add funnel events for product page
- option_change, quote_loaded, add_to_cart, upload_started, upload_completed.
- Acceptance: event payload contains slug, qty, and pricing model.

2. Add smoke scenarios
- Mobile sticky CTA flow
- Multi-size area product flow
- Business cards multi-name flow
- Acceptance: all pass in pre-release checklist.

## Handoff Rules
- Small PRs (<300 lines changed each) per track.
- Include before/after screenshots for UI changes.
- Include test evidence in PR description.
