import fs from 'fs';
import path from 'path';

const outDir = path.join(process.cwd(), 'docs', 'lalunar-deliverables');
const emailDir = path.join(outDir, 'email-templates');
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(emailDir, { recursive: true });

const city = 'Scarborough';
const region = 'GTA';
const company = 'La Lunar Printing';

const products = [
  // Category 1
  ['business-cards','marketing-business-print','Business Cards'],
  ['postcards','marketing-business-print','Postcards'],
  ['flyers','marketing-business-print','Flyers'],
  ['brochures','marketing-business-print','Brochures (Bi-fold, Tri-fold, Z-fold)'],
  ['booklets','marketing-business-print','Booklets (Saddle Stitch, Perfect Bound, Coil)'],
  ['menus','marketing-business-print','Menus'],
  ['door-hangers','marketing-business-print','Door Hangers'],
  ['ncr-forms','marketing-business-print','NCR Forms (Carbonless, 2/3/4 Part)'],
  ['rack-cards','marketing-business-print','Rack Cards'],
  ['greeting-cards-invitations','marketing-business-print','Greeting Cards / Invitations'],
  ['posters-small-format','marketing-business-print','Posters (Small Format up to 13x19)'],
  ['bookmarks','marketing-business-print','Bookmarks'],
  ['tickets-coupons','marketing-business-print','Tickets / Coupons'],
  ['calendars','marketing-business-print','Calendars'],
  ['table-tents','marketing-business-print','Table Tents'],
  ['hang-tags','marketing-business-print','Hang Tags'],
  ['envelopes-10','marketing-business-print','Envelopes (#10 Regular, #10 Window)'],
  ['letterheads','marketing-business-print','Letterheads'],
  ['notepads','marketing-business-print','Notepads'],
  // Category 2
  ['die-cut-stickers','stickers-labels','Die-Cut Stickers (White, Clear, Frosted, Reflective, Holographic, Matte)'],
  ['kiss-cut-stickers','stickers-labels','Kiss-Cut Stickers'],
  ['sticker-sheets','stickers-labels','Sticker Sheets'],
  ['paper-labels','stickers-labels','Paper Labels (Glossy, Matte)'],
  ['roll-labels','stickers-labels','Roll Labels'],
  // Category 3
  ['yard-signs-coroplast','signs-display-boards','Yard Signs (Coroplast)'],
  ['election-signs','signs-display-boards','Election Signs'],
  ['real-estate-signs','signs-display-boards','Real Estate Signs'],
  ['open-house-signs','signs-display-boards','Open House Signs'],
  ['directional-signs','signs-display-boards','Directional Signs'],
  ['construction-signs','signs-display-boards','Construction Signs'],
  ['pvc-board-signs','signs-display-boards','PVC Board Signs'],
  ['foam-board-prints','signs-display-boards','Foam Board Prints'],
  ['a-frame-signs','signs-display-boards','A-Frame Signs'],
  // Category 4
  ['vinyl-banners','banners-displays','Vinyl Banners'],
  ['mesh-banners','banners-displays','Mesh Banners'],
  ['retractable-roll-up-banners','banners-displays','Retractable / Roll-Up Banners'],
  ['x-banners','banners-displays','X-Banners'],
  ['tabletop-banners','banners-displays','Tabletop Banners'],
  ['double-sided-banners','banners-displays','Double-Sided Banners'],
  ['pole-banners','banners-displays','Pole Banners'],
  ['backdrop-step-repeat','banners-displays','Backdrop / Step & Repeat'],
  ['feather-flags','banners-displays','Feather Flags (9/10/13/16 ft)'],
  ['teardrop-flags','banners-displays','Teardrop Flags (7/8/11/13 ft)'],
  ['custom-tent-10x10','banners-displays','Custom Tent 10x10 (Canopy with Frame)'],
  ['adjustable-telescopic-backdrop','banners-displays','Adjustable Telescopic Backdrop'],
  ['fabric-pop-up-display','banners-displays','Fabric Pop Up Display'],
  ['table-cloth','banners-displays','Table Cloth (Draped / Boxed Hemmed)'],
  // Category 5
  ['canvas-print','canvas-prints','Canvas Print (No Frame)'],
  ['gallery-wrap-canvas','canvas-prints','Gallery Wrap Canvas'],
  ['framed-canvas','canvas-prints','Framed Canvas'],
  ['multi-panel-canvas','canvas-prints','Multi-Panel Canvas (Diptych, Triptych, 4-panel, 5-panel)'],
  // Category 6
  ['static-clings','windows-walls-floors','Static Clings (White / Clear)'],
  ['window-decals','windows-walls-floors','Window Decals (White / Clear)'],
  ['one-way-vision-film','windows-walls-floors','One-Way Vision Film'],
  ['frosted-privacy-film','windows-walls-floors','Frosted / Privacy Film'],
  ['wall-decals','windows-walls-floors','Wall Decals'],
  ['floor-decals','windows-walls-floors','Floor Decals'],
  // Category 7
  ['custom-vinyl-lettering','vehicle-graphics-fleet','Custom Vinyl Lettering'],
  ['van-truck-logo-decals','vehicle-graphics-fleet','Van/Truck Logo Decals'],
  ['car-graphics','vehicle-graphics-fleet','Car Graphics'],
  ['fleet-unit-numbers','vehicle-graphics-fleet','Fleet Unit Numbers'],
  ['cvor-number-decals','vehicle-graphics-fleet','CVOR Number Decals'],
  ['gvw-tare-weight-lettering','vehicle-graphics-fleet','GVW/Tare Weight Lettering'],
  ['truck-door-lettering-kit','vehicle-graphics-fleet','Truck Door Lettering Kit'],
  ['equipment-id-decals','vehicle-graphics-fleet','Equipment ID Decals'],
  ['magnetic-vehicle-signs','vehicle-graphics-fleet','Magnetic Vehicle Signs'],
];

