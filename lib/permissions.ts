import { SchoolRole } from "@prisma/client";

export type SchoolCapability =
  | "manage_school"
  | "plan_instruction"
  | "review_evidence"
  | "submit_evidence"
  | "respond_to_family_activity";

const roleCapabilities: Record<SchoolRole, readonly SchoolCapability[]> = {
  school_admin: ["manage_school"],
  teacher: ["plan_instruction", "review_evidence"],
  student: ["submit_evidence"],
  parent: ["respond_to_family_activity"],
};

export function roleCan(
  role: SchoolRole,
  capability: SchoolCapability,
): boolean {
  return roleCapabilities[role].includes(capability);
}

export type CycleInformation =
  | "school_members"
  | "teacher_plan"
  | "student_evidence"
  | "family_activity"
  | "family_response";

const visibleInformation: Record<SchoolRole, readonly CycleInformation[]> = {
  school_admin: ["school_members", "family_response"],
  teacher: ["teacher_plan", "student_evidence", "family_response"],
  student: ["teacher_plan", "student_evidence", "family_activity"],
  parent: ["family_activity", "family_response"],
};

export function roleCanSee(
  role: SchoolRole,
  information: CycleInformation,
): boolean {
  return visibleInformation[role].includes(information);
}
