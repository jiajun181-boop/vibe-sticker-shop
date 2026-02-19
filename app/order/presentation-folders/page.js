import { Suspense } from "react";
import MarketingPrintOrderClient from "@/app/order/marketing-print/MarketingPrintOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Presentation Folders — Order Online | Vibe Sticker Shop",
    description:
      "Order custom presentation folders with pockets and business card slits. Premium card stock with coating options.",
    openGraph: {
      title: "Custom Presentation Folders — Order Online",
      description:
        "Configure and order custom folders. Choose pockets, card slits, coating, and foil stamping.",
      url: "/order/presentation-folders",
    },
  };
}

export default function PresentationFolderOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <MarketingPrintOrderClient defaultType="presentation-folders" hideTypeSelector />
    </Suspense>
  );
}
