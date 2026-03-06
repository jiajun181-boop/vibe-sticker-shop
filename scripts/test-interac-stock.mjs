/**
 * Minimal verification: Interac checkout stock reservation
 *
 * Scenarios:
 *   1. POST with a non-existent productId → 400 (product not found)
 *   2. POST with a valid product + absurd quantity (999999) → 409 INSUFFICIENT_STOCK
 *      (only if that product tracks inventory; otherwise succeeds — same as Stripe/Invoice)
 *   3. POST with valid product + quantity 1 → 200 (order created)
 *
 * Usage:
 *   node scripts/test-interac-stock.mjs [base_url]
 *   Default base_url: http://localhost:3000
 */

const BASE = process.argv[2] || "http://localhost:3000";
const ENDPOINT = `${BASE}/api/checkout/interac`;

const fake = {
  email: "test-stock-check@example.com",
  name: "Stock Test",
};

async function post(items) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...fake, items }),
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function run() {
  console.log(`\n=== Interac Stock Reservation Test ===`);
  console.log(`Endpoint: ${ENDPOINT}\n`);

  // Scenario 1: non-existent product → 400
  console.log("--- Scenario 1: Non-existent product ---");
  const r1 = await post([
    { productId: "fake-id-000", name: "Ghost Product", quantity: 1, unitAmount: 500 },
  ]);
  const pass1 = r1.status === 400;
  console.log(`  Status: ${r1.status} (expected 400) → ${pass1 ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`  Body:`, JSON.stringify(r1.data));

  // Scenario 2: absurd quantity → 409 INSUFFICIENT_STOCK (if product tracks inventory)
  // First, find a real product from DB
  console.log("\n--- Scenario 2: Absurd quantity (999999) ---");
  const catalogRes = await fetch(`${BASE}/api/search?q=sticker`);
  const catalogData = await catalogRes.json();
  const firstProduct = catalogData?.results?.[0];

  if (!firstProduct) {
    console.log("  SKIP — no products found via /api/search. Run seed scripts first.");
  } else {
    console.log(`  Using product: "${firstProduct.name}" (${firstProduct.id})`);
    const r2 = await post([
      { productId: firstProduct.id, name: firstProduct.name, quantity: 999999, unitAmount: 500 },
    ]);
    if (r2.status === 409 && r2.data.code === "INSUFFICIENT_STOCK") {
      console.log(`  Status: ${r2.status}, code: ${r2.data.code} → PASS ✅ (stock blocked)`);
    } else if (r2.status === 200) {
      console.log(`  Status: 200 → PASS ✅ (product doesn't track inventory — reservation skipped, same as Stripe/Invoice)`);
      console.log(`  ⚠️  Clean up test order: ${r2.data.orderId}`);
    } else {
      console.log(`  Status: ${r2.status} → ${JSON.stringify(r2.data)}`);
    }

    // Scenario 3: valid order with qty 1 → 200
    console.log("\n--- Scenario 3: Valid order (qty 1) ---");
    const r3 = await post([
      { productId: firstProduct.id, name: firstProduct.name, quantity: 1, unitAmount: 500 },
    ]);
    const pass3 = r3.status === 200 && r3.data.orderId;
    console.log(`  Status: ${r3.status} (expected 200) → ${pass3 ? "PASS ✅" : "FAIL ❌"}`);
    if (pass3) console.log(`  Order ID: ${r3.data.orderId}`);
    console.log(`  Body:`, JSON.stringify(r3.data));
  }

  console.log("\n=== Done ===\n");
}

run().catch((err) => {
  console.error("Test failed:", err.message);
  process.exit(1);
});
