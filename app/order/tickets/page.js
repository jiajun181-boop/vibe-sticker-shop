import { Suspense } from "react";
import MarketingPrintOrderClient from "@/app/order/marketing-print/MarketingPrintOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Tickets — Order Online | Vibe Sticker Shop",
    description:
      "Order custom event tickets and raffle tickets with tear-off stubs and sequential numbering.",
    openGraph: {
      title: "Custom Tickets — Order Online",
      description:
        "Configure and order custom tickets. Choose size, stubs, numbering, and quantity.",
      url: "/order/tickets",
    },
  };
}

export default function TicketOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <MarketingPrintOrderClient defaultType="tickets" hideTypeSelector />
    </Suspense>
  );
}
