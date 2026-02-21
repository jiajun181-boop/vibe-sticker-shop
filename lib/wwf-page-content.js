// lib/wwf-page-content.js — Rich page content for Windows, Walls & Floors products

const WWF_CATEGORY = "windows-walls-floors";

export const WWF_PAGE_CONTENT = {
  "one-way-vision": {
    seo: {
      title: "One-Way Vision Window Film | Perforated Vinyl | La Lunar Printing",
      description: "Custom one-way vision perforated vinyl for storefronts. Full-colour graphics outside, clear view from inside. UV-protected overlaminate included.",
      keywords: ["one way vision", "perforated vinyl", "window film", "storefront graphics", "see-through window film"],
    },
    intro: {
      headline: "One-Way Vision Film",
      subtitle: "Perforated vinyl that displays your graphics on the outside while maintaining visibility from the inside. Ideal for retail storefronts, office windows, and vehicle rear windows.",
    },
    highlights: [
      { icon: "eye", text: "See-through from inside" },
      { icon: "shield", text: "UV overlaminate included" },
      { icon: "clock", text: "3\u20135 business days" },
      { icon: "check", text: "Full-colour printing" },
    ],
    tabs: {
      specifications: {
        label: "Specifications",
        rows: [
          { label: "Material", value: "Perforated vinyl (micro-hole pattern)" },
          { label: "Perforation", value: "50/50 ratio \u2014 50% ink, 50% open" },
          { label: "Printing", value: "Full-colour CMYK + white underlay" },
          { label: "Finish", value: "Overlaminate (UV protection) included" },
          { label: "Max Width", value: '53" (roll width)' },
          { label: "Max Length", value: '600" (50 ft)' },
          { label: "Application", value: "Adhesive, applied outside glass" },
          { label: "Durability", value: "2\u20133 years outdoor" },
        ],
      },
      installation: {
        label: "Installation",
        content: [
          { heading: "Surface Prep", text: "Clean glass thoroughly with isopropyl alcohol. Remove dust, grease, and residue." },
          { heading: "Wet Application", text: "Spray glass with soapy water solution. Position film and squeegee from centre outward." },
          { heading: "Trimming", text: "Allow 24 hours to set. Trim excess with a sharp blade along the glass edge." },
        ],
      },
    },
    useCases: [
      { title: "Retail Storefronts", description: "Transform shop windows into advertising space while keeping interior bright." },
      { title: "Office Privacy", description: "Brand office glass partitions while maintaining outward visibility." },
      { title: "Vehicle Rear Windows", description: "Advertise on car and van rear windows with full-colour perforated vinyl." },
    ],
    faq: [
      { q: "Can I see through one-way vision film from inside?", a: "Yes. The micro-perforations allow clear visibility from the dark (inside) side while the printed side is visible from outside." },
      { q: "How long does it last outdoors?", a: "With the included overlaminate, one-way vision film typically lasts 2\u20133 years in direct sunlight." },
      { q: "Can it be applied inside the glass?", a: "It\u2019s designed for outside application. Inside mounting reverses the see-through effect." },
    ],
  },

  "frosted-window-film": {
    seo: {
      title: "Frosted Window Film | Etched Glass Effect | La Lunar Printing",
      description: "Custom frosted window film for privacy and branding. Etched glass appearance with printed logos and designs. Professional quality, fast turnaround.",
      keywords: ["frosted window film", "etched glass film", "privacy film", "frosted vinyl", "office privacy glass"],
    },
    intro: {
      headline: "Frosted Window Film",
      subtitle: "Create an elegant etched-glass look with custom-printed frosted vinyl. Perfect for office partitions, conference rooms, and retail storefronts that need privacy without blocking light.",
    },
    highlights: [
      { icon: "eye", text: "Privacy without darkness" },
      { icon: "shield", text: "Scratch-resistant surface" },
      { icon: "clock", text: "3\u20135 business days" },
      { icon: "check", text: "Custom logos & patterns" },
    ],
    tabs: {
      specifications: {
        label: "Specifications",
        rows: [
          { label: "Material", value: "Frosted vinyl film (etched glass appearance)" },
          { label: "Printing", value: "Full-colour CMYK + white on frosted substrate" },
          { label: "Transparency", value: "Diffused \u2014 lets light through, obscures details" },
          { label: "Max Width", value: '53"' },
          { label: "Application", value: "Adhesive, inside or outside glass" },
          { label: "Durability", value: "3\u20135 years indoor, 2\u20133 years outdoor" },
        ],
      },
    },
    useCases: [
      { title: "Office Partitions", description: "Add privacy to glass conference rooms and open-plan offices." },
      { title: "Retail Branding", description: "Frosted logos and store hours on entrance doors." },
      { title: "Healthcare & Spa", description: "Privacy for treatment rooms while maintaining a bright, clean aesthetic." },
    ],
    faq: [
      { q: "Does frosted film block all visibility?", a: "No. It diffuses light and obscures details, similar to etched glass. Shapes and movement are still visible." },
      { q: "Can I print logos on frosted film?", a: "Yes. We print in full colour with a white base layer so designs show clearly on the frosted surface." },
      { q: "Is it removable?", a: "Yes. Frosted vinyl can be removed without damaging glass, though it\u2019s not repositionable like static cling." },
    ],
  },

  "static-cling": {
    seo: {
      title: "Static Cling Window Film | No Adhesive | La Lunar Printing",
      description: "Custom static cling window decals \u2014 adhesive-free, reusable, and easy to apply. Perfect for seasonal promotions and temporary window displays.",
      keywords: ["static cling", "window cling", "no adhesive decal", "reusable window film", "seasonal window display"],
    },
    intro: {
      headline: "Static Cling Film",
      subtitle: "Adhesive-free window film that clings with static electricity. Apply, remove, and reuse without residue. Ideal for seasonal promotions, temporary signage, and rental spaces.",
    },
    highlights: [
      { icon: "check", text: "No adhesive \u2014 zero residue" },
      { icon: "eye", text: "Reusable & repositionable" },
      { icon: "clock", text: "3\u20135 business days" },
      { icon: "shield", text: "Frosted or clear base" },
    ],
    tabs: {
      specifications: {
        label: "Specifications",
        rows: [
          { label: "Material", value: "Frosted static cling PVC (no adhesive)" },
          { label: "Printing", value: "Full-colour CMYK on frosted substrate" },
          { label: "Max Width", value: '47" (48" roll, 47" usable)' },
          { label: "Max Length", value: '96"' },
          { label: "Application", value: "Inside glass (static cling)" },
          { label: "Reusability", value: "Can be removed and reapplied multiple times" },
        ],
      },
    },
    useCases: [
      { title: "Seasonal Promotions", description: "Swap window displays for holidays, sales events, and seasonal campaigns." },
      { title: "Rental Properties", description: "Temporary branding for leased retail spaces without permanent adhesive." },
      { title: "Event Venues", description: "One-time event graphics that peel off cleanly after use." },
    ],
    faq: [
      { q: "How does static cling stick without adhesive?", a: "The PVC material generates a static charge that holds it to smooth glass surfaces. No glue is used." },
      { q: "How many times can I reuse it?", a: "Multiple times if stored flat between uses. Performance decreases with dust accumulation." },
      { q: "Does it work on textured glass?", a: "No. Static cling requires smooth, non-porous surfaces like flat glass or acrylic." },
    ],
  },

  "transparent-color-film": {
    seo: {
      title: "Transparent Color Window Film | Translucent Vinyl | La Lunar Printing",
      description: "Custom transparent coloured window film. Translucent printed vinyl that lets light through while displaying vibrant graphics. Ideal for window displays.",
      keywords: ["transparent window film", "translucent vinyl", "coloured window film", "stained glass effect", "light-through window graphics"],
    },
    intro: {
      headline: "Transparent Color Film",
      subtitle: "Translucent printed vinyl that lets natural light pass through while displaying vivid colours. Creates a stained-glass effect for storefronts, restaurants, and creative installations.",
    },
    highlights: [
      { icon: "eye", text: "Light passes through" },
      { icon: "check", text: "Vivid CMYK colours" },
      { icon: "clock", text: "3\u20135 business days" },
      { icon: "shield", text: "Indoor & outdoor use" },
    ],
    tabs: {
      specifications: {
        label: "Specifications",
        rows: [
          { label: "Material", value: "Translucent vinyl film" },
          { label: "Printing", value: "Full-colour CMYK (no white layer)" },
          { label: "Transparency", value: "Semi-transparent \u2014 light and colour pass through" },
          { label: "Max Width", value: '53"' },
          { label: "Application", value: "Adhesive, inside or outside glass" },
          { label: "Durability", value: "2\u20133 years outdoor" },
        ],
      },
    },
    useCases: [
      { title: "Restaurant Windows", description: "Colourful translucent graphics that glow with daylight." },
      { title: "Church & Chapel", description: "Simulated stained-glass effects on plain windows." },
      { title: "Creative Installations", description: "Art installations and museum exhibits using light and colour." },
    ],
    faq: [
      { q: "Will the colours look bright at night?", a: "Transparent film is best viewed with backlight (daylight or interior lighting). At night from outside, colours may appear muted without interior lights on." },
      { q: "Can I add white to the design?", a: "No. White areas become transparent. For opaque elements, consider combining with opaque vinyl sections." },
    ],
  },

  "blockout-vinyl": {
    seo: {
      title: "Blockout Window Vinyl | Full Coverage Graphics | La Lunar Printing",
      description: "Custom blockout vinyl for windows. Fully opaque, light-blocking window graphics with laminate options. Perfect for full-coverage storefront displays.",
      keywords: ["blockout vinyl", "opaque window film", "light blocking vinyl", "full coverage window graphics", "storefront wrap"],
    },
    intro: {
      headline: "Blockout Vinyl",
      subtitle: "Fully opaque vinyl that blocks all light and view. Ideal for full-coverage storefront displays, light-sensitive spaces, and complete window wraps.",
    },
    highlights: [
      { icon: "shield", text: "100% light blockout" },
      { icon: "check", text: "Gloss or matte laminate" },
      { icon: "clock", text: "3\u20135 business days" },
      { icon: "eye", text: "Permanent or removable" },
    ],
    tabs: {
      specifications: {
        label: "Specifications",
        rows: [
          { label: "Material", value: "Blockout vinyl (permanent adhesive)" },
          { label: "Printing", value: "Full-colour CMYK, single-sided" },
          { label: "Opacity", value: "100% \u2014 fully blocks light and view" },
          { label: "Max Width", value: '53"' },
          { label: "Finish Options", value: "Gloss laminate, matte laminate, or unlaminated" },
          { label: "Durability", value: "3\u20135 years outdoor with laminate" },
        ],
      },
    },
    useCases: [
      { title: "Storefront Wraps", description: "Full-coverage graphics that transform empty or under-construction retail spaces." },
      { title: "Photo Studios", description: "Block ambient light for controlled lighting environments." },
      { title: "Privacy Screens", description: "Complete privacy for ground-floor offices and medical facilities." },
    ],
    faq: [
      { q: "Can I see through blockout vinyl?", a: "No. Blockout vinyl is fully opaque in both directions. For see-through options, use one-way vision film." },
      { q: "Is removable blockout available?", a: "Yes. We offer both permanent and removable blockout vinyl." },
    ],
  },

  "opaque-window-graphics": {
    seo: {
      title: "Opaque Window Graphics | White Vinyl for Glass | La Lunar Printing",
      description: "Custom opaque window graphics on white vinyl. Bold, full-colour window signage, lettering, and logos applied to glass surfaces.",
      keywords: ["window graphics", "window signage", "vinyl window lettering", "window logos", "opaque window vinyl"],
    },
    intro: {
      headline: "Opaque Window Graphics",
      subtitle: "Standard white vinyl for bold window signage, logos, and lettering. Contour-cut to shape for clean, professional results on any glass surface.",
    },
    highlights: [
      { icon: "check", text: "Contour or rectangular cut" },
      { icon: "shield", text: "Laminate options available" },
      { icon: "clock", text: "3\u20135 business days" },
      { icon: "eye", text: "Vivid on white base" },
    ],
    tabs: {
      specifications: {
        label: "Specifications",
        rows: [
          { label: "Material", value: "White vinyl (calendered, permanent adhesive)" },
          { label: "Printing", value: "Full-colour CMYK on white substrate" },
          { label: "Cut Options", value: "Rectangular or contour (die-cut to shape)" },
          { label: "Max Width", value: '53"' },
          { label: "Finish Options", value: "Gloss laminate, matte laminate, or unlaminated" },
          { label: "Durability", value: "3\u20135 years outdoor with laminate" },
        ],
      },
    },
    useCases: [
      { title: "Store Hours & Info", description: "Business hours, phone numbers, and logos on entrance doors." },
      { title: "Window Lettering", description: "Cut lettering and logos for a clean, professional storefront." },
      { title: "Promotional Signage", description: "Sale announcements and seasonal promotions on retail windows." },
    ],
    faq: [
      { q: "What\u2019s the difference between this and blockout vinyl?", a: "White vinyl is a standard-weight material for typical signage. Blockout vinyl is thicker and fully blocks light \u2014 better for full-coverage wraps." },
      { q: "Can graphics be contour-cut?", a: "Yes. We offer contour cutting (die-cut to the shape of your design) or standard rectangular cut." },
    ],
  },

  "glass-waistline": {
    seo: {
      title: "Glass Waistline Strips | Safety Manifestation | La Lunar Printing",
      description: "Custom glass waistline strips for safety compliance. Decorative bands for glass doors and partitions. Frosted, coloured, or opaque options.",
      keywords: ["glass waistline", "manifestation strip", "glass safety strip", "glass door strip", "building code glass marking"],
    },
    intro: {
      headline: "Glass Waistline Strips",
      subtitle: "Decorative safety strips for glass doors and full-height partitions. Required by building codes to make glass visible and prevent collisions. Available in frosted, coloured, and opaque finishes.",
    },
    highlights: [
      { icon: "shield", text: "Building code compliant" },
      { icon: "check", text: "Multiple finishes" },
      { icon: "clock", text: "3\u20135 business days" },
      { icon: "eye", text: "Custom patterns available" },
    ],
    tabs: {
      specifications: {
        label: "Specifications",
        rows: [
          { label: "Materials", value: "Frosted film, coloured translucent, or opaque white vinyl" },
          { label: "Standard Heights", value: '4", 6", or 8" strips' },
          { label: "Length", value: "Custom \u2014 up to 50 ft continuous" },
          { label: "Patterns", value: "Solid, dots, stripes, logos, custom designs" },
          { label: "Application", value: "Adhesive, applied to glass at waist height" },
        ],
      },
    },
    useCases: [
      { title: "Office Partitions", description: "Safety compliance for glass meeting rooms and open-plan dividers." },
      { title: "Retail Entrances", description: "Branded waistline strips on full-height glass doors." },
      { title: "Public Buildings", description: "Building code compliance for schools, hospitals, and government offices." },
    ],
    faq: [
      { q: "What height should a waistline strip be installed?", a: "Building codes typically require markings between 850mm and 1000mm from floor level, and again between 1400mm and 1600mm." },
      { q: "Can I add a logo to the strip?", a: "Yes. We can print repeating logos, patterns, or custom designs along the full length of the strip." },
    ],
  },

  "wall-graphics": {
    seo: {
      title: "Custom Wall Graphics | Repositionable Vinyl | La Lunar Printing",
      description: "Custom printed wall graphics on repositionable vinyl. Damage-free application for offices, retail, and events. Full-colour printing, contour cut available.",
      keywords: ["wall graphics", "wall decals", "wall vinyl", "repositionable wall graphics", "office wall branding"],
    },
    intro: {
      headline: "Wall Graphics",
      subtitle: "Repositionable printed vinyl for interior walls. Full-colour graphics with damage-free application and removal. Transform offices, retail spaces, and event venues.",
    },
    highlights: [
      { icon: "check", text: "Damage-free removal" },
      { icon: "eye", text: "Repositionable adhesive" },
      { icon: "clock", text: "3\u20135 business days" },
      { icon: "shield", text: "Laminate options" },
    ],
    tabs: {
      specifications: {
        label: "Specifications",
        rows: [
          { label: "Material", value: "Repositionable vinyl (low-tack adhesive)" },
          { label: "Printing", value: "Full-colour CMYK, single-sided" },
          { label: "Cut Options", value: "Rectangular or contour (die-cut)" },
          { label: "Max Width", value: '53"' },
          { label: "Surface", value: "Smooth painted walls, drywall, wood, metal" },
          { label: "Durability", value: "3\u20135 years indoor" },
        ],
      },
    },
    useCases: [
      { title: "Office Branding", description: "Logos, mission statements, and brand graphics in reception areas and meeting rooms." },
      { title: "Retail Displays", description: "Seasonal promotions and product displays on store walls." },
      { title: "Event Venues", description: "Temporary branding for conferences, trade shows, and pop-up events." },
    ],
    faq: [
      { q: "Will it damage my walls?", a: "No. Our repositionable vinyl uses a low-tack adhesive that removes cleanly from painted surfaces without peeling paint." },
      { q: "Can it be applied to textured walls?", a: "Best results are on smooth surfaces. Textured walls may cause bubbling or poor adhesion." },
    ],
  },

  "floor-graphics": {
    seo: {
      title: "Custom Floor Graphics | Non-Slip Vinyl | La Lunar Printing",
      description: "Custom floor graphics with non-slip laminate. Indoor floor decals for wayfinding, branding, and safety. Durable, slip-resistant, full-colour printing.",
      keywords: ["floor graphics", "floor decals", "non-slip floor vinyl", "indoor floor stickers", "wayfinding floor graphics"],
    },
    intro: {
      headline: "Floor Graphics",
      subtitle: "Non-slip laminated vinyl for indoor floors. Full-colour printed graphics for wayfinding, branding, safety messaging, and promotional displays.",
    },
    highlights: [
      { icon: "shield", text: "Non-slip laminate" },
      { icon: "check", text: "Contour or rectangular" },
      { icon: "clock", text: "3\u20135 business days" },
      { icon: "eye", text: "Full-colour printing" },
    ],
    tabs: {
      specifications: {
        label: "Specifications",
        rows: [
          { label: "Material", value: "Floor vinyl + non-slip overlaminate" },
          { label: "Printing", value: "Full-colour CMYK, single-sided" },
          { label: "Cut Options", value: "Rectangular or contour (die-cut)" },
          { label: "Max Width", value: '53"' },
          { label: "Max Length", value: '120" (10 ft)' },
          { label: "Surface", value: "Smooth indoor floors (tile, hardwood, concrete, vinyl)" },
          { label: "Durability", value: "6\u201312 months with foot traffic" },
        ],
      },
    },
    useCases: [
      { title: "Wayfinding", description: "Directional arrows and path markers for airports, hospitals, and retail." },
      { title: "Safety Messaging", description: "Social distancing markers, hazard zones, and emergency exits." },
      { title: "Retail Promotions", description: "Eye-catching floor displays at point-of-purchase and aisle ends." },
    ],
    faq: [
      { q: "Is the non-slip laminate included?", a: "Yes. All floor graphics include non-slip overlaminate at no additional charge." },
      { q: "Can it be used outdoors?", a: "Our standard floor vinyl is designed for indoor use. For outdoor applications, contact us for specialty materials." },
      { q: "Will it leave residue when removed?", a: "Minimal residue on smooth surfaces. Clean any remaining adhesive with isopropyl alcohol." },
    ],
  },
};

