import "server-only";

import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText, Output } from "ai";

import {
  PROJECT_AUTHORED_PLAN,
  PROJECT_AUTHORED_SUPPORTS,
  StudentSupportDraftSchema,
  TeacherPlanDraftSchema,
  type StudentSupportDraft,
  type SupportStrategy,
  type TeacherPlanDraft,
} from "@/lib/growth-cycle";

const DEFAULT_MODEL = "openai/gpt-5.6-sol";

export type GrowthAiCapability = {
  available: boolean;
  provider: "openrouter" | "disabled";
  model: string;
  reason:
    | "available"
    | "disabled_by_flag"
    | "provider_disabled"
    | "missing_credentials"
    | "model_not_allowed"
    | "release_controls_missing";
};

export function getGrowthAiCapability(): GrowthAiCapability {
  const model = process.env.GROWTH_AI_MODEL?.trim() || DEFAULT_MODEL;
  if (process.env.AI_DEMO_ENABLED !== "true") {
    return {
      available: false,
      provider: "disabled",
      model,
      reason: "disabled_by_flag",
    };
  }
  if ((process.env.GROWTH_AI_PROVIDER?.trim() || "disabled") !== "openrouter") {
    return {
      available: false,
      provider: "disabled",
      model,
      reason: "provider_disabled",
    };
  }
  if (model !== DEFAULT_MODEL) {
    return {
      available: false,
      provider: "openrouter",
      model,
      reason: "model_not_allowed",
    };
  }
  if (!process.env.OPENROUTER_API_KEY?.trim()) {
    return {
      available: false,
      provider: "openrouter",
      model,
      reason: "missing_credentials",
    };
  }
  if (
    process.env.NODE_ENV === "production" &&
    (process.env.GROWTH_AI_RATE_LIMIT_CONFIRMED !== "true" ||
      process.env.GROWTH_AI_SPEND_LIMIT_CONFIRMED !== "true")
  ) {
    return {
      available: false,
      provider: "openrouter",
      model,
      reason: "release_controls_missing",
    };
  }
  return { available: true, provider: "openrouter", model, reason: "available" };
}

function createGrowthModel() {
  const capability = getGrowthAiCapability();
  if (!capability.available) return null;
  const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
    compatibility: "strict",
    appName: "Kanni",
    appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  });
  return openrouter(capability.model, {
    extraBody: {
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

const lessonContext = `
Approved Kanni content v2.0
[fractions-goal] When the whole is the same size, one half is larger than one quarter. A half is one of two equal parts. A quarter is one of four equal parts.
[fractions-visual] Compare two equal paper strips. Divide one into two equal parts and the other into four equal parts. One of two equal parts takes more space than one of four equal parts.
[fractions-misconceptions] Allowed misconception IDs: denominator_size, whole_size, compare_digits.
[fractions-home] Use two equal sheets. Fold one into two equal parts and the other into four equal parts. Compare one part from each sheet. Stop if the learner does not want to continue.
`;

export async function generateTeacherPlanDraft(): Promise<{
  draft: TeacherPlanDraft;
  origin: "project_authored" | "gpt_5_6";
}> {
  const model = createGrowthModel();
  if (!model) return { draft: PROJECT_AUTHORED_PLAN, origin: "project_authored" };

  try {
    const result = await generateText({
      model,
      prompt: `You are drafting a teacher-reviewed learning plan for a synthetic adult-operated education demo. Use only the approved context. Do not diagnose, rank, grade, infer ability, or add facts. Keep every sentence short. Return only allowed source and misconception IDs.\n${lessonContext}`,
      output: Output.object({ schema: TeacherPlanDraftSchema }),
      temperature: 0.1,
      maxOutputTokens: 600,
      maxRetries: 0,
      abortSignal: AbortSignal.timeout(18_000),
    });
    return { draft: result.output, origin: "gpt_5_6" };
  } catch {
    return { draft: PROJECT_AUTHORED_PLAN, origin: "project_authored" };
  }
}

export async function generateStudentSupportDraft(
  strategy: SupportStrategy = "fraction_strips",
): Promise<{
  support: StudentSupportDraft;
  origin: "project_authored" | "gpt_5_6";
}> {
  const model = createGrowthModel();
  if (!model) {
    return {
      support: PROJECT_AUTHORED_SUPPORTS[strategy],
      origin: "project_authored",
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

  try {
    const result = await generateText({
      model,
      prompt: `Give one short support after the learner selected one quarter instead of one half. ${strategyInstruction[strategy]} Use only the approved context. Do not reveal a final answer as a command. Do not diagnose or infer ability. Return only allowed source IDs.\n${lessonContext}`,
      output: Output.object({ schema: StudentSupportDraftSchema }),
      temperature: 0.1,
      maxOutputTokens: 300,
      maxRetries: 0,
      abortSignal: AbortSignal.timeout(18_000),
    });
    if (!isGroundedStudentSupport(result.output, strategy)) {
      return {
        support: PROJECT_AUTHORED_SUPPORTS[strategy],
        origin: "project_authored",
      };
    }
    return { support: result.output, origin: "gpt_5_6" };
  } catch {
    return {
      support: PROJECT_AUTHORED_SUPPORTS[strategy],
      origin: "project_authored",
    };
  }
}

function isGroundedStudentSupport(
  support: StudentSupportDraft,
  strategy: SupportStrategy,
): boolean {
  const text = support.explanation.normalize("NFC").toLocaleLowerCase("en");
  if (
    /https?:|www\.|@|password|secret|contact|phone|diagnos|grade|rank|career|medicine|self-harm|abuse|violence/.test(
      text,
    )
  ) {
    return false;
  }
  if (!/half/.test(text) || !/quarter/.test(text)) return false;
  if (strategy === "fraction_strips") {
    return /equal/.test(text) && /(?:\b2\b|two)/.test(text) && /(?:\b4\b|four)/.test(text);
  }
  if (strategy === "guided_questions") {
    return /equal/.test(text) && text.includes("?");
  }
  return /explain|show|teach/.test(text);
}
