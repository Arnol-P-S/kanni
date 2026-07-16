import { z } from "zod";

export const LessonIdSchema = z.enum([
  "math-add-within-10",
  "cs-linear-search",
]);
export type LessonId = z.infer<typeof LessonIdSchema>;

export const LanguageSchema = z.enum(["ml", "en"]);
export type Language = z.infer<typeof LanguageSchema>;

export const AiProviderSchema = z.enum([
  "disabled",
  "vercel_gateway",
  "openai_direct",
]);
export type AiProvider = z.infer<typeof AiProviderSchema>;

export const AiCapabilityReasonSchema = z.enum([
  "available",
  "disabled_by_flag",
  "provider_disabled",
  "provider_policy_blocked",
  "provider_not_implemented",
  "provider_misconfigured",
  "missing_credentials",
  "missing_adult_gate",
  "health_unavailable",
]);
export type AiCapabilityReason = z.infer<
  typeof AiCapabilityReasonSchema
>;

export const PublicAiCapabilitySchema = z
  .object({
    available: z.boolean(),
    deepCheckAvailable: z.boolean(),
    provider: AiProviderSchema,
    reason: AiCapabilityReasonSchema,
  })
  .strict();
export type PublicAiCapability = z.infer<
  typeof PublicAiCapabilitySchema
>;

export const TutorStatusSchema = z.enum([
  "grounded",
  "unsupported",
  "safety_redirect",
  "unavailable",
]);
export type TutorStatus = z.infer<typeof TutorStatusSchema>;

export const ActivityObservationSchema = z.enum([
  "not_assessed",
  "correct_first_try",
  "correct_after_hint",
  "try_again",
]);
export type ActivityObservation = z.infer<
  typeof ActivityObservationSchema
>;

export const TeacherStrategySchema = z.enum([
  "use_objects",
  "use_number_line",
  "use_smaller_numbers",
  "use_trace_table",
  "show_worked_example",
  "ask_learner_to_explain",
]);
export type TeacherStrategy = z.infer<typeof TeacherStrategySchema>;

export const MathTeacherStrategySchema = z.enum([
  "use_objects",
  "use_number_line",
  "use_smaller_numbers",
]);
export type MathTeacherStrategy = z.infer<typeof MathTeacherStrategySchema>;

export const GuidedQuestionIdSchema = z.enum([
  "math-join-2-3",
  "math-objects-3-1",
  "math-number-line-4-2",
  "math-smaller-1-2",
  "math-check-2-3",
]);
export type GuidedQuestionId = z.infer<typeof GuidedQuestionIdSchema>;

export const GuidedAnswerIdSchema = z.enum([
  "math-join-2-3-answer-4",
  "math-join-2-3-answer-5",
  "math-join-2-3-answer-6",
  "math-objects-3-1-answer-3",
  "math-objects-3-1-answer-4",
  "math-objects-3-1-answer-5",
  "math-number-line-4-2-answer-5",
  "math-number-line-4-2-answer-6",
  "math-number-line-4-2-answer-7",
  "math-smaller-1-2-answer-2",
  "math-smaller-1-2-answer-3",
  "math-smaller-1-2-answer-4",
  "math-check-2-3-answer-6",
]);
export type GuidedAnswerId = z.infer<typeof GuidedAnswerIdSchema>;

export function countUnicodeCodePoints(value: string): number {
  return Array.from(value.normalize("NFC")).length;
}

export const ReviewStateSchema = z.enum([
  "pending_review",
  "approved",
  "corrected",
]);
export type ReviewState = z.infer<typeof ReviewStateSchema>;

export const AttemptSchema = z
  .object({
    questionId: z.string().min(1),
    selectedOptionId: z.string().min(1),
    correct: z.boolean(),
  })
  .strict();
export type Attempt = z.infer<typeof AttemptSchema>;

export const MAX_STORED_ATTEMPTS = 12;

