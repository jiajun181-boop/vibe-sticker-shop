import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request) {
  try {
    const body = await request.text();
    const event = JSON.parse(body);

    // 监听付款成功事件
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const amount = session.amount_total / 100;
      const customerName = session.customer_details?.name || "Customer";
      const customerEmail = session.customer_details?.email || "No Email";

      console.log(`💰 New order: $${amount} from ${customerName}`);

      // 👇 向 Resend 发送邮件请求
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // ✅ 这里已经填入了你的新密钥！
          'Authorization': 'Bearer re_3aNFJG9U_VrMPFAKrt9jTqmm4bBebWjEc', 
        },
        body: JSON.stringify({
          from: 'onboarding@resend.dev',
          to: 'jiajun181@gmail.com', // 确保这是你接收通知的邮箱
          subject: `🔥 新订单通知 - $${amount}`,
          html: `
            <h1>🎉 恭喜！新订单来了！</h1>
            <p><strong>客户:</strong> ${customerName} (${customerEmail})</p>
            <p><strong>金额:</strong> $${amount}</p>
            <hr />
            <p>请登录 Stripe 后台查看详细订单并下载客户图片：</p>
            <a href="https://dashboard.stripe.com/test/payments" style="padding:10px 20px; background:purple; color:white; text-decoration:none; border-radius:5px;">
              去 Stripe 发货 ➔
            </a>
          `
        }),
      });

      const data = await res.json();

      // 🔍 诊断逻辑：如果 Resend 报错，直接返回给 Stripe，方便我们在后台查看
      if (!res.ok) {
        console.error('Resend Failed:', data);
        return NextResponse.json({ error: 'Email Failed', details: data }, { status: 500 });
      }

      return NextResponse.json({ success: true, emailId: data.id });
    }