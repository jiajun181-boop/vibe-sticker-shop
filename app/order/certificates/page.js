import { Suspense } from "react";
import MarketingPrintOrderClient from "@/app/order/marketing-print/MarketingPrintOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Certificates — Order Online | Vibe Sticker Shop",
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

export default function CertificateOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <MarketingPrintOrderClient defaultType="certificates" hideTypeSelector />
    </Suspense>
  );
}