/**
 * Comparison table across all 9 WWF product types.
 */
export const WWF_COMPARISON_TABLE = {
  columns: [
    { id: "one-way-vision", label: "One-Way Vision", slug: "one-way-vision" },
    { id: "frosted-window-film", label: "Frosted Film", slug: "frosted-window-film" },
    { id: "static-cling", label: "Static Cling", slug: "static-cling" },
    { id: "transparent-color-film", label: "Transparent", slug: "transparent-color-film" },
    { id: "blockout-vinyl", label: "Blockout", slug: "blockout-vinyl" },
    { id: "opaque-window-graphics", label: "Opaque", slug: "opaque-window-graphics" },
    { id: "glass-waistline", label: "Waistline", slug: "glass-waistline" },
    { id: "wall-graphics", label: "Wall", slug: "wall-graphics" },
    { id: "floor-graphics", label: "Floor", slug: "floor-graphics" },
  ],
  rows: [
    {
      label: "Material",
      values: {
        "one-way-vision": "Perforated vinyl",
        "frosted-window-film": "Frosted vinyl",
        "static-cling": "Static cling PVC",
        "transparent-color-film": "Translucent vinyl",
        "blockout-vinyl": "Blockout vinyl",
        "opaque-window-graphics": "White vinyl",
        "glass-waistline": "Multiple options",
        "wall-graphics": "Repositionable vinyl",
        "floor-graphics": "Floor vinyl + laminate",
      },
    },
    {
      label: "Application",
      values: {
        "one-way-vision": "Window (outside)",
        "frosted-window-film": "Window (either side)",
        "static-cling": "Window (inside)",
        "transparent-color-film": "Window (either side)",
        "blockout-vinyl": "Window (either side)",
        "opaque-window-graphics": "Window (either side)",
        "glass-waistline": "Glass (waist height)",
        "wall-graphics": "Interior walls",
        "floor-graphics": "Indoor floors",
      },
    },
    {
      label: "Transparency",
      values: {
        "one-way-vision": "See-through from inside",
        "frosted-window-film": "Diffused light",
        "static-cling": "Diffused / frosted",
        "transparent-color-film": "Light passes through",
        "blockout-vinyl": "Fully opaque",
        "opaque-window-graphics": "Opaque (white base)",
        "glass-waistline": "Varies by material",
        "wall-graphics": "Opaque",
        "floor-graphics": "Opaque",
      },
    },
    {
      label: "Cut Options",
      values: {
        "one-way-vision": "Rectangular only",
        "frosted-window-film": "Rectangular, contour",
        "static-cling": "Rectangular, contour",
        "transparent-color-film": "Rectangular, contour",
        "blockout-vinyl": "Rectangular only",
        "opaque-window-graphics": "Rectangular, contour",
        "glass-waistline": "Rectangular only",
        "wall-graphics": "Rectangular, contour",
        "floor-graphics": "Rectangular, contour",
      },
    },
    {
      label: "Durability",
      values: {
        "one-way-vision": "2\u20133 years outdoor",
        "frosted-window-film": "3\u20135 years indoor",
        "static-cling": "Reusable",
        "transparent-color-film": "2\u20133 years outdoor",
        "blockout-vinyl": "3\u20135 years outdoor",
        "opaque-window-graphics": "3\u20135 years outdoor",
        "glass-waistline": "3\u20135 years indoor",
        "wall-graphics": "3\u20135 years indoor",
        "floor-graphics": "6\u201312 months",
      },
    },
    {
      label: "Best For",
      values: {
        "one-way-vision": "Storefronts, vehicles",
        "frosted-window-film": "Privacy, branding",
        "static-cling": "Seasonal, temporary",
        "transparent-color-film": "Decorative, stained glass",
        "blockout-vinyl": "Full-coverage wraps",
        "opaque-window-graphics": "Signage, lettering",
        "glass-waistline": "Safety compliance",
        "wall-graphics": "Offices, retail",
        "floor-graphics": "Wayfinding, safety",
      },
    },
  ],
};

/**
 * Maps product DB slugs to content keys.
 */
const WWF_RICH_PAGE_SLUG_MAP = {
  "one-way-vision": "one-way-vision",
  "frosted-window-film": "frosted-window-film",
  "frosted-window-graphics": "frosted-window-film",
  "static-cling": "static-cling",
  "static-cling-frosted": "static-cling",
  "transparent-color-film": "transparent-color-film",
  "window-graphics-transparent-color": "transparent-color-film",
  "blockout-vinyl": "blockout-vinyl",
  "window-graphics-blockout": "blockout-vinyl",
  "opaque-window-graphics": "opaque-window-graphics",
  "window-graphics-standard": "opaque-window-graphics",
  "glass-waistline": "glass-waistline",
  "wall-graphics": "wall-graphics",
  "floor-graphics": "floor-graphics",
};

export function getWwfPageContent(slug) {
  const contentKey = WWF_RICH_PAGE_SLUG_MAP[slug];
  if (!contentKey) return null;
  const content = WWF_PAGE_CONTENT[contentKey];
  if (!content) return null;
  return { wwfProductId: contentKey, content };
}
