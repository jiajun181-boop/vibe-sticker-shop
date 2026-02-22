import fs from 'fs';
import path from 'path';

const outDir = path.join(process.cwd(), 'docs', 'lalunar-deliverables');
fs.mkdirSync(outDir, { recursive: true });

const asMoney = (n) => (typeof n === 'number' ? `CA$${n.toFixed(2)}` : n);
const marginPct = (cost, sell) => ((sell - cost) / sell) * 100;

const rows = [];
function addRow(product, spec, cost, suggested, comps) {
  rows.push({
    product,
    spec,
    laLunarCost: cost,
    vistaPrint: comps.vistaPrint || 'N/A / configurator',
    printToucan: comps.printToucan || 'N/A / no exact public match',
    fourOver: comps.fourOver || 'Trade login required (no public pricing)',
    overnightPrints: comps.overnightPrints || 'N/A / no public exact match',
    stickerMule: comps.stickerMule || 'N/A',
    suggestedPrice: suggested,
    grossMarginPct: marginPct(cost, suggested),
    note: comps.note || ''
  });
}

// Stickers
[
  [50, 24, 49],
  [100, 38, 69],
  [250, 72, 119],
  [500, 118, 189],
  [1000, 198, 299],
].forEach(([qty, cost, price]) => addRow(
  'Die-Cut Stickers White Vinyl',
  `2x2 in x ${qty}`,
  cost,
  Math.round(cost * 2.1),
  {
    stickerMule: `StickerMule CA: CA$${price} (2x2 die-cut, public)` ,
    vistaPrint: 'Custom stickers via configurator (exact match not publicly listed)',
    printToucan: 'Custom stickers via quote/calculator (exact 2x2 tier not publicly listed)',
    overnightPrints: 'N/A',
    note: 'StickerMule data is a direct public 2x2 die-cut reference.'
  }
));
addRow('Die-Cut Stickers Clear Vinyl', '2x2 in x 100', 42, 89, {
  stickerMule: 'StickerMule CA Clear: CA$82 (2x2, 100)',
  vistaPrint: 'Custom clear stickers via configurator (no exact public tier)',
  printToucan: 'Custom clear stickers via quote/calculator',
  overnightPrints: 'N/A',
  note: 'Clear vinyl premium over white in cost model; StickerMule clear page used as market anchor.'
});
[
  [100, 34, 79],
  [500, 128, 239],
].forEach(([qty, cost, sm]) => addRow('Kiss-Cut Stickers', `2x2 in x ${qty}`, cost, Math.round(cost * 2.1), {
  stickerMule: `StickerMule CA: CA$${sm} (2x2 kiss-cut)` ,
  vistaPrint: 'Configurator / no exact kiss-cut tier shown publicly',
  printToucan: 'Quote / no exact kiss-cut tier shown publicly',
  overnightPrints: 'N/A'
}));
[
  [10, 18, 45],
  [25, 33, 75],
].forEach(([qty, cost, sell]) => addRow('Sticker Sheets', `8.5x11 in x ${qty}`, cost, sell, {
  stickerMule: 'StickerMule sticker sheets page shows starting price; exact 8.5x11 qty tier not publicly listed',
  vistaPrint: 'Custom sticker sheets via configurator',
  printToucan: 'Custom sticker sheets via quote',
  overnightPrints: 'N/A',
  note: 'Used internal cost + market parity estimate because exact public 8.5x11 x10/x25 tiers were not visible.'
}));

// Signs
[
  [1, 9.5, 24], [5, 38, 85], [10, 72, 149], [25, 162, 299]
].forEach(([qty,cost,sell]) => addRow('Yard Signs Coroplast', `18x24 in single-sided x ${qty}`, cost, sell, {
  vistaPrint: 'Yard signs sold via configurator (exact public tier varies by stake/options)',
  printToucan: 'Yard signs available; exact tier via calculator',
  overnightPrints: 'N/A / not a standard public product',
  stickerMule: 'N/A'
}));
[
  [1, 22, 49], [10, 168, 329]
].forEach(([qty,cost,sell]) => addRow('Yard Signs Coroplast', `24x36 in double-sided x ${qty}`, cost, sell, {
  vistaPrint: 'Configurator (double-sided large sign exact tier not publicly shown)',
  printToucan: 'Calculator / quote',
  overnightPrints: 'N/A',
  stickerMule: 'N/A'
}));
addRow('Foam Board', '24x36 in x 1', 18, 45, {
  vistaPrint: 'Foam board style signs via signage configurator (no exact public match)',
  printToucan: 'Sign boards via calculator / exact match may vary',
  overnightPrints: 'N/A',
  stickerMule: 'N/A'
});

