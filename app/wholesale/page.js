"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/i18n";

const BENEFITS = [
  { icon: "💰", titleEn: "Volume Pricing", titleZh: "批量优惠", descEn: "Tiered discounts on all products — the more you order, the more you save.", descZh: "所有产品阶梯折扣——订得越多，省得越多。" },
  { icon: "⚡", titleEn: "Priority Production", titleZh: "优先生产", descEn: "Partner orders are queued first with dedicated production slots.", descZh: "合作订单优先排产，专属生产线。" },
  { icon: "📦", titleEn: "Blind Ship & Drop Ship", titleZh: "Blind Ship & 代发", descEn: "We blind ship directly to your customers — your branding, no trace of ours. Plain or custom packaging available.", descZh: "直接寄给您的客户，不显示我们的信息。支持素包装或定制品牌包装。" },
  { icon: "🎨", titleEn: "Free Design Support", titleZh: "免费设计支持", descEn: "Our in-house design team helps adapt your artwork at no extra charge.", descZh: "内部设计团队免费协助调整您的设计稿。" },
  { icon: "📞", titleEn: "Dedicated Account Manager", titleZh: "专属客户经理", descEn: "A single point of contact for all your orders, questions, and rush jobs.", descZh: "一位专属联系人处理您的所有订单、问题和加急需求。" },
  { icon: "🌐", titleEn: "Bilingual Service", titleZh: "中英双语服务", descEn: "Full support in English and Chinese — we speak your language.", descZh: "提供完整的中英文服务——沟通无障碍。" },
  { icon: "🧾", titleEn: "Net 30 Payment Terms", titleZh: "Net 30 账期", descEn: "Approved partners enjoy flexible payment terms — no upfront payment required.", descZh: "审核通过的合作伙伴可享灵活账期，无需预付全款。" },
  { icon: "🔄", titleEn: "Reorder in Seconds", titleZh: "一键翻单", descEn: "Save your specs and artwork — reorders are instant with no re-setup fees.", descZh: "保存规格和设计稿，翻单秒下，无重复设置费。" },
  { icon: "🆓", titleEn: "Free Samples & Proofs", titleZh: "免费样品 & 校样", descEn: "Request material samples and digital proofs before committing to a large run.", descZh: "大批量下单前可申请材料样品和电子校样。" },
];

const INDUSTRIES_LIST = [
  { en: "Sign Shops & Print Resellers", zh: "广告招牌店 & 印刷分销商" },
  { en: "Fleet & Logistics", zh: "车队 & 物流" },
  { en: "Marketing & Event Agencies", zh: "营销 & 活动策划" },
  { en: "Construction & Safety", zh: "建筑 & 安全" },
  { en: "Retail Chains & Franchises", zh: "连锁零售 & 加盟品牌" },
  { en: "Property Management", zh: "物业管理" },
  { en: "Restaurants & Food Service", zh: "餐饮 & 食品服务" },
  { en: "Auto Dealers & Car Washes", zh: "汽车经销商 & 洗车行" },
  { en: "Schools & Education", zh: "学校 & 教育机构" },
  { en: "Healthcare & Clinics", zh: "医疗 & 诊所" },
  { en: "Government & Municipal", zh: "政府 & 市政" },
  { en: "Non-Profits & Churches", zh: "非盈利组织 & 教会" },
  { en: "Trades & Contractors", zh: "装修 & 承包商" },
  { en: "Gyms & Fitness Studios", zh: "健身房 & 运动工作室" },
];

const PRODUCT_INTERESTS = [
  { key: "stickers", en: "Stickers & Labels", zh: "贴纸 & 标签" },
  { key: "vehicle", en: "Vehicle Wraps & Graphics", zh: "车身贴膜 & 车贴" },
  { key: "banners", en: "Banners & Displays", zh: "横幅 & 展架" },
  { key: "safety", en: "Safety & Compliance Decals", zh: "安全 & 合规标识" },
  { key: "signs", en: "Signs & Rigid Boards", zh: "标牌 & 硬板" },
  { key: "floor", en: "Floor Graphics & Films", zh: "地贴 & 贴膜" },
  { key: "marketing", en: "Business Cards & Flyers", zh: "名片 & 传单" },
  { key: "other", en: "Other / Custom", zh: "其他 / 定制" },
];

