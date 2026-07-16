import "server-only";

import { getConfiguredTutorAdapter } from "@/lib/ai/adapter-factory";
import type { TutorRequest, TutorResponse } from "@/lib/domain";
import {
  validateCriticOutput,
  validateModelOutput,
} from "@/lib/ai/validation";

export async function generateTutorResponse(
  request: TutorRequest,
): Promise<TutorResponse> {
  const selectedAdapter = getConfiguredTutorAdapter();
  const answer = validateModelOutput(
    request,
    await selectedAdapter.generateTutorOutput(request),
  );

  if (!request.deepCheck) return answer;
  if (process.env.AI_DEEP_CHECK_ENABLED !== "true") {
    return {
      ...answer,
      deepCheck: {
        sourceCritic: "unavailable",
        teachingCritic: "unavailable",
        issueCodes: [],
      },
    };
  }

  const [sourceResult, teachingResult] = await Promise.allSettled([
    selectedAdapter
      .runCritic("source", request, answer)
      .then((output) => validateCriticOutput("source", output)),
    selectedAdapter
      .runCritic("teaching", request, answer)
      .then((output) => validateCriticOutput("teaching", output)),
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