const categoryLabels = {
  'marketing-business-print': 'Marketing & Business Print',
  'stickers-labels': 'Stickers & Labels',
  'signs-display-boards': 'Signs & Display Boards',
  'banners-displays': 'Banners & Displays',
  'canvas-prints': 'Canvas Prints',
  'windows-walls-floors': 'Windows, Walls & Floors',
  'vehicle-graphics-fleet': 'Vehicle Graphics & Fleet',
};

const materialMap = {
  stickers: 'durable materials and clean cuts',
  labels: 'consistent colour and readable text',
  banners: 'vivid large-format output with finishing options',
  signs: 'rigid substrates with crisp print and finishing',
  canvas: 'sharp image reproduction and colour depth',
  window: 'proper application-ready films and alignment',
  vehicle: 'clean contour cutting and outdoor-grade vinyl',
  paper: 'sharp text, solid colour, and clean trimming',
};

function normalizeName(name) {
  return name.replace(/\s+/g, ' ').trim();
}

function keywordFor(name) {
  const n = name.toLowerCase();
  if (n.includes('business card')) return 'business card printing';
  if (n.includes('postcard')) return 'postcard printing';
  if (n.includes('flyer')) return 'flyer printing';
  if (n.includes('brochure')) return 'brochure printing';
  if (n.includes('booklet')) return 'booklet printing';
  if (n.includes('sticker')) return 'custom stickers';
  if (n.includes('label')) return 'custom labels';
  if (n.includes('banner')) return 'banner printing';
  if (n.includes('flag')) return 'custom flags';
  if (n.includes('canvas')) return 'canvas printing';
  if (n.includes('sign')) return 'sign printing';
  if (n.includes('window')) return 'window graphics';
  if (n.includes('film')) return 'window film printing';
  if (n.includes('vehicle') || n.includes('truck') || n.includes('car') || n.includes('fleet') || n.includes('cvor') || n.includes('gvw')) return 'vehicle graphics';
  if (n.includes('letterhead') || n.includes('envelope') || n.includes('notepad') || n.includes('ncr') || n.includes('brochure') || n.includes('booklet') || n.includes('flyer') || n.includes('postcard') || n.includes('business card')) return 'printing';
  return 'custom printing';
}

function baseTitle(name) {
  const short = name
    .replace(' (Small Format up to 13x19)', '')
    .replace(' (No Frame)', '')
    .replace(' (Canopy with Frame)', '')
    .replace('Retractable / Roll-Up', 'Retractable')
    .replace('Greeting Cards / Invitations', 'Greeting Cards & Invitations')
    .replace('Tickets / Coupons', 'Tickets & Coupons');
  return short;
}

