// lib/pricing/ledger-builder.js
// ═══════════════════════════════════════════════════════════════════
// Quote Ledger Builder — records every pricing step as a line item
// with code, label, human-readable formula, amount, and source.
//
// Usage:
//   const ledger = createLedgerBuilder(inputs);
//   ledger.setDerived("areaSqFt", 12.5);
//   ledger.addBase("MATERIAL", "材料费", "12.5 sqft x $2.10/sqft", 2625, "materials");
//   ledger.addMultiplier("RUSH_MULT", "加急费", 1.5, "settings");
//   ledger.applyMinimum(2500, "templates");
//   const result = ledger.build(100);
// ═══════════════════════════════════════════════════════════════════

const ENGINE_VERSION = "2026-03-05";

/**
 * Creates a ledger accumulator that tracks every pricing step.
 * @param {object} inputs — snapshot of calculation inputs
 * @returns {LedgerBuilder}
 */
export function createLedgerBuilder(inputs) {
  const lines = [];
  const derived = {};
  let runningCents = 0;

  return {
    /**
     * Record a derived calculation value (area, perimeter, sheets, etc.)
     */
    setDerived(key, value) {
      derived[key] = value;
    },

    /**
     * Add a base cost line (material, ink, cutting, labor, etc.)
     * @param {string} code    — machine code (e.g. "MATERIAL", "INK", "CUTTING")
     * @param {string} label   — human label (e.g. "材料费")
     * @param {string} formula — human-readable formula
     * @param {number} amountCents — cents this line adds
     * @param {string} source  — where this comes from
     */
    addBase(code, label, formula, amountCents, source) {
      const cents = Math.round(amountCents);
      lines.push({ code, label, formula, amountCents: cents, source });
      runningCents += cents;
    },

    /**
     * Add a multiplier line — records the DELTA (not the absolute).
     * e.g. multiplier 1.5 on running 1000c → delta = 500c
     * @param {string} code
     * @param {string} label
     * @param {number} factor — e.g. 1.15 means +15%
     * @param {string} source
     */
    addMultiplier(code, label, factor, source) {
      if (factor === 1.0 || !factor) return; // no-op
      const before = runningCents;
      runningCents = Math.round(runningCents * factor);
      const delta = runningCents - before;
      const pct = ((factor - 1) * 100).toFixed(0);
      lines.push({
        code,
        label,
        formula: `x${factor.toFixed(2)} (${pct >= 0 ? "+" : ""}${pct}%)`,
        amountCents: delta,
        source,
      });
    },

    /**
     * Add a flat or per-unit surcharge line.
     * @param {string} code
     * @param {string} label
     * @param {string} formula
     * @param {number} amountCents
     * @param {string} source
     */
    addSurcharge(code, label, formula, amountCents, source) {
      const cents = Math.round(amountCents);
      lines.push({ code, label, formula, amountCents: cents, source });
      runningCents += cents;
    },

    /**
     * Apply minimum price floor — adds a MIN_CHARGE line if needed.
     * @param {number} minCents — floor in cents
     * @param {string} source
     */
    applyMinimum(minCents, source) {
      if (runningCents >= minCents) return;
      const delta = minCents - runningCents;
      lines.push({
        code: "MIN_CHARGE",
        label: "最低收费",
        formula: `最低 $${(minCents / 100).toFixed(2)}`,
        amountCents: delta,
        source,
      });
      runningCents = minCents;
    },

    /**
     * Apply roundUp99 — records rounding as a ROUND line.
     * e.g. $12.34 → $12.99 (delta = +65c)
     * @param {string} source
     */
    applyRound99(source) {
      const dollars = runningCents / 100;
      if (dollars < 1) {
        const target = 99;
        if (runningCents !== target) {
          const delta = target - runningCents;
          lines.push({
            code: "ROUND",
            label: "取整",
            formula: `$${dollars.toFixed(2)} → $0.99`,
            amountCents: delta,
            source,
          });
          runningCents = target;
        }
        return;
      }
      const rounded = Math.floor(dollars) + 0.99;
      const roundedCents = Math.round(rounded * 100);
      if (roundedCents !== runningCents) {
        const delta = roundedCents - runningCents;
        lines.push({
          code: "ROUND",
          label: "取整",
          formula: `$${dollars.toFixed(2)} → $${rounded.toFixed(2)}`,
          amountCents: delta,
          source,
        });
        runningCents = roundedCents;
      }
    },

    /**
     * Override the running total to match an external final price.
     * Records a RECONCILE line for the delta if any.
     * This ensures the ledger always sums correctly.
     * @param {number} finalCents — the authoritative final price in cents
     * @param {string} source
     */
    reconcile(finalCents, source) {
      const delta = finalCents - runningCents;
      if (Math.abs(delta) > 0) {
        lines.push({
          code: "RECONCILE",
          label: "调整差异",
          formula: `${delta > 0 ? "+" : ""}$${(delta / 100).toFixed(2)}`,
          amountCents: delta,
          source,
        });
        runningCents = finalCents;
      }
    },

    /** Get the current running total in cents. */
    getRunningCents() {
      return runningCents;
    },

    /**
     * Build the final QuoteLedger object.
     * @param {number} quantity
     * @returns {QuoteLedger}
     */
    build(quantity) {
      return {
        engineVersion: ENGINE_VERSION,
        inputs,
        derived,
        lines,
        subtotalCents: runningCents,
        totalCents: runningCents,
        unitCents: quantity > 0 ? Math.round(runningCents / quantity) : 0,
        currency: "CAD",
      };
    },
  };
}
