import { Suspense } from "react";
import MarketingPrintOrderClient from "@/app/order/marketing-print/MarketingPrintOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Waivers & Releases — Order Online | Vibe Sticker Shop",
    description:
      "Order custom printed waivers and release forms with optional numbering and binding.",
    openGraph: {
      title: "Custom Waivers & Releases — Order Online",
      description:
        "Configure and order custom waivers. Choose size, paper, binding, and quantity.",
      url: "/order/waivers-releases",
    },
  };
}

export default function WaiverOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <MarketingPrintOrderClient defaultType="waivers-releases" hideTypeSelector />
    </Suspense>
  );
}
