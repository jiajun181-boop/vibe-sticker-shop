"use client";

import Link from "next/link";

export default function ProductSpecsSection({ specs, productSpecs, t }) {
  return (
    <>
      {/* Quality Guarantee */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
        <h2 className="text-lg font-semibold tracking-tight">{t("product.qualityGuarantee")}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z", title: t("product.qg300dpi"), desc: t("product.qg300dpiDesc") },
            { icon: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z", title: t("product.qgTurnaround"), desc: t("product.qgTurnaroundDesc") },
            { icon: "M11.42 15.17l-5.59-5.17a8.002 8.002 0 0111.77-1.01l.17.17M21 12a9 9 0 11-18 0 9 9 0 0118 0z", title: t("product.qgCustom"), desc: <Link href="/quote" className="text-gray-900 underline underline-offset-2 hover:text-black">{t("product.qgGetQuote")}</Link> },
          ].map((item) => (
            <div key={item.title} className="flex gap-3">
              <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              <div>
                <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                <p className="mt-0.5 text-xs text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* North America Print Basics */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
        <h2 className="text-lg font-semibold tracking-tight">{t("product.printBasicsTitle")}</h2>
        <p className="mt-1 text-xs text-gray-500">{t("product.printBasicsSubtitle")}</p>
        <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Bleed", t("product.pbBleed")],
            ["Safe Area", t("product.pbSafeArea")],
            ["CMYK", t("product.pbCMYK")],
            ["DPI", t("product.pbDPI")],
            ["Text Stock", t("product.pbTextStock")],
            ["Cardstock", t("product.pbCardstock")],
            ["Coating", t("product.pbCoating")],
            ["Lamination", t("product.pbLamination")],
            ["Turnaround", t("product.pbTurnaround")],
            ["Proof", t("product.pbProof")],
          ].map(([term, def]) => (
            <div key={term} className="flex gap-2">
              <dt className="text-xs font-semibold text-gray-900 whitespace-nowrap">{term}</dt>
              <dd className="text-xs text-gray-500">{def}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}
