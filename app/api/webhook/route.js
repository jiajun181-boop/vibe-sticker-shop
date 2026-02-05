import { Resend } from 'resend';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const body = await request.text();
    const event = JSON.parse(body); // ✅ 确保这里是用 JSON.parse，没有用 stripe.webhooks

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const customerEmail = session.customer_details?.email;
      const amount = session.amount_total / 100;
      const customerName = session.customer_details?.name || "Customer";
      
      console.log(`💰 New order from ${customerName}: $${amount}`);

      await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: 'jiajun181@gmail.com',
        subject: `🔥 新订单！$${amount} - ${customerName}`,
        html: `
          <h1>🎉 恭喜！新订单来了！</h1>
          <p><strong>客户:</strong> ${customerName}</p>
          <p><strong>金额:</strong> $${amount}</p>
        `
      });
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}