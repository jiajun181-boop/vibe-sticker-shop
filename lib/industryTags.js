// lib/industryTags.js
// Single source of truth for industry tags (kebab-case).

export const INDUSTRY_TAGS = [
  "restaurants",
  "real-estate",
  "construction",
  "retail",
  "event",
  "fleet",
  "safety",
  "facility",
  "automotive",
  "finance",
  "medical",
  "education",
  "fitness",
  "beauty",
];

export const INDUSTRY_TAGS_SET = new Set(INDUSTRY_TAGS);

export const INDUSTRY_LABELS = {
  "restaurants":   { label: "Restaurants",            icon: "\u{1F37D}\uFE0F",  title: "Restaurant & Food Service",  description: "Menus, table tents, window graphics, and signage for restaurants, cafes, and food trucks." },
  "real-estate":   { label: "Real Estate",            icon: "\u{1F3E0}",        title: "Real Estate",                description: "Yard signs, riders, open house signs, and directional signage for realtors and brokerages." },
  "construction":  { label: "Construction",           icon: "\u{1F3D7}\uFE0F",  title: "Construction & Trades",      description: "Safety signs, site signage, compliance decals, and durable outdoor signs for job sites." },
  "retail":        { label: "Retail",                 icon: "\u{1F6CD}\uFE0F",  title: "Retail & Storefront",        description: "Window graphics, shelf talkers, hang tags, promo materials, and in-store displays." },
  "event":         { label: "Events",                 icon: "\u{1F3EA}",        title: "Events & Trade Shows",       description: "Banners, flags, backdrops, tent graphics, and portable displays for events." },
  "fleet":         { label: "Fleet",                  icon: "\u{1F69B}",        title: "Fleet & Transportation",     description: "DOT numbers, CVOR decals, unit numbers, and fleet compliance signage." },
  "safety":        { label: "Safety",                 icon: "\u26A0\uFE0F",     title: "Safety & Compliance",        description: "Warning signs, PPE labels, hazard decals, and compliance signage." },
  "facility":      { label: "Facility",               icon: "\u{1F3E2}",        title: "Facility & Wayfinding",      description: "Floor graphics, wall murals, wayfinding signs, and directional signage for buildings." },
  "automotive":    { label: "Automotive",             icon: "\u{1F697}",        title: "Automotive",                 description: "Vehicle graphics, magnetic signs, fleet wraps, and automotive decals." },
  "finance":       { label: "Finance",                icon: "\u{1F4CA}",        title: "Finance & Office",           description: "Invoice books, letterhead, NCR forms, and business stationery." },
  "medical":       { label: "Medical",                icon: "\u{1F3E5}",        title: "Medical & Healthcare",       description: "Clinic signage, hospital wayfinding, and medical compliance labels." },
  "education":     { label: "Education",              icon: "\u{1F393}",        title: "Education & Schools",        description: "Certificates, calendars, bookmarks, and educational materials." },
  "fitness":       { label: "Fitness",                icon: "\u{1F4AA}",        title: "Fitness & Wellness",         description: "Gym signage, studio graphics, and fitness facility branding." },
  "beauty":        { label: "Beauty",                 icon: "\u{1F485}",        title: "Beauty & Salon",             description: "Salon signage, spa graphics, and beauty brand materials." },
};

// Old PascalCase → new kebab-case (for migration)
export const PASCAL_TO_KEBAB = {
  Restaurant:   "restaurants",
  RealEstate:   "real-estate",
  Construction: "construction",
  Retail:       "retail",
  Event:        "event",
  Fleet:        "fleet",
  Safety:       "safety",
  Facility:     "facility",
  Automotive:   "automotive",
  Finance:      "finance",
  Medical:      "medical",
  Education:    "education",
  Fitness:      "fitness",
  Beauty:       "beauty",
};
