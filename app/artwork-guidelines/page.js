import Link from "next/link";
import { getServerT } from "@/lib/i18n/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.lunarprint.ca";

export async function generateMetadata() {
  return {
    title: "Print-Ready File Guidelines",
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
              <p className="text-sm text-[var(--color-gray-700)] font-medium">PDF, AI, EPS, PSD, JPG, PNG, TIF</p>
              <p className="text-xs text-[var(--color-gray-500)] mt-1">AI/EPS/PSD recommended (CS6 or earlier)</p>
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
              <p className="text-sm text-[var(--color-gray-700)] font-medium">1/8&quot; (3 mm) on all sides</p>
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

        {/* Common Mistakes */}
        <section className="rounded-3xl border border-[var(--color-gray-200)] bg-white p-8 md:p-12">
          <h2 className="text-2xl font-semibold tracking-tight mb-6">Common Mistakes to Avoid</h2>
          <div className="space-y-4">
            {[
              { title: "Low Resolution Images", desc: "Images pulled from websites are typically 72 DPI. Print requires 300 DPI minimum. Low-res files will appear pixelated and blurry." },
              { title: "RGB Colour Mode", desc: "Files designed in RGB will be converted to CMYK for printing, which can shift colours — especially neon greens and bright blues. Design in CMYK from the start." },
              { title: "Missing Bleed", desc: "Without 1/8\" bleed, you may see thin white edges on your finished product. Always extend backgrounds past the trim line." },
              { title: "Text Too Close to Edge", desc: "Important text or logos within 5 mm of the trim line risk being cut off. Keep critical elements inside the safe zone." },
              { title: "Fonts Not Outlined", desc: "If fonts are not converted to outlines (or embedded), they may substitute with a default font during production." },
              { title: "Transparent Backgrounds on Print Files", desc: "Unless your product requires transparency (clear stickers, window clings), flatten all layers and use a solid white background." },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-bold text-[var(--color-gray-900)]">{item.title}</p>
                  <p className="mt-1 text-sm text-[var(--color-gray-600)] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Template Downloads */}
        <section className="rounded-3xl border border-[var(--color-gray-200)] bg-white p-8">
          <h2 className="text-xl font-semibold tracking-tight mb-4">Template Downloads</h2>
          <p className="text-sm text-[var(--color-gray-600)] leading-relaxed">
            Templates for popular products are coming soon. In the meantime, contact us at{" "}
            <a href="mailto:info@lunarprint.ca" className="font-medium text-[var(--color-gray-900)] underline underline-offset-2 hover:text-[var(--color-gray-700)]">info@lunarprint.ca</a>{" "}
            and we&apos;ll send you a custom template for your order.
          </p>
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
        <section className="rounded-3xl border border-[var(--color-gray-200)] bg-[var(--color-gray-900)] p-8 text-[#fff]">
          <h2 className="text-2xl font-semibold">Need help with your files?</h2>
          <p className="mt-3 text-sm text-[var(--color-gray-300)]">
            Not sure if your artwork is print-ready? Send it to{" "}
            <a href="mailto:info@lunarprint.ca" className="font-medium underline hover:text-[#fff]">info@lunarprint.ca</a>{" "}
            and our preflight team will check it for free. You can also call us at{" "}
            <a href="tel:+16478869288" className="font-medium underline hover:text-[#fff]">647-886-9288</a>.
            We offer professional <Link href="/design-services" className="underline hover:text-[#fff]">design services</Link> — text edits from $20, full design from $50+.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="mailto:info@lunarprint.ca"
              className="inline-block rounded-xl bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-900)] hover:bg-[var(--color-gray-100)] transition-colors"
            >
              Email Artwork
            </a>
            <Link
              href="/shop"
              className="inline-block rounded-xl border border-white/30 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#fff] hover:border-white/70 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        </section>

        {/* Chinese Translation */}
        <section className="rounded-3xl border border-[var(--color-gray-200)] bg-white p-8 md:p-12" lang="zh">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-gray-500)]">中文指南</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">印刷文件准备指南</h2>
          <p className="mt-4 text-sm text-[var(--color-gray-600)] leading-relaxed max-w-2xl">
            请按照以下要求准备您的文件，确保印刷质量达到最佳效果。
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--color-gray-100)] bg-[var(--color-gray-50)] p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-gray-400)] mb-2">文件格式</p>
              <p className="text-sm text-[var(--color-gray-700)] font-medium">PDF, AI, EPS, PSD, JPG, PNG, TIF</p>
              <p className="text-xs text-[var(--color-gray-500)] mt-1">推荐使用 AI/EPS/PSD（CS6 或更早版本）</p>
            </div>
            <div className="rounded-2xl border border-[var(--color-gray-100)] bg-[var(--color-gray-50)] p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-gray-400)] mb-2">分辨率</p>
              <p className="text-sm text-[var(--color-gray-700)] font-medium">最低 300 DPI</p>
              <p className="text-xs text-[var(--color-gray-500)] mt-1">小字和精细图案建议 1200 DPI</p>
            </div>
            <div className="rounded-2xl border border-[var(--color-gray-100)] bg-[var(--color-gray-50)] p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-gray-400)] mb-2">色彩模式</p>
              <p className="text-sm text-[var(--color-gray-700)] font-medium">仅接受 CMYK</p>
              <p className="text-xs text-[var(--color-gray-500)] mt-1">RGB 文件不被接受</p>
            </div>
            <div className="rounded-2xl border border-[var(--color-gray-100)] bg-[var(--color-gray-50)] p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-gray-400)] mb-2">出血</p>
              <p className="text-sm text-[var(--color-gray-700)] font-medium">四周各留 1/8&quot;（3mm）</p>
              <p className="text-xs text-[var(--color-gray-500)] mt-1">将背景和图像延伸到出血线</p>
            </div>
            <div className="rounded-2xl border border-[var(--color-gray-100)] bg-[var(--color-gray-50)] p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-gray-400)] mb-2">字体</p>
              <p className="text-sm text-[var(--color-gray-700)] font-medium">所有文字转为轮廓</p>
              <p className="text-xs text-[var(--color-gray-500)] mt-1">或在 PDF 中嵌入所有字体</p>
            </div>
            <div className="rounded-2xl border border-[var(--color-gray-100)] bg-[var(--color-gray-50)] p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-gray-400)] mb-2">安全区域</p>
              <p className="text-sm text-[var(--color-gray-700)] font-medium">裁切线内 5mm</p>
              <p className="text-xs text-[var(--color-gray-500)] mt-1">重要文字和标志保留在安全区域内</p>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-semibold text-[var(--color-gray-900)]">常见错误</h3>
            {[
              { title: "图片分辨率过低", desc: "网页图片通常只有 72 DPI，印刷需要 300 DPI 以上，否则会模糊。" },
              { title: "使用 RGB 色彩模式", desc: "RGB 转换为 CMYK 时颜色会偏移，尤其是亮绿和亮蓝色。请从一开始就使用 CMYK。" },
              { title: "缺少出血", desc: "没有出血的文件在裁切后可能出现白边，请将背景延伸到裁切线外 1/8\"。" },
              { title: "文字太靠近边缘", desc: "距裁切线 5mm 以内的重要内容可能被切掉，请将关键元素放在安全区域内。" },
              { title: "字体未转曲", desc: "未转换为轮廓或未嵌入的字体可能在制作时被替换为默认字体。" },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-bold text-[var(--color-gray-900)]">{item.title}</p>
                  <p className="mt-1 text-sm text-[var(--color-gray-600)] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl bg-[var(--color-gray-50)] p-5">
            <p className="text-sm text-[var(--color-gray-600)]">
              需要帮助？请将文件发送至{" "}
              <a href="mailto:info@lunarprint.ca" className="font-medium text-[var(--color-gray-900)] underline">info@lunarprint.ca</a>
              ，我们的制前团队会免费检查。也可致电{" "}
              <a href="tel:+16478869288" className="font-medium text-[var(--color-gray-900)] underline">647-886-9288</a>。
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
