import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requireAdminAuth } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const auth = requireAdminAuth(request);
  if (!auth.authenticated) return auth.response;

  try {
    const rules = await prisma.assignmentRule.findMany({
      orderBy: { priority: "asc" },
    });

    return NextResponse.json(rules);
  } catch (error) {
    console.error("[AssignmentRules GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignment rules" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAdminAuth(request);
  if (!auth.authenticated) return auth.response;

  try {
    const body = await request.json();

    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (!body.conditions) {
      return NextResponse.json(
        { error: "Conditions are required" },
        { status: 400 }
      );
    }

    if (!body.action) {
      return NextResponse.json(
        { error: "Action is required" },
        { status: 400 }
      );
    }

    const rule = await prisma.assignmentRule.create({
      data: {
        name: body.name.trim(),
        priority: body.priority ?? 0,
        isActive: body.isActive ?? true,
        conditions: body.conditions,
        action: body.action,
      },
    });

    logActivity({
      action: "created",
      entity: "AssignmentRule",
      entityId: rule.id,
      details: { name: rule.name, priority: rule.priority },
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error("[AssignmentRules POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to create assignment rule" },
      { status: 500 }
    );
  }
}
