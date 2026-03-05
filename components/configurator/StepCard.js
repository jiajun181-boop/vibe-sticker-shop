"use client";

import { useState, useRef, useId } from "react";

/**
 * Collapsible step card — wraps each configurator step.
 * Supports both controlled (open + onToggle) and uncontrolled (defaultOpen) modes.
 * CSS max-height transition for performance (no JS animation libs).
 */
export default function StepCard({
  stepNumber,
  title,
  hint,
  summaryText,
  optional = false,
  visible = true,
  defaultOpen = false,
  open,
  onToggle,
  stepId,
  children,
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const contentId = useId();
  const contentRef = useRef(null);

  if (!visible) return null;

  // Controlled mode: parent passes open + onToggle
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  function handleToggle() {
    if (isControlled) {
      onToggle?.();
    } else {
      setInternalOpen((v) => !v);
    }
  }

  return (
    <div id={stepId} className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header — toggle button */}
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleToggle();
          }
        }}
        className="flex w-full items-center gap-3 p-5 text-left focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 rounded-xl"
      >
        {/* Step number circle */}
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          isOpen ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"
        }`}>
          {stepNumber}
        </span>

        {/* Title + summary */}
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-900">{title}</span>
            {optional && (
              <span className="text-[10px] font-medium text-gray-400">(Optional)</span>
            )}
          </span>
          {!isOpen && summaryText && (
            <span className="mt-0.5 block truncate text-xs text-teal-600">{summaryText}</span>
          )}
          {isOpen && hint && (
            <span className="mt-0.5 block text-xs text-gray-400">{hint}</span>
          )}
        </span>

        {/* Chevron */}
        <svg
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Collapsible body */}
      <div
        id={contentId}
        role="region"
        ref={contentRef}
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-5 pb-5">
          {children}
        </div>
      </div>
    </div>
  );
}
