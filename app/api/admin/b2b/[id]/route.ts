import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/admin-auth";
import { sendEmail } from "@/lib/email/resend";
import { buildB2bApprovedHtml } from "@/lib/email/templates/b2b-approved";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAdminAuth(request as any);
  if (!auth.authenticated) return auth.response;

  const { id } = await params;
  const body = await request.json();
  const { action } = body; // "approve" | "reject"

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.accountType !== "B2B") {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (action === "approve") {
    await prisma.user.update({
      where: { id },
      data: { b2bApproved: true, b2bApprovedAt: new Date() },
    });

    // Send approval notification
    sendEmail({
      to: user.email,
      subject: "Your B2B account has been approved — Vibe Sticker Shop",
      html: buildB2bApprovedHtml({ name: user.name || "there", companyName: user.companyName || "" }),
      template: "b2b-approved",
    }).catch(() => {});

    await prisma.activityLog.create({
      data: {
        action: "b2b_approved",
        entity: "user",
        entityId: id,
        details: { email: user.email, companyName: user.companyName },
      },
    });

    return NextResponse.json({ success: true, status: "approved" });
  }

  if (action === "reject") {
    // Reject: revert to B2C
    await prisma.user.update({
      where: { id },
      data: { accountType: "B2C", b2bApproved: false, companyName: null, companyRole: null },
    });

    await prisma.activityLog.create({
      data: {
        action: "b2b_rejected",
        entity: "user",
        entityId: id,
        details: { email: user.email, companyName: user.companyName },
      },
    });

    return NextResponse.json({ success: true, status: "rejected" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
