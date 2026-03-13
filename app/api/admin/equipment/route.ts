import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { logActivity } from "@/lib/activity-log";

const EQUIPMENT_PREFIX = "equipment:";
const MAINTENANCE_PREFIX = "maintenance:";

interface Equipment {
  id: string;
  name: string;
  type: string; // printer, cutter, laminator, folder, binder, other
  model?: string;
  serialNumber?: string;
  location?: string;
  purchasedAt?: string;
  warrantyExpires?: string;
  status: "operational" | "maintenance" | "repair" | "decommissioned";
  notes?: string;
  createdAt: string;
}

interface MaintenanceRecord {
  id: string;
  equipmentId: string;
  type: "preventive" | "corrective" | "inspection" | "calibration";
  description: string;
  performedBy?: string;
  performedAt: string;
  nextDueAt?: string;
  costCents?: number;
  notes?: string;
  createdAt: string;
}

/**
 * GET /api/admin/equipment
 * List all equipment and their latest maintenance records
 */
export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "production", "view");
  if (!auth.authenticated) return auth.response;

  try {
    // Fetch all equipment from Settings
    const equipmentSettings = await prisma.setting.findMany({
      where: { key: { startsWith: EQUIPMENT_PREFIX } },
    });

    const equipment = equipmentSettings
      .map((s) => s.value as unknown as Equipment)
      .sort((a, b) => a.name.localeCompare(b.name));

    // Fetch maintenance records
    const maintenanceSettings = await prisma.setting.findMany({
      where: { key: { startsWith: MAINTENANCE_PREFIX } },
    });

    const maintenanceRecords = maintenanceSettings
      .map((s) => s.value as unknown as MaintenanceRecord)
      .sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime());

    // Group maintenance by equipment
    const maintenanceByEquipment = new Map<string, MaintenanceRecord[]>();
    for (const record of maintenanceRecords) {
      const existing = maintenanceByEquipment.get(record.equipmentId) || [];
      existing.push(record);
      maintenanceByEquipment.set(record.equipmentId, existing);
    }

    const result = equipment.map((eq) => ({
      ...eq,
      recentMaintenance: (maintenanceByEquipment.get(eq.id) || []).slice(0, 5),
      nextMaintenance: (maintenanceByEquipment.get(eq.id) || [])
        .filter((m) => m.nextDueAt && new Date(m.nextDueAt) > new Date())
        .sort((a, b) => new Date(a.nextDueAt!).getTime() - new Date(b.nextDueAt!).getTime())[0] || null,
    }));

    return NextResponse.json({ equipment: result });
  } catch (error) {
    console.error("[Equipment] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch equipment" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/equipment
 * Add new equipment or maintenance record
 * Body: { type: "equipment" | "maintenance", data: {...} }
 */
export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "production", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const body = await request.json();
    const { type, data } = body;

    if (type === "equipment") {
      if (!data.name || !data.type) {
        return NextResponse.json(
          { error: "Name and type are required" },
          { status: 400 }
        );
      }

      const id = `eq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const equipment: Equipment = {
        id,
        name: data.name,
        type: data.type,
        model: data.model || undefined,
        serialNumber: data.serialNumber || undefined,
        location: data.location || undefined,
        purchasedAt: data.purchasedAt || undefined,
        warrantyExpires: data.warrantyExpires || undefined,
        status: data.status || "operational",
        notes: data.notes || undefined,
        createdAt: new Date().toISOString(),
      };

      await prisma.setting.create({
        data: {
          key: `${EQUIPMENT_PREFIX}${id}`,
          value: equipment as unknown as Record<string, unknown>,
        },
      });

      logActivity({
        action: "equipment_added",
        entity: "Equipment",
        entityId: id,
        details: { name: equipment.name, type: equipment.type },
      });

      return NextResponse.json({ equipment }, { status: 201 });
    }

    if (type === "maintenance") {
      if (!data.equipmentId || !data.description || !data.performedAt) {
        return NextResponse.json(
          { error: "equipmentId, description, and performedAt are required" },
          { status: 400 }
        );
      }

      // Verify equipment exists
      const equipmentSetting = await prisma.setting.findUnique({
        where: { key: `${EQUIPMENT_PREFIX}${data.equipmentId}` },
      });
      if (!equipmentSetting) {
        return NextResponse.json(
          { error: "Equipment not found" },
          { status: 404 }
        );
      }

      const id = `mnt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const record: MaintenanceRecord = {
        id,
        equipmentId: data.equipmentId,
        type: data.type || "preventive",
        description: data.description,
        performedBy: data.performedBy || undefined,
        performedAt: data.performedAt,
        nextDueAt: data.nextDueAt || undefined,
        costCents: data.costCents || undefined,
        notes: data.notes || undefined,
        createdAt: new Date().toISOString(),
      };

      await prisma.setting.create({
        data: {
          key: `${MAINTENANCE_PREFIX}${id}`,
          value: record as unknown as Record<string, unknown>,
        },
      });

      // If equipment needs status update (e.g., marking as "maintenance")
      if (data.updateStatus) {
        const eq = equipmentSetting.value as unknown as Equipment;
        eq.status = data.updateStatus;
        await prisma.setting.update({
          where: { key: `${EQUIPMENT_PREFIX}${data.equipmentId}` },
          data: { value: eq as unknown as Record<string, unknown> },
        });
      }

      logActivity({
        action: "maintenance_recorded",
        entity: "Equipment",
        entityId: data.equipmentId,
        details: { maintenanceId: id, type: record.type },
      });

      return NextResponse.json({ maintenance: record }, { status: 201 });
    }

    return NextResponse.json(
      { error: 'Invalid type. Use "equipment" or "maintenance"' },
      { status: 400 }
    );
  } catch (error) {
    console.error("[Equipment] Error:", error);
    return NextResponse.json(
      { error: "Failed to create record" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/equipment
 * Update equipment status or details
 * Body: { id, ...fields }
 */
export async function PATCH(request: NextRequest) {
  const auth = await requirePermission(request, "production", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const key = `${EQUIPMENT_PREFIX}${id}`;
    const setting = await prisma.setting.findUnique({ where: { key } });
    if (!setting) {
      return NextResponse.json(
        { error: "Equipment not found" },
        { status: 404 }
      );
    }

    const equipment = setting.value as unknown as Equipment;
    const updated = { ...equipment, ...updates };

    await prisma.setting.update({
      where: { key },
      data: { value: updated as unknown as Record<string, unknown> },
    });

    logActivity({
      action: "equipment_updated",
      entity: "Equipment",
      entityId: id,
      details: updates,
    });

    return NextResponse.json({ equipment: updated });
  } catch (error) {
    console.error("[Equipment] Error:", error);
    return NextResponse.json(
      { error: "Failed to update equipment" },
      { status: 500 }
    );
  }
}
