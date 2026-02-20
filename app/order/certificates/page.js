import { Suspense } from "react";
import { getOrderPageImages } from "@/lib/order-page-images";
import MarketingPrintOrderClient from "@/app/order/marketing-print/MarketingPrintOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Certificates — Order Online | La Lunar Printing",
    description:
      "Order custom certificates, diplomas, and gift certificates. Premium paper stocks with optional foil accents.",
    openGraph: {
      title: "Custom Certificates — Order Online",
      description:
        "Configure and order custom certificates. Choose type, paper, foil, and quantity.",
      url: "/order/certificates",
    },
  };
}

export default async function CertificateOrderPage() {
  const productImages = await getOrderPageImages(["certificates","certificates-award"]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <MarketingPrintOrderClient defaultType="certificates" hideTypeSelector productImages={productImages} />
    </Suspense>
  );
}
