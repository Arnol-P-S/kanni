import "server-only";

import { generateText, Output } from "ai";

import { buildCriticPrompt, buildTutorPrompt } from "@/lib/ai/prompt";
import type {
  CriticKind,
  TutorModelAdapter,
} from "@/lib/ai/model-adapter";
import {
  CriticOutputSchema,
  TutorModelOutputSchema,
  type CriticOutput,
  type TutorModelOutput,
  type TutorRequest,
  type TutorResponse,
} from "@/lib/domain";

const PRIMARY_MODEL =
  process.env.AI_PRIMARY_MODEL || "openai/gpt-5.6-sol";
const CRITIC_MODEL =
  process.env.AI_CRITIC_MODEL || "openai/gpt-5.6-luna";

export class VercelGatewayTutorAdapter implements TutorModelAdapter {
  readonly providerId = "vercel_gateway";

  async generateTutorOutput(
    request: TutorRequest,
  ): Promise<TutorModelOutput> {
    const result = await generateText({
      model: PRIMARY_MODEL,
      prompt: buildTutorPrompt(request),
      output: Output.object({ schema: TutorModelOutputSchema }),
      maxOutputTokens: 600,
      maxRetries: 0,
      abortSignal: AbortSignal.timeout(18_000),
      providerOptions: {
        gateway: { disallowPromptTraining: true },
        openai: { store: false, reasoningEffort: "low" },
      },
    });
    return result.output;
  }

  async runCritic(
    kind: CriticKind,
    request: TutorRequest,
    answer: TutorResponse,
  ): Promise<CriticOutput> {
    const result = await generateText({
      model: CRITIC_MODEL,
      prompt: buildCriticPrompt(kind, request, {
        explanation: answer.explanation,
        steps: answer.steps,
        sourceSectionIds: answer.sourceSectionIds,
      }),
      output: Output.object({ schema: CriticOutputSchema }),
      maxOutputTokens: 200,
      maxRetries: 0,
      abortSignal: AbortSignal.timeout(8_000),
      providerOptions: {
        gateway: { disallowPromptTraining: true },
        openai: { store: false, reasoningEffort: "low" },
      },
    });
    return result.output;
  }
}
