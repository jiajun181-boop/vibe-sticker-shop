import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

// GET /api/account/team — list team members
export async function GET(request: NextRequest) {
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

    // Find or auto-create team for this user
    let team = await prisma.companyTeam.findUnique({
      where: { ownerId: user.id },
      include: {
        members: {
          orderBy: { joinedAt: "asc" },
        },
      },
    });

    // Check if user is a member of another team (not owner)
    if (!team) {
      const membership = await prisma.companyTeamMember.findFirst({
        where: { userId: user.id },
        include: {
          team: {
            include: {
              members: {
                orderBy: { joinedAt: "asc" },
              },
            },
          },
        },
      });

      if (membership) {
        team = membership.team;
      }
    }

    // Auto-create team on first access for B2B owners
    if (!team) {
      team = await prisma.companyTeam.create({
        data: {
          companyName: user.companyName || user.name || "My Company",
          ownerId: user.id,
        },
        include: {
          members: {
            orderBy: { joinedAt: "asc" },
          },
        },
      });

      logActivity({
        action: "team_created",
        entity: "CompanyTeam",
        entityId: team.id,
        actor: user.email,
        details: { companyName: team.companyName },
      });
    }

    // Resolve member user info
    const memberUserIds = team.members.map((m) => m.userId);
    const memberUsers = await prisma.user.findMany({
      where: { id: { in: memberUserIds } },
      select: { id: true, email: true, name: true },
    });
    const userMap = new Map(memberUsers.map((u) => [u.id, u])) as Map<string, { id: string; email: string; name: string | null }>;

    const members = team.members.map((m) => ({
      id: m.id,
      userId: m.userId,
      email: userMap.get(m.userId)?.email || null,
      name: userMap.get(m.userId)?.name || null,
      role: m.role,
      permissions: m.permissions,
      joinedAt: m.joinedAt,
    }));

    return NextResponse.json({
      team: {
        id: team.id,
        companyName: team.companyName,
        ownerId: team.ownerId,
        maxMembers: team.maxMembers,
        createdAt: team.createdAt,
      },
      members,
      isOwner: team.ownerId === user.id,
    });
  } catch (err) {
    console.error("[account/team] GET error:", err);
    return NextResponse.json(
      { error: "Failed to load team" },
      { status: 500 }
    );
  }
}

// POST /api/account/team — invite a team member
export async function POST(request: NextRequest) {
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

    // Only team owner or admin members can invite
    const team = await prisma.companyTeam.findUnique({
      where: { ownerId: user.id },
      include: { members: true },
    });

    let isOwner = !!team;
    let resolvedTeam = team;

    if (!team) {
      // Check if user is an admin member
      const membership = await prisma.companyTeamMember.findFirst({
        where: { userId: user.id, role: "admin" },
        include: {
          team: { include: { members: true } },
        },
      });
      if (membership) {
        resolvedTeam = membership.team;
      } else {
        return NextResponse.json(
          { error: "Only team owner or admin can invite members" },
          { status: 403 }
        );
      }
    }

    if (!resolvedTeam) {
      return NextResponse.json(
        { error: "No team found" },
        { status: 404 }
      );
    }

    // Check member limit
    if (resolvedTeam.members.length >= resolvedTeam.maxMembers) {
      return NextResponse.json(
        { error: `Team is full (max ${resolvedTeam.maxMembers} members)` },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { email, role = "member" } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const validRoles = ["admin", "member", "viewer"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be admin, member, or viewer" },
        { status: 400 }
      );
    }

    // Find the user to invite
    const invitee = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, email: true, name: true },
    });

    if (!invitee) {
      return NextResponse.json(
        { error: "No account found with that email. They must register first." },
        { status: 404 }
      );
    }

    // Can't invite yourself
    if (invitee.id === user.id) {
      return NextResponse.json(
        { error: "You cannot invite yourself" },
        { status: 400 }
      );
    }

    // Check if already a member
    const existing = await prisma.companyTeamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: resolvedTeam.id,
          userId: invitee.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "This user is already a team member" },
        { status: 409 }
      );
    }

    // Default permissions based on role
    const defaultPermissions = {
      admin: { canOrder: true, canApprove: true, spendLimit: 0 },
      member: { canOrder: true, canApprove: false, spendLimit: 50000 },
      viewer: { canOrder: false, canApprove: false, spendLimit: 0 },
    };

    const member = await prisma.companyTeamMember.create({
      data: {
        teamId: resolvedTeam.id,
        userId: invitee.id,
        role,
        permissions: defaultPermissions[role as keyof typeof defaultPermissions],
        invitedBy: user.id,
      },
    });

    logActivity({
      action: "team_member_invited",
      entity: "CompanyTeamMember",
      entityId: member.id,
      actor: user.email,
      details: {
        teamId: resolvedTeam.id,
        inviteeEmail: invitee.email,
        role,
      },
    });

    return NextResponse.json({
      member: {
        id: member.id,
        userId: invitee.id,
        email: invitee.email,
        name: invitee.name,
        role: member.role,
        permissions: member.permissions,
        joinedAt: member.joinedAt,
      },
    });
  } catch (err) {
    console.error("[account/team] POST error:", err);
    return NextResponse.json(
      { error: "Failed to invite team member" },
      { status: 500 }
    );
  }
}
