import { z } from "zod";

export const LocaleSchema = z.enum(["en", "ml"]);
export const ScaffoldLevelSchema = z.enum(["guided", "light", "independent"]);
export const RightsBasisSchema = z.enum([
  "original",
  "cc_by_4_0",
  "public_domain",
  "written_permission",
]);
export const SourceReferenceSchema = z.string().regex(/^SEC-\d{3}$/u);

const shortText = (minimum: number, maximum: number) =>
  z.string().trim().min(minimum).max(maximum);

const httpSourceUrl = z
  .url()
  .max(500)
  .refine((value) => {
    if (!URL.canParse(value)) return false;
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  }, "Use an HTTP or HTTPS source link.");

const citedText = z
  .object({
    sourceSectionIds: z.array(SourceReferenceSchema).min(1).max(4),
  })
  .strict();

export const LearningSequenceStepSchema = citedText
  .extend({
    phase: z.enum(["notice", "explore", "make", "explain", "reflect"]),
    title: shortText(3, 80),
    teacherMove: shortText(12, 280),
    learnerMove: shortText(12, 280),
    minutes: z.number().int().min(2).max(40),
  })
  .strict();

export const DifferentiationMoveSchema = citedText
  .extend({
    learnerNeed: z.enum([
      "concrete_start",
      "language_bridge",
      "attention_structure",
      "ready_for_extension",
    ]),
    teacherMove: shortText(12, 300),
    learnerChoice: shortText(8, 220),
  })
  .strict();

export const MisconceptionProbeSchema = citedText
  .extend({
    ideaToCheck: shortText(8, 220),
    probe: shortText(8, 240),
    teacherResponse: shortText(12, 280),
  })
  .strict();

export const QuickCheckSchema = citedText
  .extend({
    prompt: shortText(8, 260),
    evidenceToNotice: shortText(8, 240),
  })
  .strict();

export const InterestHookSchema = z
  .object({
    title: shortText(3, 70),
    prompt: shortText(10, 260),
  })
  .strict();

export const MakerChoiceSchema = z
  .object({
    id: z.string().regex(/^make_[a-z0-9_]{3,40}$/u),
    title: shortText(3, 80),
    prompt: shortText(15, 320),
    constraints: z.array(shortText(4, 140)).min(2).max(4),
    evidenceToCapture: shortText(8, 220),
  })
  .strict();

export const TeacherPlanSchema = z
  .object({
    schemaVersion: z.literal("teacher-plan-v1"),
    overview: shortText(20, 320),
    successCriteria: z.array(shortText(8, 180)).min(2).max(4),
    learningSequence: z.array(LearningSequenceStepSchema).min(3).max(6),
    differentiation: z.array(DifferentiationMoveSchema).min(3).max(4),
    misconceptions: z.array(MisconceptionProbeSchema).min(2).max(4),
    quickChecks: z.array(QuickCheckSchema).min(2).max(4),
    interestHooks: z.array(InterestHookSchema).min(2).max(4),
    makerChoices: z.array(MakerChoiceSchema).min(2).max(3),
    socraticPrompts: z.array(shortText(8, 220)).min(3).max(6),
    reflectionPrompts: z.array(shortText(8, 220)).min(2).max(4),
    familyActivity: shortText(30, 700),
    familyLocale: LocaleSchema,
    sourceSectionIds: z.array(SourceReferenceSchema).min(1).max(8),
  })
  .strict();

export type TeacherPlan = z.infer<typeof TeacherPlanSchema>;

export const CurriculumPackInputSchema = z
  .object({
    title: shortText(4, 180),
    subject: shortText(2, 80),
    gradeLabel: z.enum(["Class 6", "Class 7", "Class 8", "Class 9"]),
    version: shortText(1, 40),
    rightsBasis: RightsBasisSchema,
    sourceUrl: z.union([httpSourceUrl, z.literal("")]),
    sourceText: shortText(300, 30_000),
    locale: LocaleSchema,
    rightsConfirmed: z.literal("yes"),
  })
  .strict();

export type CurriculumPackInput = z.infer<typeof CurriculumPackInputSchema>;

