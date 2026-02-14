export const metadata = {
  title: "Terms of Service | La Lunar Printing",
  description: "Terms and conditions governing the use of La Lunar Printing's website and custom printing services.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
      <p className="mt-2 text-sm text-gray-500">Last updated: February 2026</p>

      <div className="prose prose-gray mt-8 max-w-none text-sm leading-relaxed text-gray-700 [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-gray-900 [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mb-1">
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing, browsing, or using the La Lunar Printing Inc. website (including placing orders), you agree
          to be bound by these Terms &amp; Conditions and all applicable Canadian laws and regulations. We reserve the
          right to modify these terms at any time. If you do not agree, please do not use our services.
        </p>

        <h2>2. Services</h2>
        <p>
          We provide custom printing services including but not limited to: stickers, labels, banners, signs, vehicle wraps,
          business cards, brochures, booklets, large-format prints, and marketing materials. All products are custom-made
          to order based on your specifications.
        </p>

        <h2>3. Sales Policy</h2>
        <p>
          All sales are final. Because all products are custom-manufactured to your specifications, we do not accept returns
          for change of mind. Reprints will only be issued if La Lunar Printing verifies a production error on our part.
          No refunds or cancellations are possible once production has begun.
        </p>

        <h2>4. Orders and Payment</h2>
        <ul>
          <li>All prices are listed in Canadian Dollars (CAD) and are subject to applicable taxes (HST 13%).</li>
          <li>Payment is processed securely through Stripe at the time of checkout.</li>
          <li>We also accept Visa, MasterCard, American Express, Debit, and E-Transfer (include your order number in the memo).</li>
          <li>An order confirmation email will be sent upon successful payment.</li>
          <li>We reserve the right to cancel orders if pricing errors are detected.</li>
        </ul>

        <h2>5. Artwork and File Requirements</h2>
        <ul>
          <li>Accepted formats: PDF, AI, PSD, JPG, PNG, TIF (AI/PSD recommended CS6 or earlier).</li>
          <li>Resolution: 300 DPI or higher (1200 DPI recommended for small text and fine details).</li>
          <li>Color mode: CMYK only (RGB files are not accepted).</li>
          <li>Bleed: 3 mm on all sides.</li>
          <li>All fonts must be converted to outlines or embedded.</li>
          <li>By submitting artwork, you confirm you have the right to use and reproduce all content.</li>
          <li>You grant La Lunar Printing a limited, non-exclusive, royalty-free license to use submitted files for production, proofing, training, and portfolio purposes unless you request otherwise.</li>
          <li>We perform a preflight check but are not responsible for errors in customer-supplied artwork.</li>
        </ul>

        <h2>6. Industry Tolerances</h2>
        <p>
          Custom printing is subject to standard industry tolerances. The following are considered within acceptable range
          and are not grounds for refund or reprint:
        </p>
        <ul>
          <li>Colour variation of &plusmn;10% between screen display and printed output.</li>
          <li>Trim/cutting tolerance of 1&ndash;2 mm deviation.</li>
          <li>Special processes (die cutting, foiling, numbering, perforation, scoring, folding) may have 3&ndash;5% production variance.</li>
        </ul>

        <h2>7. Production and Shipping</h2>
        <ul>
          <li>Production begins after artwork approval. Most standard jobs are completed in 1&ndash;2 business days.</li>
          <li>Orders finalized after 6:00 PM EST are processed the following business day.</li>
          <li>Shipping is handled via UPS with delivery across Canada and the US, typically within 3 business days.</li>
          <li>Customers receive a tracking notification by email upon shipment.</li>
          <li>Risk of loss transfers to the customer upon delivery to the carrier.</li>
          <li>Legal holidays, power outages, and equipment maintenance may cause delays.</li>
        </ul>

        <h2>8. Cancellations</h2>
        <ul>
          <li>Once artwork is approved, it immediately goes into production. No changes or cancellations are accepted after approval.</li>
          <li>To request cancellation before approval, contact us immediately at info@lunarprint.ca.</li>
        </ul>

        <h2>9. Intellectual Property</h2>
        <p>
          All website content, logos, and designs belonging to La Lunar Printing are protected by copyright.
          Customer-submitted artwork remains the property of the customer. We may retain copies for reprints and quality reference.
        </p>

        <h2>10. Limitation of Liability</h2>
        <p>
          La Lunar Printing&apos;s total liability for any claim shall not exceed the amount actually paid for the specific
          order in question. We are not liable for indirect, incidental, or consequential damages.
        </p>

        <h2>11. Privacy</h2>
        <p>
          We comply with Canada&apos;s Personal Information Protection and Electronic Documents Act (PIPEDA).
          Your personal data is not sold to third parties and is used only for transaction completion and service delivery.
          See our <a href="/privacy" className="text-gray-900 underline">Privacy Policy</a> for full details.
        </p>

        <h2>12. International Orders</h2>
        <p>
          Customers outside Canada are responsible for any customs duties, import taxes, and fees levied by their country.
        </p>

        <h2>13. Governing Law</h2>
        <p>
          These terms are governed by the laws of the Province of Ontario and the federal laws of Canada applicable therein.
          The courts in Toronto, Ontario have exclusive jurisdiction over any disputes.
        </p>

        <h2>14. Contact</h2>
        <p>
          <strong>La Lunar Printing Inc.</strong><br />
          11 Progress Ave #21, Scarborough, ON M1P 4S7, Canada<br />
          Phone: <a href="tel:+16477834728" className="text-gray-900 underline">647-783-4728</a><br />
          Email: <a href="mailto:info@lunarprint.ca" className="text-gray-900 underline">info@lunarprint.ca</a><br />
          Hours: Monday&ndash;Friday, 10:00 AM &ndash; 6:00 PM EST
        </p>
      </div>
    </div>
  );
}
