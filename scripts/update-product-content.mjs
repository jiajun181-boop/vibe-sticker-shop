/**
 * Bulk-update product descriptions & keywords
 * Based on StickerCanada.com reference + industry knowledge
 *
 * Run: node scripts/update-product-content.mjs
 */

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// ── Product content map: slug → { description, keywords } ──────────────
const contentMap = {
  // ═══════════════════════════════════════════════════════════════════════
  // STICKERS & LABELS
  // ═══════════════════════════════════════════════════════════════════════

  // -- Paper Stickers --
  "art-paper-stickers": {
    description:
      "High-quality art paper stickers printed on a smooth, vibrant surface. One of the most affordable custom sticker options, perfect for indoor use on mailers, product labelling, freebies, and promotional giveaways. Available in gloss, matte, or uncoated finishes with strong adhesive grip.",
    keywords: ["art paper stickers", "custom paper stickers", "indoor stickers", "affordable stickers", "product labels", "promotional stickers", "matte stickers", "gloss stickers", "custom printing Canada"],
  },
  "classic-paper-stickers": {
    description:
      "Classic paper stickers with a smooth, non-glossy surface ideal for writing and stamping. An elegant, writable option perfect for custom packaging labels, seal stickers, and branded envelopes. The uncoated finish accepts pen and marker for personalized touches.",
    keywords: ["classic paper stickers", "writable stickers", "uncoated stickers", "packaging labels", "seal stickers", "envelope labels", "custom labels Canada"],
  },
  "kraft-paper-stickers": {
    description:
      "Kraft paper stickers with a natural brownish tone that creates an authentic, handmade aesthetic. Perfect for eco-conscious branding, handicraft labelling, DIY projects, and artisan product packaging. The organic look pairs beautifully with minimalist designs.",
    keywords: ["kraft paper stickers", "eco-friendly stickers", "natural stickers", "handmade labels", "artisan stickers", "DIY stickers", "brown paper stickers", "rustic labels", "organic packaging"],
  },

  // -- Vinyl Stickers --
  "bumper-stickers": {
    description:
      "Durable custom bumper stickers designed for extended outdoor exposure. UV-protected vinyl with strong waterproof adhesive, perfect for cars, motorcycles, skateboards, and any outdoor surface. Fade-resistant printing ensures your design stays vibrant for years.",
    keywords: ["bumper stickers", "car stickers", "outdoor stickers", "UV resistant stickers", "waterproof stickers", "vehicle stickers", "custom bumper stickers Canada", "durable stickers"],
  },
  "vinyl-stickers": {
    description:
      "Premium custom vinyl stickers with moisture-resistant surface and strong adhesive grip. Fantastic for all sorts of indoor and outdoor applications including product labelling, branding, and promotional use. High-resolution printing delivers sharp, professional results.",
    keywords: ["vinyl stickers", "custom vinyl stickers", "waterproof stickers", "outdoor stickers", "product labels", "durable stickers", "custom stickers Canada", "weather resistant"],
  },
  "transparent-vinyl-stickers": {
    description:
      "Clear transparent vinyl stickers — the most popular waterproof material for product labelling. Creates a clean, no-label look on glass, bottles, and clear packaging. Available with or without white print base for maximum design flexibility.",
    keywords: ["transparent stickers", "clear vinyl stickers", "see-through stickers", "bottle labels", "glass stickers", "waterproof clear labels", "no-label look", "product labelling"],
  },
  "pvc-stickers": {
    description:
      "Premium PVC stickers made from synthetic resin material — thicker, stronger, and more UV-resistant than standard vinyl. Extremely difficult to tear off once applied, making them ideal for long-term outdoor signage, asset marking, and heavy-duty branding applications.",
    keywords: ["PVC stickers", "heavy duty stickers", "UV resistant stickers", "thick stickers", "durable stickers", "outdoor decals", "long lasting stickers", "industrial stickers"],
  },

  // -- Special Stickers --
  "holographic-stickers": {
    description:
      "Eye-catching holographic stickers with a shimmering rainbow finish that shifts colours as you view from different angles. Designed to enhance brand visibility with bold, electric tones and a 3D visual effect. Perfect for high-impact branding, creative merchandise, and premium packaging.",
    keywords: ["holographic stickers", "hologram stickers", "rainbow stickers", "iridescent stickers", "premium stickers", "special effect stickers", "shimmering stickers", "luxury stickers"],
  },
  "foil-stickers": {
    description:
      "Luxurious foil stickers with stylish gold, silver, or hologram metallic finishes. Heat-transferred foil creates smooth surfaces with sharp detail for upscale branding and premium packaging. The metallic sheen adds an elegant, high-end touch to any product.",
    keywords: ["foil stickers", "gold foil stickers", "silver foil stickers", "metallic stickers", "luxury stickers", "premium labels", "foil stamped stickers", "elegant stickers"],
  },
  "embossed-stickers": {
    description:
      "Elegant embossed stickers with a raised, textured finish created through a precision concave plate process. Optional foil accents add metallic brilliance. Perfect for certificates, wedding invitations, gift wrapping, and seal stickers requiring a timeless, tactile impression.",
    keywords: ["embossed stickers", "raised stickers", "textured stickers", "3D stickers", "seal stickers", "wedding stickers", "premium labels", "embossed labels"],
  },
  "dome-stickers": {
    description:
      "Premium dome stickers featuring a glossy, resin-coated 3D bubble surface that adds depth and dimension to your design. The crystal-clear epoxy dome provides UV protection while creating a high-end, professional appearance ideal for product branding and corporate gifts.",
    keywords: ["dome stickers", "3D stickers", "resin stickers", "epoxy stickers", "domed labels", "premium stickers", "bubble stickers", "corporate stickers"],
  },
  "gold-vinyl-stickers": {
    description:
      "Elegant gold vinyl stickers with a modern, high-end metallic finish. Adds a premium styling edge to gift wrapping, wine labelling, cosmetic packaging, and luxury branding. Available in brushed gold and mirror gold finishes for different aesthetic effects.",
    keywords: ["gold vinyl stickers", "metallic stickers", "gold labels", "luxury labels", "premium vinyl", "gold decals", "metallic gold"],
  },
  "silver-vinyl-stickers": {
    description:
      "Sophisticated silver vinyl stickers that upgrade any promotional look with elegant metallic detail. Available in matte and mirror finishes, ideal for electronics branding, appliance labels, and professional product identification.",
    keywords: ["silver vinyl stickers", "metallic silver stickers", "silver labels", "chrome stickers", "mirror stickers", "appliance labels", "electronics labels"],
  },

  // -- Supply Formats --
  "die-cut-stickers": {
    description:
      "Precisely die-cut stickers shaped to match your exact design contours. Cut through both the vinyl and backing layers for clean edges with no unnecessary borders. The most popular format for brand logos, product packaging, and retail merchandise.",
    keywords: ["die cut stickers", "custom shape stickers", "contour cut stickers", "logo stickers", "branded stickers", "custom die cut", "shaped stickers", "precision cut"],
  },
  "kiss-cut-stickers": {
    description:
      "Professional kiss-cut stickers where only the top layer is cut while keeping the backing sheet intact. Makes peeling smooth and easy without damaging intricate designs. Extra protection during storage and handling — ideal for complex illustrations and sharp logo work.",
    keywords: ["kiss cut stickers", "peel and stick", "easy peel stickers", "sheet stickers", "backing stickers", "intricate stickers", "detailed stickers"],
  },
  "sticker-sheets": {
    description:
      "Custom sticker sheets combining various shapes, sizes, and designs on one convenient sheet. An efficient, space-saving way to organize multiple stickers for themed sets, planner stickers, promotional kits, and branded giveaways.",
    keywords: ["sticker sheets", "custom sticker sheet", "multiple stickers", "sticker pack", "planner stickers", "themed stickers", "sheet labels"],
  },
  "stickers-sheet-kisscut": {
    description:
      "Kiss-cut sticker sheets with multiple pre-cut designs on a single backing sheet. Each sticker peels easily while maintaining sheet integrity. Perfect for branded sticker packs, event giveaways, and retail merchandise sets.",
    keywords: ["kiss cut sticker sheets", "sticker packs", "peel stickers", "branded sticker sheet", "giveaway stickers", "retail stickers"],
  },
  "roll-labels": {
    description:
      "Continuous roll labels designed for high-volume packaging and automated dispensers. Streamline your product labelling with fast, efficient bulk application. Perfect for food and beverage labelling, cosmetic packaging, and inventory management.",
    keywords: ["roll labels", "label rolls", "product labels", "packaging labels", "bulk labels", "automated labels", "dispenser labels", "roll stickers"],
  },
  "roll-stickers": {
    description:
      "Seamless sticker rolls for stylish, efficient packaging and labelling applications. Available in paper and vinyl materials with custom sizes and shapes. Ideal for businesses requiring high-volume, consistent label application.",
    keywords: ["roll stickers", "sticker rolls", "bulk stickers", "commercial labels", "packaging stickers", "roll labels Canada"],
  },

  // -- Specialty Labels --
  "barcode-labels": {
    description:
      "Professional barcode labels with crisp, scannable prints for inventory tracking, retail POS systems, and product identification. Available on durable materials to ensure reliable scanning across all environments.",
    keywords: ["barcode labels", "UPC labels", "inventory labels", "product labels", "scannable labels", "retail labels", "SKU labels", "tracking labels"],
  },
  "white-bopp-labels": {
    description:
      "White BOPP (biaxially-oriented polypropylene) labels offering superior moisture and oil resistance. The premium synthetic material maintains its appearance in wet, cold, and oily environments — ideal for food, beverage, cosmetic, and chemical products.",
    keywords: ["BOPP labels", "waterproof labels", "oil resistant labels", "food labels", "beverage labels", "cosmetic labels", "chemical labels", "moisture proof"],
  },
  "labels-white-bopp": {
    description:
      "Durable white BOPP labels with excellent water and oil resistance. The synthetic polypropylene material keeps labels looking pristine on refrigerated, frozen, and cosmetic products where standard paper labels would fail.",
    keywords: ["white BOPP labels", "waterproof labels", "freezer labels", "oil proof labels", "synthetic labels", "durable labels"],
  },
  "clear-bopp-labels": {
    description:
      "Crystal-clear BOPP labels that create a seamless, no-label look on any product. The transparent synthetic material is waterproof and oil-resistant, perfect for showcasing product contents while maintaining professional branding.",
    keywords: ["clear BOPP labels", "transparent labels", "no-label look", "see through labels", "clear product labels", "waterproof clear labels"],
  },
  "security-labels": {
    description:
      "Tamper-evident security labels that reveal a void pattern or leave residue when removed. Protects products from unauthorized access, counterfeiting, and tampering. Essential for electronics, pharmaceuticals, and high-value goods.",
    keywords: ["security labels", "tamper evident labels", "void labels", "anti-counterfeit", "tamper proof", "security seals", "authentication labels"],
  },
  "qr-code-labels": {
    description:
      "Custom QR code labels with high-resolution, scannable prints linking to your website, menu, social media, or product info. Available in a variety of materials and sizes for indoor and outdoor applications.",
    keywords: ["QR code labels", "QR stickers", "scannable labels", "digital labels", "smart labels", "contactless labels", "menu QR codes"],
  },
  "custom-label-printing": {
    description:
      "Fully custom label printing with unlimited design freedom. Choose your material, shape, size, and finish for labels tailored exactly to your brand needs. From product labels to packaging seals, we produce labels for every application.",
    keywords: ["custom labels", "label printing", "custom label printing", "branded labels", "product labels", "packaging labels", "bespoke labels"],
  },

  // -- Decals --
  "custom-decals": {
    description:
      "Durable custom vinyl decals perfect for signage, storefront windows, walls, and vehicle applications. Precision-cut from premium vinyl with excellent water and weather resistance for long-lasting outdoor performance.",
    keywords: ["custom decals", "vinyl decals", "wall decals", "window decals", "signage decals", "outdoor decals", "storefront decals"],
  },
  "wall-decals": {
    description:
      "Removable wall decals that transform any interior space without damage. High-resolution prints on premium repositionable vinyl — perfect for office branding, retail displays, nursery décor, and event installations.",
    keywords: ["wall decals", "wall stickers", "removable decals", "interior decals", "office decals", "wall graphics", "room decor"],
  },
  "window-decals": {
    description:
      "Custom window decals for storefronts, vehicles, and interior glass surfaces. Available in opaque, frosted, and transparent vinyl options with easy application and clean removal. Transform any glass surface into branded real estate.",
    keywords: ["window decals", "glass decals", "storefront decals", "window stickers", "glass stickers", "shop window", "window graphics"],
  },
  "floor-decals": {
    description:
      "Heavy-duty floor decals with non-slip lamination for safe, high-traffic applications. Anti-scuff printing withstands foot traffic while delivering bold, eye-catching messaging. Perfect for retail wayfinding, event promotions, and safety signage.",
    keywords: ["floor decals", "floor stickers", "floor graphics", "non-slip decals", "wayfinding", "retail floor", "event floor graphics"],
  },

  // -- Vinyl Lettering --
  "vinyl-lettering": {
    description:
      "Custom vinyl lettering cut from single-colour premium vinyl sheets — no printing involved. Delivers crisp, clean text for business names, storefronts, vehicle doors, and wall displays with excellent water and weather resistance.",
    keywords: ["vinyl lettering", "cut vinyl letters", "business lettering", "storefront lettering", "vehicle lettering", "wall lettering", "custom text decals"],
  },
  "transfer-vinyl-lettering": {
    description:
      "Transfer vinyl lettering with application tape for easy, precise positioning. Pre-spaced characters transfer as one piece for professional results on walls, windows, vehicles, and signs. Weather-resistant for both indoor and outdoor use.",
    keywords: ["transfer lettering", "vinyl transfer", "pre-spaced lettering", "application tape lettering", "vehicle lettering", "sign lettering"],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // BANNERS & DISPLAYS
  // ═══════════════════════════════════════════════════════════════════════
  "vinyl-banner-13oz": {
    description:
      "Professional 13oz vinyl banners with vivid, full-colour printing on heavy-duty scrim vinyl. Wind-resistant with reinforced edges for outdoor events, storefronts, trade shows, and construction site branding. Available with grommets, pole pockets, or hem finishing.",
    keywords: ["vinyl banners", "13oz banner", "outdoor banners", "event banners", "trade show banners", "custom banners", "large format printing"],
  },
  "vinyl-banners": {
    description:
      "Custom vinyl banners printed on durable, weather-resistant material for indoor and outdoor use. High-resolution printing captures every detail of your design. Perfect for grand openings, sales events, construction sites, and outdoor advertising.",
    keywords: ["vinyl banners", "custom banners", "outdoor banners", "indoor banners", "event banners", "advertising banners", "promotional banners"],
  },
  "mesh-banner": {
    description:
      "Wind-proof mesh banners with micro-perforated material that allows air to pass through, reducing wind load by up to 70%. Ideal for building wraps, fence banners, and high-wind outdoor locations where solid banners would be damaged.",
    keywords: ["mesh banners", "wind proof banners", "perforated banners", "fence banners", "building wraps", "outdoor mesh", "wind resistant"],
  },
  "mesh-banners": {
    description:
      "Durable mesh banners designed for windy outdoor environments. The perforated material reduces wind resistance while maintaining vivid print quality. Perfect for construction fencing, building facades, and large-scale outdoor advertising.",
    keywords: ["mesh banners", "outdoor mesh banners", "wind resistant banners", "construction banners", "fence banners", "perforated banners"],
  },
  "blockout-banners": {
    description:
      "Premium blockout banners with an opaque middle layer that prevents light bleed-through. Double-sided printing capability allows different designs on each side. Essential for window displays, hanging banners, and backlit environments.",
    keywords: ["blockout banners", "double sided banners", "opaque banners", "hanging banners", "light blocking", "window banners"],
  },
  "double-sided-banners": {
    description:
      "Double-sided printed banners visible from both directions, maximizing exposure at events, trade shows, and street-side locations. Printed on blockout material to prevent show-through between sides.",
    keywords: ["double sided banners", "two sided banners", "blockout banners", "event banners", "trade show banners", "street banners"],
  },
  "pole-banners": {
    description:
      "Street-style pole banners designed to mount on light poles and street fixtures. Durable outdoor vinyl with reinforced pole pockets for secure, professional installation. Creates impactful brand presence along streetscapes and parking lots.",
    keywords: ["pole banners", "street banners", "light pole banners", "boulevard banners", "street advertising", "municipal banners"],
  },
  "canvas-prints": {
    description:
      "Gallery-quality canvas prints on premium artist-grade canvas with archival inks. Stretched over solid wood frames for ready-to-hang display. Perfect for photo enlargements, art reproductions, corporate décor, and retail displays.",
    keywords: ["canvas prints", "canvas art", "photo canvas", "gallery prints", "wall art", "stretched canvas", "art prints"],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // DISPLAY STANDS & HARDWARE
  // ═══════════════════════════════════════════════════════════════════════
  "a-frame-stand": {
    description:
      "Portable A-frame display stand with double-sided visibility for maximum foot traffic engagement. Lightweight aluminum frame folds flat for easy transport and storage. Ideal for sidewalk advertising, trade shows, and retail promotions.",
    keywords: ["A-frame stand", "sidewalk sign", "portable display", "double sided sign", "sandwich board", "trade show display"],
  },
  "a-frame-sign-stand": {
    description:
      "Durable A-frame sidewalk stand with interchangeable graphic panels. Weather-resistant construction for outdoor use in front of shops, restaurants, and event venues. Easy snap-in graphic change for seasonal promotions.",
    keywords: ["A-frame sign", "sidewalk stand", "outdoor sign stand", "restaurant sign", "shop sign", "changeable display"],
  },
  "roll-up-banners": {
    description:
      "Professional roll-up banner stands with retractable mechanism for quick setup and teardown. Premium print quality on wrinkle-resistant media. The go-to portable display for trade shows, conferences, lobbies, and retail environments.",
    keywords: ["roll up banners", "retractable banners", "pull up banners", "trade show displays", "portable banners", "banner stands"],
  },
  "pull-up-banner": {
    description:
      "Easy-to-use pull-up banner with spring-loaded retractable mechanism. Sets up in seconds without tools — simply pull the graphic up and lock into place. Professional presentation for events, offices, and retail spaces.",
    keywords: ["pull up banner", "retractable banner", "pop up banner", "portable display", "trade show banner", "event banner"],
  },
  "deluxe-rollup-banner": {
    description:
      "Premium deluxe roll-up banner stand with wide base, adjustable height, and heavy-duty retractable mechanism. Superior stability and professional appearance for high-end trade shows, corporate events, and permanent lobby displays.",
    keywords: ["deluxe roll up banner", "premium banner stand", "wide base banner", "adjustable banner", "corporate display", "trade show display"],
  },
  "retractable-banner-stand-premium": {
    description:
      "Premium retractable banner stand with chrome-finish hardware and padded carry case. Features adjustable pole height and interchangeable graphic cassette for easy updates. Built for frequent use at events and exhibitions.",
    keywords: ["retractable banner stand", "premium banner", "chrome banner stand", "exhibition display", "portable display", "professional banner"],
  },
  "l-base-banner-stand": {
    description:
      "Compact L-base banner stand with a sleek, low-profile foot for tight spaces. Ideal for point-of-sale displays, reception areas, and alongside product showcases where floor space is limited.",
    keywords: ["L-base banner", "compact banner stand", "point of sale display", "reception display", "slim banner stand", "narrow banner"],
  },
  "banner-stand-l-base": {
    description:
      "L-base banner stand hardware with a slim, space-efficient design. The angled base tucks neatly against walls and counters. Pairs with custom-printed banners for professional point-of-purchase and lobby displays.",
    keywords: ["L-base stand", "banner hardware", "slim banner stand", "lobby display", "POP display", "banner stand hardware"],
  },
  "banner-stand-rollup": {
    description:
      "Standard roll-up banner stand hardware with reliable spring-loaded retraction mechanism. Lightweight aluminum construction with padded carry bag for easy transport between events and locations.",
    keywords: ["roll up stand", "banner stand hardware", "retractable stand", "portable stand", "trade show hardware", "banner display"],
  },
  "roll-up-stand-hardware": {
    description:
      "Roll-up banner stand hardware kit including adjustable aluminum pole, retractable base unit, and carry bag. Compatible with standard banner widths. No graphic included — order separately or use with existing prints.",
    keywords: ["banner stand hardware", "roll up hardware", "retractable hardware", "banner stand kit", "display hardware"],
  },
  "feather-flag": {
    description:
      "Eye-catching feather flag with a tall, curved shape that flutters in the breeze to attract attention. Dye-sublimation printing on knitted polyester delivers vibrant, double-sided visible graphics. Perfect for outdoor events, car lots, and storefront advertising.",
    keywords: ["feather flag", "flutter flag", "swooper flag", "outdoor flag", "advertising flag", "event flag", "promotional flag"],
  },
  "feather-flags": {
    description:
      "Custom feather flags available in multiple sizes for maximum outdoor visibility. The teardrop-shaped design catches wind from any direction, creating constant motion that draws attention to your business or event.",
    keywords: ["feather flags", "custom flags", "outdoor flags", "business flags", "event flags", "advertising flags", "beach flags"],
  },
  "feather-flag-medium": {
    description:
      "Medium-sized feather flag standing approximately 10ft tall — the versatile middle ground between portability and visibility. Perfect for storefront entrances, farmers markets, and mid-size event spaces.",
    keywords: ["medium feather flag", "10ft flag", "storefront flag", "market flag", "mid-size flag", "outdoor advertising"],
  },
  "feather-flag-large": {
    description:
      "Large feather flag standing over 14ft tall for maximum visibility from a distance. Commands attention at outdoor events, car dealerships, grand openings, and roadside advertising. Visible from across parking lots and busy streets.",
    keywords: ["large feather flag", "14ft flag", "tall flag", "outdoor advertising", "car lot flag", "grand opening flag", "roadside flag"],
  },
  "feather-flag-pole-set": {
    description:
      "Complete feather flag pole set including sectional aluminum/fiberglass pole, ground spike, and cross base. Compatible with standard feather flag sizes. Quick assembly without tools for rapid deployment at events.",
    keywords: ["flag pole set", "feather flag hardware", "flag pole kit", "ground spike", "cross base", "flag accessories"],
  },
  "flag-bases-cross": {
    description:
      "Heavy-duty cross base for feather flags and teardrop banners. Weighted design keeps flags stable on hard surfaces like sidewalks, patios, and exhibition floors. Folds flat for easy transport.",
    keywords: ["flag cross base", "flag base", "weighted base", "indoor flag base", "exhibition flag base", "flag stand"],
  },
  "flag-base-ground-stake": {
    description:
      "Steel ground stake for securing feather flags in soft ground. Simply push into grass, soil, or sand for stable outdoor flag display at events, open houses, and curbside advertising.",
    keywords: ["ground stake", "flag ground stake", "flag spike", "outdoor flag mount", "lawn flag holder", "soil stake"],
  },
  "flag-base-water-bag": {
    description:
      "Water-fillable flag base bag for feather flags on hard surfaces where ground stakes can't be used. Fill with water or sand for weighted stability. Portable and reusable for indoor/outdoor events.",
    keywords: ["water bag base", "flag water base", "weighted flag base", "portable flag base", "sand bag base", "flag weight"],
  },
  "step-repeat-backdrops": {
    description:
      "Professional step & repeat backdrop with seamless logo pattern printing. The media industry standard for red carpet events, press conferences, photo ops, and sponsored events. Available in custom sizes with wrinkle-resistant fabric.",
    keywords: ["step and repeat", "backdrop banner", "red carpet backdrop", "press conference backdrop", "photo backdrop", "event backdrop", "media wall"],
  },
  "step-repeat-backdrop-8x8": {
    description:
      "8×8ft step & repeat backdrop — the industry-standard size for red carpet photo opportunities. Wrinkle-resistant fabric with edge-to-edge printing. Creates professional photo moments at galas, premieres, and corporate events.",
    keywords: ["8x8 backdrop", "step repeat 8x8", "photo backdrop", "red carpet backdrop", "gala backdrop", "corporate event backdrop"],
  },
  "step-and-repeat-stand-kit": {
    description:
      "Complete step & repeat stand kit including telescoping aluminum frame and carry bag. Adjustable to multiple backdrop sizes. Quick assembly with no tools required — sets up in minutes at any event venue.",
    keywords: ["backdrop stand", "step repeat stand", "backdrop frame", "telescoping stand", "event stand kit", "backdrop hardware"],
  },
  "backdrop-stand-hardware": {
    description:
      "Adjustable backdrop stand hardware with telescoping crossbar and support poles. Fits various backdrop widths and heights. Sturdy construction supports fabric, vinyl, and mesh backdrop materials.",
    keywords: ["backdrop stand", "backdrop hardware", "adjustable stand", "crossbar stand", "backdrop frame", "display hardware"],
  },
  "popup-display-curved-8ft": {
    description:
      "8ft curved pop-up display with seamless fabric graphic that creates an elegant, flowing backdrop. Magnetic frame assembly snaps together in minutes. Includes carry case that doubles as a podium counter.",
    keywords: ["curved pop up display", "8ft display", "trade show display", "fabric display", "pop up booth", "exhibition display", "curved backdrop"],
  },
  "popup-display-straight-8ft": {
    description:
      "8ft straight pop-up display with flat, wall-like fabric graphic panel. Clean, professional appearance for trade show booths, conference backdrops, and retail environments. Tool-free magnetic frame assembly.",
    keywords: ["straight pop up display", "8ft display", "trade show booth", "exhibition display", "flat backdrop", "conference display"],
  },
  "media-wall-pop-up": {
    description:
      "Large-format media wall pop-up frame for press conferences, product launches, and high-profile events. Creates an impressive branded backdrop visible in photos and video coverage. Quick setup with tool-free magnetic connectors.",
    keywords: ["media wall", "pop up media wall", "press wall", "event branding", "product launch backdrop", "branded wall"],
  },
  "pillowcase-display-frame": {
    description:
      "Pillowcase-style display frame where the fabric graphic simply slides over the frame like a pillowcase. Wrinkle-free tension fabric creates a clean, professional look. Graphics are machine-washable and easy to swap.",
    keywords: ["pillowcase display", "tension fabric display", "fabric frame", "trade show display", "washable display", "easy swap display"],
  },
  "tent-frame-10x10": {
    description:
      "Heavy-duty 10×10ft canopy tent frame with commercial-grade aluminum construction. Designed for outdoor events, farmers markets, and trade shows. Features adjustable leg heights and easy pop-up deployment.",
    keywords: ["canopy tent frame", "10x10 tent", "pop up tent", "event tent", "trade show tent", "outdoor canopy", "market tent"],
  },
  "tent-walls-set": {
    description:
      "Custom-printed canopy tent side wall set for 10×10ft frames. Full-colour graphics on weather-resistant fabric provide branding visibility from all sides. Includes zippered doorway panel for easy access.",
    keywords: ["tent walls", "canopy walls", "tent side panels", "branded tent", "custom tent walls", "event tent walls"],
  },
  "outdoor-canopy-tent-10x10": {
    description:
      "Complete 10×10ft outdoor canopy tent with custom-printed top and optional side walls. Commercial-grade aluminum frame with UV-resistant, waterproof canopy. The ultimate portable branding solution for outdoor events.",
    keywords: ["outdoor canopy tent", "10x10 canopy", "custom tent", "branded tent", "event canopy", "market tent", "outdoor shelter"],
  },
  "branded-table-cover-6ft": {
    description:
      "Custom branded 6ft table cover with full-colour, edge-to-edge printing. Transforms standard folding tables into professional branded displays. Wrinkle-resistant, machine-washable fabric with fitted or draped options.",
    keywords: ["table cover", "branded table cloth", "6ft table cover", "trade show table", "custom table cover", "event table cover"],
  },
  "branded-table-runner": {
    description:
      "Custom branded table runner that drapes over the front of any table for professional branding. Full-colour printing on wrinkle-resistant fabric. A cost-effective alternative to full table covers that works with any table cloth.",
    keywords: ["table runner", "branded table runner", "trade show runner", "event table runner", "custom table runner", "table display"],
  },
  "table-cloth": {
    description:
      "Custom printed table cloth with vibrant, full-coverage graphics. Available in fitted and throw styles for 4ft, 6ft, and 8ft tables. Durable, wrinkle-resistant polyester fabric that's machine-washable for repeated use.",
    keywords: ["custom table cloth", "branded table cloth", "trade show table cover", "printed table cloth", "event table cloth"],
  },
  "tabletop-banner-a3": {
    description:
      "Compact A3-size tabletop banner stand for countertop and desk displays. Retractable mechanism works like a full-size banner stand in miniature. Perfect for reception desks, checkout counters, and tabletop presentations.",
    keywords: ["tabletop banner", "A3 banner", "counter display", "desk banner", "small banner stand", "reception display", "countertop sign"],
  },
  "deluxe-tabletop-retractable-a3": {
    description:
      "Deluxe A3 tabletop retractable banner with premium aluminum base and adjustable height. Upgraded stability and finish for professional environments. Includes padded carry case for transport between events.",
    keywords: ["deluxe tabletop banner", "premium A3 banner", "tabletop retractable", "counter display", "professional desk banner"],
  },
  "h-stakes": {
    description:
      "Metal H-stakes for securing corrugated signs in soft ground. Simply slide your sign into the wire frame and push into grass or soil. The standard mounting solution for yard signs, real estate signs, and political signs.",
    keywords: ["H-stakes", "wire stakes", "sign stakes", "yard sign stakes", "corrugated sign holder", "lawn sign stakes", "real estate stakes"],
  },
  "h-stake-wire": {
    description:
      "Heavy-gauge wire H-stakes for yard signs and coroplast boards. Galvanized steel construction resists rust and corrosion for extended outdoor use. Available in standard heights for common sign sizes.",
    keywords: ["H-wire stake", "yard sign wire", "sign holder", "corrugated sign stake", "outdoor sign stake", "metal sign stake"],
  },
  "real-estate-frame": {
    description:
      "Professional real estate sign frame with sturdy metal construction and colonial or angle-iron style options. Designed to hold standard real estate sign panels. Weather-resistant finish for long-term outdoor display.",
    keywords: ["real estate frame", "real estate sign", "property sign frame", "for sale sign", "agent sign frame", "yard sign frame"],
  },
  "standoff-hardware-set": {
    description:
      "Decorative standoff hardware set for mounting acrylic signs, glass panels, and display boards with a floating, modern appearance. Brushed stainless steel finish adds professional elegance to lobby signs and wayfinding displays.",
    keywords: ["standoff hardware", "sign standoffs", "acrylic mount", "floating sign mount", "lobby sign hardware", "decorative mounts"],
  },
  "grommets-service": {
    description:
      "Professional grommet installation service for banners and signs. Metal grommets reinforce hanging points to prevent tearing under wind and weight stress. Available in brass and stainless steel finishes.",
    keywords: ["grommets", "banner grommets", "eyelet service", "banner hardware", "sign hanging", "grommet installation"],
  },
  "pole-pockets": {
    description:
      "Pole pocket sewing service for banners, creating fabric sleeves along the edges for sliding onto poles or dowels. Clean, hardware-free hanging method for indoor banners and street pole displays.",
    keywords: ["pole pockets", "banner pockets", "banner sleeve", "banner hanging", "pole banner hardware", "sewn pockets"],
  },
  "banner-hems": {
    description:
      "Banner hemming service for clean, reinforced edges that prevent fraying and extend banner life. Heat-welded or sewn hems available depending on banner material. Essential for outdoor and long-term indoor displays.",
    keywords: ["banner hems", "banner finishing", "banner edges", "hemming service", "banner reinforcement", "edge finishing"],
  },
  "drilled-holes-service": {
    description:
      "Precision drilled holes service for signs, acrylic panels, and display boards. Clean holes for screw mounting, standoff hardware, or cable hanging systems. Available in multiple diameter sizes.",
    keywords: ["drilled holes", "sign mounting holes", "acrylic drilling", "panel drilling", "mounting holes", "sign installation"],
  },
  "double-sided-tape": {
    description:
      "Heavy-duty double-sided mounting tape for signs, displays, and lightweight panels. Industrial adhesive bonds to most surfaces without drilling or hardware. Clean, damage-free mounting solution for retail and office environments.",
    keywords: ["double sided tape", "mounting tape", "sign tape", "display tape", "adhesive mounting", "sign installation"],
  },
  "installation-service": {
    description:
      "Professional sign and display installation service for worry-free setup. Our experienced team handles mounting, levelling, and securing your signs, banners, and displays for a polished, professional result.",
    keywords: ["installation service", "sign installation", "banner installation", "display setup", "professional mounting", "sign hanging service"],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // VEHICLE BRANDING & ADVERTISING
  // ═══════════════════════════════════════════════════════════════════════
  "full-vehicle-wrap-design-print": {
    description:
      "Complete full vehicle wrap package including custom design and premium vinyl print. Transforms your entire vehicle into a mobile billboard with edge-to-edge graphics. Professional 3M or Avery vinyl with up to 7 years outdoor durability.",
    keywords: ["full vehicle wrap", "car wrap", "vehicle graphics", "mobile advertising", "fleet wrap", "3M vinyl wrap", "car branding"],
  },
  "trailer-full-wrap": {
    description:
      "53ft trailer full wrap for maximum road-side advertising impact. Thousands of daily impressions as your trailer travels highways and city streets. Premium vinyl with UV-resistant inks for long-haul durability.",
    keywords: ["trailer wrap", "53ft trailer wrap", "truck wrap", "fleet graphics", "trailer advertising", "highway advertising"],
  },
  "fleet-graphic-package": {
    description:
      "Coordinated fleet graphic package for consistent brand identity across all your vehicles. Includes design, production, and application guidelines. Volume pricing available for fleets of any size.",
    keywords: ["fleet graphics", "fleet branding", "fleet wraps", "vehicle fleet", "commercial graphics", "fleet identity", "corporate vehicles"],
  },
  "partial-wrap-spot-graphics": {
    description:
      "Partial vehicle wrap with strategically placed spot graphics for impactful branding at a fraction of full wrap cost. Covers doors, quarter panels, and rear sections while preserving original paint.",
    keywords: ["partial wrap", "spot graphics", "half wrap", "vehicle graphics", "car decals", "partial vehicle wrap", "affordable wrap"],
  },
  "vehicle-roof-wrap": {
    description:
      "Custom vehicle roof wrap for unique aerial visibility and complete branding coverage. Premium vinyl conforms to roof contours and curves. Adds a distinctive finished look to fully or partially wrapped vehicles.",
    keywords: ["roof wrap", "vehicle roof wrap", "car roof vinyl", "roof graphics", "top wrap", "vehicle branding"],
  },
  "car-hood-decal": {
    description:
      "Custom car hood decal with high-impact, front-facing visibility. Full-colour printed or solid-colour vinyl that contours to your hood shape. Creates a bold, aggressive look for promotional vehicles and racing graphics.",
    keywords: ["hood decal", "car hood wrap", "hood graphic", "vehicle hood decal", "racing graphics", "promotional vehicle"],
  },
  "car-door-magnets-pair": {
    description:
      "Removable magnetic car door signs sold as a pair for both driver and passenger sides. Instantly brand personal vehicles for business use without permanent adhesive. Easy on, easy off — switch between personal and business use daily.",
    keywords: ["car door magnets", "magnetic car signs", "removable car signs", "vehicle magnets", "business car magnets", "door magnets"],
  },
  "magnetic-car-signs": {
    description:
      "Custom magnetic car signs that attach instantly to any steel vehicle panel. Premium full-colour printing on thick, flexible magnetic material. Easily removable — perfect for contractors, realtors, and delivery vehicles.",
    keywords: ["magnetic car signs", "car magnets", "vehicle magnets", "removable vehicle signs", "magnetic advertising", "contractor signs"],
  },
  "magnetic-rooftop-sign": {
    description:
      "Magnetic rooftop car topper sign for ride-share, delivery, and mobile advertising. Powerful magnets keep the sign secure at highway speeds. Illuminated and non-illuminated options available.",
    keywords: ["rooftop sign", "car topper", "magnetic roof sign", "delivery sign", "ride share sign", "car top advertising"],
  },
  "magnetic-truck-door-signs": {
    description:
      "Heavy-duty magnetic truck door signs for commercial vehicles. Extra-thick magnetic material grips firmly to truck doors and panels. Full-colour printing with optional reflective material for visibility at night.",
    keywords: ["truck door magnets", "magnetic truck signs", "commercial vehicle magnets", "fleet magnets", "truck advertising", "door magnets"],
  },
  "custom-cut-vinyl-lettering-any-text": {
    description:
      "Custom cut vinyl lettering in any text, font, and colour. Computer-cut from premium outdoor vinyl for crisp, clean edges. Perfect for truck doors, boat registration numbers, storefront windows, and business signage.",
    keywords: ["cut vinyl lettering", "custom lettering", "vinyl text", "business lettering", "truck lettering", "boat lettering", "sign lettering"],
  },
  "custom-truck-door-lettering-kit": {
    description:
      "Complete truck door lettering kit with company name, phone number, and DOT/MC compliance information. Pre-spaced on transfer tape for easy DIY application. Meets USDOT and Transport Canada commercial vehicle requirements.",
    keywords: ["truck door lettering", "DOT lettering", "commercial truck lettering", "fleet lettering", "USDOT compliance", "truck door kit"],
  },
  "custom-printed-vehicle-logo-decals": {
    description:
      "Custom printed full-colour vehicle logo decals for vans, trucks, and fleet vehicles. High-resolution printing captures complex logos, gradients, and photography that cut vinyl can't achieve. Premium outdoor vinyl with lamination protection.",
    keywords: ["vehicle logo decals", "van decals", "truck logo", "fleet decals", "printed vehicle graphics", "custom vehicle decals"],
  },
  "printed-truck-door-decals-full-color": {
    description:
      "Full-colour printed truck door decals with photographic quality detail. Contour-cut to your exact design shape. Premium laminated vinyl for UV protection and long-term outdoor durability on commercial vehicles.",
    keywords: ["truck door decals", "printed decals", "full colour decals", "commercial vehicle decals", "truck graphics", "door graphics"],
  },
  "trailer-box-truck-large-graphics": {
    description:
      "Large-format trailer and box truck graphics for maximum mobile advertising impact. Covers side panels, rear doors, and front headers. Industrial-grade vinyl with anti-graffiti lamination available for fleet protection.",
    keywords: ["trailer graphics", "box truck graphics", "large format vehicle", "truck side graphics", "fleet advertising", "mobile billboard"],
  },
  "truck-side-panel-printed-decal": {
    description:
      "Custom printed truck side panel decal covering the full side of your commercial vehicle. Transform blank truck panels into high-impact advertising space with photographic-quality vinyl graphics.",
    keywords: ["truck side panel", "truck decal", "side panel graphics", "commercial truck graphics", "truck advertising", "panel decal"],
  },
  "tailgate-rear-door-printed-decal": {
    description:
      "Custom tailgate and rear door decal for trucks and vans. Rear-facing graphics capture attention from following traffic. Full-colour printing with contour cut to match your vehicle's tailgate dimensions.",
    keywords: ["tailgate decal", "rear door decal", "truck tailgate", "van rear graphics", "back door decal", "rear vehicle advertising"],
  },
  "social-qr-vehicle-decals": {
    description:
      "Social media and QR code vehicle decals linking drivers to your online presence. Features scannable QR codes and social media handles with clean, modern design. Turn traffic stops into followers and customers.",
    keywords: ["QR code decals", "social media decals", "vehicle QR code", "social media vehicle", "digital decals", "contactless advertising"],
  },
  "bumper-sticker-custom": {
    description:
      "Custom bumper stickers with full-colour printing on premium outdoor vinyl. UV-protected and waterproof for years of outdoor exposure on vehicles, laptops, and equipment. Available in die-cut or standard rectangle shapes.",
    keywords: ["custom bumper sticker", "car bumper sticker", "outdoor vinyl sticker", "vehicle sticker", "waterproof sticker", "UV protected sticker"],
  },
  "boat-lettering-registration": {
    description:
      "Boat registration lettering cut from marine-grade vinyl that withstands saltwater, UV exposure, and harsh marine environments. Meets Transport Canada vessel identification requirements. Available in regulation-compliant sizes and colours.",
    keywords: ["boat lettering", "boat registration", "marine vinyl", "vessel lettering", "boat numbers", "marine decals", "watercraft lettering"],
  },
  "long-term-outdoor-vehicle-decals": {
    description:
      "Premium long-term outdoor vehicle decals engineered for 5–7 years of fade-free performance. Automotive-grade cast vinyl conforms to curves and rivets. The professional choice for permanent fleet branding.",
    keywords: ["long term decals", "outdoor vehicle decals", "cast vinyl decals", "permanent decals", "fleet decals", "durable vehicle graphics"],
  },
  "removable-promo-vehicle-decals": {
    description:
      "Removable promotional vehicle decals designed for temporary campaigns and seasonal advertising. Easy to apply and remove without damaging paint or leaving adhesive residue. Perfect for short-term promotions and event marketing.",
    keywords: ["removable decals", "temporary vehicle graphics", "promotional decals", "campaign decals", "seasonal decals", "removable vehicle wrap"],
  },
  "vehicle-wrap-print-only-quote": {
    description:
      "Vehicle wrap print-only service — we print your supplied design on premium vehicle wrap vinyl, you handle the installation. Perfect for shops with in-house installers or DIY enthusiasts with wrap experience.",
    keywords: ["vehicle wrap print", "wrap printing", "print only wrap", "DIY vehicle wrap", "vinyl wrap print", "wrap material"],
  },
  "reflective-conspicuity-tape-kit": {
    description:
      "DOT-compliant reflective conspicuity tape kit for trailers and commercial vehicles. Alternating red and white reflective segments meet FMVSS 108 requirements. Essential safety equipment for nighttime visibility of large vehicles.",
    keywords: ["reflective tape", "conspicuity tape", "DOT reflective tape", "trailer reflectors", "safety tape", "FMVSS 108"],
  },
  "reflective-safety-stripes-kit": {
    description:
      "High-visibility reflective safety stripe kit for emergency vehicles, work trucks, and fleet vehicles. Chevron and stripe patterns in fluorescent colours for maximum nighttime visibility and safety compliance.",
    keywords: ["reflective stripes", "safety stripes", "chevron decals", "high visibility", "emergency vehicle", "fleet safety", "night visibility"],
  },
  "high-visibility-rear-chevron-kit": {
    description:
      "Rear chevron kit in high-visibility fluorescent yellow/green and red for emergency and service vehicles. Retroreflective material ensures visibility at night from approaching traffic. Meets national safety marking standards.",
    keywords: ["rear chevron", "chevron kit", "emergency vehicle markings", "high visibility chevron", "reflective chevron", "safety markings"],
  },
  "stay-back-warning-decals": {
    description:
      "Stay-back warning decals for the rear of commercial trucks and trailers. Bold, visible messaging warns following vehicles to maintain safe distance. Available in standard and reflective materials for day and night visibility.",
    keywords: ["stay back decal", "warning decal", "truck warning", "safety decal", "following distance", "commercial truck safety"],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // WINDOW & GLASS FILMS
  // ═══════════════════════════════════════════════════════════════════════
  "frosted-privacy-film": {
    description:
      "Elegant frosted privacy film that mimics etched glass at a fraction of the cost. Allows natural light to pass through while blocking visibility for privacy. Perfect for office partitions, conference rooms, bathroom windows, and storefronts.",
    keywords: ["frosted film", "privacy film", "window privacy", "frosted glass film", "office privacy", "etched glass effect", "window film"],
  },
  "frosted-privacy-window-film": {
    description:
      "Premium frosted privacy window film with a smooth, uniform matte finish. Custom-cut to your exact window dimensions. Creates an upscale, professional appearance while providing essential privacy in commercial and residential spaces.",
    keywords: ["frosted window film", "privacy window film", "matte window film", "custom window film", "commercial privacy", "glass frosting"],
  },
  "frosted-matte-window-film": {
    description:
      "Matte frosted window film with a soft, translucent finish that diffuses light beautifully. Available in various opacity levels from lightly frosted to fully opaque. UV-filtering properties protect interiors from sun damage.",
    keywords: ["matte window film", "frosted matte", "translucent film", "light diffusing", "UV window film", "decorative window film"],
  },
  "frosted-static-cling": {
    description:
      "Repositionable frosted static cling film that adheres to glass without adhesive. Easy to apply, remove, and reposition — ideal for renters and temporary privacy needs. Leaves no residue when removed.",
    keywords: ["static cling", "frosted cling", "no adhesive window film", "removable window film", "temporary privacy", "repositionable film"],
  },
  "clear-static-cling": {
    description:
      "Crystal-clear static cling film for window graphics that need frequent changes. No adhesive means easy swapping of promotional graphics, seasonal décor, and event branding. Removes cleanly with zero residue.",
    keywords: ["clear static cling", "window cling", "reusable window graphic", "removable window sign", "no adhesive graphic", "changeable window"],
  },
  "perforated-window-film": {
    description:
      "One-way perforated window film that displays vivid full-colour graphics from outside while maintaining see-through visibility from inside. The tiny perforations allow natural light to enter. Industry standard for storefront advertising and vehicle rear windows.",
    keywords: ["perforated window film", "one way vision", "see through graphics", "window advertising", "storefront graphics", "window perf"],
  },
  "window-graphics-perforated": {
    description:
      "Perforated window graphics with micro-hole pattern for simultaneous exterior advertising and interior visibility. High-resolution printing on premium one-way vision vinyl. Ideal for retail storefronts, office buildings, and transit advertising.",
    keywords: ["perforated window graphics", "one way window", "storefront advertising", "see through window", "window vinyl", "retail window"],
  },
  "one-way-vision-graphics": {
    description:
      "Professional one-way vision graphics for windows — full visibility from inside, bold advertising from outside. Micro-perforated vinyl with UV-protective lamination for extended outdoor life. Available for any window size.",
    keywords: ["one way vision", "one way graphics", "window vision film", "see through advertising", "window marketing", "privacy graphics"],
  },
  "vehicle-window-tint-graphic": {
    description:
      "Perforated window tint graphic for vehicle rear and side windows. Combines privacy tinting with custom advertising graphics. Meets road safety visibility standards while maximizing brand exposure.",
    keywords: ["vehicle window tint", "car window graphic", "perforated tint", "rear window graphic", "vehicle advertising", "window tint graphic"],
  },
  "holographic-iridescent-film": {
    description:
      "Stunning holographic iridescent window film that creates rainbow prismatic effects when light passes through. Transforms ordinary glass into an eye-catching, colour-shifting display. Popular for retail storefronts, salons, and creative spaces.",
    keywords: ["holographic film", "iridescent window film", "rainbow film", "prismatic film", "decorative window", "colour shifting film"],
  },
  "window-cut-vinyl-lettering": {
    description:
      "Precision-cut vinyl lettering for windows, glass doors, and storefronts. Clean, professional appearance without the printed background of full decals. Available in hundreds of colours including metallic and frosted finishes.",
    keywords: ["window lettering", "cut vinyl letters", "glass lettering", "storefront letters", "door lettering", "vinyl window text"],
  },
  "window-lettering-cut-vinyl": {
    description:
      "Custom cut vinyl window lettering for business hours, company names, and branded messaging on glass surfaces. Weather-resistant outdoor vinyl in your choice of colour and font. Easy DIY application with transfer tape.",
    keywords: ["window vinyl lettering", "business window text", "glass door lettering", "shop window letters", "custom window text"],
  },
  "window-lettering-business": {
    description:
      "Professional business window lettering including company name, hours of operation, and contact information. Pre-designed layouts available or fully custom typography. The essential finishing touch for professional storefronts.",
    keywords: ["business window lettering", "store hours lettering", "business name vinyl", "storefront text", "professional window signs"],
  },
  "storefront-hours-door-decal-cut-vinyl": {
    description:
      "Custom storefront hours and door decal in precision-cut vinyl. Displays business hours, contact info, and payment methods on your entry door or window. Professional, clean appearance that's easy to update as hours change.",
    keywords: ["store hours decal", "door decal", "business hours sign", "storefront hours", "opening hours vinyl", "door sign"],
  },
  "color-white-on-clear-vinyl": {
    description:
      "Colour plus white ink printed on clear vinyl for vibrant, opaque graphics on glass surfaces. The white ink layer blocks glass transparency where needed while clear areas remain see-through. Perfect for complex window designs.",
    keywords: ["white ink on clear vinyl", "clear window graphics", "opaque window graphics", "CMYK white vinyl", "glass graphics"],
  },
  "color-white-color-clear-vinyl": {
    description:
      "Colour + white + colour on clear vinyl with sandwich white layer for double-sided window visibility. Graphics are vivid and opaque from both inside and outside the glass. The premium solution for two-way window advertising.",
    keywords: ["double sided window graphic", "sandwich white", "two way window vinyl", "dual facing graphic", "clear vinyl both sides"],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // OUTDOOR SIGNAGE & RIGID SIGNS
  // ═══════════════════════════════════════════════════════════════════════
  "coroplast-signs": {
    description:
      "Lightweight corrugated plastic (Coroplast) signs for short to medium-term outdoor use. Waterproof, durable, and affordable — the go-to choice for yard signs, real estate signs, political campaigns, and event directional signage.",
    keywords: ["coroplast signs", "corrugated plastic signs", "yard signs", "real estate signs", "political signs", "temporary signs", "lawn signs"],
  },
  "yard-signs": {
    description:
      "Custom yard signs on durable corrugated plastic with full-colour digital printing. Weather-resistant for outdoor use with H-stake mounting. The affordable, effective solution for real estate, elections, events, and local business advertising.",
    keywords: ["yard signs", "lawn signs", "outdoor signs", "real estate signs", "campaign signs", "directional signs", "custom yard signs"],
  },
  "foam-board-signs": {
    description:
      "Lightweight foam board signs with rigid, smooth surface for high-quality indoor displays. Perfect for point-of-purchase displays, presentations, trade show graphics, and photo mounting. Available in white and black core options.",
    keywords: ["foam board signs", "foam core signs", "indoor signs", "POP display", "presentation board", "trade show signs", "mounted prints"],
  },
  "acrylic-signs": {
    description:
      "Premium acrylic (Plexiglass) signs with a sleek, modern, glass-like appearance. Available in clear, frosted, and coloured options with polished edges. Perfect for lobby signs, office directories, wayfinding, and upscale retail displays.",
    keywords: ["acrylic signs", "plexiglass signs", "glass signs", "lobby signs", "office signs", "modern signs", "clear signs", "wayfinding"],
  },
  "aluminum-signs": {
    description:
      "Durable aluminum signs built to withstand years of outdoor exposure. Rust-proof, lightweight, and rigid — ideal for parking signs, directional signs, address plaques, and permanent outdoor identification signage.",
    keywords: ["aluminum signs", "metal signs", "outdoor metal signs", "parking signs", "directional signs", "durable signs", "rust proof signs"],
  },
  "acm-dibond-signs": {
    description:
      "ACM (Aluminum Composite Material) / Dibond signs combining two aluminum sheets with a solid polyethylene core. Extremely rigid yet lightweight with a premium flat finish. The professional choice for exterior building signage and architectural applications.",
    keywords: ["ACM signs", "Dibond signs", "aluminum composite", "building signs", "architectural signs", "exterior signs", "composite signs"],
  },
  "a-frame-signs": {
    description:
      "Portable A-frame sidewalk signs that fold flat for easy storage and transport. Double-sided display for maximum visibility from both directions. Available in corrugated plastic or aluminum with interchangeable graphic panels.",
    keywords: ["A-frame signs", "sandwich board signs", "sidewalk signs", "portable signs", "folding signs", "double sided signs", "sidewalk advertising"],
  },
  "backdrop-board-signs": {
    description:
      "Large backdrop board signs for events, photo opportunities, and stage backgrounds. Printed on rigid substrate with seamless panel joining for oversized displays. Easy setup with stand or wall mounting options.",
    keywords: ["backdrop boards", "event backdrop", "photo backdrop sign", "stage backdrop", "display boards", "large format signs"],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // MARKETING MATERIALS & CUSTOM PRINTING
  // ═══════════════════════════════════════════════════════════════════════
  "business-cards": {
    description:
      "Professional custom business cards on premium cardstock. Available in Standard Matte 250gsm, Royal Extra White 400gsm, and Vintage Kraft 300gsm. Special finishes include foil stamping, embossing, rounded corners, and spot UV coating.",
    keywords: ["business cards", "custom business cards", "premium business cards", "business card printing", "networking cards", "professional cards", "card printing Canada"],
  },
  "hang-tags": {
    description:
      "Custom printed hang tags for apparel, jewelry, luggage, and specialty products. Available on premium cardstocks with punch hole, string, and fold options. Special finishes include foil stamping and emboss/deboss for a luxurious tactile experience.",
    keywords: ["hang tags", "custom hang tags", "clothing tags", "product tags", "jewelry tags", "price tags", "brand tags", "swing tags"],
  },
  "postcards": {
    description:
      "Full-colour custom postcards on thick, premium cardstock. Double-sided printing with gloss or matte finish options. Perfect for direct mail campaigns, event invitations, promotional handouts, and leave-behind marketing materials.",
    keywords: ["postcards", "custom postcards", "direct mail", "postcard printing", "promotional postcards", "marketing postcards", "mailing cards"],
  },
  "flyers": {
    description:
      "High-quality custom flyers with vibrant full-colour printing on premium paper stock. Available in multiple sizes with gloss, matte, and uncoated options. Effective for event promotion, product announcements, and local marketing campaigns.",
    keywords: ["flyers", "custom flyers", "flyer printing", "promotional flyers", "event flyers", "marketing flyers", "handout flyers"],
  },
  "brochures": {
    description:
      "Custom printed brochures with professional fold options including bi-fold, tri-fold, and Z-fold. Full-colour printing on premium paper delivers a polished, informative marketing piece for product lines, services, and corporate information.",
    keywords: ["brochures", "custom brochures", "tri-fold brochures", "bi-fold brochures", "marketing brochures", "product brochures", "corporate brochures"],
  },
  "booklets": {
    description:
      "Custom printed booklets with saddle-stitch or perfect binding. Ideal for product catalogs, event programs, training manuals, and company magazines. Full-colour throughout with professional cover options.",
    keywords: ["booklets", "custom booklets", "product catalogs", "event programs", "printed booklets", "booklet printing", "catalog printing"],
  },
  "letterhead": {
    description:
      "Professional custom letterhead printed on premium paper stock for official correspondence, invoices, and contracts. Consistent branding across all your business documents builds trust and professionalism.",
    keywords: ["letterhead", "custom letterhead", "business letterhead", "corporate stationery", "branded letterhead", "official paper"],
  },
  "certificates": {
    description:
      "Custom printed certificates on premium heavyweight paper with optional foil stamping, embossing, and security features. Professional appearance for awards, achievements, diplomas, and official recognition documents.",
    keywords: ["certificates", "custom certificates", "award certificates", "diploma printing", "recognition certificates", "achievement awards"],
  },
  "envelopes": {
    description:
      "Custom printed envelopes in standard business sizes with full-colour branding. Available in window and non-window styles. Matching your letterhead and business cards for a cohesive, professional stationery suite.",
    keywords: ["custom envelopes", "printed envelopes", "business envelopes", "branded envelopes", "envelope printing", "window envelopes"],
  },
  "door-hangers": {
    description:
      "Custom door hangers on thick cardstock with die-cut handle hole. An effective, direct-to-door marketing tool that demands attention. Perfect for real estate, hospitality, restaurant promotions, and local service advertising.",
    keywords: ["door hangers", "custom door hangers", "door hanger printing", "real estate door hangers", "hotel door hangers", "marketing door hangers"],
  },
  "presentation-folders": {
    description:
      "Professional presentation folders with custom printing and interior pockets for documents. Available with business card slits and multiple pocket configurations. Makes a strong first impression at meetings and proposals.",
    keywords: ["presentation folders", "custom folders", "pocket folders", "corporate folders", "business folders", "document folders"],
  },
};

// ── Main update function ────────────────────────────────────────────────
async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, slug: true, name: true, category: true, description: true, keywords: true },
  });

  console.log(`Found ${products.length} products in database\n`);

  let updated = 0;
  let skipped = 0;

  for (const product of products) {
    const content = contentMap[product.slug];
    if (!content) {
      skipped++;
      continue;
    }

    const data = {};

    // Update description if we have a better one
    if (content.description) {
      data.description = content.description;
    }

    // Update keywords (currently all empty)
    if (content.keywords && content.keywords.length > 0) {
      data.keywords = content.keywords;
    }

    if (Object.keys(data).length > 0) {
      await prisma.product.update({
        where: { id: product.id },
        data,
      });
      updated++;
      console.log(`✓ ${product.slug} — description + ${(content.keywords || []).length} keywords`);
    }
  }

  console.log(`\nDone: ${updated} products updated, ${skipped} products without content mapping`);

  // Also generate keywords for products that weren't explicitly mapped
  // by deriving keywords from product name and category
  const remaining = products.filter((p) => !contentMap[p.slug]);
  let autoKeyworded = 0;

  for (const product of remaining) {
    // Generate keywords from product name and category
    const nameWords = product.name
      .toLowerCase()
      .replace(/[—–\-()]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2);

    const categoryWords = product.category
      .replace(/[-_]/g, " ")
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);

    const keywords = [
      product.name.toLowerCase(),
      `custom ${product.name.toLowerCase()}`,
      ...new Set([...categoryWords]),
      `${product.name.toLowerCase()} Canada`,
      "custom printing",
    ];

    // Deduplicate
    const uniqueKeywords = [...new Set(keywords)].slice(0, 10);

    await prisma.product.update({
      where: { id: product.id },
      data: { keywords: uniqueKeywords },
    });
    autoKeyworded++;
  }

  console.log(`Auto-generated keywords for ${autoKeyworded} remaining products`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
