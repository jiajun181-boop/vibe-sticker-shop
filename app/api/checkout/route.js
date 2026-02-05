import Stripe from 'stripe';
import { NextResponse } from 'next/server';

// 这一行是 Cloudflare 的强制要求，必须加上！
export const runtime = 'edge';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const body = await request.json();
    const { width, height, quantity, filename, imageUrl } = body; 

    const area = width * height;
    let unitPrice = 0.15; 
    let totalPrice = area * unitPrice * quantity;
    if (totalPrice < 30) totalPrice = 30;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Custom Sticker (${width}" x ${height}")`,
              description: `Qty: ${quantity} | File: ${filename} | Link: ${imageUrl}`,
            },
            unit_amount: Math.round(totalPrice * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${request.headers.get('origin')}/success`,
      cancel_url: `${request.headers.get('origin')}/`,
    });

    return NextResponse.json({ url: session.url });

  } catch (error) {
    console.error('Stripe Error:', error);
    return NextResponse.json({ error: "Error creating checkout session" }, { status: 500 });
  }
}