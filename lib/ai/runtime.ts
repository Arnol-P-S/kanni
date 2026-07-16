import "server-only";

import { generateText, Output } from "ai";

import {
  CriticOutputSchema,
  TutorModelOutputSchema,
  type CriticOutput,
  type TutorRequest,
  type TutorResponse,
} from "@/lib/domain";
import { buildCriticPrompt, buildTutorPrompt } from "@/lib/ai/prompt";
import {
  validateCriticOutput,
  validateModelOutput,
} from "@/lib/ai/validation";

const PRIMARY_MODEL =
  process.env.AI_PRIMARY_MODEL || "openai/gpt-5.6-sol";
const CRITIC_MODEL =
  process.env.AI_CRITIC_MODEL || "openai/gpt-5.6-luna";

async function runCritic(
  kind: "source" | "teaching",
  request: TutorRequest,
  answer: TutorResponse,
): Promise<CriticOutput> {
  const result = await generateText({
    model: CRITIC_MODEL,
    prompt: buildCriticPrompt(
      kind,
      request,
      JSON.stringify({
        explanation: answer.explanation,
        steps: answer.steps,
        sourceSectionIds: answer.sourceSectionIds,
      }),
    ),
    output: Output.object({ schema: CriticOutputSchema }),
    maxOutputTokens: 200,
    maxRetries: 0,
    abortSignal: AbortSignal.timeout(8_000),
    providerOptions: {
      openai: { store: false, reasoningEffort: "low" },
    },
  });
  return validateCriticOutput(result.output);
}

export async function generateTutorResponse(
  request: TutorRequest,
): Promise<TutorResponse> {
  const result = await generateText({
    model: PRIMARY_MODEL,
    prompt: buildTutorPrompt(request),
    output: Output.object({ schema: TutorModelOutputSchema }),
    maxOutputTokens: 600,
    maxRetries: 0,
    abortSignal: AbortSignal.timeout(18_000),
    providerOptions: {
      openai: { store: false, reasoningEffort: "low" },
    },
  });
  const answer = validateModelOutput(request, result.output);

  if (!request.deepCheck) return answer;

  const [sourceResult, teachingResult] = await Promise.allSettled([
    runCritic("source", request, answer),
    runCritic("teaching", request, answer),
  ]);
  const sourceCritic =
    sourceResult.status === "fulfilled"
      ? sourceResult.value.result
      : "unavailable";
  const teachingCritic =
    teachingResult.status === "fulfilled"
      ? teachingResult.value.result
      : "unavailable";
  const issueCodes = [
    ...(sourceResult.status === "fulfilled"
      ? sourceResult.value.issueCodes
      : []),
    ...(teachingResult.status === "fulfilled"
      ? teachingResult.value.issueCodes
      : []),
  ];

  return {
    ...answer,
    deepCheck: { sourceCritic, teachingCritic, issueCodes },
  };
}
