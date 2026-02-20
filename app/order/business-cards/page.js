import { Suspense } from "react";
import { getOrderPageImages } from "@/lib/order-page-images";
import BusinessCardsOrderClient from "./BusinessCardsOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Business Cards — Order Online | La Lunar Printing",
    description:
      "Order custom business cards online. Choose from 10 premium finishes including gloss, matte, soft-touch, gold foil, linen, and more.",
    openGraph: {
      title: "Custom Business Cards — Order Online",
      description:
        "Configure and order custom business cards. 3.5×2 inch, multiple finishes, single or double sided.",
      url: "/order/business-cards",
    },
  };
}

export default async function BusinessCardsOrderPage() {
  const productImages = await getOrderPageImages(["business-cards","business-cards-standard"]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <BusinessCardsOrderClient productImages={productImages} />
    </Suspense>
  );
}
