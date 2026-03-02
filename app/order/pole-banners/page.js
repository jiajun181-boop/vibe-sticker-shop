import { Suspense } from "react";
import { getOrderPageImages } from "@/lib/order-page-images";
import BannerOrderClient from "@/app/order/banners/BannerOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Pole Banners — Order Online",
    description: "Order custom pole banners for street light poles and outdoor advertising.",
    openGraph: { title: "Custom Pole Banners — Order Online", url: "/order/pole-banners" },
    alternates: { canonical: "https://www.lunarprint.ca/order/pole-banners" },
  };
}

export default async function PoleBannerOrderPage() {
  const productImages = await getOrderPageImages(["pole-banners", "pole-banner"]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <BannerOrderClient defaultType="pole-banner" productImages={productImages} />
    </Suspense>
  );
}
