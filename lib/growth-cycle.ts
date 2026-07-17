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

export const MakerPathSchema = z.enum([
  "fair_share_plan",
  "fraction_pattern",
  "teach_with_objects",
]);
export type MakerPath = z.infer<typeof MakerPathSchema>;

export const ArtifactCritiqueSchema = z.enum([
  "evidence_missing",
  "whole_size_unclear",
  "explanation_unclear",
  "ready_to_test",
]);
export type ArtifactCritique = z.infer<typeof ArtifactCritiqueSchema>;

export const ScaffoldLevelSchema = z.enum(["guided", "light", "independent"]);
export type ScaffoldLevel = z.infer<typeof ScaffoldLevelSchema>;

const StudentArtifactTextSchema = z
  .string()
  .trim()
  .min(30)
  .max(600)
  .transform((value) => value.normalize("NFC"))
  .refine(
    (value) =>
      !/(?:https?:\/\/|www\.|[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[A-Za-z]{2,}|\+?\d[\d\s().-]{7,}\d)/iu.test(
        value,
      ),
    "Do not include links, email addresses, or phone numbers.",
  );

export const StudentArtifactSubmissionSchema = z
  .object({
    makerPath: MakerPathSchema,
    artifactDraft: StudentArtifactTextSchema,
    artifactCritique: ArtifactCritiqueSchema,
    artifactRevision: StudentArtifactTextSchema,
  })
  .strict();
export type StudentArtifactSubmission = z.infer<
  typeof StudentArtifactSubmissionSchema
>;

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
    agencyMove: z.string().trim().min(1).max(260),
    sourceSectionIds: z.array(SourceSectionIdSchema).min(1).max(4),
  })
  .strict();
export type TeacherPlanDraft = z.infer<typeof TeacherPlanDraftSchema>;

