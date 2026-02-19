import { Suspense } from "react";
import MarketingPrintOrderClient from "@/app/order/marketing-print/MarketingPrintOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Table Tents — Order Online | Vibe Sticker Shop",
    description:
      "Order custom printed table tents for restaurants, events, and retail displays.",
    openGraph: {
      title: "Custom Table Tents — Order Online",
      description:
        "Configure and order custom table tents. Choose size, paper, coating, and quantity.",
      url: "/order/table-tents",
    },
  };
}

export default function TableTentOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <MarketingPrintOrderClient defaultType="table-tents" hideTypeSelector />
    </Suspense>
  );
}
