import Link from "next/link";
import { getServerT } from "@/lib/i18n/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vibestickers.com";

export async function generateMetadata() {
  return {
    title: "Design Services | La Lunar Printing Inc.",
    description: "Professional graphic design services for print. Business cards from $75, flyers, brochures, labels, and more. Standard and premium design packages available.",
    alternates: { canonical: `${SITE_URL}/design-services` },
  };
}

const PRICING = [
  { item: "Business Cards", single: "$75+", double: "$85+" },
  { item: "Flyers", single: "$75+", double: "$100+" },
  { item: "Folded Brochures", single: "$75+", double: "$150+" },
  { item: "Posters", single: "$75+", double: "$150+" },
  { item: "Envelopes", single: "$75+", double: "\u2014" },
  { item: "Postcards", single: "$75+", double: "$150+" },
  { item: "Menus", single: "$75\u2013$150+", double: "$150+" },
  { item: "Labels / Stickers", single: "$50+", double: "\u2014" },
  { item: "File Edits / Text Changes", single: "$20\u2013$25+", double: "\u2014" },
  { item: "Hourly Design", single: "$75/hr", double: "$75/hr" },
  { item: "Website Design", single: "$800+", double: "$800+" },
];

export default async function DesignServicesPage() {
  const t = await getServerT();
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-14 text-gray-900">
      <div className="mx-auto max-w-4xl space-y-10">
        {/* Header */}
        <header className="rounded-3xl border border-gray-200 bg-white p-8 md:p-12">
          <p className="text-xs uppercase tracking-[0.25em] text-gray-500">Services</p>
          <h1 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight">Design Services</h1>
          <p className="mt-4 text-sm text-gray-600 leading-relaxed max-w-2xl">
            Need help with your design? Our professional graphic designers can create print-ready artwork
            for any product. From simple text edits to full custom designs, we&apos;ve got you covered.
          </p>
        </header>

        {/* Two tiers */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Standard */}
          <section className="rounded-3xl border border-gray-200 bg-white p-8">
            <div className="inline-block rounded-full bg-gray-100 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">
              Standard
            </div>
            <h2 className="text-xl font-semibold">Standard Design</h2>
            <p className="mt-3 text-sm text-gray-600 leading-relaxed">
              Budget-friendly option for basic layout adjustments. Select &quot;Design Service&quot; at checkout
              and provide notes on your preferred colours, text, and content.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-emerald-500">&#10003;</span>
                Up to 3 revisions
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-emerald-500">&#10003;</span>
                Print-ready file delivery
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-gray-300">&#10005;</span>
                <span className="text-gray-400">Original source files not included</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-gray-300">&#10005;</span>
                <span className="text-gray-400">Print usage only (no reuse rights)</span>
              </li>
            </ul>
          </section>

          {/* Premium */}
          <section className="rounded-3xl border-2 border-gray-900 bg-white p-8 relative">
            <div className="inline-block rounded-full bg-gray-900 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white mb-4">
              Premium
            </div>
            <h2 className="text-xl font-semibold">Premium Custom Design</h2>
            <p className="mt-3 text-sm text-gray-600 leading-relaxed">
              Full custom design service. Contact us directly with your brand requirements including
              vision, style preferences, and target audience.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-emerald-500">&#10003;</span>
                Extended revisions
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-emerald-500">&#10003;</span>
                Print-ready file delivery
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-emerald-500">&#10003;</span>
                Original source files (AI/PSD/InDesign)
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-emerald-500">&#10003;</span>
                Full reusable ownership
              </li>
            </ul>
          </section>
        </div>

        {/* Pricing table */}
        <section className="rounded-3xl border border-gray-200 bg-white p-8 md:p-12">
          <h2 className="text-2xl font-semibold tracking-tight mb-6">Premium Design Pricing</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                  <th className="pb-3 pr-4">Item</th>
                  <th className="pb-3 pr-4">Single Side</th>
                  <th className="pb-3">Double Side</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {PRICING.map((row) => (
                  <tr key={row.item}>
                    <td className="py-3 pr-4 font-medium text-gray-900">{row.item}</td>
                    <td className="py-3 pr-4 text-gray-600">{row.single}</td>
                    <td className="py-3 text-gray-600">{row.double}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-6 text-xs text-gray-400">
            Prices are starting rates and may vary based on complexity. Contact us for a detailed quote.
          </p>
        </section>

        {/* CTA */}
        <section className="rounded-3xl border border-gray-200 bg-gray-900 p-8 text-white">
          <h2 className="text-2xl font-semibold">Ready to get started?</h2>
          <p className="mt-3 text-sm text-gray-300">
            Email us your design brief or call to discuss your project. We typically respond within 24 hours.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="inline-block rounded-full bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-900 hover:bg-gray-100 transition-colors"
            >
              Contact Us
            </Link>
            <a
              href="mailto:info@lunarprint.ca"
              className="inline-block rounded-full border border-white/30 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:border-white/70 transition-colors"
            >
              info@lunarprint.ca
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
