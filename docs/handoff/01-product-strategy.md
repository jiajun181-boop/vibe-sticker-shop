# Document 1: Product Strategy — lunarprint.ca

## 1. Project Positioning

**lunarprint.ca is a web-to-print e-commerce platform** — not a brochure site, not a WordPress blog with a contact form. It is a fully automated online ordering system for a real printing factory (La Lunar Printing Inc., Toronto Scarborough, operating since 2018).

The platform combines:
- **Instant online pricing** (no "call for a quote" — customers see prices immediately)
- **Product configurators** (customers select size, material, quantity, finishing — just like ordering on Vistaprint or StickerMule)
- **File upload + preflight** (artwork validation: DPI, format, size checks)
- **Stripe + Interac payments** (dual payment for Canadian market)
- **Production management** (admin tools for contour extraction, proof approval, stamp design)
- **ERP-lite backend** (orders, invoicing, production jobs, quality control, finance)

### What problem does it solve?

Jay's factory has been doing B2B traditional printing since 2018 — large orders from agencies and businesses. But the B2B market is shrinking. The factory needs to reach **retail customers directly** through e-commerce, while also serving B2B/wholesale customers with self-service ordering.

Before this website:
- Every quote required manual calculation (phone/email/WeChat)
- No online presence = zero organic customer acquisition
- Competing factories are all on Alibaba/Amazon/Vistaprint — Jay's factory is invisible
- Revenue depends entirely on a small number of B2B clients

After this website:
- Customers find products via Google → see instant pricing → configure → upload artwork → pay → done
- Jay only needs to handle production, not sales/quoting
- The system scales: 1 customer or 1000 customers, same amount of Jay's time

### Customer segments

| Segment | Description | What they want | Revenue share goal |
|---------|-------------|----------------|-------------------|
| **Local retail** | Small businesses, individuals in GTA | Custom stickers, business cards, signs for their shop | 40% |
| **Small business** | 5-50 employee companies | Marketing materials, vehicle graphics, trade show banners | 30% |
| **B2B / Trade** | Print brokers, agencies, designers | Wholesale pricing, bulk orders, white-label | 20% |
| **Walk-in** | People who visit the factory | Stamps, quick prints, same-day signs | 10% |

### Goals by timeframe

**Short-term (Q1 2026 — NOW):**
- Launch Google Ads → drive traffic to product pages
- Convert visitors to orders (target: 2-3% conversion rate)
- Build Google Reviews (target: 50+ reviews)
- Handle 10-20 online orders/week

**Mid-term (Q2-Q3 2026):**
- 50+ orders/week from organic + paid traffic
- B2B portal with wholesale pricing (partner tiers: bronze/silver/gold/platinum)
- Automated proof approval flow (customer uploads → auto proof → approve → production)
- Reduce manual quoting by 80%

**Long-term (2027+):**
- Toronto's #1 online print shop for custom stickers and signage
- 200+ orders/week
- Fully automated: order → preflight → production queue → shipping
- API for trade customers (B2B bulk API already started: `/api/v1/`)
- Potential expansion to other Canadian cities

---

## 2. Business Goals

### Primary KPIs

| Metric | Current | Target (6 months) |
|--------|---------|-------------------|
| Weekly online orders | ~0 (pre-launch) | 50+ |
| Average order value | — | $120 CAD |
| Conversion rate | — | 2-3% |
| Manual quoting time | 100% manual | <20% manual |
| Google Reviews | 6 reviews | 50+ reviews |
| Monthly revenue (online) | $0 | $25,000+ CAD |

### How the website drives business growth

1. **Automated pricing = no quoting bottleneck.** The pricing engine handles 200+ products with real-time cost calculation. Jay doesn't need to calculate quotes manually.

2. **24/7 ordering.** Customers can order at 2 AM. No phone tag, no WeChat back-and-forth.

3. **Higher conversion through transparency.** Showing instant pricing, delivery estimates, and volume discounts removes friction. "From $X.XX" on category pages → click → configure → see exact price → add to cart.

4. **Upsell and cross-sell automation.** The system recommends related products (business cards → stickers, signs → stands). CartUpsell shows complementary items at checkout.

5. **Customer retention.** Account system with saved addresses, order templates (reorder with one click), referral codes (LUNAR-XXXXXX), and abandoned cart recovery emails.

6. **B2B self-service.** Trade customers get partner pricing (bronze/silver/gold/platinum tiers with % discounts) without needing to call for quotes.

### Why this is core infrastructure, not a marketing website

This is not a WordPress site with a contact form. This is **the factory's order processing system**. It replaces:
- Manual quoting (phone/email/WeChat → now automated pricing API)
- Manual order entry (handwritten forms → now Stripe checkout + Prisma DB)
- Manual production tracking (whiteboard → now production board + job assignments)
- Manual proof approval (email PDF back and forth → now proof upload + customer approval UI)
- Manual invoicing (Excel → now automated invoice generation)

