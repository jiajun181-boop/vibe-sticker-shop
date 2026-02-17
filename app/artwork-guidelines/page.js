import Link from "next/link";
import { getServerT } from "@/lib/i18n/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lunarprint.ca";

export async function generateMetadata() {
  return {
    title: "Artwork & File Preparation Guidelines | La Lunar Printing Inc.",
    description: "File preparation specs for print: accepted formats, DPI requirements, bleed, colour mode, and design tips. Get it right the first time.",
    alternates: { canonical: `${SITE_URL}/artwork-guidelines` },
  };
}

export default async function ArtworkGuidelinesPage() {
  const t = await getServerT();
  return (
    <main className="min-h-screen bg-[var(--color-gray-50)] px-6 py-14 text-[var(--color-gray-900)]">
      <div className="mx-auto max-w-4xl space-y-10">
        {/* Header */}
        <header className="rounded-3xl border border-[var(--color-gray-200)] bg-white p-8 md:p-12">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-gray-500)]">Resources</p>
          <h1 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight">Artwork &amp; File Preparation</h1>
          <p className="mt-4 text-sm text-[var(--color-gray-600)] leading-relaxed max-w-2xl">
            Follow these guidelines to ensure your files are print-ready. Properly prepared artwork means
            faster production and the best possible results.
          </p>
        </header>

        {/* File Specs */}
        <section className="rounded-3xl border border-[var(--color-gray-200)] bg-white p-8 md:p-12">
          <h2 className="text-2xl font-semibold tracking-tight mb-6">File Requirements</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--color-gray-100)] bg-[var(--color-gray-50)] p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-gray-400)] mb-2">File Formats</p>
              <p className="text-sm text-[var(--color-gray-700)] font-medium">PDF, AI, PSD, JPG, PNG, TIF</p>
              <p className="text-xs text-[var(--color-gray-500)] mt-1">AI/PSD recommended (CS6 or earlier)</p>
            </div>
            <div className="rounded-2xl border border-[var(--color-gray-100)] bg-[var(--color-gray-50)] p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-gray-400)] mb-2">Resolution</p>
              <p className="text-sm text-[var(--color-gray-700)] font-medium">300 DPI minimum</p>
              <p className="text-xs text-[var(--color-gray-500)] mt-1">1200 DPI recommended for small text &amp; fine details</p>
            </div>
            <div className="rounded-2xl border border-[var(--color-gray-100)] bg-[var(--color-gray-50)] p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-gray-400)] mb-2">Colour Mode</p>
              <p className="text-sm text-[var(--color-gray-700)] font-medium">CMYK Only</p>
              <p className="text-xs text-[var(--color-gray-500)] mt-1">RGB files are not accepted</p>
            </div>
            <div className="rounded-2xl border border-[var(--color-gray-100)] bg-[var(--color-gray-50)] p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-gray-400)] mb-2">Bleed</p>
              <p className="text-sm text-[var(--color-gray-700)] font-medium">3 mm on all sides</p>
              <p className="text-xs text-[var(--color-gray-500)] mt-1">Extend backgrounds and images to the bleed line</p>
            </div>
            <div className="rounded-2xl border border-[var(--color-gray-100)] bg-[var(--color-gray-50)] p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-gray-400)] mb-2">Fonts</p>
              <p className="text-sm text-[var(--color-gray-700)] font-medium">Convert all text to outlines</p>
              <p className="text-xs text-[var(--color-gray-500)] mt-1">Or embed all fonts in your PDF</p>
            </div>
            <div className="rounded-2xl border border-[var(--color-gray-100)] bg-[var(--color-gray-50)] p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-gray-400)] mb-2">Safe Zone</p>
              <p className="text-sm text-[var(--color-gray-700)] font-medium">5 mm inside trim line</p>
              <p className="text-xs text-[var(--color-gray-500)] mt-1">Keep important text &amp; logos in the safe area</p>
            </div>
          </div>
        </section>

        {/* Design Tips */}
        <section className="rounded-3xl border border-[var(--color-gray-200)] bg-white p-8 md:p-12">
          <h2 className="text-2xl font-semibold tracking-tight mb-6">Design Tips</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-[var(--color-gray-900)]">Colour Variations</h3>
              <p className="mt-2 text-sm text-[var(--color-gray-600)] leading-relaxed">
                Slight colour variations (10&ndash;15%) may occur between digital screens, inkjet proofs,
                and printed output due to equipment differences. For critical colour work, we recommend
                using Pantone spot colours or requesting a press proof.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--color-gray-900)]">Black Text &amp; Backgrounds</h3>
              <p className="mt-2 text-sm text-[var(--color-gray-600)] leading-relaxed">
                For small text, use single black (100% K) for sharp, crisp results.
                For large solid areas, use rich black (C60 M40 Y40 K100) for deeper, more uniform coverage.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--color-gray-900)]">Borders &amp; Frames</h3>
              <p className="mt-2 text-sm text-[var(--color-gray-600)] leading-relaxed">
                Thin borders near the trim edge may appear uneven due to cutting tolerance.
                If borders are essential, maintain a minimum width of 3&ndash;4 mm.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--color-gray-900)]">Folded Items</h3>
              <p className="mt-2 text-sm text-[var(--color-gray-600)] leading-relaxed">
                For folded brochures and menus, keep important content at least 20 mm from the fold line
                to prevent text from being obscured.
              </p>
            </div>
          </div>
        </section>

        {/* Colour policy */}
        <section className="rounded-3xl border border-[var(--color-gray-200)] bg-white p-8">
          <h2 className="text-xl font-semibold tracking-tight mb-4">Colour Complaint Policy</h2>
          <div className="space-y-3 text-sm text-[var(--color-gray-600)]">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-emerald-500 font-bold">&#10003;</span>
              <p><strong>Variations exceeding 15%:</strong> Free reprinting offered.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-[var(--color-gray-400)] font-bold">&mdash;</span>
              <p><strong>Variations within 15%:</strong> Standard industry tolerance, not eligible for refund.</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-3xl border border-[var(--color-gray-200)] bg-[var(--color-gray-900)] p-8 text-white">
          <h2 className="text-2xl font-semibold">Need help with your files?</h2>
          <p className="mt-3 text-sm text-[var(--color-gray-300)]">
            Not sure if your artwork is print-ready? Send it to us and our preflight team will check it for free.
            We also offer professional <Link href="/design-services" className="underline hover:text-white">design services</Link> starting at $50.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="inline-block rounded-full bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-gray-900)] hover:bg-[var(--color-gray-100)] transition-colors"
            >
              Contact Us
            </Link>
            <Link
              href="/shop"
              className="inline-block rounded-full border border-white/30 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:border-white/70 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
