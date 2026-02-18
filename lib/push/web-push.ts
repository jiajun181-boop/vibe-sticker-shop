import { prisma } from "@/lib/prisma";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";

/**
 * Send a push notification to a specific subscription.
 * Stub implementation — web-push npm package should be installed
 * for production use (`npm install web-push`).
 * Currently logs a warning and silently succeeds if VAPID keys aren't set.
 */
export async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: { title: string; body: string; url?: string; tag?: string }
): Promise<boolean> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    // Push not configured — silently skip
    return false;
  }

  try {
    // Use dynamic require to avoid build errors when web-push isn't installed
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const webpush = require("web-push");
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
  } catch (err: any) {
    // Remove invalid subscriptions (gone or not found)
    if (err?.statusCode === 410 || err?.statusCode === 404) {
      await prisma.pushSubscription
        .deleteMany({ where: { endpoint: subscription.endpoint } })
        .catch(() => {});
    }

    // If web-push module is not installed, log once and skip
    if (err?.code === "MODULE_NOT_FOUND") {
      console.warn("[Push] web-push npm package not installed — push notifications disabled. Run: npm install web-push");
      return false;
    }

    console.error("[Push] Send failed:", err);
    return false;
  }
}

/**
 * Send a push notification to all subscriptions for a user.
 */
export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string; tag?: string }
) {
  const subs = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  for (const sub of subs) {
    await sendPushNotification(sub, payload);
  }
}
