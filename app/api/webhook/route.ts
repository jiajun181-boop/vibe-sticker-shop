import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { handleCheckoutCompleted } from "@/lib/webhook-handler";
import { releaseReserve } from "@/lib/inventory";

let _stripe: Stripe | null = null;
function getStripe() {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-01-28.clover",
    });
  }
  return _stripe;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  // Step 1: Verify signature — return 400 on failure so Stripe retries
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (sigErr: unknown) {
    const message = sigErr instanceof Error ? sigErr.message : "Signature verification failed";
    console.error("[Webhook] Signature verification failed:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Step 2: Process event — return 200 even on processing errors to prevent infinite retries
  try {
    console.log(`[Webhook] Event: ${event.type}`);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted(session);
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      try {
        const metadata = session.metadata;
        if (metadata?.items) {
          const items = JSON.parse(metadata.items);
          const stockItems = items
            .map((item: any) => ({
              productId: item.productId || "",
              quantity: item.quantity || 1,
            }))
            .filter((item: any) => item.productId);
          if (stockItems.length > 0) {
            await releaseReserve(stockItems);
            console.log(`[Webhook] Released reserved stock for expired session: ${session.id}`);
          }
        }
      } catch (releaseErr) {
        console.error("[Webhook] Failed to release reserved stock:", releaseErr);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook processing error";
    console.error("[Webhook Error]", message);
    return NextResponse.json({ received: true, error: message }, { status: 200 });
  }
}
