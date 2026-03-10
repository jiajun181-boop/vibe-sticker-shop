/**
 * Format cents (integer) as a Canadian dollar string.
 * e.g. 1500 → "$15.00"
 */
export function formatCad(cents) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(cents / 100);
}
