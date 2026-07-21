import { SchoolRole } from "@prisma/client";

export type SchoolCapability =
  | "manage_people"
  | "manage_mapping"
  | "manage_curriculum"
  | "create_studio"
  | "edit_studio_plan"
  | "draft_with_ai"
  | "publish_studio"
  | "edit_own_work"
  | "request_student_help"
  | "submit_work"
  | "review_work"
  | "edit_family_response"
  | "respond_to_family_activity";

const roleCapabilities: Record<SchoolRole, readonly SchoolCapability[]> = {
  school_admin: ["manage_people", "manage_mapping", "manage_curriculum"],
  teacher: ["create_studio", "edit_studio_plan", "draft_with_ai", "publish_studio", "review_work"],
  student: ["edit_own_work", "request_student_help", "submit_work"],
  parent: ["edit_family_response", "respond_to_family_activity"],
};

export function roleCan(
  role: SchoolRole,
  capability: SchoolCapability,
): boolean {
  return roleCapabilities[role].includes(capability);
}

export type StudioInformation =
  | "school_people"
  | "curriculum_source"
  | "teacher_plan"
  | "student_raw_work"
  | "student_ai_help"
  | "teacher_feedback"
  | "family_activity"
  | "family_response"
  | "ai_usage_summary";

const visibleInformation: Record<SchoolRole, readonly StudioInformation[]> = {
  school_admin: ["school_people", "family_response", "ai_usage_summary"],
  teacher: [
    "curriculum_source",
    "teacher_plan",
    "student_raw_work",
    "student_ai_help",
    "teacher_feedback",
    "family_activity",
    "family_response",
    "ai_usage_summary",
  ],
  student: ["curriculum_source", "teacher_plan", "student_raw_work", "student_ai_help", "teacher_feedback"],
  parent: ["family_activity", "family_response"],
};

export function roleCanSee(
  role: SchoolRole,
  information: StudioInformation,
): boolean {
  return visibleInformation[role].includes(information);
}
