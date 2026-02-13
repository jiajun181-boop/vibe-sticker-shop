import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "utfs.io",
      },
    ],
  },
  async redirects() {
    return [
      // ── Old marketing-prints sub-landing pages → new URLs ──
      { source: "/shop/marketing-prints/stamps", destination: "/shop/stamps", permanent: true },
      { source: "/shop/marketing-prints/business-cards", destination: "/shop/business-cards", permanent: true },

      // Sub-group landings stay within marketing-prints
      { source: "/shop/marketing-prints/stationery", destination: "/shop/marketing-prints/envelopes", permanent: true },
      { source: "/shop/marketing-prints/marketing", destination: "/shop/marketing-prints/posters", permanent: true },
      { source: "/shop/marketing-prints/cards", destination: "/shop/marketing-prints", permanent: true },

      // ── Old split-category URLs → back to marketing-prints ──
      { source: "/shop/flyers-postcards", destination: "/shop/marketing-prints", permanent: true },
      { source: "/shop/flyers-postcards/:slug", destination: "/shop/marketing-prints/:slug", permanent: true },
      { source: "/shop/brochures-booklets", destination: "/shop/marketing-prints", permanent: true },
      { source: "/shop/brochures-booklets/:slug", destination: "/shop/marketing-prints/:slug", permanent: true },
      { source: "/shop/menus", destination: "/shop/marketing-prints", permanent: true },
      { source: "/shop/menus/:slug", destination: "/shop/marketing-prints/:slug", permanent: true },
      { source: "/shop/stationery-forms", destination: "/shop/marketing-prints", permanent: true },
      { source: "/shop/stationery-forms/:slug", destination: "/shop/marketing-prints/:slug", permanent: true },
      { source: "/shop/cards-invitations", destination: "/shop/marketing-prints", permanent: true },
      { source: "/shop/cards-invitations/:slug", destination: "/shop/marketing-prints/:slug", permanent: true },
      { source: "/shop/marketing-promo", destination: "/shop/marketing-prints", permanent: true },
      { source: "/shop/marketing-promo/:slug", destination: "/shop/marketing-prints/:slug", permanent: true },

      // ── Old /shop?category= links → dedicated pages ──
      { source: "/shop", destination: "/shop/marketing-prints", permanent: false, has: [{ type: "query", key: "category", value: "marketing-prints" }] },
      { source: "/shop", destination: "/shop/stickers-labels", permanent: false, has: [{ type: "query", key: "category", value: "stickers-labels" }] },
      { source: "/shop", destination: "/shop/banners-displays", permanent: false, has: [{ type: "query", key: "category", value: "banners-displays" }] },
      { source: "/shop", destination: "/shop/rigid-signs", permanent: false, has: [{ type: "query", key: "category", value: "rigid-signs" }] },
      { source: "/shop", destination: "/shop/display-stands", permanent: false, has: [{ type: "query", key: "category", value: "display-stands" }] },
      { source: "/shop", destination: "/shop/large-format-graphics", permanent: false, has: [{ type: "query", key: "category", value: "large-format-graphics" }] },
      { source: "/shop", destination: "/shop/vehicle-branding-advertising", permanent: false, has: [{ type: "query", key: "category", value: "vehicle-branding-advertising" }] },
      { source: "/shop", destination: "/shop/fleet-compliance-id", permanent: false, has: [{ type: "query", key: "category", value: "fleet-compliance-id" }] },
      { source: "/shop", destination: "/shop/safety-warning-decals", permanent: false, has: [{ type: "query", key: "category", value: "safety-warning-decals" }] },
      { source: "/shop", destination: "/shop/facility-asset-labels", permanent: false, has: [{ type: "query", key: "category", value: "facility-asset-labels" }] },

      // ── Product deduplication — old slugs to canonical ──
      { source: "/shop/:cat/feather-flag", destination: "/shop/banners-displays/feather-flags", permanent: true },
      { source: "/shop/:cat/teardrop-flag", destination: "/shop/banners-displays/teardrop-flags", permanent: true },
      { source: "/shop/:cat/die-cut-singles", destination: "/shop/stickers-labels/stickers-single-diecut", permanent: true },
      { source: "/shop/:cat/die-cut-stickers", destination: "/shop/stickers-labels/stickers-single-diecut", permanent: true },
      { source: "/shop/:cat/sticker-sheets", destination: "/shop/stickers-labels/stickers-sheet-kisscut", permanent: true },
      { source: "/shop/:cat/kiss-cut-sticker-sheets", destination: "/shop/stickers-labels/stickers-sheet-kisscut", permanent: true },
      { source: "/shop/:cat/clear-labels", destination: "/shop/stickers-labels/labels-clear", permanent: true },
      { source: "/shop/:cat/white-bopp-labels", destination: "/shop/stickers-labels/labels-white-bopp", permanent: true },
      { source: "/shop/:cat/transfer-vinyl-lettering", destination: "/shop/stickers-labels/vinyl-lettering", permanent: true },
      { source: "/shop/:cat/foam-board", destination: "/shop/rigid-signs/rigid-foam-board-prints", permanent: true },
      { source: "/shop/:cat/coroplast-yard-signs", destination: "/shop/rigid-signs/coroplast-signs", permanent: true },
      { source: "/shop/:cat/floor-decals", destination: "/shop/large-format-graphics/floor-graphics", permanent: true },
      { source: "/shop/:cat/lf-floor-graphics", destination: "/shop/large-format-graphics/floor-graphics", permanent: true },
      { source: "/shop/:cat/vinyl-banner-13oz", destination: "/shop/banners-displays/vinyl-banners", permanent: true },
      { source: "/shop/:cat/mesh-banner", destination: "/shop/banners-displays/mesh-banners", permanent: true },
      { source: "/shop/:cat/window-decals", destination: "/shop/large-format-graphics/window-graphics", permanent: true },
      { source: "/shop/:cat/wall-decals", destination: "/shop/large-format-graphics/wall-graphics", permanent: true },
      { source: "/shop/:cat/lawn-signs-h-stake", destination: "/shop/rigid-signs/yard-sign-h-frame", permanent: true },
      { source: "/shop/:cat/self-inking-stamps", destination: "/shop/stamps", permanent: true },
      { source: "/shop/:cat/hang-tags", destination: "/shop/marketing-prints/tags-hang-tags", permanent: true },
      { source: "/shop/:cat/rp-hang-tags", destination: "/shop/marketing-prints/tags-hang-tags", permanent: true },
      { source: "/shop/:cat/rp-menus", destination: "/shop/marketing-prints/menus-flat", permanent: true },
      { source: "/shop/:cat/rp-tickets", destination: "/shop/marketing-prints/tickets", permanent: true },
    ];
  },
};

export default nextConfig;
