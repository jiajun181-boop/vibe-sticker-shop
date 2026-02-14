import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { orderRef, email } = await req.json();

    if (!orderRef || !email) {
      return NextResponse.json(
        { error: "Order reference and email are required." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderRef.trim(),
        customerEmail: { equals: email.trim(), mode: "insensitive" },
      },
      select: {
        id: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        items: {
          select: { productName: true, quantity: true, unitPrice: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "No order found. Please check your order reference and email." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: order.id,
      status: order.status,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      items: order.items.map((item) => ({
        name: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
