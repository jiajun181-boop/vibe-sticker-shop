import { NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";

let _stripe: Stripe | null = null;
function getStripe() {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-01-28.clover",
    });
  }
  return _stripe;
}

const MetaSchema = z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]));

const CartItemSchema = z.object({
  productId: z.string(),
  slug: z.string(),
  name: z.string(),
  unitAmount: z.number().int().nonnegative(),
  quantity: z.number().int().positive(),
  meta: MetaSchema.optional(),
});

const CheckoutSchema = z.object({
  items: z.array(CartItemSchema).min(1, "Cart is empty"),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Validate Request Body
    const result = CheckoutSchema.safeParse(body);

    if (!result.success) {
      const isEmptyCart = result.error.issues.some(
        (issue) => issue.path[0] === "items" && issue.code === "too_small"
      );
      return NextResponse.json(
        {
          error: "Validation Error",
          code: isEmptyCart ? "EMPTY_CART" : "VALIDATION_ERROR",
          details: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { items, successUrl, cancelUrl } = result.data;

    // 2. Calculate Totals (for Metadata Reconciliation)
    const subtotal = items.reduce(
      (sum, item) => sum + item.unitAmount * item.quantity,
      0
    );

    // Free Shipping Logic (Threshold: $150.00 = 15000 cents)
    const FREE_SHIPPING_THRESHOLD = 15000;
    const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
    const shippingCost = isFreeShipping ? 0 : 1500; // $15.00 standard shipping

    // Tax Calculation (Ontario HST 13%)
    // Note: This is an estimate for reconciliation. Stripe calculates the actual tax.
    // We assume tax applies to subtotal + shipping.
    const taxableAmount = subtotal + shippingCost;
    const estimatedTax = Math.round(taxableAmount * 0.13);
    const estimatedTotal = taxableAmount + estimatedTax;

    // 3. Prepare Line Items for Stripe
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(
      (item) => {
        const meta = item.meta || {};
        const stripeMeta: Record<string, string> = Object.fromEntries(
          Object.entries(meta).map(([k, v]) => [k, String(v)])
        );

        return {
          price_data: {
            currency: "cad",
            product_data: {
              name: item.name,
              metadata: {
                productId: String(item.productId),
                slug: String(item.slug),
                ...stripeMeta,
              },
            },
            unit_amount: item.unitAmount,
            tax_behavior: "exclusive", // Tax is added on top
          },
          quantity: item.quantity,
        };
      }
    );

    // 4. Create Stripe Checkout Session
    const session = await getStripe().checkout.sessions.create({
      line_items,
      mode: "payment",
      success_url: successUrl || `${req.headers.get("origin")}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.get("origin")}/cart`,
      
      // Customer & Shipping
      billing_address_collection: "required",
      shipping_address_collection: {
        allowed_countries: ["CA"], // Ontario focus
      },
      phone_number_collection: { enabled: true },

      // Shipping Options
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: shippingCost,
              currency: "cad",
            },
            display_name: isFreeShipping ? "Free Shipping" : "Standard Shipping",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 3 },
              maximum: { unit: "business_day", value: 5 },
            },
            tax_behavior: "exclusive", // HST applies to shipping
          },
        },
      ],

      // Tax (Automatic)
      automatic_tax: { enabled: true },

      // Metadata for Webhook Reconciliation (Contract v1.1)
      metadata: {
        items: JSON.stringify(
          items.map((item) => ({
            productId: item.productId,
            slug: item.slug,
            name: item.name,
            quantity: item.quantity,
            unitAmount: item.unitAmount,
            meta: item.meta || null,
          }))
        ),
        subtotalAmount: subtotal.toString(),
        shippingAmount: shippingCost.toString(),
        taxAmount: estimatedTax.toString(),
        totalAmount: estimatedTotal.toString(),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", code: "CHECKOUT_ERROR" },
      { status: 500 }
    );
  }
}
