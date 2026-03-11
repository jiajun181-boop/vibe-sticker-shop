"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RUSH_MULTIPLIER, DESIGN_HELP_CENTS } from "@/lib/order-config";

/**
 * Shared hook for PricingSidebar + MobileBottomBar.
 * Encapsulates rush toggle, artwork gating, design help fee,
 * and the Add-to-Cart animation state machine.
 *
 * Single source of truth — no logic should be duplicated
 * between the two components for these concerns.
 */
export default function useConfiguratorActions({
  canAddToCart,
  artworkMode,
  hasArtwork,
  artworkIntent,
  unitCents = 0,
  subtotalCents = 0,
  totalCents = 0,
  onAddToCart,
  onBuyNow,
}) {
  // ─── Rush Production ───
  const [rushProduction, setRushProduction] = useState(false);
  const rushMultiplier = rushProduction ? RUSH_MULTIPLIER : 1;

  // ─── Artwork Intake Gating ───
  const needsArtworkDecision =
    (artworkMode === "upload-required" || artworkMode === "upload-optional") && !hasArtwork;

  const effectiveCanAddToCart =
    canAddToCart &&
    (!needsArtworkDecision ||
      (artworkMode === "upload-optional" && !!artworkIntent));

  // ─── Design Help Fee ───
  const designHelpCents =
    needsArtworkDecision && artworkIntent === "design-help"
      ? DESIGN_HELP_CENTS
      : 0;

  // ─── Rush-adjusted display prices ───
  const displayUnit = Math.round(unitCents * rushMultiplier);
  const displaySubtotal = Math.round(subtotalCents * rushMultiplier);
  const displayTotal = Math.round(totalCents * rushMultiplier);
  const displaySubtotalWithFees = displaySubtotal + designHelpCents;
  const displayTotalWithFees = displayTotal + designHelpCents;
  const rushSurcharge = rushProduction
    ? Math.round(subtotalCents * (RUSH_MULTIPLIER - 1))
    : 0;

  // ─── Payload builder ───
  function buildPayload() {
    const payload = { rushProduction };
    if (artworkMode) {
      payload.intakeMode = artworkMode;
      if (!hasArtwork && artworkIntent) payload.artworkIntent = artworkIntent;
    }
    return payload;
  }

  // ─── Add to Cart Animation ───
  const [atcState, setAtcState] = useState("idle"); // "idle" | "adding" | "added"
  const atcTimerRef = useRef(null);

  useEffect(() => {
    return () => clearTimeout(atcTimerRef.current);
  }, []);

  const handleAtcClick = useCallback(() => {
    if (atcState !== "idle") return;
    setAtcState("adding");
    onAddToCart?.(buildPayload());
    atcTimerRef.current = setTimeout(() => {
      setAtcState("added");
      atcTimerRef.current = setTimeout(() => {
        setAtcState("idle");
      }, 2000);
    }, 1000);
  }, [atcState, onAddToCart, rushProduction, artworkMode, hasArtwork, artworkIntent]);

  const handleBuyNowClick = useCallback(() => {
    onBuyNow?.(buildPayload());
  }, [onBuyNow, rushProduction, artworkMode, hasArtwork, artworkIntent]);

  return {
    // Rush
    rushProduction,
    setRushProduction,
    rushMultiplier,
    rushSurcharge,
    // Artwork gating
    needsArtworkDecision,
    effectiveCanAddToCart,
    // Design help
    designHelpCents,
    // Display prices
    displayUnit,
    displaySubtotal,
    displayTotal,
    displaySubtotalWithFees,
    displayTotalWithFees,
    // ATC animation
    atcState,
    handleAtcClick,
    handleBuyNowClick,
  };
}
