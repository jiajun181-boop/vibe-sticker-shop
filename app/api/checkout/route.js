// app/api/checkout/route.js
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { PRODUCTS } from "@/config/products";
import { calculatePrice } from "@/lib/pricing/calculatePrice";

// 👈 修改这里：从 nodejs 改为 edge
export const runtime = "edge";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const { items } = await req.json();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

    const draft = await prisma.order.create({
      data: {
        status: "pending",
        items: {
          create: items.map(item => {
            const product = PRODUCTS.find(p => p.product === item.productId);
            const priceData = calculatePrice(product, item);
            return {
              productId: item.productId,
              name: item.name,
              unitAmount: Math.round(priceData.total * 100),
              cartQuantity: item.cartQuantity || 1,
              printQuantity: item.quantity,
              width: Number(item.width),
              height: Number(item.height),
              sizeLabel: item.sizeLabel,
              addons: item.addons,
              fileKey: item.fileKey,
              fileUrl: item.fileUrl,
            }
          })
        }
      }
    });

    const session = await stripe.checkout.sessions.create({
      line_items: items.map(item => ({
        price_data: {
          currency: "cad",
          product_data: { name: item.name },
          unit_amount: Math.round(calculatePrice(PRODUCTS.find(p => p.product === item.productId), item).total * 100),
        },
        quantity: item.cartQuantity || 1,
      })),
      mode: "payment",
      metadata: { orderId: draft.id },
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout/cancel`,
      shipping_address_collection: { allowed_countries: ["CA", "US"] },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}