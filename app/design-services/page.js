import Link from "next/link";
import { getServerT, getServerLocale } from "@/lib/i18n/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.lunarprint.ca";

export async function generateMetadata() {
  const locale = await getServerLocale();
  const isZh = locale === "zh";
  const title = isZh
    ? "设计服务"
    : "Design Services";
  const description = isZh
    ? "专业平面设计服务。名片设计低至$75，传单、折页、标签等。提供标准和高级设计套餐。"
    : "Professional graphic design services for print. Business cards from $75, flyers, brochures, labels, and more. Standard and premium design packages available.";

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/design-services` },
  };
}

const PRICING = [
  { en: "Business Cards", zh: "名片", single: "$75+", double: "$85+" },
  { en: "Flyers", zh: "传单", single: "$75+", double: "$100+" },
  { en: "Folded Brochures", zh: "折页", single: "$75+", double: "$150+" },
  { en: "Posters", zh: "海报", single: "$75+", double: "$150+" },
  { en: "Envelopes", zh: "信封", single: "$75+", double: "\u2014" },
  { en: "Postcards", zh: "明信片", single: "$75+", double: "$150+" },
  { en: "Menus", zh: "菜单", single: "$75\u2013$150+", double: "$150+" },
  { en: "Labels / Stickers", zh: "标签 / 贴纸", single: "$50+", double: "\u2014" },
  { en: "File Edits / Text Changes", zh: "文件修改 / 文字更改", single: "$20\u2013$25+", double: "\u2014" },
  { en: "Hourly Design", zh: "按小时设计", single: "$75/hr", double: "$75/hr" },
  { en: "Website Design", zh: "网站设计", single: "$800+", double: "$800+" },
];

export default async function DesignServicesPage() {
  const locale = await getServerLocale();
  const isZh = locale === "zh";

  return (
    <main className="min-h-screen bg-[var(--color-gray-50)] px-6 py-14 text-[var(--color-gray-900)]">
      <div className="mx-auto max-w-4xl space-y-10">
        {/* Header */}
        <header className="rounded-3xl border border-[var(--color-gray-200)] bg-white p-8 md:p-12">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-gray-500)]">
            {isZh ? "服务" : "Services"}
          </p>
          <h1 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight">
            {isZh ? "设计服务" : "Design Services"}
          </h1>
          <p className="mt-4 text-sm text-[var(--color-gray-600)] leading-relaxed max-w-2xl">
            {isZh
              ? "需要设计帮助？我们的专业平面设计师可以为任何产品创建印刷就绪的设计稿。从简单的文字修改到完整的定制设计，我们都能为您搞定。"
              : "Need help with your design? Our professional graphic designers can create print-ready artwork for any product. From simple text edits to full custom designs, we\u2019ve got you covered."}
          </p>
        </header>

        {/* Two tiers */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Standard */}
          <section className="rounded-3xl border border-[var(--color-gray-200)] bg-white p-8">
            <div className="inline-block rounded-xl bg-[var(--color-gray-100)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-gray-500)] mb-4">
              {isZh ? "标准" : "Standard"}
            </div>
            <h2 className="text-xl font-semibold">
              {isZh ? "标准设计" : "Standard Design"}
            </h2>
            <p className="mt-3 text-sm text-[var(--color-gray-600)] leading-relaxed">
              {isZh
                ? "经济实惠的基础版面调整方案。结账时选择「设计服务」，并提供您偏好的颜色、文字和内容说明。"
                : "Budget-friendly option for basic layout adjustments. Select \"Design Service\" at checkout and provide notes on your preferred colours, text, and content."}
            </p>
            <ul className="mt-5 space-y-2 text-sm text-[var(--color-gray-700)]">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-emerald-500">&#10003;</span>
                {isZh ? "最多 3 次修改" : "Up to 3 revisions"}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-emerald-500">&#10003;</span>
                {isZh ? "交付印刷就绪文件" : "Print-ready file delivery"}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-[var(--color-gray-300)]">&#10005;</span>
                <span className="text-[var(--color-gray-400)]">
                  {isZh ? "不包含原始源文件" : "Original source files not included"}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-[var(--color-gray-300)]">&#10005;</span>
                <span className="text-[var(--color-gray-400)]">
                  {isZh ? "仅限印刷使用（无二次使用权）" : "Print usage only (no reuse rights)"}
                </span>
              </li>
            </ul>
          </section>

          {/* Premium */}
          <section className="rounded-3xl border-2 border-[var(--color-gray-900)] bg-white p-8 relative">
            <div className="inline-block rounded-xl bg-[var(--color-gray-900)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#fff] mb-4">
              {isZh ? "高级" : "Premium"}
            </div>
            <h2 className="text-xl font-semibold">
              {isZh ? "高级定制设计" : "Premium Custom Design"}
            </h2>
            <p className="mt-3 text-sm text-[var(--color-gray-600)] leading-relaxed">
              {isZh
                ? "全方位定制设计服务。直接联系我们，告诉我们您的品牌需求，包括设计愿景、风格偏好和目标受众。"
                : "Full custom design service. Contact us directly with your brand requirements including vision, style preferences, and target audience."}
            </p>
            <ul className="mt-5 space-y-2 text-sm text-[var(--color-gray-700)]">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-emerald-500">&#10003;</span>
                {isZh ? "更多修改次数" : "Extended revisions"}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-emerald-500">&#10003;</span>
                {isZh ? "交付印刷就绪文件" : "Print-ready file delivery"}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-emerald-500">&#10003;</span>
                {isZh ? "原始源文件（AI/PSD/InDesign）" : "Original source files (AI/PSD/InDesign)"}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-emerald-500">&#10003;</span>
                {isZh ? "完整的可复用所有权" : "Full reusable ownership"}
              </li>
            </ul>
          </section>
        </div>

        {/* How it works */}
        <section className="rounded-3xl border border-[var(--color-gray-200)] bg-white p-8 md:p-12">
          <h2 className="text-2xl font-semibold tracking-tight mb-6">
            {isZh ? "设计流程" : "How It Works"}
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-gray-100)] text-lg font-bold text-[var(--color-gray-700)]">1</div>
              <h3 className="mt-3 text-sm font-bold text-[var(--color-gray-900)]">
                {isZh ? "告诉我们您的想法" : "Tell us your vision"}
              </h3>
              <p className="mt-1 text-xs text-[var(--color-gray-500)] leading-relaxed">
                {isZh
                  ? "下单时选择「设计服务」或直接联系我们，说明您的设计需求。"
                  : "Select \"Design Help\" at checkout or contact us directly with your requirements."}
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-gray-100)] text-lg font-bold text-[var(--color-gray-700)]">2</div>
              <h3 className="mt-3 text-sm font-bold text-[var(--color-gray-900)]">
                {isZh ? "我们设计，您审批" : "We design, you approve"}
              </h3>
              <p className="mt-1 text-xs text-[var(--color-gray-500)] leading-relaxed">
                {isZh
                  ? "设计师在1个工作日内发送初稿。您可以要求修改直到满意。"
                  : "Designer sends first draft within 1 business day. Request revisions until you're happy."}
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-gray-100)] text-lg font-bold text-[var(--color-gray-700)]">3</div>
              <h3 className="mt-3 text-sm font-bold text-[var(--color-gray-900)]">
                {isZh ? "印刷并送达" : "Print & deliver"}
              </h3>
              <p className="mt-1 text-xs text-[var(--color-gray-500)] leading-relaxed">
                {isZh
                  ? "设计审批后，我们立即安排生产和配送。"
                  : "Once approved, we go straight to production and shipping."}
              </p>
            </div>
          </div>
        </section>

        {/* Pricing table */}
        <section className="rounded-3xl border border-[var(--color-gray-200)] bg-white p-8 md:p-12">
          <h2 className="text-2xl font-semibold tracking-tight mb-6">
            {isZh ? "高级设计定价" : "Premium Design Pricing"}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-gray-200)] text-left text-xs font-bold uppercase tracking-wider text-[var(--color-gray-400)]">
                  <th className="pb-3 pr-4">{isZh ? "项目" : "Item"}</th>
                  <th className="pb-3 pr-4">{isZh ? "单面" : "Single Side"}</th>
                  <th className="pb-3">{isZh ? "双面" : "Double Side"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-gray-100)]">
                {PRICING.map((row) => (
                  <tr key={row.en}>
                    <td className="py-3 pr-4 font-medium text-[var(--color-gray-900)]">
                      {isZh ? row.zh : row.en}
                    </td>
                    <td className="py-3 pr-4 text-[var(--color-gray-600)]">{row.single}</td>
                    <td className="py-3 text-[var(--color-gray-600)]">{row.double}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-6 text-xs text-[var(--color-gray-400)]">
            {isZh
              ? "以上为起步价，实际价格可能因设计复杂度而异。请联系我们获取详细报价。"
              : "Prices are starting rates and may vary based on complexity. Contact us for a detailed quote."}
          </p>
        </section>

        {/* CTA */}
        <section className="rounded-3xl border border-[var(--color-gray-200)] bg-[var(--color-gray-900)] p-8 text-[#fff]">
          <h2 className="text-2xl font-semibold">
            {isZh ? "准备好开始了吗？" : "Ready to get started?"}
          </h2>
          <p className="mt-3 text-sm text-[var(--color-gray-300)]">
            {isZh
              ? "发送您的设计需求邮件或致电讨论您的项目。我们通常在 24 小时内回复。"
              : "Email us your design brief or call to discuss your project. We typically respond within 24 hours."}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="tel:+16477834728"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-900)] hover:bg-[var(--color-gray-100)] transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
              (647) 783-4728
            </a>
            <Link
              href="/contact"
              className="inline-block rounded-xl border border-white/30 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#fff] hover:border-white/70 transition-colors"
            >
              {isZh ? "联系我们" : "Contact Us"}
            </Link>
            <a
              href="mailto:info@lunarprint.ca"
              className="inline-block rounded-xl border border-white/30 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#fff] hover:border-white/70 transition-colors"
            >
              info@lunarprint.ca
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
