#!/usr/bin/env node
import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function readEnvValue(key) {
  if (process.env[key]) return process.env[key];
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return "";
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx <= 0) continue;
    const k = line.slice(0, idx).trim();
    if (k !== key) continue;
    return line.slice(idx + 1).trim().replace(/^"(.*)"$/, "$1");
  }
  return "";
}

function parseArgs() {
  const args = process.argv.slice(2);
  const flags = {
    apply: args.includes("--apply"),
    limit: null,
    concurrency: 3,
    model: process.env.IMAGE_MODEL || "gpt-image-1",
    quality: process.env.IMAGE_QUALITY || "low",
    size: process.env.IMAGE_SIZE || "1024x1024",
    force: args.includes("--force"),
    maxAttempts: 8,
    minDelayMs: 13000,
  };
  const limitIdx = args.indexOf("--limit");
  if (limitIdx >= 0 && args[limitIdx + 1]) {
    flags.limit = Number(args[limitIdx + 1]);
  }
  const concIdx = args.indexOf("--concurrency");
  if (concIdx >= 0 && args[concIdx + 1]) {
    flags.concurrency = Math.max(1, Number(args[concIdx + 1]) || 3);
  }
  const modelIdx = args.indexOf("--model");
  if (modelIdx >= 0 && args[modelIdx + 1]) {
    flags.model = args[modelIdx + 1];
  }
  const qualityIdx = args.indexOf("--quality");
  if (qualityIdx >= 0 && args[qualityIdx + 1]) {
    flags.quality = args[qualityIdx + 1];
  }
  const sizeIdx = args.indexOf("--size");
  if (sizeIdx >= 0 && args[sizeIdx + 1]) {
    flags.size = args[sizeIdx + 1];
  }
  const attemptsIdx = args.indexOf("--max-attempts");
  if (attemptsIdx >= 0 && args[attemptsIdx + 1]) {
    flags.maxAttempts = Math.max(1, Number(args[attemptsIdx + 1]) || 8);
  }
  const delayIdx = args.indexOf("--min-delay-ms");
  if (delayIdx >= 0 && args[delayIdx + 1]) {
    flags.minDelayMs = Math.max(0, Number(args[delayIdx + 1]) || 13000);
  }
  return flags;
}

// ── Category-level context: scene, material cues, and physical details ──
const CATEGORY_CTX = {
  "marketing-business-print": {
    scene: "a clean white desk or marble countertop in a bright modern office, soft window light from the left",
    materials: "premium paper stock, visible paper grain and layered edges, crisp ink, smooth or textured card finish",
    props: "a few sheets fanned out or stacked neatly, a pen or plant leaf as scale reference",
  },
  "stickers-labels-decals": {
    scene: "a light wood or matte concrete surface, close-up macro angle with shallow depth of field",
    materials: "glossy or matte vinyl film, visible peel edge and kiss-cut line, adhesive backing visible on one corner",
    props: "one sticker being peeled from backing sheet, a water bottle or laptop nearby for context",
  },
  "signs-rigid-boards": {
    scene: "outdoor storefront sidewalk or indoor lobby with natural daylight, slight perspective angle",
    materials: "rigid board substrate clearly visible at the edge (foam core, coroplast flutes, acrylic thickness, aluminum brushed surface)",
    props: "mounted on a wall with standoffs, or standing on an easel, or staked in grass — whichever fits the product",
  },
  "banners-displays": {
    scene: "a trade show booth or event venue with polished concrete floor and even overhead lighting",
    materials: "fabric weave or vinyl texture, visible hem stitching or grommet hardware, pole pocket details",
    props: "retractable stand base visible, or hanging hardware, or tent frame structure",
  },
  "windows-walls-floors": {
    scene: "a real glass storefront, office wall, or retail floor — shot from a natural customer viewpoint",
    materials: "applied film on glass showing slight reflection, or vinyl on wall showing adhesion edge, or floor graphic with anti-slip texture",
    props: "the surrounding environment visible (street outside window, furniture against wall, shoes on floor graphic)",
  },
  "vehicle-graphics-fleet": {
    scene: "a white commercial van or truck parked outdoors in a clean industrial area, overcast soft daylight",
    materials: "vinyl wrap film conforming to vehicle curves, cut vinyl lettering with sharp edges, visible application texture",
    props: "vehicle body panels, door handles, and mirrors visible for realism",
  },
};

