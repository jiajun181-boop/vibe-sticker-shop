import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

// GET /api/admin/b2b-team — list all company teams with member counts
export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "customers", "view");
    if (!auth.authenticated) return auth.response;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = 20;
    const skip = (page - 1) * limit;
    const search = searchParams.get("search")?.trim() || "";

    const where: any = {};
    if (search) {
      where.companyName = { contains: search, mode: "insensitive" };
    }

    const [teams, total] = await Promise.all([
      prisma.companyTeam.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          _count: { select: { members: true } },
          members: {
            select: {
              id: true,
              userId: true,
              role: true,
              joinedAt: true,
            },
          },
        },
      }),
      prisma.companyTeam.count({ where }),
    ]);

    // Resolve owner info
    const ownerIds = teams.map((t) => t.ownerId);
    const owners = await prisma.user.findMany({
      where: { id: { in: ownerIds } },
      select: { id: true, email: true, name: true, companyName: true },
    });
    const ownerMap = new Map(owners.map((o) => [o.id, o])) as Map<string, { id: string; email: string; name: string | null; companyName: string | null }>;

    const result = teams.map((team) => {
      const owner = ownerMap.get(team.ownerId);
      return {
        id: team.id,
        companyName: team.companyName,
        ownerId: team.ownerId,
        ownerEmail: owner?.email || null,
        ownerName: owner?.name || null,
        maxMembers: team.maxMembers,
        memberCount: team._count.members,
        createdAt: team.createdAt,
      };
    });

    return NextResponse.json({ teams: result, total, page, pageSize: limit });
  } catch (err) {
    console.error("[admin/b2b-team] GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
