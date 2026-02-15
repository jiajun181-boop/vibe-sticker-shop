#!/usr/bin/env node

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [k, ...rest] = arg.split("=");
    return [k.replace(/^--/, ""), rest.join("=")];
  })
);

const baseUrl = (args.url || process.env.VERIFY_BASE_URL || "").replace(/\/+$/, "");
const expectedSha = (args.sha || process.env.EXPECTED_SHA || "").trim();
const retries = Number(args.retries || process.env.VERIFY_RETRIES || 20);
const delayMs = Number(args.delayMs || process.env.VERIFY_DELAY_MS || 15000);

if (!baseUrl) {
  console.error("[verify] missing base URL. Use --url=https://your-app.vercel.app");
  process.exit(1);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url) {
  const res = await fetch(url, { redirect: "follow" });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // noop
  }
  return { res, text, json };
}

async function verifyOnce() {
  const versionUrl = `${baseUrl}/api/version`;
  const imageUrl = `${baseUrl}/api/product-image/die-cut-stickers?name=Die-Cut%20Stickers&category=stickers-labels`;

  const version = await fetchJson(versionUrl);
  if (!version.res.ok || !version.json) {
    throw new Error(
      `version check failed: status=${version.res.status} body=${version.text.slice(0, 200)}`
    );
  }

  const liveSha = String(version.json.commitSha || "");
  if (expectedSha && liveSha && liveSha !== "unknown") {
    const expected = expectedSha.toLowerCase();
    const actual = liveSha.toLowerCase();
    if (!actual.startsWith(expected) && expected !== actual) {
      throw new Error(`commit mismatch: expected=${expectedSha} live=${liveSha}`);
    }
  }

  const imageRes = await fetch(imageUrl, { redirect: "follow" });
  const contentType = imageRes.headers.get("content-type") || "";
  if (!imageRes.ok) {
    throw new Error(`product-image check failed: status=${imageRes.status}`);
  }
  if (!contentType.includes("image/") && !contentType.includes("svg")) {
    throw new Error(`product-image content-type unexpected: ${contentType || "none"}`);
  }

  return {
    liveSha: liveSha || "unknown",
    commitShort: String(version.json.commitShort || "unknown"),
    branch: String(version.json.branch || "unknown"),
    env: String(version.json.env || "unknown"),
    imageContentType: contentType,
  };
}

async function main() {
  let lastErr = null;
  for (let i = 1; i <= retries; i++) {
    try {
      const result = await verifyOnce();
      console.log(
        `[verify] ok attempt=${i} env=${result.env} branch=${result.branch} sha=${result.commitShort} imageCt=${result.imageContentType}`
      );
      return;
    } catch (err) {
      lastErr = err;
      console.log(`[verify] attempt=${i}/${retries} failed: ${err.message}`);
      if (i < retries) await sleep(delayMs);
    }
  }
  console.error(`[verify] failed after ${retries} attempts: ${lastErr?.message || "unknown error"}`);
  process.exit(1);
}

main().catch((err) => {
  console.error("[verify] fatal:", err);
  process.exit(1);
});

