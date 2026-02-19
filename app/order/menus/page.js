import { Suspense } from "react";
import MarketingPrintOrderClient from "@/app/order/marketing-print/MarketingPrintOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Menus — Order Online | Vibe Sticker Shop",
    description:
      "Order custom restaurant menus online. Flat, folded, laminated, and takeout insert options on premium paper stocks.",
    openGraph: {
      title: "Custom Menus — Order Online",
      description:
        "Configure and order custom menus. Choose style, size, paper stock, lamination, and quantity.",
      url: "/order/menus",
    },
  };
}

export default function MenuOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <MarketingPrintOrderClient defaultType="menus" hideTypeSelector />
    </Suspense>
  );
}
