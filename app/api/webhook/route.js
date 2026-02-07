export const runtime = 'edge';

import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

// 这里的 STRIPE_SECRET_KEY 是必须的，WEBHOOK_SECRET 是可选的（本地测试没有也没关系）
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req) {
  const body = await req.text();
  const sig = headers().get("stripe-signature");

  let event;

  try {
    if (endpointSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } else {
      // 如果没有配置 webhook secret，或者在本地/测试环境，暂时先信任
      // 注意：生产环境建议配置 STRIPE_WEBHOOK_SECRET 以确保安全
      try {
        event = JSON.parse(body);
      } catch (e) {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
      }
    }
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // 打印一下，方便调试
  console.log("🔔 Webhook received:", event.type);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    // 这里是你未来写“发邮件”或“存数据库”逻辑的地方
    console.log("✅ Order paid!", session.id);
  }

  return NextResponse.json({ received: true });
}