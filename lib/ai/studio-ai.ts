import "server-only";

import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText, NoObjectGeneratedError, Output } from "ai";

import {
  evaluateGrowthAiCapability,
  evaluateStudentAiCapability,
  providerAllowlistForGrowthModel,
  type GrowthAiCapability,
} from "@/lib/ai/capability-policy";
import {
  type CurriculumSectionRecord,
} from "@/lib/curriculum/rag";
import {
  buildStudentThinkingContext,
  buildTeacherPlanningContext,
  STUDENT_HELP_PROMPT_VERSION,
  TEACHER_PLAN_PROMPT_VERSION,
} from "@/lib/ai/prompt-context";
import {
  StudentThinkingCoachSchema,
  TeacherPlanSchema,
  type StudentThinkingCoach,
  type TeacherPlan,
} from "@/lib/studio/contracts";
import {
  studentHelpCitationsAreValid,
  studentHelpIsSafe,
  teacherPlanCitationsAreValid,
  teacherPlanIsSafeForReview,
} from "@/lib/studio/grounding";

export { STUDENT_HELP_PROMPT_VERSION, TEACHER_PLAN_PROMPT_VERSION };

export type GroundedPlanResult = {
  status: "succeeded" | "rejected" | "provider_error" | "unavailable";
  plan: TeacherPlan | null;
  model: string;
  promptVersion: string;
  inputTokens: number | null;
  outputTokens: number | null;
  costMicros: number | null;
  latencyMs: number;
  citationIds: string[];
  errorCode: string | null;
};

export type GroundedStudentHelpResult = {
  status: "succeeded" | "rejected" | "provider_error" | "unavailable";
  help: StudentThinkingCoach | null;
  model: string;
  promptVersion: string;
  inputTokens: number | null;
  outputTokens: number | null;
  costMicros: number | null;
  latencyMs: number;
  citationIds: string[];
  errorCode: string | null;
};

export function getStudioAiCapability(): GrowthAiCapability {
  return evaluateGrowthAiCapability(process.env);
}

export function getStudentStudioAiCapability(): GrowthAiCapability {
  return evaluateStudentAiCapability(process.env);
}

function modelFor(capability: GrowthAiCapability) {
  const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
    compatibility: "strict",
    appName: "Kanni",
    appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001",
  });
  return openrouter(capability.model, {
    usage: { include: true },
    extraBody: {
      store: false,
      provider: {
        only: providerAllowlistForGrowthModel(),
        data_collection: "deny",
        require_parameters: true,
        allow_fallbacks: false,
      },
      reasoning: { effort: "low", exclude: true },
    },
  });
}

function providerCostMicros(metadata: unknown): number | null {
  if (!metadata || typeof metadata !== "object") return null;
  const openrouter = (metadata as Record<string, unknown>).openrouter;
  if (!openrouter || typeof openrouter !== "object") return null;
  const usage = (openrouter as Record<string, unknown>).usage;
  if (!usage || typeof usage !== "object") return null;
  const cost = (usage as Record<string, unknown>).cost;
  return typeof cost === "number" && Number.isFinite(cost)
    ? Math.max(0, Math.round(cost * 1_000_000))
    : null;
}

function providerErrorCode(error: unknown): string {
  if (!error || typeof error !== "object") return "provider_error";
  const record = error as Record<string, unknown>;
  const status = record.statusCode ?? record.status;
  if (typeof status === "number" && status >= 400 && status <= 599) {
    return `http_${status}`;
  }
  const name = record.name;
  if (name === "AbortError" || name === "TimeoutError") return "timeout";
  return "provider_error";
}

function unavailableResult(capability: GrowthAiCapability): GroundedPlanResult {
  return {
    status: "unavailable",
    plan: null,
    model: capability.model,
    promptVersion: TEACHER_PLAN_PROMPT_VERSION,
    inputTokens: null,
    outputTokens: null,
    costMicros: null,
    latencyMs: 0,
    citationIds: [],
    errorCode: capability.reason,
  };
}

