import { Suspense } from "react";
import MarketingPrintOrderClient from "@/app/order/marketing-print/MarketingPrintOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Rack Cards — Order Online | Vibe Sticker Shop",
    description:
      "Order custom rack cards for brochure holders and displays. Full color on premium card stock.",
    openGraph: {
      title: "Custom Rack Cards — Order Online",
      description:
        "Configure and order custom rack cards. Choose paper, coating, and quantity.",
      url: "/order/rack-cards",
    },
  };
}

export default function RackCardOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <MarketingPrintOrderClient defaultType="rack-cards" hideTypeSelector />
    </Suspense>
  );
}
