"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * Persist configurator selections to localStorage so users don't lose
 * progress if they close the tab or navigate away.
 *
 * Auto-saves whenever `config` changes (debounced 600ms).
 * Auto-restores on mount by calling matching setters.
 * Saved data expires after 7 days.
 *
 * @param {string} productSlug — unique product identifier (e.g. "die-cut-stickers")
 * @param {Record<string, any>} config — current configurator state object
 *   e.g. { material: "white-vinyl", size: 2, quantity: 100, finishing: "matte" }
 * @param {Record<string, (value: any) => void>} setters — matching setter functions
 *   e.g. { material: setMaterial, size: setSize, quantity: setQuantity, finishing: setFinishing }
 *   Keys must match the keys in `config`. Only keys present in both objects are saved/restored.
 * @returns {{ clear: () => void }} — call clear() after add-to-cart to wipe saved config
 *
 * Usage:
 *   const { clear } = useConfiguratorSave("die-cut-stickers", {
 *     material, size, quantity, finishing, rushProduction,
 *   }, {
 *     material: setMaterial,
 *     size: setSize,
 *     quantity: setQuantity,
 *     finishing: setFinishing,
 *     rushProduction: setRushProduction,
 *   });
 *
 *   // After successful add-to-cart:
 *   clear();
 */

const STORAGE_PREFIX = "configurator:";
const EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStorageKey(slug) {
  return STORAGE_PREFIX + slug;
}

/** Safely read and parse a saved config from localStorage. */
function readSaved(key) {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const { data, savedAt } = JSON.parse(raw);
    if (!data || !savedAt) return null;

    // Expired — clean up and return nothing
    if (Date.now() - savedAt > EXPIRY_MS) {
      localStorage.removeItem(key);
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

/** Safely write config to localStorage. */
function writeSaved(key, data) {
  try {
    if (typeof window === "undefined") return;
    const payload = { data, savedAt: Date.now() };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

/** Safely remove a key from localStorage. */
function removeSaved(key) {
  try {
    if (typeof window === "undefined") return;
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export default function useConfiguratorSave(productSlug, config, setters) {
  const key = getStorageKey(productSlug);
  const timerRef = useRef(null);
  const restoredRef = useRef(false);

  // ---- Auto-restore on mount ------------------------------------------------
  // Runs once. Reads localStorage and calls each setter whose key exists in
  // the saved data AND in the setters map.
  useEffect(() => {
    if (restoredRef.current) return;
    if (!productSlug || !setters) return;

    restoredRef.current = true;

    const saved = readSaved(key);
    if (!saved || typeof saved !== "object") return;

    for (const [field, setter] of Object.entries(setters)) {
      if (typeof setter !== "function") continue;
      if (!(field in saved)) continue;
      // Only restore if the value differs from undefined — we don't want to
      // overwrite defaults with undefined.
      if (saved[field] !== undefined) {
        setter(saved[field]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Intentionally empty deps — mount-only restore.

  // ---- Auto-save on change --------------------------------------------------
  // Debounced: waits 600ms after the last change before writing.
  // Skips the very first render (before restore completes) by checking
  // restoredRef so we don't immediately overwrite with defaults.
  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    if (!productSlug || !config) return;
    // Don't save until restore has run
    if (!restoredRef.current) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      // Only persist the keys that have a matching setter (those are the ones
      // the consuming configurator actually manages).
      const toSave = {};
      if (setters && typeof setters === "object") {
        for (const field of Object.keys(setters)) {
          if (field in configRef.current) {
            toSave[field] = configRef.current[field];
          }
        }
      } else {
        // Fallback: save the entire config object
        Object.assign(toSave, configRef.current);
      }

      writeSaved(key, toSave);
    }, 600);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // We serialise config to detect changes. JSON.stringify is safe here
    // because configurator state is always a flat object of primitives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, productSlug, JSON.stringify(config)]);

  // ---- clear() --------------------------------------------------------------
  // Call after a successful add-to-cart to remove the saved config.
  const clear = useCallback(() => {
    removeSaved(key);
  }, [key]);

  return { clear };
}
