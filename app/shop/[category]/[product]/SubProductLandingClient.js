"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { getTurnaround, turnaroundI18nKey, turnaroundColor } from "@/lib/turnaroundConfig";
import Breadcrumbs from "@/components/Breadcrumbs";
import QuickAddButton from "@/components/product/QuickAddButton";
import { useSearchParams } from "next/navigation";
import { getProductImage, isSvgImage } from "@/lib/product-image";
import StampCardPreview from "@/components/product/stamp/StampCardPreview";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
    cents / 100
  );
const safeText = (value, fallback) =>
  typeof value === "string" && value.trim() ? value : fallback;

// Cross-sell recommendations: if viewing sub-group X, suggest Y
const CROSS_SELL_MAP = {
  // Banners & Displays
  "retractable-stands": ["vinyl-banners", "tabletop-displays"],
  "x-banner-stands": ["retractable-stands", "vinyl-banners"],
  "tabletop-displays": ["retractable-stands", "x-banner-stands"],
  "backdrops-popups": ["retractable-stands", "fabric-banners"],
  "vinyl-banners": ["retractable-stands", "mesh-banners"],
  "mesh-banners": ["vinyl-banners", "pole-banners"],
  "pole-banners": ["vinyl-banners", "flags-hardware"],
  "flags-hardware": ["vinyl-banners", "tents-outdoor"],
  "a-frames-signs": ["vinyl-banners", "lawn-yard-signs"],
  "lawn-yard-signs": ["a-frames-signs", "vinyl-banners"],
  "tents-outdoor": ["vinyl-banners", "flags-hardware"],
  "fabric-banners": ["backdrops-popups", "retractable-stands"],
  "canvas-prints": ["retractable-stands", "fabric-banners"],
  // Marketing & Business Print
  "business-cards": ["flyers", "postcards"],
  "flyers": ["business-cards", "postcards"],
  "postcards": ["flyers", "business-cards"],
  "brochures": ["flyers", "booklets"],
  "booklets": ["flyers", "brochures"],
  "posters": ["flyers", "vinyl-banners"],
  "letterhead": ["business-cards", "envelopes"],
  "envelopes": ["letterhead", "business-cards"],
  "menus": ["table-tents", "rack-cards"],
  "table-tents": ["menus", "shelf-displays"],
  "rack-cards": ["flyers", "door-hangers"],
  "door-hangers": ["flyers", "rack-cards"],
  "greeting-invitation-cards": ["postcards", "envelopes"],
  "bookmarks": ["business-cards", "postcards"],
  "notepads": ["letterhead", "business-cards"],
  "ncr-forms": ["notepads", "letterhead"],
  "tickets-coupons": ["business-cards", "loyalty-cards"],
  "loyalty-cards": ["business-cards", "rack-cards"],
  "stamps": ["notepads", "letterhead"],
  "calendars": ["notepads", "posters"],
  "certificates": ["letterhead", "envelopes"],
  "tags": ["business-cards", "loyalty-cards"],
  "shelf-displays": ["table-tents", "rack-cards"],
  "document-printing": ["ncr-forms", "notepads"],
  // Stickers
  "die-cut-stickers": ["sticker-pages", "sticker-rolls"],
  "sticker-pages": ["die-cut-stickers", "sticker-rolls"],
  "sticker-rolls": ["die-cut-stickers", "sticker-pages"],
  "vinyl-lettering": ["vehicle-decals", "die-cut-stickers"],
  "safety-warning-decals": ["facility-asset-labels", "die-cut-stickers"],
  "facility-asset-labels": ["safety-warning-decals", "sticker-rolls"],
  // Vehicles
  "vehicle-wraps": ["vehicle-decals", "door-panel-graphics"],
  "door-panel-graphics": ["vehicle-wraps", "magnetic-signs"],
  "vehicle-decals": ["vehicle-wraps", "vinyl-lettering"],
  "magnetic-signs": ["vehicle-decals", "door-panel-graphics"],
};

