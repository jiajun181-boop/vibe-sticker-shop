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
          By accessing or using the La Lunar Printing Inc. website and services, you agree to be bound by these Terms of Service.
          If you do not agree, please do not use our services.
        </p>

        <h2>2. Services</h2>
        <p>
          We provide custom printing services including but not limited to: stickers, labels, banners, signs, vehicle wraps,
          business cards, and marketing materials. All products are custom-made to order based on your specifications.
        </p>

        <h2>3. Orders and Payment</h2>
        <ul>
          <li>All prices are listed in Canadian Dollars (CAD) and are subject to applicable taxes (HST 13%).</li>
          <li>Payment is processed securely through Stripe at the time of checkout.</li>
          <li>An order confirmation email will be sent upon successful payment.</li>
          <li>We reserve the right to cancel orders if pricing errors are detected.</li>
        </ul>

        <h2>4. Artwork and File Requirements</h2>
        <ul>
          <li>Customers are responsible for ensuring artwork files meet our specifications (format, resolution, bleed area).</li>
          <li>We perform a basic preflight check but do not guarantee the accuracy of colors, spelling, or design intent.</li>
          <li>By submitting artwork, you confirm you have the right to use and reproduce all content.</li>
          <li>We are not responsible for errors in customer-supplied artwork.</li>
        </ul>

        <h2>5. Production and Shipping</h2>
        <ul>
          <li>Standard production time is 3-5 business days from artwork approval.</li>
          <li>Rush orders are available for an additional fee.</li>
          <li>Shipping times vary by carrier and destination.</li>
          <li>Free shipping is available on orders over $150 CAD (Canada-wide standard shipping).</li>
          <li>Risk of loss transfers to the customer upon delivery to the carrier.</li>
        </ul>

        <h2>6. Cancellations</h2>
        <ul>
          <li>Orders may be cancelled within 2 hours of placement if production has not begun.</li>
          <li>Once production has started, cancellation is not possible as products are custom-made.</li>
          <li>To request cancellation, contact us immediately at info@lalunarprinting.com.</li>
        </ul>

        <h2>7. Intellectual Property</h2>
        <p>
          All website content, logos, and designs belonging to La Lunar Printing are protected by copyright.
          Customer-submitted artwork remains the property of the customer. We may retain copies for reprints and quality reference.
        </p>

        <h2>8. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, La Lunar Printing shall not be liable for indirect, incidental, or consequential damages.
          Our total liability for any claim shall not exceed the amount paid for the specific order in question.
        </p>

        <h2>9. Account Responsibilities</h2>
        <ul>
          <li>You are responsible for maintaining the security of your account credentials.</li>
          <li>You agree to provide accurate and complete information when creating an account.</li>
          <li>We reserve the right to suspend or terminate accounts that violate these terms.</li>
        </ul>

        <h2>10. Governing Law</h2>
        <p>
          These terms are governed by the laws of the Province of Ontario and the federal laws of Canada applicable therein.
          Any disputes shall be resolved in the courts of Ontario.
        </p>

        <h2>11. Changes to Terms</h2>
        <p>We may update these terms from time to time. Continued use of the site after changes constitutes acceptance.</p>

        <h2>12. Contact</h2>
        <p>
          <strong>La Lunar Printing Inc.</strong><br />
          Email: <a href="mailto:info@lalunarprinting.com" className="text-gray-900 underline">info@lalunarprinting.com</a><br />
          Toronto, Ontario, Canada
        </p>
      </div>
    </div>
  );
}
