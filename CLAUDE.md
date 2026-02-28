# Lunar Print (lunarprint.ca) — Claude Code Instructions

## About This Project
- Owner: Jay, solo founder of La Lunar Printing (Toronto Scarborough, since 2018)
- Jay is NOT a professional programmer — explain every change in detail
- This is a survival mission: the factory's future depends on this e-commerce site working correctly
- Website: lunarprint.ca, launched 2026-02-17, preparing for ad launch

## Work Principles (MUST follow)

1. **Plan before coding** — Always list what you'll change, why, and which files are affected. Wait for Jay's confirmation before making changes.
2. **Don't act on your own** — Don't merge products, don't add options that don't exist, don't "optimize" things Jay didn't ask to change.
3. **Each product gets its own page** — No shared configurators where users pick Card Type/Paper Type. Users click from category page and land directly on that product's configurator.
4. **Explain your reasoning** — Jay is learning. Explain why each change is made and how the architecture works.
5. **Flag related issues** — If you find a bug that might exist elsewhere, proactively mention it.
6. **Small steps** — Don't change too many files at once. Change one, verify, move on.
7. **Never touch pricing without permission** — Pricing changes = money lost if wrong. Always confirm with Jay first.
8. **Cost awareness** — Minimize unnecessary API calls, DB queries, Vercel function invocations.

## Tech Stack
- Next.js 16 (App Router) + Turbopack on Vercel
- Prisma 6.19.2 + Neon PostgreSQL (pooler endpoint)
- Stripe payments, UploadThing uploads
- Zustand state, TailwindCSS 4

## Critical Technical Rules
- Do NOT use `edge` runtime on routes with Prisma
- Do NOT create `middleware.ts` — Next.js 16 uses `proxy.ts`
- Do NOT use `@prisma/adapter-neon` or `driverAdapters`
- Stay on Prisma 6 (Prisma 7 has breaking changes)

## When Uncertain
- If unsure about a business decision, tell Jay to check with his Claude.ai chat session which has full business context
- If unsure about pricing, STOP and ask — never guess pricing numbers
