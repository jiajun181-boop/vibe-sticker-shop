import { getServerT } from "@/lib/i18n/server";
import FAQClient from "./FAQClient";
import { FAQSchema } from "@/components/JsonLd";

export const revalidate = 3600;

const FAQ_ITEMS_EN = [
  { question: "How do I place an order?", answer: "Browse our product catalog, select your product, customize size and quantity, upload your artwork, and add to cart. Complete checkout via our secure Stripe payment. You can also call us at 647-783-4728 to place an order by phone." },
  { question: "Can I order without artwork ready?", answer: "Yes! You can place your order and upload artwork later. Our team will reach out if we need files before production. We also offer design services starting at $50." },
  { question: "What is the minimum order quantity?", answer: "Most products have a minimum quantity of 1. Volume discounts are available for larger orders. Contact us for custom quantities not listed on the product page." },
  { question: "What file formats do you accept?", answer: "We accept PDF, AI, PSD, JPG, PNG, and TIF files. AI/PSD files are recommended (CS6 or earlier). All files must be in CMYK colour mode." },
  { question: "What DPI should my files be?", answer: "300 DPI or higher at actual print size. For small text and fine details, we recommend 1200 DPI." },
  { question: "Do I need to include bleed?", answer: "Yes, please include 3 mm bleed on all sides. Keep all important text and logos at least 5 mm inside the trim line." },
  { question: "How long does production take?", answer: "Most standard jobs are completed in 1\u20132 business days. Orders finalized after 6:00 PM EST are processed the following business day." },
  { question: "How long does shipping take?", answer: "We ship via UPS across Canada and the US, typically delivering within 3 business days after production is complete." },
  { question: "Is free shipping available?", answer: "Yes! Orders over $150 CAD qualify for free Canada-wide shipping." },
  { question: "What is your return policy?", answer: "All sales are final as products are custom-made. If there is a manufacturing defect, contact us within 2 days with photos and we will reprint or refund at no cost." },
  { question: "What if there's a printing error?", answer: "Contact us within 2 days at info@lunarprint.ca or WeChat: lunarprinting with 2\u20133 photos and your order number. We will reprint free of charge for confirmed production errors." },
  { question: "What payment methods do you accept?", answer: "We accept Visa, MasterCard, American Express, Debit, and E-Transfer (include your order number in the memo). All payments are processed securely." },
  { question: "Are prices in Canadian dollars?", answer: "Yes, all prices are in CAD. Ontario HST (13%) is added at checkout." },
  { question: "Can I get a custom quote?", answer: "Absolutely! Contact us for items not listed on the website. We will reply within 72 hours with a custom quote. We also offer specialty finishes like folding, die-cutting, and more." },
  { question: "What are your business hours?", answer: "Monday to Friday, 10:00 AM \u2013 6:00 PM EST. Outside business hours, contact us via the website form, WeChat, or email for next-business-day responses." },
  { question: "Can I make changes after my order is placed?", answer: "Once artwork is approved, it immediately goes into production. No changes or cancellations are possible after approval. Contact us as soon as possible if you need to make changes." },
];

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lunarprint.ca";

export async function generateMetadata() {
  return {
    title: "FAQ | La Lunar Printing Inc.",
    description: "Frequently asked questions about ordering, file requirements, shipping, and returns at La Lunar Printing.",
    alternates: { canonical: `${SITE_URL}/faq` },
  };
}

export default async function FAQPage() {
  const t = await getServerT();
  return (
    <>
      <FAQSchema items={FAQ_ITEMS_EN} />
      <main className="min-h-screen bg-gray-50 px-6 py-14 text-gray-900">
        <div className="mx-auto max-w-3xl">
          <header className="mb-10">
            <p className="text-xs uppercase tracking-[0.25em] text-gray-500">{t("faq.badge")}</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">{t("faq.title")}</h1>
            <p className="mt-4 text-sm text-gray-600">{t("faq.subtitle")}</p>
            <p className="mt-3 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
              Business Essential &mdash; We&apos;re Here to Help
            </p>
          </header>
          <FAQClient />
        </div>
      </main>
    </>
  );
}