function fitTitle(title) {
  if (title.length <= 60) return title;
  const variants = [
    title.replace(' Printing', ''),
    title.replace(' | Fast Turnaround', ''),
    title.replace(' | Scarborough', ' | Toronto'),
    title.replace('Custom ', ''),
  ];
  for (const v of variants) if (v.length <= 60) return v;
  return title.slice(0, 57).trimEnd() + '...';
}

function fitMeta(text) {
  return text.length <= 155 ? text : text.slice(0, 152).trimEnd() + '...';
}

function productFamily(name, category) {
  const n = name.toLowerCase();
  if (category === 'marketing-business-print') return 'paper';
  if (category === 'stickers-labels') return n.includes('label') ? 'labels' : 'stickers';
  if (category === 'signs-display-boards') return 'signs';
  if (category === 'banners-displays') return n.includes('flag') ? 'flags' : 'banners';
  if (category === 'canvas-prints') return 'canvas';
  if (category === 'windows-walls-floors') return n.includes('window') || n.includes('film') || n.includes('cling') ? 'window' : 'signs';
  if (category === 'vehicle-graphics-fleet') return 'vehicle';
  return 'paper';
}

function h1For(name) {
  return name
    .replace(' (Bi-fold, Tri-fold, Z-fold)', '')
    .replace(' (Saddle Stitch, Perfect Bound, Coil)', '')
    .replace(' (Carbonless, 2/3/4 Part)', '')
    .replace(' (Small Format up to 13x19)', '')
    .replace(' (9/10/13/16 ft)', '')
    .replace(' (7/8/11/13 ft)', '')
    .replace(' (Canopy with Frame)', '')
    .replace(' (No Frame)', '')
    .replace(' (Diptych, Triptych, 4-panel, 5-panel)', '')
    .replace(' (White / Clear)', '')
    .replace(' (White, Clear, Frosted, Reflective, Holographic, Matte)', '')
    .replace(' (Glossy, Matte)', '')
    .replace(' (#10 Regular, #10 Window)', '')
    .trim();
}

function descriptionFor(name, category) {
  const family = productFamily(name, category);
  const clean = h1For(name);
  const detail = name.includes('(') ? ` Options include ${name.match(/\((.*)\)/)?.[1] || ''}.` : '';
  const craft = materialMap[family] || materialMap.paper;
  return [
    `${clean} from ${company} help ${region} businesses promote with confidence using local printing in ${city}, Ontario.${detail}`.trim(),
    `We offer fast turnaround for rush campaigns, store launches, events, and reorders, with clear communication from file check to pickup or delivery.`,
    `Produced locally with attentive prepress review, your order is made for dependable quality, accurate colour, and clean finishing on every run.`,
    `Ideal for teams that want professional results without long lead times or cross-border delays.`
  ].join(' ');
}

function featuresFor(name, category) {
  const family = productFamily(name, category);
  const common = [
    'Local production in Scarborough for faster turnaround in the GTA',
    'File check and print-ready review before production starts',
    'Consistent colour and finishing with quality assurance',
    'Pickup or delivery options across Toronto and surrounding areas',
  ];
  const specific = {
    paper: ['Multiple paper stocks, sizes, and finishing options available'],
    stickers: ['Indoor/outdoor material options including white, clear, and specialty films'],
    labels: ['Batch-friendly label options for packaging, product, and retail applications'],
    signs: ['Durable substrates for indoor/outdoor display needs'],
    banners: ['Finishing options such as hems, grommets, stands, or hardware (by product)'],
    flags: ['Print + hardware package options for events and storefront promotion'],
    canvas: ['Photo-focused print quality with display-ready finishing options'],
    window: ['Application-ready materials for storefront branding and privacy graphics'],
    vehicle: ['Outdoor-grade vinyl options for branding and compliance lettering'],
  };
  return [...common.slice(0, 3), ...(specific[family] || specific.paper), common[3]];
}

