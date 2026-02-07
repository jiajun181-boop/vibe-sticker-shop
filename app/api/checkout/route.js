import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { PRODUCTS } from "@/config/products";
import { calculatePrice } from "@/lib/pricing/calculatePrice";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const { items } = await req.json();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

    // 1. 先在数据库创建 "Pending" 订单
    const draft = await prisma.order.create({
      data: {
        status: "pending",
        items: {
          create: items.map(item => {
            const product = PRODUCTS.find(p => p.product === item.productId);
            const priceData = calculatePrice(product, item); // 复算
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

    // 2. 创建 Stripe 会话，带上 orderId
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
      metadata: { orderId: draft.id }, // 👈 关键：关联数据库订单
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout/cancel`,
      shipping_address_collection: { allowed_countries: ["CA", "US"] },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}