import { Suspense } from "react";
import MarketingPrintOrderClient from "@/app/order/marketing-print/MarketingPrintOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Posters — Order Online | Vibe Sticker Shop",
    description:
      "Order custom posters online. Glossy, matte, adhesive, and backlit options in multiple sizes with optional lamination.",
    openGraph: {
      title: "Custom Posters — Order Online",
      description:
        "Configure and order custom posters. Choose paper finish, size, lamination, and quantity.",
      url: "/order/posters",
    },
  };
}

export default function PosterOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <MarketingPrintOrderClient defaultType="posters" hideTypeSelector />
    </Suspense>
  );
}
