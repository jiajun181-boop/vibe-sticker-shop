// lib/marketing-print-order-config.js — Marketing & business print type definitions

export const PRINT_TYPES = [
  // ─── Existing products (12) ─────────────────────────────────────────
  {
    id: "business-cards",
    label: "Business Cards",
    subtitle: "Premium business cards with multiple paper & finishing options",
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
    id: "business-card-magnets",
    label: "Business Card Magnets",
    subtitle: "Magnetic business cards — single-sided print on flexible magnet",
    sizes: [
      { label: '3.5" × 2"', w: 3.5, h: 2 },
    ],
    papers: [
      { id: "17pt-magnet", label: "17pt Magnetic Vinyl", default: true },
    ],
    sides: ["single"],
    finishings: ["none", "uv-gloss"],
    quantities: [50, 100, 250, 500, 1000],
  },
  {
    id: "postcards",
    label: "Postcards",
    subtitle: "Full colour postcards on premium card stock",
    sizes: [
      { label: '4" × 6"', w: 4, h: 6 },
      { label: '5" × 7"', w: 5, h: 7 },
      { label: '6" × 9"', w: 6, h: 9 },
      { label: '6" × 11"', w: 6, h: 11 },
    ],
    papers: [
      { id: "14pt-gloss", label: "14pt Gloss", default: true },
    ],
    sides: ["single", "double"],
    finishings: ["none"],
    quantities: [25, 50, 100, 250, 500, 1000, 2500, 5000],
    extras: [
      {
        key: "corners",
        label: "Corners",
        options: [
          { id: "square", label: "Square", surcharge: 0 },
          { id: "rounded", label: "Rounded", surcharge: 3 },
        ],
        default: "square",
      },
    ],
  },
  {
    id: "flyers",
    label: "Flyers",
    subtitle: "Custom flyers on premium paper stocks",
    sizes: [
      { label: '8.5" × 11"', w: 8.5, h: 11 },
      { label: '5.5" × 8.5"', w: 5.5, h: 8.5 },
      { label: '4.25" × 5.5"', w: 4.25, h: 5.5 },
      { label: '11" × 17"', w: 11, h: 17 },
    ],
    papers: [
      { id: "100lb-gloss-text", label: "100lb Gloss Text", default: true },
      { id: "80lb-gloss-text", label: "80lb Gloss Text" },
      { id: "80lb-matte-text", label: "80lb Matte Text" },
    ],
    sides: ["single", "double"],
    finishings: ["none"],
    quantities: [100, 250, 500, 1000, 2500, 5000, 10000],
  },
  {
    id: "brochures-bi-fold",
    label: "Bifold Brochure",
    subtitle: "Single fold — clear, two-panel layout",
    sizes: [
      { label: '8.5" × 11" flat → Bifold to 5.5" × 8.5"', w: 8.5, h: 11 },
      { label: '11" × 17" flat → Bifold to 8.5" × 11"', w: 11, h: 17 },
    ],
    papers: [
      { id: "100lb-gloss-text", label: "100lb Gloss Text", default: true },
      { id: "80lb-gloss-text", label: "80lb Gloss Text" },
      { id: "80lb-matte-text", label: "80lb Matte Text" },
    ],
    sides: ["double"],
    finishings: ["none"],
    quantities: [100, 250, 500, 1000, 2500, 5000],
  },
  {
    id: "brochures-tri-fold",
    label: "Roll Fold Brochure",
    subtitle: "Tri-fold — panels fold inward sequentially",
    sizes: [
      { label: '8.5" × 11" flat → Folds to 3.67" × 8.5"', w: 8.5, h: 11 },
      { label: '11" × 17" flat → Folds to 5.67" × 11"', w: 11, h: 17 },
    ],
    papers: [
      { id: "100lb-gloss-text", label: "100lb Gloss Text", default: true },
      { id: "80lb-gloss-text", label: "80lb Gloss Text" },
      { id: "80lb-matte-text", label: "80lb Matte Text" },
    ],
    sides: ["double"],
    finishings: ["none"],
    quantities: [100, 250, 500, 1000, 2500, 5000],
  },
  {
    id: "brochures-z-fold",
    label: "Z Fold Brochure",
    subtitle: "Tri-fold — panels fold in alternating directions",
    sizes: [
      { label: '8.5" × 11" flat → Folds to 3.67" × 8.5"', w: 8.5, h: 11 },
      { label: '11" × 17" flat → Folds to 5.67" × 11"', w: 11, h: 17 },
    ],
    papers: [
      { id: "100lb-gloss-text", label: "100lb Gloss Text", default: true },
      { id: "80lb-gloss-text", label: "80lb Gloss Text" },
      { id: "80lb-matte-text", label: "80lb Matte Text" },
    ],
    sides: ["double"],
    finishings: ["none"],
    quantities: [100, 250, 500, 1000, 2500, 5000],
  },
  {
    id: "posters",
    label: "Posters",
    subtitle: "High-quality posters with lamination options",
    sizes: [
      { label: '11" × 17"', w: 11, h: 17 },
      { label: '18" × 24"', w: 18, h: 24 },
      { label: '24" × 36"', w: 24, h: 36 },
      { label: '27" × 40"', w: 27, h: 40 },
      { label: '36" × 48"', w: 36, h: 48 },
    ],
    customSize: { maxW: 53, maxH: 900 },
    moreSizes: 10,
    papers: [
      { id: "80lb-gloss-text", label: "80lb Gloss Text", default: true },
      { id: "100lb-gloss-text", label: "100lb Gloss Text" },
      { id: "100lb-gloss-cover", label: "100lb Gloss Cover" },
      { id: "satin-photo", label: "Satin Photo Paper" },
    ],
    sides: ["single"],
    finishings: ["none", "uv-gloss", "uv-matte", "laminate-gloss", "laminate-matte"],
    quantityMode: "input",
    quantities: [1],
  },
  {
    id: "menus-laminated",
    label: "Laminated Menu",
    subtitle: "Durable laminated restaurant menus — rounded corners included",
    sizes: [
      { label: '8.5" × 5.5"', w: 8.5, h: 5.5 },
      { label: '8.5" × 11"', w: 8.5, h: 11 },
      { label: '8.5" × 14"', w: 8.5, h: 14 },
      { label: '11" × 17"', w: 11, h: 17 },
    ],
    papers: [
      { id: "100lb-gloss-cover", label: "100lb Gloss Cover", default: true },
      { id: "100lb-matte-cover", label: "100lb Matte Cover" },
      { id: "14pt-gloss", label: "14pt Cardstock Gloss" },
    ],
    sides: ["single", "double"],
    finishings: ["laminate-gloss", "laminate-matte"],
    quantities: [1, 5, 10, 25, 50, 100],
  },
  {
    id: "menus-takeout",
    label: "Takeout Insert",
    subtitle: "Takeout and delivery menu inserts — rounded corners included",
    sizes: [
      { label: '8.5" × 5.5"', w: 8.5, h: 5.5 },
      { label: '8.5" × 11"', w: 8.5, h: 11 },
      { label: '8.5" × 14"', w: 8.5, h: 14 },
      { label: '11" × 17"', w: 11, h: 17 },
    ],
    papers: [
      { id: "20lb-bond", label: "20lb Bond (Economic)", default: true },
      { id: "100lb-gloss-text", label: "100lb Gloss Text" },
    ],
    sides: ["single", "double"],
    finishings: ["none"],
    quantities: [1, 5, 10, 25, 50, 100],
    extras: [
      {
        key: "fold",
        label: "Fold",
        options: [
          { id: "none", label: "No Fold", surcharge: 0 },
          { id: "bi-fold", label: "Bi-fold", surcharge: 0 },
          { id: "z-fold", label: "Z Fold", surcharge: 0 },
          { id: "roll-fold", label: "Roll Fold", surcharge: 0 },
        ],
        default: "none",
      },
    ],
  },
  {
    id: "table-mat",
    label: "Table Mat",
    subtitle: "Printed placemats — rounded corners included",
    sizes: [
      { label: '8.5" × 5.5"', w: 8.5, h: 5.5 },
      { label: '8.5" × 11"', w: 8.5, h: 11 },
      { label: '8.5" × 14"', w: 8.5, h: 14 },
      { label: '11" × 17"', w: 11, h: 17 },
    ],
    papers: [
      { id: "100lb-gloss-text", label: "100lb Gloss Text", default: true },
      { id: "80lb-gloss-text", label: "80lb Gloss Text" },
    ],
    sides: ["single", "double"],
    finishings: ["none"],
    quantities: [1, 5, 10, 25, 50, 100],
  },
  {
    id: "rack-cards",
    label: "Rack Cards",
    subtitle: "Full colour rack cards for brochure holders",
    sizes: [
      { label: '4" × 9"', w: 4, h: 9 },
      { label: '3.5" × 8.5"', w: 3.5, h: 8.5 },
    ],
    papers: [
      { id: "14pt-gloss", label: "14pt Gloss", default: true },
      { id: "14pt-matte", label: "14pt Matte" },
    ],
    sides: ["single", "double"],
    finishings: ["none", "laminate-gloss", "laminate-matte", "soft-touch"],
    quantities: [50, 100, 250, 500, 1000, 2500, 5000],
    extras: [
      {
        key: "corners",
        label: "Corners",
        options: [
          { id: "square", label: "Square", surcharge: 0 },
          { id: "rounded", label: "Rounded", surcharge: 3 },
        ],
        default: "square",
      },
    ],
  },
  {
    id: "door-hangers-standard",
    label: "Standard Door Hanger",
    subtitle: "Classic door hanger — no perforation",
    sizes: [
      { label: '3.5" × 8.5"', w: 3.5, h: 8.5 },
      { label: '4.25" × 11"', w: 4.25, h: 11 },
    ],
    papers: [
      { id: "14pt-gloss", label: "14pt Gloss", default: true },
      { id: "14pt-matte", label: "14pt Matte" },
    ],
    sides: ["single", "double"],
    finishings: ["none"],
    quantities: [250, 500, 1000, 2500, 5000],
  },
  {
    id: "door-hangers-perforated",
    label: "Perforated Door Hanger",
    subtitle: "Door hanger with tear-off coupon or business card",
    sizes: [
      { label: '3.5" × 8.5"', w: 3.5, h: 8.5 },
      { label: '4.25" × 11"', w: 4.25, h: 11 },
    ],
    papers: [
      { id: "14pt-gloss", label: "14pt Gloss", default: true },
      { id: "14pt-matte", label: "14pt Matte" },
    ],
    sides: ["single", "double"],
    finishings: ["none"],
    quantities: [250, 500, 1000, 2500, 5000],
    extras: [
      {
        key: "perforation",
        label: "Perforation",
        options: [
          { id: "single-perf", label: "Single Tear-Off", surcharge: 3 },
          { id: "double-perf", label: "Double Tear-Off", surcharge: 5 },
        ],
        default: "single-perf",
      },
    ],
  },
  {
    id: "door-hangers-large",
    label: "Custom Shape Door Hanger",
    subtitle: "Die-cut custom shape with optional perforation",
    sizes: [
      { label: '3.5" × 8.5"', w: 3.5, h: 8.5 },
      { label: '4.25" × 11"', w: 4.25, h: 11 },
    ],
    papers: [
      { id: "14pt-gloss", label: "14pt Gloss", default: true },
      { id: "14pt-matte", label: "14pt Matte" },
    ],
    sides: ["single", "double"],
    finishings: ["none"],
    quantities: [250, 500, 1000, 2500, 5000],
    extras: [
      {
        key: "perforation",
        label: "Perforation",
        options: [
          { id: "none", label: "No Perforation", surcharge: 0 },
          { id: "single-perf", label: "Single Tear-Off", surcharge: 3 },
          { id: "double-perf", label: "Double Tear-Off", surcharge: 5 },
        ],
        default: "none",
      },
    ],
  },
  {
    id: "greeting-cards",
    label: "Greeting Cards",
    subtitle: "Custom folded greeting cards — scored and folded in half",
    sizes: [
      { label: '10" × 7" flat → Folds to 5" × 7"', w: 10, h: 7 },
      { label: '8.5" × 5.5" flat → Folds to 4.25" × 5.5" (A2)', w: 8.5, h: 5.5 },
      { label: '11" × 8.5" flat → Folds to 5.5" × 8.5" (A9)', w: 11, h: 8.5 },
    ],
    papers: [
      { id: "14pt-gloss", label: "14pt Gloss", default: true },
      { id: "14pt-matte", label: "14pt Matte" },
    ],
    sides: ["single", "double"],
    finishings: ["none"],
    quantities: [25, 50, 100, 250, 500, 1000],
    extras: [
      {
        key: "envelopes",
        label: "Envelopes",
        options: [
          { id: "none", label: "No Envelope", surcharge: 0 },
          { id: "white", label: "White Envelope", surcharge: 0 },
        ],
        default: "none",
      },
    ],
  },
  {
    id: "letterheads",
    label: "Letterheads",
    subtitle: "Professional letterhead on premium bond & linen paper",
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
    templateBuilder: "letterhead",
  },

  // ─── New products ───────────────────────────────────────────────────
  {
    id: "bookmarks",
    label: "Bookmarks",
    subtitle: "Premium bookmarks with optional tassel & lamination",
    sizes: [
      { label: '2" × 6"', w: 2, h: 6 },
      { label: '2" × 7"', w: 2, h: 7 },
      { label: '2" × 8"', w: 2, h: 8 },
    ],
    papers: [
      { id: "14pt-c2s", label: "14pt C2S", default: true },
      { id: "16pt-c2s", label: "16pt C2S", surcharge: 5 },
      { id: "18pt-c2s", label: "18pt C2S", surcharge: 8 },
    ],
    sides: ["single", "double"],
    finishings: ["uv-gloss", "uv-matte", "soft-touch", "laminate-gloss"],
    quantities: [50, 100, 250, 500, 1000, 2500],
    extras: [
      {
        key: "corners",
        label: "Corners",
        options: [
          { id: "square", label: "Square", surcharge: 0 },
          { id: "rounded", label: "Rounded", surcharge: 3 },
        ],
        default: "square",
      },
      {
        key: "hole",
        label: "Hole / Tassel",
        options: [
          { id: "none", label: "No Hole", surcharge: 0 },
          { id: "round-hole", label: "Round Hole", surcharge: 2 },
          { id: "round-with-tassel", label: "Round + Tassel", surcharge: 10 },
        ],
        default: "none",
      },
    ],
  },
  {
    id: "calendars-wall",
    label: "Wall Calendar",
    subtitle: "Wire-O bound, 13 sheets (cover + 12 months), hole punch, no stand",
    sizes: [
      { label: '8.5" × 11" finished (opens to 8.5" × 22")', w: 8.5, h: 11 },
      { label: '11" × 17" finished (opens to 11" × 34")', w: 11, h: 17 },
      { label: '12" × 12" finished (opens to 12" × 24")', w: 12, h: 12 },
    ],
    papers: [
      { id: "100lb-gloss-text", label: "100lb Gloss Text", default: true },
      { id: "100lb-uncoated-text", label: "100lb Uncoated Text" },
    ],
    sides: ["double"],
    finishings: ["none"],
    quantities: [25, 50, 100, 250, 500],
  },
  {
    id: "calendars-desk",
    label: "Desk Calendar",
    subtitle: "Wire-O bound with easel stand, 13 sheets (cover + 12 months)",
    sizes: [
      { label: '5" × 7" finished (opens to 5" × 14")', w: 5, h: 7 },
      { label: '6" × 8" finished (opens to 6" × 16")', w: 6, h: 8 },
      { label: '8.5" × 5.5" finished (opens to 8.5" × 11")', w: 8.5, h: 5.5 },
    ],
    papers: [
      { id: "100lb-gloss-text", label: "100lb Gloss Text", default: true },
      { id: "100lb-uncoated-text", label: "100lb Uncoated Text" },
    ],
    sides: ["double"],
    finishings: ["none"],
    quantities: [25, 50, 100, 250, 500],
  },
  {
    id: "certificates",
    label: "Certificates",
    subtitle: "Custom certificates & diplomas on watermark paper — contact us for pricing",
    sizes: [
      { label: '8.5" × 11"', w: 8.5, h: 11 },
    ],
    papers: [
      { id: "watermark", label: "Watermark Paper", default: true },
    ],
    sides: ["single"],
    finishings: ["none"],
    quantities: [50, 100, 250, 500],
    contactOnly: true,
  },
  {
    id: "coupons",
    label: "Coupons",
    subtitle: "Custom coupons & vouchers with perforation & numbering",
    sizes: [
      { label: '2" × 3.5"', w: 2, h: 3.5 },
      { label: '3.5" × 8.5"', w: 3.5, h: 8.5 },
      { label: '5.5" × 8.5"', w: 5.5, h: 8.5 },
    ],
    papers: [
      { id: "100lb-gloss-text", label: "100lb Gloss Text (Thin)", default: true },
      { id: "14pt-c2s", label: "14pt C2S (Cardstock)", surcharge: 4 },
    ],
    sides: ["single"],
    finishings: ["none"],
    quantities: [100, 250, 500, 1000, 2500, 5000],
    extras: [
      {
        key: "perforation",
        label: "Perforation (Easy Tear)",
        options: [
          { id: "none", label: "No Perforation", surcharge: 0 },
          { id: "single-perf", label: "Single Perf", surcharge: 3 },
          { id: "double-perf", label: "Double Perf", surcharge: 5 },
        ],
        default: "single-perf",
      },
      {
        key: "numbering",
        label: "Numbering",
        options: [
          { id: "none", label: "No Numbering", surcharge: 0 },
          { id: "sequential", label: "Sequential", surcharge: 4 },
        ],
        default: "none",
      },
    ],
  },
  {
    id: "tickets",
    label: "Tickets",
    subtitle: "Custom event & raffle tickets with stubs & numbering",
    sizes: [
      { label: '2" × 5.5"', w: 2, h: 5.5 },
      { label: '2" × 7"', w: 2, h: 7 },
      { label: '2.75" × 5.5"', w: 2.75, h: 5.5 },
    ],
    papers: [
      { id: "100lb-gloss-text", label: "100lb Gloss Text (Thin)", default: true },
      { id: "14pt-c2s", label: "14pt C2S (Cardstock)", surcharge: 4 },
    ],
    sides: ["single"],
    finishings: ["none"],
    quantities: [100, 250, 500, 1000, 2500, 5000],
    extras: [
      {
        key: "perforation",
        label: "Perforation (Easy Tear)",
        options: [
          { id: "none", label: "No Perforation", surcharge: 0 },
          { id: "single-perf", label: "Single Perf", surcharge: 3 },
          { id: "double-perf", label: "Double Perf", surcharge: 5 },
        ],
        default: "single-perf",
      },
      {
        key: "numbering",
        label: "Numbering",
        options: [
          { id: "none", label: "No Numbering", surcharge: 0 },
          { id: "sequential", label: "Sequential", surcharge: 4 },
        ],
        default: "none",
      },
    ],
  },
  {
    id: "stamps",
    label: "Self-Inking Stamps",
    subtitle: "Custom self-inking stamps with built-in ink pad",
    sizes: [
      { label: 'S-510 (0.5" × 1.5")', w: 0.5, h: 1.5 },
      { label: 'S-520 (0.75" × 1.875")', w: 0.75, h: 1.875 },
      { label: 'S-542 (1.125" × 2.375")', w: 1.125, h: 2.375 },
      { label: 'S-827 (1.5" × 2.5")', w: 1.5, h: 2.5 },
      { label: 'R-512 (0.5" Round)', w: 0.5, h: 0.5 },
      { label: 'R-524 (1" Round)', w: 1, h: 1 },
      { label: 'R-532 (1.25" Round)', w: 1.25, h: 1.25 },
      { label: 'R-552 (1.625" Round)', w: 1.625, h: 1.625 },
    ],
    papers: [
      { id: "self-inking", label: "Self-Inking", default: true },
    ],
    sides: ["single"],
    finishings: ["none"],
    quantities: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    extras: [
      {
        key: "ink-color",
        label: "Ink Color",
        options: [
          { id: "black", label: "Black", surcharge: 0 },
          { id: "blue", label: "Blue", surcharge: 0 },
          { id: "red", label: "Red", surcharge: 0 },
          { id: "green", label: "Green", surcharge: 0 },
          { id: "violet", label: "Violet", surcharge: 0 },
        ],
        default: "black",
      },
    ],
  },
  {
    id: "tags",
    label: "Tags & Hang Tags",
    subtitle: "Custom hang tags, product labels & packaging tags",
    sizes: [
      { label: '1.5" × 2.5"', w: 1.5, h: 2.5 },
      { label: '2" × 3.5"', w: 2, h: 3.5 },
      { label: '3" × 5"', w: 3, h: 5 },
      { label: '2" × 2"', w: 2, h: 2 },
    ],
    papers: [
      { id: "14pt-c2s", label: "14pt White C2S", default: true },
      { id: "18pt-c2s", label: "18pt White C2S", surcharge: 5 },
      { id: "kraft", label: "Kraft", surcharge: 4 },
      { id: "cotton-textured", label: "Cotton Textured", surcharge: 10 },
    ],
    sides: ["single", "double"],
    finishings: ["none"],
    quantities: [50, 100, 250, 500, 1000, 2500],
    extras: [
      {
        key: "shape",
        label: "Shape",
        options: [
          { id: "rectangle", label: "Rectangle", surcharge: 0 },
          { id: "rounded-rect", label: "Rounded Rect", surcharge: 0 },
          { id: "circle", label: "Circle", surcharge: 3 },
          { id: "custom-die", label: "Custom Die", surcharge: 8 },
        ],
        default: "rectangle",
      },
      {
        key: "hole",
        label: "Hole Punch",
        options: [
          { id: "none", label: "No Hole", surcharge: 0 },
          { id: "round", label: "Round Hole", surcharge: 2 },
          { id: "slot", label: "Slot Hole", surcharge: 2 },
          { id: "round-with-string", label: "Round + String", surcharge: 8 },
        ],
        default: "none",
      },
    ],
  },
  {
    id: "notepads",
    label: "Notepads",
    subtitle: "Custom printed notepads with multiple binding options",
    sizes: [
      { label: '4.25" × 5.5"', w: 4.25, h: 5.5 },
      { label: '5.5" × 8.5"', w: 5.5, h: 8.5 },
      { label: '8.5" × 11"', w: 8.5, h: 11 },
    ],
    papers: [
      { id: "70lb-offset", label: "70lb Offset", default: true },
      { id: "60lb-recycled", label: "60lb Recycled", surcharge: 2 },
    ],
    sides: ["single", "double"],
    finishings: ["none"],
    quantities: [5, 10, 25, 50, 100, 250],
    extras: [
      {
        key: "pages",
        label: "Pages per Pad",
        options: [
          { id: "25", label: "25 Sheets", surcharge: 0 },
          { id: "50", label: "50 Sheets", surcharge: 15 },
          { id: "100", label: "100 Sheets", surcharge: 35 },
        ],
        default: "25",
      },
      {
        key: "binding",
        label: "Binding",
        options: [
          { id: "glue-top", label: "Glue Top", surcharge: 0 },
          { id: "glue-left", label: "Glue Left", surcharge: 0 },
          { id: "wire-o", label: "Wire-O", surcharge: 25 },
        ],
        default: "glue-top",
      },
      {
        key: "cover",
        label: "Cover",
        options: [
          { id: "none", label: "Chipboard Only", surcharge: 0 },
          { id: "wrap", label: "Wrap Cover", surcharge: 15 },
        ],
        default: "none",
      },
    ],
  },
  {
    id: "document-printing",
    label: "Document Printing",
    subtitle: "Order forms, waivers, release forms, contracts & general documents — 20lb bond",
    sizes: [
      { label: '8.5" × 5.5"', w: 8.5, h: 5.5 },
      { label: '8.5" × 11"', w: 8.5, h: 11 },
      { label: '11" × 17"', w: 11, h: 17 },
    ],
    papers: [
      { id: "20lb-bond", label: "20lb Bond", default: true },
    ],
    sides: ["single", "double"],
    finishings: ["none"],
    quantities: [100, 250, 500, 1000, 2500, 5000],
  },
  {
    id: "invitation-cards",
    label: "Invitation Cards",
    subtitle: "Custom invitations for weddings, events & parties",
    sizes: [
      { label: '4" × 6"', w: 4, h: 6 },
      { label: '5" × 7"', w: 5, h: 7 },
      { label: '5.25" × 5.25"', w: 5.25, h: 5.25 },
    ],
    papers: [
      { id: "14pt-c2s", label: "14pt C2S", default: true },
      { id: "16pt-c2s", label: "16pt C2S", surcharge: 5 },
      { id: "linen-white", label: "Linen White", surcharge: 6 },
      { id: "cotton-textured", label: "Cotton Textured", surcharge: 10 },
      { id: "pearl-shimmer", label: "Pearl Shimmer", surcharge: 12 },
    ],
    sides: ["single", "double"],
    finishings: ["none", "uv-matte", "soft-touch"],
    quantities: [25, 50, 100, 150, 200, 500],
    extras: [
      {
        key: "foil",
        label: "Foil Stamping",
        options: [
          { id: "none", label: "No Foil", surcharge: 0 },
          { id: "gold", label: "Gold Foil", surcharge: 40 },
          { id: "silver", label: "Silver Foil", surcharge: 40 },
          { id: "rose-gold", label: "Rose Gold Foil", surcharge: 50 },
        ],
        default: "none",
      },
      {
        key: "envelopes",
        label: "Envelopes",
        options: [
          { id: "white", label: "White Envelope", surcharge: 0 },
          { id: "kraft", label: "Kraft Envelope", surcharge: 3 },
          { id: "colored", label: "Colored Envelope", surcharge: 6 },
          { id: "none", label: "No Envelope", surcharge: 0 },
        ],
        default: "white",
      },
    ],
  },
  {
    id: "table-tents",
    label: "Table Tents",
    subtitle: "Custom table tents for restaurants, events & retail",
    sizes: [
      { label: '4" × 6"', w: 4, h: 6 },
      { label: '5" × 7"', w: 5, h: 7 },
      { label: '6" × 8"', w: 6, h: 8 },
    ],
    papers: [
      { id: "14pt-c2s", label: "14pt C2S", default: true },
      { id: "16pt-c2s", label: "16pt C2S", surcharge: 3 },
    ],
    sides: ["double"],
    finishings: ["none", "uv-gloss", "uv-matte", "soft-touch"],
    quantities: [25, 50, 100, 250, 500],
  },
  {
    id: "shelf-talkers",
    label: "Shelf Talkers",
    subtitle: "Rectangular shelf talkers with fold & adhesive — insert directly onto shelf rails",
    sizes: [
      { label: '3" × 4" (incl. 1" fold)', w: 3, h: 4 },
      { label: '4" × 5" (incl. 1" fold)', w: 4, h: 5 },
    ],
    papers: [
      { id: "14pt-c2s", label: "14pt Cardstock", default: true },
    ],
    sides: ["single", "double"],
    finishings: ["laminate-gloss", "laminate-matte"],
    quantities: [100, 250, 500, 1000, 2500, 5000, 10000],
  },
  {
    id: "shelf-danglers",
    label: "Shelf Danglers",
    subtitle: "Die-cut hanging shelf signs — large display area with drill hole for hooks",
    sizes: [
      { label: '4" × 4"', w: 4, h: 4 },
      { label: '5" × 7"', w: 5, h: 7 },
    ],
    papers: [
      { id: "14pt-c2s", label: "14pt Cardstock", default: true },
    ],
    sides: ["single", "double"],
    finishings: ["laminate-gloss", "laminate-matte"],
    quantities: [100, 250, 500, 1000, 2500, 5000, 10000],
    extras: [
      {
        key: "shape",
        label: "Shape",
        options: [
          { id: "rectangle", label: "Rectangle", surcharge: 0 },
          { id: "custom-die", label: "Custom Die-Cut", surcharge: 8 },
        ],
        default: "rectangle",
      },
    ],
  },
  {
    id: "shelf-wobblers",
    label: "Shelf Wobblers",
    subtitle: "Attention-grabbing spring-mounted shelf cards — PVC wobbler arm assembly included",
    sizes: [
      { label: '3" × 3"', w: 3, h: 3 },
      { label: '4" × 4"', w: 4, h: 4 },
    ],
    papers: [
      { id: "14pt-c2s", label: "14pt Cardstock", default: true },
    ],
    sides: ["single"],
    finishings: ["laminate-gloss", "laminate-matte"],
    quantities: [100, 250, 500, 1000, 2500, 5000, 10000],
    extras: [
      {
        key: "shape",
        label: "Shape",
        options: [
          { id: "circle", label: "Circle", surcharge: 0 },
          { id: "square", label: "Square", surcharge: 0 },
          { id: "custom-die", label: "Custom Die-Cut", surcharge: 8 },
        ],
        default: "circle",
      },
    ],
  },
  {
    id: "retail-tags",
    label: "Retail Tags",
    subtitle: "Custom retail hang tags for pricing & branding",
    sizes: [
      { label: '1.5" × 2.5" (Small)', w: 1.5, h: 2.5 },
      { label: '2" × 3" (Medium)', w: 2, h: 3 },
      { label: '2.5" × 4" (Large)', w: 2.5, h: 4 },
      { label: '3" × 5" (XL)', w: 3, h: 5 },
    ],
    papers: [
      { id: "14pt-c2s", label: "14pt C2S", default: true },
      { id: "16pt-c2s", label: "16pt C2S", surcharge: 3 },
      { id: "kraft", label: "Kraft", surcharge: 5 },
    ],
    sides: ["single", "double"],
    finishings: ["none", "uv-gloss", "uv-matte"],
    quantities: [100, 250, 500, 1000, 2500],
    extras: [
      {
        key: "corners",
        label: "Corners",
        options: [
          { id: "square", label: "Square", surcharge: 0 },
          { id: "rounded", label: "Rounded", surcharge: 3 },
        ],
        default: "square",
      },
      {
        key: "hole",
        label: "Hole Option",
        options: [
          { id: "none", label: "No Hole", surcharge: 0 },
          { id: "round", label: "Round Hole", surcharge: 2 },
          { id: "round-with-string", label: "Round + String", surcharge: 10 },
        ],
        default: "none",
      },
    ],
  },
  {
    id: "loyalty-cards",
    label: "Loyalty Cards",
    subtitle: "Custom loyalty & rewards cards with punch options",
    sizes: [
      { label: '3.5" × 2" (Standard)', w: 3.5, h: 2 },
      { label: '2" × 3.5" (Vertical)', w: 2, h: 3.5 },
      { label: '2.5" × 2.5" (Square)', w: 2.5, h: 2.5 },
    ],
    papers: [
      { id: "14pt-c2s", label: "14pt C2S", default: true },
    ],
    sides: ["single", "double"],
    finishings: ["none"],
    quantities: [100, 250, 500, 1000, 2500, 5000],
    extras: [
      {
        key: "corners",
        label: "Corners",
        options: [
          { id: "square", label: "Square", surcharge: 0 },
          { id: "rounded", label: "Rounded", surcharge: 3 },
        ],
        default: "square",
      },
    ],
  },
  {
    id: "tabletop-displays",
    label: "Tabletop Displays",
    subtitle: "Custom tabletop displays for trade shows & retail",
    sizes: [
      { label: '11" × 17" Retractable', w: 11, h: 17 },
      { label: '14" × 22" Retractable', w: 14, h: 22 },
      { label: '24" × 18" Popup', w: 24, h: 18 },
      { label: '36" × 24" Popup', w: 36, h: 24 },
      { label: '8.5" × 11" Easel', w: 8.5, h: 11 },
      { label: '11" × 17" Easel', w: 11, h: 17 },
      { label: '18" × 24" Easel', w: 18, h: 24 },
    ],
    papers: [
      { id: "vinyl", label: "Vinyl", default: true },
      { id: "fabric", label: "Fabric", surcharge: 300 },
    ],
    sides: ["single"],
    finishings: ["none"],
    quantities: [1, 2, 5, 10],
    extras: [
      {
        key: "display-type",
        label: "Display Type",
        options: [
          { id: "retractable", label: "Mini Retractable", surcharge: 0 },
          { id: "popup", label: "Tabletop Popup", surcharge: 0 },
          { id: "easel", label: "Easel Poster", surcharge: 0 },
        ],
        default: "retractable",
      },
      {
        key: "stand",
        label: "Stand",
        options: [
          { id: "included", label: "Included", surcharge: 0 },
          { id: "premium", label: "Premium Stand", surcharge: 1000 },
        ],
        default: "included",
      },
    ],
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
  "magnets-business-card": "business-card-magnets",
  "postcards-standard": "postcards",
  "postcards-mailing": "postcards",
  "postcards-jumbo": "postcards",
  "flyers-standard": "flyers",
  "flyers-half-page": "flyers",
  "flyers-tabloid": "flyers",
  "brochures-tri-fold": "brochures-tri-fold",
  "brochures-bi-fold": "brochures-bi-fold",
  "brochures-z-fold": "brochures-z-fold",
  "brochures": "brochures-bi-fold",
  "posters-small-format": "posters",
  "posters-large-format": "posters",
  "menus-laminated": "menus-laminated",
  "menus-takeout": "menus-takeout",
  "table-mat": "table-mat",
  "menus-flat": "menus-laminated",
  "menus-folded": "menus-laminated",
  "menus": "menus-laminated",
  "rack-cards-standard": "rack-cards",
  "door-hangers-standard": "door-hangers-standard",
  "door-hangers-perforated": "door-hangers-perforated",
  "door-hangers-large": "door-hangers-large",
  "door-hangers": "door-hangers-standard",
  "greeting-cards-standard": "greeting-cards",
  "wedding-invitations": "invitation-cards",
  "letterheads-standard": "letterheads",
  "letterheads-custom": "letterheads",
  "letterhead-standard": "letterheads",
  "letterhead-custom": "letterheads",
  "bookmarks-standard": "bookmarks",
  "calendars-desk": "calendars-desk",
  "calendars-wall": "calendars-wall",
  "calendars": "calendars-wall",
  "calendars-wall-desk": "calendars-desk",
  "certificates-award": "certificates",
  "certificates-gift": "certificates",
  "certificates-diploma": "certificates",
  "coupons-standard": "coupons",
  "tickets-event": "tickets",
  "tickets-raffle": "tickets",
  "stamps-self-inking": "stamps",
  "tags-hang": "tags",
  "tags-product": "tags",
  "notepads-standard": "notepads",
  "document-printing": "document-printing",
  "order-forms": "document-printing",
  "order-forms-standard": "document-printing",
  "waivers-releases": "document-printing",
  "waivers-standard": "document-printing",
  "release-waiver-forms": "document-printing",
  "release-forms": "document-printing",
  "order-form-pads": "document-printing",
  "order-forms-single": "document-printing",
  "invitation-cards-standard": "invitation-cards",
  "table-tents-standard": "table-tents",
  "shelf-displays": "shelf-talkers",
  "shelf-talker": "shelf-talkers",
  "shelf-dangler": "shelf-danglers",
  "shelf-wobbler": "shelf-wobblers",
  "wobblers": "shelf-wobblers",
  "danglers": "shelf-danglers",
  "retail-tags-standard": "retail-tags",
  "loyalty-cards-standard": "loyalty-cards",
  "tabletop-displays-standard": "tabletop-displays",
  "letterhead": "letterheads",
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
