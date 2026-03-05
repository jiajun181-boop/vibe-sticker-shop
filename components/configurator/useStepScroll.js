"use client";

import { useCallback } from "react";

/**
 * Auto-scroll to next step after selecting an option.
 * @param {string[]} stepIds — ordered list of visible step DOM ids
 * @returns {(currentStepId: string) => void} — call with current step id to scroll to next
 */
export default function useStepScroll(stepIds) {
  return useCallback(
    (currentStepId) => {
      const idx = stepIds.indexOf(currentStepId);
      if (idx < 0 || idx >= stepIds.length - 1) return;
      const nextId = stepIds[idx + 1];
      setTimeout(() => {
        document.getElementById(nextId)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 150);
    },
    [stepIds]
  );
}
