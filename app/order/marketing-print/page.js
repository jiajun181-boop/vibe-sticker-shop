import { Suspense } from "react";
import MarketingPrintOrderClient from "./MarketingPrintOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Marketing & Business Printing — Build Your Order | La Lunar Printing",
    description:
      "Order custom business cards, flyers, postcards, brochures, menus, posters, and more. Choose paper stock, finishing, and quantity — get instant pricing.",
    openGraph: {
      title: "Custom Marketing & Business Printing — Build Your Order",
      description:
        "Configure and order custom marketing prints. Business cards, flyers, postcards, brochures, menus, and more.",
      url: "/order/marketing-print",
    },
  };
}

export default function MarketingPrintOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <MarketingPrintOrderClient />
    </Suspense>
  );
}
