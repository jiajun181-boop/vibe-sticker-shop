import fs from "node:fs";
import path from "node:path";

const outDir = path.join(process.cwd(), "docs", "lalunar-deliverables");
fs.mkdirSync(outDir, { recursive: true });

const address = "11 Progress Ave #21, Scarborough, ON";

const categories = [
  {
    category: "stickers-labels-decals",
    productLabel: "stickers and labels",
    materialAnswer:
      "Vinyl is usually the best choice for outdoor use because it handles moisture and handling better than paper labels. Paper labels are a good fit for indoor packaging and short-term promotions where cost efficiency matters.",
    materialDiff:
      "Die-cut stickers are cut through the vinyl and backing to the shape of the design, while kiss-cut stickers keep a larger backing sheet for easier peeling. Sticker sheets place multiple designs on one sheet and are popular for giveaways, packs, and small retail sets.",
    durability:
      "Many vinyl options are water-resistant and can be laminated for better UV and scratch protection. Tell us how the sticker or label will be used and we can recommend the right material for indoor or outdoor conditions.",
    indoorOutdoor:
      "For storefront glass, equipment, and outdoor use, we usually recommend durable vinyl-based materials. For indoor packaging or event handouts, paper labels or simpler sticker formats may be the better value.",
    moq:
      "Minimum quantities vary by format, size, and production method, but we can support small runs for testing designs or launching a new product. If you are not sure where to start, we can suggest the most cost-effective quantity for your use case.",
    fileReq:
      "Print-ready PDF, AI, EPS, or a high-resolution PNG is preferred, and vector files are best for sharp text and accurate cut lines. For custom shapes, include bleed and a cut path if possible, and we will review the file before production.",
    turnaround:
      `Because we produce locally, many standard sticker and label jobs can be scheduled for same-day or next-day pickup when files are ready. Pickup is available at ${address}, and we also offer delivery options across the GTA.`,
    install:
      "Apply decals and labels to a clean, dry surface and press gradually to avoid bubbles or wrinkles. For larger decals on glass or painted surfaces, a squeegee and careful alignment make a big difference.",
  },
  {
    category: "marketing-business-print",
    productLabel: "marketing and business print",
    materialAnswer:
      "We offer different paper stocks and finishes depending on the product, including gloss, matte, uncoated, and heavier cardstock options. We can recommend a practical stock based on whether the item is for handouts, menus, mailers, or premium branding.",
    materialDiff:
      "Flyers are great for quick promotions, postcards work well for mail, and brochures are better when you need more room for information. Rack cards are a strong option for counters, clinics, lobbies, and tourism displays.",
    durability:
      "Most paper-based marketing print is designed for indoor use or short-term distribution. For outdoor exposure, signs, banners, or decals are usually a better choice than paper products.",
    indoorOutdoor:
      "Use paper print for indoor marketing, meetings, mailers, and in-store handouts. For outdoor campaigns or weather exposure, we can help you move the design to a sign or banner format.",
    moq:
      "Minimums vary by product, but we support both small runs and larger quantities for GTA businesses. If you are testing a campaign, we can help choose a quantity that balances budget and unit cost.",
    fileReq:
      "A print-ready PDF with bleed and safe margins is ideal, and vector-based files are preferred when available. We can also review AI, PSD, and high-resolution image files and flag common issues before production.",
    turnaround:
      `Many standard print jobs can be completed with fast local turnaround, and some products may be available for same-day or next-day pickup depending on quantity and file readiness. Pickup is available at ${address}.`,
    install:
      "Most business print products do not require installation, but finishing and handling still matter for presentation. If you need folding, trimming, scoring, or numbering, we can recommend the right production setup.",
  },
  {
    category: "signs-rigid-boards",
    productLabel: "signs and rigid boards",
    materialAnswer:
      "Coroplast is a common choice for temporary outdoor signs like yard signs, while foam board is often used for clean indoor displays. PVC board is more rigid and durable than foam board and is a strong option for longer-term indoor use and some light outdoor applications.",
    materialDiff:
      "Coroplast is lightweight and cost-effective for outdoor temporary signage, while foam board is better for indoor presentation and event display use. PVC boards are more durable and give a sturdier feel for display and mounting projects.",
    durability:
      "Durability depends on the substrate, thickness, exposure, and installation method. We can recommend the right board and finishing based on whether your sign is for a short event, a seasonal campaign, or longer-term use.",
    indoorOutdoor:
      "Yard and real estate signs are typically made with outdoor-ready coroplast, while foam board and some photo/display boards are better suited for indoor use. If your sign may be exposed to weather, tell us the location and duration before ordering.",
    moq:
      "We can produce single signs as well as bulk runs for campaigns, events, and real estate teams. Quantity pricing usually improves when sizes and layouts are standardized.",
    fileReq:
      "Vector files such as PDF, AI, or EPS are preferred for signs because text and logos stay sharp at larger sizes. For photo-heavy boards, use high-resolution images at or near final print size.",
    turnaround:
      `We offer fast local production for many common rigid sign jobs, and some can be ready for same-day or next-day pickup depending on quantity and finishing. Pickup is available at ${address}.`,
    install:
      "Installation depends on the sign type, such as H-stakes, frames, wall mounting, or easels. We can help confirm hardware compatibility and setup method before production.",
  },
  {
    category: "banners-displays",
    productLabel: "banners and event displays",
    materialAnswer:
      "Vinyl banners are a versatile option for many indoor and outdoor uses, mesh banners are better for windy areas, and fabric banners are popular for indoor displays and trade shows. We can recommend the best material based on location, event duration, and installation method.",
    materialDiff:
      "Vinyl banners are the all-around choice, mesh banners are built for airflow outdoors, and fabric banners offer a more premium look for indoor events. Retractable, X-banners, flags, and backdrops are display systems that pair graphics with hardware.",
    durability:
      "Durability depends on the material, finishing, wind exposure, and how the product is installed and stored. For repeat events or outdoor use, choosing the right material and hardware matters more than just picking the lowest price.",
    indoorOutdoor:
      "Many products in this category support outdoor use, but the correct choice depends on wind, weather, and setup location. For indoor trade shows, fabric displays and retractable systems are common because they look clean and are easy to transport.",
    moq:
      "Most banner and display products can be ordered as a single unit, which is useful for one-time events and test setups. We can also quote multi-unit runs for chains, franchises, and recurring events.",
    fileReq:
      "Print-ready PDF or vector artwork is preferred, and large-format graphics should include final dimensions and bleed where required. If you are using photos, make sure they are high resolution enough for viewing distance and output size.",
    turnaround:
      `Standard banners can often be produced quickly with local turnaround, and some rush jobs may be available for same-day or next-day pickup when files are approved early. Pickup is available at ${address}, with delivery options across the GTA.`,
    install:
      "Setup depends on the product: banners may use grommets, hems, or pole pockets, while flags and displays use specific hardware kits. We can explain the setup requirements so you order the correct hardware and accessories.",
  },
  {
    category: "canvas-prints",
    productLabel: "canvas prints",
    materialAnswer:
      "Canvas prints can be produced as standard formats, gallery wraps, or framed canvas styles depending on the look you want. The best option depends on whether you prefer a clean edge wrap, a framed presentation, or a simpler print format.",
    materialDiff:
      "A gallery wrap is stretched canvas with the image wrapped around the edges, while a framed canvas adds an outer frame for a more finished presentation. Multi-panel canvas layouts split one image across multiple pieces for a feature wall effect.",
    durability:
      "Canvas prints can last for years indoors when displayed and handled properly. To preserve the finish, avoid direct sunlight, excess humidity, and harsh cleaning products.",
    indoorOutdoor:
      "Canvas is intended for indoor display in homes, offices, lobbies, and retail spaces. For outdoor wall graphics or storefront display, a different material is usually more appropriate.",
    moq:
      "We can produce single canvas prints as well as small sets for homes, offices, and gifts. If you want multiple sizes or a gallery wall layout, we can quote the full set together.",
    fileReq:
      "High-resolution image files are the most important factor for canvas printing quality, especially at larger sizes. If you are unsure whether your file is large enough, we can review it before production and recommend a suitable size.",
    turnaround:
      `Turnaround depends on size and finishing, but local production helps us keep timing practical and communication clear for rush requests. Pickup is available at ${address}, and delivery can be arranged across the GTA.`,
    install:
      "Most canvas prints are straightforward to hang, but hardware choice depends on print size and wall type. If you share the dimensions and where it will be installed, we can suggest a safe hanging method.",
  },
  {
    category: "vehicle-graphics-fleet",
    productLabel: "vehicle graphics and fleet decals",
    materialAnswer:
      "Cut vinyl lettering is ideal for text and simple logos, printed decals support full-color graphics, and wraps cover larger areas for stronger visual impact. We can recommend a solution based on budget, coverage, and how often the graphics may need updates.",
    materialDiff:
      "Cut vinyl lettering is best for clean text and logo shapes, printed decals are better for images and gradients, and wraps are used when you want broader coverage. Fleet compliance decals and unit numbers are typically smaller standardized graphics focused on readability and consistency.",
    durability:
      "Vehicle graphics are made for outdoor use, but lifespan depends on exposure, washing habits, surface condition, and installation quality. If your vehicles are used heavily or parked outdoors full-time, we can recommend more durable material options.",
    indoorOutdoor:
      "These products are designed for outdoor vehicle and equipment use, so material and adhesive selection is more demanding than indoor decals. Let us know the surface type and environment so we can match the right film.",
    moq:
      "We can produce single-vehicle graphics or larger fleet runs, including repeat orders for unit numbers and compliance markings. If you send a full list of vehicles and required decals, we can quote and organize the project more efficiently.",
    fileReq:
      "Vector files are preferred for logos, lettering, and number decals because they scale cleanly and cut accurately. If you only have image files, send them and we can review whether they are usable or need cleanup.",
    turnaround:
      `Many decal and lettering jobs can be turned around quickly with local production, and some standard items may be available for same-day or next-day pickup when files are approved. Pickup is available at ${address}.`,
    install:
      "Small decals and lettering can often be self-installed with careful surface cleaning and alignment, but larger graphics are harder to install cleanly. For visible branding or fleet consistency, professional installation is usually the better option.",
  },
  {
    category: "windows-walls-floors",
    productLabel: "window, wall, and floor graphics",
    materialAnswer:
      "Static cling is removable and useful for temporary glass promotions, adhesive window decals are better for longer-term graphics, one-way vision film supports visibility from inside, and frosted film is commonly used for privacy. Wall and floor applications require different adhesives and surface-compatible materials, so the right choice depends on where the graphic will be installed.",
    materialDiff:
      "Static cling is non-adhesive and easy to remove, while adhesive decals are used when you need longer hold on glass or walls. One-way vision and frosted films are specialized options for storefront branding and privacy applications.",
    durability:
      "Durability depends on the material, the surface condition, and how much traffic or weather exposure the graphic receives. We can recommend the right film for short-term promos, office privacy, storefront branding, or higher-use floor applications.",
    indoorOutdoor:
      "Indoor and outdoor applications use different materials, adhesives, and finishing choices, especially for floor graphics and exposed glass. Tell us the exact surface and environment so we can recommend the correct material before printing.",
    moq:
      "Many window, wall, and floor graphics can be produced as single custom pieces, which is useful for one location or one campaign. If you are rolling out multiple sites, we can quote a batch and keep sizing consistent.",
    fileReq:
      "Print-ready PDF or vector artwork is preferred for lettering and logo-based graphics, while photo murals need high-resolution files at the intended size. We will review files before production and flag common issues such as low resolution or missing bleed.",
    turnaround:
      `Because we produce locally, many standard window and wall graphics can be completed with fast turnaround, and some jobs may qualify for same-day or next-day pickup if files are ready. Pickup is available at ${address}, with GTA delivery options available.`,
    install:
      "Installation quality depends heavily on surface prep and alignment, especially on glass and floors. We can provide application guidance, and for larger or highly visible graphics, professional installation is recommended.",
  },
];

function buildFaqSet(c) {
  return {
    category: c.category,
    faqs: [
      faq(`What material options are available for ${c.productLabel}?`, c.materialAnswer),
      faq(`What is the difference between the main ${c.productLabel} options?`, c.materialDiff),
      faq(`How durable are your ${c.productLabel}?`, c.durability),
      faq(`Are these products for indoor or outdoor use?`, c.indoorOutdoor),
      faq(`What is the minimum order quantity?`, c.moq),
      faq(`What file format do you need for artwork?`, c.fileReq),
      faq(`How fast is turnaround and pickup in the GTA?`, c.turnaround),
      faq(`Do you provide installation guidance?`, c.install),
    ],
  };
}

function faq(question, answer) {
  return { question, answer };
}

const output = {
  generatedFor: "lunarprint.ca",
  location: address,
  language: "en-CA",
  categories: categories.map(buildFaqSet),
};

fs.writeFileSync(path.join(outDir, "task6-product-faqs.json"), JSON.stringify(output, null, 2), "utf8");
console.log(
  JSON.stringify(
    {
      categories: output.categories.length,
      faqCounts: output.categories.map((c) => ({ category: c.category, count: c.faqs.length })),
    },
    null,
    2
  )
);

