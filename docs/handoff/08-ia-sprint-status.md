# Document 8: IA Phase 2 Sprint Status

> Last updated: 2026-03-13
> Status: **All 5 centers COMPLETE**

## What IA Phase 2 is

Restructure the admin backend so the five object-driven centers (Orders, Customers, Products, Tools, Settings) are deep structural contracts with canonical routes, shared view models, machine-readable helpers, and bidirectional navigation.

## All 5 Centers — COMPLETE

### 1. Orders Center ✅
- `ORDER_CENTER_VIEWS` — 7 canonical views (all, pending, missing_artwork, in_production, ready_to_ship, shipped, exceptions)
- `buildOrderCenterHref(viewId)` + `getOrderCenterView(viewId)`
- View strip with `badgeColor` from view model
- Shipping integration: `lib/admin/order-shipping.js` (carriers, tracking URLs, fulfillment state)
- ShipmentSummarySection on order detail page
- **23 tests** (`lib/admin-centers.test.ts`)
- **29 tests** (`lib/admin/order-shipping.test.ts`)

### 2. Customers Center ✅
- `CUSTOMER_CENTER_VIEWS` — 4 workspaces (hub, messages, support, b2b)
- `buildCustomerCenterHref`, `buildCustomerDetailHref(email)`, `buildCustomerWorkspaceHref`
- Deep page unification: all workspace pages link back to customer detail
- Support detail: 2-level breadcrumb
- **17 tests** (`lib/admin/customer-center.test.ts`)

### 3. Settings Center ✅
- `SETTINGS_CENTER_VIEWS` — 7 views (system, analytics_reports, finance, users_permissions, api_keys, logs, factories)
- Route-based views (each is a standalone page, unlike Orders' filtered views)
- `buildSettingsCenterHref(viewId)` + `getSettingsCenterView(viewId)`
- **24 tests** (`lib/admin/settings-center.test.ts`)

### 4. Products Center ✅
- `PRODUCT_CENTER_VIEWS` — 5 peer routes (hub, product-ops, materials, media, coupons)
- Deep workspace support: `getProductCenterDeep(viewId)` for nested pages
- `buildProductCenterHref(viewId)` + `getProductCenterView(viewId)`
- **24 tests** (`lib/admin/product-center.test.ts`)

### 5. Tools Center ✅
- `TOOLS_CENTER_VIEWS` — 5 views (hub, contour, proof, stamp-studio, unit-converter)
- `buildToolsCenterHref(viewId)` + `getToolsCenterView(viewId)`
- Cross-system contract tests (RBAC alignment, nav coverage)
- **18 tests** (`lib/admin/tools-center.test.ts`)

## Technical state

- **TypeScript**: Clean (`tsc --noEmit` zero errors)
- **Tests**: 1111+ passing
- **Total IA tests**: 135+ across all center contracts
- **All centers defined in**: `lib/admin-centers.js`

## Architecture patterns

### View model pattern
```js
export const X_CENTER_VIEWS = [
  { id: "viewId", labelKey: "admin.x.viewLabel", href: "/admin/..." },
];
```

### Helper pattern
```js
export function buildXCenterHref(viewId) { ... }
export function getXCenterView(viewId) { ... }
```

## Legacy route retirement (2026-03-13)

12 legacy `/admin/pricing-dashboard/*` routes → 301 redirects in `next.config.ts`.
Page files deleted, `PAGE_ACCESS_RULES` and nav `matches` cleaned.

## Remaining IA work

- **Role-specific content**: RBAC route guards exist but page content doesn't yet adapt per role (owner/sales/production/CS see same UI)
- **Admin regression**: Manual click-through of all admin flows needed (not just test coverage)
- **Data remediation**: Zero-cost materials, missing vendor costs, floor policy gaps
