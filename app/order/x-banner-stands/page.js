import { Suspense } from "react";
import XBannerStandOrderClient from "./XBannerStandOrderClient";

export function generateMetadata() {
  return {
    title: "X-Banner Stands — Order Online | Vibe Sticker Shop",
    description: "Order custom X-banner stands — lightweight and portable display solution.",
    openGraph: { title: "X-Banner Stands — Order Online", url: "/order/x-banner-stands" },
  };
}

export default function XBannerStandOrderPage() {
  return (<Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" /></div>}><XBannerStandOrderClient /></Suspense>);
}
