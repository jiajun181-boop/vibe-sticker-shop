import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requirePermission } from "@/lib/admin-auth";

// ── Types ──

interface POItem {
  description: string;
  quantity: number;
  unitCost: number; // cents
  total: number;    // cents
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  items: POItem[];
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  status: "draft" | "sent" | "received" | "partial" | "canceled";
  sentAt: string | null;
  receivedAt: string | null;
  notes: string | null;
  createdAt: string;
}

const VALID_STATUSES = ["draft", "sent", "received", "partial", "canceled"];

// ── Helpers ──

/**
 * Generate a PO number in the format PO-YYYYMMDD-NNN.
 * Counts existing POs for the same date to determine the sequence number.
 */
async function generatePoNumber(): Promise<string> {
  const now = new Date();
  const dateStr =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");

  const prefix = `PO-${dateStr}-`;

  // Find all PO settings whose key starts with "po:" to count today's POs
  const existing = await prisma.setting.findMany({
    where: { key: { startsWith: "po:" } },
    select: { value: true },
  });

  let maxSeq = 0;
  for (const row of existing) {
    const val = row.value as unknown as PurchaseOrder;
    if (val?.poNumber?.startsWith(prefix)) {
      const seq = parseInt(val.poNumber.slice(prefix.length), 10);
      if (seq > maxSeq) maxSeq = seq;
    }
  }

  const nextSeq = String(maxSeq + 1).padStart(3, "0");
  return `${prefix}${nextSeq}`;
}

// ── GET: List purchase orders ──

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "finance", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const supplierId = searchParams.get("supplierId");
    const search = searchParams.get("search");

    const settings = await prisma.setting.findMany({
      where: { key: { startsWith: "po:" } },
    });

    let purchaseOrders: PurchaseOrder[] = settings
      .map((s) => s.value as unknown as PurchaseOrder)
      .filter((po): po is PurchaseOrder => po !== null && typeof po === "object" && !!po.id);

    // Apply filters
    if (status && VALID_STATUSES.includes(status)) {
      purchaseOrders = purchaseOrders.filter((po) => po.status === status);
    }

    if (supplierId) {
      purchaseOrders = purchaseOrders.filter((po) => po.supplierId === supplierId);
    }

    if (search) {
      const term = search.toLowerCase();
      purchaseOrders = purchaseOrders.filter(
        (po) =>
          po.poNumber.toLowerCase().includes(term) ||
          po.supplierName.toLowerCase().includes(term) ||
          (po.notes && po.notes.toLowerCase().includes(term))
      );
    }

    // Sort by createdAt descending
    purchaseOrders.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ data: purchaseOrders });
  } catch (err) {
    console.error("[PurchaseOrders GET] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch purchase orders" },
      { status: 500 }
    );
  }
}

// ── POST: Create a purchase order ──

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "finance", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const body = await request.json();

    // Validate supplier
    if (!body.supplierId || typeof body.supplierId !== "string") {
      return NextResponse.json(
        { error: "supplierId is required" },
        { status: 400 }
      );
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id: body.supplierId },
      select: { id: true, name: true },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    // Validate items
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: "At least one item is required" },
        { status: 400 }
      );
    }

    const items: POItem[] = [];
    let subtotalCents = 0;

    for (const item of body.items) {
      const description =
        typeof item.description === "string" ? item.description.trim() : "";
      if (!description) {
        return NextResponse.json(
          { error: "Each item must have a description" },
          { status: 400 }
        );
      }

      const quantity = parseInt(item.quantity);
      if (!quantity || quantity <= 0) {
        return NextResponse.json(
          { error: "Each item must have a positive quantity" },
          { status: 400 }
        );
      }

      const unitCost = parseInt(item.unitCost);
      if (isNaN(unitCost) || unitCost < 0) {
        return NextResponse.json(
          { error: "Each item must have a valid unitCost (in cents)" },
          { status: 400 }
        );
      }

      const total = quantity * unitCost;
      subtotalCents += total;

      items.push({ description, quantity, unitCost, total });
    }

    const taxCents =
      typeof body.taxCents === "number" && body.taxCents >= 0
        ? Math.round(body.taxCents)
        : 0;
    const totalCents = subtotalCents + taxCents;

    const poNumber = await generatePoNumber();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const po: PurchaseOrder = {
      id,
      poNumber,
      supplierId: supplier.id,
      supplierName: supplier.name,
      items,
      subtotalCents,
      taxCents,
      totalCents,
      status: "draft",
      sentAt: null,
      receivedAt: null,
      notes: typeof body.notes === "string" ? body.notes.trim() || null : null,
      createdAt: now,
    };

    await prisma.setting.create({
      data: {
        key: `po:${id}`,
        value: po as any,
      },
    });

    await logActivity({
      action: "created",
      entity: "purchase_order",
      entityId: id,
      actor: auth.user?.email || "admin",
      details: {
        poNumber,
        supplierId: supplier.id,
        supplierName: supplier.name,
        totalCents,
        itemCount: items.length,
      },
    });

    return NextResponse.json({ data: po }, { status: 201 });
  } catch (err) {
    console.error("[PurchaseOrders POST] Error:", err);
    return NextResponse.json(
      { error: "Failed to create purchase order" },
      { status: 500 }
    );
  }
}

