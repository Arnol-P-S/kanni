import { z } from "zod";

export const FamilyLanguageSchema = z.enum(["en", "ml"]);
export type FamilyLanguage = z.infer<typeof FamilyLanguageSchema>;

export const SupportStrategySchema = z.enum([
  "fraction_strips",
  "guided_questions",
  "explain_to_someone",
]);
export type SupportStrategy = z.infer<typeof SupportStrategySchema>;

export const FractionAnswerSchema = z.enum(["one_half", "one_quarter"]);
export type FractionAnswer = z.infer<typeof FractionAnswerSchema>;

export const ExplanationChoiceSchema = z.enum([
  "same_whole_more_equal_parts",
  "four_is_bigger",
  "not_sure",
]);
export type ExplanationChoice = z.infer<typeof ExplanationChoiceSchema>;

export const FamilyResponseSchema = z.enum([
  "not_sent",
  "tried",
  "need_another_idea",
  "contact_teacher",
]);
export type FamilyResponse = z.infer<typeof FamilyResponseSchema>;

export const SourceSectionIdSchema = z.enum([
  "fractions-goal",
  "fractions-visual",
  "fractions-misconceptions",
  "fractions-home",
]);

export const MisconceptionIdSchema = z.enum([
  "denominator_size",
  "whole_size",
  "compare_digits",
]);

const ShortText = z.string().trim().min(1).max(220);

export const TeacherPlanDraftSchema = z
  .object({
    successCriteria: z.array(ShortText).min(2).max(3),
    learningSequence: z.array(ShortText).min(3).max(4),
    misconceptionIds: z.array(MisconceptionIdSchema).min(1).max(3),
    quickCheck: z.string().trim().min(1).max(260),
    familyDraft: z.string().trim().min(1).max(340),
    sourceSectionIds: z.array(SourceSectionIdSchema).min(1).max(4),
  })
  .strict();
export type TeacherPlanDraft = z.infer<typeof TeacherPlanDraftSchema>;

export const StudentSupportDraftSchema = z
  .object({
    explanation: z.string().trim().min(1).max(420),
    sourceSectionIds: z.array(SourceSectionIdSchema).min(1).max(2),
  })
  .strict();
export type StudentSupportDraft = z.infer<typeof StudentSupportDraftSchema>;

export const PROJECT_AUTHORED_PLAN: TeacherPlanDraft = {
  successCriteria: [
    "Compare one half and one quarter when the whole is the same size.",
    "Explain that more equal parts make each part smaller.",
  ],
  learningSequence: [
    "Ask for a first choice before showing a model.",
    "Compare one whole split into two and four equal parts.",
    "Ask the learner to choose again and explain the comparison.",
  ],
  misconceptionIds: ["denominator_size", "whole_size", "compare_digits"],
  quickCheck:
    "When the whole is the same size, which is larger: one third or one sixth? Explain one reason.",
  familyDraft:
    "The learner compared one half and one quarter. At home, fold two equal sheets into two and four equal parts, then compare one part from each sheet.",
  sourceSectionIds: [
    "fractions-goal",
    "fractions-visual",
    "fractions-misconceptions",
    "fractions-home",
  ],
};

export const PROJECT_AUTHORED_SUPPORT: StudentSupportDraft = {
  explanation:
    "Picture two equal paper strips. Split one into 2 equal parts and the other into 4 equal parts. One part from the strip split into 2 takes more space.",
  sourceSectionIds: ["fractions-visual"],
};

export const PROJECT_AUTHORED_SUPPORTS: Record<
  SupportStrategy,
  StudentSupportDraft
> = {
  fraction_strips: PROJECT_AUTHORED_SUPPORT,
  guided_questions: {
    explanation:
      "Check three things: Are the wholes the same size? How many equal parts does each whole have? Which single part takes more space?",
    sourceSectionIds: ["fractions-goal", "fractions-visual"],
  },
  explain_to_someone: {
    explanation:
      "Show one half and one quarter to another person. Explain that both wholes are equal, then point to the single part that takes more space.",
    sourceSectionIds: ["fractions-goal", "fractions-visual"],
  },
};