// ── Per-slug overrides for products that need very specific physical descriptions ──
const SLUG_HINTS = {
  // stickers
  "die-cut-singles": "a single custom-shaped vinyl sticker being peeled from its white backing paper, showing the die-cut edge",
  "clear-singles": "a transparent sticker applied to a glass water bottle, showing see-through clarity with white ink details",
  "holographic-singles": "a holographic rainbow-shimmer sticker catching light at an angle, iridescent metallic surface",
  "kiss-cut-sticker-sheets": "a sheet of kiss-cut stickers with multiple designs, one sticker half-peeled from the sheet",
  "sticker-sheets": "a full printed sticker sheet (8.5×11 inches) with rows of colorful stickers on a desk",
  "roll-labels": "a roll of custom labels partially unrolled on a table, showing the labels on a roll core",
  "clear-labels": "clear transparent labels applied to amber glass bottles, creating a no-label look",
  "kraft-paper-labels": "natural brown kraft paper labels on artisan jars, rustic organic aesthetic",
  // signs
  "coroplast-signs": "a corrugated plastic sign showing visible flute edges, lightweight and weatherproof",
  "acrylic-signs": "a thick clear acrylic sign mounted with standoffs on a white wall, edge-lit glow effect",
  "aluminum-signs": "a brushed aluminum sign with crisp printed graphics, industrial premium feel",
  "foam-board-prints": "a lightweight foam board print on an easel at an event, visible foam core edge",
  "yard-sign": "a corrugated plastic yard sign staked in a green lawn with an H-frame wire stake",
  "a-frame-sandwich-board": "a folding A-frame sidewalk sign on a city sidewalk outside a café",
  "life-size-cutout": "a life-size cardboard standee cutout of a person with a support stand behind",
  // banners
  "vinyl-banners": "a large vinyl banner with grommets hanging on a fence or building exterior",
  "mesh-banners": "a mesh wind-through banner on a chain-link fence, showing the perforated texture",
  "pull-up-banner": "a retractable pull-up banner stand in a hotel lobby, cassette base visible",
  "feather-flag": "a tall feather flag on a cross base outside a car dealership, fluttering slightly",
  "fabric-banner": "a fabric banner with sewn edges hanging from a pole, soft drape visible",
  // business print
  "business-cards-classic": "a stack of thick business cards on a marble surface, showing layered paper edges and a subtle emboss",
  "flyers": "a fan of glossy flyers on a counter, vivid full-color print visible",
  "brochures": "a tri-fold brochure partially opened on a desk, showing all three panels",
  "postcards": "a stack of postcards with rounded corners, full-bleed photo on front visible",
  "booklets": "a saddle-stitched booklet open to the middle spread, spine staples visible",
  // vehicle
  "full-vehicle-wrap-design-print": "a white van with a full-color printed vehicle wrap, parked in front of a building",
  "car-door-magnets-pair": "a magnetic sign on a car door, showing it being placed by hand",
  "magnetic-car-signs": "a car with a custom magnetic sign on the door panel, easily removable",
  // windows-walls-floors
  "frosted-privacy-film": "frosted film applied to an office glass partition, creating privacy while letting light through",
  "floor-graphics": "a colorful floor graphic on a retail store tile floor with shoes walking nearby",
  "wall-murals": "a large photographic wall mural covering an entire office wall, vibrant and seamless",
  "window-graphics": "a storefront window with full-color vinyl graphics advertising a sale",
  "perforated-window-film": "one-way perforated window film on a storefront — graphic visible outside, see-through from inside",
};

function buildPrompt(product) {
  const ctx = CATEGORY_CTX[product.category] || {
    scene: "a professional product photography studio with a clean white sweep background and soft diffused lighting",
    materials: "the actual physical material and finish of the product clearly visible",
    props: "minimal props, focus on the product",
  };

  const slugHint = SLUG_HINTS[product.slug] || "";

  const lines = [
    `Photorealistic product photo of: ${product.name}.`,
    "",
    `Scene: ${ctx.scene}.`,
    `Materials & texture: ${ctx.materials}.`,
    `Props & context: ${ctx.props}.`,
  ];

  if (slugHint) {
    lines.push(`Specific detail: ${slugHint}.`);
  }

  if (product.description && product.description.length > 30) {
    // extract first sentence of description for context
    const firstSentence = product.description.split(/\.\s/)[0];
    lines.push(`Product context: ${firstSentence}.`);
  }

  lines.push(
    "",
    "Photography style: high-end commercial product photography, like Vistaprint or MOO product pages.",
    "Camera: shot on a 50mm f/1.8 lens, shallow depth of field with the product tack-sharp and background softly blurred.",
    "Lighting: natural soft daylight with a subtle fill, gentle shadows for depth, no harsh specular highlights.",
    "Color: true-to-life warm neutral tones, the product should be the colorful hero against a clean background.",
    "",
    "CRITICAL RULES:",
    "- DO NOT render any text, letters, words, logos, or writing on the product. The printed area should show abstract colorful geometric patterns, gradients, or lifestyle imagery instead.",
    "- DO NOT use navy blue / dark blue as the dominant product color. Use varied, natural, market-appropriate colors.",
    "- Show the real physical product as it would arrive to a customer — printed, finished, trimmed, ready to use.",
    "- Show material edge, thickness, and substrate clearly visible.",
    "- The image should look like it was shot by a professional photographer, not AI-generated.",
    "- No watermarks, no text overlays, no badges.",
  );

  return lines.join("\n");
}

