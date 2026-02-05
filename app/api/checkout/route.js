import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request) {
  try {
    const body = await request.json();
    const { width, height, quantity, filename, imageUrl } = body;

    const area = width * height;
    let unitPrice = 0.15;
    let totalPrice = area * unitPrice * quantity;
    if (totalPrice < 30) totalPrice = 30;

    // 🌟 核心修改：完全抛弃 stripe 库，用原生的 fetch 发请求
    // 这样绝对不会有 Node.js 兼容性问题！
    const params = new URLSearchParams();
    params.append('payment_method_types[]', 'card');
    params.append('mode', 'payment');
    params.append('success_url', `${request.headers.get('origin')}/success`);
    params.append('cancel_url', `${request.headers.get('origin')}/`);
    
    // 商品信息
    params.append('line_items[0][price_data][currency]', 'usd');
    params.append('line_items[0][price_data][product_data][name]', `Custom Sticker (${width}" x ${height}")`);
    params.append('line_items[0][price_data][product_data][description]', `Qty: ${quantity} | File: ${filename} | Link: ${imageUrl}`);
    params.append('line_items[0][price_data][unit_amount]', Math.round(totalPrice * 100).toString());
    params.append('line_items[0][quantity]', '1');

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const session = await response.json();

    if (session.error) {
      console.error('Stripe API Error:', session.error);
      return NextResponse.json({ error: session.error.message }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });

  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json({ error: "Error creating checkout session" }, { status: 500 });
  }
}