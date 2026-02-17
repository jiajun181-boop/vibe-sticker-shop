import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const UPDATES = {
  // ── banners-displays ──
  "banner-stand-x": "Lightweight X-banner stand hardware (frame only, no print). Easy snap-open assembly, fits standard 24×63\" or 32×72\" prints. Includes carry bag for transport to trade shows and events.",
  "pole-banner-double-sided": "Double-sided pole banners with vibrant full-color printing on both faces. Designed for street-level visibility on light poles and parking lot standards. Heavy-duty reinforced hems and pole pockets included.",
  "teardrop-flag": "Teardrop-shaped feather flags that maintain a consistent shape even in wind. Dye-sublimated fabric with vivid, fade-resistant colors. Perfect for storefronts, car dealerships, and outdoor events.",
  "teardrop-flag-pole-set": "Replacement pole set for teardrop flags (hardware only, no print). Includes sectional fiberglass pole, swivel connector, and ground stake or cross base adapter.",
  "teardrop-flags": "Custom teardrop flags with a stable, wind-resistant shape for maximum brand impact. Dye-sub printed on knitted polyester for sharp, see-through graphics. Available in multiple heights.",
  "telescopic-backdrop": "Height-adjustable telescopic backdrop stand for step & repeat banners, media walls, and photo backdrops. Expands up to 10ft wide × 8ft tall. Lightweight aluminum tubing with carry case.",
  "tension-fabric-display-8ft": "Portable 8-foot tension fabric display with pillowcase-style graphic that slides over an aluminum frame. Wrinkle-free, machine-washable fabric. Sets up in minutes without tools.",
  "tent-custom-print": "Full-color dye-sublimation printed canopy tent top. 600D polyester with UV-resistant inks for lasting outdoor use. Fits standard 10×10 ft pop-up tent frames. Unlimited colors, edge-to-edge print.",
  "tent-half-walls": "Half-height side walls for 10×10 canopy tents. Provide branding space and wind protection while keeping airflow open. Full-color dye-sub printing on 600D polyester. Velcro attachment system.",
  "velcro-strips": "Industrial-strength Velcro mounting strips for attaching banners, signs, and displays to walls, frames, and other surfaces. Clean removal without damage. Sold in sets.",
  "x-banner-frame-print": "Complete X-banner stand kit including full-color printed banner and lightweight X-frame hardware. Ready for trade shows, lobbies, and retail displays. Easy 2-minute setup with carry bag.",
  "x-banner-prints": "Replacement X-banner prints (print only, no frame). Full-color on 13oz scrim vinyl or premium polypropylene. Grommeted corners for secure attachment to any standard X-stand frame.",
  "x-stand-hardware": "X-banner stand hardware kit (frame only, no print). Collapsible tripod design, fits standard banner sizes. Includes carry bag for easy transport between events and trade shows.",

  // ── marketing-business-print ──
  "bf-certificates": "Professional certificates for awards, training completion, authenticity, and recognition programs. Printed on premium cardstock with optional gold foil borders, embossing, and sequential numbering.",
  "bf-letterhead": "Custom business letterhead printed on premium bond paper. Consistent brand identity for correspondence, proposals, and official documents. Available in standard 8.5×11\" with watermark options.",
  "bf-notepads": "Custom branded notepads for offices, retail counters, and promotional giveaways. Printed on quality bond paper with chipboard backing. Choose from 25, 50, or 100 sheets per pad.",
  "calendars-wall-desk": "Custom wall calendars and desk calendars with your branding, photos, and important dates highlighted. Coil-bound or saddle-stitched. Great for year-end client gifts and promotional marketing.",
  "danglers": "Eye-catching hanging danglers for retail aisles, ceilings, and shelf edges. Double-sided full-color print on sturdy cardstock. Grab attention for sales, new arrivals, and seasonal promotions.",
  "label-sets": "Coordinated product label kits for multiple SKUs, flavors, or variants. Printed on durable adhesive stock with consistent branding across your entire product line. Die-cut to any shape.",
  "mp-coupons": "Custom printed coupons for promotions, discounts, and direct-mail campaigns. Full-color on cardstock with optional perforation, numbering, and barcodes. Drive foot traffic and repeat purchases.",
  "mp-door-hangers": "Custom door hangers for local marketing, service promotions, and real estate. Full-color printing on thick cardstock with die-cut handle hole. Optional tear-off coupons and QR codes.",
  "mp-letterhead": "Business letterhead for professional correspondence and official documents. Printed on premium bond paper with your logo, contact details, and brand colors. Consistent identity on every page.",
  "mp-menus": "Restaurant and café menus in single-sheet, folded, and booklet formats. Full-color on durable cardstock with optional lamination for spill resistance. Professional layout and crisp food photography.",
  "mp-notepads": "Branded notepads for office desks, reception counters, and promotional giveaways. Full-color printing with chipboard backing. Available in multiple sizes with 25–100 sheets per pad.",
  "mp-postcards": "Full-color postcards for direct mail campaigns, handouts, and promotional inserts. Printed on thick 14pt or 16pt cardstock with optional UV coating or matte finish for a professional feel.",
  "mp-presentation-folders": "Custom presentation folders for proposals, sales kits, and brand presentations. Two interior pockets with optional business card slits. Full-color on thick 14pt C2S stock with gloss or matte finish.",
  "mp-tickets": "Custom event tickets with optional sequential numbering, perforation, and barcode printing. Full-color on cardstock. Ideal for concerts, raffles, fundraisers, and admission control.",
  "ncr-invoice-books": "Carbonless NCR invoice books in 2-part or 3-part format with sequential numbering. Bound with wraparound cover and chipboard backer. Custom fields for your business invoicing needs.",
  "order-form-pads": "Custom order form pads for restaurants, shops, and service businesses. Printed on quality bond with chipboard backing. Available in 2-part or 3-part NCR for duplicate copies.",
  "packaging-inserts": "Custom packaging inserts for e-commerce boxes, mailers, and product shipments. Thank-you cards, instruction sheets, discount codes, and care guides. Full-color on premium cardstock.",
  "packing-slips": "Branded packing slips for order fulfillment with your logo, order details, and return instructions. Clean, professional layout on bond paper. Optional NCR duplicate for warehouse records.",
  "release-waiver-forms": "Custom printed waivers, release forms, and consent documents for fitness studios, events, and service providers. Professional layout on bond paper with signature lines and legal formatting.",
  "rp-coupons": "Promotional coupons for retail stores and direct marketing campaigns. Full-color on cardstock with optional perforation, serial numbers, and expiry date fields. Designed to drive repeat business.",
  "rp-hang-tags": "Custom hang tags for apparel, gifts, and retail merchandise. Printed on thick cardstock or kraft paper with string hole or slot. Full-color branding with pricing and barcode options.",
  "rp-menus": "Restaurant menus for counter displays, tables, and takeout. Full-color printing with options for lamination, folding, and tent-style presentation. Durable and easy to update seasonally.",
  "rp-tickets": "Custom event tickets with optional sequential numbering and perforation for easy tear-off. Full-color printing on cardstock. Perfect for concerts, festivals, raffles, and admission events.",
  "shelf-talkers": "Shelf talkers, shelf strips, and wobbly tags for in-store product call-outs. Full-color on cardstock with die-cut tabs for standard retail shelf rails. Highlight prices, promos, and features.",
  "sticker-seals": "Custom round sticker seals for packaging, envelopes, and branded closures. Printed on glossy or matte adhesive vinyl. Available in standard sizes from 1\" to 3\" diameter.",
  "table-tent-cards": "Double-sided table tent cards for restaurants, hotels, and retail counters. Display QR code menus, daily specials, promotions, or pricing info. Printed on sturdy cardstock, pre-scored for easy folding.",
  "thank-you-cards": "Branded thank-you insert cards for e-commerce orders and customer retention. Full-color on premium cardstock with discount codes, social handles, and review prompts to build loyalty.",
  "wobblers": "Custom shelf wobblers with spring-action tabs that catch shoppers' attention. Full-color print on sturdy cardstock with adhesive base. Ideal for price highlights, new products, and promotions.",

  // ── signs-rigid-boards ──
  "a-frame-insert-prints": "Full-color printed inserts for A-frame sidewalk stands. Printed on coroplast or foam board, designed to slide into standard A-frame channels. Double-sided for maximum street-level visibility.",
  "aluminum-composite": "3mm Aluminum Composite Material (Dibond) signs for heavy-duty indoor and outdoor applications. Weather-resistant, rigid, and lightweight with a sleek professional finish. UV-printed with vibrant colors.",
  "backdrop-board": "Large rigid backdrop boards for events, trade shows, and photo opportunities. Printed on foam board or gatorboard with full-color graphics. Available in custom sizes up to 4×8 feet.",
  "clear-acrylic-signs": "Modern clear acrylic signs with sharp UV-printed graphics. Professional, high-end look for offices, lobbies, and retail spaces. Available in multiple thicknesses with standoff or flush mounting options.",
  "construction-site-signs": "Durable construction site signage for permits, safety notices, project details, and directional wayfinding. Printed on weather-resistant coroplast, aluminum, or PVC for long-term outdoor use.",
  "directional-arrow-signs": "Custom directional arrow signs for guiding traffic, visitors, and customers. Printed on coroplast, foam board, or aluminum. Available with stakes, wall mounts, or stand hardware.",
  "double-sided-lawn-signs": "Two-sided corrugated plastic lawn signs for maximum visibility from both directions. Full-color UV printing, weather-resistant, and lightweight. Ideal for campaigns, events, and real estate.",
  "foam-board": "Lightweight 3/16\" foam board (foamcore) for indoor displays, presentations, and mounting. Full-color direct print or vinyl-applied graphics. Custom sizes available up to 48×96 inches.",
  "frosted-acrylic-signs": "Frosted acrylic signs combining privacy with branding for office suites, conference rooms, and retail. Elegant satin finish with UV-printed or vinyl-cut graphics. Standoff mounting available.",
  "gatorboard-signs": "Premium gatorboard signs — 3× stronger and more durable than standard foam board. Moisture-resistant rigid core with smooth white surface. Ideal for long-term indoor displays and trade shows.",
  "handheld-signs": "Lightweight handheld signs on foam board or coroplast for events, rallies, queues, and photo ops. Full-color printing with optional handle attachment. Easy to carry and wave.",
  "lawn-signs-h-stake": "Outdoor corrugated plastic lawn signs with included metal H-stake for easy ground installation. Full-color UV printing, weatherproof, and reusable. Popular for elections, open houses, and events.",
  "parking-property-signs": "Durable parking and property management signage with mounting options. Printed on aluminum, coroplast, or PVC. Reserved parking, no trespassing, tenant rules, and custom regulatory signs.",
  "pvc-sintra-signs": "Durable PVC (Sintra) board signs for indoor and outdoor use. Rigid, moisture-resistant, and lightweight. UV-printed with vibrant graphics. Available in 3mm and 6mm thickness.",
  "real-estate-agent-sign": "Professional real estate agent signs for property listings, open houses, and directional wayfinding. Printed on coroplast or aluminum with weather-resistant inks. Rider clips and stake options available.",
  "rigid-tabletop-signs": "Countertop and tabletop signs for QR code menus, pricing displays, and promotional messages. Printed on rigid foam board or acrylic with optional easel back for freestanding display.",
  "safety-signs": "OSHA-compliant warning, hazard, PPE, and safety compliance signage for workplaces, construction sites, and public facilities. Printed on durable aluminum, PVC, or coroplast with bold, legible graphics.",
  "standoff-mounted-signs": "Premium wall-mounted signs using brushed stainless or satin aluminum standoff hardware. Professional floating appearance for offices, lobbies, and retail. Printed on acrylic, aluminum, or PVC substrate.",
  "tabletop-signs": "Freestanding counter and tabletop signs for QR code menus, promotional offers, and pricing displays. Printed on rigid stock with easel back. Perfect for restaurants, hotels, and retail counters.",
  "tags-tickets-rigid": "Rigid printed tags and tickets on thick cardstock or PVC for retail pricing, event admission, VIP passes, and inventory tracking. Full-color with optional die-cut shapes and hole punch.",
  "wayfinding-signs": "Custom directional wayfinding signage systems for buildings, campuses, hospitals, and venues. Printed on aluminum, acrylic, or PVC with clear typography and universal pictograms for ADA compliance.",
  "yard-sign-h-frame": "Full-color corrugated plastic yard signs with included metal H-frame stake. Quick ground installation, weatherproof, and reusable. Popular for real estate, political campaigns, and event promotion.",
  "yard-sign-panel-only": "Corrugated plastic (coroplast) yard sign panels for outdoor use — print only, no stake included. 4mm fluted plastic with full-color UV printing. Lightweight, weatherproof, and recyclable.",

  // ── stickers-labels-decals ──
  "asset-tags-qr-barcode": "Durable asset tracking tags with scannable QR codes or barcodes. Printed on tamper-resistant polyester or vinyl with permanent adhesive. Ideal for IT equipment, tools, and inventory management.",
  "asset-tags-tamper-evident": "Tamper-evident security asset tags that leave a visible VOID pattern when removed. Printed on destructible vinyl with sequential numbering, barcodes, or QR codes for asset tracking and theft prevention.",
  "cable-panel-labels": "Durable labels for electrical panels, network racks, and cable management. Printed on self-laminating vinyl or polyester with clear text for quick identification. Resistant to heat and moisture.",
  "clear-labels": "Transparent adhesive labels that blend seamlessly with any packaging surface. Printed on clear BOPP or vinyl with white ink option. Perfect for bottles, jars, and products with a clean, no-label look.",
  "clear-singles": "Individual die-cut stickers on transparent PET film with white ink underprint for vivid colors on any surface. Waterproof, UV-resistant, and perfect for glass, bottles, and product packaging.",
  "die-cut-singles": "Individually die-cut custom stickers on premium waterproof vinyl. Hand-sorted and kiss-cut for easy peel. Durable outdoor-grade adhesive that withstands rain, sun, and scratches.",
  "emergency-exit-egress-signs-set": "Complete emergency exit and egress signage set including EXIT signs, directional arrows, and stairwell markers. Glow-in-the-dark or reflective options. Meets building code and fire safety requirements.",
  "fire-extinguisher-location-stickers": "Highly visible fire extinguisher location identification stickers. Red and white design per NFPA standards. Self-adhesive vinyl for walls, columns, and equipment cabinets. Sold individually or in packs.",
  "first-aid-location-stickers": "Green and white cross first aid location stickers for walls, cabinets, and emergency stations. Compliant with workplace safety standards. Durable vinyl with permanent adhesive for indoor and outdoor use.",
  "freezer-labels": "Cold-resistant adhesive labels engineered for frozen and refrigerated products. Printed on specialized freezer-grade stock that maintains adhesion at temperatures down to -40°F. Waterproof and smudge-proof.",
  "hazard-ghs-labels": "Globally Harmonized System (GHS) hazard labels for chemical containers and workplace safety. Pre-printed pictograms with custom fields for product name, hazard statements, and precautionary information.",
  "heavy-duty-vinyl-stickers": "Extra-thick outdoor vinyl stickers with UV-resistant lamination and waterproof permanent adhesive. Built to withstand sun, rain, and abrasion for years. Ideal for equipment, vehicles, and outdoor branding.",
  "holographic-singles": "Eye-catching holographic stickers with a rainbow metallic shimmer effect. Individually die-cut on premium holographic film. Waterproof and scratch-resistant — perfect for premium branding and collectibles.",
  "kiss-cut-sticker-sheets": "Multiple kiss-cut stickers on a single backing sheet for easy peeling and distribution. Perfect for merchandise packs, giveaways, and retail bundles. Printed on premium waterproof vinyl.",
  "kraft-paper-labels": "Natural brown kraft paper labels for an organic, artisan look. Ideal for handmade goods, food packaging, and eco-friendly branding. Permanent adhesive with matte finish for a rustic aesthetic.",
  "labels-clear": "Transparent adhesive labels for bottles, jars, and premium product packaging. Printed on crystal-clear BOPP with optional white ink backing. Creates a seamless, no-label appearance on any surface.",
  "labels-roll-quote": "High-volume roll labels for automated dispensing and application. Custom quoted based on quantity, size, and material. White BOPP, clear, or kraft substrates with permanent or removable adhesive.",
  "magnets-flexible": "Custom flexible magnets for vehicle doors, refrigerators, and promotional giveaways. Full-color printed on 30mil magnetic stock. Easy to apply, remove, and reposition without residue.",
  "no-smoking-decals-set": "Standard No Smoking decal set for doors, windows, and designated areas. Bold red and white design for clear visibility. Self-adhesive weatherproof vinyl. Meets signage regulations for public spaces.",
  "ppe-hard-hat-stickers": "Small, durable stickers designed for hard hats, helmets, and PPE equipment. Printed on waterproof vinyl with permanent adhesive. Custom logos, certifications, and safety reminders in compact sizes.",
  "removable-stickers": "Repositionable stickers with clean-peel adhesive — no residue left behind. Great for temporary promotions, seasonal branding, events, and product samples. Printed on premium matte or glossy vinyl.",
  "safety-notice-decal-pack": "Assorted workplace safety label pack including caution, warning, notice, and instruction decals. Printed on durable weatherproof vinyl. Pre-designed to meet OSHA signage standards for general industry.",
  "sticker-packs": "Curated sticker sets bundled and ready for retail, merch drops, or event giveaways. Custom mix of die-cut designs on waterproof vinyl in branded packaging. Perfect for brand fans and collectors.",
  "stickers-color-on-clear": "Full-color printed stickers on transparent vinyl film for a clean, floating graphic effect. White ink underprint available for opacity. Die-cut to custom shapes. Waterproof and UV-resistant.",
  "stickers-color-on-white": "Full-color stickers printed on opaque white vinyl for bold, vibrant graphics with maximum contrast. Die-cut to any shape with permanent outdoor-grade adhesive. Waterproof and scratch-resistant.",
  "stickers-multi-on-sheet": "Multiple sticker designs ganged on a single sheet for efficient production and cost savings. Each design individually die-cut or kiss-cut. Ideal for product sets, variety packs, and sampling kits.",
  "stickers-single-diecut": "Custom die-cut singles cut to the exact shape of your design. Printed on premium waterproof vinyl with durable outdoor adhesive. Perfect for branding, laptop stickers, and merchandise.",
  "tool-box-bin-labels": "Durable adhesive labels for toolboxes, storage bins, and parts organizers. Printed on waterproof vinyl or polyester with clear text and color coding for quick identification and workplace organization.",
  "warehouse-zone-labels": "Large high-visibility labels for warehouse racking zones, aisles, and storage locations. Printed on durable self-adhesive vinyl with bold colors and large text for easy identification at distance.",

  // ── vehicle-graphics-fleet ──
  "cvor-number-decals": "High-visibility Commercial Vehicle Operator Registration (CVOR) number decals. Cut vinyl or printed lettering that meets Ontario MTO requirements. Weather-resistant for truck doors and trailers.",
  "equipment-id-decals-cut-vinyl": "Heavy-duty cut vinyl identification decals for machinery, equipment, and fleet assets. UV-resistant outdoor vinyl with permanent adhesive. Custom numbers, logos, and text in any size.",
  "fleet-unit-number-stickers": "Custom fleet unit number stickers for vehicle identification and tracking. Durable outdoor vinyl with bold, legible numbering. Available in reflective or standard finishes for trucks, trailers, and equipment.",
  "fuel-type-labels-diesel-gas": "Clear identification labels for Diesel, Gasoline, Propane, and DEF fuel caps and tanks. Color-coded per industry standards. Durable weatherproof vinyl that resists fuel splashes, UV, and abrasion.",
  "gvw-tare-weight-lettering": "Gross Vehicle Weight (GVW) and Tare Weight compliance lettering for commercial trucks and trailers. Cut vinyl in regulation sizing. Meets DOT, MTO, and provincial transport authority requirements.",
  "tire-pressure-load-labels": "Tire pressure and load capacity information labels for commercial vehicles. Durable vinyl with permanent adhesive. Displays recommended PSI, axle weights, and load ratings per DOT regulations.",
  "tssa-truck-number-lettering-cut-vinyl": "Professional cut vinyl lettering for TSSA (Technical Standards and Safety Authority) registration numbers. Regulation-compliant sizing and contrast. Outdoor-grade vinyl with 7+ year durability.",
  "usdot-number-decals": "US Department of Transportation number decals in regulation-compliant sizing and contrast. Durable outdoor vinyl lettering designed for truck doors and trailers. Meets FMCSA display requirements.",
  "vehicle-inspection-maintenance-stickers": "Write-on vehicle inspection and maintenance tracking stickers. Record oil changes, tire rotations, and safety checks. Durable vinyl with space for date, mileage, and technician notes.",

  // ── windows-walls-floors ──
  "floor-direction-arrows-set": "Directional floor arrow decals for guiding foot traffic in stores, warehouses, and facilities. Printed on anti-slip laminated vinyl with permanent adhesive. Bold colors for clear wayfinding at a glance.",
  "floor-graphics": "Custom floor graphics and decals for wayfinding, promotions, and branding. Printed on durable anti-slip vinyl with textured overlaminate. Suitable for retail, trade shows, and high-traffic areas.",
  "floor-number-markers-set": "Numbered floor decals for warehouses, parking structures, and event spaces. Printed on anti-slip laminated vinyl with bold, high-contrast numbering. Durable adhesive for concrete, tile, and sealed floors.",
  "full-window-graphics": "Full-coverage storefront window graphics for maximum visual impact and branding. Printed on optically clear or white adhesive vinyl. UV-resistant inks for lasting outdoor color. Professional installation available.",
  "lf-floor-graphics": "Large-format floor decals for retail aisles, trade show booths, and event spaces. Anti-slip textured laminate over full-color print. Durable adhesive that removes cleanly when your promotion ends.",
  "wall-graphics": "Custom wall decals and murals for offices, retail interiors, restaurants, and showrooms. Printed on repositionable or permanent adhesive vinyl. Transform blank walls into branded experiences.",
  "wall-murals": "Large-format custom wall murals for offices, restaurants, and retail interiors. Full-color printing on self-adhesive vinyl or wallpaper-grade material. Seamless panel-to-panel installation for spaces of any size.",
  "warehouse-floor-safety-graphics": "Anti-slip safety floor decals for warehouses and industrial facilities. Pedestrian walkways, forklift zones, hazard areas, and emergency exits. Textured overlaminate meets OSHA traction requirements.",
  "window-frosted": "Frosted privacy film with optional custom-cut lettering, logos, and designs. Creates an elegant etched glass appearance while blocking visibility. UV-resistant adhesive film for offices and storefronts.",
  "window-graphics": "Custom storefront window graphics for seasonal promotions, branding, and product showcases. Printed on white, clear, or perforated vinyl. UV-resistant inks maintain vivid colors in direct sunlight.",
  "window-perforated": "One-way vision perforated window film that displays full-color graphics on the outside while maintaining see-through visibility from inside. Perfect for storefronts, vehicle windows, and office partitions.",
};

async function main() {
  let updated = 0;
  let skipped = 0;
  for (const [slug, description] of Object.entries(UPDATES)) {
    const result = await prisma.product.updateMany({
      where: { slug },
      data: { description },
    });
    if (result.count > 0) {
      updated++;
      console.log(`  ✓ ${slug} (${description.length} chars)`);
    } else {
      skipped++;
      console.log(`  ✗ ${slug} — not found`);
    }
  }
  console.log(`\nDone: ${updated} updated, ${skipped} skipped, ${Object.keys(UPDATES).length} total`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
