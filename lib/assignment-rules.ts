import { prisma } from "@/lib/prisma";

interface RuleConditions {
  productType?: string;
  material?: string;
  minQuantity?: number;
  maxQuantity?: number;
  priority?: string;
}

interface RuleAction {
  factoryId: string;
  assignedTo?: string;
  autoPriority?: string;
}

export async function applyAssignmentRules(jobId: string): Promise<boolean> {
  try {
    // 1. Get job with orderItem details
    const job = await prisma.productionJob.findUnique({
      where: { id: jobId },
      include: {
        orderItem: {
          include: { order: true }
        }
      }
    });

    if (!job || job.factoryId) {
      // Already assigned or not found
      return false;
    }

    // 2. Get all active rules sorted by priority (lower number = higher priority)
    const rules = await prisma.assignmentRule.findMany({
      where: { isActive: true },
      orderBy: { priority: "asc" }
    });

    // 3. Match first rule
    for (const rule of rules) {
      const conditions = rule.conditions as RuleConditions;
      const action = rule.action as RuleAction;
      const orderItem = job.orderItem;

      if (matchesConditions(orderItem, job, conditions)) {
        // Apply the rule
        await prisma.productionJob.update({
          where: { id: jobId },
          data: {
            factoryId: action.factoryId,
            assignedTo: action.assignedTo || null,
            priority: (action.autoPriority as any) || job.priority,
            status: "assigned"
          }
        });

        // Create event
        await prisma.jobEvent.create({
          data: {
            jobId,
            type: "auto_assigned",
            payload: {
              ruleId: rule.id,
              ruleName: rule.name,
              factoryId: action.factoryId
            }
          }
        });

        // Update rule trigger count
        await prisma.assignmentRule.update({
          where: { id: rule.id },
          data: {
            triggerCount: { increment: 1 },
            lastTriggered: new Date()
          }
        });

        console.log(`[AutoAssign] Job ${jobId} assigned by rule: ${rule.name}`);
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("[AutoAssign] Error:", error);
    return false;
  }
}

function matchesConditions(orderItem: any, job: any, conditions: RuleConditions): boolean {
  if (conditions.productType && orderItem.productType !== conditions.productType) return false;
  if (conditions.material && orderItem.material !== conditions.material) return false;
  if (conditions.minQuantity != null && orderItem.quantity < conditions.minQuantity) return false;
  if (conditions.maxQuantity != null && orderItem.quantity > conditions.maxQuantity) return false;
  if (conditions.priority && job.priority !== conditions.priority) return false;
  return true;
}