const INDUSTRY_OPTIONS = [
  { value: "sign-shop", en: "Sign Shop / Print Reseller", zh: "广告招牌店 / 印刷分销商" },
  { value: "fleet", en: "Fleet / Logistics / Transportation", zh: "车队 / 物流 / 运输" },
  { value: "marketing", en: "Marketing / Event Agency", zh: "营销 / 活动策划公司" },
  { value: "construction", en: "Construction / Safety", zh: "建筑 / 安全" },
  { value: "retail", en: "Retail / Franchise", zh: "零售 / 加盟" },
  { value: "property", en: "Property Management / Real Estate", zh: "物业管理 / 房地产" },
  { value: "restaurant", en: "Restaurant / Food Service", zh: "餐饮 / 食品服务" },
  { value: "auto", en: "Auto Dealer / Car Wash", zh: "汽车经销商 / 洗车行" },
  { value: "education", en: "School / Education", zh: "学校 / 教育机构" },
  { value: "healthcare", en: "Healthcare / Clinic", zh: "医疗 / 诊所" },
  { value: "government", en: "Government / Municipal", zh: "政府 / 市政" },
  { value: "nonprofit", en: "Non-Profit / Church", zh: "非盈利组织 / 教会" },
  { value: "trades", en: "Trades / Contractor", zh: "装修 / 承包商" },
  { value: "fitness", en: "Gym / Fitness Studio", zh: "健身房 / 运动工作室" },
  { value: "other", en: "Other", zh: "其他" },
];

