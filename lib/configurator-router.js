// lib/configurator-router.js — Unified reverse-lookup for all configurators
// Returns { component, defaultValue } or null if no configurator matches.

import { getCuttingTypeForSlug } from "./sticker-order-config";
import { getBookletBindingForSlug } from "./booklet-order-config";
import { getNcrTypeForSlug } from "./ncr-order-config";
import { getBannerTypeForSlug } from "./banner-order-config";
import { getSignTypeForSlug } from "./sign-order-config";
import { getVehicleTypeForSlug } from "./vehicle-order-config";
import { getSurfaceTypeForSlug } from "./surface-order-config";

/**
 * Given a product slug, returns the configurator to render, or null.
 *
 * @param {string} slug — product slug
 * @returns {{ component: string, defaultValue: string } | null}
 *
 * component values: "stickers" | "booklets" | "ncr" | "banners" | "signs" | "vehicle" | "surfaces"
 */
export function getConfiguratorForSlug(slug) {
  const sticker = getCuttingTypeForSlug(slug);
  if (sticker) return { component: "stickers", defaultValue: sticker };

  const booklet = getBookletBindingForSlug(slug);
  if (booklet) return { component: "booklets", defaultValue: booklet };

  const ncr = getNcrTypeForSlug(slug);
  if (ncr) return { component: "ncr", defaultValue: ncr };

  const banner = getBannerTypeForSlug(slug);
  if (banner) return { component: "banners", defaultValue: banner };

  const sign = getSignTypeForSlug(slug);
  if (sign) return { component: "signs", defaultValue: sign };

  const vehicle = getVehicleTypeForSlug(slug);
  if (vehicle) return { component: "vehicle", defaultValue: vehicle };

  const surface = getSurfaceTypeForSlug(slug);
  if (surface) return { component: "surfaces", defaultValue: surface };

  return null;
}
