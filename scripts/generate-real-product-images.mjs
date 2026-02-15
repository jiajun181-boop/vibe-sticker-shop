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

const categoryScenes = {
  "marketing-prints": "clean print shop tabletop with paper samples and soft daylight",
  "stickers-labels": "close-up product mockup on matte surface with peel-and-stick texture",
  "rigid-signs": "studio setup with rigid sign panel and subtle shadow",
  "banners-displays": "trade show backdrop environment with realistic fabric and vinyl materials",
  "display-stands": "showroom scene with display stand hardware and printed panel",
  "window-glass-films": "storefront glass scene showing applied film texture and reflection",
  "large-format-graphics": "wide-format print environment with mounted graphics",
  "vehicle-branding-advertising": "commercial vehicle wrap mockup under natural daylight",
  "fleet-compliance-id": "fleet vehicle compliance decal close-up with clean typography areas",
  "safety-warning-decals": "industrial safety signage environment with high-contrast warning decals",
  "facility-asset-labels": "warehouse labeling scene with equipment tags and decals",
  "retail-promo": "retail counter display with promotional print materials",
  packaging: "packaging mockup scene with labels, inserts, and branded boxes",
};

function buildPrompt(product) {
  const scene = categoryScenes[product.category] || "professional product photography studio scene";
  return [
    "Use case: product-mockup",
    "Asset type: ecommerce printed-result showcase image",
    `Primary request: Photorealistic printed-after result image for "${product.name}".`,
    `Scene/background: ${scene}.`,
    `Subject: ${product.name}.`,
    "Style/medium: premium commercial product photography, realistic print production output.",
    "Composition/framing: show real finished printed item in use or installed, clear product visibility, clean ecommerce framing.",
    "Lighting/mood: natural soft light, physically accurate shadows, realistic reflections.",
    "Color palette: neutral base with navy and gold accents, subtle crescent moon motif inspired by La Lunar.",
    "Materials/textures: visible paper grain, vinyl sheen, lamination texture, cut edges, mount depth, ink coverage consistency.",
    "Constraints: no watermark, no logo text, no fake brand names, no gibberish text, final image must look like real printed production.",
    "Avoid: CGI look, blur, low resolution, oversaturation, clutter, duplicate objects, distorted geometry, unreadable artifacts.",
  ].join("\n");
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
