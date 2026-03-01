import { getServerT } from "@/lib/i18n/server";
import FAQClient from "./FAQClient";
import { FAQSchema } from "@/components/JsonLd";

export const revalidate = 3600;

const FAQ_ITEMS_EN = [
  { question: "How do I place an order?", answer: "Browse our product catalog, select your product, customize size and quantity, upload your artwork, and add to cart. Complete checkout via our secure Stripe payment." },
  { question: "Can I order without artwork ready?", answer: "Yes! You can place your order and upload artwork later. Our team will reach out if we need files before production." },
  { question: "What is the minimum order quantity?", answer: "Most products have a minimum quantity of 1. Volume discounts are available for larger orders \u2014 check the tier pricing on each product page." },
  { question: "Can I get a custom quote?", answer: "Absolutely! Use our online quote form or contact us. We reply within 1 business day with a custom quote for specialty finishes, large quantities, or products not listed online." },
  { question: "What are your business hours?", answer: "Monday to Friday, 10:00 AM \u2013 6:00 PM EST. Outside business hours, contact us via the website form, WeChat, or email for next-business-day responses." },
  { question: "What is a digital proof?", answer: "A digital proof is a preview of your final print showing layout, colours, bleed, and trim. We create one for every order so you can verify everything before we print." },
  { question: "How long does the proof take?", answer: "Most proofs are ready within 1 business day. Rush proofs (same-day) are available for time-sensitive orders." },
  { question: "Can I request changes to the proof?", answer: "Yes \u2014 unlimited revisions before you approve. We don't print until you say 'Go'. Once approved, production starts immediately." },
  { question: "What file formats do you accept?", answer: "We accept PDF, AI, EPS, SVG, PNG, and JPG files. Vector formats (PDF, AI, EPS, SVG) are preferred for best quality." },
  { question: "What DPI should my files be?", answer: "We recommend 150\u2013300 DPI at actual print size. Minimum DPI varies by product \u2014 check the product specifications for details." },
  { question: "Do I need to include bleed?", answer: "For most printed products, we recommend 0.125\u2033 (3 mm) bleed on all sides. Products that require bleed will show this in their specifications." },
  { question: "Will the printed colours match my screen exactly?", answer: "CMYK printing can differ slightly from RGB screens. Our digital proof includes a colour disclaimer. For colour-critical jobs, we can produce a physical proof (additional fee)." },
  { question: "Can I use a photo from my phone?", answer: "Yes, if it's high-resolution (at least 2 MP for small prints, 8+ MP for large formats). We check every file and will let you know if quality is insufficient." },
  { question: "Can you design my artwork?", answer: "Yes! Our in-house design team can create your artwork from scratch or modify existing files. Simple text edits from $20, label/sticker design from $50, business cards from $75. See our Design Services page for full pricing." },
  { question: "What if I only have a rough idea or sketch?", answer: "No problem \u2014 send us your sketch, reference images, or a description and our designers will create a professional layout for you." },
  { question: "Do you offer logo vectorization?", answer: "Yes. If you only have a low-res logo (JPG/PNG), we can recreate it as a high-quality vector file for $25\u2013$50 depending on complexity." },
  { question: "How long does standard production take?", answer: "Most products are produced in 2\u20134 business days after proof approval. Business cards and stickers are often ready in 1\u20132 days." },
  { question: "Do you offer rush production?", answer: "Yes \u2014 24-hour rush production is available for most products at a 30% surcharge. Select 'Rush Production' during checkout." },
  { question: "Can I make changes after my order is placed?", answer: "Before proof approval, yes \u2014 contact us immediately. Once approved, production starts right away and no changes or cancellations are possible." },
  { question: "How long does shipping take?", answer: "Standard production is 2\u20134 business days. Shipping takes 2\u20135 business days depending on location. Rush production (24h) is available." },
  { question: "Is free shipping available?", answer: "Yes! Orders over $99 CAD qualify for free Canada-wide shipping. Local pickup is always free at our Toronto (Scarborough) location." },
  { question: "Can I pick up my order?", answer: "Yes! Free local pickup is available at 11 Progress Ave #21, Scarborough, ON. We'll email you when your order is ready." },
  { question: "What is your return policy?", answer: "Custom printed products are made to order and cannot be returned. If there is a manufacturing defect, we will reprint or refund at no cost." },
  { question: "What if there's a printing error?", answer: "If we made an error in production, contact us within 7 days with photos. We will reprint your order free of charge." },
  { question: "What if the final print doesn't match the approved proof?", answer: "If there's a production defect (colour mismatch, misalignment, wrong material), we reprint at no charge or issue a full refund." },
  { question: "What payment methods do you accept?", answer: "We accept Visa, Mastercard, American Express, and e-Transfer through our secure checkout." },
  { question: "Are prices in Canadian dollars?", answer: "Yes, all prices are in CAD. Ontario HST (13%) is added at checkout." },
  { question: "Do you offer volume discounts?", answer: "Yes! Every product has automatic tier pricing \u2014 the more you order, the lower the per-unit price. Wholesale pricing is available for recurring orders." },
];

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.lunarprint.ca";

export async function generateMetadata() {
  return {
    title: "FAQ — Frequently Asked Questions | La Lunar Printing",
    description: "Frequently asked questions about ordering, file requirements, shipping, and returns at La Lunar Printing.",
    alternates: { canonical: `${SITE_URL}/faq` },
  };
}

export default async function FAQPage() {
  const t = await getServerT();
  return (
    <>
      <FAQSchema items={FAQ_ITEMS_EN} />
      <main className="min-h-screen bg-[var(--color-gray-50)] px-6 py-14 text-[var(--color-gray-800)]">
        <div className="mx-auto max-w-3xl">
          <header className="mb-10">
            <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-gray-500)]">{t("faq.badge")}</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">{t("faq.title")}</h1>
            <p className="mt-4 text-sm text-[var(--color-gray-600)]">{t("faq.subtitle")}</p>
            <p className="mt-3 text-[10px] font-black uppercase tracking-[0.25em] text-[var(--color-gray-400)]">
              {t("faq.tagline")}
            </p>
          </header>
          <FAQClient />
        </div>
      </main>
    </>
  );
}
