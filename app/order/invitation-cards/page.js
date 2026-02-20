import { Suspense } from "react";
import { getOrderPageImages } from "@/lib/order-page-images";
import MarketingPrintOrderClient from "@/app/order/marketing-print/MarketingPrintOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Invitation Cards — Order Online | Vibe Sticker Shop",
    description:
      "Order custom invitation cards for weddings, events, and parties. Premium paper with optional foil and envelopes.",
    openGraph: {
      title: "Custom Invitation Cards — Order Online",
      description:
        "Configure and order custom invitations. Choose size, paper, foil, and envelope options.",
      url: "/order/invitation-cards",
    },
  };
}

export default async function InvitationOrderPage() {
  const productImages = await getOrderPageImages(["invitation-cards","invitation-cards-standard"]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <MarketingPrintOrderClient defaultType="invitation-cards" hideTypeSelector productImages={productImages} />
    </Suspense>
  );
}
