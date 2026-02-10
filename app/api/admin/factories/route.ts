import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requireAdminAuth } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const auth = requireAdminAuth(request);
  if (!auth.authenticated) return auth.response;

  try {
    const factories = await prisma.factory.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            jobs: {
              where: {
                status: { notIn: ["finished", "shipped"] },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      factories: factories.map((f) => ({
        id: f.id,
        name: f.name,
        location: f.location,
        capabilities: f.capabilities,
        isActive: f.isActive,
        activeJobCount: f._count.jobs,
        createdAt: f.createdAt,
      })),
    });
  } catch (err) {
    console.error("[Factories GET] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch factories" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAdminAuth(request);
  if (!auth.authenticated) return auth.response;

  try {
    const body = await request.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json(
        { error: "Factory name is required" },
        { status: 400 }
      );
    }

    const factory = await prisma.factory.create({
      data: {
        name,
        location: body.location || null,
        capabilities: body.capabilities ?? null,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      },
    });

    logActivity({
      action: "created",
      entity: "factory",
      entityId: factory.id,
      details: { name: factory.name },
    });

    return NextResponse.json(factory, { status: 201 });
  } catch (err) {
    console.error("[Factories POST] Error:", err);
    return NextResponse.json(
      { error: "Failed to create factory" },
      { status: 500 }
    );
  }
}
