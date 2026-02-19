import { Suspense } from "react";
import MarketingPrintOrderClient from "@/app/order/marketing-print/MarketingPrintOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Greeting Cards — Order Online | Vibe Sticker Shop",
    description:
      "Order custom greeting cards with matching envelopes. Premium paper, full color, scored and folded.",
    openGraph: {
      title: "Custom Greeting Cards — Order Online",
      description:
        "Configure and order custom greeting cards. Choose size, paper, fold style, and envelope options.",
      url: "/order/greeting-cards",
    },
  };
}

export default function GreetingCardOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <MarketingPrintOrderClient defaultType="greeting-cards" hideTypeSelector />
    </Suspense>
  );
}
