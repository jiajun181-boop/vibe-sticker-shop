import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request) {
  try {
    const body = await request.text();
    const event = JSON.parse(body);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const customerEmail = session.customer_details?.email;
      const amount = session.amount_total / 100;
      const customerName = session.customer_details?.name || "Customer";

      console.log(`💰 New order: $${amount}`);

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 👇👇👇 重点在这里！直接把 'Bearer re_...' 写进去！
          // 注意：Bearer 后面有一个空格，然后才是你的 re_xxxx
          'Authorization': re_Bg32y2Wh_EBgaLvA9RFX3ARyKG1GyLai5, 
        },
        body: JSON.stringify({
          from: 'onboarding@resend.dev',
          to: 'jiajun181@gmail.com', 
          subject: `🔥 新订单！$${amount} - ${customerName}`,
          html: `
            <h1>🎉 恭喜！你的贴纸店开张了！</h1>
            <p><strong>客户:</strong> ${customerName} (${customerEmail})</p>
            <p><strong>金额:</strong> $${amount}</p>
            <hr />
            <p>请登录 Stripe 后台查看详细订单并下载客户图片：</p>
            <a href="https://dashboard.stripe.com/test/payments">去 Stripe 发货 ➔</a>
          `
        }),
      });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook Error:", err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}