// Banners & displays
addRow('Vinyl Banner 13oz', `3x6 ft x 1`, 44, 99, {
  vistaPrint: 'Banners via configurator (exact 3x6 / finishing affects price)',
  printToucan: 'Vinyl banners from CA$70.97 (base config; exact 3x6 varies)',
  overnightPrints: 'Overnight Prints banners from CA$49.38 (base config; exact size varies)',
  stickerMule: 'N/A'
});
addRow('Vinyl Banner 13oz', `4x8 ft x 1`, 73, 149, {
  vistaPrint: 'Banners via configurator (exact 4x8 public quote not fixed)',
  printToucan: 'Vinyl banners from CA$70.97 (base config)',
  overnightPrints: 'Overnight Prints banners from CA$49.38 (base config)',
  stickerMule: 'N/A'
});
addRow('Retractable Banner + Stand', '33x80 in x 1', 82, 159, {
  vistaPrint: 'Retractable banners via configurator (public starting price not consistently shown)',
  printToucan: 'Retractable banner stands from CA$177.90',
  overnightPrints: 'Retractable banners from CA$161.53',
  stickerMule: 'N/A',
  note: 'Premium local same-city service can justify price near PrintToucan/Overnight while offering faster pickup.'
});
addRow('Mesh Banner', '4x8 ft x 1', 68, 139, {
  vistaPrint: 'Mesh banner options limited / exact match not public',
  printToucan: 'Mesh banners from CA$177.61 (base config)',
  overnightPrints: 'No clear public mesh banner page found',
  stickerMule: 'N/A'
});

// Print products
[
  [250, 9, 24], [500, 13, 34], [1000, 22, 49]
].forEach(([qty,cost,sell]) => addRow('Business Cards 14pt', `${qty}`, cost, sell, {
  vistaPrint: 'Standard business cards start at CA$17.99 (100 cards base config)',
  printToucan: 'No direct business cards public product found',
  overnightPrints: 'Business cards from CA$7.04 (base config)',
  stickerMule: 'N/A'
}));
[
  [100, 28, 59], [250, 42, 89], [500, 68, 129]
].forEach(([qty,cost,sell]) => addRow('Flyers 100lb 8.5x11 double-sided', `${qty}`, cost, sell, {
  vistaPrint: 'Standard flyers start at CA$26.99 (base config)',
  printToucan: 'No direct business flyers public product found',
  overnightPrints: 'Flyers from CA$10.66 (base config)',
  stickerMule: 'N/A'
}));
[
  [100, 22, 49], [250, 35, 79], [500, 55, 109]
].forEach(([qty,cost,sell]) => addRow('Postcards 14pt 4x6 double-sided', `${qty}`, cost, sell, {
  vistaPrint: 'Postcards via configurator (exact public tier varies)',
  printToucan: 'No direct postcard public product found',
  overnightPrints: 'Postcards from CA$14.65 (base config)',
  stickerMule: 'N/A'
}));
[
  [100, 36, 79], [250, 62, 129]
].forEach(([qty,cost,sell]) => addRow('Brochures Tri-fold 100lb', `${qty}`, cost, sell, {
  vistaPrint: 'Tri-fold brochures via configurator (exact public tier not fixed)',
  printToucan: 'No direct brochure public product found',
  overnightPrints: 'Brochures from CA$44.11 (base config)',
  stickerMule: 'N/A'
}));
[
  [250, 70, 149], [500, 115, 229]
].forEach(([qty,cost,sell]) => addRow('Door Hangers', `${qty}`, cost, sell, {
  vistaPrint: 'Door hangers via configurator',
  printToucan: 'No direct door hanger public product found',
  overnightPrints: 'Door hangers from CA$65.33 (base config)',
  stickerMule: 'N/A'
}));

// Canvas
addRow('Canvas Gallery Wrap', '16x20 in x 1', 42, 109, {
  vistaPrint: 'Canvas prints via photo/canvas configurator (exact tier varies)',
  printToucan: 'Canvas prints product page available; exact size price via options',
  overnightPrints: 'Canvas prints from CA$65.76 (base config)',
  stickerMule: 'N/A'
});
addRow('Canvas Gallery Wrap', '24x36 in x 1', 92, 229, {
  vistaPrint: 'Canvas prints via configurator',
  printToucan: 'Canvas prints page (size-based pricing via options)',
  overnightPrints: 'Canvas prints from CA$65.76 (base size; 24x36 higher)',
  stickerMule: 'N/A'
});

// Flags (outsourced)
[
  ['Feather Flag + Pole + Cross Base','10 ft x 1',108,219,'PrintToucan feather flags from CA$195.87'],
  ['Feather Flag + Pole + Cross Base','13 ft x 1',132,269,'PrintToucan feather flags from CA$195.87'],
  ['Teardrop Flag + Pole + Cross Base','8 ft x 1',104,209,'PrintToucan teardrop flags from CA$195.87'],
  ['Teardrop Flag + Pole + Cross Base','11 ft x 1',126,259,'PrintToucan teardrop flags from CA$195.87'],
].forEach(([product,spec,cost,sell,pt]) => addRow(product,spec,cost,sell,{
  vistaPrint: 'Flags via event display catalog (public exact tier varies)',
  printToucan: pt,
  overnightPrints: 'N/A',
  stickerMule: 'N/A',
  note: `Outsourced: supplier cost approx ${asMoney(cost-12)} -> landed cost ${asMoney(cost)} -> suggested ${asMoney(sell)}; check shipping before final quote.`
}));

