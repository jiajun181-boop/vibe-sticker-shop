# Redirect Cleanup Report — codex-url-mapping.ts

**Date**: 2026-02-25
**File**: `lib/redirects/codex-url-mapping.ts`
**Diff**: +44 / -129 lines (net -85 lines)

---

## Summary

Cleaned up `codex-url-mapping.ts` to remove **~99 `/shop/` source redirects** that were blocking real product detail pages. Only `/order/` legacy route redirects are retained. Additionally, **28 redirects** had their destinations improved to point to specific subcategories instead of the generic `/shop/stickers-labels-decals` listing page.

---

## What Changed

### 1. Removed: `/shop/` Source Redirects (~99 rules)

These redirects had `source: "/shop/category/child-product"` — the same paths used for actual product detail pages. They were intercepting real page loads and redirecting users away from products that now exist.

**Examples removed:**
| Source (blocked real page) | Was redirecting to |
|---|---|
| `/shop/banners-displays/double-sided-banners` | `/shop/banners-displays/vinyl-banners` |
| `/shop/marketing-business-print/booklets-perfect-bound` | `/shop/marketing-business-print/booklets` |
| `/shop/stickers-labels-decals/arc-flash-labels` | `/shop/stickers-labels-decals` |
| `/shop/vehicle-graphics-fleet/vehicle-graphics` | `/shop/vehicle-graphics-fleet/vehicle-wraps` |

**Categories affected:**
- Banners & Displays: 11 removed
- Marketing & Business Print: 40 removed
- Stickers & Labels: 44 removed
- Vehicle: 1 removed
- Canvas / Signs / Windows: 0 removed (had no `/shop/` source rules)

### 2. Improved: Redirect Destinations (28 rules)

Safety and facility product redirects previously landed on the generic `/shop/stickers-labels-decals` category page. Now they point to the correct subcategory for better UX and SEO.

**To `/shop/stickers-labels-decals/safety-warning-decals` (16 redirects):**
| Source | Old Destination |
|---|---|
| `/order/arc-flash-labels` | `/shop/stickers-labels-decals` |
| `/order/confined-space-warning-signs` | `/shop/stickers-labels-decals` |
| `/order/crane-lift-capacity-labels` | `/shop/stickers-labels-decals` |
| `/order/emergency-exit-egress-signs-set` | `/shop/stickers-labels-decals` |
| `/order/fire-extinguisher-location-stickers` | `/shop/stickers-labels-decals` |
| `/order/first-aid-location-stickers` | `/shop/stickers-labels-decals` |
| `/order/forklift-safety-decals` | `/shop/stickers-labels-decals` |
| `/order/hazard-ghs-labels` | `/shop/stickers-labels-decals` |
| `/order/high-voltage-warning-signs` | `/shop/stickers-labels-decals` |
| `/order/lockout-tagout-labels` | `/shop/stickers-labels-decals` |
| `/order/no-smoking-decals-set` | `/shop/stickers-labels-decals` |
| `/order/ppe-hard-hat-stickers` | `/shop/stickers-labels-decals` |
| `/order/ppe-required-signs` | `/shop/stickers-labels-decals` |
| `/order/safety-notice-decal-pack` | `/shop/stickers-labels-decals` |
| `/order/slip-trip-hazard-signs` | `/shop/stickers-labels-decals` |
| `/order/whmis-workplace-labels` | `/shop/stickers-labels-decals` |

**To `/shop/stickers-labels-decals/facility-asset-labels` (12 redirects):**
| Source | Old Destination |
|---|---|
| `/order/asset-tags-qr-barcode` | `/shop/stickers-labels-decals` |
| `/order/asset-tags-tamper-evident` | `/shop/stickers-labels-decals` |
| `/order/chemical-storage-labels` | `/shop/stickers-labels-decals` |
| `/order/dock-door-numbers` | `/shop/stickers-labels-decals` |
| `/order/equipment-rating-plates` | `/shop/stickers-labels-decals` |
| `/order/parking-lot-stencils` | `/shop/stickers-labels-decals` |
| `/order/pipe-markers-color-coded` | `/shop/stickers-labels-decals` |
| `/order/pipe-markers-custom` | `/shop/stickers-labels-decals` |
| `/order/rack-labels-warehouse` | `/shop/stickers-labels-decals` |
| `/order/tool-box-bin-labels` | `/shop/stickers-labels-decals` |
| `/order/valve-tags-engraved` | `/shop/stickers-labels-decals` |
| `/order/warehouse-zone-labels` | `/shop/stickers-labels-decals` |

### 3. Unchanged: `/order/` Legacy Redirects (207 kept)

All `/order/*` legacy route redirects are preserved — these handle traffic from the old ordering system URLs.

---

## Final Redirect Inventory

| File | Count | Purpose |
|---|---|---|
| `codex-url-mapping.ts` | **207** | `/order/*` legacy URLs to `/shop/*` |
| `seo-short-urls.ts` | **84** | SEO short paths (`/print/*`, `/banners/*`, etc.) |
| `category-reorg-v1.ts` | **74** | Old category structure to new |
| `synonym-redirects.ts` | **32** | Alternate names & plurals |
| **Total** | **397** | All permanent 301 redirects |

### codex-url-mapping.ts Breakdown by Category

| Category | Redirect Count |
|---|---|
| Banners & Displays | 14 |
| Canvas Prints | 7 |
| Marketing & Business Print | 62 |
| Signs & Rigid Boards | 12 |
| Stickers & Labels | 57 |
| Vehicle Graphics & Fleet | 46 |
| Windows, Walls & Floors | 9 |
| **Total** | **207** |

---

## Impact

- **Bug fix**: ~99 product detail pages that were previously unreachable (redirected away) are now accessible
- **SEO improvement**: 28 sticker/label redirects now land on correct subcategory pages instead of a generic listing
- **Maintenance**: File reduced from ~306 rules to 207 — easier to audit and maintain
- **No broken links**: All `/order/*` legacy URLs continue to redirect correctly