// ── PATCH: Update PO status / fields ──

export async function PATCH(request: NextRequest) {
  const auth = await requirePermission(request, "finance", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const body = await request.json();

    if (!body.id || typeof body.id !== "string") {
      return NextResponse.json(
        { error: "Purchase order id is required" },
        { status: 400 }
      );
    }

    const setting = await prisma.setting.findUnique({
      where: { key: `po:${body.id}` },
    });

    if (!setting) {
      return NextResponse.json(
        { error: "Purchase order not found" },
        { status: 404 }
      );
    }

    const po = setting.value as unknown as PurchaseOrder;

    if (po.status === "canceled") {
      return NextResponse.json(
        { error: "Cannot update a canceled purchase order" },
        { status: 400 }
      );
    }

    const changes: Record<string, unknown> = {};

    // Update status
    if (body.status && typeof body.status === "string") {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
          { status: 400 }
        );
      }
      changes.oldStatus = po.status;
      changes.newStatus = body.status;
      po.status = body.status as PurchaseOrder["status"];

      // Auto-set sentAt when status changes to "sent"
      if (body.status === "sent" && !po.sentAt) {
        po.sentAt = new Date().toISOString();
      }
    }

    // Update receivedAt
    if (body.receivedAt !== undefined) {
      po.receivedAt = body.receivedAt
        ? new Date(body.receivedAt).toISOString()
        : null;
    }

    // Auto-set receivedAt when status changes to "received"
    if (po.status === "received" && !po.receivedAt) {
      po.receivedAt = new Date().toISOString();
    }

    // Update notes
    if (body.notes !== undefined) {
      po.notes = typeof body.notes === "string" ? body.notes.trim() || null : null;
    }

    await prisma.setting.update({
      where: { key: `po:${body.id}` },
      data: { value: po as any },
    });

    // When status changes to "received", optionally create an Expense record
    if (
      changes.newStatus === "received" &&
      changes.oldStatus !== "received" &&
      po.totalCents > 0
    ) {
      try {
        await prisma.expense.create({
          data: {
            category: "material",
            description: `Purchase Order ${po.poNumber}`,
            amountCents: po.totalCents,
            currency: "cad",
            date: po.receivedAt ? new Date(po.receivedAt) : new Date(),
            supplierId: po.supplierId,
            notes: `Auto-created from PO ${po.poNumber}`,
            createdBy: auth.user?.email || "system",
          },
        });
      } catch (expenseErr) {
        // Log but don't fail the PO update
        console.error(
          "[PurchaseOrders PATCH] Failed to create expense for received PO:",
          expenseErr
        );
      }
    }

    await logActivity({
      action: "updated",
      entity: "purchase_order",
      entityId: body.id,
      actor: auth.user?.email || "admin",
      details: {
        poNumber: po.poNumber,
        ...changes,
      },
    });

    return NextResponse.json({ data: po });
  } catch (err) {
    console.error("[PurchaseOrders PATCH] Error:", err);
    return NextResponse.json(
      { error: "Failed to update purchase order" },
      { status: 500 }
    );
  }
}

// ── DELETE: Cancel a purchase order ──

export async function DELETE(request: NextRequest) {
  const auth = await requirePermission(request, "finance", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Purchase order id is required (as query param)" },
        { status: 400 }
      );
    }

    const setting = await prisma.setting.findUnique({
      where: { key: `po:${id}` },
    });

    if (!setting) {
      return NextResponse.json(
        { error: "Purchase order not found" },
        { status: 404 }
      );
    }

    const po = setting.value as unknown as PurchaseOrder;

    if (po.status === "canceled") {
      return NextResponse.json(
        { error: "Purchase order is already canceled" },
        { status: 400 }
      );
    }

    const oldStatus = po.status;
    po.status = "canceled";

    await prisma.setting.update({
      where: { key: `po:${id}` },
      data: { value: po as any },
    });

    await logActivity({
      action: "canceled",
      entity: "purchase_order",
      entityId: id,
      actor: auth.user?.email || "admin",
      details: {
        poNumber: po.poNumber,
        previousStatus: oldStatus,
      },
    });

    return NextResponse.json({ data: po });
  } catch (err) {
    console.error("[PurchaseOrders DELETE] Error:", err);
    return NextResponse.json(
      { error: "Failed to cancel purchase order" },
      { status: 500 }
    );
  }
}
