import { Suspense } from "react";
import MarketingPrintOrderClient from "@/app/order/marketing-print/MarketingPrintOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Bookmarks — Order Online | Vibe Sticker Shop",
    description:
      "Order custom printed bookmarks. Premium card stock with optional lamination and tassel hole.",
    openGraph: {
      title: "Custom Bookmarks — Order Online",
      description:
        "Configure and order custom bookmarks. Choose size, paper, coating, and finishing options.",
      url: "/order/bookmarks",
    },
  };
}

export default function BookmarkOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <MarketingPrintOrderClient defaultType="bookmarks" hideTypeSelector />
    </Suspense>
  );
}
