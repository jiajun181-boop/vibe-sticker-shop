# Claude Delegation Rules

These rules exist to keep Lunar Print moving forward without wasting context, over-scoping tasks, or letting "surface-complete" work pile up.

## Core Rule

- Do not give any Claude an open-ended multi-day or "one month" task.
- Every task must be a bounded wave with a real workflow outcome.
- Every wave must be reviewed before the next wave starts.

## Role Split

### Claude 1: Primary Builder

Best at:

- order semantics
- checkout and data integrity
- proof and artwork lifecycle
- admin workflow hardening
- medium cross-file semantic waves

Safe wave size:

- about 2-4 hours
- 3-5 numbered sub-tasks
- usually 5-10 files max

Good fit:

- semantic consistency work
- downstream consumer audits
- API plus model plus admin workflow closure
- regression-test-backed fixes

Do not use Claude 1 for:

- open-ended pricing redesign
- giant product-family completion programs
- mixed UI-polish plus pricing plus checkout mega-packs
- many waves in a row without review

### Claude 2: Workflow Closer

Best at:

- page state hardening
- inline feedback, retry, refresh flows
- customer self-service clarity
- admin queue/detail/dashboard tightening
- i18n and copy cleanup
- small operator UX improvements

Safe wave size:

- usually 1-2 files
- 3-5 concrete changes
- small-to-medium page-level workflow wave

Good fit:

- load error separation
- retry, refresh, resolved-row sync
- CTA and path clarity
- page-level workflow tightening
- customer and admin label/copy improvements

Do not use Claude 2 for:

- shared data semantics rewrites
- multi-API structural changes
- large cross-surface logic refactors
- dashboard plus queue plus detail plus API all in one pack
- pricing and checkout integrity work

## Required Task Format

Every wave sent to either Claude should include:

1. Current objective
2. What already exists
3. What is only surface-complete
4. Most important gap
5. P1 / P2 / P3 numbered tasks
6. Files likely involved
7. Do not touch
8. Verification checklist
9. Required output format

## Operating Rhythm

- Claude 1 does one medium wave, then review, then next wave.
- Claude 2 does one small or medium wave, then review, then next wave.
- Never auto-chain multiple waves without review.
- If the task touches price, order, or production semantics, prefer Claude 1.
- If the task is mainly workflow polish, state sync, copy, or UX closure, prefer Claude 2.

## Project Principle

We are not optimizing for feature count or busywork.

We are closing real workflows so:

- customers can order confidently
- support can explain the system
- operators can act quickly
- production can trust the data
- the platform stays maintainable as it grows
