import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request) {
  try {
    const body = await request.text();
    const event = JSON.parse(body);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const amount = session.amount_total / 100;

      // 🚀 核心：直接硬编码这个新 Key (跳过环境变量读取)
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer re_3aNFJG9U_VrMPFAKrt9jTqmm4bBebWjEc', 
        },
        body: JSON.stringify({
          from: 'onboarding@resend.dev',
          to: 'jiajun181@gmail.com',
          subject: `🔥 新订单通知 - $${amount}`,
          html: `<p>订单成功！金额: $${amount}</p>`
        }),
      });

      const data = await res.json();
      
      // 如果 Resend 报错，直接把错误通过 Stripe 的回执吐出来
      if (!res.ok) {
        return NextResponse.json({ error: 'Resend Error', details: data }, { status: 500 });
      }

      return NextResponse.json({ success: true, id: data.id });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}