export const CreateStudioInputSchema = z
  .object({
    studentMembershipId: z.string().trim().min(8).max(40),
    title: shortText(4, 160),
    subject: shortText(2, 80),
    gradeLabel: z.enum(["Class 6", "Class 7", "Class 8", "Class 9"]),
    goal: shortText(20, 320),
    drivingQuestion: shortText(15, 300),
    familyLocale: LocaleSchema,
    sourceMode: z.enum(["school_library", "teacher_source"]).default("teacher_source"),
    curriculumPackId: z.union([z.string().trim().min(8).max(40), z.literal("")]).default(""),
    packTitle: z.string().trim().max(180).default(""),
    packVersion: z.string().trim().max(40).default(""),
    rightsBasis: z.union([RightsBasisSchema, z.literal("")]).default(""),
    sourceUrl: z.union([httpSourceUrl, z.literal("")]).default(""),
    sourceText: z.string().trim().max(30_000).default(""),
    rightsConfirmed: z.union([z.literal("yes"), z.literal("")]).default(""),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.sourceMode === "school_library") {
      if (!value.curriculumPackId) {
        context.addIssue({
          code: "custom",
          path: ["curriculumPackId"],
          message: "Choose an active school curriculum pack.",
        });
      }
      return;
    }
    if (value.packTitle.length < 4) {
      context.addIssue({ code: "custom", path: ["packTitle"], message: "Add a source title." });
    }
    if (value.packVersion.length < 1) {
      context.addIssue({ code: "custom", path: ["packVersion"], message: "Add a source version." });
    }
    if (!RightsBasisSchema.safeParse(value.rightsBasis).success) {
      context.addIssue({ code: "custom", path: ["rightsBasis"], message: "Choose a permission basis." });
    }
    if (value.sourceText.length < 300) {
      context.addIssue({
        code: "custom",
        path: ["sourceText"],
        message: "Add at least 300 characters of permission-safe curriculum text.",
      });
    }
    if (value.rightsConfirmed !== "yes") {
      context.addIssue({
        code: "custom",
        path: ["rightsConfirmed"],
        message: "Confirm that Kanni may store this source.",
      });
    }
  });

export type CreateStudioInput = z.infer<typeof CreateStudioInputSchema>;

export const LearnerSubmissionSchema = z
  .object({
    interestHookIndex: z.coerce.number().int().min(0).max(3),
    makerChoiceId: z.string().regex(/^make_[a-z0-9_]{3,40}$/u),
    prediction: shortText(20, 800),
    firstDraft: shortText(60, 2_000),
    selfCritique: shortText(25, 900),
    revision: shortText(60, 2_000),
    explanation: shortText(40, 1_200),
    reflection: shortText(20, 700),
    supportOpened: z.coerce.boolean(),
  })
  .strict();

export type LearnerSubmissionInput = z.infer<typeof LearnerSubmissionSchema>;

export const StudentThinkingStepSchema = citedText
  .extend({
    title: shortText(3, 70),
    question: shortText(10, 220),
    tryThis: shortText(10, 220),
  })
  .strict();

export const StudentThinkingCoachSchema = z
  .object({
    schemaVersion: z.literal("student-thinking-coach-v1"),
    opening: shortText(10, 180),
    creativeSteps: z.array(StudentThinkingStepSchema).min(3).max(4),
    selfCheck: shortText(10, 220),
    sourceSectionIds: z.array(SourceReferenceSchema).min(1).max(6),
  })
  .strict();

export type StudentThinkingCoach = z.infer<typeof StudentThinkingCoachSchema>;

export const StudentHelpRequestSchema = z
  .object({
    studioId: z.string().trim().min(8).max(40),
    firstDraft: shortText(60, 2_000),
    adultSupervisionConfirmed: z.literal("yes"),
  })
  .strict();

export const TeacherReviewInputSchema = z
  .object({
    noticedStrength: shortText(20, 500),
    studentFeedback: shortText(20, 700),
    nextQuestion: shortText(10, 300),
    nextScaffoldLevel: ScaffoldLevelSchema,
    familyActivity: shortText(30, 700),
    reviewedEvidence: z.literal("yes"),
  })
  .strict();

export type TeacherReviewInput = z.infer<typeof TeacherReviewInputSchema>;

export const FamilyResponseInputSchema = z
  .object({
    response: z.enum(["tried", "need_another_idea", "contact_teacher"]),
    note: z.string().trim().max(400),
  })
  .strict();

export type FamilyResponseInput = z.infer<typeof FamilyResponseInputSchema>;

export const TeacherPlanEditorInputSchema = z
  .object({
    overview: shortText(20, 320),
    successCriteria: z.array(shortText(8, 180)).min(2).max(4),
    learningSequence: z.array(LearningSequenceStepSchema).min(3).max(6),
    differentiation: z.array(DifferentiationMoveSchema).min(3).max(4),
    misconceptions: z.array(MisconceptionProbeSchema).min(2).max(4),
    quickChecks: z.array(QuickCheckSchema).min(2).max(4),
    interestHooks: z.array(InterestHookSchema).min(2).max(4),
    makerChoices: z.array(MakerChoiceSchema).min(2).max(3),
    socraticPrompts: z.array(shortText(8, 220)).min(3).max(6),
    reflectionPrompts: z.array(shortText(8, 220)).min(2).max(4),
    familyActivity: shortText(30, 700),
    familyLocale: LocaleSchema,
    sourceSectionIds: z.array(SourceReferenceSchema).min(1).max(8),
  })
  .strict();

export function parseTeacherPlan(value: unknown): TeacherPlan | null {
  const parsed = TeacherPlanSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