// Sub-product page content — description + FAQ per group
const SUB_PRODUCT_CONTENT = {
  // Marketing & Business Print
  "business-cards": {
    desc: "Premium business cards printed on thick card stock with a range of finishes. Choose from classic matte, glossy UV, soft-touch laminate, gold foil, linen, and more. All cards are full-color, double-sided, and cut to standard 3.5\u2033 \u00d7 2\u2033 or custom sizes.",
    features: ["14pt–32pt card stock", "Matte, Gloss, Soft-Touch, Linen", "Gold/Silver foil stamping", "Rounded corners available", "Same-day rush option"],
    faq: [
      { q: "What paper stock is used?", a: "Standard cards use 14pt C2S card stock. Premium options include 16pt, 18pt, and 32pt ultra-thick with optional painted edges." },
      { q: "Can I get a sample?", a: "Yes \u2014 we offer a free sample pack with all paper stocks and finishes. Request one from the product page or contact us." },
    ],
  },
  "flyers": {
    desc: "Full-color flyers on premium paper, available in a range of sizes from half-page to tabloid. Ideal for events, promotions, real estate, and mass distribution.",
    features: ["100lb Gloss or Matte text", "Single or double-sided", "Standard & custom sizes", "Folding options available", "Bulk discounts from 250+"],
    faq: [
      { q: "What sizes are available?", a: "Standard sizes include 8.5\u2033\u00d711\u2033 (letter), 5.5\u2033\u00d78.5\u2033 (half page), and 11\u2033\u00d717\u2033 (tabloid). Custom sizes are also available." },
      { q: "Can flyers be folded?", a: "Yes \u2014 half-fold, tri-fold, and Z-fold options are available at no extra charge for orders of 500+." },
    ],
  },
  "postcards": {
    desc: "Thick, full-bleed postcards for direct mail, promotions, and event invitations. Printed on 14pt card stock with UV gloss or matte finish.",
    features: ["14pt card stock standard", "UV coating one or both sides", "USPS/Canada Post compliant", "4\u2033\u00d76\u2033 to 6\u2033\u00d711\u2033 sizes", "Mailing services available"],
    faq: [
      { q: "Are postcards mail-ready?", a: "Yes \u2014 all postcards meet Canada Post and USPS specifications. We can add address areas and indicia for direct mail." },
    ],
  },
  "brochures": {
    desc: "Professional brochures with bi-fold, tri-fold, and Z-fold options. Printed on premium gloss or matte paper with sharp, vibrant color reproduction.",
    features: ["100lb Gloss or Matte text", "Bi-fold, Tri-fold, Z-fold", "Full-bleed printing", "Scoring for clean folds", "Die-cut options available"],
    faq: [
      { q: "What\u2019s the difference between bi-fold and tri-fold?", a: "Bi-fold creates 4 panels (folded in half). Tri-fold creates 6 panels and is the most popular for marketing materials." },
    ],
  },
  "booklets": {
    desc: "Perfect for catalogs, programs, manuals, and lookbooks. Choose saddle-stitch (stapled), perfect-bound (glued spine), or wire-o binding for a professional finish.",
    features: ["Saddle-stitch, Perfect-bound, Wire-O", "8 to 400+ pages", "Full-color throughout", "Gloss or matte cover", "Custom sizes available"],
    faq: [
      { q: "What binding is best for my project?", a: "Saddle-stitch (stapled) is best for 8\u201364 pages. Perfect-bound gives a book-like spine for 24\u2013400+ pages. Wire-O lays flat and is ideal for planners and manuals." },
      { q: "What\u2019s the minimum page count?", a: "Saddle-stitch requires a minimum of 8 pages (2 sheets). Perfect-bound requires at least 24 pages for a visible spine." },
    ],
  },
  "posters": {
    desc: "Vibrant, large-format posters on glossy, matte, or adhesive stock. Perfect for retail displays, event promotion, movie posters, and wall art.",
    features: ["Glossy, Matte, Adhesive, Backlit", "Sizes from 11\u2033\u00d717\u2033 to 48\u2033\u00d796\u2033", "Indoor and outdoor options", "Epson original ink, custom ICC profile", "Same-day available for small orders"],
    faq: [
      { q: "What\u2019s the difference between glossy and matte posters?", a: "Glossy posters have a shiny, vibrant finish ideal for photos and retail. Matte posters reduce glare and are preferred for text-heavy designs and galleries." },
    ],
  },
  "menus": {
    desc: "Durable restaurant menus with lamination for spill resistance. Available as flat menus, tri-fold, or takeout formats with premium paper options.",
    features: ["Laminated for durability", "Flat, folded, or takeout size", "Full-color, double-sided", "Water & grease resistant", "Rush turnaround available"],
    faq: [
      { q: "How durable are laminated menus?", a: "Our laminated menus are sealed in 10mil pouches and resist water, grease, and tearing. They typically last 6\u201312 months of daily restaurant use." },
    ],
  },
  "door-hangers": {
    desc: "Die-cut door hangers for real estate, hotel, and marketing campaigns. Printed on thick card stock with an optional tear-off perforated section.",
    features: ["14pt card stock", "Standard die-cut hook", "Perforated tear-off option", "Full-color, double-sided", "3.5\u2033\u00d78.5\u2033 standard"],
    faq: [
      { q: "What\u2019s the perforated option?", a: "The perforated door hanger has a tear-off coupon or business card at the bottom, perfect for leaving behind a redeemable offer." },
    ],
  },
  "greeting-invitation-cards": {
    desc: "Custom greeting cards and invitations for weddings, holidays, corporate events, and special occasions. Printed on premium card stock with envelope options.",
    features: ["Premium card stock", "Flat or folded styles", "Matching envelopes included", "Foil stamping available", "Custom sizes and shapes"],
    faq: [
      { q: "Do invitations come with envelopes?", a: "Yes \u2014 standard white envelopes are included. Upgrade to colored, textured, or lined envelopes for an additional fee." },
    ],
  },
  // Banners & Displays
  "vinyl-banners": {
    desc: "Heavy-duty vinyl banners for indoor and outdoor use. Printed on 13oz or 18oz scrim vinyl with UV-resistant inks for long-lasting color.",
    features: ["13oz & 18oz vinyl options", "Hemmed edges & grommets", "UV & weather resistant", "Single or double-sided", "Custom sizes up to 50ft"],
    faq: [
      { q: "How long do vinyl banners last outdoors?", a: "Standard 13oz vinyl banners last 2\u20133 years outdoors. Our 18oz heavy-duty option lasts 3\u20135 years. Both use UV-resistant inks." },
    ],
  },
  "retractable-stands": {
    desc: "Portable retractable banner stands that set up in seconds. Professional display solution for trade shows, lobbies, and events.",
    features: ["Sets up in 30 seconds", "Aluminum construction", "Includes carry bag", "Replaceable graphics", "33\u2033 and 47\u2033 widths"],
    faq: [
      { q: "Can I replace the banner graphic later?", a: "Yes \u2014 all our retractable stands accept replacement graphics. Just order a new print and swap it in." },
    ],
  },
  "flags-hardware": {
    desc: "Eye-catching feather flags, teardrop flags, and flutter flags with heavy-duty hardware kits. Perfect for storefronts, car lots, and events.",
    features: ["Feather, teardrop, & flutter styles", "Single or double-sided print", "Ground stake & cross base options", "Water bag for indoor use", "8ft to 17ft tall"],
    faq: [
      { q: "What base should I use?", a: "Ground stakes for soft ground (grass, dirt). Cross base with water bag for indoor or hard surfaces. Both are included in hardware kits." },
    ],
  },
  "backdrops-popups": {
    desc: "Large-format backdrops and popup displays for events, trade shows, photo walls, and press conferences. Step-and-repeat and tension fabric options.",
    features: ["8ft \u00d7 8ft to 10ft \u00d7 20ft", "Wrinkle-free fabric", "Step-and-repeat layouts", "Easy setup frames", "Reusable hardware"],
    faq: [
      { q: "What\u2019s the difference between a popup display and a backdrop?", a: "Popup displays use a collapsible frame with magnetic panels for a curved or straight wall. Backdrops are tension fabric banners stretched over a frame \u2014 lighter and easier to transport." },
      { q: "Can I reuse the hardware with a new graphic?", a: "Yes \u2014 all our popup and backdrop frames accept replacement graphics. Order just the printed panel for your next event." },
      { q: "How long does setup take?", a: "Popup displays set up in 5\u201310 minutes with no tools. Tension fabric backdrops take 2\u20135 minutes \u2014 just stretch the fabric over the frame." },
    ],
  },
  "x-banner-stands": {
    desc: "Budget-friendly X-banner stands for indoor displays. Lightweight, portable, and easy to assemble \u2014 great for offices and events.",
    features: ["Lightweight tripod frame", "No tools needed", "24\u2033 \u00d7 63\u2033 standard", "Includes carry bag", "Indoor use recommended"],
    faq: [
      { q: "Are X-banner stands suitable for outdoor use?", a: "X-banner stands are designed for indoor use only. For outdoor displays, we recommend retractable banner stands or feather flags." },
      { q: "Can I replace the banner graphic?", a: "Yes \u2014 X-banner stands use grommets or loops to hold the print. Order a replacement graphic and swap it onto the same frame." },
      { q: "How tall is an X-banner stand?", a: "Standard X-banner stands are 24\u2033 \u00d7 63\u2033 (about 5 feet tall). Tabletop models are also available at 10\u2033 \u00d7 15\u2033." },
    ],
  },
  "tabletop-displays": {
    desc: "Compact countertop and tabletop displays for reception areas, trade shows, and retail counters. Professional presentation in a small footprint.",
    features: ["Retractable & easel styles", "8\u2033 \u00d7 12\u2033 to 24\u2033 \u00d7 36\u2033", "Portable & lightweight", "Includes carrying case", "Easy graphic swap"],
    faq: [
      { q: "What types of tabletop displays are available?", a: "We offer tabletop retractable banners (mini pull-ups), rigid tabletop signs with easel backs, and foam board or PVC displays with standoff mounts." },
      { q: "Are tabletop displays portable?", a: "Yes \u2014 all tabletop displays are lightweight and come with carrying cases. Retractable models fold down to under 2ft for easy transport." },
      { q: "Can I use these at trade shows?", a: "Absolutely \u2014 tabletop displays are perfect for trade show tables, conference desks, and reception counters. They set up in seconds." },
    ],
  },
  "tents-outdoor": {
    desc: "Custom printed canopy tents for outdoor events, farmers markets, and promotions. Full-color printing on durable polyester with steel or aluminum frames.",
    features: ["10\u2032 \u00d7 10\u2032 standard", "Full-color dye-sub print", "Steel & aluminum frames", "Side walls available", "Includes carry bag"],
    faq: [
      { q: "What sizes of tents are available?", a: "Standard is 10\u2032 \u00d7 10\u2032. We also offer 10\u2032 \u00d7 15\u2032 and 10\u2032 \u00d7 20\u2032. Custom sizes available on request." },
      { q: "Are side walls included?", a: "Side walls are sold separately. Choose from full walls, half walls, or walls with windows/doors. They attach with Velcro strips." },
      { q: "How wind-resistant are the tents?", a: "Our aluminum frames handle moderate wind. For windy conditions, use the included guy ropes and stakes. We also sell weighted sand bags for hard surfaces." },
    ],
  },
  // Stickers
  "die-cut-stickers": {
    desc: "Custom die-cut stickers cut to any shape. Printed on premium vinyl with laminate protection for indoor and outdoor use.",
    features: ["Cut to any shape", "Vinyl or paper stock", "Waterproof laminate", "Indoor/outdoor durable", "Singles or bulk packs"],
    faq: [
      { q: "How long do die-cut stickers last?", a: "Our vinyl stickers with laminate last 3\u20135 years outdoors and 7+ years indoors. Paper stickers are best for indoor use only." },
    ],
  },
  "sticker-pages": {
    desc: "Multiple stickers printed on sheets \u2014 perfect for sticker packs, product labels, and packaging inserts. Kiss-cut for easy peel.",
    features: ["Multiple designs per sheet", "Kiss-cut for easy peel", "Vinyl or paper stock", "Custom sheet layouts", "Bulk pricing available"],
    faq: [
      { q: "How many stickers fit on one sheet?", a: "It depends on sticker size. A standard 8.5\u2033\u00d711\u2033 sheet can fit 2\u201330+ stickers depending on dimensions. We\u2019ll optimize the layout for you." },
      { q: "Can I mix different designs on one sheet?", a: "Yes \u2014 our sticker sheets support multiple unique designs per sheet. Upload all your designs and we\u2019ll arrange them." },
      { q: "What\u2019s the difference between kiss-cut and die-cut sheets?", a: "Kiss-cut sheets cut through the sticker layer only, leaving the backing intact for easy peel. Die-cut cuts through everything, giving you individual stickers." },
    ],
  },
  "sticker-rolls": {
    desc: "Custom labels on rolls for product packaging, branding, and retail. Compatible with standard label dispensers and applicators.",
    features: ["Roll sizes from 250 to 10,000+", "BOPP, vinyl, kraft, clear", "Compatible with dispensers", "Waterproof & oil-resistant options", "Sequential numbering available"],
    faq: [
      { q: "What is the minimum order for roll labels?", a: "Minimum order is 250 labels per design. For the best per-unit price, we recommend quantities of 1,000+." },
      { q: "Are roll labels compatible with label applicators?", a: "Yes \u2014 our roll labels use standard 3\u2033 cores and are wound for use with manual and automatic label applicators and dispensers." },
      { q: "What materials are available for roll labels?", a: "White BOPP (waterproof), clear BOPP, kraft paper, white vinyl, and freezer-grade vinyl. All materials are compatible with inkjet and thermal printers." },
    ],
  },
  // Vehicles
  "vehicle-wraps": {
    desc: "Full and partial vehicle wraps for cars, trucks, vans, and trailers. Premium cast vinyl with air-release technology for bubble-free installation.",
    features: ["3M\u2122 & Avery\u2122 cast vinyl", "Full, partial, & spot graphics", "Air-release for easy install", "5\u20137 year outdoor life", "Professional installation available"],
    faq: [
      { q: "How long does a vehicle wrap last?", a: "High-quality cast vinyl wraps last 5\u20137 years with proper care. We recommend hand washing and avoiding automatic car washes with brushes." },
    ],
  },
  "vehicle-decals": {
    desc: "Custom vinyl decals for company branding, DOT numbers, and decorative graphics. Easy to apply and remove without damaging paint.",
    features: ["Precision die-cut", "Removable without residue", "DOT & CVOR compliant", "Reflective options", "5+ year outdoor life"],
    faq: [
      { q: "Will decals damage my vehicle\u2019s paint?", a: "No \u2014 our vinyl decals use automotive-grade adhesive that removes cleanly without residue when you\u2019re ready to take them off." },
      { q: "Are vehicle decals waterproof?", a: "Yes \u2014 all vehicle decals are printed on waterproof vinyl with UV laminate. They\u2019re designed to withstand car washes, rain, sun, and snow for 5+ years." },
      { q: "Can I get DOT and CVOR number decals?", a: "Yes \u2014 we produce compliant USDOT, MC, CVOR, TSSA, and NSC number decals in regulation sizes. Just provide your numbers at checkout." },
    ],
  },
  "door-panel-graphics": {
    desc: "Branded door panel graphics and lettering for company vehicles. Includes design, print, and optional professional installation.",
    features: ["Custom fit to any vehicle", "Full-color digital print", "Contour-cut vinyl", "Easy DIY application", "Installation service available"],
    faq: [
      { q: "Do I need to provide my vehicle\u2019s measurements?", a: "We have templates for most common vehicles. Just tell us the year, make, and model and we\u2019ll provide a template. For custom vehicles, you can send us photos with a tape measure." },
      { q: "Can I install door panel graphics myself?", a: "Yes \u2014 we include application instructions and a squeegee tool. Most door graphics take 15\u201330 minutes to apply. Professional installation is also available." },
      { q: "How long do door panel graphics last?", a: "Our premium cast vinyl graphics last 5\u20137 years outdoors with proper care. Calendered vinyl options last 3\u20135 years and are more budget-friendly." },
    ],
  },
  "magnetic-signs": {
    desc: "Removable magnetic vehicle signs \u2014 great for contractors, delivery drivers, and anyone who uses a personal vehicle for business.",
    features: ["30mil magnetic material", "Removable & reusable", "Full-color printing", "UV laminate protection", "Standard & custom sizes"],
    faq: [
      { q: "Will magnetic signs damage my car paint?", a: "No \u2014 our 30mil magnetic signs are designed for automotive use. Remove them periodically to clean underneath and prevent moisture buildup." },
      { q: "Can I use magnetic signs on aluminum body vehicles?", a: "Magnets only work on steel body panels. They won\u2019t stick to aluminum-bodied vehicles like some trucks and sports cars. Contact us if you\u2019re unsure about your vehicle." },
      { q: "How fast can I drive with them on?", a: "Magnetic signs are safe at highway speeds when properly applied to a clean, flat surface. Avoid placing them over body lines or trim." },
    ],
  },
  // Safety & Warning
  "safety-warning-decals": {
    desc: "OSHA, WHMIS, and GHS-compliant safety decals for workplaces, construction sites, and industrial facilities. Durable vinyl with aggressive adhesive for long-term indoor and outdoor use.",
    features: ["OSHA / WHMIS / GHS compliant", "High-visibility colors", "Aggressive permanent adhesive", "UV & chemical resistant", "Custom text & pictograms"],
    faq: [
      { q: "Are these decals OSHA and WHMIS compliant?", a: "Yes \u2014 all safety decals follow OSHA, ANSI Z535, WHMIS 2015, and GHS standards for pictograms, colors, and text formatting." },
      { q: "How long do safety decals last outdoors?", a: "Our vinyl safety decals with UV laminate last 5\u20137 years outdoors. Indoor applications last 10+ years. They resist chemicals, moisture, and abrasion." },
      { q: "Can I order custom safety labels with our own text?", a: "Yes \u2014 we print fully custom safety labels with your text, pictograms, and branding. Just upload your artwork or describe what you need." },
      { q: "What sizes are available?", a: "Standard sizes from 2\u2033\u00d73\u2033 to 14\u2033\u00d720\u2033. Custom sizes available for any application. Packs of 1, 5, 10, or bulk rolls." },
    ],
  },
  // Facility & Asset
  "facility-asset-labels": {
    desc: "Industrial-grade labels for warehouse organization, asset tracking, pipe marking, and equipment identification. Durable materials designed for harsh environments.",
    features: ["Industrial-grade adhesive", "Chemical & abrasion resistant", "ANSI/ASME pipe marking colors", "QR/barcode compatible", "Custom sizes & shapes"],
    faq: [
      { q: "What materials are used for facility labels?", a: "We use heavy-duty vinyl, polyester, and aluminum substrates depending on the application. All are designed for industrial environments and resist chemicals, moisture, and abrasion." },
      { q: "Do pipe markers follow ANSI/ASME standards?", a: "Yes \u2014 our pipe markers follow ANSI/ASME A13.1 color coding. We match the correct background color (green for water, yellow for flammable, etc.) to your pipe contents." },
      { q: "Can asset labels include QR codes or barcodes?", a: "Yes \u2014 we print scannable QR codes, barcodes (Code 128, UPC, etc.), and sequential numbering on durable polyester labels for asset tracking." },
      { q: "How do I order custom warehouse labels?", a: "Upload your design or describe your requirements. We\u2019ll create a proof with correct sizing, colors, and codes. Minimum order is just 10 labels." },
    ],
  },
};

