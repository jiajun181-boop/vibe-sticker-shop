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
      // Product deduplication — 301 old slugs to canonical
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
      { source: "/shop/:cat/rp-menus", destination: "/shop/marketing-prints/mp-menus", permanent: true },
      { source: "/shop/:cat/rp-tickets", destination: "/shop/marketing-prints/mp-tickets", permanent: true },
      { source: "/shop/:cat/hang-tags", destination: "/shop/marketing-prints/tags-hang-tags", permanent: true },
      { source: "/shop/:cat/rp-hang-tags", destination: "/shop/marketing-prints/tags-hang-tags", permanent: true },
      { source: "/shop/:cat/floor-decals", destination: "/shop/large-format-graphics/floor-graphics", permanent: true },
      { source: "/shop/:cat/lf-floor-graphics", destination: "/shop/large-format-graphics/floor-graphics", permanent: true },
      { source: "/shop/:cat/vinyl-banner-13oz", destination: "/shop/banners-displays/vinyl-banners", permanent: true },
      { source: "/shop/:cat/mesh-banner", destination: "/shop/banners-displays/mesh-banners", permanent: true },
      { source: "/shop/:cat/window-decals", destination: "/shop/large-format-graphics/window-graphics", permanent: true },
      { source: "/shop/:cat/wall-decals", destination: "/shop/large-format-graphics/wall-graphics", permanent: true },
      { source: "/shop/:cat/lawn-signs-h-stake", destination: "/shop/rigid-signs/yard-sign-h-frame", permanent: true },

      // Sub-landing page redirects — parent product slug → dedicated landing
      { source: "/shop/:cat/self-inking-stamps", destination: "/shop/marketing-prints/stamps", permanent: true },
    ];
  },
};

export default nextConfig;