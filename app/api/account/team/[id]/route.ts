import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

// PATCH /api/account/team/[id] — update member role/permissions
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.accountType !== "B2B" || !user.b2bApproved) {
      return NextResponse.json(
        { error: "B2B account required" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Find the member
    const member = await prisma.companyTeamMember.findUnique({
      where: { id },
      include: { team: true },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Team member not found" },
        { status: 404 }
      );
    }

    // Only team owner can update members
    if (member.team.ownerId !== user.id) {
      return NextResponse.json(
        { error: "Only team owner can update members" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { role, permissions } = body;

    const updateData: any = {};

    if (role !== undefined) {
      const validRoles = ["admin", "member", "viewer"];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: "Invalid role. Must be admin, member, or viewer" },
          { status: 400 }
        );
      }
      updateData.role = role;
    }

    if (permissions !== undefined) {
      // Validate permissions shape
      if (typeof permissions !== "object" || permissions === null) {
        return NextResponse.json(
          { error: "Invalid permissions format" },
          { status: 400 }
        );
      }

      const allowed = ["canOrder", "canApprove", "spendLimit"];
      const cleaned: Record<string, unknown> = {};
      for (const key of allowed) {
        if (key in permissions) {
          if (key === "spendLimit") {
            const val = Number(permissions[key]);
            if (isNaN(val) || val < 0) {
              return NextResponse.json(
                { error: "spendLimit must be a non-negative number (in cents)" },
                { status: 400 }
              );
            }
            cleaned[key] = val;
          } else {
            cleaned[key] = Boolean(permissions[key]);
          }
        }
      }

      // Merge with existing permissions
      const existing =
        member.permissions && typeof member.permissions === "object"
          ? (member.permissions as Record<string, unknown>)
          : {};
      updateData.permissions = { ...existing, ...cleaned };
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "Nothing to update" },
        { status: 400 }
      );
    }

    const updated = await prisma.companyTeamMember.update({
      where: { id },
      data: updateData,
    });

    // Resolve user info
    const memberUser = await prisma.user.findUnique({
      where: { id: updated.userId },
      select: { email: true, name: true },
    });

    logActivity({
      action: "team_member_updated",
      entity: "CompanyTeamMember",
      entityId: id,
      actor: user.email,
      details: {
        changes: updateData,
        memberEmail: memberUser?.email,
      },
    });

    return NextResponse.json({
      member: {
        id: updated.id,
        userId: updated.userId,
        email: memberUser?.email || null,
        name: memberUser?.name || null,
        role: updated.role,
        permissions: updated.permissions,
        joinedAt: updated.joinedAt,
      },
    });
  } catch (err) {
    console.error("[account/team/[id]] PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update team member" },
      { status: 500 }
    );
  }
}

// DELETE /api/account/team/[id] — remove a team member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.accountType !== "B2B" || !user.b2bApproved) {
      return NextResponse.json(
        { error: "B2B account required" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Find the member
    const member = await prisma.companyTeamMember.findUnique({
      where: { id },
      include: { team: true },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Team member not found" },
        { status: 404 }
      );
    }

    // Only team owner can remove members
    if (member.team.ownerId !== user.id) {
      return NextResponse.json(
        { error: "Only team owner can remove members" },
        { status: 403 }
      );
    }

    // Can't remove yourself (owner)
    if (member.userId === user.id) {
      return NextResponse.json(
        { error: "Cannot remove yourself from the team" },
        { status: 400 }
      );
    }

    // Get member info before deleting for logging
    const memberUser = await prisma.user.findUnique({
      where: { id: member.userId },
      select: { email: true },
    });

    await prisma.companyTeamMember.delete({
      where: { id },
    });

    logActivity({
      action: "team_member_removed",
      entity: "CompanyTeamMember",
      entityId: id,
      actor: user.email,
      details: {
        teamId: member.teamId,
        removedEmail: memberUser?.email,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[account/team/[id]] DELETE error:", err);
    return NextResponse.json(
      { error: "Failed to remove team member" },
      { status: 500 }
    );
  }
}