export async function generateGroundedTeacherPlan(input: {
  title: string;
  subject: string;
  gradeLabel: string;
  goal: string;
  drivingQuestion: string;
  familyLocale: "en" | "ml";
  sections: readonly CurriculumSectionRecord[];
}): Promise<GroundedPlanResult> {
  const capability = getStudioAiCapability();
  if (!capability.available) return unavailableResult(capability);

  const context = buildTeacherPlanningContext(input);
  const retrieved = context.retrieved;
  if (retrieved.length === 0) {
    return {
      ...unavailableResult(capability),
      status: "rejected",
      errorCode: "no_relevant_source",
    };
  }

  const startedAt = Date.now();
  try {
    const result = await generateText({
      model: modelFor(capability),
      instructions: context.instructions,
      prompt: context.prompt,
      output: Output.object({ schema: TeacherPlanSchema }),
      maxOutputTokens: 3_200,
      maxRetries: 0,
      abortSignal: AbortSignal.timeout(40_000),
    });
    const latencyMs = Date.now() - startedAt;
    if (!teacherPlanCitationsAreValid(result.output, retrieved)) {
      return {
        status: "rejected",
        plan: null,
        model: capability.model,
        promptVersion: TEACHER_PLAN_PROMPT_VERSION,
        inputTokens: result.usage.inputTokens ?? null,
        outputTokens: result.usage.outputTokens ?? null,
        costMicros: providerCostMicros(result.providerMetadata),
        latencyMs,
        citationIds: [],
        errorCode: "citation_rejected",
      };
    }
    if (!teacherPlanIsSafeForReview(result.output)) {
      return {
        status: "rejected",
        plan: null,
        model: capability.model,
        promptVersion: TEACHER_PLAN_PROMPT_VERSION,
        inputTokens: result.usage.inputTokens ?? null,
        outputTokens: result.usage.outputTokens ?? null,
        costMicros: providerCostMicros(result.providerMetadata),
        latencyMs,
        citationIds: [],
        errorCode: "output_safety_rejected",
      };
    }
    return {
      status: "succeeded",
      plan: result.output,
      model: capability.model,
      promptVersion: TEACHER_PLAN_PROMPT_VERSION,
      inputTokens: result.usage.inputTokens ?? null,
      outputTokens: result.usage.outputTokens ?? null,
      costMicros: providerCostMicros(result.providerMetadata),
      latencyMs,
      citationIds: result.output.sourceSectionIds,
      errorCode: null,
    };
  } catch (error: unknown) {
    const latencyMs = Date.now() - startedAt;
    if (NoObjectGeneratedError.isInstance(error)) {
      const errorCode =
        error.finishReason === "length"
          ? "structured_output_truncated"
          : "structured_output_invalid";
      console.error(`Kanni teacher-plan output was rejected (${errorCode}).`);
      return {
        status: "rejected",
        plan: null,
        model: capability.model,
        promptVersion: TEACHER_PLAN_PROMPT_VERSION,
        inputTokens: error.usage?.inputTokens ?? null,
        outputTokens: error.usage?.outputTokens ?? null,
        costMicros: null,
        latencyMs,
        citationIds: [],
        errorCode,
      };
    }
    const errorCode = providerErrorCode(error);
    console.error(`Kanni teacher-plan provider request failed (${errorCode}).`);
    return {
      status: "provider_error",
      plan: null,
      model: capability.model,
      promptVersion: TEACHER_PLAN_PROMPT_VERSION,
      inputTokens: null,
      outputTokens: null,
      costMicros: null,
      latencyMs,
      citationIds: [],
      errorCode,
    };
  }
}

function unavailableStudentHelpResult(
  capability: GrowthAiCapability,
): GroundedStudentHelpResult {
  return {
    status: "unavailable",
    help: null,
    model: capability.model,
    promptVersion: STUDENT_HELP_PROMPT_VERSION,
    inputTokens: null,
    outputTokens: null,
    costMicros: null,
    latencyMs: 0,
    citationIds: [],
    errorCode: capability.reason,
  };
}

export async function generateGroundedStudentHelp(input: {
  subject: string;
  gradeLabel: string;
  goal: string;
  drivingQuestion: string;
  firstDraft: string;
  sections: readonly CurriculumSectionRecord[];
}): Promise<GroundedStudentHelpResult> {
  const capability = getStudentStudioAiCapability();
  if (!capability.available) return unavailableStudentHelpResult(capability);

  const context = buildStudentThinkingContext(input);
  if (context.retrieved.length === 0) {
    return {
      ...unavailableStudentHelpResult(capability),
      status: "rejected",
      errorCode: "no_relevant_source",
    };
  }

  const startedAt = Date.now();
  try {
    const result = await generateText({
      model: modelFor(capability),
      instructions: context.instructions,
      prompt: context.prompt,
      output: Output.object({ schema: StudentThinkingCoachSchema }),
      maxOutputTokens: 900,
      maxRetries: 0,
      abortSignal: AbortSignal.timeout(20_000),
    });
    const latencyMs = Date.now() - startedAt;
    if (!studentHelpCitationsAreValid(result.output, context.retrieved)) {
      return {
        status: "rejected",
        help: null,
        model: capability.model,
        promptVersion: STUDENT_HELP_PROMPT_VERSION,
        inputTokens: result.usage.inputTokens ?? null,
        outputTokens: result.usage.outputTokens ?? null,
        costMicros: providerCostMicros(result.providerMetadata),
        latencyMs,
        citationIds: [],
        errorCode: "citation_rejected",
      };
    }
    if (!studentHelpIsSafe(result.output)) {
      return {
        status: "rejected",
        help: null,
        model: capability.model,
        promptVersion: STUDENT_HELP_PROMPT_VERSION,
        inputTokens: result.usage.inputTokens ?? null,
        outputTokens: result.usage.outputTokens ?? null,
        costMicros: providerCostMicros(result.providerMetadata),
        latencyMs,
        citationIds: [],
        errorCode: "output_safety_rejected",
      };
    }
    return {
      status: "succeeded",
      help: result.output,
      model: capability.model,
      promptVersion: STUDENT_HELP_PROMPT_VERSION,
      inputTokens: result.usage.inputTokens ?? null,
      outputTokens: result.usage.outputTokens ?? null,
      costMicros: providerCostMicros(result.providerMetadata),
      latencyMs,
      citationIds: result.output.sourceSectionIds,
      errorCode: null,
    };
  } catch (error: unknown) {
    const latencyMs = Date.now() - startedAt;
    if (NoObjectGeneratedError.isInstance(error)) {
      return {
        status: "rejected",
        help: null,
        model: capability.model,
        promptVersion: STUDENT_HELP_PROMPT_VERSION,
        inputTokens: error.usage?.inputTokens ?? null,
        outputTokens: error.usage?.outputTokens ?? null,
        costMicros: null,
        latencyMs,
        citationIds: [],
        errorCode:
          error.finishReason === "length"
            ? "structured_output_truncated"
            : "structured_output_invalid",
      };
    }
    return {
      status: "provider_error",
      help: null,
      model: capability.model,
      promptVersion: STUDENT_HELP_PROMPT_VERSION,
      inputTokens: null,
      outputTokens: null,
      costMicros: null,
      latencyMs,
      citationIds: [],
      errorCode: providerErrorCode(error),
    };
  }
}
