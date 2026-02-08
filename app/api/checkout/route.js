// app/api/checkout/route.js
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { SHIPPING_OPTIONS } from "@/lib/store";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const { cart, shipping } = await req.json();

    if (!cart || cart.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    // Look up shipping cost
    const shippingOpt = SHIPPING_OPTIONS.find((o) => o.id === shipping) || SHIPPING_OPTIONS[0];
    const shippingAmount = shippingOpt.price; // cents

    // Calculate totals
    const subtotalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const taxAmount = Math.round(subtotalAmount * 0.13); // HST 13%
    const totalAmount = subtotalAmount + taxAmount + shippingAmount;

    // Create draft order in DB
    const order = await prisma.order.create({
      data: {
        status: "draft",
        paymentStatus: "unpaid",
        subtotalAmount,
        taxAmount,
        shippingAmount,
        totalAmount,
        items: {
          create: cart.map((item) => {
            const opts = item.options || {};
            return {
              productId: item.id || null,
              productSlug: item.slug || null,
              name: item.name,
              unitAmount: item.price,
              cartQuantity: item.quantity,
              printQuantity: item.quantity,
              lineTotal: item.price * item.quantity,
              widthIn: opts.width ? Number(opts.width) : null,
              heightIn: opts.height ? Number(opts.height) : null,
              customOptions: opts,
            };
          }),
        },
      },
    });

    // Build Stripe line items
    const lineItems = cart.map((item) => ({
      price_data: {
        currency: "cad",
        product_data: {
          name: item.name,
          ...(item.image && { images: [item.image] }),
        },
        unit_amount: item.price,
      },
      quantity: item.quantity,
    }));

    // Add tax as a line item
    if (taxAmount > 0) {
      lineItems.push({
        price_data: {
          currency: "cad",
          product_data: { name: "HST (13%)" },
          unit_amount: taxAmount,
        },
        quantity: 1,
      });
    }

    // Add shipping as a line item (if not free)
    if (shippingAmount > 0) {
      lineItems.push({
        price_data: {
          currency: "cad",
          product_data: { name: `Shipping — ${shippingOpt.label}` },
          unit_amount: shippingAmount,
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: "payment",
      metadata: { orderId: order.id },
      success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/shop`,
    });

    // Save stripe session ID to order
    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id, status: "pending" },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
