import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request) {
  try {
    const rawBody = await request.text();
    const event = JSON.parse(rawBody);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const customerEmail = session.customer_details?.email || "Customer";
      
      console.log('--- Processing Order ---');

      // 重点：使用你提供的最新 Key
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer re_3aNFJG9U_VrMPFAKrt9jTqmm4bBebWjEc',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'onboarding@resend.dev',
          to: 'jiajun181@gmail.com', // 确保这是你的注册邮箱
          subject: `Order Confirmed: $${session.amount_total / 100}`,
          html: `<strong>Success!</strong><p>Order for ${customerEmail} received.</p>`,
        }),
      });

      const result = await res.json();
      console.log('Resend Response:', result);

      if (!res.ok) {
        // 如果失败，把具体错误传给 Stripe Dashboard 方便你直接看
        return NextResponse.json({ status: 'fail', error: result }, { status: 400 });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}