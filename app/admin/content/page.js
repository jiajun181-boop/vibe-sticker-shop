"use client";

import { useCallback, useEffect, useState } from "react";

const TABS = [
  { id: "promo", label: "Promo Bar" },
  { id: "homepage", label: "Homepage" },
  { id: "faq", label: "FAQ" },
  { id: "seo", label: "SEO Defaults" },
];

const PROMO_DEFAULTS = {
  textEn: "Free Shipping on Your First Order | Use Code: FREESHIP",
  textZh: "首单免运费 | 使用优惠码：FREESHIP",
  link: "",
  bgColor: "#111827",
  active: true,
};

const HOMEPAGE_DEFAULTS = {
  heroTitleEn: "Custom Printing & Vehicle Graphics",
  heroTitleZh: "定制印刷与车辆图形",
  heroSubtitleEn: "Professional quality, fast turnaround in Toronto & the GTA.",
  heroSubtitleZh: "安大略省专业定制印刷服务。",
  ctaText: "Shop Now",
  ctaLink: "/shop",
  featuredProductSlugs: [],
};

const SEO_DEFAULTS = {
  titleSuffix: "La Lunar Printing Inc.",
  defaultDescription: "Professional custom printing for fleet compliance, vehicle graphics, and business signage in Ontario, Canada.",
  ogImage: "/og-image.png",
  googleVerification: "",
};

