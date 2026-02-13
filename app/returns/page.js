export const metadata = {
  title: "Return & Refund Policy | La Lunar Printing",
  description: "La Lunar Printing's policy on returns, refunds, reprints, and quality guarantees for custom printing orders.",
};

export default function ReturnsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900">Return & Refund Policy</h1>
      <p className="mt-2 text-sm text-gray-500">Last updated: February 2026</p>

      <div className="prose prose-gray mt-8 max-w-none text-sm leading-relaxed text-gray-700 [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:font-semibold [&_h3]:text-gray-900 [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mb-1">
        <h2>Custom Products</h2>
        <p>
          Because all our products are custom-made to your specifications, we generally cannot accept returns for
          change of mind. However, we stand behind our quality and will make it right if there is an issue with your order.
        </p>

        <h2>Quality Guarantee</h2>
        <p>If your order arrives with any of the following issues, we will provide a <strong>free reprint or full refund</strong>:</p>
        <ul>
          <li>Print defects (smudging, misalignment, color banding, missing content)</li>
          <li>Wrong product or specifications delivered</li>
          <li>Damage during production (not shipping damage)</li>
          <li>Material defects (peeling, cracking, delamination)</li>
          <li>Incorrect quantity delivered</li>
        </ul>

        <h2>How to Report an Issue</h2>
        <ul>
          <li>Contact us within <strong>7 days of receiving your order</strong></li>
          <li>Email <a href="mailto:info@lalunarprinting.com" className="text-gray-900 underline">info@lalunarprinting.com</a> with your order number and photos of the issue</li>
          <li>Our quality team will review your claim within 1-2 business days</li>
          <li>We may request you return the defective items for inspection (at our expense)</li>
        </ul>

        <h2>Reprints</h2>
        <p>
          For confirmed quality issues, we will rush a reprint at no additional cost. Reprints are prioritized
          and typically ship within 2-3 business days. If a reprint is not possible, we will issue a full refund.
        </p>

        <h2>Refunds</h2>
        <ul>
          <li><strong>Full refund:</strong> for confirmed defects where a reprint is not desired or not feasible</li>
          <li><strong>Partial refund:</strong> for minor issues that don&apos;t affect usability (e.g., slight color variation within industry tolerance)</li>
          <li>Refunds are processed to the original payment method within 5-10 business days</li>
          <li>Shipping costs are refunded only if the issue is our fault</li>
        </ul>

        <h2>What We Cannot Refund</h2>
        <ul>
          <li>Errors in customer-supplied artwork (typos, low resolution, incorrect colors)</li>
          <li>Color variations within normal printing tolerance (±10% is industry standard)</li>
          <li>Orders where a digital proof was approved by the customer</li>
          <li>Damage caused by improper application or storage</li>
          <li>Shipping damage (file a claim with the carrier; we can assist)</li>
        </ul>

        <h2>Cancellations</h2>
        <p>
          Orders can be cancelled for a full refund within 2 hours of placement, provided production has not started.
          After production begins, cancellation is not possible.
        </p>

        <h2>Shipping Damage</h2>
        <p>
          If your package arrives damaged, please photograph the packaging and contents immediately. Contact us within
          48 hours and we will either file a carrier claim on your behalf or send a replacement at our discretion.
        </p>

        <h2>Contact</h2>
        <p>
          For any return or refund inquiries:<br />
          <strong>La Lunar Printing Inc.</strong><br />
          Email: <a href="mailto:info@lalunarprinting.com" className="text-gray-900 underline">info@lalunarprinting.com</a><br />
          Phone: +1 (416) 555-0199<br />
          Toronto, Ontario, Canada
        </p>
      </div>
    </div>
  );
}
