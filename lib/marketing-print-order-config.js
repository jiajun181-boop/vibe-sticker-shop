// lib/marketing-print-order-config.js — Marketing & business print type definitions

export const PRINT_TYPES = [
  {
    id: "business-cards",
    label: "Business Cards",
    sizes: [
      { label: '3.5" × 2"', w: 3.5, h: 2 },
      { label: '3.5" × 2" (Rounded)', w: 3.5, h: 2 },
    ],
    papers: [
      { id: "14pt-gloss", label: "14pt Gloss", default: true },
      { id: "14pt-matte", label: "14pt Matte" },
      { id: "16pt-gloss", label: "16pt Gloss" },
      { id: "16pt-matte", label: "16pt Matte" },
      { id: "18pt-cotton", label: "18pt Cotton" },
      { id: "32pt-ultra", label: "32pt Ultra Thick" },
    ],
    sides: ["single", "double"],
    finishings: ["none", "uv-gloss", "uv-matte", "soft-touch", "spot-uv", "foil-gold", "foil-silver"],
    quantities: [100, 250, 500, 1000, 2500, 5000],
  },
  {
    id: "postcards",
    label: "Postcards",
    sizes: [
      { label: '4" × 6"', w: 4, h: 6 },
      { label: '5" × 7"', w: 5, h: 7 },
      { label: '6" × 9"', w: 6, h: 9 },
      { label: '6" × 11"', w: 6, h: 11 },
    ],
    papers: [
      { id: "14pt-gloss", label: "14pt Gloss", default: true },
      { id: "14pt-matte", label: "14pt Matte" },
      { id: "16pt-gloss", label: "16pt Gloss" },
    ],
    sides: ["single", "double"],
    finishings: ["none", "uv-gloss", "uv-matte", "soft-touch"],
    quantities: [100, 250, 500, 1000, 2500, 5000],
  },
  {
    id: "flyers",
    label: "Flyers",
    sizes: [
      { label: '8.5" × 11"', w: 8.5, h: 11 },
      { label: '5.5" × 8.5"', w: 5.5, h: 8.5 },
      { label: '4.25" × 5.5"', w: 4.25, h: 5.5 },
      { label: '11" × 17"', w: 11, h: 17 },
    ],
    papers: [
      { id: "80lb-gloss-text", label: "80lb Gloss Text", default: true },
      { id: "80lb-matte-text", label: "80lb Matte Text" },
      { id: "100lb-gloss-text", label: "100lb Gloss Text" },
      { id: "100lb-gloss-cover", label: "100lb Gloss Cover" },
    ],
    sides: ["single", "double"],
    finishings: ["none", "uv-gloss", "uv-matte"],
    quantities: [100, 250, 500, 1000, 2500, 5000, 10000],
  },
  {
    id: "brochures",
    label: "Brochures",
    sizes: [
      { label: '8.5" × 11" Tri-fold', w: 8.5, h: 11 },
      { label: '8.5" × 11" Bi-fold', w: 8.5, h: 11 },
      { label: '8.5" × 14" Tri-fold', w: 8.5, h: 14 },
      { label: '11" × 17" Bi-fold', w: 11, h: 17 },
    ],
    papers: [
      { id: "80lb-gloss-text", label: "80lb Gloss Text", default: true },
      { id: "100lb-gloss-text", label: "100lb Gloss Text" },
      { id: "80lb-matte-text", label: "80lb Matte Text" },
    ],
    sides: ["double"],
    finishings: ["none", "uv-gloss", "uv-matte"],
    quantities: [100, 250, 500, 1000, 2500, 5000],
  },
  {
    id: "posters",
    label: "Posters",
    sizes: [
      { label: '11" × 17"', w: 11, h: 17 },
      { label: '18" × 24"', w: 18, h: 24 },
      { label: '24" × 36"', w: 24, h: 36 },
      { label: '27" × 40"', w: 27, h: 40 },
    ],
    papers: [
      { id: "80lb-gloss-text", label: "80lb Gloss Text", default: true },
      { id: "100lb-gloss-text", label: "100lb Gloss Text" },
      { id: "100lb-gloss-cover", label: "100lb Gloss Cover" },
      { id: "satin-photo", label: "Satin Photo Paper" },
    ],
    sides: ["single"],
    finishings: ["none", "uv-gloss", "uv-matte", "laminate-gloss", "laminate-matte"],
    quantities: [1, 5, 10, 25, 50, 100, 250],
  },
  {
    id: "menus",
    label: "Menus",
    sizes: [
      { label: '8.5" × 11"', w: 8.5, h: 11 },
      { label: '8.5" × 14"', w: 8.5, h: 14 },
      { label: '11" × 17" Bi-fold', w: 11, h: 17 },
      { label: '4.25" × 11" Rack Card', w: 4.25, h: 11 },
    ],
    papers: [
      { id: "100lb-gloss-cover", label: "100lb Gloss Cover", default: true },
      { id: "14pt-gloss", label: "14pt Cardstock Gloss" },
      { id: "100lb-matte-cover", label: "100lb Matte Cover" },
    ],
    sides: ["single", "double"],
    finishings: ["none", "uv-gloss", "uv-matte", "laminate-gloss", "laminate-matte"],
    quantities: [25, 50, 100, 250, 500, 1000],
  },
  {
    id: "rack-cards",
    label: "Rack Cards",
    sizes: [
      { label: '4" × 9"', w: 4, h: 9 },
      { label: '3.5" × 8.5"', w: 3.5, h: 8.5 },
    ],
    papers: [
      { id: "14pt-gloss", label: "14pt Gloss", default: true },
      { id: "14pt-matte", label: "14pt Matte" },
      { id: "16pt-gloss", label: "16pt Gloss" },
    ],
    sides: ["single", "double"],
    finishings: ["none", "uv-gloss", "uv-matte"],
    quantities: [250, 500, 1000, 2500, 5000],
  },
  {
    id: "door-hangers",
    label: "Door Hangers",
    sizes: [
      { label: '4.25" × 11"', w: 4.25, h: 11 },
      { label: '3.5" × 8.5"', w: 3.5, h: 8.5 },
    ],
    papers: [
      { id: "14pt-gloss", label: "14pt Gloss", default: true },
      { id: "14pt-matte", label: "14pt Matte" },
    ],
    sides: ["single", "double"],
    finishings: ["none", "uv-gloss", "uv-matte"],
    quantities: [250, 500, 1000, 2500, 5000],
  },
  {
    id: "envelopes",
    label: "Envelopes",
    sizes: [
      { label: '#10 (4.125" × 9.5")', w: 4.125, h: 9.5 },
      { label: 'A7 (5.25" × 7.25")', w: 5.25, h: 7.25 },
      { label: '6" × 9"', w: 6, h: 9 },
      { label: '9" × 12"', w: 9, h: 12 },
    ],
    papers: [
      { id: "70lb-white-offset", label: "70lb White Offset", default: true },
      { id: "70lb-cream-offset", label: "70lb Cream Offset" },
    ],
    sides: ["single"],
    finishings: ["none"],
    quantities: [250, 500, 1000, 2500],
  },
  {
    id: "presentation-folders",
    label: "Presentation Folders",
    sizes: [
      { label: '9" × 12"', w: 9, h: 12 },
    ],
    papers: [
      { id: "14pt-gloss", label: "14pt Gloss", default: true },
      { id: "14pt-matte", label: "14pt Matte" },
      { id: "16pt-gloss", label: "16pt Gloss" },
    ],
    sides: ["single", "double"],
    finishings: ["none", "uv-gloss", "uv-matte", "soft-touch", "spot-uv", "foil-gold"],
    quantities: [100, 250, 500, 1000],
  },
  {
    id: "greeting-cards",
    label: "Greeting & Invitation Cards",
    sizes: [
      { label: '5" × 7"', w: 5, h: 7 },
      { label: '4.25" × 5.5" (A2)', w: 4.25, h: 5.5 },
      { label: '5.5" × 8.5" (A9)', w: 5.5, h: 8.5 },
    ],
    papers: [
      { id: "14pt-matte", label: "14pt Matte", default: true },
      { id: "14pt-gloss", label: "14pt Gloss" },
      { id: "18pt-cotton", label: "18pt Cotton" },
    ],
    sides: ["single", "double"],
    finishings: ["none", "uv-matte", "soft-touch", "foil-gold", "foil-silver"],
    quantities: [25, 50, 100, 250, 500, 1000],
  },
  {
    id: "letterheads",
    label: "Letterheads",
    sizes: [
      { label: '8.5" × 11"', w: 8.5, h: 11 },
    ],
    papers: [
      { id: "70lb-white-offset", label: "70lb White Offset", default: true },
      { id: "80lb-linen", label: "80lb Linen" },
      { id: "24lb-bond", label: "24lb Bond" },
    ],
    sides: ["single", "double"],
    finishings: ["none"],
    quantities: [250, 500, 1000, 2500, 5000],
  },
];

