# Admin Production Tools — Engineering Foundation Document

> Last updated: 2026-03-09
> Status: v1 — current capabilities + gap analysis for future automation

---

## 1. Tool Inventory

### 1.1 Contour Tool (`/admin/tools/contour`)

**Purpose:** Generate die-cut SVG contour paths from sticker artwork images.

**Pipeline:**
1. Upload image (drag-drop or file picker, max 25 MB)
2. Detect alpha channel (sample 5000 pixels, >1% transparent = has alpha)
3. If no alpha: run `@imgly/background-removal` (ONNX/WASM, ~20 MB model download)
   - Skipped on mobile (OOM risk) — operator sees warning banner
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
| Order association | Optional (manual) | Required (order proofs) | Optional (manual) |
| Quality assessment | Yes (confidence grade) | N/A | N/A |
| Reopen previous job | Yes | No | Yes |
| Duplicate job | No | No | Yes |
| Mobile support | Degraded (no bg removal) | Full | Full (canvas works) |
| Error boundary | Yes (route-level) | Shared admin | Shared admin |
| i18n (en + zh) | Full | Full | Full |

---

## 3. Gap Analysis for Future Automation

### 3.1 Auto-Layout / Imposition (`FUTURE`)

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

### 3.2 Registration Marks (`FUTURE`)

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

### 3.3 Automated Order-to-Production Pipeline (`FUTURE`)

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

### 3.4 Print-Ready File Assembly (`FUTURE`)

**What it does:** Combine artwork image + contour SVG + registration marks into final production file.

**What's missing:**
1. **PDF assembly library** — `pdf-lib` is installed but not used for print production
2. **Color profile management** — no ICC profile handling (CMYK conversion)
3. **Spot color layers** — cut line as spot color (CutContour / ThruCut)
4. **Overprint settings** — bleed area overprint handling
5. **File naming convention** — no standardized naming for production files

---

## 4. API Endpoints Reference

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

## 5. File Upload Infrastructure

All tool output files use `uploadDesignSnapshot()` from `@/lib/design-studio/upload-snapshot`:
- Backend: UploadThing (hosted file storage)
- Returns: `{ url, key }` — URL is public, key is UploadThing file key
- Both stored in ToolJob records for retrieval

---

## 6. Mobile Compatibility Summary

| Tool | Mobile Status | Notes |
|---|---|---|
| Contour | Degraded | Bg removal skipped (OOM risk). Basic contour tracing works for PNG with alpha. Warning banner shown. |
| Proof | Full | Upload + review + approve/reject all work on mobile. |
| Stamp | Full | StampEditor canvas renders fine on mobile. Touch interactions work. |
| Workstation | Full | Responsive grid layout, all actions accessible. |
| Tools Hub | Full | Card navigation, responsive. |

---

## 7. Recommended Next Steps (Priority Order)

1. **Sheet size configuration** — Create `PrintSheet` model with standard sizes
2. **Order item → contour linking** — Add `contourJobId` to `OrderItem`
3. **Registration marks** — Add mark layer to SVG output in contour generator
4. **Auto-layout prototype** — Bin-packing algorithm for single-size stickers on standard sheet
5. **PDF assembly** — Use `pdf-lib` to combine artwork + contour + marks into print-ready file
6. **Production queue integration** — Feed assembled files into production board workflow
