import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProductImage } from "@/lib/product-image";

/**
 * Common typos and aliases for printing industry terms.
 * Maps frequent misspellings/variants to correct search terms.
 */
const SEARCH_ALIASES: Record<string, string[]> = {
  sticker: ["stiker", "stikcer", "stiker", "sticekr", "stciker"],
  banner: ["baner", "bannor", "baner", "bannar"],
  vinyl: ["vynil", "vinly", "vinyil"],
  business: ["bussiness", "busines", "buisness"],
  card: ["crad", "cadr"],
  canvas: ["canvass", "canva", "canvs"],
  vehicle: ["vehical", "vehicule", "vehcile"],
  sign: ["sgin", "singn"],
  label: ["lable", "labal", "laebl"],
  decal: ["decle", "dekle", "decl"],
  poster: ["postre", "postr"],
  flyer: ["flier", "flyar", "fler"],
  brochure: ["brocure", "broshure", "brochur"],
  envelope: ["envelop", "envolope", "envlope"],
  letterhead: ["leterhead", "letterhed"],
  postcard: ["poscard", "postcard"],
  foam: ["fome", "foem"],
  acrylic: ["acryllic", "acrilic"],
  magnetic: ["magnitic", "magnet"],
  reflective: ["refelctive", "reflctive"],
};

/**
 * Synonym groups — when a customer searches one term, also search related terms.
 * This handles natural language variations common in the print industry.
 */
const SYNONYMS: Record<string, string[]> = {
  "business card": ["calling card", "name card", "visiting card"],
  "calling card": ["business card"],
  "name card": ["business card"],
  sticker: ["label", "decal"],
  label: ["sticker"],
  decal: ["sticker", "vinyl"],
  poster: ["flyer", "print"],
  flyer: ["flier", "leaflet", "handout", "pamphlet"],
  leaflet: ["flyer"],
  pamphlet: ["brochure", "flyer"],
  brochure: ["booklet", "pamphlet", "catalog"],
  banner: ["sign", "display"],
  sign: ["signage", "board"],
  "yard sign": ["lawn sign", "coroplast sign", "election sign"],
  "lawn sign": ["yard sign"],
  wrap: ["vehicle wrap", "car wrap", "fleet wrap"],
  "car wrap": ["vehicle wrap", "auto wrap"],
  "vehicle wrap": ["car wrap", "fleet wrap", "truck wrap"],
  canvas: ["canvas print", "gallery wrap"],
  stamp: ["rubber stamp", "self-inking stamp"],
  magnet: ["magnetic sign", "car magnet"],
  lettering: ["vinyl lettering", "cut vinyl"],
  window: ["window decal", "window cling", "window graphic"],
  floor: ["floor decal", "floor graphic"],
  wall: ["wall decal", "wall graphic", "wallpaper"],
  "roll up": ["retractable banner", "pull up banner"],
  "retractable": ["roll up banner"],
  bookmark: ["bookmarks"],
  notepad: ["notepads", "memo pad"],
  receipt: ["receipt book", "invoice book", "ncr form"],
  ncr: ["carbonless form", "receipt book", "duplicate form"],
};

/** Check if query matches any known typo and return the correct term */
function expandTypos(query: string): string[] {
  const lower = query.toLowerCase();
  const terms = [lower];

  // Expand typos
  for (const [correct, typos] of Object.entries(SEARCH_ALIASES)) {
    if (typos.some((t) => lower.includes(t))) {
      terms.push(lower.replace(new RegExp(typos.join("|"), "gi"), correct));
    }
  }

  // Expand synonyms
  for (const [term, syns] of Object.entries(SYNONYMS)) {
    if (lower.includes(term)) {
      for (const syn of syns) {
        terms.push(lower.replace(term, syn));
      }
    }
  }

  return [...new Set(terms)];
}

/** Popular searches shown when query is empty or very short */
const POPULAR_SEARCHES = [
  "Business Cards",
  "Die-Cut Stickers",
  "Vinyl Banners",
  "Yard Signs",
  "Roll Labels",
  "Canvas Prints",
  "Vehicle Wraps",
  "Postcards",
];

/**
 * GET /api/search?q=sticker&limit=8
 *
 * Product search with typo tolerance and popular searches.
 * Searches name, slug, description using case-insensitive LIKE.
 * Expands common misspellings for printing terms.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    const limit = Math.min(parseInt(searchParams.get("limit") || "8"), 20);

    // Return popular searches when no query
    if (!q || q.length < 2) {
      return NextResponse.json({
        results: [],
        popularSearches: POPULAR_SEARCHES,
      });
    }

    // Expand typos to get multiple search terms
    const searchTerms = expandTypos(q);

    // Build OR conditions for all expanded terms
    const orConditions = searchTerms.flatMap((term) => [
      { name: { contains: term, mode: "insensitive" as const } },
      { slug: { contains: term, mode: "insensitive" as const } },
      { description: { contains: term, mode: "insensitive" as const } },
    ]);

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: orConditions,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        basePrice: true,
        images: {
          take: 1,
          orderBy: { sortOrder: "asc" },
          select: { url: true, alt: true },
        },
      },
      take: limit,
      orderBy: { name: "asc" },
    });

    // Score results: exact name match > slug match > description match
    const qLower = q.toLowerCase();
    const scored = products.map((p) => {
      let score = 0;
      if (p.name.toLowerCase().includes(qLower)) score += 10;
      if (p.name.toLowerCase().startsWith(qLower)) score += 5;
      if (p.slug.includes(qLower)) score += 3;
      return { ...p, _score: score };
    });
    scored.sort((a, b) => b._score - a._score);

    const results = scored.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      category: p.category,
      price: p.basePrice,
      image: getProductImage(p, p.category) || null,
      imageAlt: p.images[0]?.alt || p.name,
    }));

    return NextResponse.json({
      results,
      query: q,
      corrected: searchTerms.length > 1 ? searchTerms[1] : undefined,
    });
  } catch (err) {
    console.error("[Search] Error:", err);
    return NextResponse.json({ results: [], error: "Search failed" }, { status: 500 });
  }
}
