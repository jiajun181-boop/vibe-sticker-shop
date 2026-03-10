# Document 3: Pricing System Design — lunarprint.ca

## 7. Pricing System Philosophy

### Frontend pricing principles

1. **Instant pricing, no "call for a quote"** — every standard product shows a price within 200ms of configuration change
2. **"From $X.XX" on category cards** — customers know the entry price before clicking
3. **Per-unit pricing prominently displayed** — "$0.27/each" matters more than "$135 total" for sticker buyers
4. **Volume discount visualization** — quantity tier table shows "Save 40%" badges, "order 500 more to save $X" nudges
5. **Transparent breakdown** — quote ledger shows material + setup + finishing costs (optional detail view)
6. **Rush pricing clearly marked** — 30% surcharge for rush production, shown as separate line

### Backend cost system design

The pricing engine has **three layers**:

```
Layer 1: Cost Calculation (what it costs us to make)
  └── Material cost + ink cost + labor cost + machine time + waste

Layer 2: Margin Application (what we charge)
  └── cost / (1 - margin) where margin varies by category × quantity

Layer 3: Surcharges & Fees (add-ons)
  └── Setup fee + finishing surcharges + rush multiplier + accessories markup
```

### Two pricing paths

**Path A: Cost-Plus Templates (6 formulas)**
Used for: most products (signs, banners, canvas, vehicle, marketing print, large-format vinyl)

```
POST /api/pricing/calculate
  → Product lookup → Category → Template function
  → Material cost from DB (Material.costPerSqft)
  → Apply formula (varies by template)
  → Apply margin tier
  → Apply surcharges
  → Return { totalCents, unitCents, breakdown }
```

**Path B: Reference Table (stickers)**
Used for: die-cut stickers, kiss-cut stickers (competitive market — prices set relative to StickerMule)

```
POST /api/pricing/calculate
  → Product lookup → Category = stickers
  → Lookup base price from anchor table (2×2 white vinyl die-cut)
  → Scale by area ratio
  → Apply material multiplier (clear 1.15×, holographic 1.35×, etc.)
  → Apply lamination multiplier (gloss/matte 1.10×)
  → Add setup fee ($12)
  → Return { totalCents, unitCents, breakdown }
```

### PricingPreset model (advanced, data-driven)
Used for: business cards, postcards, and products with complex tiered pricing

```
PricingPreset {
  key: "business-cards-classic"
  model: AREA_TIERED | QTY_TIERED | QTY_OPTIONS | COST_PLUS
  config: {
    sizes: [
      { label: '3.5" × 2"', tiers: [
        { qty: 50, price: 2999 },   // $29.99 for 50
        { qty: 100, price: 3999 },  // $39.99 for 100
        { qty: 250, price: 5999 },  // $59.99 for 250
        ...
      ]}
    ]
  }
}
```

---

## Option Modeling

### How product options are structured

Every product has an `optionsConfig` JSON field in the database that defines available options:

```json
{
  "sizes": [
    { "id": "2x2", "label": "2\" × 2\"", "widthIn": 2, "heightIn": 2 },
    { "id": "3x3", "label": "3\" × 3\"", "widthIn": 3, "heightIn": 3 }
  ],
  "materials": [
    { "id": "white-vinyl", "label": "White Vinyl", "default": true },
    { "id": "clear-vinyl", "label": "Clear Vinyl" }
  ],
  "quantities": [25, 50, 100, 250, 500, 1000],
  "finishings": [
    { "id": "none", "label": "No Lamination", "surcharge": 0 },
    { "id": "gloss", "label": "Gloss Lamination", "surcharge": 0.10 }
  ]
}
```

### Option types and how they affect pricing

| Option type | Examples | Pricing impact |
|-------------|----------|----------------|
| **Size** | 2×2, 3×3, 18×24, 4×8 feet | Directly affects area → material cost |
| **Material** | White vinyl, clear vinyl, coroplast, aluminum | Material cost per sqft from DB + multiplier |
| **Quantity** | 25, 50, 100, 250, 500, 1000+ | Margin tier (higher qty = lower margin) |
| **Sides** | Single, double | Double-sided = 1.20× surcharge |
| **Lamination** | None, gloss, matte, soft-touch | Additional cost per sqft |
| **Cut type** | Die-cut, kiss-cut, rectangular | Shape surcharge for custom die-cut |
| **Print mode** | CMYK only, white ink, white+CMYK | White ink multiplier (1.30× or 1.60×) |
| **Finishing** | Grommets, hems, scoring, binding, folds, rounded corners | Per-unit labor surcharge |
| **Accessories** | H-stakes, standoffs, easel backs | 2.5× cost markup (not margined) |
| **Rush** | Standard, rush production | 1.30× total multiplier |
| **Design help** | No, yes ($45) | Flat fee per item |
| **Multi-name** | 1 name, 5 names, 20 names (business cards) | Discount per name + file fee tiers |

---

## The Six Template Functions

### Template A: `vinyl_print` (Stickers, Labels, WWF)
**Used by:** stickers-labels-decals, windows-walls-floors, facility-asset-labels, safety-warning-decals

```
Cost = Material + Ink + Cutting + Waste + Lamination
Material = (w+bleed) × (h+bleed) × qty ÷ 144 × costPerSqft
Ink = printAreaSqft × $0.035/sqft
Cutting = (qty ÷ 100) × 0.75 min × $0.50/min
Waste = rows × 0.5 min × $0.50/min (die-cut only)
Lamination = printAreaSqft × lamCostPerSqft

Price = cost ÷ (1 - margin) × materialMarkup × shapeSurcharge × turnaroundMult × printModeMult
Min price: $25 (stickers/wwf) or $15 (general)
```

