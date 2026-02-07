// app/api/webhook/route.js
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

// 👈 关键：Cloudflare 必须声明 edge
export const runtime = "edge";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata.orderId;

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "paid",
        customerEmail: session.customer_details.email,
        totalAmount: session.amount_total,
        shippingName: session.shipping_details?.name,
        shippingAddr: session.shipping_details?.address,
      },
    });
  }

  return NextResponse.json({ received: true });
}