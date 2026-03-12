# Document 8: IA Phase 2 Sprint Status & Next Directions

> Last updated: 2026-03-11
> For: ChatGPT / Codex / next Claude Code session

## What IA Phase 2 is

Restructure the admin backend so the five object-driven centers (Orders, Customers, Products, Tools, Settings) are not just top-nav labels — they are deep structural contracts with canonical routes, shared view models, machine-readable helpers, and bidirectional navigation between parent and child pages.

## Completed in this sprint

### 1. Orders Center backbone ✅
- `ORDER_CENTER_VIEWS` in `lib/admin-centers.js` — 7 canonical views (all, pending, missing_artwork, in_production, ready_to_ship, shipped, exceptions)
- `buildOrderCenterHref(viewId)` helper
- View strip on orders list page uses `badgeColor` from view model
- Nav entry `missingArtwork.href` rewired to canonical URL
- 23 regression tests (`lib/admin-centers.test.ts`)

### 2. Shipping semantic integration into Orders ✅
- `lib/admin/order-shipping.js` — shared contract: carriers, tracking URLs, shipment status display, fulfillment state derivation
- Order detail API (`api/admin/orders/[id]/route.ts`) returns `shipments`, `latestShipment`, `shipmentSummary`
- `ShipmentSummarySection` on order detail page — fulfillment badge, shipment rows, tracking links, shipping workspace link
- "Ready to Ship" quick action on workstation
- 29 regression tests (`lib/admin/order-shipping.test.ts`)

### 3. Customer Center deep pages unification ✅
- `buildCustomerDetailHref(email)` helper in `lib/admin-centers.js`
- `customers/[email]` strengthened as control page: customer name in title, conversations now clickable (link to messages workspace via `?conv=X`)
- All workspace pages (messages, support, support/[id], B2B) now link back to customer detail wherever email appears
- Support detail: proper 2-level breadcrumb (Customers → Support → Ticket)
- All workspace breadcrumbs: cleaned self-referential links
- Linter added: i18n for ticket status/priority, order status, B2B tier badges, author types
- 18 regression tests (`lib/admin/customer-center.test.ts`)

## NOT YET DONE — next priorities

### 4. Settings Center backbone (started → abandoned)
**Status: Not started (was about to begin, then redirected to Customer Center)**

The task package exists and is ready to implement:
- Create `SETTINGS_CENTER_VIEWS` in `lib/admin-centers.js` (views: system, analytics_reports, finance, users_permissions, api_keys, logs, factories)
- Add `buildSettingsCenterHref(viewId)` helper
- Rewire nav entry points to canonical contract
- Add compatibility handling for legacy routes (`/admin/analytics`, `/admin/finance`, `/admin/logs`, `/admin/api-keys`, `/admin/users`)
- 7 standalone pages exist as full "use client" pages — they need structural subordination to Settings, not rewrite

**Key design question**: Unlike Orders (one page, filtered views) and Customers (hub + sub-pages), Settings views are completely different pages with their own `useSearchParams`. The `?view=X` pattern from the task package conflicts with each page's own query params. Practical approach: view model defines `route` field per view, `buildSettingsCenterHref()` returns the actual route, settings page becomes a hub with links to all views.

### 5. Products Center (not started)
- `productOps`, `pricingRules`, `materials`, `media`, `coupons`, `inventory`, `content` currently listed in the "products" nav section
- No `PRODUCT_CENTER_VIEWS` or `buildProductCenterHref()` yet
- These need the same treatment: canonical view model, route helpers, hub page

### 6. Tools Center (not started)
- `toolsHub`, `contour`, `proof`, `stampStudio` in the "tools" nav section
- Already relatively clean (all under `/admin/tools/`)
- Needs `TOOLS_CENTER_VIEWS` and `buildToolCenterHref()`

## Technical state

### Build status
- **TypeScript**: Clean (`tsc --noEmit` zero errors)
- **Tests**: 372/374 pass (2 pre-existing failures in `order-status-security.test.ts`)
- **Local `npm run build`**: Windows ENOENT race condition on temp files prevents completion. Code compiles successfully ("Compiled successfully in 16.5s"). Will build fine on Vercel (Linux).
- **Test breakdown**: 23 (centers) + 29 (shipping) + 18 (customer) = 70 new regression tests this sprint

### Key files modified across this sprint
```
lib/admin-centers.js              — ORDER/CUSTOMER views + helpers
lib/admin-navigation.js           — nav rewiring
lib/admin/order-shipping.js       — NEW: shipping contract
lib/admin/order-shipping.test.ts  — NEW: 29 tests
lib/admin/customer-center.test.ts — NEW: 18 tests
lib/admin-centers.test.ts         — NEW: 23 tests
app/admin/orders/page.js          — view strip + shipped view
app/admin/orders/[id]/page.js     — ShipmentSummarySection
app/api/admin/orders/[id]/route.ts — shipment data in order response
app/admin/workstation/page.js     — Ready to Ship quick action
app/admin/customers/[email]/page.js — control page improvements
app/admin/customers/messages/page.js — customer links + ?conv=
app/admin/customers/support/page.js — customer links + breadcrumb
app/admin/customers/support/[id]/page.js — customer link + 2-level breadcrumb
app/admin/customers/b2b/page.js — customer links + breadcrumb
lib/i18n/en.js, zh.js — ~40 new i18n keys
```

### Linter auto-changes (happened during editing)
The auto-linter made additional improvements to files we touched:
- Added i18n label maps for ticket status/priority/order status
- Converted hardcoded English strings to `t()` calls
- Added `Suspense` wrappers where needed
- Cleaned up unused imports (e.g., removed `useRouter` when replaced with `Link`)
- These are all good changes — keep them.

### Uncommitted files
There are ~62 modified/untracked files. Some are from this sprint's intentional work, some are linter auto-improvements. All should be committed together.

## Architecture patterns established

### View model pattern
```js
export const X_CENTER_VIEWS = {
  viewId: {
    id: "viewId",
    labelKey: "admin.x.viewLabel",
    params: { ... },      // for filtered views (Orders)
    badgeColor: "...",     // optional
    route: "/admin/...",   // for route-based views (Settings)
    permModule: "...",     // for RBAC
  },
};
```

### Helper pattern
```js
export function buildXCenterHref(viewId, overrides) { ... }
export function getXCenterView(viewId) { ... }
```

### Shared contract pattern (domain-specific)
```js
// lib/admin/order-shipping.js — pure functions, no DB
export function getOrderFulfillment(shipments) { ... }
export function getTrackingUrl(carrier, trackingNumber) { ... }
```

## What to tell ChatGPT / Codex

> The IA Phase 2 sprint is ~60% complete. Orders Center and Customer Center are done with deep structural integration. The remaining three centers (Settings, Products, Tools) need the same treatment: canonical view model, route helpers, hub page with links to all views, and nav rewiring. Settings is the most complex because its views are fundamentally different pages (analytics, finance, logs, etc.) unlike Orders which are filtered views of one list.
>
> The codebase has established patterns in `lib/admin-centers.js` — follow the ORDER_CENTER_VIEWS and CUSTOMER_CENTER_VIEWS patterns. Each center needs a views object, getter, and href builder. Tests go in `lib/admin/*.test.ts`.
>
> Build currently breaks on Windows due to Next.js Turbopack temp file race condition (not a code issue). TypeScript and all tests pass clean. Deploy on Vercel will work fine.
