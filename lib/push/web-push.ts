import webpush from "web-push";
import { prisma } from "@/lib/prisma";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";

type PushSubscriptionInput = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

export async function sendPushNotification(
  subscription: PushSubscriptionInput,
  payload: PushPayload
): Promise<boolean> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return false;
  }

  try {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || "mailto:info@lalunarprinting.com",
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );

    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload)
    );

    return true;
  } catch (err: unknown) {
    const pushError = err as { statusCode?: number; code?: string };

    if (pushError.statusCode === 410 || pushError.statusCode === 404) {
      await prisma.pushSubscription
        .deleteMany({ where: { endpoint: subscription.endpoint } })
        .catch(() => {});
    }

    if (pushError.code === "MODULE_NOT_FOUND") {
      console.warn(
        "[Push] web-push npm package not installed; push notifications disabled. Run: npm install web-push"
      );
      return false;
    }

    console.error("[Push] Send failed:", err);
    return false;
  }
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });

  for (const sub of subs) {
    await sendPushNotification(sub, payload);
  }
}
