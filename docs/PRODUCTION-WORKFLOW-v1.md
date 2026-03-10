# Production Workflow — Engineering Document

> Last updated: 2026-03-10
> Status: v1.0 — M7 groundwork (unified readiness, package completeness, Caldera-lite)

---

## 1. Unified Production Readiness Model

### 1.1 Readiness Levels

Every order item is assessed against 5 levels, consistent across all admin pages:

| Level | Color | Meaning |
|---|---|---|
| `done` | Green | Shipped or completed |
| `ready` | Green | All required info present, can go to production |
| `in-progress` | Blue | Actively in production pipeline (assigned/printing/QC) |
| `needs-info` | Amber | Missing non-blocking info (upload-later, design-help, missing contour) |
| `blocked` | Red | Missing critical info (no artwork, no dimensions, no material) |

### 1.2 Assessment Logic (`lib/admin/production-readiness.js`)

**Per-item checks (in order):**
1. Production job status (terminal states short-circuit to done/in-progress)
2. Artwork presence (blocker if missing, warning if upload-later/design-help)
3. Dimensions (blocker if missing, except stamps)
4. Material (blocker for sticker/label/banner/sign families)
5. Contour (warning if missing for sticker/label families)
6. White ink layer (warning if enabled but file not ready)
7. Rush flagging (warning always surfaced)
8. Double-sided back file (warning if missing)
9. Family-specific: stamp preview, booklet page count, NCR parts, vehicle type

**Order-level:** Worst item level propagates up. If any item is blocked, order is blocked.

### 1.3 Pages Using This Model

| Page | How it uses readiness |
|---|---|
| Order Detail (`/admin/orders/[id]`) | Unified readiness banner, per-item readiness dots, per-item tool action links |
| Workstation (`/admin/workstation`) | Task queue categorization (rush/missing-art/pending-pay/ready/other) |
| Production Board (future) | Filter by readiness level |

---

## 2. Package Completeness

### 2.1 Concept

A "production package" is the complete set of files needed to produce one order item. Package completeness is assessed per-item:

| Status | Meaning |
|---|---|
| `complete` | All required files present |
| `partial` | Some files missing but not critical (e.g., contour SVG for sticker) |
| `blocked` | Critical file missing (color artwork) |

### 2.2 Files Tracked Per Family

| File | Sticker/Label | Stamp | Standard Print | Banner/Sign | Vehicle |
|---|---|---|---|---|---|
| Color Artwork | Required | N/A | Required | Required | Required |
| Back Artwork | If 2-sided | N/A | If 2-sided | N/A | N/A |
| Contour SVG | Expected | N/A | N/A | N/A | N/A |
| BG-Removed Image | If available | N/A | N/A | N/A | N/A |
| White Ink Layer | If enabled | N/A | N/A | N/A | N/A |
| Stamp Preview | N/A | Required | N/A | N/A | N/A |

### 2.3 Assessment Function

`assessPackage(item)` in `lib/admin/production-readiness.js` returns:
```
{
  status: "complete" | "partial" | "blocked",
  files: [{ label, present, url, type }],
  missingCount: number,
  totalCount: number
}
```

---

## 3. Tool ↔ Order ↔ Production Closed Loop

### 3.1 Tool Context from Order

When an operator clicks a tool link from an order detail page, the tool opens with context:

```
/admin/tools/contour?orderId=<order-id>
/admin/tools/stamp-studio?orderId=<order-id>
```

Both contour and stamp tools:
- Read `orderId` from URL search params on mount
- Show an "Order Context" banner with link back to the order
- Pre-fill the orderId field
- After saving, show a "Post-Save Guidance" banner with "View Order" button

### 3.2 Data Flow

```
Order Detail                    Tool Page
    |                               |
    |--- Click tool link ---------->|
    |   (?orderId=xxx)              |
    |                               |--- Process file
    |                               |--- Save ToolJob (orderId linked)
    |                               |
    |<-- Post-save "View Order" ----|
    |                               |
    |--- Refresh order data         |
    |   (ToolJobs appear in         |
    |    production files section)  |
```

### 3.3 Current Gaps (Future Work)

1. **Automatic contour-to-item linking** — Currently manual (operator enters orderId). Future: match file to specific OrderItem and write contourSvg to item.meta
2. **Tool result writeback** — ToolJob is created but item.meta is not auto-updated. Future: after contour save, update OrderItem.meta.contourSvg
3. **Per-item tool links** — Tool links include orderId but not itemId. Future: pass itemId for multi-item orders

---

## 4. Caldera-lite Groundwork

### 4.1 Registration Marks (`lib/contour/registration-marks.js`)

Foundation for adding alignment marks to contour SVGs:

| Function | Purpose |
|---|---|
| `generateCrosshairs(bounds, options)` | Calculate crosshair positions at bounding box corners |
| `crosshairsToSvg(marks)` | Convert mark positions to SVG elements |
| `wrapContourWithMarks(cut, bleed, marks, bounds)` | Assemble complete SVG with cut + bleed + registration layers |
| `stepAndRepeat(item, sheet, options)` | Grid layout for single-size items on a sheet |

**SVG layer structure:**
1. `bleed-layer` — Bleed path (dashed cyan)
2. `cut-layer` — Cut path (solid red)
3. `registration-marks` — Crosshair marks (black)

### 4.2 Standard Sheet Sizes

Pre-defined in `STANDARD_SHEETS` constant:
- 12" x 18" (standard sticker sheet)
- 13" x 19" (wide-format)
- Letter (8.5" x 11")
- Tabloid (11" x 17")
- 24" x 36" (large format)

### 4.3 Step-and-Repeat (Placeholder)

Simple grid layout for identical items. Not a real nesting/bin-packing algorithm — that requires a dedicated solver (future task). Current implementation:
- Calculates how many items fit in rows/columns with gap
- Returns positions, count, and utilization %
- No rotation optimization

### 4.4 Production Manifest (`lib/production-manifest.js`)

Assembles all production data for an order into a structured JSON manifest:

```json
{
  "orderId": "...",
  "customerName": "...",
  "isRush": false,
  "items": [
    {
      "productName": "Die-Cut Sticker",
      "family": "sticker",
      "quantity": 100,
      "widthIn": 3,
      "heightIn": 3,
      "material": "glossy-vinyl",
      "artworkUrl": "https://...",
      "contourSvgUrl": "https://...",
      "bleedMm": 3,
      "readiness": "ready",
      "packageStatus": "complete"
    }
  ]
}
```

Functions:
- `buildProductionManifest(order)` — Full manifest from order data
- `manifestToJson(manifest)` — Serialized JSON for download
- `manifestToText(manifest)` — Human-readable text summary

---

## 5. Recommended Next Steps

1. **Tool result writeback** — After contour/stamp save, update OrderItem.meta automatically
2. **Per-item tool context** — Pass itemId in tool URLs for multi-item orders
3. **Real nesting algorithm** — Replace step-and-repeat with bin-packing solver
4. **PDF assembly** — Use pdf-lib to combine artwork + contour + marks into print-ready PDF
5. **Production queue integration** — Feed manifest data into production board for automated routing
6. **Registration mark UI** — Add mark toggle to contour tool output
7. **Sheet size config** — Create admin UI for managing sheet sizes and materials
