import "server-only";

import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText, Output } from "ai";

import {
  PROJECT_AUTHORED_PLAN,
  PROJECT_AUTHORED_SUPPORTS,
  StudentSupportDraftSchema,
  TeacherPlanDraftSchema,
  getProjectAuthoredSupport,
  type StudentSupportDraft,
  type SupportStrategy,
  type TeacherPlanDraft,
} from "@/lib/growth-cycle";
import {
  citationsMatchRetrievedSections,
  formatCurriculumContext,
  retrieveCurriculumSections,
  type CurriculumSection,
} from "@/lib/curriculum/fractions-foundation";
import {
  evaluateGrowthAiCapability,
  type GrowthAiCapability,
} from "@/lib/ai/capability-policy";

export type { GrowthAiCapability } from "@/lib/ai/capability-policy";

export type GrowthAiFallbackReason =
  | "disabled"
  | "provider_error"
  | "output_rejected"
  | null;

export function getGrowthAiCapability(): GrowthAiCapability {
  return evaluateGrowthAiCapability(process.env);
}

function createGrowthModel(maxCompletionTokens: 300 | 600) {
  const capability = getGrowthAiCapability();
  if (!capability.available) return null;
  const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
    compatibility: "strict",
    appName: "Kanni",
    appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001",
  });
  return openrouter(capability.model, {
    extraBody: {
      max_tokens: undefined,
      max_completion_tokens: maxCompletionTokens,
      provider: {
        only: ["azure"],
        zdr: true,
        data_collection: "deny",
        require_parameters: true,
        allow_fallbacks: false,
      },
      reasoning: { effort: "low", exclude: true },
    },
  });
}

export async function generateTeacherPlanDraft(
  familyLanguage: "en" | "ml" = "ml",
): Promise<{
  draft: TeacherPlanDraft;
  origin: "project_authored" | "gpt_5_6";
  fallbackReason: GrowthAiFallbackReason;
}> {
  const model = createGrowthModel(600);
  if (!model) {
    return {
      draft: PROJECT_AUTHORED_PLAN,
      origin: "project_authored",
      fallbackReason: "disabled",
    };
  }
  const retrieved = retrieveCurriculumSections(
    "plan a fractions lesson with success criteria, learning sequence, misconceptions, quick check, family activity, and learner agency",
    4,
  );
  const lessonContext = formatCurriculumContext(retrieved);

  try {
    const result = await generateText({
      model,
      prompt: `You are drafting a teacher-reviewed learning plan inside a school learning platform. Use only the retrieved Kanni curriculum sections below. Do not diagnose, rank, grade, infer ability, or add facts. Keep every sentence short. The agencyMove must require the learner to predict, inspect evidence, and explain rather than receive the answer. Write familyDraft in ${familyLanguage === "ml" ? "simple Malayalam" : "simple English"}. Return only source IDs that appear in the retrieved context and only these misconception IDs: denominator_size, whole_size, compare_digits.\n\nRetrieved context:\n${lessonContext}`,
      output: Output.object({ schema: TeacherPlanDraftSchema }),
      maxRetries: 0,
      abortSignal: AbortSignal.timeout(18_000),
    });
    if (!isGroundedTeacherPlan(result.output, retrieved)) {
      return {
        draft: PROJECT_AUTHORED_PLAN,
        origin: "project_authored",
        fallbackReason: "output_rejected",
      };
    }
    return {
      draft: result.output,
      origin: "gpt_5_6",
      fallbackReason: null,
    };
  } catch (error: unknown) {
    reportProviderError("teacher_plan", error);
    return {
      draft: PROJECT_AUTHORED_PLAN,
      origin: "project_authored",
      fallbackReason: "provider_error",
    };
  }
}

export async function generateStudentSupportDraft(
  strategy: SupportStrategy = "fraction_strips",
  language: "en" | "ml" = "en",
): Promise<{
  support: StudentSupportDraft;
  origin: "project_authored" | "gpt_5_6";
  fallbackReason: GrowthAiFallbackReason;
}> {
  const model = createGrowthModel(600);
  if (!model) {
    return {
      support: getReviewedSupport(strategy, language),
      origin: "project_authored",
      fallbackReason: "disabled",
    };
  }

  const strategyInstruction: Record<SupportStrategy, string> = {
    fraction_strips:
      "Use two equal paper strips split into two and four equal parts.",
    guided_questions:
      "Ask short questions about equal wholes, the number of equal parts, and the space taken by one part.",
    explain_to_someone:
      "Ask the learner to show and explain one half and one quarter to another person.",
  };
  const retrieved = retrieveCurriculumSections(
    `${strategyInstruction[strategy]} fractions equal wholes half quarter visual comparison guided questions`,
    2,
  );
  const lessonContext = formatCurriculumContext(retrieved);

  try {
    const result = await generateText({
      model,
      prompt: `Create one short Socratic scaffold after a learner's first attempt. ${strategyInstruction[strategy]} Write in ${language === "ml" ? "simple Malayalam" : "simple English"}. Use only the retrieved Kanni curriculum sections below. Explicitly compare one of two equal parts with one of four equal parts, but never say which is larger. Ask two or three observable questions before the learner tries again. Never state which option to choose, solve the task, praise ability, diagnose, rank, grade, or infer ability. The handoffPrompt must return control to the learner. Return only source IDs that appear in the retrieved context.\n\nRetrieved context:\n${lessonContext}`,
      output: Output.object({ schema: StudentSupportDraftSchema }),
      maxRetries: 0,
      abortSignal: AbortSignal.timeout(18_000),
    });
    const outputIssue = studentSupportIssue(
      result.output,
      strategy,
      retrieved,
    );
    if (outputIssue) {
      reportOutputRejection("student_support", outputIssue);
      return {
        support: getReviewedSupport(strategy, language),
        origin: "project_authored",
        fallbackReason: "output_rejected",
      };
    }
    return {
      support: result.output,
      origin: "gpt_5_6",
      fallbackReason: null,
    };
  } catch (error: unknown) {
    reportProviderError("student_support", error);
    return {
      support: getReviewedSupport(strategy, language),
      origin: "project_authored",
      fallbackReason: "provider_error",
    };
  }
}

