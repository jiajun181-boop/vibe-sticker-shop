import { Suspense } from "react";
import WindowFilmOrderClient from "./WindowFilmOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Window Films & Clings — Order Online | Vibe Sticker Shop",
    description: "Order custom window films, static clings, adhesive films, one-way vision, and privacy films.",
    openGraph: { title: "Custom Window Films — Order Online", url: "/order/window-films" },
  };
}

export default function WindowFilmOrderPage() {
  return (<Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" /></div>}><WindowFilmOrderClient /></Suspense>);
}
