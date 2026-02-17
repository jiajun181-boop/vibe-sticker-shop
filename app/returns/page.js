export const metadata = {
  title: "Return & Refund Policy | La Lunar Printing",
  description: "La Lunar Printing's policy on returns, refunds, reprints, and quality guarantees for custom printing orders.",
};

export default function ReturnsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold text-[var(--color-gray-900)]">Return &amp; Refund Policy</h1>
      <p className="mt-2 text-sm text-[var(--color-gray-500)]">Last updated: February 2026</p>

      <div className="prose prose-gray mt-8 max-w-none text-sm leading-relaxed text-[var(--color-gray-700)] [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-[var(--color-gray-900)] [&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:font-semibold [&_h3]:text-[var(--color-gray-900)] [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mb-1">
        <h2>Custom Products</h2>
        <p>
          All sales are final. Because all our products are custom-manufactured to your specifications, we do not
          accept returns for change of mind. However, we stand behind our quality and will make it right if there
          is a production error on our part.
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
          <li>Contact us within <strong>2 days of receiving your order</strong>.</li>
          <li>Provide 2&ndash;3 photos from different angles along with your order number.</li>
          <li>
            Send to: <a href="mailto:info@lunarprint.ca" className="text-[var(--color-gray-900)] underline">info@lunarprint.ca</a> or
            WeChat: <strong>lunarprinting</strong>
          </li>
          <li>Our quality team will review your claim within 1&ndash;2 business days.</li>
          <li>We may offer refunds, reprints, or replacements based on verification.</li>
        </ul>

        <h2>Reprints</h2>
        <p>
          For confirmed quality issues, we will rush a reprint at no additional cost. Reprints are prioritized
          and typically ship within 2&ndash;3 business days. If a reprint is not possible, we will issue a full refund.
        </p>

        <h2>Refunds</h2>
        <ul>
          <li><strong>Full refund:</strong> for confirmed production defects where a reprint is not desired or not feasible.</li>
          <li><strong>Partial refund:</strong> for minor issues that don&apos;t affect usability.</li>
          <li>Refunds are processed to the original payment method within 5&ndash;10 business days.</li>
          <li>Shipping costs are refunded only if the issue is our fault.</li>
        </ul>

        <h2>Non-Refundable / Non-Returnable Conditions</h2>
        <p>The following are considered within standard industry tolerances and are not eligible for refund or reprint:</p>
        <ul>
          <li><strong>Colour variance &plusmn;10%</strong> &mdash; slight differences between screen and print are normal. Repeat orders may also show minor variation.</li>
          <li><strong>Rich black (CMYK)</strong> &mdash; slight misregistration or ghosting on small text is acceptable in offset and digital printing.</li>
          <li><strong>Cutting/finishing tolerance of 1&ndash;2 mm</strong> &mdash; standard deviation in trim and die-cutting.</li>
          <li><strong>Special processes</strong> (die cutting, foiling, numbering, perforation, scoring, folding) &mdash; up to 3&ndash;5% production loss is industry standard.</li>
          <li><strong>Claims reported beyond 2 days</strong> after delivery.</li>
          <li><strong>Customer file errors</strong> &mdash; layout mistakes, images below 300 DPI, wrong colour mode, typos, or design issues in customer-supplied artwork.</li>
          <li><strong>Improper storage</strong> &mdash; damage from moisture, staining, or mishandling after delivery.</li>
          <li><strong>Shipping delays</strong> caused by the courier or logistics provider.</li>
        </ul>

        <h2>Shipping Damage</h2>
        <p>
          If your package arrives damaged, please photograph the packaging and contents immediately. Contact us within
          48 hours and we will either file a carrier claim on your behalf or send a replacement at our discretion.
        </p>

        <h2>Contact</h2>
        <p>
          For any return or refund inquiries:<br />
          <strong>La Lunar Printing Inc.</strong><br />
          11 Progress Ave #21, Scarborough, ON M1P 4S7, Canada<br />
          Email: <a href="mailto:info@lunarprint.ca" className="text-[var(--color-gray-900)] underline">info@lunarprint.ca</a><br />
          Phone: <a href="tel:+16477834728" className="text-[var(--color-gray-900)] underline">647-783-4728</a><br />
          WeChat: lunarprinting
        </p>
      </div>
    </div>
  );
}