### Template B: `board_sign` (Rigid Signs)
**Used by:** signs-rigid-boards

```
Cost = Board + VinylFace + Ink + Labor
Board = (sheetCost ÷ piecesPerSheet) × qty
  piecesPerSheet = floor(48/w) × floor(96/h) [nesting on 48×96 sheet]
VinylFace = areaSqft × vinylCost × sides × qty
Ink = areaSqft × inkRate × sides × qty
Labor = (boardCut $0.50 + faceApplication $0.50-$1.00) × qty

Price = cost ÷ (1 - margin)
Min price: $15
```

### Template C: `banner` (Banners & Displays)
**Used by:** banners-displays, display-stands

```
Cost = Material + Ink + Finishing + Accessories
Material = areaSqft × costPerSqft × qty
Ink = areaSqft × inkRate × qty
Finishing = free (grommets, hems) + $0.50 pole pocket + $0.25 wind slit
Setup fee: $28 (qty 1-2), $15 (qty 3-5), $10 (qty 6+) — NOT margined

Price = (cost ÷ (1 - margin)) + setupFee + (accessoryCost × 2.5)
Min price: $15
```

### Template D: `paper_print` (Cards, Flyers, Brochures)
**Used by:** marketing-business-print, marketing-prints, packaging, retail-promo

```
Cost = Paper + Ink + Lamination + Finishing
Paper = imposition math (how many pieces per 12×18 or 11×17 parent sheet)
Ink = qty × clickCost × passes (scaled for oversize)
Lamination = per-sheet or scaled by area
Finishing: scoring $0.01, saddle-stitch $0.15, perfect-bind $0.50,
          coil-bind $0.75, rounded-corners $0.08, folds $0.01×numFolds

Double-sided surcharge: 1.20×
Price = cost ÷ (1 - margin)
Min price: $15
```

### Template E: `canvas` (Canvas Prints)
**Used by:** canvas-prints

```
Cost = Canvas + Ink + Frame + Lamination
Canvas = areaSqft × costPerSqft × qty
Ink = areaSqft × inkRate × qty
Frame = (2 × widthBarCost + 2 × heightBarCost) × qty [lookup table by size]
Lamination = areaSqft × lamCost × qty (optional UV protection)

Price = cost ÷ (1 - margin)
Min price: $49
```

### Template F: `vinyl_cut` (Cut Vinyl — No Printing)
**Used by:** vehicle-graphics-fleet, vehicle-branding-advertising

```
Cost = Material + Cutting + Weeding + TransferTape
Material = areaSqft × costPerSqft × qty
Cutting = perimeterFt × $0.15 × qty (Graphtec cutter)
Weeding = areaSqft × $0.50 × qty (manual labor)
TransferTape = areaSqft × $0.05 × qty

Price = cost ÷ (1 - margin)
Min price: $15
```

---

## Margin Tiers (Hardcoded, Category × Quantity)

| Category | Qty ≤24 | ≤99 | ≤499 | ≤999 | ≤4999 | 5000+ |
|----------|---------|-----|------|------|-------|-------|
| Stickers | 80% | 80% | 75% | 68% | 62% | 50% |
| Signs | 75% | 60% | 50% | 45% | 40% | 40% |
| Banners | 75% | 68% | 60% | 55% | 50% | 50% |
| Print | 75% | 75% | 70% | 65% | 60% | 45% |
| Canvas | 75% | 70% | 65% | 65% | 65% | 65% |
| WWF | 75% | 70% | 65% | 60% | 55% | 55% |
| Vehicle | 70% | 65% | 60% | 60% | 60% | 60% |

**Formula:** `price = cost ÷ (1 - margin)` → at 75% margin, a $10 cost item sells for $40

**Safety cap:** margin capped at 0.95 (prevents division by zero)

---

## What's shown on frontend vs backend only

| Data | Frontend | Backend only |
|------|----------|-------------|
| Total price | Yes | — |
| Per-unit price | Yes | — |
| Volume discount % | Yes ("Save 40%") | — |
| Next-tier savings | Yes ("Order 500 more to save $X") | — |
| Rush surcharge | Yes (line item) | — |
| Setup fee | Yes (line item) | — |
| Material cost | No | Yes |
| Margin % | No | Yes |
| Labor minutes | No | Yes (per OrderItem) |
| Cost breakdown | No | Yes (quote ledger for admin) |
| Material cost per sqft | No | Yes (Material model) |
| Ink rate | No | Yes (hardcoded in templates) |

---

## Price change auditing

Every pricing adjustment is logged to `PriceChangeLog`:
```
{ productId, operatorId, beforePrice, afterPrice, driftPercent, reason, createdAt }
```

Server-side repricing at checkout logs drift > 5% to console for monitoring.

---

## Special pricing rules

1. **Business cards use PricingPreset** — fixed tier tables, not formula-based
2. **Stickers use reference table** — prices set relative to StickerMule (65-75% of competitor)
3. **Vehicle full wraps are quote-only** — no instant pricing, "Contact us" flow
4. **Posters have fixed unit-price tables** — per standard size, area-based for custom
5. **Accessories (stakes, standoffs) are 2.5× markup** — not subject to margin tiers
6. **Setup fees are NOT margined** — added after cost ÷ (1 - margin) calculation
7. **Design help is flat $45** — not affected by quantity or configuration
8. **Multi-name business cards** — $5 discount per additional name, tiered file fees ($12/$10/$8)
9. **Rounded corners on business cards** — $0.03/card surcharge
10. **White ink on transparent materials** — automatic 30-60% surcharge based on mode
