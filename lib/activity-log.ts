import { prisma } from "@/lib/prisma";

interface LogActivityParams {
  action: string;
  entity: string;
  entityId?: string;
  actor?: string;
  details?: Record<string, unknown>;
}

export async function logActivity({
  action,
  entity,
  entityId,
  actor = "admin",
  details,
}: LogActivityParams): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        action,
        entity,
        entityId: entityId ?? null,
        actor,
        details: details ?? null,
      },
    });
  } catch (err) {
    console.error("[ActivityLog] Failed to write log:", err);
  }
}