export default function ContentCMSPage() {
  const [tab, setTab] = useState("promo");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // CMS data
  const [promo, setPromo] = useState(PROMO_DEFAULTS);
  const [homepage, setHomepage] = useState(HOMEPAGE_DEFAULTS);
  const [faq, setFaq] = useState([]);
  const [seo, setSeo] = useState(SEO_DEFAULTS);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data["cms.promo"]) setPromo({ ...PROMO_DEFAULTS, ...data["cms.promo"] });
      if (data["cms.homepage"]) setHomepage({ ...HOMEPAGE_DEFAULTS, ...data["cms.homepage"] });
      if (data["cms.faq"]) setFaq(data["cms.faq"]);
      if (data["cms.seo"]) setSeo({ ...SEO_DEFAULTS, ...data["cms.seo"] });
    } catch {
      console.error("Failed to load CMS settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function save(key, value) {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      if (!res.ok) throw new Error();
      setMessage({ type: "success", text: "Saved successfully." });
    } catch {
      setMessage({ type: "error", text: "Failed to save. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex h-48 items-center justify-center text-sm text-[#999]">Loading content settings...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-black">Content Management</h1>

      {message && (
        <div className={`rounded-[3px] px-4 py-3 text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-[3px] bg-[#f5f5f5] p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => { setTab(t.id); setMessage(null); }}
            className={`flex-1 rounded-[3px] px-3 py-2 text-xs font-semibold transition-colors ${tab === t.id ? "bg-white text-black shadow-sm" : "text-[#999] hover:text-black"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "promo" && (
        <PromoTab promo={promo} setPromo={setPromo} onSave={() => save("cms.promo", promo)} saving={saving} />
      )}
      {tab === "homepage" && (
        <HomepageTab homepage={homepage} setHomepage={setHomepage} onSave={() => save("cms.homepage", homepage)} saving={saving} />
      )}
      {tab === "faq" && (
        <FAQTab faq={faq} setFaq={setFaq} onSave={() => save("cms.faq", faq)} saving={saving} />
      )}
      {tab === "seo" && (
        <SEOTab seo={seo} setSeo={setSeo} onSave={() => save("cms.seo", seo)} saving={saving} />
      )}
    </div>
  );
}

/* ─── Promo Bar Tab ─── */
function PromoTab({ promo, setPromo, onSave, saving }) {
  const update = (k, v) => setPromo((p) => ({ ...p, [k]: v }));
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="space-y-4">
      <Card title="Promo Bar Configuration">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Toggle checked={promo.active} onChange={(v) => update("active", v)} />
            <span className="text-sm text-black">Promo bar is {promo.active ? "visible" : "hidden"}</span>
          </div>
          <Field label="English Text" value={promo.textEn} onChange={(v) => update("textEn", v)} placeholder="Free Shipping on Your First Order..." />
          <Field label="Chinese Text" value={promo.textZh} onChange={(v) => update("textZh", v)} placeholder="首单免运费..." />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Link URL (optional)" value={promo.link} onChange={(v) => update("link", v)} placeholder="/shop" />
            <div>
              <label className="mb-1 block text-xs font-medium text-[#666]">Background Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={promo.bgColor} onChange={(e) => update("bgColor", e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-[#d0d0d0]" />
                <input type="text" value={promo.bgColor} onChange={(e) => update("bgColor", e.target.value)} className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black" />
              </div>
            </div>
          </div>
          {/* Preview */}
          <div>
            <label className="mb-1 block text-xs font-medium text-[#666]">Preview</label>
            <div className="rounded-[3px] px-4 py-2 text-sm text-white" style={{ backgroundColor: promo.bgColor }}>
              {promo.textEn || "Promo text will appear here"}
            </div>
          </div>
        </div>
      </Card>
      <SaveButton saving={saving} />
    </form>
  );
}

/* ─── Homepage Tab ─── */
function HomepageTab({ homepage, setHomepage, onSave, saving }) {
  const update = (k, v) => setHomepage((p) => ({ ...p, [k]: v }));
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="space-y-4">
      <Card title="Hero Section">
        <div className="space-y-4">
          <Field label="Hero Title (EN)" value={homepage.heroTitleEn} onChange={(v) => update("heroTitleEn", v)} />
          <Field label="Hero Title (ZH)" value={homepage.heroTitleZh} onChange={(v) => update("heroTitleZh", v)} />
          <Field label="Hero Subtitle (EN)" value={homepage.heroSubtitleEn} onChange={(v) => update("heroSubtitleEn", v)} />
          <Field label="Hero Subtitle (ZH)" value={homepage.heroSubtitleZh} onChange={(v) => update("heroSubtitleZh", v)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="CTA Button Text" value={homepage.ctaText} onChange={(v) => update("ctaText", v)} />
            <Field label="CTA Button Link" value={homepage.ctaLink} onChange={(v) => update("ctaLink", v)} />
          </div>
        </div>
      </Card>
      <Card title="Featured Products">
        <div className="space-y-2">
          <p className="text-xs text-[#999]">Enter product slugs, one per line. These will be highlighted on the homepage.</p>
          <textarea
            rows={5}
            value={(homepage.featuredProductSlugs || []).join("\n")}
            onChange={(e) => update("featuredProductSlugs", e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))}
            placeholder={"vinyl-banners\nflyers\nbusiness-cards-standard"}
            className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 font-mono text-sm outline-none focus:border-black"
          />
        </div>
      </Card>
      <SaveButton saving={saving} />
    </form>
  );
}

/* ─── FAQ Tab ─── */
function FAQTab({ faq, setFaq, onSave, saving }) {
  function addItem() {
    setFaq((prev) => [...prev, { question: "", answer: "", questionZh: "", answerZh: "" }]);
  }
  function updateItem(i, field, value) {
    setFaq((prev) => prev.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)));
  }
  function removeItem(i) {
    setFaq((prev) => prev.filter((_, idx) => idx !== i));
  }
  function moveItem(i, dir) {
    setFaq((prev) => {
      const arr = [...prev];
      const target = i + dir;
      if (target < 0 || target >= arr.length) return arr;
      [arr[i], arr[target]] = [arr[target], arr[i]];
      return arr;
    });
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="space-y-4">
      <Card title={`FAQ Items (${faq.length})`}>
        <div className="space-y-4">
          {faq.length === 0 && (
            <p className="py-4 text-center text-sm text-[#999]">No FAQ items yet. Click &quot;Add Item&quot; to start.</p>
          )}
          {faq.map((item, i) => (
            <div key={i} className="rounded-[3px] border border-[#e0e0e0] bg-[#fafafa] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#999]">#{i + 1}</span>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => moveItem(i, -1)} disabled={i === 0} className="rounded p-1 text-[#999] hover:text-black disabled:opacity-30" title="Move up">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>
                  </button>
                  <button type="button" onClick={() => moveItem(i, 1)} disabled={i === faq.length - 1} className="rounded p-1 text-[#999] hover:text-black disabled:opacity-30" title="Move down">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                  </button>
                  <button type="button" onClick={() => removeItem(i)} className="rounded p-1 text-red-400 hover:text-red-600" title="Remove">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
              <Field label="Question (EN)" value={item.question} onChange={(v) => updateItem(i, "question", v)} />
              <div>
                <label className="mb-1 block text-xs font-medium text-[#666]">Answer (EN)</label>
                <textarea rows={2} value={item.answer} onChange={(e) => updateItem(i, "answer", e.target.value)} className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black" />
              </div>
              <Field label="Question (ZH)" value={item.questionZh} onChange={(v) => updateItem(i, "questionZh", v)} />
              <div>
                <label className="mb-1 block text-xs font-medium text-[#666]">Answer (ZH)</label>
                <textarea rows={2} value={item.answerZh} onChange={(e) => updateItem(i, "answerZh", e.target.value)} className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black" />
              </div>
            </div>
          ))}
          <button type="button" onClick={addItem} className="w-full rounded-[3px] border-2 border-dashed border-[#d0d0d0] py-3 text-sm font-medium text-[#999] transition-colors hover:border-[#999] hover:text-black">
            + Add FAQ Item
          </button>
        </div>
      </Card>
      <SaveButton saving={saving} />
    </form>
  );
}

/* ─── SEO Defaults Tab ─── */
function SEOTab({ seo, setSeo, onSave, saving }) {
  const update = (k, v) => setSeo((p) => ({ ...p, [k]: v }));
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="space-y-4">
      <Card title="Global SEO Settings">
        <div className="space-y-4">
          <Field label="Title Suffix (appended to all page titles)" value={seo.titleSuffix} onChange={(v) => update("titleSuffix", v)} placeholder="La Lunar Printing Inc." />
          <div>
            <label className="mb-1 block text-xs font-medium text-[#666]">Default Meta Description</label>
            <textarea rows={3} value={seo.defaultDescription} onChange={(e) => update("defaultDescription", e.target.value)} className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black" />
          </div>
          <Field label="Default OG Image Path" value={seo.ogImage} onChange={(v) => update("ogImage", v)} placeholder="/og-image.png" />
          <Field label="Google Site Verification" value={seo.googleVerification} onChange={(v) => update("googleVerification", v)} placeholder="google-site-verification=..." />
        </div>
      </Card>
      <Card title="Robots.txt Hints">
        <p className="text-xs text-[#999]">To edit robots.txt and sitemap.xml, modify the files in <code className="rounded bg-[#f5f5f5] px-1 py-0.5">app/robots.txt/route.js</code> and <code className="rounded bg-[#f5f5f5] px-1 py-0.5">app/sitemap.xml/route.js</code>.</p>
      </Card>
      <SaveButton saving={saving} />
    </form>
  );
}

/* ─── Shared Components ─── */

function Card({ title, children }) {
  return (
    <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-black">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-[#666]">{label}</label>
      <input type={type} value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black" />
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <label className="relative inline-flex cursor-pointer items-center">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <div className="h-5 w-9 rounded-full bg-[#d0d0d0] after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:bg-black peer-checked:after:translate-x-full" />
    </label>
  );
}

function SaveButton({ saving }) {
  return (
    <div className="flex justify-end">
      <button type="submit" disabled={saving} className="rounded-[3px] bg-black px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#222] disabled:opacity-50">
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}