export const GrowthCycleSchema = z
  .object({
    version: z.literal(1),
    id: z.literal("growth-fractions-001"),
    organizationId: z.literal("kanni-community-school"),
    groupId: z.literal("learning-circle-a"),
    learnerId: z.literal("learner-diya"),
    mapping: z
      .object({
        teacherAssigned: z.boolean(),
        studentEnrolled: z.boolean(),
        guardianLinked: z.boolean(),
        familyLanguage: FamilyLanguageSchema,
      })
      .strict(),
    plan: z
      .object({
        status: z.enum(["draft", "published"]),
        origin: z.enum(["project_authored", "gpt_5_6"]),
        aiStatus: z.enum(["not_requested", "ready", "unavailable"]),
        draft: TeacherPlanDraftSchema,
        selectedSupport: SupportStrategySchema,
      })
      .strict(),
    student: z
      .object({
        firstAnswer: FractionAnswerSchema.nullable(),
        supportUsed: z.boolean(),
        supportOrigin: z.enum(["project_authored", "gpt_5_6"]),
        support: StudentSupportDraftSchema,
        revisedAnswer: FractionAnswerSchema.nullable(),
        explanationChoice: ExplanationChoiceSchema.nullable(),
        disagreedWithRecord: z.boolean(),
      })
      .strict(),
    teacherReview: z
      .object({
        status: z.enum(["pending", "reviewed"]),
        nextSupport: SupportStrategySchema.nullable(),
        familyBriefApproved: z.boolean(),
      })
      .strict(),
    family: z
      .object({
        response: FamilyResponseSchema,
      })
      .strict(),
    updatedAt: z.string().datetime(),
  })
  .strict();
export type GrowthCycle = z.infer<typeof GrowthCycleSchema>;

export function createGrowthCycle(
  now = new Date("2026-07-17T08:00:00.000Z"),
): GrowthCycle {
  return GrowthCycleSchema.parse({
    version: 1,
    id: "growth-fractions-001",
    organizationId: "kanni-community-school",
    groupId: "learning-circle-a",
    learnerId: "learner-diya",
    mapping: {
      teacherAssigned: false,
      studentEnrolled: false,
      guardianLinked: false,
      familyLanguage: "ml",
    },
    plan: {
      status: "draft",
      origin: "project_authored",
      aiStatus: "not_requested",
      draft: PROJECT_AUTHORED_PLAN,
      selectedSupport: "fraction_strips",
    },
    student: {
      firstAnswer: null,
      supportUsed: false,
      supportOrigin: "project_authored",
      support: PROJECT_AUTHORED_SUPPORT,
      revisedAnswer: null,
      explanationChoice: null,
      disagreedWithRecord: false,
    },
    teacherReview: {
      status: "pending",
      nextSupport: null,
      familyBriefApproved: false,
    },
    family: { response: "not_sent" },
    updatedAt: now.toISOString(),
  });
}

function withTimestamp(
  cycle: GrowthCycle,
  patch: Partial<GrowthCycle>,
  now = new Date(),
): GrowthCycle {
  return GrowthCycleSchema.parse({
    ...cycle,
    ...patch,
    updatedAt: now.toISOString(),
  });
}

export function hasCompleteSupportCircle(cycle: GrowthCycle): boolean {
  return (
    cycle.mapping.teacherAssigned &&
    cycle.mapping.studentEnrolled &&
    cycle.mapping.guardianLinked
  );
}

export function mapSupportCircle(
  cycle: GrowthCycle,
  familyLanguage: FamilyLanguage,
  now = new Date(),
): GrowthCycle {
  return withTimestamp(
    cycle,
    {
      mapping: {
        teacherAssigned: true,
        studentEnrolled: true,
        guardianLinked: true,
        familyLanguage,
      },
    },
    now,
  );
}

export function setTeacherPlanDraft(
  cycle: GrowthCycle,
  draft: TeacherPlanDraft,
  origin: "project_authored" | "gpt_5_6",
  aiStatus: GrowthCycle["plan"]["aiStatus"],
  now = new Date(),
): GrowthCycle {
  if (cycle.plan.status === "published") return cycle;
  return withTimestamp(
    cycle,
    { plan: { ...cycle.plan, draft, origin, aiStatus } },
    now,
  );
}

