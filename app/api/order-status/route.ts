import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { deriveCheckoutUiStatus } from "@/lib/checkout-status";
import {
  isStatusTokenAuthorized,
  shouldIncludeSensitiveStatusFields,
} from "@/lib/order-status-security";

let _stripe: Stripe | null = null;
function getStripe() {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-01-28.clover",
    });
  }
  return _stripe;
}

async function getSafeLineItems(sessionId: string) {
  try {
    const items = await getStripe().checkout.sessions.listLineItems(sessionId, { limit: 100 });
    return items.data.map((item) => ({
      description: item.description || "Item",
      quantity: item.quantity || 1,
      amount_total: item.amount_total || 0,
    }));
  } catch {
    return [];
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("session_id");
    const statusToken = searchParams.get("st");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing session_id", code: "MISSING_SESSION_ID" },
        { status: 400 }
      );
    }

    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    const order = await prisma.order.findUnique({
      where: { stripeSessionId: sessionId },
      select: { id: true, status: true, paymentStatus: true },
    });

    const orderMarkedPaid = !!order && order.status === "paid" && order.paymentStatus === "paid";
    const status = deriveCheckoutUiStatus({
      sessionStatus: session.status,
      paymentStatus: session.payment_status,
      orderMarkedPaid,
    });

    const expectedToken = session.metadata?.statusToken || null;
    if (!isStatusTokenAuthorized(expectedToken, statusToken)) {
      return NextResponse.json(
        { status: "failed", reason: "Invalid session status token." },
        { status: 404 }
      );
    }

    if (status === "paid") {
      const lineItems = await getSafeLineItems(sessionId);
      const includeSensitiveFields = shouldIncludeSensitiveStatusFields(
        expectedToken,
        statusToken
      );

      return NextResponse.json({
        status,
        sessionId,
        orderId: order!.id,
        customerEmail: includeSensitiveFields
          ? session.customer_details?.email || session.customer_email || ""
          : "",
        amountTotal: session.amount_total || 0,
        lineItems: includeSensitiveFields ? lineItems : [],
      });
    }

    return NextResponse.json({
      status,
      sessionId,
      reason:
        status === "pending"
          ? "Awaiting final payment confirmation."
          : status === "canceled"
            ? "Checkout session expired."
            : "Payment was not completed.",
    });
  } catch (error: unknown) {
    if (error instanceof Stripe.errors.StripeError && error.code === "resource_missing") {
      return NextResponse.json(
        { status: "failed", reason: "Invalid checkout session." },
        { status: 404 }
      );
    }

    console.error("Order status error:", error);
    return NextResponse.json(
      { error: "Failed to get order status", code: "ORDER_STATUS_ERROR" },
      { status: 500 }
    );
  }
}
