import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

// GET /api/account/invoices — list invoices for the current user
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invoices = await prisma.invoice.findMany({
      where: {
        OR: [
          { userId: user.id },
          { customerEmail: user.email },
        ],
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        invoiceNumber: true,
        companyName: true,
        subtotalCents: true,
        taxCents: true,
        totalCents: true,
        status: true,
        terms: true,
        issuedAt: true,
        dueAt: true,
        paidAt: true,
        createdAt: true,
      },
      take: 50,
    });

    return NextResponse.json({ invoices });
  } catch (err) {
    console.error("[account/invoices] GET error:", err);
    return NextResponse.json(
      { error: "Failed to load invoices" },
      { status: 500 }
    );
  }
}