export function publishTeacherPlan(
  cycle: GrowthCycle,
  selectedSupport: SupportStrategy,
  now = new Date(),
): GrowthCycle {
  if (!hasCompleteSupportCircle(cycle)) {
    throw new Error("The support circle must be mapped before publishing.");
  }
  if (cycle.plan.status === "published") return cycle;
  return withTimestamp(
    cycle,
    { plan: { ...cycle.plan, status: "published", selectedSupport } },
    now,
  );
}

export function recordFirstAnswer(
  cycle: GrowthCycle,
  answer: FractionAnswer,
  now = new Date(),
): GrowthCycle {
  if (cycle.plan.status !== "published") {
    throw new Error("The teacher must publish the plan first.");
  }
  if (cycle.student.firstAnswer) return cycle;
  return withTimestamp(
    cycle,
    { student: { ...cycle.student, firstAnswer: answer } },
    now,
  );
}

export function recordSupportUsed(
  cycle: GrowthCycle,
  support: StudentSupportDraft,
  origin: "project_authored" | "gpt_5_6",
  now = new Date(),
): GrowthCycle {
  if (!cycle.student.firstAnswer) {
    throw new Error("A first answer is required before support.");
  }
  if (cycle.student.supportUsed) return cycle;
  return withTimestamp(
    cycle,
    {
      student: {
        ...cycle.student,
        supportUsed: true,
        support,
        supportOrigin: origin,
      },
    },
    now,
  );
}

export function recordRevision(
  cycle: GrowthCycle,
  revisedAnswer: FractionAnswer,
  explanationChoice: ExplanationChoice,
  now = new Date(),
): GrowthCycle {
  if (!cycle.student.firstAnswer) {
    throw new Error("A first answer is required before a revision.");
  }
  if (!cycle.student.supportUsed) {
    throw new Error("Support must be opened before a revision.");
  }
  if (cycle.student.revisedAnswer) return cycle;
  return withTimestamp(
    cycle,
    {
      student: {
        ...cycle.student,
        revisedAnswer,
        explanationChoice,
      },
    },
    now,
  );
}

export function flagStudentDisagreement(
  cycle: GrowthCycle,
  now = new Date(),
): GrowthCycle {
  if (!cycle.student.revisedAnswer || !cycle.student.explanationChoice) {
    throw new Error("Completed evidence is required before requesting a review.");
  }
  if (cycle.student.disagreedWithRecord) return cycle;
  return withTimestamp(
    cycle,
    { student: { ...cycle.student, disagreedWithRecord: true } },
    now,
  );
}

export function reviewStudentEvidence(
  cycle: GrowthCycle,
  nextSupport: SupportStrategy,
  now = new Date(),
): GrowthCycle {
  if (!cycle.student.revisedAnswer || !cycle.student.explanationChoice) {
    throw new Error("Student evidence must be complete before review.");
  }
  if (cycle.teacherReview.status === "reviewed") return cycle;
  return withTimestamp(
    cycle,
    {
      teacherReview: {
        status: "reviewed",
        nextSupport,
        familyBriefApproved: true,
      },
    },
    now,
  );
}

export function recordFamilyResponse(
  cycle: GrowthCycle,
  response: Exclude<FamilyResponse, "not_sent">,
  now = new Date(),
): GrowthCycle {
  if (!cycle.teacherReview.familyBriefApproved) {
    throw new Error("The teacher must approve the family brief first.");
  }
  if (cycle.family.response !== "not_sent") return cycle;
  return withTimestamp(cycle, { family: { response } }, now);
}

export const misconceptionLabels: Record<
  z.infer<typeof MisconceptionIdSchema>,
  string
> = {
  denominator_size: "A larger denominator means a larger part.",
  whole_size: "The comparison works even when the wholes differ.",
  compare_digits: "The digits can be compared without using the fraction model.",
};

export const supportLabels: Record<SupportStrategy, string> = {
  fraction_strips: "Use fraction strips",
  guided_questions: "Ask guided comparison questions",
  explain_to_someone: "Ask the learner to explain to someone",
};