function useCasesFor(name, category) {
  const n = name.toLowerCase();
  if (n.includes('business card')) return [
    'Real estate agents and sales reps handing out cards at open houses and networking events',
    'Small business owners needing quick reprints before meetings, trade shows, or launches',
    'Service contractors leaving branded contact cards after site visits in the GTA'
  ];
  if (n.includes('flyer')) return [
    'Restaurants and retailers promoting local specials in nearby neighborhoods',
    'Community groups and schools advertising events with short lead times',
    'Contractors and home services teams running door-to-door campaigns'
  ];
  if (n.includes('postcard')) return [
    'Direct mail promotions for salons, clinics, and local service businesses',
    'Real estate mailers for listings, sold notices, and farming campaigns',
    'Event invitations and thank-you inserts for customer retention'
  ];
  if (n.includes('brochure') || n.includes('booklet') || n.includes('menu')) return [
    'Restaurants, cafes, and takeout businesses updating menus or promos',
    'Clinics, schools, and organizations sharing service guides or program information',
    'Trade show teams handing out detailed product or company materials'
  ];
  if (n.includes('sticker') || n.includes('label')) return [
    'Brands labeling packaging, jars, bottles, and shipping boxes',
    'Creators selling merch, promo stickers, or event giveaway packs',
    'Retail teams running seasonal campaigns and product identification'
  ];
  if (n.includes('sign') || n.includes('board') || n.includes('a-frame')) return [
    'Contractors, campaign teams, and realtors needing fast local signage',
    'Retail storefronts and restaurants promoting walk-in traffic and offers',
    'Event organizers managing wayfinding, safety, or temporary display signage'
  ];
  if (n.includes('banner') || n.includes('backdrop') || n.includes('flag') || n.includes('tent') || n.includes('table cloth')) return [
    'Trade show booths needing branded displays with quick turnaround',
    'Pop-up events, markets, and storefront promotions in the GTA',
    'Corporate and community events requiring portable, reusable display graphics'
  ];
  if (n.includes('canvas')) return [
    'Families and photographers printing home decor and gift pieces',
    'Artists and creators selling ready-to-display wall art',
    'Businesses decorating offices, lobbies, and reception spaces'
  ];
  if (n.includes('window') || n.includes('cling') || n.includes('film') || n.includes('wall') || n.includes('floor')) return [
    'Storefront branding and seasonal promotions on glass and walls',
    'Offices adding privacy film and directional graphics',
    'Retail spaces using temporary campaigns and wayfinding graphics'
  ];
  if (category === 'vehicle-graphics-fleet') return [
    'Service vans and trucks adding logos, phone numbers, and branding',
    'Fleet operators applying unit numbers and compliance decals',
    'Equipment teams labeling assets for identification and site operations'
  ];
  return [
    'Local businesses launching campaigns with fast print timelines',
    'Events and promotions that need reliable local production',
    'Teams reordering branded materials with consistent quality'
  ];
}

const task1 = {
  products: products.map(([slug, category, rawName]) => {
    const name = normalizeName(rawName);
    const h1 = h1For(name);
    const keyword = keywordFor(name);
    const seoBase = `${h1} Printing | ${city}`;
    const seoTitle = fitTitle(seoBase.includes('Printing Printing') ? seoBase.replace(' Printing Printing',' Printing') : seoBase);
    const metaDescription = fitMeta(`${h1} by ${company} in ${city}, ON. Local printing, fast turnaround, quality-checked production, and pickup/delivery for ${region} customers.`);
    return {
      slug,
      category,
      categoryLabel: categoryLabels[category],
      seoTitle,
      metaDescription,
      h1,
      keyword,
      description: descriptionFor(name, category),
      features: featuresFor(name, category),
      useCases: useCasesFor(name, category),
    };
  })
};

fs.writeFileSync(path.join(outDir, 'task1-products-seo-content.json'), JSON.stringify(task1, null, 2));

