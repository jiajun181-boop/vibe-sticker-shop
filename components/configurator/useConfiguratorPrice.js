"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DEBOUNCE_MS = 300;
const HST_RATE = 0.13;

/**
 * Hook that fetches prices from /api/pricing/calculate (Phase 3 engine).
 *
 * @param {object} params
 * @param {string} params.slug           — product slug
 * @param {number} params.quantity        — order quantity
 * @param {number} [params.widthIn]       — width in inches
 * @param {number} [params.heightIn]      — height in inches
 * @param {string} [params.material]      — material alias (e.g. "white_vinyl")
 * @param {object} [params.options]       — template options (cutType, isSticker, lamination, etc.)
 * @param {Array}  [params.accessories]   — accessories [{id, quantity}]
 * @param {string} [params.sizeLabel]     — size label for fixed-size products
 * @param {boolean} [params.enabled=true] — set false to skip fetching
 *
 * @returns {{ quoteData, quoteLoading, quoteError, unitCents, subtotalCents, taxCents, totalCents, addSurcharge }}
 */
export default function useConfiguratorPrice({
  slug,
  quantity,
  widthIn,
  heightIn,
  material,
  options = {},
  accessories,
  sizeLabel,
  enabled = true,
}) {
  const [quoteData, setQuoteData] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(null);
  const [surcharges, setSurcharges] = useState(0);

  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  const fetchPrice = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    if (!enabled || !slug || quantity <= 0) {
      setQuoteData(null);
      return;
    }
    const ac = new AbortController();
    abortRef.current = ac;
    setQuoteLoading(true);
    setQuoteError(null);

    const body = { slug, quantity };
    if (widthIn > 0) body.widthIn = widthIn;
    if (heightIn > 0) body.heightIn = heightIn;
    if (material) body.material = material;
    if (options && Object.keys(options).length > 0) body.options = options;
    if (accessories && accessories.length > 0) body.accessories = accessories;
    if (sizeLabel) body.sizeLabel = sizeLabel;

    fetch("/api/pricing/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ac.signal,
    })
      .then((r) => r.json().then((d) => ({ ok: r.ok, data: d })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.error || "Price calculation failed");
        setQuoteData(data);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setQuoteError(err.message);
      })
      .finally(() => setQuoteLoading(false));
  }, [slug, quantity, widthIn, heightIn, material, enabled, JSON.stringify(options), JSON.stringify(accessories), sizeLabel]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchPrice, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [fetchPrice]);

  // Derived pricing
  const rawUnitCents = quoteData?.unitCents ?? 0;
  const rawSubtotalCents = quoteData?.totalCents ?? 0;
  const adjustedSubtotal = rawSubtotalCents + surcharges;
  const taxCents = Math.round(adjustedSubtotal * HST_RATE);
  const totalCents = adjustedSubtotal + taxCents;

  const addSurcharge = useCallback((cents) => {
    setSurcharges(cents);
  }, []);

  return {
    quoteData,
    quoteLoading,
    quoteError,
    unitCents: rawUnitCents,
    subtotalCents: adjustedSubtotal,
    rawSubtotalCents,
    taxCents,
    totalCents,
    addSurcharge,
  };
}
