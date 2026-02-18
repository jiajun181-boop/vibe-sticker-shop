"use client";

import { useEffect, useState } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map((char) => char.charCodeAt(0)));
}

export default function PushNotificationPrompt() {
  const [show, setShow] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (!VAPID_PUBLIC_KEY) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (Notification.permission === "granted" || Notification.permission === "denied") return;

    // Show prompt after 30s on site
    const timer = setTimeout(() => {
      const dismissed = localStorage.getItem("push-dismissed");
      if (!dismissed) setShow(true);
    }, 30000);

    return () => clearTimeout(timer);
  }, []);

  const handleSubscribe = async () => {
    setSubscribing(true);
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const keys = subscription.toJSON().keys;
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          p256dh: keys?.p256dh,
          auth: keys?.auth,
        }),
      });

      setShow(false);
    } catch (err) {
      console.error("[Push] Subscribe failed:", err);
    } finally {
      setSubscribing(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("push-dismissed", "1");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm animate-slide-up rounded-xl border border-gray-200 bg-white p-4 shadow-lg sm:left-auto sm:right-4">
      <p className="mb-3 text-sm font-medium text-gray-900">
        Get notified about order updates?
      </p>
      <p className="mb-3 text-xs text-gray-500">
        We'll send you push notifications when your order ships or needs attention.
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleSubscribe}
          disabled={subscribing}
          className="flex-1 rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {subscribing ? "Enabling..." : "Enable"}
        </button>
        <button
          onClick={handleDismiss}
          className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-500 hover:bg-gray-50"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
