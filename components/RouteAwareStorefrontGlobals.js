"use client";

import { usePathname } from "next/navigation";
import CartDrawer from "@/components/cart/CartDrawer";
import ChatWidget from "@/components/chat/ChatWidget";
import TawkToWidget from "@/components/TawkToWidget";
import PushNotificationPrompt from "@/components/PushNotificationPrompt";
import { isAdminRoute, isDesignRoute } from "@/lib/route-path";

export default function RouteAwareStorefrontGlobals() {
  const pathname = usePathname() || "/";
  const hideStorefrontGlobals = isAdminRoute(pathname) || isDesignRoute(pathname);

  if (hideStorefrontGlobals) {
    return null;
  }

  return (
    <>
      <CartDrawer />
      <ChatWidget />
      <TawkToWidget />
      <PushNotificationPrompt />
    </>
  );
}
