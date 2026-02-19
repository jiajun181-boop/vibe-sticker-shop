import { Suspense } from "react";
import MarketingPrintOrderClient from "@/app/order/marketing-print/MarketingPrintOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Coupons — Order Online | Vibe Sticker Shop",
    description:
      "Order custom printed coupons and vouchers with optional perforation and sequential numbering.",
    openGraph: {
      title: "Custom Coupons — Order Online",
      description:
        "Configure and order custom coupons. Choose size, perforation, numbering, and quantity.",
      url: "/order/coupons",
    },
  };
}

export default function CouponOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <MarketingPrintOrderClient defaultType="coupons" hideTypeSelector />
    </Suspense>
  );
}
