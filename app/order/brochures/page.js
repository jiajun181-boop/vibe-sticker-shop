import { Suspense } from "react";
import MarketingPrintOrderClient from "@/app/order/marketing-print/MarketingPrintOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Brochures — Order Online | Vibe Sticker Shop",
    description:
      "Order custom brochures online. Bi-fold, tri-fold, and z-fold options on premium paper stocks with optional coating.",
    openGraph: {
      title: "Custom Brochures — Order Online",
      description:
        "Configure and order custom brochures. Choose fold type, size, paper stock, coating, and quantity.",
      url: "/order/brochures",
    },
  };
}

export default function BrochureOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <MarketingPrintOrderClient defaultType="brochures" hideTypeSelector />
    </Suspense>
  );
}
