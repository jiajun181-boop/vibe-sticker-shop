export const metadata = {
  title: "Refund & Return Policy",
  description: "Refund and return policy for Lunar Print orders, including reprint guarantees and claim procedures.",
};

export default function RefundPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold text-[var(--color-gray-900)]">Refund &amp; Return Policy</h1>
      <p className="mt-2 text-sm text-[var(--color-gray-500)]">Last updated: February 2026</p>

      <div className="mt-10 space-y-8 text-[var(--color-gray-700)] leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-[var(--color-gray-900)]">1. Our Guarantee</h2>
          <p className="mt-2">
            We stand behind the quality of our work. If your order has a production defect (colour issues, misalignment,
            wrong material, damage during production), we will <strong>reprint the order at no charge</strong> or issue
            a <strong>full refund</strong>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[var(--color-gray-900)]">2. How to File a Claim</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-6">
            <li>Contact us within <strong>7 days</strong> of receiving your order.</li>
            <li>Email <a href="mailto:info@lunarprint.ca" className="text-[var(--color-brand)] underline">info@lunarprint.ca</a> with your order number and photos showing the issue.</li>
            <li>Our team will review the claim within 1–2 business days.</li>
            <li>If approved, you choose: free reprint or refund to original payment method.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[var(--color-gray-900)]">3. What Qualifies for a Refund</h2>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>Significant colour difference from the approved proof (beyond normal CMYK variance)</li>
            <li>Wrong size, material, or finishing applied</li>
            <li>Physical defects: smudges, scratches, miscuts, peeling lamination</li>
            <li>Missing items from your order</li>
            <li>Damage caused during shipping</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[var(--color-gray-900)]">4. What Does Not Qualify</h2>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>Errors in your submitted artwork that were present in the approved proof</li>
            <li>Minor colour variations inherent to CMYK printing (screens display RGB, not CMYK)</li>
            <li>Change of mind after production has started</li>
            <li>Damage caused by improper handling or installation after delivery</li>
            <li>Orders placed with incorrect specifications (size, quantity, etc.)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[var(--color-gray-900)]">5. Cancellations</h2>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li><strong>Before production:</strong> Full refund available. Contact us as soon as possible.</li>
            <li><strong>During production:</strong> Orders in production cannot be cancelled because materials have been cut and printed.</li>
            <li><strong>After shipping:</strong> No cancellation possible. See refund conditions above.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[var(--color-gray-900)]">6. Refund Timeline</h2>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>Approved refunds are processed within 3–5 business days.</li>
            <li>Refunds are returned to the original payment method (credit card via Stripe).</li>
            <li>It may take an additional 5–10 business days for the refund to appear on your statement.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[var(--color-gray-900)]">7. Reprints</h2>
          <p className="mt-2">
            If you choose a reprint, we will rush the replacement order at no additional cost.
            You do not need to return the defective items.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[var(--color-gray-900)]">8. Contact</h2>
          <p className="mt-2">
            For refund or quality questions:{" "}
            <a href="mailto:info@lunarprint.ca" className="text-[var(--color-brand)] underline">info@lunarprint.ca</a>{" "}
            or call <a href="tel:+16476185839" className="text-[var(--color-brand)] underline">(647) 618-5839</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
