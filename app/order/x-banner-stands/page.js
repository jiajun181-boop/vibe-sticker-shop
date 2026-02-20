import { Suspense } from "react";
import { getOrderPageImages } from "@/lib/order-page-images";
import XBannerStandOrderClient from "./XBannerStandOrderClient";

export function generateMetadata() {
  return {
    title: "X-Banner Stands — Order Online | La Lunar Printing",
    description: "Order custom X-banner stands — lightweight and portable display solution.",
    openGraph: { title: "X-Banner Stands — Order Online", url: "/order/x-banner-stands" },
  };
}

export default async function XBannerStandOrderPage() {
  const productImages = await getOrderPageImages(["x-banner-stands","x-banner-stand"]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <XBannerStandOrderClient productImages={productImages} />
    </Suspense>
  );
}