function getReviewedSupport(
  strategy: SupportStrategy,
  language: "en" | "ml",
): StudentSupportDraft {
  return language === "en"
    ? PROJECT_AUTHORED_SUPPORTS[strategy]
    : getProjectAuthoredSupport(strategy, language);
}

function isGroundedTeacherPlan(
  draft: TeacherPlanDraft,
  retrieved: readonly CurriculumSection[],
): boolean {
  if (!citationsMatchRetrievedSections(draft.sourceSectionIds, retrieved)) {
    return false;
  }
  const text = [
    ...draft.successCriteria,
    ...draft.learningSequence,
    draft.quickCheck,
    draft.familyDraft,
    draft.agencyMove,
  ]
    .join(" ")
    .normalize("NFC")
    .toLocaleLowerCase("en");
  if (hasUnsafeContent(text)) return false;
  const agencyMove = draft.agencyMove
    .normalize("NFC")
    .toLocaleLowerCase("en");
  return (
    /ask|ചോദി/.test(agencyMove) &&
    /predict|പ്രവചി/.test(agencyMove) &&
    /explain|വിശദീകരി/.test(agencyMove)
  );
}

function studentSupportIssue(
  support: StudentSupportDraft,
  strategy: SupportStrategy,
  retrieved: readonly CurriculumSection[],
): string | null {
  if (!Array.isArray(support.thinkingPrompts)) return "prompts_missing";
  if (!citationsMatchRetrievedSections(support.sourceSectionIds, retrieved)) {
    return "citation_not_retrieved";
  }
  const text = [
    support.explanation,
    ...support.thinkingPrompts,
    support.handoffPrompt,
  ]
    .join(" ")
    .normalize("NFC")
    .toLocaleLowerCase("en");
  if (hasUnsafeContent(text)) return "unsafe_content";
  if (support.thinkingPrompts.some((prompt) => !prompt.trim().endsWith("?"))) {
    return "prompt_not_question";
  }
  if (/answer is|choose (?:one half|1\/2)|select (?:one half|1\/2)|ഉത്തരം[^.]{0,30}പകുതി/.test(text)) {
    return "final_choice_revealed";
  }
  const hasPartLanguage = /part|ഭാഗ/.test(text);
  const hasHalfEvidence =
    /half|1\/2|പകുതി|അര|രണ്ടിലൊന്ന്/.test(text) ||
    (hasPartLanguage && /(?:\b2\b|two|രണ്ട്)/.test(text));
  const hasQuarterEvidence =
    /quarter|1\/4|കാൽ|നാലിലൊന്ന്/.test(text) ||
    (hasPartLanguage && /(?:\b4\b|four|നാല്)/.test(text));
  if (!hasHalfEvidence) return "half_reference_missing";
  if (!hasQuarterEvidence) {
    return "quarter_reference_missing";
  }
  if (strategy === "fraction_strips") {
    return /equal|തുല്യ|ഒരേ|സമാന/.test(text) &&
      /(?:\b2\b|two|രണ്ട്)/.test(text) &&
      /(?:\b4\b|four|നാല്)/.test(text)
      ? null
      : "fraction_strip_evidence_missing";
  }
  if (strategy === "guided_questions") {
    return /equal|തുല്യ|ഒരേ|സമാന/.test(text) && text.includes("?")
      ? null
      : "guided_question_evidence_missing";
  }
  return /explain|show|teach|വിശദീകരി|കാണിക്ക/.test(text)
    ? null
    : "explanation_handoff_missing";
}

function hasUnsafeContent(text: string): boolean {
  return /https?:|www\.|@|password|secret|contact|phone|diagnos|grade|rank|career|medicine|self-harm|abuse|violence/.test(
    text,
  );
}

function reportProviderError(operation: string, error: unknown): void {
  if (process.env.GROWTH_AI_DIAGNOSTICS !== "true") return;
  const candidate = error as {
    name?: unknown;
    message?: unknown;
    statusCode?: unknown;
  };
  const name = typeof candidate?.name === "string" ? candidate.name : "Error";
  const status =
    typeof candidate?.statusCode === "number"
      ? String(candidate.statusCode)
      : "unknown";
  const rawMessage =
    typeof candidate?.message === "string" ? candidate.message : "No message";
  const safeMessage = rawMessage
    .split(/request body|authorization|bearer/i, 1)[0]
    .replace(/sk-or-[A-Za-z0-9_-]+/g, "[redacted]")
    .slice(0, 320);
  console.error(
    `Growth AI ${operation} failed: ${name}; status=${status}; ${safeMessage}`,
  );
}

function reportOutputRejection(operation: string, issue: string): void {
  if (process.env.GROWTH_AI_DIAGNOSTICS !== "true") return;
  console.error(`Growth AI ${operation} output rejected: ${issue}`);
}
