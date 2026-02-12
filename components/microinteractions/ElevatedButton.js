"use client";

/**
 * ElevatedButton: Orchestrated Micro-interaction Button
 * Implementation of "Call and Response" pattern
 * - Hover: Scale + Shadow elevation
 * - Active: Press down feedback
 * - Focus: Ring expansion
 */
import React from "react";

export default function ElevatedButton({
  children,
  variant = "primary",
  size = "md",
  onClick,
  disabled = false,
  className = "",
  ...props
}) {
  const baseClasses = `
    relative inline-flex items-center justify-center
    font-semibold uppercase tracking-wide
    transition-all duration-200 ease-out-cubic
    hover:shadow-lg hover:scale-105
    active:scale-95 active:shadow-sm
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    overflow-hidden group
  `;

  const variants = {
    primary: "bg-[var(--color-ink-black)] text-[var(--color-paper-white)] focus:ring-[var(--color-ink-black)]",
    secondary: "border-2 border-[var(--color-ink-black)] text-[var(--color-ink-black)] focus:ring-[var(--color-ink-black)] hover:bg-[var(--color-gray-50)]",
    ghost: "text-[var(--color-ink-black)] hover:bg-[var(--color-gray-100)]",
  };

  const sizes = {
    sm: "px-4 py-2 text-xs rounded-lg",
    md: "px-6 py-3 text-sm rounded-xl",
    lg: "px-8 py-4 text-base rounded-2xl",
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {/* Ripple effect container */}
      <span className="relative z-10 flex items-center gap-2">{children}</span>

      {/* Hovering gradient background */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-5 bg-white transition-opacity duration-300" />
    </button>
  );
}
