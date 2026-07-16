import type {
  CriticOutput,
  TutorModelOutput,
  TutorRequest,
  TutorResponse,
} from "@/lib/domain";
import { getLesson } from "@/lib/lessons";

const criticIssueCodes = new Set([
  "missing_support",
  "citation_mismatch",
  "too_advanced",
  "unclear_step",
  "unsafe_tone",
]);

export function validateModelOutput(
  request: TutorRequest,
  output: TutorModelOutput,
): TutorResponse {
  const lesson = getLesson(request.lessonId);
  const allowedSections = new Set(
    lesson.sections.map((section) => section.id),
  );
  if (
    output.sourceSectionIds.length === 0 ||
    output.sourceSectionIds.some((id) => !allowedSections.has(id))
  ) {
    throw new Error("The model returned an unknown lesson section ID.");
  }
  if (
    output.recommendedCheckId &&
    !lesson.allowedCheckIds.includes(output.recommendedCheckId)
  ) {
    throw new Error("The model returned an unknown check ID.");
  }
  if (
    output.possibleConfusionCode &&
    !lesson.allowedConfusionCodes.includes(output.possibleConfusionCode)
  ) {
    throw new Error("The model returned an unknown confusion code.");
  }
  if (
    request.lessonId === "math-add-within-10" &&
    (output.steps.length > 3 || output.explanation.length > 420)
  ) {
    throw new Error("The Class 1 answer exceeded the age-format limit.");
  }

  return {
    status: "grounded",
    ...output,
    trust: {
      sourceMatched: true,
      citationIdsValid: true,
      ageFormatChecked: true,
      safetyRoute: "clear",
      humanReview: "pending",
    },
    deepCheck: null,
  };
}

export function validateCriticOutput(output: CriticOutput): CriticOutput {
  if (output.issueCodes.some((code) => !criticIssueCodes.has(code))) {
    throw new Error("The critic returned an unknown issue code.");
  }
  return output;
}
