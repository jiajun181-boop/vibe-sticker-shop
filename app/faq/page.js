import { getServerT } from "@/lib/i18n/server";
import FAQClient from "./FAQClient";
import { FAQSchema } from "@/components/JsonLd";

export const dynamic = "force-dynamic";

const FAQ_ITEMS_EN = [
  { question: "How do I place an order?", answer: "Browse our product catalog, select your product, customize size and quantity, upload your artwork, and add to cart. Complete checkout via our secure Stripe payment." },
  { question: "Can I order without artwork ready?", answer: "Yes! You can place your order and upload artwork later. Our team will reach out if we need files before production." },
  { question: "What is the minimum order quantity?", answer: "Most products have a minimum quantity of 1. Volume discounts are available for larger orders." },
  { question: "What file formats do you accept?", answer: "We accept PDF, AI, EPS, SVG, PNG, and JPG files. Vector formats are preferred for best quality." },
  { question: "What DPI should my files be?", answer: "We recommend 150-300 DPI at actual print size." },
  { question: "Do I need to include bleed?", answer: "For most printed products, we recommend 0.125\" bleed on all sides." },
  { question: "How long does shipping take?", answer: "Standard production is 2-4 business days. Shipping takes 2-5 business days depending on location." },
  { question: "Is free shipping available?", answer: "Yes! Orders over $150 CAD qualify for free Canada-wide shipping." },
  { question: "What is your return policy?", answer: "Custom printed products are made to order. If there is a manufacturing defect, we will reprint or refund at no cost." },
  { question: "What if there's a printing error?", answer: "Contact us within 7 days with photos. We will reprint your order free of charge." },
  { question: "What payment methods do you accept?", answer: "We accept Visa, Mastercard, American Express, and PayPal through our secure Stripe checkout." },
  { question: "Are prices in Canadian dollars?", answer: "Yes, all prices are in CAD. Ontario HST (13%) is added at checkout." },
];

export async function generateMetadata() {
  return {
    title: "FAQ - La Lunar Printing Inc.",
    description: "Frequently asked questions about ordering, file requirements, shipping, and returns.",
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
          </header>
          <FAQClient />
        </div>
      </main>
    </>
  );
}
