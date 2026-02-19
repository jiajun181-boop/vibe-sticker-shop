import { Suspense } from "react";
import MarketingPrintOrderClient from "@/app/order/marketing-print/MarketingPrintOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Notepads — Order Online | Vibe Sticker Shop",
    description:
      "Order custom printed notepads. Choose page count, size, and binding style for branded office stationery.",
    openGraph: {
      title: "Custom Notepads — Order Online",
      description:
        "Configure and order custom notepads. Choose size, pages, printing, and binding options.",
      url: "/order/notepads",
    },
  };
}

export default function NotepadOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <MarketingPrintOrderClient defaultType="notepads" hideTypeSelector />
    </Suspense>
  );
}