async function ensureImageUrl(productId, slug, alt) {
  const url = `/products/${slug}.png`;
  const first = await prisma.productImage.findFirst({
    where: { productId },
    orderBy: { sortOrder: "asc" },
  });
  if (!first) {
    await prisma.productImage.create({
      data: { productId, url, alt: alt || null, sortOrder: 0 },
    });
    return;
  }
  await prisma.productImage.update({
    where: { id: first.id },
    data: { url, alt: first.alt || alt || null },
  });
}

async function main() {
  const flags = parseArgs();
  const apiKey = readEnvValue("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing (env or .env).");
  }

  const outDir = path.join(process.cwd(), "public", "products");
  fs.mkdirSync(outDir, { recursive: true });

  let products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      slug: true,
      name: true,
      category: true,
      description: true,
      images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  products = products.filter((p) => {
    const filePath = path.join(outDir, `${p.slug}.png`);
    return flags.force || !fs.existsSync(filePath);
  });
  if (flags.limit && Number.isFinite(flags.limit)) {
    products = products.slice(0, flags.limit);
  }

  console.log(
    JSON.stringify(
      {
        apply: flags.apply,
        totalCandidates: products.length,
        outDir,
        model: flags.model,
        quality: flags.quality,
        size: flags.size,
        concurrency: flags.concurrency,
        maxAttempts: flags.maxAttempts,
        minDelayMs: flags.minDelayMs,
      },
      null,
      2,
    ),
  );

  if (!flags.apply) {
    console.log("Dry-run only. Re-run with --apply to generate and write images.");
    return;
  }

  const client = new OpenAI({ apiKey });
  const queue = [...products];
  let ok = 0;
  let fail = 0;
  const failures = [];

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const parseRetryAfterMs = (message) => {
    const m = String(message).match(/try again in\s+(\d+)s/i);
    if (m) return (Number(m[1]) + 1) * 1000;
    return 15000;
  };

  async function generateWithRetry(p) {
    let attempt = 0;
    while (attempt < flags.maxAttempts) {
      attempt += 1;
      try {
        const resp = await client.images.generate({
          model: flags.model,
          prompt: buildPrompt(p),
          size: flags.size,
          quality: flags.quality,
          output_format: "png",
        });
        return resp;
      } catch (err) {
        const msg = err?.message || String(err);
        const is429 = /429|rate limit/i.test(msg);
        if (!is429 || attempt >= flags.maxAttempts) throw err;
        const waitMs = Math.max(flags.minDelayMs, parseRetryAfterMs(msg));
        console.error(`[retry] ${p.slug} attempt ${attempt}/${flags.maxAttempts} wait=${waitMs}ms`);
        await sleep(waitMs);
      }
    }
    throw new Error(`Retries exhausted for ${p.slug}`);
  }

  async function worker(workerId) {
    while (queue.length > 0) {
      const p = queue.shift();
      if (!p) break;
      const filePath = path.join(outDir, `${p.slug}.png`);
      try {
        const resp = await generateWithRetry(p);
        const b64 = resp.data?.[0]?.b64_json;
        if (!b64) throw new Error("No image data returned.");
        fs.writeFileSync(filePath, Buffer.from(b64, "base64"));
        await ensureImageUrl(p.id, p.slug, p.name);
        ok += 1;
        console.log(`[ok][w${workerId}] ${ok + fail}/${products.length} ${p.slug}`);
      } catch (err) {
        fail += 1;
        const msg = err?.message || String(err);
        failures.push({ slug: p.slug, error: msg });
        console.error(`[fail][w${workerId}] ${ok + fail}/${products.length} ${p.slug} :: ${msg}`);
      }
    }
  }

  const workers = Array.from({ length: flags.concurrency }, (_, i) => worker(i + 1));
  await Promise.all(workers);

  const reportPath = path.join(process.cwd(), "tmp", "imagegen", "real-image-report.json");
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        ok,
        fail,
        total: products.length,
        failures,
      },
      null,
      2,
    ),
    "utf8",
  );

  console.log(`Done. success=${ok} failed=${fail} report=${reportPath}`);
}

main()
  .catch((e) => {
    console.error(e?.stack || e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
