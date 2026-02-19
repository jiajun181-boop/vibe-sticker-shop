import { Suspense } from "react";
import MagneticSignOrderClient from "./MagneticSignOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Magnetic Signs — Order Online | Vibe Sticker Shop",
    description: "Order custom magnetic signs for vehicles, removable and repositionable.",
    openGraph: { title: "Custom Magnetic Signs — Order Online", url: "/order/magnetic-signs" },
  };
}

export default function MagneticSignOrderPage() {
  return (<Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" /></div>}><MagneticSignOrderClient /></Suspense>);
}
