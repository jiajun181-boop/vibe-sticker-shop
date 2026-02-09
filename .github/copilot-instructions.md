<!-- Purpose: concise, actionable guidance for AI coding agents working on this repo -->
# Copilot instructions — Vibe Sticker Shop

Purpose: Help AI agents become productive quickly by describing the app architecture, runtime boundaries, developer workflows, and project-specific conventions.

- **Quick dev commands**: `npm run dev` (Next dev), `npm run build`, `npm run start`, `npm run lint`.
- **DB / seed**: DB is Postgres (`prisma/schema.prisma`). Seed data is in `prisma/seed.mjs` — run with `node prisma/seed.mjs` after applying migrations.

**Big picture**
- App built on Next.js App Router (`app/`) — most pages are server components (async functions that fetch from the DB). See `app/page.js` for an example query using `prisma`.
- API routes live under `app/api/` and follow Next's route handlers. Some routes run on the Edge runtime (e.g. `app/api/uploadthing/route.js` sets `export const runtime = 'edge'`).
- Data layer: `lib/prisma.js` exports a cached `prisma` client; `prisma/schema.prisma` contains core models (Product, ProductImage, Order, OrderItem, OrderFile, enums). JSON fields (e.g. `pricingConfig`, `acceptedFormats`) are used for flexible product options.
- Client state: cart is a persisted Zustand store in `lib/store.js`. UI components (e.g. `components/cart/CartDrawer.js`) use this store and post to `app/api/checkout/route.js`.

**Key flows & integration points (cite examples)**
- Product listing: server component queries `prisma.product.findMany({ include: { images: { take: 1, orderBy: { sortOrder: 'asc' } } } })` (see `app/page.js`).
- Checkout: `app/api/checkout/route.js` creates a draft `Order` in the DB, composes Stripe line items, creates a Stripe Checkout session and saves `stripeSessionId` on the order.
- Webhooks: `app/api/webhook/route.js` verifies Stripe signatures and updates `Order` status to `paid` on `checkout.session.completed`.
- File uploads: `app/api/uploadthing/core.js` defines `ourFileRouter` via `uploadthing/next` and `app/api/uploadthing/route.js` exposes the handler. `utils/uploadthing.js` exports a client-side `UploadButton` helper.

**Environment variables (observed / required)**
- `DATABASE_URL` — Postgres connection used by Prisma.
- `STRIPE_SECRET_KEY` — used by server-side checkout/webhook.
- `STRIPE_WEBHOOK_SECRET` — webhook signature verification.
- `NEXT_PUBLIC_SITE_URL` — used to construct success/cancel URLs for Stripe.

**Project-specific conventions & gotchas**
- Server vs client: pages under `app/` are server components by default; any client-area must include `use client`. When adding client code that uses browser-only APIs or Zustand, ensure `use client` is present.
- Prisma client caching: `lib/prisma.js` uses a global to avoid creating multiple PrismaClients in dev — import the exported `prisma` rather than constructing new clients.
- Pricing and product config live in JSON columns. See `prisma/seed.mjs` for concrete shapes (e.g. `acceptedFormats: ['ai','pdf']`). Match the same shape when writing migrations or seeds.
- Edge runtime: routes marked `runtime = 'edge'` must avoid Node-only packages (e.g. native `fs`, some Stripe features). Keep heavy Node-only logic in standard API routes or server components.
- Tax/shipping: tax is computed as 13% (HST) in both `lib/store.js` and `app/api/checkout/route.js` — keep changes consistent across these files.

**Files to inspect when making changes**
- UI: `components/`, `app/layout.js`, `app/page.js`
- Data & seed: `lib/prisma.js`, `prisma/schema.prisma`, `prisma/seed.mjs`
- APIs: `app/api/checkout/route.js`, `app/api/webhook/route.js`, `app/api/uploadthing/*`
- Client store: `lib/store.js` (Zustand persistence and shipping rules)

If you changed business logic (pricing, taxes, shipping) update both the client store (`lib/store.js`) and server checkout (`app/api/checkout/route.js`) and add a DB migration if models change.

If anything above is unclear or you'd like additional examples (e.g. typical code patches, unit testing approach, or a sample PR), tell me which area to expand.
