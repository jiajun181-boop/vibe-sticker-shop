/**
 * SEO scene page configuration.
 * Maps use-case slugs (e.g. "candle-labels") to content + product defaults.
 */

const SCENE_PAGES = {
  // ── Label scenes ──
  "candle-labels": {
    category: "custom-stickers",
    variantParent: "labels",
    defaultVariantSlug: "roll-labels",
    title: "Custom Candle Labels",
    metaTitle: "Custom Candle Labels | Waterproof, Tear-Proof BOPP | La Lunar Printing",
    metaDescription:
      "Design and order custom candle labels. Heat-resistant, waterproof BOPP material that won't peel or warp. Perfect for soy, beeswax, and container candles.",
    content: {
      intro:
        "Create premium labels for your candle line. Our BOPP labels are waterproof, tear-proof, and heat-resistant \u2014 they stay perfect even near warm wax. Available on rolls for easy application.",
      features: [
        "Heat-resistant BOPP material rated for candle containers",
        "Waterproof & oil-resistant \u2014 no smudging or peeling",
        "Full-colour printing with vibrant, fade-proof inks",
        "Rolls of 500 to 10,000 for production efficiency",
        "Custom shapes: round, oval, rectangle, or die-cut",
      ],
      faq: [
        { q: "Will the labels withstand heat from burning candles?", a: "Yes. Our BOPP labels are rated for continuous exposure up to 80\u00b0C (176\u00b0F), well above the typical candle container temperature." },
        { q: "What finish options are available?", a: "We offer glossy, matte, and soft-touch matte lamination. Most candle makers prefer matte for an artisan look." },
        { q: "Can I order a small test run?", a: "Absolutely. Our minimum order is 500 labels, perfect for testing a new scent line before scaling up." },
      ],
    },
  },
  "brewery-labels": {
    category: "custom-stickers",
    variantParent: "labels",
    defaultVariantSlug: "roll-labels",
    title: "Custom Brewery Labels",
    metaTitle: "Custom Brewery Labels | Beer & Craft Beverage Labels | La Lunar Printing",
    metaDescription:
      "Order custom brewery labels for craft beer, cider, and kombucha. Waterproof BOPP and kraft paper options. Ice-bucket rated and FDA-compliant.",
    content: {
      intro:
        "Stand out on the shelf with custom brewery labels. Our waterproof BOPP labels survive ice buckets, condensation, and cooler storage without peeling or fading.",
      features: [
        "Ice-bucket rated \u2014 waterproof BOPP survives condensation",
        "Scuff-resistant lamination for retail shelf life",
        "Kraft paper option for a craft/artisan aesthetic",
        "Full-colour + white ink printing on clear material",
        "CFIA & FDA-compliant adhesive for beverage containers",
      ],
      faq: [
        { q: "Will the labels survive an ice bucket?", a: "Yes. Our BOPP labels are fully waterproof and adhesive-rated for wet and cold conditions, including ice buckets and refrigeration." },
        { q: "Do you print nutrition facts and UPC codes?", a: "Absolutely. We print high-resolution barcodes, nutrition panels, and government-required text at no extra charge." },
        { q: "What sizes work best for beer bottles?", a: "Standard 12 oz bottles typically use 3\" x 4\" or 2\" x 4\" labels. We can cut any custom size to fit your bottle shape." },
      ],
    },
  },
  "food-labels": {
    category: "custom-stickers",
    variantParent: "labels",
    defaultVariantSlug: "roll-labels",
    title: "Custom Food Labels",
    metaTitle: "Custom Food Labels | FDA-Compliant, Waterproof | La Lunar Printing",
    metaDescription:
      "Order custom food labels with FDA-compliant adhesive. Waterproof, freezer-safe BOPP for packaged food, baked goods, sauces, and meal prep.",
    content: {
      intro:
        "Professional food labels printed on FDA-compliant, food-safe materials. Our BOPP labels are waterproof, oil-resistant, and freezer-rated \u2014 perfect for any food product.",
      features: [
        "FDA-compliant adhesive for direct food contact",
        "Freezer-rated to -40\u00b0C without peeling",
        "Oil & moisture resistant for sauces and condiments",
        "High-resolution printing for nutrition panels & barcodes",
        "Custom die-cut shapes for any container",
      ],
      faq: [
        { q: "Are these labels safe for food packaging?", a: "Yes. We use FDA-compliant adhesive that is rated for indirect food contact, suitable for all packaged food products." },
        { q: "Can the labels go in the freezer?", a: "Our BOPP labels are rated to -40\u00b0C and will not peel, crack, or curl in freezer conditions." },
        { q: "Do you offer ingredient list and allergen printing?", a: "Yes. We print full nutrition facts, ingredient lists, and allergen warnings in any required format at no additional cost." },
      ],
    },
  },
  "cosmetic-labels": {
    category: "custom-stickers",
    variantParent: "labels",
    defaultVariantSlug: "clear-labels",
    title: "Cosmetic & Beauty Labels",
    metaTitle: "Cosmetic & Beauty Labels | Premium Clear & White BOPP | La Lunar Printing",
    metaDescription:
      "Custom cosmetic labels for skincare, makeup, and beauty products. Clear BOPP for a no-label look, oil-resistant, and waterproof.",
    content: {
      intro:
        "Elevate your beauty brand with premium cosmetic labels. Our clear BOPP creates a stunning no-label look, while white BOPP delivers vibrant colours. Both are oil-resistant and waterproof.",
      features: [
        "Clear BOPP for a premium no-label glass look",
        "Oil, lotion, and alcohol resistant adhesive",
        "Soft-touch matte or high-gloss lamination",
        "Full-colour + white ink on transparent material",
        "Custom shapes to match any bottle or jar",
      ],
      faq: [
        { q: "Will the labels resist oils and lotions?", a: "Yes. Our BOPP material and adhesive are specifically rated for cosmetic products including oils, creams, and alcohol-based products." },
        { q: "Can I get a transparent label?", a: "Absolutely. Our clear BOPP labels create a beautiful no-label look that lets your product show through. We print with white ink underneath colours for opacity." },
        { q: "What's the minimum order for cosmetic labels?", a: "Our minimum is 500 labels on rolls, ideal for small-batch beauty brands launching new products." },
      ],
    },
  },
  "jar-labels": {
    category: "custom-stickers",
    variantParent: "labels",
    defaultVariantSlug: "roll-labels",
    title: "Custom Jar Labels",
    metaTitle: "Custom Jar Labels | Waterproof Labels for Jars | La Lunar Printing",
    metaDescription:
      "Order custom jar labels for honey, jam, candles, cosmetics, and more. Waterproof BOPP and kraft paper. Curved surface compatible.",
    content: {
      intro:
        "Beautiful custom labels designed for jars of all sizes. Our flexible BOPP material conforms smoothly to curved surfaces without bubbling or wrinkling.",
      features: [
        "Flexible material conforms to curved jar surfaces",
        "Waterproof and dishwasher-safe adhesive",
        "Kraft paper option for a rustic, artisan look",
        "Round, oval, and custom shapes available",
        "Rolls for hand application or automatic dispensing",
      ],
      faq: [
        { q: "Will the labels apply smoothly to curved jars?", a: "Yes. Our thin, flexible BOPP material is specifically designed to conform to curved surfaces without bubbling, wrinkling, or lifting at edges." },
        { q: "Are jar labels dishwasher safe?", a: "Our BOPP labels with permanent adhesive are rated for standard dishwasher cycles, making them ideal for reusable jars and containers." },
        { q: "Do you offer round labels for jar lids?", a: "Yes. We cut round labels in any diameter. Popular lid sizes include 2\", 2.5\", and 3\" circles." },
      ],
    },
  },

  // ── Sticker scenes ──
  "laptop-stickers": {
    category: "custom-stickers",
    variantParent: "stickers",
    defaultVariantSlug: "die-cut-singles",
    title: "Custom Laptop Stickers",
    metaTitle: "Custom Laptop Stickers | Die-Cut Vinyl, Residue-Free | La Lunar Printing",
    metaDescription:
      "Design custom laptop stickers that look amazing and remove cleanly. Die-cut vinyl, waterproof, and scratch-resistant.",
    content: {
      intro:
        "Make your laptop stand out with custom die-cut stickers. Our vinyl stickers are waterproof, scratch-resistant, and remove cleanly without residue.",
      features: [
        "Premium vinyl rated for 3-5 years outdoor durability",
        "Residue-free removal \u2014 safe for laptops and devices",
        "Scratch-resistant lamination protects the print",
        "Die-cut to any custom shape",
        "Vibrant full-colour printing with UV-resistant inks",
      ],
      faq: [
        { q: "Will laptop stickers leave residue when removed?", a: "No. Our vinyl stickers use a repositionable adhesive that removes cleanly from smooth surfaces like laptop lids, phone cases, and water bottles." },
        { q: "Are laptop stickers waterproof?", a: "Yes. Our vinyl stickers are fully waterproof and rated for outdoor use, so they'll handle rain, spills, and daily wear." },
        { q: "What's the best size for a laptop sticker?", a: "Our most popular laptop sticker sizes are 2\"x2\", 3\"x3\", and 4\"x4\". We can cut any custom size up to 53\" wide." },
      ],
    },
  },
  "logo-stickers": {
    category: "custom-stickers",
    variantParent: "stickers",
    defaultVariantSlug: "die-cut-singles",
    title: "Custom Logo Stickers",
    metaTitle: "Custom Logo Stickers | Brand Stickers for Business | La Lunar Printing",
    metaDescription:
      "Order custom logo stickers for your business. Die-cut to your logo shape, waterproof vinyl, full-colour printing. From 25 to 10,000+.",
    content: {
      intro:
        "Turn your logo into a premium die-cut sticker. Perfect for packaging, giveaways, trade shows, and brand visibility. Printed on durable vinyl that lasts for years.",
      features: [
        "Die-cut precisely to your logo shape",
        "Waterproof vinyl rated for 3-5 years",
        "Full-colour CMYK + white ink available",
        "Quantities from 25 to 10,000+",
        "Bulk discounts for larger orders",
      ],
      faq: [
        { q: "Can you cut the sticker exactly to my logo shape?", a: "Yes. We use precision die-cutting to cut around every contour of your logo. Just upload your artwork and we handle the rest." },
        { q: "What file format do you need for logo stickers?", a: "We accept PNG, PDF, AI, and SVG. For best results, provide a vector file (AI/SVG) or a high-resolution PNG with transparent background." },
        { q: "Do you offer white ink for dark backgrounds?", a: "Yes. For clear stickers with your logo, we print a white ink base layer under the colours so they pop on any surface." },
      ],
    },
  },
  "packaging-stickers": {
    category: "custom-stickers",
    variantParent: "stickers",
    defaultVariantSlug: "removable-stickers",
    title: "Packaging Seal Stickers",
    metaTitle: "Packaging Seal Stickers | Custom Brand Seals | La Lunar Printing",
    metaDescription:
      "Custom packaging seal stickers for boxes, bags, and envelopes. Kiss-cut for easy application.",
    content: {
      intro:
        "Add a branded finishing touch to every package. Our kiss-cut seal stickers peel easily from the backing sheet for fast application on boxes, tissue paper, and mailer bags.",
      features: [
        "Kiss-cut on backing sheet for fast peeling",
        "Perfect for sealing tissue paper, boxes, and bags",
        "Round, square, and custom shapes",
        "Matte or glossy finish",
        "Affordable quantities starting at 25 sheets",
      ],
      faq: [
        { q: "What adhesive do packaging seals use?", a: "Our packaging seal stickers use a permanent adhesive that bonds securely to cardboard, paper, and poly mailer bags." },
        { q: "What shape works best for packaging seals?", a: "Round seals (1.5\" to 2\" diameter) are the most popular for tissue paper and box flaps. We also do square and custom shapes." },
        { q: "Can I order a mix of designs on one sheet?", a: "Yes. Our sticker sheets can include multiple different designs \u2014 perfect for seasonal packaging or multiple product lines." },
      ],
    },
  },
  "bumper-stickers": {
    category: "custom-stickers",
    variantParent: "stickers",
    defaultVariantSlug: "die-cut-singles",
    title: "Custom Bumper Stickers",
    metaTitle: "Custom Bumper Stickers | Weatherproof Vinyl | La Lunar Printing",
    metaDescription:
      "Order custom bumper stickers printed on durable weatherproof vinyl. UV-resistant, waterproof, and rated for 5+ years outdoor use.",
    content: {
      intro:
        "Durable custom bumper stickers built to last. Printed on heavy-duty vinyl with UV-resistant inks and weatherproof lamination, rated for 5+ years of outdoor exposure.",
      features: [
        "Heavy-duty outdoor vinyl rated for 5+ years",
        "UV-resistant inks that won't fade in sunlight",
        "Waterproof and car-wash safe",
        "Standard bumper sizes or custom dimensions",
        "Die-cut, rectangle, or oval shapes",
      ],
      faq: [
        { q: "How long do bumper stickers last outdoors?", a: "Our vinyl bumper stickers with UV lamination are rated for 5+ years of outdoor exposure, including direct sunlight, rain, snow, and car washes." },
        { q: "What's the standard bumper sticker size?", a: "The most common size is 10\" x 3\", but we can print any custom size. Popular alternatives include 6\" x 4\" ovals and 8\" x 2.5\" rectangles." },
        { q: "Can bumper stickers be removed?", a: "Yes, but they use permanent adhesive for security. To remove, apply heat with a hair dryer and peel slowly. Some adhesive residue may remain." },
      ],
    },
  },

  // ── Decal scenes ──
  "wall-decals": {
    category: "custom-stickers",
    variantParent: "decals",
    defaultVariantSlug: "window-decals",
    title: "Custom Wall Decals",
    metaTitle: "Custom Wall Decals | Removable Vinyl Wall Graphics | La Lunar Printing",
    metaDescription:
      "Order custom wall decals and wall graphics. Removable vinyl that won't damage paint. Perfect for offices, retail, events, and home decor.",
    content: {
      intro:
        "Transform any wall with custom vinyl decals. Easy to apply, repositionable, and removable without damaging paint. Perfect for offices, retail stores, events, and home decor.",
      features: [
        "Removable vinyl \u2014 won't damage walls or paint",
        "Repositionable during application for perfect placement",
        "Full-colour printing on white or clear vinyl",
        "Custom sizes from 3\" to 53\" wide",
        "Indoor rated for 7+ years without fading",
      ],
      faq: [
        { q: "Will wall decals damage my paint?", a: "No. Our removable vinyl adhesive is designed to peel cleanly from painted walls without lifting paint or leaving residue. Works best on smooth, flat surfaces." },
        { q: "Can wall decals be repositioned?", a: "Yes. During application you can lift and reposition the decal for perfect placement. Once pressed firmly, the adhesive bonds securely." },
        { q: "What surfaces do wall decals work on?", a: "Wall decals adhere best to smooth, flat painted walls, glass, metal, and plastic. They are not recommended for textured, brick, or freshly painted surfaces (wait 2 weeks)." },
      ],
    },
  },
  "car-decals": {
    category: "custom-stickers",
    variantParent: "decals",
    defaultVariantSlug: "window-decals",
    title: "Custom Car Decals",
    metaTitle: "Custom Car Decals | Weatherproof Vehicle Vinyl | La Lunar Printing",
    metaDescription:
      "Order custom car decals for personal or business vehicles. Weatherproof vinyl, UV-resistant, car-wash safe. Die-cut to any shape.",
    content: {
      intro:
        "High-quality custom car decals printed on automotive-grade vinyl. UV-resistant, car-wash safe, and built to last through Canadian winters. Die-cut to any shape or size.",
      features: [
        "Automotive-grade vinyl rated for 5+ years outdoor",
        "UV and weather resistant \u2014 survives Canadian winters",
        "Car-wash safe with permanent adhesive",
        "Die-cut to any logo, text, or shape",
        "Available in white, clear, and perforated vinyl",
      ],
      faq: [
        { q: "Are car decals car-wash safe?", a: "Yes. Our automotive-grade vinyl with permanent adhesive is rated for automatic and hand car washes. We recommend waiting 48 hours after application before washing." },
        { q: "How long do car decals last?", a: "Our vinyl car decals are rated for 5-7 years of outdoor use, including UV exposure, rain, snow, and temperature extremes from -40\u00b0C to 80\u00b0C." },
        { q: "Can I get a decal for my rear window?", a: "Yes. We offer perforated vinyl (one-way vision) that lets you see out from inside while displaying your design on the outside." },
      ],
    },
  },
  "boat-decals": {
    category: "custom-stickers",
    variantParent: "decals",
    defaultVariantSlug: "window-decals",
    title: "Custom Boat Decals",
    metaTitle: "Custom Boat Decals | Marine-Grade Vinyl | La Lunar Printing",
    metaDescription:
      "Order custom boat decals and marine lettering. UV-resistant, saltwater-proof vinyl rated for marine use. Registration numbers, logos, and graphics.",
    content: {
      intro:
        "Marine-grade custom boat decals built for the water. UV-resistant, saltwater-proof, and rated for years of marine exposure. Perfect for registration numbers, boat names, and hull graphics.",
      features: [
        "Marine-grade vinyl rated for saltwater and UV exposure",
        "Waterproof adhesive designed for gelcoat and fibreglass",
        "UV-resistant inks that won't fade in direct sunlight",
        "Registration numbers in Transport Canada compliant sizing",
        "Custom graphics, logos, and lettering in any colour",
      ],
      faq: [
        { q: "Are boat decals saltwater resistant?", a: "Yes. Our marine-grade vinyl and adhesive are specifically rated for saltwater, freshwater, and UV exposure. They won't peel, crack, or fade in marine conditions." },
        { q: "Do you print Transport Canada compliant registration numbers?", a: "Yes. We print registration numbers in the required minimum 75mm (3\") height in block lettering, compliant with Transport Canada Small Vessel Regulations." },
        { q: "How do I apply decals to a boat hull?", a: "Clean the surface with rubbing alcohol, apply using the wet method (soapy water), squeegee out bubbles, and let cure for 48 hours before launching." },
      ],
    },
  },
};

/**
 * Get scene page config by slug (e.g. "candle-labels").
 */
export function getSceneConfig(slug) {
  return SCENE_PAGES[slug] ?? null;
}

/**
 * Get all scene slugs for a given variant parent.
 */
export function getScenesForVariant(variantParent) {
  return Object.entries(SCENE_PAGES)
    .filter(([, cfg]) => cfg.variantParent === variantParent)
    .map(([slug, cfg]) => ({ slug, title: cfg.title }));
}
