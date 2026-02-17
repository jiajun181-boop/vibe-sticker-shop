import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { logActivity } from "@/lib/activity-log";

const WORKFLOW_TAGS = ["workflow:draft", "workflow:pending_review", "workflow:published"];

function stripWorkflowTags(tags: unknown) {
  if (!Array.isArray(tags)) return [];
  return tags.filter((t) => typeof t === "string" && !WORKFLOW_TAGS.includes(t));
}

function resolveWorkflowState(tags: string[], isActive: boolean) {
  if (tags.includes("workflow:pending_review")) return "pending_review";
  if (tags.includes("workflow:draft")) return "draft";
  if (tags.includes("workflow:published") || isActive) return "published";
  return "draft";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "products", "view");
  if (!auth.authenticated) return auth.response;

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true, tags: true, isActive: true, updatedAt: true },
  });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: product.id,
    name: product.name,
    slug: product.slug,
    state: resolveWorkflowState(product.tags || [], product.isActive),
    isActive: product.isActive,
    tags: product.tags || [],
    updatedAt: product.updatedAt,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const body = await request.json();
  const action = String(body?.action || "");
  const needsApprove = action === "publish";

  const auth = await requirePermission(request, "products", needsApprove ? "approve" : "edit");
  if (!auth.authenticated) return auth.response;

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true, tags: true, isActive: true },
  });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const baseTags = stripWorkflowTags(product.tags || []);
  let nextTags = baseTags;
  let nextIsActive = product.isActive;

  if (action === "save_draft") {
    nextTags = [...baseTags, "workflow:draft"];
    nextIsActive = false;
  } else if (action === "submit_review") {
    nextTags = [...baseTags, "workflow:pending_review"];
    nextIsActive = false;
  } else if (action === "publish") {
    nextTags = [...baseTags, "workflow:published"];
    nextIsActive = true;
  } else {
    return NextResponse.json({ error: "Unsupported workflow action" }, { status: 400 });
  }

  const updated = await prisma.product.update({
    where: { id },
    data: {
      tags: Array.from(new Set(nextTags)),
      isActive: nextIsActive,
    },
    select: { id: true, name: true, slug: true, tags: true, isActive: true, updatedAt: true },
  });

  await logActivity({
    action: `workflow_${action}`,
    entity: "Product",
    entityId: updated.id,
    actor: auth.user?.email || "admin",
    details: {
      productName: updated.name,
      productSlug: updated.slug,
      workflowState: resolveWorkflowState(updated.tags || [], updated.isActive),
    },
  });

  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    slug: updated.slug,
    state: resolveWorkflowState(updated.tags || [], updated.isActive),
    isActive: updated.isActive,
    tags: updated.tags || [],
    updatedAt: updated.updatedAt,
  });
}

