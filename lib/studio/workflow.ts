import type { TeacherPlan } from "@/lib/studio/contracts";

export const STUDIO_STATUSES = [
  "planning",
  "ready_for_student",
  "awaiting_teacher_review",
  "ready_for_family",
  "complete",
  "archived",
] as const;

export type StudioStatusValue = (typeof STUDIO_STATUSES)[number];
export type ScaffoldLevelValue = "guided" | "light" | "independent";
export type PlanOriginValue = "teacher_authored" | "gpt_5_6";

const transitions: Record<StudioStatusValue, readonly StudioStatusValue[]> = {
  planning: ["ready_for_student", "archived"],
  ready_for_student: ["awaiting_teacher_review", "archived"],
  awaiting_teacher_review: ["ready_for_family", "archived"],
  ready_for_family: ["complete", "archived"],
  complete: ["archived"],
  archived: [],
};

export function canTransitionStudio(
  current: StudioStatusValue,
  next: StudioStatusValue,
): boolean {
  return transitions[current].includes(next);
}

export function promptsForScaffold(
  plan: TeacherPlan,
  level: ScaffoldLevelValue,
): string[] {
  if (level === "independent") return [];
  if (level === "light") return plan.socraticPrompts.slice(0, 1);
  return plan.socraticPrompts.slice(0, 3);
}

export function nextScaffoldSuggestion(
  current: ScaffoldLevelValue,
  supportOpened: boolean,
): ScaffoldLevelValue {
  if (supportOpened) return current;
  if (current === "guided") return "light";
  if (current === "light") return "independent";
  return "independent";
}

export function studioProgress(status: StudioStatusValue): number {
  const progress: Record<StudioStatusValue, number> = {
    planning: 1,
    ready_for_student: 2,
    awaiting_teacher_review: 3,
    ready_for_family: 4,
    complete: 5,
    archived: 0,
  };
  return progress[status];
}

export function planOriginLabel(
  origin: PlanOriginValue,
  teacherReviewed: boolean,
): string {
  if (origin === "teacher_authored") return "Teacher-owned starting plan";
  return teacherReviewed
    ? "GPT-5.6 draft, teacher reviewed"
    : "GPT-5.6 draft, awaiting teacher review";
}
