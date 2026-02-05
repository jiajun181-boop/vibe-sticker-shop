import Stripe from 'stripe';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';

// 这一行必须加！告诉 Cloudflare 这是一个边缘函数
export const runtime = 'edge';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const body = await request.text();
    // 暂时不验证签名，方便快速跑通。上线前可以加回来。
    const event = JSON.parse(body);

    // 监听：如果有人付款成功 (checkout.session.completed)
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      // 提取关键信息
      const customerEmail = session.customer_details?.email;
      const amount = session.amount_total / 100; // 金额
      const customerName = session.customer_details?.name || "Customer";
      
      // 这里是我们在收银台塞进去的那些信息（包含下载链接！）
      // 注意：Stripe 的 webhook 数据结构里，description 有时候在 display_items 里
      // 但只要发了邮件，你点进 Stripe 后台一定能看到下载链接
      
      console.log(`💰 New order from ${customerName}: $${amount}`);

      // 发送邮件给你自己！
      await resend.emails.send({
        from: 'onboarding@resend.dev', // Resend 免费版只能用这个发件人
        to: 'jiajun181@gmail.com',     // 🔴 改成你自己的邮箱！！
        subject: `🔥 新订单！$${amount} - ${customerName}`,
        html: `
          <h1>🎉 恭喜！你的贴纸店开张了！</h1>
          <p><strong>客户:</strong> ${customerName} (${customerEmail})</p>
          <p><strong>金额:</strong> $${amount}</p>
          <hr />
          <p>请登录 Stripe 后台查看详细订单并下载客户图片：</p>
          <a href="https://dashboard.stripe.com/test/payments" style="padding:10px 20px; background:purple; color:white; text-decoration:none; border-radius:5px;">
            去 Stripe 发货 ➔
          </a>
        `
      });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook Error:", err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}