function SubProductContent({ parentSlug }) {
  const content = SUB_PRODUCT_CONTENT[parentSlug];
  if (!content) return null;

  return (
    <section className="mt-12 space-y-8">
      {/* Description */}
      <div>
        <p className="max-w-3xl text-sm leading-relaxed text-[var(--color-gray-600)]">{content.desc}</p>
      </div>

      {/* Features */}
      {content.features?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {content.features.map((f) => (
            <span key={f} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-gray-200)] bg-white px-3 py-1.5 text-xs text-[var(--color-gray-600)]">
              <svg className="h-3 w-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              {f}
            </span>
          ))}
        </div>
      )}

      {/* FAQ */}
      {content.faq?.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-gray-500)]">FAQ</h3>
          <div className="mt-3 divide-y divide-[var(--color-gray-200)] rounded-xl border border-[var(--color-gray-200)] bg-white">
            {content.faq.map((item, i) => (
              <details key={i} className="group">
                <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium text-[var(--color-gray-900)] hover:bg-[var(--color-gray-50)]">
                  {item.q}
                  <svg className="h-4 w-4 shrink-0 text-[var(--color-gray-400)] transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </summary>
                <p className="px-4 pb-3 text-sm leading-relaxed text-[var(--color-gray-600)]">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function GridIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

function ListIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
    </svg>
  );
}

function ProductCardGrid({ product, href, selectedSpec, t, viewOrderLabel, parentSlug, idx = 0 }) {
  const isStamp = parentSlug === "stamps";
  const image = product.images?.[0];
  const image2 = product.images?.[1];
  const imageSrc = isStamp ? null : getProductImage(product, product.category);
  const imageSrc2 = isStamp ? null : (image2?.url || null);
  const sizeCount = product.optionsConfig?.sizes?.length || 0;
  const tk = getTurnaround(product);
  const price = product.fromPrice || product.basePrice;

  return (
    <article
      className={`group overflow-hidden rounded-2xl border bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
        selectedSpec === product.slug ? "border-[var(--color-gray-900)] ring-1 ring-[var(--color-gray-900)]" : "border-[var(--color-gray-200)]"
      }`}
    >
      <Link href={href} className="block">
      <div className="relative aspect-[4/3] bg-[var(--color-gray-100)]">
        {isStamp ? (
          <StampCardPreview index={idx} />
        ) : imageSrc ? (
          <>
            <Image
              src={imageSrc}
              alt={image?.alt || product.name}
              fill
              className={`object-cover transition-all duration-300 ${imageSrc2 ? "group-hover:opacity-0" : "group-hover:scale-105"}`}
              sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
              unoptimized={isSvgImage(imageSrc)}
            />
            {imageSrc2 && (
              <Image
                src={imageSrc2}
                alt={image2?.alt || product.name}
                fill
                className="object-cover opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                unoptimized={isSvgImage(imageSrc2)}
              />
            )}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--color-gray-100)] to-[var(--color-gray-200)]">
            <div className="text-center px-3">
              <svg className="mx-auto h-8 w-8 text-[var(--color-gray-300)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <p className="mt-1 text-xs font-medium text-[var(--color-gray-400)]">{product.name}</p>
            </div>
          </div>
        )}
      </div>
      <div className="p-3 sm:p-4">
        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold mb-1 ${turnaroundColor(tk)}`}>
          {t(turnaroundI18nKey(tk))}
        </span>
        <h3 className="text-sm font-semibold text-[var(--color-gray-900)] leading-snug">{product.name}</h3>
        {selectedSpec === product.slug && (
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-gray-600)]">Selected spec</p>
        )}
        {product.description && (
          <p className="mt-1 text-[11px] text-[var(--color-gray-500)] line-clamp-2">{product.description}</p>
        )}
        {sizeCount > 0 && (
          <p className="mt-1.5 text-[11px] text-[var(--color-gray-400)]">{sizeCount} {t("mp.landing.options")}</p>
        )}
        {price > 0 && (
          <p className="mt-2 text-sm font-bold text-[var(--color-gray-900)]">{t("product.from", { price: formatCad(price) })}</p>
        )}
      </div>
      </Link>
      <div className="px-3 pb-3 sm:px-4 sm:pb-4">
        <div className="mt-1 flex items-center gap-2">
          <QuickAddButton product={product} />
          <Link
            href={href}
            className="inline-block rounded-xl bg-[var(--color-gray-900)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#fff] transition-colors hover:bg-black"
          >
            {viewOrderLabel}
          </Link>
        </div>
      </div>
    </article>
  );
}

function ProductCardList({ product, href, selectedSpec, t, viewOrderLabel, parentSlug, idx = 0 }) {
  const isStamp = parentSlug === "stamps";
  const image = product.images?.[0];
  const imageSrc = isStamp ? null : getProductImage(product, product.category);
  const sizeCount = product.optionsConfig?.sizes?.length || 0;
  const tk = getTurnaround(product);
  const price = product.fromPrice || product.basePrice;

  return (
    <article
      className={`group flex overflow-hidden rounded-2xl border bg-white transition-all duration-200 hover:shadow-lg ${
        selectedSpec === product.slug ? "border-[var(--color-gray-900)] ring-1 ring-[var(--color-gray-900)]" : "border-[var(--color-gray-200)]"
      }`}
    >
      <Link href={href} className="flex min-w-0 flex-1 overflow-hidden">
      <div className="relative w-32 sm:w-40 shrink-0 bg-[var(--color-gray-100)]">
        {isStamp ? (
          <StampCardPreview index={idx} />
        ) : imageSrc ? (
          <Image
            src={imageSrc}
            alt={image?.alt || product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="160px"
            unoptimized={isSvgImage(imageSrc)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--color-gray-100)] to-[var(--color-gray-200)]">
            <svg className="h-8 w-8 text-[var(--color-gray-300)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-4">
        <div className="flex items-start gap-2">
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${turnaroundColor(tk)}`}>
            {t(turnaroundI18nKey(tk))}
          </span>
          {selectedSpec === product.slug && (
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-gray-600)]">Selected</span>
          )}
        </div>
        <h3 className="mt-1 text-sm font-semibold text-[var(--color-gray-900)] leading-snug">{product.name}</h3>
        {product.description && (
          <p className="mt-1 text-[11px] text-[var(--color-gray-500)] line-clamp-2 sm:line-clamp-3">{product.description}</p>
        )}
        <div className="mt-auto pt-2 flex items-center gap-3 flex-wrap">
          {sizeCount > 0 && (
            <span className="text-[11px] text-[var(--color-gray-400)]">{sizeCount} {t("mp.landing.options")}</span>
          )}
          {price > 0 && (
            <span className="text-sm font-bold text-[var(--color-gray-900)]">{t("product.from", { price: formatCad(price) })}</span>
          )}
          <span className="ml-auto rounded-xl bg-[var(--color-gray-900)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#fff] transition-colors group-hover:bg-black">
            {viewOrderLabel}
          </span>
        </div>
      </div>
      </Link>
      <div className="flex items-end p-3 sm:p-4">
        <QuickAddButton product={product} />
      </div>
    </article>
  );
}

