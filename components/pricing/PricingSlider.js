"use client";

import React, { useState, useEffect } from "react";

/**
 * Interactive Pricing Widget
 * "Call and Response" pattern with slider interaction
 * - Drag slider: Price updates smoothly in real-time
 * - Scroll numbers: Animated counter effect
 */
export default function PricingSlider({
  label = "Select Quantity",
  min = 1,
  max = 1000,
  step = 1,
  basePrice = 100,
  onPriceChange,
  currency = "CAD",
  showTax = true,
  taxRate = 0.13,
}) {
  const [quantity, setQuantity] = useState(min);
  const [isDragging, setIsDragging] = useState(false);

  const subtotal = quantity * basePrice;
  const tax = showTax ? Math.round(subtotal * taxRate * 100) / 100 : 0;
  const total = Math.round((subtotal + tax) * 100) / 100;

  useEffect(() => {
    if (onPriceChange) {
      onPriceChange({ quantity, subtotal, tax, total });
    }
  }, [quantity, subtotal, tax, total, onPriceChange]);

  const handleSliderChange = (e) => {
    setQuantity(parseInt(e.target.value, 10));
  };

  const percentage = ((quantity - min) / (max - min)) * 100;

  return (
    <div className="w-full space-y-6 rounded-3xl border border-gray-200 bg-white p-8">
      {/* Header */}
      <div>
        <label className="block text-sm font-semibold uppercase tracking-wide text-gray-700">
          {label}
        </label>
        <p className="mt-1 text-xs text-gray-500">Drag to adjust • Price updates in real-time</p>
      </div>

      {/* Price Display with Counter Animation */}
      <div className="flex items-center justify-between gap-4 py-6">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wide text-gray-500">Quantity</p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-5xl font-bold text-[var(--color-ink-black)] tabular-nums">
              {quantity.toLocaleString()}
            </span>
            <span className="text-lg text-gray-400">units</span>
          </div>
        </div>

        {/* Price Box */}
        <div className="flex flex-col items-end space-y-1 rounded-2xl border-2 border-[var(--color-ink-black)] bg-[var(--color-paper-white)] px-6 py-4">
          <p className="text-xs uppercase tracking-wide text-gray-600">Total Price</p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-[var(--color-ink-black)] tabular-nums">
              ${(total / 100).toFixed(2)}
            </span>
            <span className="text-xs text-gray-500">{currency}</span>
          </div>
          {showTax && (
            <p className="text-xs text-gray-500">
              Incl. {Math.round(taxRate * 100)}% tax (${(tax / 100).toFixed(2)})
            </p>
          )}
        </div>
      </div>

      {/* Slider */}
      <div className="space-y-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={quantity}
          onChange={handleSliderChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          className="w-full h-2 bg-gradient-to-r from-[var(--color-gray-200)] to-[var(--color-gray-300)] rounded-full appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, var(--color-ink-black) 0%, var(--color-ink-black) ${percentage}%, var(--color-gray-200) ${percentage}%, var(--color-gray-200) 100%)`,
          }}
        />

        {/* Min/Max Labels */}
        <div className="flex justify-between text-xs text-gray-500 uppercase tracking-wide">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>

      {/* Quick Select Buttons */}
      <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
        {[10, 50, 100, 500].map((value) => (
          <button
            key={value}
            onClick={() => setQuantity(Math.min(value, max))}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wide rounded-lg transition-all duration-200
              ${
                quantity === value
                  ? "bg-[var(--color-ink-black)] text-white"
                  : "border border-gray-300 text-gray-700 hover:border-[var(--color-ink-black)] hover:text-[var(--color-ink-black)]"
              }
            `}
          >
            {value}x
          </button>
        ))}
      </div>

      {/* Breakdown */}
      <div className="space-y-2 border-t border-gray-200 pt-4 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal:</span>
          <span className="font-semibold">${(subtotal / 100).toFixed(2)}</span>
        </div>
        {showTax && (
          <div className="flex justify-between">
            <span className="text-gray-600">Tax ({Math.round(taxRate * 100)}%):</span>
            <span className="font-semibold">${(tax / 100).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold">
          <span>Total:</span>
          <span>${(total / 100).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

// CSS for slider styling (add to globals.css)
export const sliderStyles = `
  input[type="range"].slider {
    -webkit-appearance: none;
    appearance: none;
  }
  
  input[type="range"].slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--color-ink-black);
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(26, 26, 26, 0.2);
    transition: all 200ms ease-out-cubic;
  }
  
  input[type="range"].slider::-webkit-slider-thumb:hover {
    width: 28px;
    height: 28px;
    box-shadow: 0 4px 12px rgba(26, 26, 26, 0.3);
  }
  
  input[type="range"].slider::-moz-range-thumb {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--color-ink-black);
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 6px rgba(26, 26, 26, 0.2);
    transition: all 200ms ease-out-cubic;
  }
  
  input[type="range"].slider::-moz-range-thumb:hover {
    width: 28px;
    height: 28px;
    box-shadow: 0 4px 12px rgba(26, 26, 26, 0.3);
  }
`;
