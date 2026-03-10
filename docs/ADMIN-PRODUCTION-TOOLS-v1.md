# Admin Production Tools — Engineering Foundation Document

> Last updated: 2026-03-10
> Status: v1.2 — M7 unified readiness, tool↔order loop, Caldera-lite groundwork

---

## 1. Tool Inventory

### 1.1 Contour Tool (`/admin/tools/contour`)

**Purpose:** Generate die-cut SVG contour paths from sticker artwork images.

**Pipeline:**
1. Upload image (drag-drop or file picker, max 25 MB)
2. Detect alpha channel (sample 5000 pixels, >1% transparent = has alpha)
3. If no alpha: run `@imgly/background-removal` (ONNX/WASM, ~20 MB model download)
   - Skipped on mobile (OOM risk) — operator sees detailed degradation notice
4. Downsample to max 512px for processing
5. Marching squares contour tracing → simplify (epsilon 1.5) → smooth (2 iterations)
6. Scale back to original dimensions
7. Offset for bleed (mm → px via DPI conversion, adjustable 0–6mm slider)
8. Generate SVG paths (cubic Bezier curves)
9. Quality analysis → confidence grade (good / rectangular / low)

**Input files:** PNG (with transparent bg ideal), JPG, SVG — any image/* MIME type
**Output files:**
- SVG contour file (cut path + bleed path) — uploaded to UploadThing
- Processed PNG (bg-removed version, if applicable) — uploaded to UploadThing
- Original source image — uploaded to UploadThing

**Job record saved to DB (`ToolJob` model):**
```
toolType: "contour"
inputFileUrl   → original image
inputData      → { fileName, bleedMm, imageWidth, imageHeight }
outputFileUrl  → SVG contour file
outputData     → { cutPath, bleedPath, bgRemoved, svgFileUrl, processedFileUrl,
                   contourConfidence, contourShapeType, contourWarnings[],
                   areaCoverage, rectangularity, pointCount, contourBounds, imageBounds }
orderId        → optional link to order
notes          → operator notes
status         → "completed" | "needs_review"
```

**Quality grades:**
- `good`: Organic shape, clean edges — ready for production
- `rectangular`: High rectangularity (>92%) + high coverage (>85%) — likely a document, not a sticker
- `low`: Full-bleed, very few points, or edge proximity issues — needs manual contour

**Order association:** Optional — operator enters order ID manually. No automatic detection.

**Download:** SVG and processed PNG can be downloaded directly from the page and from job detail modal.

---

### 1.2 Proof Manager (`/admin/tools/proof`)

**Purpose:** Upload, review, approve/reject proofs for customer orders + standalone proof records.

**Two data sources (normalized into unified list):**
1. **Order proofs** — `OrderProof` model, linked to orders via `orderId`
2. **Standalone proofs** — stored as `ToolJob` (toolType: "proof"), for walk-in/phone customers

**Workflow:**
1. Upload proof file (image or PDF) + link to order ID
2. Proof appears in list as "pending"
3. Operator reviews and approves or rejects
4. If rejected → operator uploads revised version → old proof marked "revised"
5. Standalone proofs have no approval workflow — they're just file records

**Input files:** Image (image/*) or PDF
**Output:** Proof record with status, linked to order

**Job record:**
- Order proofs: `OrderProof` model (status: pending/approved/rejected/revised)
- Standalone: `ToolJob` model (toolType: "proof", status: "completed")

**Order association:** Required for order proofs (enter order ID). None for standalone.

**Customer notification:** Status changes on order proofs trigger customer notification (server-side).

---

### 1.3 Stamp Studio (`/admin/tools/stamp-studio`)

**Purpose:** Design custom rubber stamp artwork with live canvas preview.

**Features:**
- 5 stamp models: Round 40mm, Round 50mm, Rect 47×18mm, Rect 58×22mm, Rect 70×30mm
- 7 quick-start presets (address, approval, date received, signature, book name, fun, blank)
- `StampEditor` component (dynamic import, ssr: false):
  - Canvas-based text editor
  - Font picker, border picker, halftone upload
  - Curve amount, logo overlay, reference toggle
  - Real-time preview
- Reopen/duplicate previous jobs
- Export PNG via `canvas.toBlob()`

**Input:** Stamp model selection + customer text + font + ink color
**Output:** PNG artwork file uploaded to UploadThing

**Job record:**
```
toolType: "stamp-studio"
inputData  → { model, text, font, color }
outputData → { fileName, shape, widthIn, heightIn, diameterIn }
outputFileUrl → PNG file
orderId    → optional
```

**Order association:** Optional — operator enters order ID manually.

---

### 1.4 Tools Hub (`/admin/tools`)

**Purpose:** Central navigation page for all production tools.

**Shows:** 4 tool cards (Contour, Proof, Stamp, Pricing Dashboard) + job counts + recent activity across all tools.

---

### 1.5 Workstation (`/admin/workstation`)

**Purpose:** Daily operations dashboard — single API call (`/api/admin/workstation/summary`).

**Sections:**
1. Stats cards (total orders, needs attention, pending proofs, recent jobs, in production)
2. Quick actions (7 links to common tasks)
3. Needs-attention orders (priority-sorted, server-filtered)
4. Proof queue + recent tool jobs (side-by-side)
5. Production summary (queued / assigned / printing / QC / on hold)

---

## 2. Current Completeness Matrix

| Capability | Contour | Proof | Stamp |
|---|---|---|---|
| Input file upload | Yes | Yes | N/A (canvas) |
| Output file generation | SVG + PNG | Stored as-is | PNG |
| Output file download | Yes | Yes | Yes |
| Job record in DB | Yes (ToolJob) | Yes (OrderProof + ToolJob) | Yes (ToolJob) |
| Order association | Optional (manual + URL) | Required (order proofs) | Optional (manual + URL) |
| Read orderId from URL | Yes (M7) | N/A | Yes (M7) |
| Order context banner | Yes (M7) | N/A | Yes (M7) |
| Post-save guidance | Yes (M7) | N/A | Yes (M7) |
| Quality assessment | Yes (confidence grade) | N/A | N/A |
| Reopen previous job | Yes | No | Yes |
| Duplicate job | No | No | Yes |
| Mobile support | Degraded (explicit notice) | Full | Full (canvas works) |
| Error boundary | Yes (route-level, i18n) | Shared admin | Shared admin |
| i18n (en + zh) | Full | Full | Full |
| Breadcrumb navigation | Yes | Yes | Yes |
| Empty state guidance | Yes | Yes | Yes |

---

## 3. Runtime Protections (M6)

### 3.1 Contour Tool — Crash Prevention

| Protection | Location | What it prevents |
|---|---|---|
| Canvas context null guard | `generate-contour.js:67` | Browser OOM on canvas creation — throws descriptive error instead of `TypeError: null` |
| Dual-processing guard | `contour/page.js` (`processingRef`) | User clicking upload while previous contour is still running |
| Blob URL cleanup on unmount | `contour/page.js` (useEffect cleanup) | Memory leak when navigating away during processing |
| Reopen fetch validation | `contour/page.js` (`handleReopen`) | Expired or deleted source files showing corrupt data |
| Bleed recalc error feedback | `contour/page.js` (`handleBleedChange`) | Silent failure on bleed slider — now shows error banner |
| File type guard | `contour/page.js:98` | Non-image files dropped into upload zone |
| File size guard | `contour/page.js:103` | Files >25 MB that would OOM mobile browsers |
| Background removal fallback | `generate-contour.js:95` | WASM load failure or bg-removal crash — falls back to using original image |
| Route-level error boundary | `contour/error.js` | Uncaught exceptions (canvas OOM, WASM crash) — shows recovery UI with i18n |

### 3.2 Mobile Degradation Strategy

**Contour Tool on Mobile:**
- Background removal is **completely skipped** (WASM + 20MB model = OOM risk)
- Explicit degradation notice shows what mobile **can** and **cannot** do
- Can do: upload PNG with alpha, trace contour, adjust bleed, download, save
- Cannot do: auto background removal, process large files (>10 MB)
- Recommendation: use desktop for full experience

**Other tools on mobile:** Full functionality, no degradation needed.

---

## 4. Navigation & Workflow (M6)

### 4.1 Breadcrumb Navigation

All 5 admin tool pages now show a consistent breadcrumb trail:
- Workstation → Tools Hub → [Tool Name]
- Allows quick navigation without using browser back button

### 4.2 Inter-page Flow

| From | To | Mechanism |
|---|---|---|
| Order detail | Any tool | Quick action links (contour/proof/stamp) |
| Any tool | Order detail | "View Order" button on job rows (when orderId is set) |
| Tool page | Tools Hub | Breadcrumb |
| Tools Hub | Workstation | Breadcrumb |
| Workstation | Tool pages | Quick action cards |
| Workstation | Proof detail | Deep link via `?proofId=xxx` |

### 4.3 Empty State Guidance

All empty states now include:
- Human-readable description of why it's empty
- Hint about what to do next
- Action buttons where applicable (e.g., proof page shows upload buttons in empty state)

---

## 5. Gap Analysis for Future Automation

### 5.1 Auto-Layout / Imposition (`FUTURE`)

**What it does:** Arranges multiple sticker contours onto a print sheet (e.g., 12"×18") to minimize waste.

**What exists now:**
- Contour SVG paths (cut + bleed) — generated by contour tool
- Image dimensions stored in job records
- Bleed offset stored in mm

**What's missing:**
1. **Sheet size configuration** — no model/table for available sheet sizes (12×18, 13×19, etc.)
2. **Nesting algorithm** — no bin-packing / nesting logic exists
3. **Multi-contour input** — contour tool processes one image at a time; imposition needs batch
4. **Grouped output** — need combined SVG with multiple contours positioned on sheet
5. **Material waste tracking** — no field for sheet utilization %
6. **Job-to-sheet mapping** — one print sheet may contain items from multiple orders

**Data fields needed in DB:**
```
PrintSheet {
  id, sheetWidth, sheetHeight, materialId
  utilization (%)
  layoutSvgUrl  → positioned contours SVG
  items[]       → array of { contourJobId, orderId, x, y, rotation, quantity }
}
```

### 5.2 Registration Marks (`FUTURE`)

**What it does:** Adds alignment marks (crosshairs, crop marks) to print files for accurate cutting.

**What exists now:**
- SVG contour paths with known dimensions
- Bleed offset values

**What's missing:**
1. **Mark types** — no configuration for mark style (crosshair, corner crop, center dots)
2. **Mark placement logic** — relative to bleed edge, configurable offset
3. **Mark layer in SVG** — current SVG only has cut + bleed layers; need a registration layer
4. **Color configuration** — registration marks typically use spot color (e.g., Registration Black)
5. **Mark-to-contour association** — which marks belong to which contour on a multi-up sheet

**Data fields needed:**
- `registrationMarkType` on contour output
- `markOffset` (mm from bleed edge)
- Registration layer in SVG output

### 5.3 Automated Order-to-Production Pipeline (`FUTURE`)

**What it does:** When an order is approved, automatically:
1. Find the contour job linked to the order
2. Auto-layout onto available sheet sizes
3. Add registration marks
4. Generate print-ready PDF
5. Queue for production

**What exists now:**
- Order model with production status
- Contour jobs with optional `orderId`
- Proof system with approval workflow

**What's missing:**
1. **Automatic contour-to-order linking** — currently manual; need auto-detection from order items
2. **Order item → product → contour type mapping** — no automatic "this product needs a die-cut contour"
3. **PDF generation** — no print-ready PDF export (have SVG only)
4. **Production queue integration** — production board exists but doesn't consume contour/layout data
5. **Artwork file association** — order items have artwork uploads but no contour association

**Data fields needed:**
```
OrderItem {
  ...existing fields...
  contourJobId   → link to contour ToolJob
  printSheetId   → link to PrintSheet (when laid out)
  artworkStatus  → "pending" | "contoured" | "laid_out" | "print_ready"
}
```

### 5.4 Print-Ready File Assembly (`FUTURE`)

**What it does:** Combine artwork image + contour SVG + registration marks into final production file.

**What's missing:**
1. **PDF assembly library** — `pdf-lib` is installed but not used for print production
2. **Color profile management** — no ICC profile handling (CMYK conversion)
3. **Spot color layers** — cut line as spot color (CutContour / ThruCut)
4. **Overprint settings** — bleed area overprint handling
5. **File naming convention** — no standardized naming for production files

---

## 6. API Endpoints Reference

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/admin/tools/jobs` | GET | List jobs (query: toolType, limit, offset, status) |
| `/api/admin/tools/jobs` | POST | Create job |
| `/api/admin/proofs` | GET | List order proofs |
| `/api/admin/proofs/{id}` | PATCH | Update proof status |
| `/api/admin/orders/{orderId}/proofs` | POST | Upload proof to order |
| `/api/admin/workstation/summary` | GET | Dashboard summary |
| `/api/admin/workstation/notifications` | GET | System notifications |

---

## 7. File Upload Infrastructure

All tool output files use `uploadDesignSnapshot()` from `@/lib/design-studio/upload-snapshot`:
- Backend: UploadThing (hosted file storage)
- Returns: `{ url, key }` — URL is public, key is UploadThing file key
- Both stored in ToolJob records for retrieval

---

## 8. Mobile Compatibility Summary

| Tool | Mobile Status | Notes |
|---|---|---|
| Contour | Degraded | Bg removal skipped (OOM risk). Basic tracing works for PNG with alpha. Explicit can/cannot notice shown. Desktop recommended for full workflow. |
| Proof | Full | Upload + review + approve/reject all work on mobile. |
| Stamp | Full | StampEditor canvas renders fine on mobile. Touch interactions work. |
| Workstation | Full | Responsive grid layout, all actions accessible. |
| Tools Hub | Full | Card navigation, responsive. |

---

## 9. M7 Additions

### 9.1 Unified Production Readiness (`lib/admin/production-readiness.js`)
Shared helper used by order detail, workstation, and production board. Provides consistent "ready/needs-info/blocked/in-progress/done" assessment across all pages. See `docs/PRODUCTION-WORKFLOW-v1.md` for full documentation.

### 9.2 Tool ↔ Order Context Loop (M7-5)
Contour and Stamp Studio tools now read `orderId` from URL search params. When opened from an order (e.g., `?orderId=xxx`), they show an order context banner and pre-fill the order ID field. After saving, they show post-save guidance with a "View Order" link.

### 9.3 Package Completeness (M7-4)
`assessPackage(item)` and `assessOrderPackage(order)` evaluate which production files exist vs. which are needed for each item. Displayed in order detail as a per-item file checklist.

### 9.4 Caldera-lite Groundwork (M7-6)
- `lib/contour/registration-marks.js` — Crosshair generation, SVG wrapping, step-and-repeat placeholder
- `lib/production-manifest.js` — Structured manifest for downstream production tools
- `docs/PRODUCTION-WORKFLOW-v1.md` — Full documentation of production workflow architecture

---

## 10. Recommended Next Steps (Priority Order)

1. **Tool result writeback** — After contour/stamp save, auto-update OrderItem.meta
2. **Per-item tool context** — Pass itemId in tool URLs for multi-item orders
3. **Registration mark UI** — Add mark toggle to contour tool output
4. **Sheet size configuration** — Create `PrintSheet` model with standard sizes
5. **Real nesting algorithm** — Replace step-and-repeat with bin-packing solver
6. **PDF assembly** — Use `pdf-lib` to combine artwork + contour + marks into print-ready file
7. **Production queue integration** — Feed manifest data into production board workflow
