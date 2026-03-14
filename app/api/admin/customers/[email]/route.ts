import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { logActivity } from "@/lib/activity-log";

/**
 * GET /api/admin/customers/[email] — Comprehensive customer profile
 *
 * Returns:
 * - User info (if registered)
 * - Order history (count, total revenue, last order)
 * - Account type, partner tier
 * - Tags (collected from orders)
 * - Communication history (support tickets count)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  const auth = await requirePermission(request, "customers", "view");
  if (!auth.authenticated) return auth.response;

  const { email: rawEmail } = await params;
  const email = decodeURIComponent(rawEmail);

  try {
    const [aggregate, orders, user, supportTicketCount, supportTickets, conversations] =
      await Promise.all([
        prisma.order.aggregate({
          where: { customerEmail: email },
          _sum: { totalAmount: true },
          _count: { id: true },
        }),
        prisma.order.findMany({
          where: { customerEmail: email },
          include: { items: true },
          orderBy: { createdAt: "desc" },
        }),
        prisma.user.findFirst({
          where: {
            email: { equals: email, mode: "insensitive" },
          },
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            accountType: true,
            companyName: true,
            companyRole: true,
            b2bApproved: true,
            b2bApprovedAt: true,
            partnerTier: true,
            partnerDiscount: true,
            inviteCode: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.supportTicket.count({
          where: {
            email: { equals: email, mode: "insensitive" },
          },
        }),
        prisma.supportTicket.findMany({
          where: {
            email: { equals: email, mode: "insensitive" },
          },
          orderBy: { updatedAt: "desc" },
          take: 5,
          include: {
            _count: { select: { messages: true } },
          },
        }),
        prisma.conversation.findMany({
          where: {
            customerEmail: { equals: email, mode: "insensitive" },
          },
          orderBy: { lastMessageAt: "desc" },
          take: 5,
          include: {
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
            _count: { select: { messages: true } },
          },
        }),
      ]);

    // If no orders and no user record, customer doesn't exist
    if (aggregate._count.id === 0 && !user) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Extract customer name from most recent order or user record
    const name = orders[0]?.customerName || user?.name || null;

    // Collect unique tags from all orders
    const allTags = new Set<string>();
    for (const order of orders) {
      if (Array.isArray(order.tags)) {
        for (const tag of order.tags) {
          allTags.add(tag as string);
        }
      }
    }

    // Determine last order date
    const lastOrder = orders.length > 0 ? orders[0] : null;

    return NextResponse.json({
      email,
      name,
      user: user
        ? {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          }
        : null,
      accountType: user?.accountType || "B2C",
      partnerTier: user?.partnerTier || null,
      partnerDiscount: user?.partnerDiscount || 0,
      inviteCode: user?.inviteCode || null,
      b2bProfile: user
        ? {
            accountType: user.accountType,
            companyName: user.companyName,
            companyRole: user.companyRole,
            approved: user.b2bApproved,
            approvedAt: user.b2bApprovedAt,
            tier: user.partnerTier,
            discount: user.partnerDiscount,
          }
        : null,
      orderHistory: {
        count: aggregate._count.id,
        totalRevenue: aggregate._sum.totalAmount || 0,
        lastOrderDate: lastOrder?.createdAt || null,
        lastOrderId: lastOrder?.id || null,
        lastOrderStatus: lastOrder?.status || null,
      },
      orders,
      tags: Array.from(allTags),
      supportTickets: {
        total: supportTicketCount,
        recent: supportTickets.map((ticket) => ({
          id: ticket.id,
          subject: ticket.subject,
          status: ticket.status,
          priority: ticket.priority,
          messageCount: ticket._count.messages,
          createdAt: ticket.createdAt,
          updatedAt: ticket.updatedAt,
        })),
      },
      conversations: conversations.map((conversation) => ({
        id: conversation.id,
        subject: conversation.subject,
        status: conversation.status,
        lastMessageAt: conversation.lastMessageAt,
        lastMessage: conversation.messages[0]?.content || null,
        messageCount: conversation._count.messages,
      })),
    });
  } catch (error) {
    console.error("[Admin Customer GET] Failed to fetch customer:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/customers/[email] — Update customer profile
 *
 * Updatable fields:
 * - accountType: "B2C" | "B2B"
 * - partnerTier: "bronze" | "silver" | "gold" | "platinum" | null
 * - partnerDiscount: number (0-50)
 * - companyName: string
 * - companyRole: string
 * - b2bApproved: boolean
 * - name: string
 * - phone: string
 *
 * If no User record exists for this email, one will NOT be created.
 * The admin must ask the customer to register first.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  const auth = await requirePermission(request, "customers", "edit");
  if (!auth.authenticated) return auth.response;

  const { email: rawEmail } = await params;
  const email = decodeURIComponent(rawEmail);

  try {
    const body = await request.json();

    // Find existing user
    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "No registered user found for this email. Customer must register first." },
        { status: 404 }
      );
    }

    // Build update data from allowed fields only
    const data: Record<string, unknown> = {};
    const changes: Record<string, unknown> = {};

    if (body.accountType !== undefined) {
      if (!["B2C", "B2B"].includes(body.accountType)) {
        return NextResponse.json(
          { error: "accountType must be B2C or B2B" },
          { status: 400 }
        );
      }
      data.accountType = body.accountType;
      changes.accountType = body.accountType;
    }

    if (body.partnerTier !== undefined) {
      const validTiers = ["bronze", "silver", "gold", "platinum", null];
      if (!validTiers.includes(body.partnerTier)) {
        return NextResponse.json(
          { error: "partnerTier must be bronze, silver, gold, platinum, or null" },
          { status: 400 }
        );
      }
      data.partnerTier = body.partnerTier;
      changes.partnerTier = body.partnerTier;
    }

    if (body.partnerDiscount !== undefined) {
      if (
        typeof body.partnerDiscount !== "number" ||
        body.partnerDiscount < 0 ||
        body.partnerDiscount > 50
      ) {
        return NextResponse.json(
          { error: "partnerDiscount must be a number between 0 and 50" },
          { status: 400 }
        );
      }
      data.partnerDiscount = Math.floor(body.partnerDiscount);
      changes.partnerDiscount = data.partnerDiscount;
    }

    if (body.companyName !== undefined) {
      data.companyName = body.companyName?.trim() || null;
      changes.companyName = data.companyName;
    }

    if (body.companyRole !== undefined) {
      data.companyRole = body.companyRole?.trim() || null;
      changes.companyRole = data.companyRole;
    }

    if (body.b2bApproved !== undefined) {
      if (typeof body.b2bApproved !== "boolean") {
        return NextResponse.json(
          { error: "b2bApproved must be a boolean" },
          { status: 400 }
        );
      }
      data.b2bApproved = body.b2bApproved;
      changes.b2bApproved = body.b2bApproved;

      // Auto-set approval timestamp
      if (body.b2bApproved && !existingUser.b2bApproved) {
        data.b2bApprovedAt = new Date();
      } else if (!body.b2bApproved) {
        data.b2bApprovedAt = null;
      }
    }

    if (body.name !== undefined) {
      data.name = body.name?.trim() || null;
      changes.name = data.name;
    }

    if (body.phone !== undefined) {
      data.phone = body.phone?.trim() || null;
      changes.phone = data.phone;
    }

    // Nothing to update
    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided for update" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: existingUser.id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        accountType: true,
        companyName: true,
        companyRole: true,
        b2bApproved: true,
        b2bApprovedAt: true,
        partnerTier: true,
        partnerDiscount: true,
        inviteCode: true,
        updatedAt: true,
      },
    });

    logActivity({
      action: "customer_updated",
      entity: "User",
      entityId: existingUser.id,
      actor: auth.user?.email || "admin",
      details: {
        email,
        changes,
      },
    });

    return NextResponse.json({
      user: updatedUser,
      updated: Object.keys(changes),
    });
  } catch (error) {
    console.error("[Admin Customer PATCH] Failed to update customer:", error);
    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 }
    );
  }
}
