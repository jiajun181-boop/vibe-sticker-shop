import { Suspense } from "react";
import MarketingPrintOrderClient from "@/app/order/marketing-print/MarketingPrintOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Postcards — Order Online | Vibe Sticker Shop",
    description:
      "Order custom postcards online. Standard, medium, large, and EDDM sizes on premium card stock with coating and rounded corner options.",
    openGraph: {
      title: "Custom Postcards — Order Online",
      description:
        "Configure and order custom postcards. Choose size, paper, coating, corners, and quantity.",
      url: "/order/postcards",
    },
  };
}

export default function PostcardOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <MarketingPrintOrderClient defaultType="postcards" hideTypeSelector />
    </Suspense>
  );
}