const REGION_OPTIONS = [
  { value: "gta", en: "Greater Toronto Area (GTA)", zh: "大多伦多地区 (GTA)" },
  { value: "ontario", en: "Ontario (outside GTA)", zh: "安大略省（GTA 以外）" },
  { value: "quebec", en: "Quebec", zh: "魁北克" },
  { value: "bc", en: "British Columbia", zh: "不列颠哥伦比亚" },
  { value: "alberta", en: "Alberta", zh: "阿尔伯塔" },
  { value: "prairies", en: "Manitoba / Saskatchewan", zh: "曼尼托巴 / 萨斯喀彻温" },
  { value: "atlantic", en: "Atlantic Canada", zh: "大西洋省份" },
  { value: "canada-wide", en: "Canada-wide (multiple locations)", zh: "全加拿大（多个地点）" },
  { value: "usa", en: "United States", zh: "美国" },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="py-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <span className="text-sm font-medium text-[var(--color-gray-800)]">{q}</span>
        <svg
          className={`h-4 w-4 shrink-0 text-[var(--color-gray-400)] transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <p className="mt-2.5 text-xs leading-relaxed text-[var(--color-gray-500)]">{a}</p>
      )}
    </div>
  );
}

export default function WholesalePage() {
  const locale = useLocale();
  const isZh = locale === "zh";

  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    industry: "",
    region: "",
    volume: "",
    message: "",
  });
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | sending | done | error

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleProduct(key) {
    setProducts((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    setStatus("sending");

    const productLabels = products
      .map((k) => {
        const p = PRODUCT_INTERESTS.find((pi) => pi.key === k);
        return p ? p.en : k;
      })
      .join(", ");

    const industryLabel = INDUSTRY_OPTIONS.find((i) => i.value === form.industry)?.en || form.industry;
    const regionLabel = REGION_OPTIONS.find((r) => r.value === form.region)?.en || form.region;

    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          message: [
            `[Wholesale Inquiry]`,
            `Company: ${form.company || "N/A"}`,
            `Phone: ${form.phone || "N/A"}`,
            `Industry: ${industryLabel || "N/A"}`,
            `Delivery Region: ${regionLabel || "N/A"}`,
            `Products of Interest: ${productLabels || "N/A"}`,
            `Est. Monthly Volume: ${form.volume || "N/A"}`,
            ``,
            form.message || "(No additional message)",
          ].join("\n"),
        }),
      });
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  const inputCls = "w-full rounded-xl border border-[var(--color-gray-300)] bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--color-moon-gold)]";

  return (
    <main className="min-h-screen bg-[var(--color-gray-50)] text-[var(--color-gray-800)]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[var(--color-gray-900)] px-6 py-20 text-white sm:py-28">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(196,147,64,0.3),transparent_60%)]" />
        </div>
        <div className="relative mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-moon-gold)]">
            {isZh ? "批量采购合作" : "Wholesale & Partnership"}
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
            {isZh ? "与我们合作，共同成长" : "Let\u2019s Grow Together"}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
            {isZh
              ? "无论您是广告公司、车队运营商还是印刷分销商，我们提供有竞争力的批量定价、专属服务和可靠的交付能力。"
              : "Whether you\u2019re a sign shop, fleet operator, or print reseller, we offer competitive volume pricing, dedicated service, and reliable delivery across Canada."}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#inquiry"
              className="rounded-xl bg-[var(--color-moon-gold)] px-8 py-3 text-sm font-semibold text-white transition-colors hover:brightness-110"
            >
              {isZh ? "提交合作咨询" : "Submit an Inquiry"}
            </a>
            <a
              href="tel:+16477834728"
              className="rounded-xl border border-white/30 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              {isZh ? "电话联系" : "Call Us"}
            </a>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
            {isZh ? "合作伙伴专享权益" : "Partner Benefits"}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm text-[var(--color-gray-500)]">
            {isZh ? "成为合作伙伴后，您将享有以下专属服务" : "Everything you get when you partner with La Lunar Printing"}
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b) => (
              <div
                key={b.titleEn}
                className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-6 transition-shadow hover:shadow-md"
              >
                <span className="text-2xl">{b.icon}</span>
                <h3 className="mt-3 text-sm font-semibold">{isZh ? b.titleZh : b.titleEn}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-gray-500)]">
                  {isZh ? b.descZh : b.descEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="border-y border-[var(--color-gray-200)] bg-white px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {isZh ? "服务行业" : "Industries We Serve"}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-[var(--color-gray-500)]">
            {isZh ? "我们的批量客户遍布以下行业" : "Our wholesale clients span a wide range of sectors"}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {INDUSTRIES_LIST.map((ind) => (
              <span
                key={ind.en}
                className="rounded-xl border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] px-5 py-2 text-xs font-medium text-[var(--color-gray-700)]"
              >
                {isZh ? ind.zh : ind.en}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
            {isZh ? "合作流程" : "How It Works"}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-center text-sm text-[var(--color-gray-500)]">
            {isZh ? "三步开始合作，简单快速" : "Get started in three simple steps"}
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              { step: "01", titleEn: "Submit an Inquiry", titleZh: "提交咨询", descEn: "Fill out the form below or give us a call. Tell us about your business and what you need.", descZh: "填写下方表单或致电联系我们，告诉我们您的业务和需求。" },
              { step: "02", titleEn: "Get a Custom Quote", titleZh: "获取专属报价", descEn: "We\u2019ll review your needs and send a tailored quote with volume pricing within 1 business day.", descZh: "我们会在 1 个工作日内审核需求，发送包含批量定价的专属报价。" },
              { step: "03", titleEn: "Start Ordering", titleZh: "开始下单", descEn: "Once approved, enjoy partner pricing, priority production, and a dedicated account manager.", descZh: "审核通过后，即享合作伙伴定价、优先生产和专属客户经理服务。" },
            ].map((s) => (
              <div key={s.step} className="relative rounded-2xl border border-[var(--color-gray-200)] bg-white p-6">
                <span className="text-3xl font-bold text-[var(--color-gray-200)]">{s.step}</span>
                <h3 className="mt-2 text-sm font-semibold">{isZh ? s.titleZh : s.titleEn}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-gray-500)]">
                  {isZh ? s.descZh : s.descEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-y border-[var(--color-gray-200)] bg-white px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
            {isZh ? "常见问题" : "Frequently Asked Questions"}
          </h2>
          <div className="mt-10 divide-y divide-[var(--color-gray-200)]">
            {[
              { qEn: "Is there a minimum order quantity (MOQ)?", qZh: "有最低起订量吗？", aEn: "It depends on the product. Most items have no MOQ for partners, but some specialty products may require a minimum of 50\u2013100 units. We\u2019ll clarify this in your quote.", aZh: "取决于产品类型。大部分产品对合作伙伴无最低起订量，但部分特殊产品可能需要 50\u2013100 件起订。报价时会具体说明。" },
              { qEn: "What are your typical turnaround times?", qZh: "一般交期是多久？", aEn: "Standard production is 3\u20135 business days. Rush orders (1\u20132 days) are available for most products at a small surcharge. Large bulk orders may need 5\u20137 days.", aZh: "标准生产周期 3\u20135 个工作日。大部分产品支持加急（1\u20132 天），需少量加急费。大批量订单可能需要 5\u20137 天。" },
              { qEn: "Do you offer Net 30 payment terms?", qZh: "可以月结吗？", aEn: "Yes. After a brief credit review, approved partners get Net 30 terms. New partners start with prepayment for the first 2\u20133 orders.", aZh: "可以。经过简单信用审核后，合作伙伴可享 Net 30 账期。新合作伙伴前 2\u20133 单需预付。" },
              { qEn: "Can you ship across Canada and to the US?", qZh: "可以配送到加拿大全境和美国吗？", aEn: "Yes. We ship Canada-wide and to the continental US. GTA partners can also arrange local pickup at our Scarborough facility.", aZh: "可以。我们配送全加拿大和美国本土。GTA 地区合作伙伴还可到我们士嘉堡工厂自提。" },
              { qEn: "Do you offer blind shipping / drop shipping?", qZh: "可以 blind ship / 代发吗？", aEn: "Yes. We blind ship to your end customers with no mention of La Lunar Printing on the package, packing slip, or invoice. Plain or custom-branded packaging available.", aZh: "可以。我们代发给您的终端客户，包裹、装箱单和发票上均不会出现 La Lunar Printing 信息。支持素包装或定制品牌包装。" },
              { qEn: "What file formats do you accept?", qZh: "接受什么文件格式？", aEn: "We accept PDF, AI, EPS, PSD, PNG (300dpi+), and SVG. Our design team can also help convert or adapt your files for free.", aZh: "我们接受 PDF、AI、EPS、PSD、PNG（300dpi+）和 SVG。我们的设计团队也可以免费帮您转换或调整文件。" },
            ].map((faq, idx) => (
              <FaqItem key={idx} q={isZh ? faq.qZh : faq.qEn} a={isZh ? faq.aZh : faq.aEn} />
            ))}
          </div>
        </div>
      </section>

      {/* Inquiry Form */}
      <section id="inquiry" className="px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
            {isZh ? "提交合作咨询" : "Get in Touch"}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-center text-sm text-[var(--color-gray-500)]">
            {isZh
              ? "填写以下表单，我们将在 1 个工作日内回复您。"
              : "Fill out the form below and we\u2019ll get back to you within 1 business day."}
          </p>

          {status === "done" ? (
            <div className="mt-10 rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
              <p className="text-lg font-semibold text-emerald-800">
                {isZh ? "感谢您的咨询！" : "Thank you for your inquiry!"}
              </p>
              <p className="mt-2 text-sm text-emerald-700">
                {isZh
                  ? "我们已收到您的信息，将在 1 个工作日内与您联系。"
                  : "We\u2019ve received your message and will be in touch within 1 business day."}
              </p>
              <Link
                href="/shop"
                className="mt-6 inline-block rounded-xl bg-[var(--color-gray-900)] px-6 py-2.5 text-xs font-semibold text-white hover:bg-black"
              >
                {isZh ? "浏览产品" : "Browse Products"}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-10 space-y-5">
              {/* Contact info */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--color-gray-600)]">
                    {isZh ? "姓名" : "Your Name"} *
                  </label>
                  <input type="text" required value={form.name} onChange={(e) => update("name", e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--color-gray-600)]">
                    {isZh ? "邮箱" : "Email"} *
                  </label>
                  <input type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--color-gray-600)]">
                    {isZh ? "公司名称" : "Company Name"}
                  </label>
                  <input type="text" value={form.company} onChange={(e) => update("company", e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--color-gray-600)]">
                    {isZh ? "电话" : "Phone"}
                  </label>
                  <input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} className={inputCls} />
                </div>
              </div>

              {/* Industry */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--color-gray-600)]">
                  {isZh ? "您的行业" : "Your Industry"}
                </label>
                <select value={form.industry} onChange={(e) => update("industry", e.target.value)} className={inputCls}>
                  <option value="">{isZh ? "请选择行业" : "Select your industry"}</option>
                  {INDUSTRY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{isZh ? opt.zh : opt.en}</option>
                  ))}
                </select>
              </div>

              {/* Delivery region */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--color-gray-600)]">
                  {isZh ? "配送地区" : "Delivery Region"}
                </label>
                <select value={form.region} onChange={(e) => update("region", e.target.value)} className={inputCls}>
                  <option value="">{isZh ? "请选择地区" : "Select delivery region"}</option>
                  {REGION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{isZh ? opt.zh : opt.en}</option>
                  ))}
                </select>
              </div>

              {/* Products of interest — checkboxes */}
              <div>
                <label className="mb-2 block text-xs font-medium text-[var(--color-gray-600)]">
                  {isZh ? "感兴趣的产品（可多选）" : "Products of Interest (select all that apply)"}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PRODUCT_INTERESTS.map((p) => (
                    <label
                      key={p.key}
                      className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-xs transition-colors ${
                        products.includes(p.key)
                          ? "border-[var(--color-moon-gold)] bg-[var(--color-moon-gold)]/5 text-[var(--color-gray-900)] font-medium"
                          : "border-[var(--color-gray-200)] bg-white text-[var(--color-gray-600)] hover:border-[var(--color-gray-400)]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={products.includes(p.key)}
                        onChange={() => toggleProduct(p.key)}
                        className="sr-only"
                      />
                      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${
                        products.includes(p.key)
                          ? "border-[var(--color-moon-gold)] bg-[var(--color-moon-gold)] text-white"
                          : "border-[var(--color-gray-300)] bg-white"
                      }`}>
                        {products.includes(p.key) && "✓"}
                      </span>
                      {isZh ? p.zh : p.en}
                    </label>
                  ))}
                </div>
              </div>

              {/* Volume */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--color-gray-600)]">
                  {isZh ? "预计月度采购量" : "Estimated Monthly Volume"}
                </label>
                <select value={form.volume} onChange={(e) => update("volume", e.target.value)} className={inputCls}>
                  <option value="">{isZh ? "请选择" : "Select an option"}</option>
                  <option value="< $500/mo">{isZh ? "少于 $500/月" : "Under $500/month"}</option>
                  <option value="$500-$2000/mo">$500 – $2,000/{isZh ? "月" : "month"}</option>
                  <option value="$2000-$5000/mo">$2,000 – $5,000/{isZh ? "月" : "month"}</option>
                  <option value="$5000+/mo">$5,000+/{isZh ? "月" : "month"}</option>
                </select>
              </div>

              {/* Message */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--color-gray-600)]">
                  {isZh ? "告诉我们更多关于您的需求" : "Tell us about your needs"}
                </label>
                <textarea
                  rows={4}
                  value={form.message}
                  onChange={(e) => update("message", e.target.value)}
                  placeholder={isZh ? "您需要什么产品？预计数量？有没有特殊要求？" : "What products do you need? Approximate quantities? Any special requirements?"}
                  className={inputCls}
                />
              </div>

              {status === "error" && (
                <p className="text-xs text-red-600">
                  {isZh ? "提交失败，请稍后重试或直接联系我们。" : "Something went wrong. Please try again or contact us directly."}
                </p>
              )}

              <button
                type="submit"
                disabled={status === "sending"}
                className="w-full rounded-xl bg-[var(--color-gray-900)] py-3.5 text-sm font-semibold text-white transition-colors hover:bg-black disabled:opacity-50"
              >
                {status === "sending"
                  ? (isZh ? "提交中..." : "Sending...")
                  : (isZh ? "提交咨询" : "Submit Inquiry")}
              </button>

              <p className="text-center text-[11px] text-[var(--color-gray-400)]">
                {isZh
                  ? "或直接联系我们：info@lunarprint.ca · 647-783-4728 (EN) · 647-886-9288 (中文)"
                  : "Or reach us directly: info@lunarprint.ca \u00b7 647-783-4728 (EN) \u00b7 647-886-9288 (\u4e2d\u6587)"}
              </p>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