export const StudentSupportDraftSchema = z
  .object({
    explanation: z.string().trim().min(1).max(420),
    thinkingPrompts: z.array(ShortText).min(2).max(3),
    handoffPrompt: z.string().trim().min(1).max(220),
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
  agencyMove:
    "Ask for a prediction first, show only the selected scaffold, then ask the learner to explain what changed in their own words.",
  sourceSectionIds: [
    "fractions-goal",
    "fractions-visual",
    "fractions-misconceptions",
    "fractions-home",
  ],
};

export const PROJECT_AUTHORED_SUPPORT: StudentSupportDraft = {
  explanation:
    "Picture two equal paper strips. Split one into 2 equal parts and the other into 4 equal parts. Compare one part from each strip without changing the size of the wholes.",
  thinkingPrompts: [
    "Are both whole strips the same size?",
    "How many equal parts are in each strip?",
    "What do you notice about the space one part takes?",
  ],
  handoffPrompt:
    "Use what you noticed to choose again, then explain your reason in your own words.",
  sourceSectionIds: ["fractions-visual"],
};

export const PROJECT_AUTHORED_SUPPORTS: Record<
  SupportStrategy,
  StudentSupportDraft
> = {
  fraction_strips: PROJECT_AUTHORED_SUPPORT,
  guided_questions: {
    explanation:
      "Pause at each question and use the two equal wholes as your evidence.",
    thinkingPrompts: [
      "Are the wholes the same size?",
      "How many equal parts does each whole have?",
      "Which single part appears to take more space, and what makes you think that?",
    ],
    handoffPrompt:
      "Make a new choice only after you can point to the evidence you used.",
    sourceSectionIds: ["fractions-goal", "fractions-visual"],
  },
  explain_to_someone: {
    explanation:
      "Use two equal wholes to show one half and one quarter to another person.",
    thinkingPrompts: [
      "How will you show that the two wholes are equal?",
      "What will you point to when you compare one part from each whole?",
      "What question could the other person ask to check your reason?",
    ],
    handoffPrompt:
      "Explain your comparison without asking the other person to tell you the answer.",
    sourceSectionIds: ["fractions-goal", "fractions-visual"],
  },
};

const PROJECT_AUTHORED_SUPPORTS_ML: Record<
  SupportStrategy,
  StudentSupportDraft
> = {
  fraction_strips: {
    explanation:
      "ഒരേ വലുപ്പമുള്ള രണ്ട് പേപ്പർ സ്ട്രിപ്പുകൾ സങ്കൽപ്പിക്കുക. ഒന്നിനെ 2 തുല്യഭാഗങ്ങളായും മറ്റൊന്നിനെ 4 തുല്യഭാഗങ്ങളായും വിഭജിക്കുക. മുഴുവന്റെ വലുപ്പം മാറ്റാതെ ഓരോ സ്ട്രിപ്പിലെയും ഒരു ഭാഗം താരതമ്യം ചെയ്യുക.",
    thinkingPrompts: [
      "രണ്ട് മുഴുവൻ സ്ട്രിപ്പുകളും ഒരേ വലുപ്പമാണോ?",
      "ഓരോ സ്ട്രിപ്പിലും എത്ര തുല്യഭാഗങ്ങളുണ്ട്?",
      "ഒരു ഭാഗം എടുക്കുന്ന സ്ഥലത്തെക്കുറിച്ച് നിങ്ങൾ എന്താണ് ശ്രദ്ധിക്കുന്നത്?",
    ],
    handoffPrompt:
      "നിങ്ങൾ ശ്രദ്ധിച്ചതിന്റെ അടിസ്ഥാനത്തിൽ വീണ്ടും തിരഞ്ഞെടുക്കുക. കാരണം നിങ്ങളുടെ വാക്കുകളിൽ പറയുക.",
    sourceSectionIds: ["fractions-visual"],
  },
  guided_questions: {
    explanation:
      "ഓരോ ചോദ്യത്തിലും നിർത്തി ഒരേ വലുപ്പമുള്ള രണ്ട് മുഴുവനുകളെ നിങ്ങളുടെ തെളിവായി ഉപയോഗിക്കുക.",
    thinkingPrompts: [
      "മുഴുവനുകൾ ഒരേ വലുപ്പമാണോ?",
      "ഓരോ മുഴുവനിലും എത്ര തുല്യഭാഗങ്ങളുണ്ട്?",
      "ഏത് ഒറ്റ ഭാഗമാണ് കൂടുതൽ സ്ഥലം എടുക്കുന്നതായി തോന്നുന്നത്? അങ്ങനെ ചിന്തിക്കാൻ കാരണമെന്ത്?",
    ],
    handoffPrompt:
      "നിങ്ങൾ ഉപയോഗിച്ച തെളിവ് ചൂണ്ടിക്കാണിക്കാൻ കഴിഞ്ഞശേഷം മാത്രം പുതിയ തിരഞ്ഞെടുപ്പ് നടത്തുക.",
    sourceSectionIds: ["fractions-goal", "fractions-visual"],
  },
  explain_to_someone: {
    explanation:
      "ഒരേ വലുപ്പമുള്ള രണ്ട് മുഴുവനുകൾ ഉപയോഗിച്ച് ഒരു പകുതിയും ഒരു കാലും മറ്റൊരാൾക്ക് കാണിക്കുക.",
    thinkingPrompts: [
      "രണ്ട് മുഴുവനുകളും ഒരേ വലുപ്പമാണെന്ന് എങ്ങനെ കാണിക്കും?",
      "ഓരോ മുഴുവനിലെയും ഒരു ഭാഗം താരതമ്യം ചെയ്യുമ്പോൾ എന്താണ് ചൂണ്ടിക്കാണിക്കുക?",
      "നിങ്ങളുടെ കാരണം പരിശോധിക്കാൻ മറ്റൊരാൾക്ക് ഏത് ചോദ്യം ചോദിക്കാം?",
    ],
    handoffPrompt:
      "ഉത്തരം പറഞ്ഞുതരാൻ ആവശ്യപ്പെടാതെ നിങ്ങളുടെ താരതമ്യം വിശദീകരിക്കുക.",
    sourceSectionIds: ["fractions-goal", "fractions-visual"],
  },
};

export function getProjectAuthoredSupport(
  strategy: SupportStrategy,
  language: "en" | "ml" = "en",
): StudentSupportDraft {
  return language === "ml"
    ? PROJECT_AUTHORED_SUPPORTS_ML[strategy]
    : PROJECT_AUTHORED_SUPPORTS[strategy];
}

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
        scaffoldLevel: ScaffoldLevelSchema,
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
        makerPath: MakerPathSchema.nullable(),
        artifactDraft: z.string().nullable(),
        artifactCritique: ArtifactCritiqueSchema.nullable(),
        artifactRevision: z.string().nullable(),
        disagreedWithRecord: z.boolean(),
      })
      .strict(),
    teacherReview: z
      .object({
        status: z.enum(["pending", "reviewed"]),
        nextSupport: SupportStrategySchema.nullable(),
        nextScaffoldLevel: ScaffoldLevelSchema.nullable(),
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
      scaffoldLevel: "guided",
    },
    student: {
      firstAnswer: null,
      supportUsed: false,
      supportOrigin: "project_authored",
      support: PROJECT_AUTHORED_SUPPORT,
      revisedAnswer: null,
      explanationChoice: null,
      makerPath: null,
      artifactDraft: null,
      artifactCritique: null,
      artifactRevision: null,
      disagreedWithRecord: false,
    },
    teacherReview: {
      status: "pending",
      nextSupport: null,
      nextScaffoldLevel: null,
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
  if (!cycle.student.artifactRevision) {
    throw new Error("Create, critique, and revise the artifact first.");
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

export function recordMakerArtifact(
  cycle: GrowthCycle,
  submission: StudentArtifactSubmission,
  now = new Date(),
): GrowthCycle {
  if (!cycle.student.supportUsed) {
    throw new Error("Support must be opened before creating an artifact.");
  }
  if (cycle.student.artifactRevision) return cycle;
  const parsed = StudentArtifactSubmissionSchema.parse(submission);
  return withTimestamp(
    cycle,
    {
      student: {
        ...cycle.student,
        makerPath: parsed.makerPath,
        artifactDraft: parsed.artifactDraft,
        artifactCritique: parsed.artifactCritique,
        artifactRevision: parsed.artifactRevision,
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
  nextScaffoldLevel: ScaffoldLevel,
  now = new Date(),
): GrowthCycle {
  if (
    !cycle.student.revisedAnswer ||
    !cycle.student.explanationChoice ||
    !cycle.student.artifactRevision
  ) {
    throw new Error("Student evidence must be complete before review.");
  }
  if (cycle.teacherReview.status === "reviewed") return cycle;
  return withTimestamp(
    cycle,
    {
      teacherReview: {
        status: "reviewed",
        nextSupport,
        nextScaffoldLevel,
        familyBriefApproved: true,
      },
    },
    now,
  );
}

export function scaffoldLevelForNextCycle(cycle: GrowthCycle): ScaffoldLevel {
  return cycle.teacherReview.status === "reviewed" &&
    cycle.teacherReview.nextScaffoldLevel
    ? cycle.teacherReview.nextScaffoldLevel
    : cycle.plan.scaffoldLevel;
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

export const makerPathLabels: Record<MakerPath, string> = {
  fair_share_plan: "a fair-sharing plan",
  fraction_pattern: "a fraction pattern",
  teach_with_objects: "a mini lesson using objects",
};

export const artifactCritiqueLabels: Record<ArtifactCritique, string> = {
  evidence_missing: "The design needed stronger evidence.",
  whole_size_unclear: "The whole sizes were not clearly the same.",
  explanation_unclear: "The explanation needed to be clearer.",
  ready_to_test: "The design was ready to test with another example.",
};

export const scaffoldLevelLabels: Record<ScaffoldLevel, string> = {
  guided: "Guided: visual and thinking questions",
  light: "Light: one thinking question",
  independent: "Independent: student starts without AI support",
};
