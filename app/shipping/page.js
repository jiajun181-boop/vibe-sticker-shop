export const metadata = {
  title: "Shipping Policy",
  description: "Shipping areas, estimated delivery times, costs, and tracking for Lunar Print orders.",
};

export default function ShippingPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold text-[var(--color-gray-900)]">Shipping Policy</h1>
      <p className="mt-2 text-sm text-[var(--color-gray-500)]">Last updated: February 2026</p>

      <div className="mt-10 space-y-8 text-[var(--color-gray-700)] leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-[var(--color-gray-900)]">1. Delivery Areas</h2>
          <p className="mt-2">
            We ship across <strong>Canada</strong> and to the <strong>continental United States</strong>.
            Most orders are shipped from the Greater Toronto Area (GTA), Ontario.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[var(--color-gray-900)]">2. Estimated Delivery Times</h2>
          <p className="mt-2">Delivery times are estimated from the date of production completion:</p>
          <div className="mt-4 overflow-hidden rounded-lg border border-[var(--color-gray-200)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-gray-50)]">
                <tr>
                  <th className="px-4 py-2.5 text-left font-semibold text-[var(--color-gray-900)]">Region</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-[var(--color-gray-900)]">Standard</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-[var(--color-gray-900)]">Express</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-gray-100)]">
                <tr><td className="px-4 py-2">GTA / Southern Ontario</td><td className="px-4 py-2">2–4 business days</td><td className="px-4 py-2">1–2 business days</td></tr>
                <tr><td className="px-4 py-2">Rest of Ontario &amp; Quebec</td><td className="px-4 py-2">3–5 business days</td><td className="px-4 py-2">2–3 business days</td></tr>
                <tr><td className="px-4 py-2">Western Canada (AB, BC, SK, MB)</td><td className="px-4 py-2">5–7 business days</td><td className="px-4 py-2">3–4 business days</td></tr>
                <tr><td className="px-4 py-2">Atlantic Canada &amp; Territories</td><td className="px-4 py-2">5–8 business days</td><td className="px-4 py-2">3–5 business days</td></tr>
                <tr><td className="px-4 py-2">United States (continental)</td><td className="px-4 py-2">5–10 business days</td><td className="px-4 py-2">3–5 business days</td></tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-[var(--color-gray-500)]">
            Delivery times are estimates and not guaranteed. Delays may occur due to weather, carrier issues, or customs.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[var(--color-gray-900)]">3. Shipping Costs</h2>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li><strong>Free standard shipping</strong> on orders over $99 CAD (within Canada)</li>
            <li>Orders under $99 CAD: flat rate shipping calculated at checkout</li>
            <li>Express and priority shipping available at additional cost</li>
            <li>US orders: shipping rates calculated based on weight and destination</li>
            <li>Oversized items (banners, signs, large-format) may incur additional shipping fees</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[var(--color-gray-900)]">4. Order Tracking</h2>
          <p className="mt-2">
            Once your order ships, you will receive a tracking number via email. You can also track your order
            by logging into your account on our website.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[var(--color-gray-900)]">5. Local Pickup</h2>
          <p className="mt-2">
            Free local pickup is available from our GTA location. Select &ldquo;Local Pickup&rdquo; at checkout.
            We will notify you when your order is ready for collection.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[var(--color-gray-900)]">6. Lost or Damaged Shipments</h2>
          <p className="mt-2">
            If your package arrives damaged, please contact us within 48 hours with photos.
            If your package is lost in transit, we will work with the carrier to locate it or arrange a replacement at no charge.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[var(--color-gray-900)]">7. Contact</h2>
          <p className="mt-2">
            Shipping questions? Email{" "}
            <a href="mailto:info@lunarprint.ca" className="text-[var(--color-brand)] underline">info@lunarprint.ca</a>{" "}
            or call <a href="tel:+16477834728" className="text-[var(--color-brand)] underline">(647) 783-4728</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