If this website goes down, the factory cannot process new orders. It is mission-critical infrastructure.

---

## 3. Brand & User Experience Philosophy

### Brand identity

**Feeling:** Professional, trustworthy, modern, efficient. Like ordering from a real manufacturer — not a generic print broker.

**Tone:** Knowledgeable but approachable. "We're real printers with real equipment. We know materials. We'll help you get it right."

**Visual:** Clean, minimal, black/white with strategic color accents. No stock photos of happy businesspeople. Show real products, real materials, real process.

**Trust signals:**
- "Since 2018" — not a fly-by-night operation
- Google Reviews (6 real reviews, prominently displayed)
- SSL + payment badges on checkout
- Clear refund/return policy
- Production timeline transparency (order → proof → production → ship)

### Mobile-first principles

- 70%+ traffic expected from mobile (Google Ads → phone)
- Every configurator has `MobileBottomBar` (sticky price + add-to-cart at bottom of screen)
- Touch targets minimum 40px (verified in audit)
- Category pages have swipeable filter tabs
- Navbar has visible "Get a Quote" button on mobile

### Why customers choose us over generic print shops

1. **Instant pricing** — no waiting for quotes
2. **Real factory, not a broker** — we own the printers, cutters, and laminators
3. **Local** — same-day pickup available in Scarborough
4. **Transparent process** — see exactly where your order is
5. **Bilingual** — full English + Chinese support (important for GTA demographics)

---

## 4. User Types & Scenarios

### Scenario 1: "I need 500 die-cut stickers for my Etsy shop"
- **User:** Hannah, 28, runs a sticker business on Etsy
- **Entry:** Google search "custom die cut stickers Toronto"
- **Path:** Landing page → Stickers category → Die-cut configurator → Select 2"×2" white vinyl, qty 500 → See price $135 → Upload artwork → Checkout with Stripe
- **Key concern:** Price per unit, turnaround time, material quality
- **Decision factor:** Seeing "$0.27/each" prominently displayed

### Scenario 2: "I need business cards for my new restaurant"
- **User:** Marco, 45, opening a restaurant
- **Entry:** Google Ads "cheap business cards Toronto"
- **Path:** Business cards category → Pick "Gloss" variant → 250 qty, double-sided → Upload logo → Checkout
- **Key concern:** How it looks, quick delivery, not too expensive
- **Decision factor:** Preview mockup, 3-day production + 2-5 day shipping estimate

### Scenario 3: "I need 100 yard signs for my real estate team"
- **User:** Sarah, 38, real estate team lead
- **Entry:** Direct URL or Google "custom yard signs bulk"
- **Path:** Signs category → Yard signs → Coroplast 4mm, 18×24, qty 100, double-sided → Add H-stakes → Upload design → Checkout
- **Key concern:** Bulk pricing, durability, accessories (stakes)
- **Decision factor:** Volume discount badge showing "Save 40% vs qty 1"

### Scenario 4: "Walk-in customer wants a custom stamp"
- **User:** Customer walks into the factory
- **Entry:** Jay opens Stamp Studio admin tool
- **Path:** Pick preset → Customize text → Show preview to customer → Customer approves → Download production file → Make stamp
- **Key concern:** See it before committing, quick turnaround
- **Decision factor:** Instant visual preview on screen

### Scenario 5: "B2B partner needs 10,000 stickers/month"
- **User:** Mike, print broker
- **Entry:** Partner signup → B2B approval → Login
- **Path:** Browse products → See wholesale pricing (partner tier discount) → Bulk order → Saved template for monthly reorder
- **Key concern:** Margin, consistency, reliability
- **Decision factor:** Partner discount %, reorder templates, API access

---

## 12. Development Priority (Top 10)

| # | Feature | Type | Impact |
|---|---------|------|--------|
| 1 | Google Ads landing pages optimized | MVP | Revenue |
| 2 | Real product photos (28 products still using placeholders) | Conversion | +15-20% conversion |
| 3 | Automated proof approval flow | Automation | -50% manual work |
| 4 | B2B wholesale portal (partner pricing) | Revenue | New segment |
| 5 | Order status email notifications (shipped, delivered) | Retention | Customer satisfaction |
| 6 | Category hero images (currently gradient backgrounds) | Conversion | Professional look |
| 7 | Production board improvements (Kanban view) | Efficiency | Internal ops |
| 8 | Customer file management (reuse previous artwork) | Retention | Repeat orders |
| 9 | Review collection automation (post-delivery email) | Trust | SEO + conversion |
| 10 | Design editor improvements (Fabric.js templates) | Conversion | Self-service design |

---

## 14. One-sentence summary

**lunarprint.ca is a full-stack web-to-print e-commerce platform that turns a traditional Toronto printing factory into a 24/7 automated online print shop — from instant pricing and customer self-service ordering to production management and B2B wholesale — built to compete with Vistaprint and StickerMule at local scale.**
