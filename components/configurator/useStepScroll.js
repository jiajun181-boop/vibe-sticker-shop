"use client";

import { useCallback } from "react";

/**
 * Accordion step advancement: collapse current, open next, scroll.
 * @param {string[]} stepIds — ordered list of visible step DOM ids
 * @param {(stepId: string|null) => void} setActiveStep — state setter for active step
 * @returns {(currentStepId: string) => void} — call after option selection
 */
export default function useStepScroll(stepIds, setActiveStep) {
  return useCallback(
    (currentStepId) => {
      const idx = stepIds.indexOf(currentStepId);
      if (idx < 0) return;

      const nextId = idx < stepIds.length - 1 ? stepIds[idx + 1] : null;
      // Advance accordion: collapse current, open next
      setActiveStep(nextId);

      // Scroll to next step after transition starts
      if (nextId) {
        setTimeout(() => {
          document.getElementById(nextId)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 80);
      }
    },
    [stepIds, setActiveStep]
  );
}
