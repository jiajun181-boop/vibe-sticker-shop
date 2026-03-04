import { Suspense } from "react";
import { getOrderPageImages } from "@/lib/order-page-images";
import SignOrderClient from "./SignOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Signs — Order Online",
    description:
      "Order custom signs online. Yard signs, aluminum signs, PVC boards, foam boards, and more with various mounting options.",
    openGraph: {
      title: "Custom Signs — Order Online",
      description:
        "Configure and order custom signs. Choose material, size, and accessories.",
      url: "/order/signs",
    },
    alternates: { canonical: "https://www.lunarprint.ca/order/signs" },
  };
}

export default async function SignOrderPage() {
  const productImages = await getOrderPageImages(["signs", "yard-sign", "aluminum-sign"]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <SignOrderClient productImages={productImages} />
    </Suspense>
  );
}