// Table cloth (outsourced)
[
  ['Table Cover 6ft 4-sided','x 1',126,259,'PrintToucan fitted table covers from CA$128.26'],
  ['Table Cover 8ft 4-sided','x 1',142,299,'PrintToucan fitted table covers from CA$128.26'],
].forEach(([product,spec,cost,sell,pt]) => addRow(product,spec,cost,sell,{
  vistaPrint: 'Table covers via trade show displays configurator',
  printToucan: pt,
  overnightPrints: 'N/A',
  stickerMule: 'N/A',
  note: `Outsourced: supplier cost approx ${asMoney(cost-14)} -> landed cost ${asMoney(cost)} -> suggested ${asMoney(sell)}; verify print area and fabric type.`
}));

const headers = ['product','spec','La Lunar成本','VistaPrint','PrintToucan','4Over','OvernightPrints','StickerMule','建议售价','利润率','备注'];
const csv = [headers.join(',')].concat(rows.map(r => [
  r.product,
  r.spec,
  asMoney(r.laLunarCost),
  r.vistaPrint,
  r.printToucan,
  r.fourOver,
  r.overnightPrints,
  r.stickerMule,
  asMoney(r.suggestedPrice),
  `${r.grossMarginPct.toFixed(1)}%`,
  r.note,
].map(v => '"' + String(v).replaceAll('"','""') + '"').join(','))).join('\n');

fs.writeFileSync(path.join(outDir, 'task2-competitor-pricing-comparison.csv'), '\ufeff' + csv, 'utf8');

const mdRows = rows.map(r => `| ${r.product} | ${r.spec} | ${asMoney(r.laLunarCost)} | ${r.vistaPrint} | ${r.printToucan} | ${r.fourOver} | ${r.overnightPrints} | ${r.stickerMule} | ${asMoney(r.suggestedPrice)} | ${r.grossMarginPct.toFixed(1)}% |`).join('\n');
const outsourced = rows.filter(r => /Feather Flag|Teardrop Flag|Table Cover/.test(r.product)).map(r => `- ${r.product} (${r.spec}): ${r.note} Market check: ${r.printToucan}`).join('\n');
const md = `# Task 2 - Competitor Price Research (Public Pricing Snapshot)\n\nDate: 2026-02-22 (Canada)\n\nNotes:\n- This table mixes exact public prices, public starting prices, and explicit \"no public pricing / configurator / trade login\" statuses.\n- Exact pricing for many competitors changes with options (material, finish, turnaround, shipping, account type).\n- 4Over pricing is generally trade-account gated, so public price rows are marked accordingly.\n- StickerMule/StickerGiant column uses StickerMule public data for sticker products; non-sticker products are N/A.\n\n| product | spec | La Lunar成本 | VistaPrint | PrintToucan | 4Over | OvernightPrints | StickerMule | 建议售价 | 利润率 |\n|---|---|---:|---|---|---|---|---|---:|---:|\n${mdRows}\n\n## Outsourced Products (Supplier cost -> Suggested price -> Market check)\n${outsourced}\n\n## Sources (public pages used)\n- https://www.stickermule.com/ca/products/die-cut-stickers\n- https://www.stickermule.com/ca/products/clear-stickers\n- https://www.stickermule.com/ca/products/kiss-cut-stickers\n- https://www.stickermule.com/ca/products/sticker-sheets\n- https://www.vistaprint.ca/business-cards/standard\n- https://www.vistaprint.ca/marketing-materials/flyers/standard\n- https://www.vistaprint.ca/marketing-materials/postcards\n- https://www.vistaprint.ca/marketing-materials/brochures\n- https://www.vistaprint.ca/marketing-materials/door-hangers\n- https://www.vistaprint.ca/signs-posters/banners\n- https://www.overnightprints.com/businesscards\n- https://www.overnightprints.com/flyers\n- https://www.overnightprints.com/postcards\n- https://www.overnightprints.com/brochures\n- https://www.overnightprints.com/doorhangers\n- https://www.overnightprints.com/vinylbanner\n- https://www.overnightprints.com/retractable-banners\n- https://www.overnightprints.com/posters\n- https://www.overnightprints.com/canvasprints\n- https://printtoucan.com/products/retractable-banner-stands\n- https://printtoucan.com/products/vinyl-banners\n- https://printtoucan.com/products/mesh-banners\n- https://printtoucan.com/products/feather-flags\n- https://printtoucan.com/products/teardrop-flags\n- https://printtoucan.com/products/fitted-table-covers\n- https://printtoucan.com/products/canvas-prints\n- https://www.4over.com/products.html\n- https://www.4over.com/large-format.html\n- https://www.4over.com/roll-labels.html\n- https://www.4over.com/sticker-sheets.html\n`;

fs.writeFileSync(path.join(outDir, 'task2-competitor-pricing-research.md'), '\ufeff' + md, 'utf8');
console.log(`Wrote ${rows.length} pricing comparison rows.`);