// Reverse-lookup: product slug → print type id
const _slugMap = new Map();
for (const pt of PRINT_TYPES) {
  _slugMap.set(pt.id, pt.id);
}

// Additional slug aliases
const _slugAliases = {
  "business-cards-standard": "business-cards",
  "business-cards-premium": "business-cards",
  "business-cards-rounded": "business-cards",
  "business-cards-custom": "business-cards",
  "postcards-standard": "postcards",
  "postcards-mailing": "postcards",
  "postcards-jumbo": "postcards",
  "flyers-standard": "flyers",
  "flyers-half-page": "flyers",
  "flyers-tabloid": "flyers",
  "brochures-tri-fold": "brochures",
  "brochures-bi-fold": "brochures",
  "brochures-z-fold": "brochures",
  "posters-small-format": "posters",
  "posters-large-format": "posters",
  "menus-flat": "menus",
  "menus-bi-fold": "menus",
  "menus-tri-fold": "menus",
  "menus-table-tents": "menus",
  "rack-cards-standard": "rack-cards",
  "door-hangers-standard": "door-hangers",
  "envelopes-standard": "envelopes",
  "envelopes-windowed": "envelopes",
  "presentation-folders-standard": "presentation-folders",
  "greeting-cards-standard": "greeting-cards",
  "invitation-cards": "greeting-cards",
  "wedding-invitations": "greeting-cards",
  "letterheads-standard": "letterheads",
  "letterheads-custom": "letterheads",
};

for (const [slug, typeId] of Object.entries(_slugAliases)) {
  if (!_slugMap.has(slug)) _slugMap.set(slug, typeId);
}

/**
 * Given a product slug, return the marketing print type id if it matches, or null.
 */
export function getMarketingPrintTypeForSlug(productSlug) {
  return _slugMap.get(productSlug) || null;
}

/**
 * Get a print type definition by id.
 */
export function getMarketingPrintType(typeId) {
  return PRINT_TYPES.find((pt) => pt.id === typeId) || PRINT_TYPES[0];
}

export const FINISHING_LABELS = {
  none: "No Finishing",
  "uv-gloss": "UV Gloss",
  "uv-matte": "UV Matte",
  "soft-touch": "Soft-Touch Laminate",
  "spot-uv": "Spot UV",
  "foil-gold": "Gold Foil Stamping",
  "foil-silver": "Silver Foil Stamping",
  "laminate-gloss": "Gloss Laminate",
  "laminate-matte": "Matte Laminate",
};
