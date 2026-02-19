import { Suspense } from "react";
import AFrameSignOrderClient from "./AFrameSignOrderClient";

export function generateMetadata() {
  return {
    title: "Custom A-Frame Signs — Order Online | Vibe Sticker Shop",
    description: "Order custom A-frame sandwich board signs for sidewalks and storefronts.",
    openGraph: { title: "Custom A-Frame Signs — Order Online", description: "Configure and order custom A-frame signs. Choose size, material, and print options.", url: "/order/a-frame-signs" },
  };
}

export default function AFrameSignOrderPage() {
  return (<Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" /></div>}><AFrameSignOrderClient /></Suspense>);
}
