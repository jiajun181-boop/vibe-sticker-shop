"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Click-triggered info popover — replaces hover title tooltips.
 * Mobile-friendly: click to open, click outside / ESC to close.
 */
export default function InfoPopover({ text, className = "" }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const popoverId = useRef(`info-pop-${Math.random().toString(36).slice(2, 8)}`).current;

  const close = useCallback(() => setOpen(false), []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (
        triggerRef.current?.contains(e.target) ||
        popoverRef.current?.contains(e.target)
      ) return;
      close();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, close]);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    function handleKey(e) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, close]);

  return (
    <span className={`relative inline-flex ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="More info"
        aria-expanded={open}
        aria-describedby={open ? popoverId : undefined}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-[11px] font-bold text-gray-400 transition-colors hover:border-gray-400 hover:text-gray-600 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
      >
        i
      </button>
      {open && (
        <div
          ref={popoverRef}
          id={popoverId}
          role="tooltip"
          className="absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded-lg border border-gray-200 bg-white p-3 text-xs leading-relaxed text-gray-600 shadow-lg"
        >
          {text}
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-white drop-shadow-sm" />
        </div>
      )}
    </span>
  );
}
