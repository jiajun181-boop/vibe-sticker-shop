"use client";

/**
 * ElevatedCard: Orchestrated Micro-interaction Card
 * Call and Response pattern:
 * - Hover: Lift up + Shadow intensification
 * - Focus within: Ring highlight
 */
import React from "react";

export default function ElevatedCard({
  children,
  clickable = false,
  onClick,
  className = "",
  ...props
}) {
  return (
    <div
      className={`
        relative rounded-3xl border border-[var(--color-gray-200)] bg-white p-8
        transition-all duration-300 ease-out-cubic
        ${clickable ? "cursor-pointer" : ""}
        hover:shadow-elevated hover:translate-y-[-4px]
        focus-within:ring-2 focus-within:ring-[var(--color-ink-black)]
        focus-within:ring-offset-2
        group
        ${className}
      `}
      onClick={onClick}
      {...props}
    >
      {/* Decorative circular echo element (from logo rings) */}
      <div className="absolute top-0 right-0 -mr-12 -mt-12 w-24 h-24 border-2 border-[var(--color-ink-black)] rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
      
      {children}
    </div>
  );
}

/* Add shadow class to Tailwind */
export const tailwindConfig = {
  extend: {
    boxShadow: {
      elevated: "0 8px 24px rgba(26, 26, 26, 0.12)",
    },
  },
};
