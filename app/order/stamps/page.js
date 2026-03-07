import { Suspense } from "react";
import { getOrderPageImages } from "@/lib/order-page-images";
import StampOrderClient from "@/components/stamp/StampOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Self-Inking Stamps — Order Online",
    description:
      "Order custom self-inking stamps online. Choose your model, enter text, design your stamp, and order.",
    openGraph: {
      title: "Custom Self-Inking Stamps — Order Online",
      description:
        "Configure and order custom stamps. Choose model, enter your text, and upload your logo.",
      url: "/order/stamps",
    },
    alternates: { canonical: "https://www.lunarprint.ca/order/stamps" },
  };
}

export default async function StampOrderPage() {
  const productImages = await getOrderPageImages(["stamps","stamps-self-inking"]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <StampOrderClient productImages={productImages} />
    </Suspense>
  );
}
