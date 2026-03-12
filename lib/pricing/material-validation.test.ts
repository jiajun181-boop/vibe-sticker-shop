/**
 * Regression tests for product/material compatibility validation.
 *
 * Validates:
 *   V1: Invalid cross-family combos are rejected (template-level)
 *   V2: Valid same-family combos are accepted (template-level)
 *   V3: Edge cases (unknown materials, empty input, label stock)
 *   V4: getProductTemplate resolves correctly
 *   V5: Product-level validation — business cards reject NCR/bond
 *   V6: Product-level validation — NCR accepts its stock, rejects cardstock
 *   V7: Product-level validation — flyers accept coated, reject cardstock
 *   V8: Product-level validation — sticker products (per cutting-type)
 *   V9: getProductMaterials returns correct types
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { validateMaterialForTemplate, getProductTemplate } = require("@/lib/pricing/template-resolver") as {
  validateMaterialForTemplate: (materialAlias: string, template: string, options?: { strict?: boolean }) => {
    valid: boolean;
    reason?: string;
    materialFamily?: string;
    allowedFamilies?: string[];
    resolvedDbName?: string;
  };
  getProductTemplate: (product: { slug?: string; category?: string }) => string | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { validateMaterialForProduct, getProductMaterials } = require("@/lib/pricing/product-materials") as {
  validateMaterialForProduct: (materialAlias: string, slug: string) => {
    valid: boolean;
    reason?: string;
  };
  getProductMaterials: (slug: string) => {
    type: "fixed" | "options";
    source?: "product";
    material?: string;
    label?: string;
    options?: Array<{ id: string; label: string }>;
  } | null;
};

// ── V1: Invalid cross-family combinations ─────────────────────────────────────

describe("material validation — invalid combos", () => {
  it("rejects white_vinyl for paper_print (business cards + sticker vinyl)", () => {
    const result = validateMaterialForTemplate("white_vinyl", "paper_print");
    expect(result.valid).toBe(false);
    expect(result.materialFamily).toBe("vinyl");
    expect(result.reason).toContain("vinyl");
  });

  it("rejects white-vinyl (kebab) for paper_print", () => {
    const result = validateMaterialForTemplate("white-vinyl", "paper_print");
    expect(result.valid).toBe(false);
  });

  it("rejects clear_vinyl for paper_print", () => {
    const result = validateMaterialForTemplate("clear_vinyl", "paper_print");
    expect(result.valid).toBe(false);
  });

  it("rejects 14pt-gloss for vinyl_print (cardstock in sticker template)", () => {
    const result = validateMaterialForTemplate("14pt-gloss", "vinyl_print");
    expect(result.valid).toBe(false);
    expect(result.materialFamily).toBe("paper");
  });

  it("rejects 14pt_cardstock for vinyl_print", () => {
    const result = validateMaterialForTemplate("14pt_cardstock", "vinyl_print");
    expect(result.valid).toBe(false);
  });

  it("rejects white_vinyl for banner", () => {
    const result = validateMaterialForTemplate("white_vinyl", "banner");
    expect(result.valid).toBe(false);
  });

  it("rejects 13oz-vinyl for paper_print (banner material in paper template)", () => {
    const result = validateMaterialForTemplate("13oz-vinyl", "paper_print");
    expect(result.valid).toBe(false);
    expect(result.materialFamily).toBe("banner");
  });

  it("rejects coroplast_4mm for paper_print (board in paper template)", () => {
    const result = validateMaterialForTemplate("coroplast_4mm", "paper_print");
    expect(result.valid).toBe(false);
    expect(result.materialFamily).toBe("board");
  });

  it("rejects white_vinyl for board_sign", () => {
    const result = validateMaterialForTemplate("white_vinyl", "board_sign");
    expect(result.valid).toBe(false);
  });

  it("rejects 14pt-gloss for board_sign", () => {
    const result = validateMaterialForTemplate("14pt-gloss", "board_sign");
    expect(result.valid).toBe(false);
  });

  it("rejects 13oz-vinyl for vinyl_cut (banner in vehicle template)", () => {
    const result = validateMaterialForTemplate("13oz-vinyl", "vinyl_cut");
    expect(result.valid).toBe(false);
  });

  it("rejects lamination as primary material", () => {
    const result = validateMaterialForTemplate("gloss_lam", "paper_print");
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("lamination");
  });
});

// ── V2: Valid same-family combinations ────────────────────────────────────────

describe("material validation — valid combos", () => {
  it("accepts white-vinyl for vinyl_print (stickers)", () => {
    const result = validateMaterialForTemplate("white-vinyl", "vinyl_print");
    expect(result.valid).toBe(true);
  });

  it("accepts clear_vinyl for vinyl_print", () => {
    const result = validateMaterialForTemplate("clear_vinyl", "vinyl_print");
    expect(result.valid).toBe(true);
  });

  it("accepts 14pt-gloss for paper_print (business cards)", () => {
    const result = validateMaterialForTemplate("14pt-gloss", "paper_print");
    expect(result.valid).toBe(true);
  });

  it("accepts 100lb-gloss for paper_print (flyers)", () => {
    const result = validateMaterialForTemplate("100lb-gloss", "paper_print");
    expect(result.valid).toBe(true);
  });

  it("accepts 13oz-vinyl for banner", () => {
    const result = validateMaterialForTemplate("13oz-vinyl", "banner");
    expect(result.valid).toBe(true);
  });

  it("accepts mesh-standard for banner", () => {
    const result = validateMaterialForTemplate("mesh-standard", "banner");
    expect(result.valid).toBe(true);
  });

  it("accepts coroplast_4mm for board_sign", () => {
    const result = validateMaterialForTemplate("coroplast_4mm", "board_sign");
    expect(result.valid).toBe(true);
  });

  it("accepts 4mm-coroplast (kebab) for board_sign", () => {
    const result = validateMaterialForTemplate("4mm-coroplast", "board_sign");
    expect(result.valid).toBe(true);
  });

  it("accepts foam_5mm for board_sign", () => {
    const result = validateMaterialForTemplate("foam_5mm", "board_sign");
    expect(result.valid).toBe(true);
  });

  it("accepts cast-vinyl for vinyl_cut (vehicle)", () => {
    const result = validateMaterialForTemplate("cast-vinyl", "vinyl_cut");
    expect(result.valid).toBe(true);
  });

  it("accepts reflective for vinyl_cut", () => {
    const result = validateMaterialForTemplate("reflective", "vinyl_cut");
    expect(result.valid).toBe(true);
  });
});

// ── V3: Edge cases ────────────────────────────────────────────────────────────

describe("material validation — edge cases", () => {
  it("allows unknown materials (graceful fallback)", () => {
    const result = validateMaterialForTemplate("custom-exotic-material", "paper_print");
    expect(result.valid).toBe(true);
  });

  it("allows empty material string", () => {
    const result = validateMaterialForTemplate("", "paper_print");
    expect(result.valid).toBe(true);
  });

  it("allows null-ish template", () => {
    const result = validateMaterialForTemplate("white_vinyl", "");
    expect(result.valid).toBe(true);
  });

  it("accepts paper_label for vinyl_print (sticker paper labels)", () => {
    const result = validateMaterialForTemplate("paper_label", "vinyl_print");
    expect(result.valid).toBe(true);
    expect(result.materialFamily).toBe("label");
  });

  it("accepts paper_label for paper_print (label stock in paper template)", () => {
    const result = validateMaterialForTemplate("paper_label", "paper_print");
    expect(result.valid).toBe(true);
  });

  it("skips validation for canvas template (hardcoded material)", () => {
    const result = validateMaterialForTemplate("white_vinyl", "canvas");
    expect(result.valid).toBe(true);
  });

  it("accepts holographic-vinyl for vinyl_print", () => {
    const result = validateMaterialForTemplate("holographic-vinyl", "vinyl_print");
    expect(result.valid).toBe(true);
  });
});

// ── V4: getProductTemplate resolution ─────────────────────────────────────────

describe("getProductTemplate", () => {
  it("resolves marketing-business-print to paper_print", () => {
    expect(getProductTemplate({ category: "marketing-business-print" })).toBe("paper_print");
  });

  it("resolves marketing-prints alias to paper_print", () => {
    expect(getProductTemplate({ category: "marketing-prints" })).toBe("paper_print");
  });

  it("resolves stickers-labels-decals to vinyl_print", () => {
    expect(getProductTemplate({ category: "stickers-labels-decals" })).toBe("vinyl_print");
  });

  it("resolves banners-displays to banner", () => {
    expect(getProductTemplate({ category: "banners-displays" })).toBe("banner");
  });

  it("resolves signs-rigid-boards to board_sign", () => {
    expect(getProductTemplate({ category: "signs-rigid-boards" })).toBe("board_sign");
  });

  it("resolves canvas-prints to canvas", () => {
    expect(getProductTemplate({ category: "canvas-prints" })).toBe("canvas");
  });

  it("resolves vehicle-graphics-fleet to vinyl_cut", () => {
    expect(getProductTemplate({ category: "vehicle-graphics-fleet" })).toBe("vinyl_cut");
  });

  it("applies slug override (magnetic-car-signs → vinyl_print)", () => {
    expect(getProductTemplate({ slug: "magnetic-car-signs", category: "signs-rigid-boards" })).toBe("vinyl_print");
  });

  it("returns null for unknown category", () => {
    expect(getProductTemplate({ category: "unknown-category" })).toBeNull();
  });
});

// ── V5: Product-level — business cards ────────────────────────────────────────

describe("product validation — business cards", () => {
  it("rejects any material for business-cards-gloss (fixed stock)", () => {
    const result = validateMaterialForProduct("14pt-gloss", "business-cards-gloss");
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("fixed");
  });

  it("rejects NCR for business-cards-classic", () => {
    const result = validateMaterialForProduct("ncr_2part", "business-cards-classic");
    expect(result.valid).toBe(false);
  });

  it("rejects bond for business-cards-matte", () => {
    const result = validateMaterialForProduct("20lb_bond", "business-cards-matte");
    expect(result.valid).toBe(false);
  });

  it("rejects white_vinyl for business-cards-soft-touch", () => {
    const result = validateMaterialForProduct("white_vinyl", "business-cards-soft-touch");
    expect(result.valid).toBe(false);
  });

  it("rejects material for magnets-business-card", () => {
    const result = validateMaterialForProduct("14pt-gloss", "magnets-business-card");
    expect(result.valid).toBe(false);
  });
});

// ── V6: Product-level — NCR ──────────────────────────────────────────────────

describe("product validation — NCR forms", () => {
  it("accepts ncr_2part for ncr-forms-duplicate", () => {
    const result = validateMaterialForProduct("ncr_2part", "ncr-forms-duplicate");
    expect(result.valid).toBe(true);
  });

  it("rejects ncr_3part for ncr-forms-duplicate (wrong part count)", () => {
    const result = validateMaterialForProduct("ncr_3part", "ncr-forms-duplicate");
    expect(result.valid).toBe(false);
  });

  it("rejects 14pt-gloss for ncr-forms-duplicate (cardstock for NCR)", () => {
    const result = validateMaterialForProduct("14pt-gloss", "ncr-forms-duplicate");
    expect(result.valid).toBe(false);
  });

  it("accepts ncr_3part for ncr-forms-triplicate", () => {
    const result = validateMaterialForProduct("ncr_3part", "ncr-forms-triplicate");
    expect(result.valid).toBe(true);
  });

  it("accepts ncr_4part for ncr-invoices", () => {
    const result = validateMaterialForProduct("ncr_4part", "ncr-invoices");
    expect(result.valid).toBe(true);
  });
});

// ── V7: Product-level — flyers and paper print products ──────────────────────

describe("product validation — paper print products", () => {
  it("accepts 100lb-gloss-text for flyers", () => {
    const result = validateMaterialForProduct("100lb-gloss-text", "flyers");
    expect(result.valid).toBe(true);
  });

  it("accepts 80lb-matte-text for flyers", () => {
    const result = validateMaterialForProduct("80lb-matte-text", "flyers");
    expect(result.valid).toBe(true);
  });

  it("rejects 14pt-gloss for flyers (cardstock in coated product)", () => {
    const result = validateMaterialForProduct("14pt-gloss", "flyers");
    expect(result.valid).toBe(false);
  });

  it("rejects ncr_2part for flyers", () => {
    const result = validateMaterialForProduct("ncr_2part", "flyers");
    expect(result.valid).toBe(false);
  });

  it("accepts 14pt-gloss for postcards", () => {
    const result = validateMaterialForProduct("14pt-gloss", "postcards");
    expect(result.valid).toBe(true);
  });

  it("rejects 100lb-gloss-text for postcards (coated in cardstock product)", () => {
    const result = validateMaterialForProduct("100lb-gloss-text", "postcards");
    expect(result.valid).toBe(false);
  });

  it("accepts 20lb_bond for document-printing", () => {
    const result = validateMaterialForProduct("20lb_bond", "document-printing");
    expect(result.valid).toBe(true);
  });

  it("rejects 14pt-gloss for document-printing", () => {
    const result = validateMaterialForProduct("14pt-gloss", "document-printing");
    expect(result.valid).toBe(false);
  });
});

// ── V8: Product-level — sticker products ─────────────────────────────────────

describe("product validation — sticker products", () => {
  it("accepts white-vinyl for die-cut-stickers", () => {
    const result = validateMaterialForProduct("white-vinyl", "die-cut-stickers");
    expect(result.valid).toBe(true);
  });

  it("accepts clear-static-cling for die-cut-stickers", () => {
    const result = validateMaterialForProduct("clear-static-cling", "die-cut-stickers");
    expect(result.valid).toBe(true);
  });

  it("rejects clear-static-cling for kiss-cut-stickers (no cling in kiss-cut)", () => {
    const result = validateMaterialForProduct("clear-static-cling", "kiss-cut-stickers");
    expect(result.valid).toBe(false);
  });

  it("accepts white-gloss-bopp for roll-labels", () => {
    const result = validateMaterialForProduct("white-gloss-bopp", "roll-labels");
    expect(result.valid).toBe(true);
  });

  it("rejects white-vinyl for roll-labels (wrong stock)", () => {
    const result = validateMaterialForProduct("white-vinyl", "roll-labels");
    expect(result.valid).toBe(false);
  });
});

// ── V9: getProductMaterials return types ──────────────────────────────────────

describe("getProductMaterials", () => {
  it("returns fixed for business-cards-gloss", () => {
    const result = getProductMaterials("business-cards-gloss");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("fixed");
  });

  it("returns fixed with material for ncr-forms-duplicate", () => {
    const result = getProductMaterials("ncr-forms-duplicate");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("fixed");
    expect(result!.material).toBe("ncr_2part");
  });

  it("returns options for flyers", () => {
    const result = getProductMaterials("flyers");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("options");
    expect(result!.options!.length).toBeGreaterThan(0);
    expect(result!.options!.some((o: { id: string }) => o.id === "100lb-gloss-text")).toBe(true);
  });

  it("returns options for die-cut-stickers", () => {
    const result = getProductMaterials("die-cut-stickers");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("options");
    expect(result!.options!.some((o: { id: string }) => o.id === "white-vinyl")).toBe(true);
  });

  it("returns null for unknown product", () => {
    const result = getProductMaterials("unknown-product-slug");
    expect(result).toBeNull();
  });
});

// ── V10: Strict mode — unknown materials rejected ─────────────────────────────

describe("strict mode — unknown material rejection", () => {
  it("rejects unknown material in strict mode for paper_print", () => {
    const result = validateMaterialForTemplate("made-up-material-xyz", "paper_print", { strict: true });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("not a recognized material");
  });

  it("rejects unknown material in strict mode for vinyl_print", () => {
    const result = validateMaterialForTemplate("fantasy-vinyl-9000", "vinyl_print", { strict: true });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("not a recognized material");
  });

  it("rejects unknown material in strict mode for banner", () => {
    const result = validateMaterialForTemplate("imaginary-banner", "banner", { strict: true });
    expect(result.valid).toBe(false);
  });

  it("rejects unknown material in strict mode for board_sign", () => {
    const result = validateMaterialForTemplate("unobtanium-board", "board_sign", { strict: true });
    expect(result.valid).toBe(false);
  });

  it("rejects unknown material in strict mode for vinyl_cut", () => {
    const result = validateMaterialForTemplate("nonexistent-cut-vinyl", "vinyl_cut", { strict: true });
    expect(result.valid).toBe(false);
  });

  it("allows unknown material in permissive mode (default)", () => {
    const result = validateMaterialForTemplate("made-up-material-xyz", "paper_print");
    expect(result.valid).toBe(true);
  });

  it("allows known mapped material in strict mode", () => {
    const result = validateMaterialForTemplate("white-vinyl", "vinyl_print", { strict: true });
    expect(result.valid).toBe(true);
    expect(result.materialFamily).toBe("vinyl");
  });

  it("allows known cardstock in strict mode for paper_print", () => {
    const result = validateMaterialForTemplate("14pt-gloss", "paper_print", { strict: true });
    expect(result.valid).toBe(true);
    expect(result.materialFamily).toBe("paper");
  });

  it("allows known banner material in strict mode", () => {
    const result = validateMaterialForTemplate("13oz-vinyl", "banner", { strict: true });
    expect(result.valid).toBe(true);
    expect(result.materialFamily).toBe("banner");
  });

  it("still rejects cross-family in strict mode", () => {
    const result = validateMaterialForTemplate("white-vinyl", "paper_print", { strict: true });
    expect(result.valid).toBe(false);
    expect(result.materialFamily).toBe("vinyl");
  });

  it("still skips validation for canvas in strict mode", () => {
    const result = validateMaterialForTemplate("anything-goes", "canvas", { strict: true });
    expect(result.valid).toBe(true);
  });

  it("classifies backlit-film as paper family", () => {
    const result = validateMaterialForTemplate("backlit-film", "paper_print", { strict: true });
    expect(result.valid).toBe(true);
    expect(result.materialFamily).toBe("paper");
  });

  it("accepts new WWF alias wall-permanent in strict mode for vinyl_print", () => {
    const result = validateMaterialForTemplate("wall-permanent", "vinyl_print", { strict: true });
    expect(result.valid).toBe(true);
    expect(result.materialFamily).toBe("vinyl");
  });

  it("accepts new alias floor-removable in strict mode for vinyl_print", () => {
    const result = validateMaterialForTemplate("floor-removable", "vinyl_print", { strict: true });
    expect(result.valid).toBe(true);
    expect(result.materialFamily).toBe("vinyl");
  });

  it("accepts booklet alias 100lb-matte-text in strict mode for paper_print", () => {
    const result = validateMaterialForTemplate("100lb-matte-text", "paper_print", { strict: true });
    expect(result.valid).toBe(true);
    expect(result.materialFamily).toBe("paper");
  });

  it("accepts letterhead alias 70lb-white-offset in strict mode for paper_print", () => {
    const result = validateMaterialForTemplate("70lb-white-offset", "paper_print", { strict: true });
    expect(result.valid).toBe(true);
    expect(result.materialFamily).toBe("paper");
  });
});

// ── V11: Expanded product coverage — canvas, WWF, vehicle, booklets ───────────

describe("product validation — canvas products", () => {
  it("returns fixed for canvas-standard", () => {
    const result = getProductMaterials("canvas-standard");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("fixed");
    expect(result!.source).toBe("product");
  });

  it("returns fixed for canvas-gallery-wrap", () => {
    const result = getProductMaterials("canvas-gallery-wrap");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("fixed");
  });

  it("returns fixed for canvas-split-3", () => {
    const result = getProductMaterials("canvas-split-3");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("fixed");
  });

  it("rejects any material for canvas-standard (fixed)", () => {
    const result = validateMaterialForProduct("white-vinyl", "canvas-standard");
    expect(result.valid).toBe(false);
  });
});

describe("product validation — WWF products", () => {
  it("returns options for window-graphics-transparent-color", () => {
    const result = getProductMaterials("window-graphics-transparent-color");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("options");
    expect(result!.source).toBe("product");
    expect(result!.options!.some((o: { id: string }) => o.id === "transparent-film")).toBe(true);
  });

  it("accepts perforated-vinyl for one-way-vision", () => {
    const result = validateMaterialForProduct("perforated-vinyl", "one-way-vision");
    expect(result.valid).toBe(true);
  });

  it("rejects white-vinyl for one-way-vision (wrong stock)", () => {
    const result = validateMaterialForProduct("white-vinyl", "one-way-vision");
    expect(result.valid).toBe(false);
  });

  it("accepts blockout-vinyl for window-graphics-blockout", () => {
    const result = validateMaterialForProduct("blockout-vinyl", "window-graphics-blockout");
    expect(result.valid).toBe(true);
  });

  it("accepts wall-repositionable for wall-graphics", () => {
    const result = validateMaterialForProduct("wall-repositionable", "wall-graphics");
    expect(result.valid).toBe(true);
  });

  it("rejects 14pt-gloss for floor-graphics (paper in floor product)", () => {
    const result = validateMaterialForProduct("14pt-gloss", "floor-graphics");
    expect(result.valid).toBe(false);
  });
});

describe("product validation — expanded vehicle products", () => {
  it("accepts cast-vinyl for partial-wrap-spot-graphics", () => {
    const result = validateMaterialForProduct("cast-vinyl", "partial-wrap-spot-graphics");
    expect(result.valid).toBe(true);
  });

  it("accepts calendered for printed-truck-door-decals-full-color", () => {
    const result = validateMaterialForProduct("calendered", "printed-truck-door-decals-full-color");
    expect(result.valid).toBe(true);
  });

  it("rejects white-vinyl for usdot-number-decals (wrong stock)", () => {
    const result = validateMaterialForProduct("white-vinyl", "usdot-number-decals");
    expect(result.valid).toBe(false);
  });

  it("accepts reflective for truck-door-compliance-kit", () => {
    const result = validateMaterialForProduct("reflective", "truck-door-compliance-kit");
    expect(result.valid).toBe(true);
  });
});

describe("product validation — booklet products", () => {
  it("returns options for booklets-saddle-stitch", () => {
    const result = getProductMaterials("booklets-saddle-stitch");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("options");
    expect(result!.options!.some((o: { id: string }) => o.id === "100lb-gloss-text")).toBe(true);
  });

  it("accepts 100lb-matte-text for booklets-perfect-bound", () => {
    const result = validateMaterialForProduct("100lb-matte-text", "booklets-perfect-bound");
    expect(result.valid).toBe(true);
  });

  it("rejects 14pt-gloss for booklets-wire-o (cardstock for booklet)", () => {
    const result = validateMaterialForProduct("14pt-gloss", "booklets-wire-o");
    expect(result.valid).toBe(false);
  });
});

describe("product validation — letterheads and envelopes", () => {
  it("returns options for letterheads", () => {
    const result = getProductMaterials("letterheads");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("options");
    expect(result!.options!.some((o: { id: string }) => o.id === "70lb-white-offset")).toBe(true);
  });

  it("rejects 14pt-gloss for letterheads (cardstock for letterhead)", () => {
    const result = validateMaterialForProduct("14pt-gloss", "letterheads");
    expect(result.valid).toBe(false);
  });

  it("returns options for envelopes", () => {
    const result = getProductMaterials("envelopes");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("options");
    expect(result!.options!.some((o: { id: string }) => o.id === "envelope_regular")).toBe(true);
  });
});

// ── V12: Source field reporting ────────────────────────────────────────────────

describe("source field reporting", () => {
  it("business cards return source=product", () => {
    const result = getProductMaterials("business-cards-gloss");
    expect(result!.source).toBe("product");
  });

  it("NCR returns source=product", () => {
    const result = getProductMaterials("ncr-forms-duplicate");
    expect(result!.source).toBe("product");
  });

  it("flyers return source=product", () => {
    const result = getProductMaterials("flyers");
    expect(result!.source).toBe("product");
  });

  it("die-cut-stickers return source=product", () => {
    const result = getProductMaterials("die-cut-stickers");
    expect(result!.source).toBe("product");
  });

  it("canvas-standard returns source=product", () => {
    const result = getProductMaterials("canvas-standard");
    expect(result!.source).toBe("product");
  });

  it("window-graphics-blockout returns source=product", () => {
    const result = getProductMaterials("window-graphics-blockout");
    expect(result!.source).toBe("product");
  });

  it("unknown product returns null (template-fallback)", () => {
    const result = getProductMaterials("unknown-slug-xyz");
    expect(result).toBeNull();
  });
});

// ── V13: Stamps, sample packs, tabletop-displays — P3 coverage ───────────────

describe("product validation — stamps and specialty fixed products", () => {
  it("returns fixed for stamps-s510", () => {
    const result = getProductMaterials("stamps-s510");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("fixed");
    expect(result!.source).toBe("product");
  });

  it("returns fixed for stamps-r524", () => {
    const result = getProductMaterials("stamps-r524");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("fixed");
  });

  it("returns fixed for funny-approval-stamp", () => {
    const result = getProductMaterials("funny-approval-stamp");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("fixed");
  });

  it("rejects any material for stamps-s827 (fixed product)", () => {
    const result = validateMaterialForProduct("white-vinyl", "stamps-s827");
    expect(result.valid).toBe(false);
  });

  it("returns fixed for sticker-sample-pack", () => {
    const result = getProductMaterials("sticker-sample-pack");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("fixed");
    expect(result!.source).toBe("product");
  });

  it("returns fixed for business-card-sample-pack", () => {
    const result = getProductMaterials("business-card-sample-pack");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("fixed");
  });

  it("returns fixed for tabletop-displays", () => {
    const result = getProductMaterials("tabletop-displays");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("fixed");
    expect(result!.source).toBe("product");
  });

  it("rejects any material for tabletop-displays (fixed product)", () => {
    const result = validateMaterialForProduct("14pt-gloss", "tabletop-displays");
    expect(result.valid).toBe(false);
  });
});

// ── V14: Coverage source — mapped vs fallback ────────────────────────────────

describe("coverage source distinction", () => {
  it("mapped product (flyers) has source=product", () => {
    const result = getProductMaterials("flyers");
    expect(result).not.toBeNull();
    expect(result!.source).toBe("product");
  });

  it("fixed product (canvas) has source=product", () => {
    const result = getProductMaterials("canvas-framed");
    expect(result).not.toBeNull();
    expect(result!.source).toBe("product");
  });

  it("fixed product (stamps) has source=product", () => {
    const result = getProductMaterials("stamps-s542");
    expect(result).not.toBeNull();
    expect(result!.source).toBe("product");
  });

  it("unmapped product returns null (template-fallback implied)", () => {
    const result = getProductMaterials("some-uncovered-product");
    expect(result).toBeNull();
  });

  it("all mapped products have source=product", () => {
    // Spot-check one from each major family
    const families = [
      "business-cards-classic",  // business card
      "canvas-gallery-wrap",     // canvas
      "stamps-r512",             // stamp
      "ncr-forms-duplicate",     // NCR
      "postcards",               // paper
      "booklets-saddle-stitch",  // booklet
      "die-cut-stickers",        // sticker
      "window-graphics-blockout",// WWF
      "vinyl-banner",            // banner
      "yard-signs",              // sign
      "vehicle-decals",          // vehicle
      "sticker-sample-pack",     // sample pack
      "tabletop-displays",       // specialty
    ];
    for (const slug of families) {
      const result = getProductMaterials(slug);
      expect(result).not.toBeNull();
      expect(result!.source).toBe("product");
    }
  });
});
