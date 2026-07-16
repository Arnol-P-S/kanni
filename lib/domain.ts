import { z } from "zod";

export const LessonIdSchema = z.enum([
  "math-add-within-10",
  "cs-linear-search",
]);
export type LessonId = z.infer<typeof LessonIdSchema>;

export const LanguageSchema = z.enum(["ml", "en"]);
export type Language = z.infer<typeof LanguageSchema>;

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

export const ReviewStateSchema = z.enum([
  "pending_review",
  "approved",
  "corrected",
]);
export type ReviewState = z.infer<typeof ReviewStateSchema>;

export const AttemptSchema = z.object({
  questionId: z.string().min(1),
  selectedOptionId: z.string().min(1),
  correct: z.boolean(),
});
export type Attempt = z.infer<typeof AttemptSchema>;

export const LearningRecordSchema = z.object({
  attemptId: z.string().min(1),
  profileId: z.enum(["demo-class-1", "demo-class-11"]),
  lessonId: LessonIdSchema,
  attempts: z.array(AttemptSchema).max(12),
  observation: ActivityObservationSchema,
  hintUsed: z.boolean(),
  possibleConfusionCode: z.string().nullable(),
  reviewState: ReviewStateSchema,
  teacherStrategy: TeacherStrategySchema.nullable(),
  updatedAt: z.string().datetime(),
});
export type LearningRecord = z.infer<typeof LearningRecordSchema>;

export const SourceEntrySchema = z.object({
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
});
export type SourceEntry = z.infer<typeof SourceEntrySchema>;

export const TutorRequestSchema = z
  .object({
    lessonId: LessonIdSchema,
    language: LanguageSchema,
    mode: z.enum(["guided_hint", "custom_question"]),
    prompt: z.string().max(400).optional(),
    selectedAnswerId: z.string().max(80).optional(),
    teacherStrategy: TeacherStrategySchema.optional(),
    deepCheck: z.boolean().optional().default(false),
  })
  .superRefine((value, context) => {
    if (value.mode === "custom_question" && !value.prompt?.trim()) {
      context.addIssue({
        code: "custom",
        message: "A custom question is required.",
        path: ["prompt"],
      });
    }
    if (
      value.lessonId === "math-add-within-10" &&
      value.mode !== "guided_hint"
    ) {
      context.addIssue({
        code: "custom",
        message: "Class 1 supports guided hints only.",
        path: ["mode"],
      });
    }
    if (
      value.lessonId === "cs-linear-search" &&
      value.mode !== "custom_question"
    ) {
      context.addIssue({
        code: "custom",
        message: "Class 11 supports custom questions only.",
        path: ["mode"],
      });
    }
  });
export type TutorRequest = z.infer<typeof TutorRequestSchema>;

export const TutorModelOutputSchema = z.object({
  explanation: z.string().min(1).max(1400),
  steps: z.array(z.string().min(1).max(280)).max(5),
  hint: z.string().min(1).max(400).nullable(),
  recommendedCheckId: z.string().nullable(),
  sourceSectionIds: z.array(z.string().min(1)).min(1).max(5),
  possibleConfusionCode: z.string().nullable(),
});
export type TutorModelOutput = z.infer<typeof TutorModelOutputSchema>;

export const CriticOutputSchema = z.object({
  result: z.enum(["pass", "warning"]),
  issueCodes: z.array(z.string()).max(4),
});
export type CriticOutput = z.infer<typeof CriticOutputSchema>;

export const TutorResponseSchema = z.object({
  status: TutorStatusSchema,
  explanation: z.string(),
  steps: z.array(z.string()),
  hint: z.string().nullable(),
  recommendedCheckId: z.string().nullable(),
  sourceSectionIds: z.array(z.string()),
  possibleConfusionCode: z.string().nullable(),
  trust: z.object({
    sourceMatched: z.boolean(),
    citationIdsValid: z.boolean(),
    ageFormatChecked: z.boolean(),
    safetyRoute: z.enum(["clear", "static_redirect"]),
    humanReview: z.enum(["pending", "completed"]),
  }),
  deepCheck: z
    .object({
      sourceCritic: z.enum(["pass", "warning", "unavailable"]),
      teachingCritic: z.enum(["pass", "warning", "unavailable"]),
      issueCodes: z.array(z.string()),
    })
    .nullable(),
});
export type TutorResponse = z.infer<typeof TutorResponseSchema>;
