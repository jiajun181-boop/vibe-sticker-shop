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
      { id: "14pt-matte", label: "14pt Matte" },
      { id: "16pt-gloss", label: "16pt Gloss" },
    ],
    sides: ["single", "double"],
    finishings: ["none", "uv-gloss", "uv-matte", "soft-touch"],
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
    subtitle: "Bi-fold, tri-fold & z-fold brochures",
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
    subtitle: "High-quality posters with lamination options",
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
    subtitle: "Restaurant menus with lamination options",
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
    subtitle: "Full colour rack cards for brochure holders",
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
    id: "door-hangers",
    label: "Door Hangers",
    subtitle: "Custom door hangers with tear-off options",
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
    id: "envelopes",
    label: "Envelopes",
    subtitle: "Custom printed envelopes for business & invitations",
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
    extras: [
      {
        key: "window",
        label: "Window",
        options: [
          { id: "none", label: "No Window", surcharge: 0 },
          { id: "standard", label: "Standard Window", surcharge: 4 },
          { id: "full-view", label: "Full View Window", surcharge: 8 },
        ],
        default: "none",
      },
    ],
  },
  {
    id: "presentation-folders",
    label: "Presentation Folders",
    subtitle: "Custom folders with pockets & card slits",
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
    extras: [
      {
        key: "pockets",
        label: "Pockets",
        options: [
          { id: "both", label: "Both Sides", surcharge: 0 },
          { id: "left-only", label: "Left Only", surcharge: 0 },
          { id: "right-only", label: "Right Only", surcharge: 0 },
        ],
        default: "both",
      },
      {
        key: "card-slits",
        label: "Business Card Slits",
        options: [
          { id: "none", label: "None", surcharge: 0 },
          { id: "left", label: "Left Pocket", surcharge: 0 },
          { id: "right", label: "Right Pocket", surcharge: 0 },
          { id: "both", label: "Both Pockets", surcharge: 0 },
        ],
        default: "right",
      },
    ],
  },
  {
    id: "greeting-cards",
    label: "Greeting Cards",
    subtitle: "Custom greeting cards with matching envelopes",
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
    extras: [
      {
        key: "envelopes",
        label: "Envelopes",
        options: [
          { id: "white", label: "White Envelope", surcharge: 0 },
          { id: "kraft", label: "Kraft Envelope", surcharge: 3 },
          { id: "none", label: "No Envelope", surcharge: 0 },
        ],
        default: "white",
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
    id: "calendars",
    label: "Calendars",
    subtitle: "Custom desk & wall calendars with Wire-O binding",
    sizes: [
      { label: '5" × 7" Desk', w: 5, h: 7 },
      { label: '6" × 8" Desk', w: 6, h: 8 },
      { label: '8.5" × 5.5" Desk', w: 8.5, h: 5.5 },
      { label: '8.5" × 11" Wall', w: 8.5, h: 11 },
      { label: '11" × 17" Wall', w: 11, h: 17 },
      { label: '12" × 12" Wall', w: 12, h: 12 },
    ],
    papers: [
      { id: "100lb-gloss-text", label: "100lb Gloss Text", default: true },
      { id: "100lb-uncoated-text", label: "100lb Uncoated Text" },
    ],
    sides: ["double"],
    finishings: ["none"],
    quantities: [25, 50, 100, 250, 500],
    extras: [
      {
        key: "calendar-type",
        label: "Calendar Type",
        options: [
          { id: "desk", label: "Desk Calendar", surcharge: 0 },
          { id: "wall", label: "Wall Calendar", surcharge: 0 },
        ],
        default: "desk",
      },
    ],
  },
  {
    id: "certificates",
    label: "Certificates",
    subtitle: "Custom certificates & diplomas with optional foil accents",
    sizes: [
      { label: '8.5" × 11" (Letter)', w: 8.5, h: 11 },
      { label: 'A4 (8.27" × 11.69")', w: 8.27, h: 11.69 },
      { label: '5.5" × 8.5" (Half Letter)', w: 5.5, h: 8.5 },
    ],
    papers: [
      { id: "linen-white", label: "Linen White", default: true },
      { id: "linen-cream", label: "Linen Cream" },
      { id: "parchment", label: "Parchment", surcharge: 5 },
      { id: "premium-smooth", label: "Premium Smooth", surcharge: 8 },
    ],
    sides: ["single"],
    finishings: ["none"],
    quantities: [10, 25, 50, 100, 250, 500],
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
        key: "border",
        label: "Border Style",
        options: [
          { id: "none", label: "None", surcharge: 0 },
          { id: "classic", label: "Classic", surcharge: 0 },
          { id: "ornate", label: "Ornate", surcharge: 5 },
          { id: "modern", label: "Modern", surcharge: 0 },
        ],
        default: "none",
      },
    ],
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
      { id: "100lb-gloss-text", label: "100lb Gloss Text", default: true },
      { id: "14pt-c2s", label: "14pt C2S", surcharge: 4 },
    ],
    sides: ["single", "double"],
    finishings: ["none"],
    quantities: [100, 250, 500, 1000, 2500, 5000],
    extras: [
      {
        key: "perforation",
        label: "Perforation",
        options: [
          { id: "none", label: "No Perforation", surcharge: 0 },
          { id: "single-perf", label: "Single Perf", surcharge: 3 },
          { id: "double-perf", label: "Double Perf", surcharge: 5 },
        ],
        default: "none",
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
      { id: "14pt-c2s", label: "14pt C2S", default: true },
      { id: "100lb-cover", label: "100lb Cover" },
    ],
    sides: ["single", "double"],
    finishings: ["none"],
    quantities: [100, 250, 500, 1000, 2500, 5000],
    extras: [
      {
        key: "stubs",
        label: "Tear-Off Stubs",
        options: [
          { id: "none", label: "No Stubs", surcharge: 0 },
          { id: "single-stub", label: "Single Stub", surcharge: 3 },
          { id: "double-stub", label: "Double Stub", surcharge: 5 },
        ],
        default: "none",
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
    quantities: [1, 2, 3, 5, 10],
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
    id: "order-forms",
    label: "Order Forms",
    subtitle: "Custom order forms with optional numbering & padding",
    sizes: [
      { label: '5.5" × 8.5" (Half Letter)', w: 5.5, h: 8.5 },
      { label: '8.5" × 11" (Letter)', w: 8.5, h: 11 },
      { label: '8.5" × 14" (Legal)', w: 8.5, h: 14 },
    ],
    papers: [
      { id: "20lb-bond", label: "20lb Bond", default: true },
      { id: "24lb-bond", label: "24lb Bond", surcharge: 2 },
      { id: "28lb-bond", label: "28lb Bond", surcharge: 4 },
    ],
    sides: ["single", "double"],
    finishings: ["none"],
    quantities: [100, 250, 500, 1000, 2500],
    extras: [
      {
        key: "numbering",
        label: "Numbering",
        options: [
          { id: "none", label: "No Numbering", surcharge: 0 },
          { id: "sequential", label: "Sequential", surcharge: 4 },
        ],
        default: "none",
      },
      {
        key: "binding",
        label: "Binding",
        options: [
          { id: "none", label: "None (Loose)", surcharge: 0 },
          { id: "padding-top", label: "Padding (Top)", surcharge: 8 },
          { id: "3-hole-punch", label: "3-Hole Punch", surcharge: 3 },
        ],
        default: "none",
      },
    ],
  },
  {
    id: "waivers-releases",
    label: "Waivers & Releases",
    subtitle: "Custom printed waivers & release forms",
    sizes: [
      { label: '8.5" × 11" (Letter)', w: 8.5, h: 11 },
      { label: '8.5" × 14" (Legal)', w: 8.5, h: 14 },
    ],
    papers: [
      { id: "20lb-bond", label: "20lb Bond", default: true },
      { id: "24lb-bond", label: "24lb Bond", surcharge: 2 },
      { id: "28lb-bond", label: "28lb Bond", surcharge: 4 },
    ],
    sides: ["single", "double"],
    finishings: ["none"],
    quantities: [100, 250, 500, 1000, 2500],
    extras: [
      {
        key: "numbering",
        label: "Numbering",
        options: [
          { id: "none", label: "No Numbering", surcharge: 0 },
          { id: "sequential", label: "Sequential", surcharge: 4 },
        ],
        default: "none",
      },
      {
        key: "binding",
        label: "Binding",
        options: [
          { id: "none", label: "None (Loose)", surcharge: 0 },
          { id: "padding-top", label: "Padding (Top)", surcharge: 8 },
          { id: "3-hole-punch", label: "3-Hole Punch", surcharge: 3 },
          { id: "stapled", label: "Stapled", surcharge: 2 },
        ],
        default: "none",
      },
    ],
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
    id: "shelf-displays",
    label: "Shelf Displays",
    subtitle: "Custom shelf talkers, wobblers & shelf strips",
    sizes: [
      { label: '3.5" × 5" Talker', w: 3.5, h: 5 },
      { label: '4" × 6" Talker', w: 4, h: 6 },
      { label: '3" × 3" Wobbler', w: 3, h: 3 },
      { label: '3.5" × 3.5" Wobbler', w: 3.5, h: 3.5 },
      { label: '1.25" × 48" Strip', w: 1.25, h: 48 },
      { label: '1.25" × 36" Strip', w: 1.25, h: 36 },
    ],
    papers: [
      { id: "14pt-c2s", label: "14pt C2S", default: true },
      { id: "16pt-c2s", label: "16pt C2S", surcharge: 3 },
    ],
    sides: ["single", "double"],
    finishings: ["uv-gloss", "uv-matte"],
    quantities: [25, 50, 100, 250, 500],
    extras: [
      {
        key: "style",
        label: "Display Style",
        options: [
          { id: "talker", label: "Shelf Talker", surcharge: 0 },
          { id: "wobbler", label: "Wobbler", surcharge: 0 },
          { id: "strip", label: "Shelf Strip", surcharge: 0 },
        ],
        default: "talker",
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
    id: "inserts-packaging",
    label: "Inserts & Packaging",
    subtitle: "Custom packaging inserts, thank-you cards & branded seals",
    sizes: [
      { label: '3.5" × 2" (Business Card)', w: 3.5, h: 2 },
      { label: '4" × 6"', w: 4, h: 6 },
      { label: '5" × 7"', w: 5, h: 7 },
      { label: '1.5" Round Seal', w: 1.5, h: 1.5 },
      { label: '2" Round Seal', w: 2, h: 2 },
      { label: '2" Square Seal', w: 2, h: 2 },
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
        key: "type",
        label: "Product Type",
        options: [
          { id: "insert-card", label: "Insert Card", surcharge: 0 },
          { id: "sticker-seal", label: "Sticker Seal", surcharge: 0 },
        ],
        default: "insert-card",
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
      { id: "16pt-c2s", label: "16pt C2S", surcharge: 3 },
      { id: "18pt-premium", label: "18pt Premium", surcharge: 6 },
    ],
    sides: ["single", "double"],
    finishings: ["none", "uv-gloss", "uv-matte", "soft-touch"],
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
  "wedding-invitations": "invitation-cards",
  "letterheads-standard": "letterheads",
  "letterheads-custom": "letterheads",
  "bookmarks-standard": "bookmarks",
  "calendars-desk": "calendars",
  "calendars-wall": "calendars",
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
  "order-forms-standard": "order-forms",
  "waivers-standard": "waivers-releases",
  "invitation-cards-standard": "invitation-cards",
  "table-tents-standard": "table-tents",
  "shelf-talkers": "shelf-displays",
  "shelf-wobblers": "shelf-displays",
  "retail-tags-standard": "retail-tags",
  "inserts-standard": "inserts-packaging",
  "packaging-seals": "inserts-packaging",
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