export const LearningRecordSchema = z
  .object({
    attemptId: z.string().min(1),
    profileId: z.enum(["demo-class-1", "demo-class-11"]),
    lessonId: LessonIdSchema,
    attempts: z.array(AttemptSchema).max(MAX_STORED_ATTEMPTS),
    observation: ActivityObservationSchema,
    hintUsed: z.boolean(),
    possibleConfusionCode: z.string().nullable(),
    reviewState: ReviewStateSchema,
    teacherStrategy: TeacherStrategySchema.nullable(),
    updatedAt: z.string().datetime(),
  })
  .strict()
  .superRefine((record, context) => {
    const isMath = record.lessonId === "math-add-within-10";
    const expectedProfile = isMath ? "demo-class-1" : "demo-class-11";
    if (record.profileId !== expectedProfile) {
      context.addIssue({
        code: "custom",
        message: "The synthetic profile must match the lesson.",
        path: ["profileId"],
      });
    }

    if (!record.teacherStrategy) return;
    const strategyMatchesLesson = isMath
      ? MathTeacherStrategySchema.safeParse(record.teacherStrategy).success
      : !MathTeacherStrategySchema.safeParse(record.teacherStrategy).success;
    if (!strategyMatchesLesson) {
      context.addIssue({
        code: "custom",
        message: "The teacher strategy must match the lesson.",
        path: ["teacherStrategy"],
      });
    }
  });
export type LearningRecord = z.infer<typeof LearningRecordSchema>;

export const SourceEntrySchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    author: z.string().min(1),
    usage: z.enum(["ingested", "link_only"]),
    rightsBasis: z.enum([
      "original",
      "cc_by_4_0",
      "public_domain",
      "written_permission",
      "unknown",
    ]),
    license: z.string().nullable(),
    url: z.string().url().nullable(),
    version: z.string().min(1),
    retrievedAt: z.string().datetime(),
    reviewedAt: z.string().datetime().nullable(),
    checksum: z.string().nullable(),
  })
  .strict()
  .superRefine((source, context) => {
    if (source.usage === "ingested" && source.rightsBasis === "unknown") {
      context.addIssue({
        code: "custom",
        message: "Content with unknown rights must remain link-only.",
        path: ["rightsBasis"],
      });
    }
  });
export type SourceEntry = z.infer<typeof SourceEntrySchema>;

const GuidedHintRequestSchema = z
  .object({
    lessonId: z.literal("math-add-within-10"),
    language: LanguageSchema,
    mode: z.literal("guided_hint"),
    questionId: GuidedQuestionIdSchema,
    selectedAnswerId: GuidedAnswerIdSchema,
    teacherStrategy: MathTeacherStrategySchema.optional(),
    deepCheck: z.literal(false).optional().default(false),
  })
  .strict();

const CustomQuestionRequestSchema = z
  .object({
    lessonId: z.literal("cs-linear-search"),
    language: LanguageSchema,
    mode: z.literal("custom_question"),
    prompt: z
      .string()
      .trim()
      .min(1)
      .refine((value) => countUnicodeCodePoints(value) <= 400, {
        message: "Custom questions must contain at most 400 Unicode code points.",
      }),
    deepCheck: z.boolean().optional().default(false),
  })
  .strict();

export const TutorRequestSchema = z.discriminatedUnion("mode", [
  GuidedHintRequestSchema,
  CustomQuestionRequestSchema,
]);
export type TutorRequest = z.infer<typeof TutorRequestSchema>;

export const TutorModelOutputSchema = z
  .object({
    explanation: z.string().min(1).max(1400),
    steps: z.array(z.string().min(1).max(280)).max(5),
    hint: z.string().min(1).max(400).nullable(),
    recommendedCheckId: z.string().nullable(),
    sourceSectionIds: z.array(z.string().min(1)).min(1).max(5),
    possibleConfusionCode: z.string().nullable(),
  })
  .strict();
export type TutorModelOutput = z.infer<typeof TutorModelOutputSchema>;

export const CriticOutputSchema = z
  .object({
    result: z.enum(["pass", "warning"]),
    issueCodes: z.array(z.string()).max(4),
  })
  .strict();
export type CriticOutput = z.infer<typeof CriticOutputSchema>;

export const TutorResponseSchema = z
  .object({
    status: TutorStatusSchema,
    explanation: z.string(),
    steps: z.array(z.string()),
    hint: z.string().nullable(),
    recommendedCheckId: z.string().nullable(),
    sourceSectionIds: z.array(z.string()),
    possibleConfusionCode: z.string().nullable(),
    trust: z
      .object({
        sourceMatched: z.boolean(),
        citationIdsValid: z.boolean(),
        ageFormatChecked: z.boolean(),
        safetyRoute: z.enum(["clear", "static_redirect"]),
        contentOrigin: z.enum(["project_authored", "model_generated"]),
      })
      .strict(),
    deepCheck: z
      .object({
        sourceCritic: z.enum(["pass", "warning", "unavailable"]),
        teachingCritic: z.enum(["pass", "warning", "unavailable"]),
        issueCodes: z.array(z.string()),
      })
      .strict()
      .nullable(),
  })
  .strict();
export type TutorResponse = z.infer<typeof TutorResponseSchema>;
