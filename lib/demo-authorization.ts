import type { DemoRole } from "@/lib/demo-fixtures";
import type { GrowthCycle } from "@/lib/growth-cycle";

export type ActorContext = {
  personaId: string;
  userId: string;
  organizationId: string;
  membershipId: string;
  role: DemoRole;
  assurance: "synthetic_demo";
  adultConfirmed: true;
};

export type GrowthCapability =
  | "manage_mapping"
  | "plan_instruction"
  | "submit_evidence"
  | "review_evidence"
  | "read_family_brief"
  | "respond_to_family_brief"
  | "view_aggregate_operations";

const broadCapabilities: Record<DemoRole, GrowthCapability[]> = {
  tenant_admin: ["manage_mapping", "view_aggregate_operations"],
  teacher: ["plan_instruction", "review_evidence"],
  student: ["submit_evidence"],
  guardian: ["read_family_brief", "respond_to_family_brief"],
};

export function actorHasCapability(
  actor: ActorContext,
  capability: GrowthCapability,
): boolean {
  return broadCapabilities[actor.role].includes(capability);
}

export function canAccessGrowthCycle(
  actor: ActorContext,
  cycle: GrowthCycle,
  capability: GrowthCapability,
): boolean {
  if (
    actor.organizationId !== cycle.organizationId ||
    !actorHasCapability(actor, capability)
  ) {
    return false;
  }

  if (actor.role === "teacher") return cycle.mapping.teacherAssigned;
  if (actor.role === "student") return cycle.mapping.studentEnrolled;
  if (actor.role === "guardian") return cycle.mapping.guardianLinked;
  return actor.role === "tenant_admin";
}
