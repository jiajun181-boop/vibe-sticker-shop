// Synonym 301 redirects — common alternate names / plural mismatches
// that would otherwise 404 because no matching DB product slug exists.

export const synonymRedirects = [
  // ── lawn = yard (signs) ──
  { source: "/shop/signs-rigid-boards/lawn-signs", destination: "/shop/signs-rigid-boards/yard-sign", permanent: true },
  { source: "/shop/signs-rigid-boards/lawn-sign", destination: "/shop/signs-rigid-boards/yard-sign", permanent: true },
  { source: "/shop/:cat/lawn-signs", destination: "/shop/signs-rigid-boards/yard-sign", permanent: true },
  { source: "/shop/:cat/lawn-sign", destination: "/shop/signs-rigid-boards/yard-sign", permanent: true },
  { source: "/order/lawn-signs", destination: "/shop/signs-rigid-boards/yard-sign", permanent: true },
  { source: "/order/lawn-sign", destination: "/shop/signs-rigid-boards/yard-sign", permanent: true },

  // ── yard-signs (plural) → yard-sign (singular, actual DB slug) ──
  { source: "/shop/signs-rigid-boards/yard-signs", destination: "/shop/signs-rigid-boards/yard-sign", permanent: true },
  { source: "/order/yard-signs", destination: "/shop/signs-rigid-boards/yard-sign", permanent: true },

  // ── real-estate plural → singular (actual DB slugs) ──
  { source: "/shop/signs-rigid-boards/real-estate-signs", destination: "/shop/signs-rigid-boards/real-estate-sign", permanent: true },
  { source: "/shop/signs-rigid-boards/real-estate-frames", destination: "/shop/signs-rigid-boards/real-estate-frame", permanent: true },

  // ── pull-up banner = retractable banner stand ──
  { source: "/shop/banners-displays/pull-up-banner", destination: "/shop/banners-displays/retractable-stands", permanent: true },
  { source: "/shop/banners-displays/pull-up-banners", destination: "/shop/banners-displays/retractable-stands", permanent: true },
  { source: "/shop/:cat/pull-up-banner", destination: "/shop/banners-displays/retractable-stands", permanent: true },
  { source: "/shop/:cat/pull-up-banners", destination: "/shop/banners-displays/retractable-stands", permanent: true },
  { source: "/order/pull-up-banner", destination: "/shop/banners-displays/retractable-stands", permanent: true },
  { source: "/order/pull-up-banners", destination: "/shop/banners-displays/retractable-stands", permanent: true },

  // ── retractable-banner(s) → retractable-stands ──
  { source: "/shop/banners-displays/retractable-banner", destination: "/shop/banners-displays/retractable-stands", permanent: true },
  { source: "/shop/banners-displays/retractable-banners", destination: "/shop/banners-displays/retractable-stands", permanent: true },
  { source: "/order/retractable-banner", destination: "/shop/banners-displays/retractable-stands", permanent: true },
  { source: "/order/retractable-banners", destination: "/shop/banners-displays/retractable-stands", permanent: true },

  // ── car/truck/van wrap → vehicle-wraps ──
  { source: "/shop/vehicle-graphics-fleet/car-wrap", destination: "/shop/vehicle-graphics-fleet/vehicle-wraps", permanent: true },
  { source: "/shop/vehicle-graphics-fleet/car-wraps", destination: "/shop/vehicle-graphics-fleet/vehicle-wraps", permanent: true },
  { source: "/shop/vehicle-graphics-fleet/truck-wrap", destination: "/shop/vehicle-graphics-fleet/vehicle-wraps", permanent: true },
  { source: "/shop/vehicle-graphics-fleet/truck-wraps", destination: "/shop/vehicle-graphics-fleet/vehicle-wraps", permanent: true },
  { source: "/shop/vehicle-graphics-fleet/van-wrap", destination: "/shop/vehicle-graphics-fleet/vehicle-wraps", permanent: true },
  { source: "/shop/vehicle-graphics-fleet/van-wraps", destination: "/shop/vehicle-graphics-fleet/vehicle-wraps", permanent: true },
  { source: "/order/car-wrap", destination: "/shop/vehicle-graphics-fleet/vehicle-wraps", permanent: true },
  { source: "/order/car-wraps", destination: "/shop/vehicle-graphics-fleet/vehicle-wraps", permanent: true },
  { source: "/order/truck-wrap", destination: "/shop/vehicle-graphics-fleet/vehicle-wraps", permanent: true },
  { source: "/order/truck-wraps", destination: "/shop/vehicle-graphics-fleet/vehicle-wraps", permanent: true },
  { source: "/order/van-wrap", destination: "/shop/vehicle-graphics-fleet/vehicle-wraps", permanent: true },
  { source: "/order/van-wraps", destination: "/shop/vehicle-graphics-fleet/vehicle-wraps", permanent: true },
] as const;
