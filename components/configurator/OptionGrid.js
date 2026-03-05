"use client";

import { useCallback, useRef } from "react";

/**
 * Responsive grid container for OptionCard items.
 * Implements ARIA radiogroup Arrow key navigation (roving tabindex).
 * Static class map prevents Tailwind purge issues.
 */
const COLS = {
  2: "grid grid-cols-2 gap-2.5",
  3: "grid grid-cols-2 gap-2.5 md:grid-cols-3",
  4: "grid grid-cols-2 gap-2.5 md:grid-cols-4",
};

export default function OptionGrid({ columns = 3, label, children }) {
  const ref = useRef(null);

  const handleKeyDown = useCallback((e) => {
    const { key } = e;
    if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key)) return;

    const container = ref.current;
    if (!container) return;

    // Collect all focusable radio buttons inside this grid
    const radios = Array.from(container.querySelectorAll('[role="radio"]'));
    if (radios.length === 0) return;

    const currentIdx = radios.indexOf(document.activeElement);
    if (currentIdx < 0) return;

    e.preventDefault();

    let nextIdx;
    if (key === "ArrowRight" || key === "ArrowDown") {
      nextIdx = (currentIdx + 1) % radios.length;
    } else {
      nextIdx = (currentIdx - 1 + radios.length) % radios.length;
    }

    // Move focus and trigger click (select)
    radios[nextIdx].focus();
    radios[nextIdx].click();
  }, []);

  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-label={label}
      className={COLS[columns] || COLS[3]}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  );
}
