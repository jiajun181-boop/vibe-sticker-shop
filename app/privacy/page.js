export const metadata = {
  title: "Privacy Policy | La Lunar Printing",
  description: "How La Lunar Printing Inc. collects, uses, and protects your personal information under Canadian privacy law (PIPEDA).",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
      <p className="mt-2 text-sm text-gray-500">Last updated: February 2026</p>

      <div className="prose prose-gray mt-8 max-w-none text-sm leading-relaxed text-gray-700 [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:font-semibold [&_h3]:text-gray-900 [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mb-1">
        <h2>1. Who We Are</h2>
        <p>
          La Lunar Printing Inc. (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is a custom printing company based in Toronto, Ontario, Canada.
          This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or place an order.
        </p>

        <h2>2. Information We Collect</h2>
        <h3>Information You Provide</h3>
        <ul>
          <li><strong>Account information:</strong> name, email address, phone number, password</li>
          <li><strong>Order information:</strong> shipping/billing address, order details, artwork files</li>
          <li><strong>Payment information:</strong> processed securely by Stripe — we never store your card details</li>
          <li><strong>Communications:</strong> messages sent via our contact form or email</li>
          <li><strong>B2B applications:</strong> company name, role, business details</li>
        </ul>

        <h3>Information Collected Automatically</h3>
        <ul>
          <li><strong>Usage data:</strong> pages visited, time on site, referral source</li>
          <li><strong>Device data:</strong> browser type, operating system, IP address</li>
          <li><strong>Cookies:</strong> locale preference, session tokens, analytics identifiers</li>
        </ul>

        <h2>3. How We Use Your Information</h2>
        <ul>
          <li>Processing and fulfilling your orders</li>
          <li>Sending order confirmations, shipping updates, and receipts</li>
          <li>Providing customer support</li>
          <li>Improving our website and services</li>
          <li>Preventing fraud and unauthorized access</li>
          <li>Complying with legal obligations</li>
        </ul>

        <h2>4. How We Share Your Information</h2>
        <p>We do not sell your personal information. We share data only with:</p>
        <ul>
          <li><strong>Stripe:</strong> payment processing</li>
          <li><strong>Resend:</strong> transactional email delivery</li>
          <li><strong>UploadThing:</strong> file storage for artwork uploads</li>
          <li><strong>Vercel:</strong> website hosting</li>
          <li><strong>Google Analytics / Meta Pixel:</strong> anonymous usage analytics</li>
          <li><strong>Shipping carriers:</strong> name and address for order delivery</li>
        </ul>

        <h2>5. Cookies</h2>
        <p>We use the following cookies:</p>
        <ul>
          <li><strong>locale:</strong> language preference (1 year)</li>
          <li><strong>session / admin_session:</strong> authentication (24 hours)</li>
          <li><strong>_ga, _fbp:</strong> analytics (set by Google and Meta)</li>
        </ul>
        <p>You can disable cookies in your browser settings, though some site features may not work properly.</p>

        <h2>6. Data Retention</h2>
        <p>
          We retain your account and order data for as long as your account is active or as needed to provide services.
          Order records are kept for 7 years for tax and legal purposes. You may request deletion of your account at any time.
        </p>

        <h2>7. Your Rights (PIPEDA)</h2>
        <p>Under Canada&apos;s Personal Information Protection and Electronic Documents Act (PIPEDA), you have the right to:</p>
        <ul>
          <li>Access the personal information we hold about you</li>
          <li>Request correction of inaccurate information</li>
          <li>Withdraw consent for data processing</li>
          <li>Request deletion of your personal data</li>
          <li>File a complaint with the Office of the Privacy Commissioner of Canada</li>
        </ul>

        <h2>8. Security</h2>
        <p>
          We use industry-standard security measures including HTTPS encryption, hashed passwords (bcrypt),
          HTTP-only session cookies, Content Security Policy headers, and role-based access controls.
          Payment data is handled entirely by Stripe (PCI DSS compliant).
        </p>

        <h2>9. Children</h2>
        <p>Our services are not directed to individuals under 16. We do not knowingly collect personal information from children.</p>

        <h2>10. Changes to This Policy</h2>
        <p>We may update this policy from time to time. Changes will be posted on this page with an updated date.</p>

        <h2>11. Contact Us</h2>
        <p>
          For privacy inquiries or data requests:<br />
          <strong>La Lunar Printing Inc.</strong><br />
          11 Progress Ave #21, Scarborough, ON M1P 4S7, Canada<br />
          Email: <a href="mailto:info@lunarprint.ca" className="text-gray-900 underline">info@lunarprint.ca</a><br />
          Phone: <a href="tel:+16477834728" className="text-gray-900 underline">647-783-4728</a>
        </p>
      </div>
    </div>
  );
}
