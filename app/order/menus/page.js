import { Suspense } from "react";
import { getOrderPageImages } from "@/lib/order-page-images";
import MarketingPrintOrderClient from "@/app/order/marketing-print/MarketingPrintOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Menus — Order Online",
    description:
      "Order custom restaurant menus online. Flat, folded, laminated, and takeout insert options on premium paper stocks.",
    openGraph: {
      title: "Custom Menus — Order Online",
      description:
        "Configure and order custom menus. Choose style, size, paper stock, lamination, and quantity.",
      url: "/order/menus",
    },
    alternates: { canonical: "https://www.lunarprint.ca/order/menus" },
  };
}

export default async function MenuOrderPage() {
  const productImages = await getOrderPageImages(["menus","menus-standard"]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <MarketingPrintOrderClient defaultType="menus-laminated" hideTypeSelector productImages={productImages} />
    </Suspense>
  );
}
