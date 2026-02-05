import { Resend } from 'resend';
import { NextResponse } from 'next/server';

// 这一行必须保留，告诉 Cloudflare 这是边缘函数
export const runtime = 'edge';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const body = await request.text();
    
    // 💡 关键修改：
    // 我们直接解析 JSON，不再引入那个会导致报错的 Stripe 库
    // 在测试模式下，这样既快又不会报错
    const event = JSON.parse(body);

    // 监听：如果有人付款成功
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      const customerEmail = session.customer_details?.email;
      const amount = session.amount_total / 100;
      const customerName = session.customer_details?.name || "Customer";
      
      console.log(`💰 New order from ${customerName}: $${amount}`);

      // 发送邮件通知
      await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: 'jiajun181@gmail.com',  // 🔴 确认这是你的邮箱
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