const DEFAULT_PRODUCT_IMAGE = "/products/stickers-color-on-white.svg";

const CATEGORY_FALLBACKS = Object.freeze({
  "banners-displays": "/products/vinyl-banners.svg",
  "business-cards": "/products/business-cards-classic.svg",
  "display-stands": "/products/retractable-banner-stand-premium.svg",
  "facility-asset-labels": "/products/asset-tags-qr-barcode.svg",
  "fleet-compliance": "/products/usdot-number-decals.svg",
  "flyers-brochures": "/products/flyers.svg",
  "paper-marketing": "/products/postcards.svg",
  "posters-prints": "/products/posters.svg",
  "rigid-signs": "/products/aluminum-signs.svg",
  "stickers-labels": "/products/stickers-color-on-white.svg",
  "stamps": "/products/stamps-s520.svg",
  "vehicle-branding-advertising": "/products/car-graphics.svg",
  "window-graphics-film": "/products/window-graphics.svg",
});

function normalizeImageUrl(value) {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "object" && typeof value.url === "string") return value.url.trim();
  return "";
}

function isLocalProductAsset(url) {
  return typeof url === "string" && url.startsWith("/products/");
}

function categoryFallback(category) {
  const key = typeof category === "string" ? category.trim().toLowerCase() : "";
  if (!key) return DEFAULT_PRODUCT_IMAGE;
  if (CATEGORY_FALLBACKS[key]) return CATEGORY_FALLBACKS[key];
  if (key.includes("sticker") || key.includes("label")) return CATEGORY_FALLBACKS["stickers-labels"];
  if (key.includes("banner") || key.includes("display")) return CATEGORY_FALLBACKS["banners-displays"];
  if (key.includes("vehicle")) return CATEGORY_FALLBACKS["vehicle-branding-advertising"];
  if (key.includes("window")) return CATEGORY_FALLBACKS["window-graphics-film"];
  if (key.includes("sign")) return CATEGORY_FALLBACKS["rigid-signs"];
  if (key.includes("stamp")) return CATEGORY_FALLBACKS.stamps;
  return DEFAULT_PRODUCT_IMAGE;
}

function buildDynamicProductImage(product, categoryHint) {
  const slug = typeof product?.slug === "string" && product.slug.trim() ? product.slug.trim() : "generic";
  const params = new URLSearchParams();

  const name = typeof product?.name === "string" ? product.name.trim() : "";
  const category =
    categoryHint ||
    product?.category ||
    product?.meta?.category ||
    product?.options?.category ||
    "";

  if (name) params.set("name", name);
  if (category) params.set("category", category);

  const qs = params.toString();
  return `/api/product-image/${encodeURIComponent(slug)}${qs ? `?${qs}` : ""}`;
}

export function getProductImage(product, categoryHint = "") {
  const fromList = normalizeImageUrl(product?.images?.[0]);
  if (fromList) {
    // DB often stores /products/*.svg that may no longer exist.
    // Route through the resolver API so missing files auto-fallback safely.
    if (isLocalProductAsset(fromList)) {
      return buildDynamicProductImage(product, categoryHint);
    }
    return fromList;
  }

  const direct = normalizeImageUrl(product?.image);
  if (direct) {
    if (isLocalProductAsset(direct)) {
      return buildDynamicProductImage(product, categoryHint);
    }
    return direct;
  }

  const thumb = normalizeImageUrl(product?.thumbnail);
  if (thumb) {
    if (isLocalProductAsset(thumb)) {
      return buildDynamicProductImage(product, categoryHint);
    }
    return thumb;
  }

  // Always provide a product-specific image URL. The API will use a real static
  // product asset when available, and fall back to a branded La Lunar SVG.
  const dynamic = buildDynamicProductImage(product, categoryHint);
  if (dynamic) return dynamic;

  const category = categoryHint || product?.category || product?.meta?.category || product?.options?.category || "";
  return categoryFallback(category);
}

export function isSvgImage(url) {
  if (typeof url !== "string") return false;
  const lower = url.toLowerCase();
  return lower.endsWith(".svg") || lower.startsWith("/api/product-image/");
}

export { DEFAULT_PRODUCT_IMAGE };
