import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request) {
  try {
    const body = await request.text();
    const event = JSON.parse(body);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      // 这里的 fetch 必须用 await，否则 Edge 函数会提前关机
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer re_3aNFJG9U_VrMPFAKrt9jTqmm4bBebWjEc', // 确认是你最新的 Key
        },
        body: JSON.stringify({
          from: 'onboarding@resend.dev',
          to: 'jiajun181@gmail.com',
          subject: `Order Success - $${session.amount_total / 100}`,
          html: `<h1>Order Received!</h1><p>Customer: ${session.customer_details?.name}</p>`
        }),
      });

      const resData = await emailResponse.json();
      console.log("Resend debug:", resData);

      if (!emailResponse.ok) {
        return NextResponse.json({ error: "Email rejected", details: resData }, { status: 500 });
      }
      return NextResponse.json({ success: true, id: resData.id });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    return NextResponse.json({ error: "System error", message: err.message }, { status: 500 });
  }
}