function QuickQuoteFAB({ t }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <Link
      href="/quote"
      className="fixed right-4 z-50 flex items-center gap-2 rounded-xl bg-[var(--color-gray-900)] px-4 py-2.5 text-[#fff] shadow-lg transition-all hover:bg-black animate-in fade-in-0 slide-in-from-bottom-4 duration-300 md:hidden"
      style={{ bottom: "calc(var(--mobile-nav-offset, 72px) + env(safe-area-inset-bottom) + 8px)" }}
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
      </svg>
      <span className="text-xs font-semibold uppercase tracking-[0.12em]">
        {t("shop.quickQuote")}
      </span>
    </Link>
  );
}

export default function SubProductLandingClient({
  parentSlug,
  category,
  categoryTitle,
  products,
  siblingSubGroups = [],
}) {
  const { t } = useTranslation();
  const viewOrderLabel = safeText(t("mp.landing.viewOrder"), "View & Order");
  const browseLabel = safeText(t("mp.landing.browse"), "Browse");
  const i18nBase = `sp.${parentSlug}`;
  const searchParams = useSearchParams();
  const selectedSpec = searchParams?.get("spec") || "";
  const [viewMode, setViewMode] = useState("grid");

  // Compute cross-sell suggestions from sibling data
  const crossSellSlugs = CROSS_SELL_MAP[parentSlug] || [];
  const crossSellGroups = siblingSubGroups.filter((sg) => crossSellSlugs.includes(sg.slug));

  return (
    <main className="bg-[var(--color-gray-50)] pb-20 pt-10 text-[var(--color-gray-900)]">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 2xl:px-4">
        <Breadcrumbs
          items={[
            { label: t("product.shop"), href: "/shop" },
            { label: categoryTitle, href: `/shop/${category}` },
            { label: t(`${i18nBase}.title`) },
          ]}
        />

        {/* Header */}
        <header className="mt-6">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            {t(`${i18nBase}.title`)}
          </h1>
          <p className="mt-2 max-w-2xl text-sm sm:text-base text-[var(--color-gray-600)]">
            {t(`${i18nBase}.subtitle`)}
          </p>

          {/* Product count + View toggle */}
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-[var(--color-gray-400)]">
              {products.length} {t("mp.landing.products")}
            </p>
            <div className="flex items-center gap-1 rounded-lg border border-[var(--color-gray-200)] bg-white p-0.5">
              <button
                onClick={() => setViewMode("grid")}
                className={`rounded-md p-1.5 transition-colors ${
                  viewMode === "grid" ? "bg-[var(--color-gray-900)] text-[#fff]" : "text-[var(--color-gray-400)] hover:text-[var(--color-gray-700)]"
                }`}
                title={t("shop.viewGrid")}
              >
                <GridIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`rounded-md p-1.5 transition-colors ${
                  viewMode === "list" ? "bg-[var(--color-gray-900)] text-[#fff]" : "text-[var(--color-gray-400)] hover:text-[var(--color-gray-700)]"
                }`}
                title={t("shop.viewList")}
              >
                <ListIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Product Cards */}
        {viewMode === "grid" ? (
          <div className="mt-6 grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {products.map((product, idx) => (
              <ProductCardGrid
                key={product.id}
                product={product}
                href={`/shop/${product.category}/${product.slug}`}
                selectedSpec={selectedSpec}
                t={t}
                viewOrderLabel={viewOrderLabel}
                parentSlug={parentSlug}
                idx={idx}
              />
            ))}
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-3">
            {products.map((product, idx) => (
              <ProductCardList
                key={product.id}
                product={product}
                href={`/shop/${product.category}/${product.slug}`}
                selectedSpec={selectedSpec}
                t={t}
                viewOrderLabel={viewOrderLabel}
                parentSlug={parentSlug}
                idx={idx}
              />
            ))}
          </div>
        )}

        {products.length === 0 && (
          <p className="mt-8 text-center text-sm text-[var(--color-gray-500)]">
            {t("mp.landing.noProducts")}
          </p>
        )}

        {/* Product Content — description, features, FAQ */}
        <SubProductContent parentSlug={parentSlug} />

        {/* Complete Your Setup — cross-sell */}
        {crossSellGroups.length > 0 && (
          <section className="mt-12">
            <h2 className="text-lg font-semibold tracking-tight text-[var(--color-gray-900)]">
              {t("shop.completeSetup")}
            </h2>
            <div className="mt-4 grid gap-3 grid-cols-1 sm:grid-cols-2">
              {crossSellGroups.map((sg) => (
                <Link
                  key={sg.slug}
                  href={sg.href}
                  className="group flex items-center gap-4 rounded-2xl border border-[var(--color-gray-200)] bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-[var(--color-gray-400)]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-gray-100)] text-[var(--color-gray-400)] group-hover:bg-[var(--color-gray-200)] transition-colors">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-[var(--color-gray-900)] group-hover:text-[var(--color-moon-gold)] transition-colors">
                      {sg.title}
                    </h3>
                    <p className="text-[11px] text-[var(--color-gray-400)]">
                      {browseLabel}
                    </p>
                  </div>
                  <svg className="h-4 w-4 shrink-0 text-[var(--color-gray-400)] group-hover:text-[var(--color-gray-600)] transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Sibling sub-groups — Also browse */}
        {siblingSubGroups.length > 0 && (
          <section className="mt-12">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-gray-500)]">
              {t("shop.alsoBrowse") || "Also Browse"}
            </h2>
            <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-hide scroll-fade pb-2">
              {siblingSubGroups.map((sg) => (
                <Link
                  key={sg.slug}
                  href={sg.href}
                  className="group shrink-0 flex items-center gap-2 rounded-xl border border-[var(--color-gray-200)] bg-white px-4 py-2.5 transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-[var(--color-gray-400)]"
                >
                  <span className="text-sm font-medium text-[var(--color-gray-700)] group-hover:text-[var(--color-gray-900)] whitespace-nowrap">
                    {sg.title}
                  </span>
                  <svg className="h-3 w-3 text-[var(--color-gray-400)] group-hover:text-[var(--color-gray-600)] transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Back to category */}
        <div className="mt-10 text-center">
          <Link
            href={`/shop/${category}`}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-gray-300)] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-gray-600)] transition-colors hover:border-[var(--color-gray-900)] hover:text-[var(--color-gray-900)]"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            {categoryTitle}
          </Link>
        </div>

        {/* Info Footer */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-600)]">
              {t("mp.landing.qualityTitle")}
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-[var(--color-gray-700)]">
              {["quality1", "quality2", "quality3", "quality4"].map((k) => (
                <li key={k} className="flex items-start gap-2">
                  <svg
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {t(`mp.landing.${k}`)}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-600)]">
              {t("mp.landing.turnaroundTitle")}
            </h3>
            <p className="mt-3 text-sm text-[var(--color-gray-700)]">
              {t("mp.landing.turnaroundText")}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-600)]">
              {t("mp.landing.customTitle")}
            </h3>
            <p className="mt-3 text-sm text-[var(--color-gray-700)]">
              {t("mp.landing.customText")}
            </p>
            <Link
              href="/quote"
              className="mt-3 inline-block rounded-xl bg-[var(--color-gray-900)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#fff] hover:bg-black"
            >
              {t("home.cta.quote")}
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Quote FAB */}
      <QuickQuoteFAB t={t} />
    </main>
  );
}