function emailShell({ title, preheader, heading, bodyHtml, accent = '#1a365d', cta }) {
  const ctaHtml = cta ? `<tr><td style="padding:0 32px 24px 32px;"><a href="${cta.href}" style="display:inline-block;background:${accent};color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;line-height:14px;padding:12px 18px;border-radius:6px;">${cta.label}</a></td></tr>` : '';
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f7fb;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f5f7fb;margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #e7ebf3;border-radius:12px;overflow:hidden;font-family:Arial, Helvetica, sans-serif;">
          <tr>
            <td style="background:${accent};padding:22px 32px;color:#ffffff;">
              <div style="font-size:22px;line-height:26px;font-weight:700;letter-spacing:0.2px;">La Lunar Printing</div>
              <div style="font-size:12px;line-height:18px;opacity:0.9;">local printing, fast turnaround</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 8px 32px;">
              <h1 style="margin:0;font-size:24px;line-height:30px;color:#1f2937;font-weight:700;">${heading}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 8px 32px;font-size:14px;line-height:22px;color:#374151;">${bodyHtml}</td>
          </tr>
          ${ctaHtml}
          <tr>
            <td style="padding:0 32px 24px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #e7ebf3;border-radius:10px;background:#fbfcfe;">
                <tr>
                  <td style="padding:14px 16px;font-size:12px;line-height:18px;color:#4b5563;">
                    <strong style="color:#1f2937;">La Lunar Printing</strong><br />
                    <a href="https://lunarprint.ca" style="color:#1a365d;text-decoration:none;">lunarprint.ca</a><br />
                    11 Progress Ave #21, Scarborough, ON<br />
                    Phone: {{company_phone}}<br />
                    Questions? Reply to this email.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 24px;background:#faf7f0;border-top:1px solid #efe5d0;font-size:11px;line-height:17px;color:#6b7280;text-align:center;">
              (c) {{current_year}} La Lunar Printing - Scarborough, Ontario
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function tableHtml(rows) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:8px 0 16px 0;">
    <tr>
      <th align="left" style="font-size:12px;line-height:16px;color:#6b7280;padding:10px 8px;border-bottom:1px solid #e5e7eb;">Item</th>
      <th align="left" style="font-size:12px;line-height:16px;color:#6b7280;padding:10px 8px;border-bottom:1px solid #e5e7eb;">Details</th>
      <th align="right" style="font-size:12px;line-height:16px;color:#6b7280;padding:10px 8px;border-bottom:1px solid #e5e7eb;">Amount</th>
    </tr>
    ${rows.map(r => `<tr>
      <td style="padding:10px 8px;border-bottom:1px solid #f1f5f9;font-size:13px;line-height:18px;color:#111827;">${r.name}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f1f5f9;font-size:12px;line-height:18px;color:#4b5563;">${r.detail}</td>
      <td align="right" style="padding:10px 8px;border-bottom:1px solid #f1f5f9;font-size:13px;line-height:18px;color:#111827;">${r.amount}</td>
    </tr>`).join('')}
  </table>`;
}

const orderRowsDemo = [
  { name: '{{item_1_name}}', detail: '{{item_1_size}} - Qty {{item_1_qty}} x {{item_1_unit_price}}', amount: '{{item_1_subtotal}}' },
  { name: '{{item_2_name}}', detail: '{{item_2_size}} - Qty {{item_2_qty}} x {{item_2_unit_price}}', amount: '{{item_2_subtotal}}' },
];

const templates = [
  {
    file: '01-order-confirmation.html',
    html: emailShell({
      title: 'Order Confirmation',
      preheader: 'Your La Lunar Printing order has been received.',
      heading: 'Order Confirmed',
      cta: { label: 'View Order', href: '{{order_url}}' },
      bodyHtml: `
        <p style="margin:0 0 12px 0;">Hi {{customer_name}}, thank you for your order. We have received your request and our team will review your files and production details shortly.</p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 16px 0;border:1px solid #e5e7eb;border-radius:10px;background:#ffffff;">
          <tr><td style="padding:12px 14px;font-size:13px;line-height:20px;color:#374151;"><strong style="color:#111827;">Order #</strong> {{order_number}}<br /><strong style="color:#111827;">Estimated Finish Time</strong> {{estimated_finish_time}}<br /><strong style="color:#111827;">File Status</strong> {{file_status}} (Received / Pending Upload)<br /><strong style="color:#111827;">Pickup / Delivery</strong> {{fulfillment_method}} - {{pickup_or_shipping_info}}</td></tr>
        </table>
        ${tableHtml(orderRowsDemo)}
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 8px 0;">
          <tr><td style="font-size:13px;line-height:20px;color:#4b5563;padding:2px 0;">Subtotal</td><td align="right" style="font-size:13px;line-height:20px;color:#111827;padding:2px 0;">{{subtotal}}</td></tr>
          <tr><td style="font-size:13px;line-height:20px;color:#4b5563;padding:2px 0;">Shipping</td><td align="right" style="font-size:13px;line-height:20px;color:#111827;padding:2px 0;">{{shipping_amount}}</td></tr>
          <tr><td style="font-size:13px;line-height:20px;color:#4b5563;padding:2px 0;">Tax</td><td align="right" style="font-size:13px;line-height:20px;color:#111827;padding:2px 0;">{{tax_amount}}</td></tr>
          <tr><td style="font-size:16px;line-height:24px;color:#111827;padding:6px 0 0 0;font-weight:700;">Total</td><td align="right" style="font-size:16px;line-height:24px;color:#111827;padding:6px 0 0 0;font-weight:700;">{{total_amount}}</td></tr>
        </table>
        <p style="margin:12px 0 0 0;">Questions? Reply to this email and our team will help.</p>`
    })
  },
  {
    file: '02a-file-approved.html',
    html: emailShell({
      title: 'File Approved',
      preheader: 'Your artwork was approved and production is starting.',
      heading: 'File Approved - Production Starting',
      accent: '#1a365d',
      bodyHtml: `
        <p style="margin:0 0 12px 0;">Hi {{customer_name}}, Jay has reviewed your uploaded file for Order {{order_number}} and it is approved for production.</p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 14px 0;border:1px solid #dbeafe;border-radius:10px;background:#f8fbff;">
          <tr><td style="padding:12px 14px;font-size:13px;line-height:20px;color:#1f2937;"><strong>Approved File:</strong> {{file_name}}<br /><strong>Reviewed By:</strong> Jay<br /><strong>Estimated Finish Time:</strong> {{estimated_finish_time}}</td></tr>
        </table>
        <p style="margin:0 0 12px 0;">Production will begin based on the approved file. If you need to make a change, reply immediately before printing starts.</p>
        <p style="margin:0;">Thank you for choosing a local printing partner in Scarborough.</p>`
    })
  },
  {
    file: '02b-file-issue.html',
    html: emailShell({
      title: 'File Issue - Action Required',
      preheader: 'There is an issue with your uploaded file and we need a revision.',
      heading: 'File Review Update - Action Needed',
      accent: '#d4a053',
      cta: { label: 'Upload Revised File', href: '{{upload_file_url}}' },
      bodyHtml: `
        <p style="margin:0 0 12px 0;">Hi {{customer_name}}, Jay reviewed your file for Order {{order_number}} and found an issue that needs correction before we can print.</p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 14px 0;border:1px solid #f5d7a1;border-radius:10px;background:#fffaf0;">
          <tr><td style="padding:12px 14px;font-size:13px;line-height:20px;color:#1f2937;"><strong>File:</strong> {{file_name}}<br /><strong>Issue Type:</strong> {{issue_type}}<br /><strong>Notes:</strong> {{issue_notes}}<br /><strong>Recommended Fix:</strong> {{recommended_fix}}</td></tr>
        </table>
        <p style="margin:0 0 12px 0;">Reply to this email if you want us to confirm the revised file before production. We will restart your turnaround timing once the corrected file is approved.</p>
        <p style="margin:0;">Questions? Reply to this email.</p>`
    })
  },
  {
    file: '03a-ready-for-pickup.html',
    html: emailShell({
      title: 'Order Ready for Pickup',
      preheader: 'Your order is ready for pickup in Scarborough.',
      heading: 'Order Ready for Pickup',
      cta: { label: 'View Order Details', href: '{{order_url}}' },
      bodyHtml: `
        <p style="margin:0 0 12px 0;">Hi {{customer_name}}, great news - Order {{order_number}} is ready for pickup.</p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 14px 0;border:1px solid #e5e7eb;border-radius:10px;background:#ffffff;">
          <tr><td style="padding:12px 14px;font-size:13px;line-height:20px;color:#1f2937;"><strong>Pickup Address:</strong> 11 Progress Ave #21, Scarborough, ON<br /><strong>Pickup Hours:</strong> {{pickup_hours}}<br /><strong>Pickup Contact:</strong> {{pickup_contact_name}} / {{company_phone}}<br /><strong>Pickup Notes:</strong> {{pickup_notes}}</td></tr>
        </table>
        <p style="margin:0 0 12px 0;">Please bring your order number when you arrive. If someone else is picking up, reply with their name in advance.</p>
        <p style="margin:0;">Questions? Reply to this email.</p>`
    })
  },
  {
    file: '03b-order-shipped.html',
    html: emailShell({
      title: 'Order Shipped',
      preheader: 'Your La Lunar Printing order is on the way.',
      heading: 'Your Order Has Shipped',
      cta: { label: 'Track Shipment', href: '{{tracking_url}}' },
      bodyHtml: `
        <p style="margin:0 0 12px 0;">Hi {{customer_name}}, Order {{order_number}} has shipped.</p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 14px 0;border:1px solid #e5e7eb;border-radius:10px;background:#ffffff;">
          <tr><td style="padding:12px 14px;font-size:13px;line-height:20px;color:#1f2937;"><strong>Carrier:</strong> {{carrier_name}}<br /><strong>Tracking Number:</strong> {{tracking_number}}<br /><strong>Shipped Date:</strong> {{shipped_date}}<br /><strong>Estimated Delivery:</strong> {{estimated_delivery_date}}</td></tr>
        </table>
        <p style="margin:0 0 12px 0;">Tracking updates may take a little time to appear after label creation. Reply if you need delivery support.</p>
        <p style="margin:0;">Questions? Reply to this email.</p>`
    })
  },
  {
    file: '04-quote-follow-up.html',
    html: emailShell({
      title: 'Quote Follow-up',
      preheader: 'Friendly reminder about your recent quote from La Lunar Printing.',
      heading: 'Quick Follow-up on Your Quote',
      cta: { label: 'Place Order / Approve Quote', href: '{{quote_accept_url}}' },
      bodyHtml: `
        <p style="margin:0 0 12px 0;">Hi {{customer_name}}, just checking in on the quote Jay sent on {{quote_sent_date}} for {{quote_project_name}}.</p>
        <p style="margin:0 0 12px 0;">We know projects move fast, so we wanted to make it easy to continue when you're ready. Your original quote is included below for quick reference.</p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 14px 0;border:1px solid #e5e7eb;border-radius:10px;background:#ffffff;">
          <tr><td style="padding:12px 14px;font-size:13px;line-height:20px;color:#1f2937;"><strong>Quote #:</strong> {{quote_number}}<br /><strong>Items:</strong> {{quote_items_summary}}<br /><strong>Total Quoted:</strong> {{quote_total}}<br /><strong>Lead Time:</strong> {{quoted_turnaround}}<br /><strong>Valid Until:</strong> {{quote_expiry_date}}</td></tr>
        </table>
        <p style="margin:0 0 12px 0;">If you need a revision (size, quantity, material, or shipping), reply and we'll update it quickly.</p>
        <p style="margin:0;">Questions? Reply to this email.</p>`
    })
  },
  {
    file: '05-welcome-first-order-thank-you.html',
    html: emailShell({
      title: 'Welcome & First Order Thank You',
      preheader: 'Thanks for your first order with La Lunar Printing.',
      heading: 'Thank You for Your First Order',
      cta: { label: 'Shop Again', href: 'https://lunarprint.ca' },
      bodyHtml: `
        <p style="margin:0 0 12px 0;">Hi {{customer_name}}, thank you for placing your first order with La Lunar Printing. We appreciate the opportunity to support your business with local printing and fast turnaround in the GTA.</p>
        <p style="margin:0 0 12px 0;">We are a Scarborough-based print shop focused on dependable quality, clear communication, and practical turnaround times for everyday business print, stickers, signs, and displays.</p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 14px 0;border:1px solid #e5e7eb;border-radius:10px;background:#ffffff;">
          <tr><td style="padding:12px 14px;font-size:13px;line-height:20px;color:#1f2937;"><strong>Your First Order:</strong> {{order_number}}<br /><strong>Product(s):</strong> {{order_items_summary}}<br /><strong>Next Time Tip:</strong> Reorders are faster when you reference this order number.</td></tr>
        </table>
        <p style="margin:0 0 12px 0;">For repeat orders, quotes, or custom specs, simply reply to this email and our team will help.</p>
        <p style="margin:0;">Questions? Reply to this email.</p>`
    })
  },
];

for (const t of templates) {
  fs.writeFileSync(path.join(emailDir, t.file), t.html);
}

console.log(`Wrote ${task1.products.length} products JSON and ${templates.length} email templates to ${outDir}`);
